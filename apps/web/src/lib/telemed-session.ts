/**
 * Dependency-free telemedicine session: presence + chat + WebRTC signaling all
 * travel over the appointment's `telemedicine_signals` table via short polling
 * (~1.5s). The patient side is the offerer; the provider answers. A data
 * channel keeps the connection verifiable even without camera/mic — media is
 * opportunistic (graceful fallback to chat-only when unavailable).
 *
 * Works with either API client (staff apiClient or patient portalClient) —
 * callers pass the client + base path (e.g. '/telemedicine/rooms/<id>' or
 * '/portal/rooms/<id>').
 */

export type TelemedApi = {
  get(url: string): Promise<any>;
  post(url: string, data?: any): Promise<any>;
};

export type TelemedRole = 'patient' | 'provider';

export interface TelemedChatMessage {
  id: string;
  sender: TelemedRole;
  text: string;
  at: string;
}

export interface TelemedSessionCallbacks {
  /** Presence/phase changed (derived from join/leave signals). */
  onPresence?: (patientPresent: boolean, providerPresent: boolean, phase: string) => void;
  /** Room chat message (deduped by server id, includes your own). */
  onChat?: (msg: TelemedChatMessage) => void;
  /** RTCPeerConnection.connectionState. */
  onConnection?: (state: string) => void;
  onLocalStream?: (stream: MediaStream | null) => void;
  onRemoteStream?: (stream: MediaStream | null) => void;
  /** Human-readable notices (media fallback, send errors…). */
  onNotice?: (text: string) => void;
}

const POLL_MS = 1500;
const MEDIA_TIMEOUT_MS = 8000;
const CHAT_MAX = 2000;
const LEAVE_GRACE_MS = 500;

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Leaves are scheduled with a grace period instead of sent immediately, and a
 * quick remount (React StrictMode in dev, or Leave → instantly re-open) cancels
 * the pending leave. Without this, a join/leave/join burst can race the server's
 * presence check and strand the sender as "left".
 */
const pendingLeaves = new Map<string, ReturnType<typeof setTimeout>>();

export class TelemedSession {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private seq = 0;
  private started = false;
  private stopped = false;
  private offered = false;
  private left = false;
  private lastBySender: Record<string, string> = {};
  private localStream: MediaStream | null = null;
  private pendingIce: RTCIceCandidateInit[] = [];
  private seenIds = new Set<string>();

  constructor(
    private api: TelemedApi,
    private basePath: string,
    private role: TelemedRole,
    private cb: TelemedSessionCallbacks,
  ) {}

  async start(): Promise<void> {
    if (this.started || this.stopped) return;
    this.started = true;
    this.left = false;
    // Cancel a leave scheduled by a previous session for this same room
    // (StrictMode remount / leave-then-rejoin) — we are joining again.
    const pending = pendingLeaves.get(this.basePath);
    if (pending) {
      clearTimeout(pending);
      pendingLeaves.delete(this.basePath);
    }
    this.ensurePc();

    // Join immediately; the camera/mic permission prompt runs in parallel
    // (bounded by a timeout so a pending prompt never blocks the room).
    const join = this.api.post(`${this.basePath}/join`, {}).catch(() => undefined);
    await Promise.race([this.setupLocalMedia(), delay(MEDIA_TIMEOUT_MS)]);
    await join;
    if (this.stopped) return;

    await this.pollOnce();
    if (this.stopped) return;
    this.pollTimer = setInterval(() => void this.pollOnce(), POLL_MS);
  }

  async stop(): Promise<void> {
    if (this.stopped) return;
    this.stopped = true;
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = null;
    if (!this.left) {
      this.left = true;
      // Delayed, cancellable leave — see pendingLeaves doc comment.
      const path = this.basePath;
      const api = this.api;
      const timer = setTimeout(() => {
        pendingLeaves.delete(path);
        void api.post(`${path}/leave`, {}).catch(() => undefined);
      }, LEAVE_GRACE_MS);
      pendingLeaves.set(path, timer);
    }
    this.localStream?.getTracks().forEach((t) => t.stop());
    this.localStream = null;
    try {
      this.dc?.close();
    } catch {
      /* already closed */
    }
    try {
      this.pc?.close();
    } catch {
      /* already closed */
    }
    this.dc = null;
    this.pc = null;
  }

  async sendChat(text: string): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (trimmed.length > CHAT_MAX) {
      this.cb.onNotice?.(`Message too long (max ${CHAT_MAX} characters)`);
      return;
    }
    try {
      // Chat always travels over the signals table (persistent history,
      // works even before/without P2P connectivity).
      await this.api.post(`${this.basePath}/signals`, { kind: 'chat', payload: trimmed });
    } catch (e: any) {
      this.cb.onNotice?.(e?.errors?.[0]?.message ?? e?.message ?? 'Message failed to send');
    }
  }

  // ─── POLLING / SIGNAL HANDLING ─────────────────────────────────────────────

  private async pollOnce(): Promise<void> {
    if (this.stopped) return;
    try {
      const res = await this.api.get(`${this.basePath}/signals?after=${this.seq}`);
      const page = res?.data ?? res ?? {};
      const signals: any[] = page.signals ?? [];
      for (const s of signals) {
        if (this.stopped) return;
        this.seq = Number(s.seq);
        await this.applySignal(s);
      }
      // Offer decision runs AFTER the whole batch so replaying history never
      // fires an offer against a provider whose later 'leave' signal is also
      // in the batch (final presence wins, not per-signal edges).
      if (
        signals.length > 0 &&
        this.role === 'patient' &&
        !this.offered &&
        !this.stopped &&
        this.lastBySender['provider'] === 'join'
      ) {
        void this.maybeMakeOffer();
      }
    } catch {
      /* transient — next tick retries */
    }
  }

  private async applySignal(s: any): Promise<void> {
    if (this.seenIds.has(s.id)) return;
    this.seenIds.add(s.id);

    if (s.kind === 'join' || s.kind === 'leave') {
      this.lastBySender[s.sender] = s.kind;
      this.emitPresence();
      return;
    }

    if (s.kind === 'chat') {
      this.cb.onChat?.({
        id: s.id,
        sender: s.sender,
        text: String(s.payload ?? ''),
        at: s.createdAt,
      });
      return;
    }

    // WebRTC signaling is always from the OTHER side (skip our own echoes).
    if (s.sender === this.role) return;
    if (s.kind === 'offer') await this.handleOffer(String(s.payload ?? ''));
    else if (s.kind === 'answer') await this.handleAnswer(String(s.payload ?? ''));
    else if (s.kind === 'ice') await this.handleIce(String(s.payload ?? ''));
  }

  private emitPresence(): void {
    const patientPresent = this.lastBySender['patient'] === 'join';
    const providerPresent = this.lastBySender['provider'] === 'join';
    const phase =
      patientPresent && providerPresent
        ? 'connected'
        : patientPresent
          ? 'waiting'
          : providerPresent
            ? 'provider_waiting'
            : 'not_started';
    this.cb.onPresence?.(patientPresent, providerPresent, phase);
  }

  // ─── WEBRTC ────────────────────────────────────────────────────────────────

  private ensurePc(): RTCPeerConnection {
    if (this.pc) return this.pc;
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });
    this.pc = pc;

    pc.onconnectionstatechange = () => {
      this.cb.onConnection?.(pc.connectionState);
    };
    pc.onicecandidate = (e) => {
      if (e.candidate && !this.stopped) {
        void this.api
          .post(`${this.basePath}/signals`, {
            kind: 'ice',
            payload: JSON.stringify(e.candidate.toJSON()),
          })
          .catch(() => undefined);
      }
    };
    pc.ontrack = (e) => {
      const stream = e.streams[0] ?? new MediaStream([e.track]);
      this.cb.onRemoteStream?.(stream);
    };
    pc.ondatachannel = (e) => {
      this.bindDc(e.channel);
    };
    return pc;
  }

  private bindDc(dc: RTCDataChannel): void {
    this.dc = dc;
    dc.onopen = () => this.cb.onConnection?.(this.pc?.connectionState ?? 'connecting');
    dc.onclose = () => this.cb.onConnection?.(this.pc?.connectionState ?? 'closed');
  }

  private async maybeMakeOffer(): Promise<void> {
    if (this.role !== 'patient' || this.offered || this.stopped || !this.pc) return;
    this.offered = true;
    try {
      this.bindDc(this.pc.createDataChannel('chat'));
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);
      await this.api.post(`${this.basePath}/signals`, {
        kind: 'offer',
        payload: this.pc.localDescription?.sdp ?? offer.sdp ?? '',
      });
    } catch {
      this.offered = false;
      this.cb.onNotice?.('Could not start the video call — chat still works');
    }
  }

  private async handleOffer(sdp: string): Promise<void> {
    if (!sdp || this.stopped) return;
    const pc = this.ensurePc();
    try {
      await pc.setRemoteDescription({ type: 'offer', sdp });
      await this.flushIce();
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await this.api.post(`${this.basePath}/signals`, {
        kind: 'answer',
        payload: pc.localDescription?.sdp ?? answer.sdp ?? '',
      });
    } catch {
      this.cb.onNotice?.('Could not accept the incoming call offer');
    }
  }

  private async handleAnswer(sdp: string): Promise<void> {
    if (!sdp || !this.pc || this.stopped) return;
    try {
      if (!this.pc.remoteDescription) {
        await this.pc.setRemoteDescription({ type: 'answer', sdp });
        await this.flushIce();
      }
    } catch {
      /* stale/duplicate answer — ignore */
    }
  }

  private async handleIce(json: string): Promise<void> {
    let init: RTCIceCandidateInit;
    try {
      init = JSON.parse(json);
    } catch {
      return;
    }
    if (!this.pc?.remoteDescription) {
      this.pendingIce.push(init);
      return;
    }
    try {
      await this.pc.addIceCandidate(init);
    } catch {
      /* candidate no longer relevant */
    }
  }

  private async flushIce(): Promise<void> {
    const queued = this.pendingIce.splice(0);
    for (const init of queued) {
      try {
        await this.pc?.addIceCandidate(init);
      } catch {
        /* ignore */
      }
    }
  }

  // ─── MEDIA (opportunistic) ─────────────────────────────────────────────────

  private async setupLocalMedia(): Promise<void> {
    if (this.stopped) return;
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      this.attachLocal(s);
      return;
    } catch {
      /* no camera or denied — try audio only */
    }
    if (this.stopped) return;
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.attachLocal(s);
    } catch {
      this.cb.onLocalStream?.(null);
      this.cb.onNotice?.('Camera/microphone unavailable — joining with chat only');
    }
  }

  private attachLocal(stream: MediaStream): void {
    // Late resolution after the offer was sent would require renegotiation —
    // discard instead to keep a single, predictable negotiation.
    if (this.stopped || this.offered) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }
    this.localStream = stream;
    stream.getTracks().forEach((t) => this.pc?.addTrack(t, stream));
    this.cb.onLocalStream?.(stream);
  }
}

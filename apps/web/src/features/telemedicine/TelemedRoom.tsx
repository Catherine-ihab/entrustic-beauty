import { useEffect, useRef, useState } from 'react';
import { Alert, Badge, Button, Input, Tag, message } from 'antd';
import {
  ArrowLeft,
  Mic,
  MicOff,
  Send,
  Signal,
  UserRound,
  Video,
  VideoOff,
} from 'lucide-react';
import {
  TelemedSession,
  TelemedApi,
  TelemedChatMessage,
  TelemedRole,
} from '../../lib/telemed-session';

interface TelemedRoomProps {
  /** Staff apiClient or patient portalClient — both speak the envelope. */
  api: TelemedApi;
  /** e.g. '/telemedicine/rooms/<id>' (staff) or '/portal/rooms/<id>' (patient). */
  basePath: string;
  role: TelemedRole;
  title: string;
  subtitle?: string;
  onBack?: () => void;
}

const PHASE_TEXT: Record<string, { patient: string; provider: string; color: string }> = {
  not_started: {
    patient: 'Connecting to the room…',
    provider: 'Connecting to the room…',
    color: 'default',
  },
  waiting: {
    patient: 'Waiting for the clinician to join…',
    provider: 'The patient is waiting in the room',
    color: 'processing',
  },
  provider_waiting: {
    patient: 'The clinician is in the room',
    provider: 'Waiting for the patient to join…',
    color: 'warning',
  },
  connected: {
    patient: 'Connected — the clinician is with you',
    provider: 'Connected — the patient is in the room',
    color: 'success',
  },
};

export function TelemedRoom({ api, basePath, role, title, subtitle, onBack }: TelemedRoomProps) {
  const [phase, setPhase] = useState('not_started');
  const [connection, setConnection] = useState('new');
  const [chat, setChat] = useState<TelemedChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [hasLocal, setHasLocal] = useState(false);
  const [hasRemote, setHasRemote] = useState(false);

  const sessionRef = useRef<TelemedSession | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const session = new TelemedSession(api, basePath, role, {
      onPresence: (_p, _pr, p) => setPhase(p),
      onChat: (msg) => setChat((prev) => [...prev, msg]),
      onConnection: (state) => setConnection(state),
      onLocalStream: (stream) => {
        localStreamRef.current = stream;
        setHasLocal(!!stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      },
      onRemoteStream: (stream) => {
        remoteStreamRef.current = stream;
        setHasRemote(true);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
      },
      onNotice: (text) => setNotice(text),
    });
    sessionRef.current = session;
    void session.start();

    return () => {
      sessionRef.current = null;
      void session.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basePath, role]);

  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
    if (remoteVideoRef.current && remoteStreamRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
    }
  }, [hasLocal, hasRemote]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.length]);

  const send = async () => {
    const text = draft.trim();
    if (!text || !sessionRef.current) return;
    setDraft('');
    await sessionRef.current.sendChat(text);
  };

  const toggleMic = () => {
    const next = !micOn;
    localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = next));
    setMicOn(next);
  };

  const toggleCam = () => {
    const next = !camOn;
    localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = next));
    setCamOn(next);
  };

  const phaseInfo = PHASE_TEXT[phase] ?? PHASE_TEXT.not_started;
  const connColor =
    connection === 'connected' ? 'success' : connection === 'failed' ? 'error' : 'processing';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {onBack && (
          <Button icon={<ArrowLeft size={16} />} onClick={onBack}>
            Back
          </Button>
        )}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontWeight: 600, fontSize: 16 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, opacity: 0.65 }}>{subtitle}</div>}
        </div>
        <Badge status={phase === 'connected' ? 'success' : 'processing'} text={phaseInfo[role]} />
        <Tag color={connColor}>
          <Signal size={12} style={{ marginRight: 4 }} />
          {connection}
        </Tag>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 12,
        }}
      >
        <div
          style={{
            position: 'relative',
            background: '#0f172a',
            borderRadius: 10,
            aspectRatio: '16 / 10',
            overflow: 'hidden',
          }}
        >
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scaleX(-1)',
              display: hasRemote ? 'block' : 'none',
            }}
          />
          {!hasRemote && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94a3b8',
                gap: 8,
              }}
            >
              <UserRound size={40} />
              <span style={{ fontSize: 13 }}>
                {phase === 'connected'
                  ? 'Connecting video…'
                  : 'The other party has not joined yet'}
              </span>
            </div>
          )}
          <div
            style={{
              position: 'absolute',
              right: 8,
              bottom: 8,
              width: '34%',
              aspectRatio: '16 / 10',
              background: '#1e293b',
              borderRadius: 6,
              overflow: 'hidden',
            }}
          >
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)',
                display: hasLocal ? 'block' : 'none',
              }}
            />
            {!hasLocal && (
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                }}
              >
                <VideoOff size={20} />
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minHeight: 260,
          }}
        >
          <div
            style={{
              padding: '8px 12px',
              fontWeight: 600,
              fontSize: 13,
              borderBottom: '1px solid #e2e8f0',
            }}
          >
            Room chat
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 10, maxHeight: 300 }}>
            {chat.length === 0 && (
              <div style={{ fontSize: 12, opacity: 0.6, textAlign: 'center', marginTop: 24 }}>
                No messages yet — say hello!
              </div>
            )}
            {chat.map((m) => (
              <div
                key={m.id}
                style={{
                  marginBottom: 8,
                  display: 'flex',
                  justifyContent: m.sender === role ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    background: m.sender === role ? '#dbeafe' : '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    padding: '6px 10px',
                    fontSize: 13,
                  }}
                >
                  <div style={{ fontSize: 10, opacity: 0.6, marginBottom: 2 }}>
                    {m.sender === role ? 'You' : m.sender === 'patient' ? 'Patient' : 'Clinician'}{' '}
                    · {new Date(m.at).toLocaleTimeString()}
                  </div>
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div style={{ display: 'flex', gap: 6, padding: 10, borderTop: '1px solid #e2e8f0' }}>
            <Input
              value={draft}
              placeholder="Type a message…"
              onChange={(e) => setDraft(e.target.value)}
              onPressEnter={send}
              maxLength={2000}
            />
            <Button type="primary" icon={<Send size={14} />} onClick={send} />
          </div>
        </div>
      </div>

      {notice && (
        <Alert type="warning" showIcon message={notice} closable onClose={() => setNotice(null)} />
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <Button
          icon={micOn ? <Mic size={16} /> : <MicOff size={16} />}
          onClick={toggleMic}
          disabled={!hasLocal}
        >
          {micOn ? 'Mute' : 'Unmute'}
        </Button>
        <Button
          icon={camOn ? <Video size={16} /> : <VideoOff size={16} />}
          onClick={toggleCam}
          disabled={!hasLocal}
        >
          {camOn ? 'Stop video' : 'Start video'}
        </Button>
        <Button
          danger
          onClick={() => {
            message.info('You left the room');
            onBack?.();
          }}
        >
          Leave room
        </Button>
      </div>
    </div>
  );
}

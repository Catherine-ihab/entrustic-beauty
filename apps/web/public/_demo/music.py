"""Generates the demo soundtrack: a soft, warm bed + a transition air-sweep.

Why synthesize instead of downloading a track? Licensing. This is written from
scratch with numpy, so the clinic can publish the video anywhere without
attribution or copyright risk.

The bed is deliberately simple:
  - a slow 4-chord pad (Am7 -> Fmaj7 -> Cmaj7 -> G6) at 84 BPM
  - a sparse pentatonic pluck for movement
  - a soft kick on 1 and 3, a brushed shaker on the off-beats
  - gentle saturation + stereo width

It is rendered at roughly -28 dBFS RMS so it sits *under* the narration, and
mux.cjs ducks it further whenever the voice is talking.

Usage:  python music.py            (reads timing.json, writes audio/bed.wav)
"""
import json
import os
import wave

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
TIMING = os.path.join(HERE, "timing.json")
OUTDIR = os.path.join(HERE, "audio")
OUT = os.path.join(OUTDIR, "bed.wav")

SR = 48000
BPM = 84.0
BEAT = 60.0 / BPM
BAR = BEAT * 4
TARGET_RMS_DB = -28.0

rng = np.random.default_rng(7)


def midi(m):
    return 440.0 * 2.0 ** ((m - 69) / 12.0)


def adsr(n, a, d, s, r, sr=SR):
    """Simple ADSR envelope of n samples."""
    a_n, d_n, r_n = int(a * sr), int(d * sr), int(r * sr)
    s_n = max(0, n - a_n - d_n - r_n)
    env = np.concatenate([
        np.linspace(0.0, 1.0, a_n, endpoint=False) if a_n else np.array([]),
        np.linspace(1.0, s, d_n, endpoint=False) if d_n else np.array([]),
        np.full(s_n, s),
        np.linspace(s, 0.0, r_n) if r_n else np.array([]),
    ])
    if len(env) < n:
        env = np.pad(env, (0, n - len(env)))
    return env[:n]


def pad_note(freq, dur, gain):
    n = int(dur * SR)
    t = np.arange(n) / SR
    # two slightly detuned voices + a few harmonics = warm, not buzzy
    out = np.zeros(n)
    for det in (-0.0035, 0.0, 0.0035):
        f = freq * (1 + det)
        out += np.sin(2 * np.pi * f * t)
        out += 0.34 * np.sin(2 * np.pi * f * 2 * t + 0.7)
        out += 0.12 * np.sin(2 * np.pi * f * 3 * t + 1.9)
    out /= 3.0
    env = adsr(n, 0.55, 0.5, 0.72, 0.9)
    return out * env * gain


def pluck(freq, dur=0.5, gain=0.5):
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.sin(2 * np.pi * freq * t) + 0.3 * np.sin(2 * np.pi * freq * 2 * t)
    env = np.exp(-t * 9.0)
    env[: int(0.004 * SR)] *= np.linspace(0, 1, int(0.004 * SR))
    return out * env * gain


def kick(dur=0.34, gain=0.9):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 52 * np.exp(-t * 22) + 38
    phase = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(phase) * np.exp(-t * 11)
    click = rng.normal(0, 1, n) * np.exp(-t * 140) * 0.16
    return (body + click) * gain


def shaker(dur=0.09, gain=0.22):
    n = int(dur * SR)
    t = np.arange(n) / SR
    noise = rng.normal(0, 1, n)
    noise = np.diff(np.concatenate([[0], noise]))  # cheap high-pass
    return noise * np.exp(-t * 55) * gain


def whoosh(dur=0.9):
    """Air sweep used on scene changes: band-ish noise with a soft arc."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    noise = rng.normal(0, 1, n)
    noise = np.diff(np.concatenate([[0], noise]))
    # two moving-average passes = gentle low-pass, then subtract for a band
    k = 24
    sm = np.convolve(noise, np.ones(k) / k, mode="same")
    band = noise - sm
    env = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2.2
    low = np.sin(2 * np.pi * np.linspace(150, 65, n) * t) * np.exp(-t * 3.2) * 0.25
    return (band * 0.55 + low) * env


def main():
    timing = json.load(open(TIMING, encoding="utf-8"))
    total = sum(t["dur"] for t in timing)
    length = int((total + 1.2) * SR)
    L = np.zeros(length)
    R = np.zeros(length)

    def add(sig, at, pan_l=1.0, pan_r=1.0):
        i = int(at * SR)
        j = min(length, i + len(sig))
        if i >= length:
            return
        L[i:j] += sig[: j - i] * pan_l
        R[i:j] += sig[: j - i] * pan_r

    # ---- harmony ----
    chords = [
        [45, 52, 55, 60],  # Am7
        [41, 48, 52, 57],  # Fmaj7
        [48, 55, 59, 64],  # Cmaj7
        [43, 50, 55, 59],  # G6
    ]
    scale = [69, 72, 74, 76, 79]  # A minor pentatonic

    loop_bars = len(chords) * 2
    loop_len = loop_bars * BAR
    n_loops = int(np.ceil(total / loop_len)) + 1

    for li in range(n_loops):
        base = li * loop_len
        for ci, chord in enumerate(chords):
            start = base + ci * 2 * BAR
            for k, m in enumerate(chord):
                g = 0.155 if k == 0 else 0.105
                note = pad_note(midi(m), 2 * BAR + 0.9, g)
                # spread the chord slightly across the stereo field
                pan = 0.5 + 0.16 * (k - 1.5)
                add(note, start, 1 - pan * 0.35, 0.65 + pan * 0.35)

            # pluck: 4 sparse notes per chord block
            for step in range(4):
                if rng.random() < 0.28:
                    continue
                at = start + step * BAR / 2 + (BAR / 8 if step % 2 else 0)
                m = scale[rng.integers(0, len(scale))]
                p = pluck(midi(m), 0.6, 0.22)
                side = rng.random()
                add(p, at, 0.55 + 0.45 * side, 1.0 - 0.45 * side)

        # ---- rhythm ----
        for b in range(loop_bars):
            t0 = base + b * BAR
            add(kick(gain=0.5), t0, 1.0, 1.0)
            add(kick(gain=0.36), t0 + 2 * BEAT, 1.0, 1.0)
            for e in range(8):
                if e % 2:
                    add(shaker(gain=0.13), t0 + e * BEAT / 2, 0.75, 1.0)
    # ---- transition sweeps on scene boundaries ----
    t_acc = 0.0
    for idx, t in enumerate(timing):
        if idx:
            add(whoosh(), max(0.0, t_acc - 0.38), 0.9, 0.9)
        t_acc += t["dur"]

    # ---- gentle saturation, fades, normalise ----
    stereo = np.stack([L, R], axis=1)
    stereo = np.tanh(stereo * 1.15) / 1.15

    rms = np.sqrt(np.mean(stereo ** 2))
    target = 10 ** (TARGET_RMS_DB / 20.0)
    stereo *= target / max(rms, 1e-9)

    fade = int(1.6 * SR)
    stereo[:fade] *= np.linspace(0, 1, fade)[:, None]
    stereo[-int(2.5 * SR):] *= np.linspace(1, 0, int(2.5 * SR))[:, None]

    peak = np.max(np.abs(stereo))
    if peak > 0.7:
        stereo *= 0.7 / peak

    os.makedirs(OUTDIR, exist_ok=True)
    pcm = (np.clip(stereo, -1, 1) * 32767).astype("<i2")
    with wave.open(OUT, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())

    print(f"wrote {OUT}  {len(stereo)/SR:.2f}s  rms={20*np.log10(np.sqrt(np.mean(stereo**2))):.1f} dBFS")


if __name__ == "__main__":
    main()

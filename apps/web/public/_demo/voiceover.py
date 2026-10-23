"""Generates the Entrustic Beauty demo voiceover and derives scene timings.

For every scene in voiceover.json:
  1. synthesize the narration with edge-tts (Azure neural voice)
  2. measure its real duration with ffprobe
  3. write timing.json  ->  { "id": "01", "dur": 6.42, "speech": 5.22, ... }

gen.cjs reads timing.json and stretches each scene so the narration always fits
with a fixed lead-in and tail, which keeps picture and sound in sync.

Usage:  python voiceover.py
"""
import asyncio
import json
import os
import subprocess
import sys

import edge_tts

HERE = os.path.dirname(os.path.abspath(__file__))
VOICE_DIR = os.path.join(HERE, "voice")
CFG = os.path.join(HERE, "voiceover.json")
TIMING = os.path.join(HERE, "timing.json")

FFPROBE_CANDIDATES = [
    os.path.join(os.environ.get("TEMP", ""), "opencode", "ffmpeg", "ex",
                 "ffmpeg-9.0.2-essentials_build", "bin", "ffprobe.exe"),
]


def find_ffprobe():
    if os.environ.get("FFPROBE"):
        return os.environ["FFPROBE"]
    for p in FFPROBE_CANDIDATES:
        if os.path.exists(p):
            return p
    stack = [os.path.join(os.environ.get("TEMP", ""), "opencode", "ffmpeg")]
    while stack:
        d = stack.pop()
        if not os.path.isdir(d):
            continue
        for name in os.listdir(d):
            full = os.path.join(d, name)
            if os.path.isdir(full):
                stack.append(full)
            elif name == "ffprobe.exe":
                return full
    return "ffprobe"


def duration_of(path, ffprobe):
    out = subprocess.run(
        [ffprobe, "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", path],
        capture_output=True, text=True, check=True,
    ).stdout.strip()
    return float(out)


async def synth(text, voice, rate, pitch, path):
    comm = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
    await comm.save(path)


async def main():
    with open(CFG, encoding="utf-8") as f:
        cfg = json.load(f)

    os.makedirs(VOICE_DIR, exist_ok=True)
    ffprobe = find_ffprobe()
    print("ffprobe:", ffprobe)

    lead = cfg.get("leadIn", 0.55)
    tail = cfg.get("tail", 0.65)
    timing = []
    total = 0.0

    for scene in cfg["scenes"]:
        sid = scene["id"]
        mp3 = os.path.join(VOICE_DIR, f"narr-{sid}.mp3")
        await synth(scene["text"], cfg["voice"], cfg.get("rate", "+0%"),
                    cfg.get("pitch", "+0Hz"), mp3)
        speech = duration_of(mp3, ffprobe)
        dur = round(lead + speech + tail, 2)
        timing.append({"id": sid, "speech": round(speech, 2), "dur": dur})
        total += dur
        print(f"scene {sid}: speech {speech:5.2f}s -> scene {dur:5.2f}s")

    with open(TIMING, "w", encoding="utf-8") as f:
        json.dump(timing, f, indent=2, ensure_ascii=False)

    print(f"\ntotal video length: {total:.2f}s")
    print("wrote", TIMING)


if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())

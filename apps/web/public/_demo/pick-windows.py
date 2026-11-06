"""Finds the most "alive" window inside each screen recording.

A screen recording is not uniformly busy: the first second is often a still
page, then the user scrolls/clicks. Picking the window with the most frame-to
frame change makes the demo feel active instead of frozen.

Prints, for every clip, the best `start` for a given scene length so gen.cjs
can hard-code it.

Usage: python pick-windows.py
"""
import glob
import json
import os
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SHOTS = os.path.join(HERE, "shots")

FFMPEG_DIR = os.path.join(os.environ.get("TEMP", ""), "opencode", "ffmpeg")
FFMPEG = None
for root, _dirs, files in os.walk(FFMPEG_DIR):
    if "ffmpeg.exe" in files:
        FFMPEG = os.path.join(root, "ffmpeg.exe")
        break
if not FFMPEG:
    sys.exit("ffmpeg not found")

# scene id -> (clip, scene duration, playback rate)  -- mirrors gen.cjs
PLAN = {
    "04": ("laser.mp4", 5.77, 0.85),
    "05": ("injectables.mp4", 6.47, 0.85),
    "06": ("skincare.mp4", 5.75, 0.90),
    "08": ("appointments.mp4", 6.08, 0.95),
    "09": ("invoices.mp4", 5.92, 0.90),
    "11": ("reports.mp4", 6.08, 0.95),
}

FPS = 5
TINY = (192, 108)


def frames_of(clip, tmp):
    out = os.path.join(tmp, "f%03d.png")
    subprocess.run(
        [FFMPEG, "-y", "-hide_banner", "-loglevel", "error", "-i", os.path.join(SHOTS, clip),
         "-vf", f"fps={FPS},scale={TINY[0]}:{TINY[1]}", out],
        check=True,
    )
    return [np.array(Image.open(p).convert("L")).astype(np.int16) for p in sorted(glob.glob(os.path.join(tmp, "f*.png")))]


def main():
    print(f"{'scene':5} {'clip':18} {'len':>5} {'need':>5} {'best start':>10} {'activity':>9}")
    result = {}
    for sid, (clip, dur, rate) in PLAN.items():
        need = dur * rate  # seconds of the clip the scene consumes
        with tempfile.TemporaryDirectory() as tmp:
            fr = frames_of(clip, tmp)
        if len(fr) < 2:
            continue
        diffs = np.array([np.abs(fr[i + 1] - fr[i]).mean() for i in range(len(fr) - 1)])
        win = max(1, int(need * FPS))
        if win >= len(diffs):
            best, score = 0.0, float(diffs.mean())
        else:
            sums = np.convolve(diffs, np.ones(win), mode="valid")
            k = int(np.argmax(sums))
            best, score = k / FPS, float(sums[k] / win)
        result[sid] = {"clip": clip, "start": round(best, 2), "activity": round(score, 2),
                       "length": round(len(fr) / FPS, 2), "need": round(need, 2)}
        print(f"{sid:5} {clip:18} {len(fr)/FPS:5.2f} {need:5.2f} {best:10.2f} {score:9.2f}")
    print("\n" + json.dumps(result, indent=2))


if __name__ == "__main__":
    main()

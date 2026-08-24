#!/usr/bin/env python3
"""Keep lookbook stills on screen while the fashion presenter moves."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
SERIF = "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"


def caption_for(t: float) -> tuple[str, str]:
    if t < 3.0:
        return "FASHION", "This season is about ease and presence."
    if t < 6.2:
        return "MOVE", "Fabric that moves when you move."
    if t < 8.8:
        return "CITY TO NIGHT", "Wear it through the city, then after dark."
    return "LOOKBOOK", "You do not have to stand still to look like yourself."


def main() -> None:
    talking = Path(sys.argv[1])
    assets = Path(sys.argv[2])
    dest = Path(sys.argv[3])
    audio = Path(sys.argv[4]) if len(sys.argv) > 4 else talking
    duration = float(
        subprocess.check_output(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nokey=1:noprint_wrappers=1", str(talking)],
            text=True,
        ).strip()
    )
    fps = 30
    frames = int(duration * fps)
    W, H = 1080, 1920
    looks = {
        "coat": Image.open(assets / "fashion-look-01.png").convert("RGB").resize((360, 540)),
        "detail": Image.open(assets / "fashion-look-02.png").convert("RGB").resize((360, 540)),
    }
    font = ImageFont.truetype(FONT, 26)
    serif = ImageFont.truetype(SERIF, 32)

    reader = subprocess.Popen(
        ["ffmpeg", "-v", "error", "-i", str(talking), "-vf", f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H}", "-r", str(fps), "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
        stdout=subprocess.PIPE,
    )
    writer = subprocess.Popen(
        [
            "ffmpeg", "-y",
            "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(fps), "-i", "-",
            "-i", str(audio),
            "-map", "0:v", "-map", "1:a?",
            "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac",
            "-shortest", "-movflags", "+faststart", str(dest),
        ],
        stdin=subprocess.PIPE,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    assert reader.stdout and writer.stdin
    frame_bytes = W * H * 3
    for i in range(frames):
        raw = reader.stdout.read(frame_bytes)
        if not raw or len(raw) < frame_bytes:
            break
        t = i / fps
        img = Image.frombytes("RGB", (W, H), raw)
        key = "coat" if 2.8 <= t < 6.4 else "detail" if 6.4 <= t < 9.6 else None
        if key:
            still = looks[key]
            card = Image.new("RGB", (still.size[0] + 16, still.size[1] + 16), (18, 16, 14))
            card.paste(still, (8, 8))
            img.paste(card, (W - card.size[0] - 36, 220))
        draw = ImageDraw.Draw(img, "RGBA")
        draw.rectangle((0, H - 270, W, H), fill=(0, 0, 0, 150))
        kicker, line = caption_for(t)
        draw.text((48, H - 230), kicker, font=font, fill=(212, 168, 83, 255))
        draw.text((48, H - 180), line, font=serif, fill=(244, 241, 234, 255))
        writer.stdin.write(img.convert("RGB").tobytes())
    writer.stdin.close()
    reader.wait()
    if writer.wait() != 0:
        raise SystemExit("overlay ffmpeg failed")
    print(f"wrote {dest}")


if __name__ == "__main__":
    main()

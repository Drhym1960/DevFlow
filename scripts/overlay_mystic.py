#!/usr/bin/env python3
"""MysticTxt screens beside a moving presenter for any duration."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
SERIF = "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"


def caption_for(t: float, duration: float) -> tuple[str, str]:
    p = t / max(duration, 1)
    if p < 0.18:
        return "PRIVATE ADVICE", "When the question is personal, you do not need an audience."
    if p < 0.4:
        return "LIVE ADVISORS", "Talk it through with an experienced advisor."
    if p < 0.62:
        return "LIVE CHAT", "One-to-one Live Chat, on your terms."
    if p < 0.82:
        return "VOICE CALL", "Or speak — voice to voice."
    return "MYSTICTXT", "Talk to a Live Coach."


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
    products = {
        "advisors": Image.open(assets / "mystictxt-advisors.png").convert("RGB").resize((360, 640)),
        "chat": Image.open(assets / "mystictxt-chat.png").convert("RGB").resize((360, 640)),
        "voice": Image.open(assets / "mystictxt-voice.png").convert("RGB").resize((360, 640)),
        "cta": Image.open(assets / "mystictxt-cta.png").convert("RGB").resize((W, H)),
    }
    font = ImageFont.truetype(FONT, 26)
    serif = ImageFont.truetype(SERIF, 30)

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
        p = t / max(duration, 1)
        img = Image.frombytes("RGB", (W, H), raw)
        if p >= 0.84:
            img = Image.blend(img, products["cta"], 0.5)
        else:
            key = "advisors" if 0.18 <= p < 0.4 else "chat" if 0.4 <= p < 0.62 else "voice" if 0.62 <= p < 0.84 else None
            if key:
                phone = products[key]
                card = Image.new("RGB", (phone.size[0] + 16, phone.size[1] + 16), (12, 12, 18))
                card.paste(phone, (8, 8))
                img.paste(card, (W - card.size[0] - 36, 200))
        draw = ImageDraw.Draw(img, "RGBA")
        draw.rectangle((0, H - 270, W, H), fill=(0, 0, 0, 150))
        kicker, line = caption_for(t, duration)
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

#!/usr/bin/env python3
"""Audio-driven talking presenter: the on-screen woman speaks the voice bed."""

from __future__ import annotations

import math
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

W, H, FPS = 1080, 1920, 30
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
SERIF = "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"


def load_rgb(path: Path) -> np.ndarray:
    img = Image.open(path).convert("RGB")
    img = img.resize((W, H), Image.Resampling.LANCZOS)
    return np.asarray(img, dtype=np.float32)


def load_overlay(path: Path, box: tuple[int, int]) -> Image.Image:
    img = Image.open(path).convert("RGB")
    return img.resize(box, Image.Resampling.LANCZOS)


def audio_envelope(audio: Path, frames: int) -> np.ndarray:
    raw = subprocess.check_output(
        ["ffmpeg", "-v", "error", "-i", str(audio), "-f", "f32le", "-ac", "1", "-ar", "22050", "-"],
    )
    samples = np.frombuffer(raw, dtype=np.float32)
    win = max(1, len(samples) // frames)
    env = []
    for i in range(frames):
        chunk = samples[i * win : (i + 1) * win]
        env.append(float(np.sqrt(np.mean(chunk * chunk))) if len(chunk) else 0.0)
    env = np.array(env, dtype=np.float32)
    # smooth
    k = np.array([0.15, 0.2, 0.3, 0.2, 0.15], dtype=np.float32)
    env = np.convolve(env, k, mode="same")
    peak = float(env.max()) or 1.0
    return np.clip(env / peak, 0, 1)


def viseme_frame(levels: list[np.ndarray], amount: float) -> np.ndarray:
    # 0 closed → 1 wide
    stops = (0.0, 0.28, 0.62, 1.0)
    if amount <= stops[1]:
        t = amount / stops[1]
        return levels[0] * (1 - t) + levels[1] * t
    if amount <= stops[2]:
        t = (amount - stops[1]) / (stops[2] - stops[1])
        return levels[1] * (1 - t) + levels[2] * t
    t = (amount - stops[2]) / (stops[3] - stops[2])
    return levels[2] * (1 - t) + levels[3] * t


def caption_for(t: float) -> tuple[str, str]:
    if t < 4.2:
        return "PRESENTER", "Looking for someone to talk things through with?"
    if t < 8.0:
        return "LIVE ADVISORS", "Connect privately with experienced advisors."
    if t < 11.4:
        return "LIVE CHAT", "One-to-one Live Chat, on your terms."
    if t < 14.8:
        return "VOICE CALL", "Or speak — voice to voice."
    return "MYSTICTXT", "Talk to a Live Coach."


def overlay_for(t: float, products: dict[str, Image.Image]) -> Image.Image | None:
    if 4.0 <= t < 8.0:
        return products["advisors"]
    if 8.0 <= t < 11.4:
        return products["chat"]
    if 11.4 <= t < 14.8:
        return products["voice"]
    return None


def render(talk_dir: Path, products_dir: Path, audio: Path, dest: Path) -> None:
    levels = [
        load_rgb(talk_dir / name)
        for name in ("talk-closed.png", "talk-slight.png", "talk-open.png", "talk-wide.png")
    ]
    products = {
        "advisors": load_overlay(products_dir / "mystictxt-advisors.png", (420, 760)),
        "chat": load_overlay(products_dir / "mystictxt-chat.png", (420, 760)),
        "voice": load_overlay(products_dir / "mystictxt-voice.png", (420, 760)),
        "cta": load_overlay(products_dir / "mystictxt-cta.png", (1080, 1920)),
    }
    duration = float(
        subprocess.check_output(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nokey=1:noprint_wrappers=1", str(audio)],
            text=True,
        ).strip()
    )
    frames = int(duration * FPS)
    env = audio_envelope(audio, frames)
    font = ImageFont.truetype(FONT, 26)
    serif = ImageFont.truetype(SERIF, 32)

    dest.parent.mkdir(parents=True, exist_ok=True)
    ff = subprocess.Popen(
        [
            "ffmpeg",
            "-y",
            "-f",
            "rawvideo",
            "-pix_fmt",
            "rgb24",
            "-s",
            f"{W}x{H}",
            "-r",
            str(FPS),
            "-i",
            "-",
            "-i",
            str(audio),
            "-map",
            "0:v",
            "-map",
            "1:a",
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-c:a",
            "aac",
            "-shortest",
            "-movflags",
            "+faststart",
            str(dest),
        ],
        stdin=subprocess.PIPE,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    assert ff.stdin is not None

    for i in range(frames):
        t = i / FPS
        amount = float(env[i])
        # hold a little openness so speech doesn't look frozen between words
        if amount > 0.04:
            amount = 0.12 + amount * 0.88
        frame = viseme_frame(levels, amount)
        # tiny live motion
        shift = int(4 * math.sin(t * 2.1) + 3 * amount)
        live = np.roll(frame, shift, axis=0)
        img = Image.fromarray(np.clip(live, 0, 255).astype(np.uint8), "RGB")

        if t >= 14.8:
            cta = products["cta"].copy()
            img = Image.blend(img, cta, 0.72)
        else:
            phone = overlay_for(t, products)
            if phone:
                card = Image.new("RGB", (phone.size[0] + 16, phone.size[1] + 16), (12, 12, 18))
                card.paste(phone, (8, 8))
                img.paste(card, (W - card.size[0] - 36, 220))

        draw = ImageDraw.Draw(img, "RGBA")
        draw.rectangle((0, H - 270, W, H), fill=(0, 0, 0, 150))
        kicker, line = caption_for(t)
        draw.text((48, H - 230), kicker, font=font, fill=(212, 168, 83, 255))
        draw.text((48, H - 180), line, font=serif, fill=(244, 241, 234, 255))
        ff.stdin.write(img.convert("RGB").tobytes())

    ff.stdin.close()
    if ff.wait() != 0:
        raise SystemExit("ffmpeg failed")
    print(f"wrote {dest} frames={frames} duration={duration:.2f}")


if __name__ == "__main__":
    assets = Path(sys.argv[1] if len(sys.argv) > 1 else "/opt/cursor/artifacts/assets")
    audio = Path(sys.argv[2] if len(sys.argv) > 2 else "/tmp/mystictxt-ad/voice.mp3")
    dest = Path(sys.argv[3] if len(sys.argv) > 3 else "/opt/cursor/artifacts/mystictxt-talking.mp4")
    render(assets, assets, audio, dest)

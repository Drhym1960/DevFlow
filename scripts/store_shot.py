#!/usr/bin/env python3
"""Compose a Play Store / App Store marketing screenshot around the client's real app UI."""

from __future__ import annotations

import argparse
import colorsys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

SANS = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
SERIF = "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"
SANS_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
SERIF_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size)


def wrap(draw: ImageDraw.ImageDraw, text: str, face: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        trial = f"{current} {word}".strip()
        if draw.textlength(trial, font=face) <= max_width:
            current = trial
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines[:4]


def rgb_hex(value: str) -> tuple[int, int, int]:
    h = value.replace("#", "").strip()
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    n = int(h, 16)
    return (n >> 16) & 255, (n >> 8) & 255, n & 255


def palette_from(sample: Path | None) -> tuple[tuple[int, int, int], tuple[int, int, int]]:
    if not sample or not sample.exists():
        return (12, 12, 20), (212, 168, 83)
    img = Image.open(sample).convert("RGB").resize((48, 84), Image.Resampling.BOX)
    pixels = list(img.getdata())
    edge = []
    w, h = img.size
    for y in range(h):
        for x in range(w):
            if y < 10 or y > h - 8 or x < 4 or x > w - 4:
                edge.append(pixels[y * w + x])
    if not edge:
        edge = pixels
    avg = tuple(sum(c[i] for c in edge) // len(edge) for i in range(3))
    # Keep a readable dark marketing field if the sample is very light.
    luma = 0.2126 * avg[0] + 0.7152 * avg[1] + 0.0722 * avg[2]
    bg = avg if luma < 200 else (18, 16, 28)
    hx, s, v = colorsys.rgb_to_hsv(avg[0] / 255, avg[1] / 255, avg[2] / 255)
    accent = tuple(int(c * 255) for c in colorsys.hsv_to_rgb((hx + 0.08) % 1, min(0.55, s + 0.25), min(0.92, v + 0.25)))
    if max(accent) < 80:
        accent = (212, 168, 83)
    return bg, accent  # type: ignore[return-value]


def rounded_mask(size: tuple[int, int], radius: int) -> Image.Image:
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), radius=radius, fill=255)
    return mask


def paste_rounded(base: Image.Image, src: Image.Image, xy: tuple[int, int], radius: int) -> None:
    mask = rounded_mask(src.size, radius)
    base.paste(src, xy, mask)


def gradient(size: tuple[int, int], top: tuple[int, int, int], bottom: tuple[int, int, int]) -> Image.Image:
    img = Image.new("RGB", size, top)
    draw = ImageDraw.Draw(img)
    w, h = size
    for y in range(h):
        t = y / max(h - 1, 1)
        rgb = tuple(int(top[i] * (1 - t) + bottom[i] * t) for i in range(3))
        draw.line((0, y, w, y), fill=rgb)
    return img


def compose(args: argparse.Namespace) -> None:
    width, height = (int(n) for n in args.size.split("x"))
    bg_rgb, accent = palette_from(Path(args.sample) if args.sample else None)
    if args.bg:
        canvas = Image.open(args.bg).convert("RGB").resize((width, height), Image.Resampling.LANCZOS)
        canvas = Image.blend(canvas, Image.new("RGB", (width, height), bg_rgb), 0.28)
    else:
        darker = tuple(max(0, c - 40) for c in bg_rgb)
        canvas = gradient((width, height), bg_rgb, darker)
    canvas = canvas.convert("RGBA")
    draw = ImageDraw.Draw(canvas, "RGBA")

    headline = (args.headline or "").strip()
    sub = (args.sub or "").strip()
    title_face = font(SERIF_BOLD, 72 if width >= 1200 else 58)
    sub_face = font(SANS, 34 if width >= 1200 else 28)

    pad = int(width * 0.08)
    text_top = int(height * 0.07)
    if headline:
        for i, line in enumerate(wrap(draw, headline, title_face, width - pad * 2)):
            draw.text((pad, text_top + i * 84), line, font=title_face, fill=(244, 241, 234))
        text_top += 84 * min(3, max(1, len(wrap(draw, headline, title_face, width - pad * 2)))) + 16
    if sub:
        for i, line in enumerate(wrap(draw, sub, sub_face, width - pad * 2)):
            draw.text((pad, text_top + i * 42), line, font=sub_face, fill=accent)

    screen = Image.open(args.screen).convert("RGB")
    frame_w = int(width * 0.72)
    frame_h = int(height * 0.62)
    frame_x = (width - frame_w) // 2
    frame_y = int(height * 0.32)
    bezel = 18
    radius = 56
    bezel_color = (8, 8, 12, 255)
    draw.rounded_rectangle(
        (frame_x - 4, frame_y - 4, frame_x + frame_w + 4, frame_y + frame_h + 4),
        radius=radius + 6,
        fill=(accent[0], accent[1], accent[2], 90),
    )
    draw.rounded_rectangle(
        (frame_x, frame_y, frame_x + frame_w, frame_y + frame_h),
        radius=radius,
        fill=bezel_color,
    )
    inner_w = frame_w - bezel * 2
    inner_h = frame_h - bezel * 2
    scale = max(inner_w / screen.width, inner_h / screen.height)
    cover_src = screen.resize((max(1, int(screen.width * scale)), max(1, int(screen.height * scale))), Image.Resampling.LANCZOS)
    cx = max(0, (cover_src.width - inner_w) // 2)
    cy = max(0, (cover_src.height - inner_h) // 2)
    cover = cover_src.crop((cx, cy, cx + inner_w, cy + inner_h))
    paste_rounded(canvas, cover, (frame_x + bezel, frame_y + bezel), radius - 12)
    # Home indicator
    bar_w = int(inner_w * 0.28)
    bar_x = frame_x + bezel + (inner_w - bar_w) // 2
    bar_y = frame_y + frame_h - bezel - 14
    draw.rounded_rectangle((bar_x, bar_y, bar_x + bar_w, bar_y + 6), radius=3, fill=(255, 255, 255, 140))

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(out, "PNG", optimize=True)


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--screen", required=True)
    p.add_argument("--sample")
    p.add_argument("--bg")
    p.add_argument("--out", required=True)
    p.add_argument("--size", default="1080x1920")
    p.add_argument("--headline", default="")
    p.add_argument("--sub", default="")
    compose(p.parse_args())


if __name__ == "__main__":
    main()

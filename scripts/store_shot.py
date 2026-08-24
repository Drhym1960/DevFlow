#!/usr/bin/env python3
"""Compose a Play Store / App Store marketing screenshot around the client's real app UI."""

from __future__ import annotations

import argparse
import colorsys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

SANS = "/usr/share/fonts/truetype/macos/Inter-Regular.ttf"
SANS_MED = "/usr/share/fonts/truetype/macos/Inter-Medium.ttf"
SERIF_BOLD = "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf"
if not Path(SANS).exists():
    SANS = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    SANS_MED = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
if not Path(SERIF_BOLD).exists():
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
    luma = 0.2126 * avg[0] + 0.7152 * avg[1] + 0.0722 * avg[2]
    bg = avg
    rich = max(
        pixels,
        key=lambda p: colorsys.rgb_to_hsv(p[0] / 255, p[1] / 255, p[2] / 255)[1] * colorsys.rgb_to_hsv(p[0] / 255, p[1] / 255, p[2] / 255)[2],
    )
    hx, s, v = colorsys.rgb_to_hsv(rich[0] / 255, rich[1] / 255, rich[2] / 255)
    if s < 0.18:
        hx, s, v = colorsys.rgb_to_hsv(avg[0] / 255, avg[1] / 255, avg[2] / 255)
        s = min(0.55, s + 0.35)
        v = min(0.78, max(0.45, v))
    accent = tuple(int(c * 255) for c in colorsys.hsv_to_rgb(hx, min(0.72, max(0.35, s)), min(0.78, max(0.42, v))))
    if luma < 40:
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


def luma_of(rgb: tuple[int, int, int]) -> float:
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]


def compose(args: argparse.Namespace) -> None:
    width, height = (int(n) for n in args.size.split("x"))
    if getattr(args, "bg_hex", None):
        bg_rgb = rgb_hex(args.bg_hex)
        accent = rgb_hex(getattr(args, "accent_hex", None) or "#b69130")
    else:
        bg_rgb, accent = palette_from(Path(args.sample) if args.sample else None)
    luma = luma_of(bg_rgb)
    if args.bg:
        canvas = Image.open(args.bg).convert("RGB").resize((width, height), Image.Resampling.LANCZOS)
        canvas = Image.blend(canvas, Image.new("RGB", (width, height), bg_rgb), 0.28)
    elif luma > 150:
        canvas = Image.new("RGB", (width, height), bg_rgb)
    else:
        darker = tuple(max(0, c - 40) for c in bg_rgb)
        canvas = gradient((width, height), bg_rgb, darker)
    canvas = canvas.convert("RGBA")
    draw = ImageDraw.Draw(canvas, "RGBA")

    ink = (48, 40, 34) if luma > 150 else (244, 241, 234)
    headline = (args.headline or "").strip()
    sub = (args.sub or "").strip()
    title_face = font(SERIF_BOLD, int(width * 0.07) if width >= 1200 else int(width * 0.064))
    sub_face = font(SANS_MED, int(width * 0.028) if width >= 1200 else int(width * 0.03))
    align = (args.align or ("center" if luma > 150 else "left")).lower()

    pad = int(width * 0.08)
    text_top = int(height * 0.055)
    max_text = width - pad * 2
    title_lh = int(width * 0.078)
    sub_lh = int(width * 0.038)

    def draw_lines(text, face, fill, line_h, gap=0):
        nonlocal text_top
        lines = wrap(draw, text, face, max_text)
        for i, line in enumerate(lines):
            tw = draw.textlength(line, font=face)
            x = (width - tw) / 2 if align == "center" else pad
            draw.text((x, text_top + i * line_h), line, font=face, fill=fill)
        text_top += line_h * min(3, max(1, len(lines))) + gap

    if headline:
        draw_lines(headline, title_face, ink, title_lh, 10)
    if sub:
        sub_lines = wrap(draw, sub, sub_face, max_text)
        draw_lines(sub, sub_face, accent, sub_lh, 6)
        if align == "center":
            bar_w = int(draw.textlength(sub_lines[-1], font=sub_face) * 0.55) if sub_lines else int(width * 0.16)
            bar_w = max(80, min(bar_w, int(width * 0.4)))
            draw.rounded_rectangle(
                ((width - bar_w) / 2, text_top, (width + bar_w) / 2, text_top + 4),
                radius=2,
                fill=accent,
            )
            text_top += 22

    screen = Image.open(args.screen).convert("RGB")
    frame_w = int(width * 0.78)
    frame_x = (width - frame_w) // 2
    frame_y = max(text_top + int(height * 0.018), int(height * 0.18))
    frame_h = height - frame_y - int(height * 0.03)
    bezel = max(14, int(frame_w * 0.028))
    radius = int(frame_w * 0.12)
    bezel_color = (8, 8, 12, 255)
    halo = 70 if luma <= 150 else 36
    draw.rounded_rectangle(
        (frame_x - 4, frame_y - 4, frame_x + frame_w + 4, frame_y + frame_h + 4),
        radius=radius + 6,
        fill=(accent[0], accent[1], accent[2], halo),
    )
    draw.rounded_rectangle(
        (frame_x, frame_y, frame_x + frame_w, frame_y + frame_h),
        radius=radius,
        fill=bezel_color,
    )
    inner_w = frame_w - bezel * 2
    inner_h = frame_h - bezel * 2
    scale = max(inner_w / screen.width, inner_h / screen.height)
    cover_src = screen.resize(
        (max(1, int(screen.width * scale)), max(1, int(screen.height * scale))),
        Image.Resampling.LANCZOS,
    )
    cx = max(0, (cover_src.width - inner_w) // 2)
    cy = 0 if (args.fit or "top") == "top" else max(0, (cover_src.height - inner_h) // 2)
    cy = min(cy, max(0, cover_src.height - inner_h))
    cover = cover_src.crop((cx, cy, cx + inner_w, cy + inner_h))
    paste_rounded(canvas, cover, (frame_x + bezel, frame_y + bezel), radius - 12)

    island_w = int(inner_w * 0.34)
    island_h = max(22, int(bezel * 1.55))
    island_x = frame_x + (frame_w - island_w) // 2
    island_y = frame_y + int(bezel * 0.42)
    draw.rounded_rectangle(
        (island_x, island_y, island_x + island_w, island_y + island_h),
        radius=island_h // 2,
        fill=bezel_color,
    )

    bar_w = int(inner_w * 0.28)
    bar_x = frame_x + bezel + (inner_w - bar_w) // 2
    bar_y = frame_y + frame_h - bezel - 16
    draw.rounded_rectangle((bar_x, bar_y, bar_x + bar_w, bar_y + 7), radius=4, fill=(255, 255, 255, 150))

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
    p.add_argument("--align", default="")
    p.add_argument("--bg-hex")
    p.add_argument("--accent-hex")
    p.add_argument("--fit", default="top")
    compose(p.parse_args())


if __name__ == "__main__":
    main()

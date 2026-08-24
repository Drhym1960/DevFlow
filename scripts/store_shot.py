#!/usr/bin/env python3
"""Compose an App Store marketing screenshot around the client's real UI in an iPhone 16."""

from __future__ import annotations

import argparse
import colorsys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

SANS = "/usr/share/fonts/truetype/macos/Inter-Regular.ttf"
SANS_MED = "/usr/share/fonts/truetype/macos/Inter-Medium.ttf"
SANS_BOLD = "/usr/share/fonts/truetype/macos/Inter-Bold.ttf"
SERIF_BOLD = "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf"
if not Path(SANS).exists():
    SANS = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    SANS_MED = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
    SANS_BOLD = SANS_MED
if not Path(SERIF_BOLD).exists():
    SERIF_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"

# iPhone 16 logical screen is 393 x 852 pt at 3x (1179 x 2556).
IPHONE16_PT = (393, 852)
STATUS_PT = 59
ISLAND_PT = (126, 37)


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, max(8, size))


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
        key=lambda p: colorsys.rgb_to_hsv(p[0] / 255, p[1] / 255, p[2] / 255)[1]
        * colorsys.rgb_to_hsv(p[0] / 255, p[1] / 255, p[2] / 255)[2],
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


def cover_top(screen: Image.Image, box: tuple[int, int]) -> Image.Image:
    inner_w, inner_h = box
    scale = max(inner_w / screen.width, inner_h / screen.height)
    cover_src = screen.resize(
        (max(1, int(screen.width * scale)), max(1, int(screen.height * scale))),
        Image.Resampling.LANCZOS,
    )
    cx = max(0, (cover_src.width - inner_w) // 2)
    return cover_src.crop((cx, 0, cx + inner_w, inner_h))


def draw_status_icons(draw: ImageDraw.ImageDraw, right: int, cy: int, ink: tuple[int, int, int], scale: float) -> None:
    x = right
    # Battery
    bw, bh = int(27 * scale), int(13 * scale)
    x -= bw
    draw.rounded_rectangle((x, cy - bh // 2, x + bw, cy + bh // 2), radius=max(2, int(3 * scale)), outline=ink, width=max(1, int(1.5 * scale)))
    nip = max(2, int(2 * scale))
    draw.rectangle((x + bw, cy - nip, x + bw + nip, cy + nip), fill=ink)
    pad = max(2, int(2 * scale))
    draw.rounded_rectangle((x + pad, cy - bh // 2 + pad, x + bw - pad, cy + bh // 2 - pad), radius=1, fill=ink)
    x -= int(10 * scale)
    # Wifi
    for i, r in enumerate((int(11 * scale), int(7 * scale), int(3 * scale))):
        bbox = (x - r, cy - r + int(2 * scale), x + r, cy + r + int(2 * scale))
        draw.arc(bbox, 200, 340, fill=ink, width=max(1, int(1.8 * scale)))
    draw.ellipse((x - int(1.6 * scale), cy + int(2 * scale), x + int(1.6 * scale), cy + int(5.2 * scale)), fill=ink)
    x -= int(22 * scale)
    # Cellular bars
    for i, h in enumerate((5, 8, 11, 14)):
        bh = int(h * scale)
        bx = x + int(i * 4.2 * scale)
        draw.rounded_rectangle((bx, cy + int(7 * scale) - bh, bx + int(3 * scale), cy + int(7 * scale)), radius=1, fill=ink)


def draw_dynamic_island(draw: ImageDraw.ImageDraw, cx: int, y: int, w: int, h: int) -> None:
    x0 = cx - w // 2
    draw.rounded_rectangle((x0, y, x0 + w, y + h), radius=h // 2, fill=(8, 8, 10, 255))
    cam = max(8, int(h * 0.42))
    gap = int(w * 0.18)
    draw.ellipse((cx + gap - cam // 2, y + (h - cam) // 2, cx + gap + cam // 2, y + (h + cam) // 2), fill=(20, 24, 32, 255))
    draw.ellipse(
        (cx + gap - cam // 4, y + h // 2 - cam // 4, cx + gap + cam // 6, y + h // 2 + cam // 6),
        fill=(28, 48, 78, 255),
    )
    sensor = max(6, int(h * 0.28))
    draw.ellipse((cx - gap - sensor // 2, y + (h - sensor) // 2, cx - gap + sensor // 2, y + (h + sensor) // 2), fill=(16, 16, 18, 255))


def paste_iphone16(
    canvas: Image.Image,
    screen: Image.Image,
    frame: tuple[int, int, int, int],
    ink: tuple[int, int, int],
) -> None:
    draw = ImageDraw.Draw(canvas, "RGBA")
    frame_x, frame_y, frame_w, frame_h = frame
    # ~1.7% side bezel like iPhone 16, plus a slightly thicker chin/forehead.
    bezel = max(10, int(frame_w * 0.018))
    radius = int(frame_w * 0.14)
    shell = (18, 18, 20, 255)

    shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle(
        (frame_x + 10, frame_y + 18, frame_x + frame_w + 10, frame_y + frame_h + 18),
        radius=radius,
        fill=(0, 0, 0, 55),
    )
    canvas.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(18)))
    draw = ImageDraw.Draw(canvas, "RGBA")

    draw.rounded_rectangle((frame_x, frame_y, frame_x + frame_w, frame_y + frame_h), radius=radius, fill=shell)
    # Aluminium edge highlight
    draw.rounded_rectangle(
        (frame_x + 1, frame_y + 1, frame_x + frame_w - 1, frame_y + frame_h - 1),
        radius=radius - 1,
        outline=(72, 72, 76, 180),
        width=2,
    )

    inner_x = frame_x + bezel
    inner_y = frame_y + bezel
    inner_w = frame_w - bezel * 2
    inner_h = frame_h - bezel * 2
    pt = inner_w / IPHONE16_PT[0]
    status_h = max(36, int(STATUS_PT * pt))
    island_w = int(ISLAND_PT[0] * pt)
    island_h = max(22, int(ISLAND_PT[1] * pt))
    screen_radius = max(24, radius - bezel)

    sample = screen.resize((8, 8), Image.Resampling.BOX).getpixel((1, 1))
    bar_ink = (244, 241, 234) if luma_of(sample) < 140 else ink
    bar = Image.new("RGB", (inner_w, status_h), sample)
    content = cover_top(screen, (inner_w, inner_h - status_h))
    phone_screen = Image.new("RGB", (inner_w, inner_h), sample)
    phone_screen.paste(bar, (0, 0))
    phone_screen.paste(content, (0, status_h))
    paste_rounded(canvas, phone_screen, (inner_x, inner_y), screen_radius)

    time_face = font(SANS_BOLD, max(14, int(status_h * 0.38)))
    time_y = inner_y + int(status_h * 0.28)
    draw.text((inner_x + int(inner_w * 0.07), time_y), "9:41", font=time_face, fill=bar_ink)
    draw_status_icons(draw, inner_x + inner_w - int(inner_w * 0.06), inner_y + status_h // 2 + 1, bar_ink, max(0.7, pt))
    draw_dynamic_island(draw, inner_x + inner_w // 2, inner_y + max(6, int(8 * pt)), island_w, island_h)

    bar_w = int(inner_w * 0.30)
    bar_x = inner_x + (inner_w - bar_w) // 2
    bar_y = inner_y + inner_h - max(14, int(12 * pt))
    draw.rounded_rectangle((bar_x, bar_y, bar_x + bar_w, bar_y + max(5, int(5 * pt))), radius=3, fill=(40, 36, 32, 160))


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
    title_face = font(SERIF_BOLD, int(width * 0.068) if width >= 1170 else int(width * 0.064))
    sub_face = font(SANS_MED, int(width * 0.027) if width >= 1170 else int(width * 0.03))
    align = (args.align or ("center" if luma > 150 else "left")).lower()

    pad = int(width * 0.08)
    text_top = int(height * 0.048)
    max_text = width - pad * 2
    title_lh = int(width * 0.074)
    sub_lh = int(width * 0.036)

    def draw_lines(text, face, fill, line_h, gap=0):
        nonlocal text_top
        lines = wrap(draw, text, face, max_text)
        for i, line in enumerate(lines):
            tw = draw.textlength(line, font=face)
            x = (width - tw) / 2 if align == "center" else pad
            draw.text((x, text_top + i * line_h), line, font=face, fill=fill)
        text_top += line_h * min(3, max(1, len(lines))) + gap

    if headline:
        draw_lines(headline, title_face, ink, title_lh, 8)
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
            text_top += 20

    screen = Image.open(args.screen).convert("RGB")
    frame_w = int(width * 0.80)
    frame_x = (width - frame_w) // 2
    frame_y = max(text_top + int(height * 0.012), int(height * 0.16))
    frame_h = height - frame_y + int(height * 0.02)
    paste_iphone16(canvas, screen, (frame_x, frame_y, frame_w, frame_h), ink)

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(out, "PNG", optimize=True)


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--screen", required=True)
    p.add_argument("--sample")
    p.add_argument("--bg")
    p.add_argument("--out", required=True)
    p.add_argument("--size", default="1320x2868")
    p.add_argument("--headline", default="")
    p.add_argument("--sub", default="")
    p.add_argument("--align", default="")
    p.add_argument("--bg-hex")
    p.add_argument("--accent-hex")
    p.add_argument("--fit", default="top")
    compose(p.parse_args())


if __name__ == "__main__":
    main()

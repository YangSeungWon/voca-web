#!/usr/bin/env python3
"""
Pad screenshots to App Store Connect allowed sizes.

- Reads images in current folder (png/jpg/jpeg/webp)
- Fits them into a target canvas while preserving aspect ratio
- Centers the image and pads remaining area with a background color
- Saves to ./out

Usage:
  python pad_appstore.py
  python pad_appstore.py --w 1290 --h 2796
  python pad_appstore.py --w 2796 --h 1290 --bg 0,0,0
  python pad_appstore.py --scale-mode contain   # default
  python pad_appstore.py --scale-mode cover     # fill canvas (may crop)
"""

import os
import argparse
from pathlib import Path
from PIL import Image, ImageOps

SUPPORTED_EXT = {".png", ".jpg", ".jpeg", ".webp"}


def parse_rgb(s: str):
    parts = s.split(",")
    if len(parts) != 3:
        raise ValueError("bg must be like R,G,B (e.g., 255,255,255)")
    r, g, b = (int(x.strip()) for x in parts)
    for v in (r, g, b):
        if v < 0 or v > 255:
            raise ValueError("RGB values must be 0..255")
    return (r, g, b)


def contain_resize(img: Image.Image, target_w: int, target_h: int) -> Image.Image:
    """Resize to fit within target canvas (no cropping)."""
    iw, ih = img.size
    scale = min(target_w / iw, target_h / ih)
    new_size = (max(1, int(round(iw * scale))), max(1, int(round(ih * scale))))
    return img.resize(new_size, Image.LANCZOS)


def cover_resize(img: Image.Image, target_w: int, target_h: int) -> Image.Image:
    """Resize to cover target canvas (may crop)."""
    iw, ih = img.size
    scale = max(target_w / iw, target_h / ih)
    new_size = (max(1, int(round(iw * scale))), max(1, int(round(ih * scale))))
    resized = img.resize(new_size, Image.LANCZOS)

    # Center crop to target size
    left = (resized.width - target_w) // 2
    top = (resized.height - target_h) // 2
    return resized.crop((left, top, left + target_w, top + target_h))


def pad_to_canvas(img: Image.Image, target_w: int, target_h: int, bg_rgb) -> Image.Image:
    """Place img centered on a background canvas."""
    canvas = Image.new("RGB", (target_w, target_h), bg_rgb)
    x = (target_w - img.width) // 2
    y = (target_h - img.height) // 2
    canvas.paste(img, (x, y))
    return canvas


def open_as_rgb(path: Path) -> Image.Image:
    img = Image.open(path)
    # Convert RGBA -> RGB with white background to avoid black transparency
    if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
        bg = Image.new("RGBA", img.size, (255, 255, 255, 255))
        bg.paste(img, mask=img.convert("RGBA").split()[-1])
        img = bg.convert("RGB")
    else:
        img = img.convert("RGB")
    return img


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--w", type=int, default=1290, help="target width (default 1290)")
    ap.add_argument("--h", type=int, default=2796, help="target height (default 2796)")
    ap.add_argument("--bg", type=str, default="255,255,255", help="background RGB, e.g. 255,255,255")
    ap.add_argument("--scale-mode", choices=["contain", "cover"], default="contain",
                    help="contain: no crop (pads). cover: fill canvas (may crop).")
    ap.add_argument("--suffix", type=str, default="", help="optional filename suffix")
    args = ap.parse_args()

    target_w, target_h = args.w, args.h
    bg_rgb = parse_rgb(args.bg)

    out_dir = Path("out")
    out_dir.mkdir(exist_ok=True)

    here = Path(".")
    paths = [p for p in here.iterdir() if p.is_file() and p.suffix.lower() in SUPPORTED_EXT]

    if not paths:
        print("No images found in current folder.")
        return

    print(f"Found {len(paths)} image(s). Output -> {out_dir.resolve()}")
    print(f"Target canvas: {target_w}x{target_h}, bg={bg_rgb}, mode={args.scale_mode}")

    for p in paths:
        try:
            img = open_as_rgb(p)

            if args.scale_mode == "contain":
                resized = contain_resize(img, target_w, target_h)
                final = pad_to_canvas(resized, target_w, target_h, bg_rgb)
            else:
                final = cover_resize(img, target_w, target_h)

            stem = p.stem + (args.suffix if args.suffix else "")
            out_path = out_dir / f"{stem}_{target_w}x{target_h}.png"
            final.save(out_path, format="PNG", optimize=True)

            print(f"OK  {p.name} -> {out_path.name}")
        except Exception as e:
            print(f"FAIL {p.name}: {e}")


if __name__ == "__main__":
    main()


"""Prepare photos for the website.

Usage (from the enesmercan-site folder):
    python tools/optimize_images.py path\\to\\photo.jpg              -> assets/img/portrait.jpg
    python tools/optimize_images.py path\\to\\photo.png --name launch -> assets/img/launch.jpg

What it does:
  * flattens transparent areas onto black (a cut-out portrait blends into the page)
  * converts to greyscale (the site is monochrome; it also makes files smaller)
  * scales the image so its longer side is at most 1600 px (pass --max to change)
  * saves a progressive JPEG at quality 82 and prints the size (aim for < 200 KB)

Needs Pillow once:  python -m pip install --user pillow
"""
import argparse
import sys
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Pillow is not installed. Run:  python -m pip install --user pillow")

SITE = Path(__file__).resolve().parent.parent


def main() -> None:
    parser = argparse.ArgumentParser(description="Optimise a photo for enesmercan.com")
    parser.add_argument("source", type=Path, help="original photo (jpg, png, webp...)")
    parser.add_argument("--name", default="portrait", help="output file name without extension")
    parser.add_argument("--max", type=int, default=1600, help="longest side in pixels")
    parser.add_argument("--quality", type=int, default=82)
    args = parser.parse_args()

    img = Image.open(args.source)
    img = ImageOps.exif_transpose(img)  # respect phone rotation

    if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
        rgba = img.convert("RGBA")
        black = Image.new("RGBA", rgba.size, (0, 0, 0, 255))
        img = Image.alpha_composite(black, rgba)

    img = img.convert("L")
    img.thumbnail((args.max, args.max), Image.LANCZOS)

    out = SITE / "assets" / "img" / f"{args.name}.jpg"
    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out, "JPEG", quality=args.quality, optimize=True, progressive=True)
    print(f"Saved {out.relative_to(SITE)}  {img.width}x{img.height}px  {out.stat().st_size / 1024:.0f} KB")


if __name__ == "__main__":
    main()

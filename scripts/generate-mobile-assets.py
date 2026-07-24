#!/usr/bin/env python3
"""Generate Capacitor / Play Store icon and splash assets from the clinic logo."""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
LOGO = ROOT / "public" / "logo.png"
RESOURCES = ROOT / "resources"
STORE = ROOT / "play-store" / "listing-assets"

BG = (11, 58, 110, 255)  # #0B3A6E


def make_icon(src: Image.Image, size: int, pad_ratio: float = 0.18) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), BG)
    inner = int(size * (1 - pad_ratio * 2))
    logo = src.resize((inner, inner), Image.Resampling.LANCZOS)
    offset = (size - inner) // 2
    canvas.alpha_composite(logo, (offset, offset))
    return canvas


def make_splash(src: Image.Image, width: int, height: int) -> Image.Image:
    canvas = Image.new("RGBA", (width, height), BG)
    logo_size = min(width, height) // 3
    logo = src.resize((logo_size, logo_size), Image.Resampling.LANCZOS)
    x = (width - logo_size) // 2
    y = (height - logo_size) // 2
    canvas.alpha_composite(logo, (x, y))
    return canvas


def main() -> None:
    RESOURCES.mkdir(parents=True, exist_ok=True)
    STORE.mkdir(parents=True, exist_ok=True)

    src = Image.open(LOGO).convert("RGBA")

    icon = make_icon(src, 1024)
    icon.save(RESOURCES / "icon.png")
    icon.resize((512, 512), Image.Resampling.LANCZOS).save(STORE / "icon-512.png")

    # Adaptive / feature graphic helpers
    feature = Image.new("RGBA", (1024, 500), BG)
    logo = src.resize((320, 320), Image.Resampling.LANCZOS)
    feature.alpha_composite(logo, ((1024 - 320) // 2, (500 - 320) // 2))
    feature.convert("RGB").save(STORE / "feature-graphic-1024x500.png")

    splash = make_splash(src, 2732, 2732)
    splash.save(RESOURCES / "splash.png")
    splash.save(RESOURCES / "splash-dark.png")

    print(f"Wrote assets under {RESOURCES} and {STORE}")


if __name__ == "__main__":
    main()

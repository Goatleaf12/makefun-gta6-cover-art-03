#!/usr/bin/env python3
"""Fetch the three OFL display fonts used by Sunset State Cover Studio.

Build tooling only (lives outside app/). Downloads the font files from the
Google Fonts GitHub repository into app/fonts/ so the app can self-host
them with no network access at run time. Each file is checked to be a
plausible TrueType/OpenType binary before it is kept.
"""
import pathlib
import sys
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
DEST = ROOT / "app" / "fonts"

FONTS = [
    (
        "https://github.com/google/fonts/raw/main/ofl/anton/Anton-Regular.ttf",
        "Anton-Regular.ttf",
    ),
    (
        "https://github.com/google/fonts/raw/main/ofl/pacifico/Pacifico-Regular.ttf",
        "Pacifico-Regular.ttf",
    ),
    (
        "https://github.com/google/fonts/raw/main/ofl/oswald/Oswald%5Bwght%5D.ttf",
        "Oswald.ttf",
    ),
]

TTF_MAGICS = (b"\x00\x01\x00\x00", b"OTTO", b"true", b"ttcf")


def fetch(url: str, name: str) -> None:
    req = urllib.request.Request(url, headers={"User-Agent": "cover-studio-build/1.0"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = resp.read()
    if len(data) < 20000 or not data.startswith(TTF_MAGICS):
        raise SystemExit(f"{name}: downloaded bytes do not look like a font ({len(data)} bytes)")
    DEST.mkdir(parents=True, exist_ok=True)
    (DEST / name).write_bytes(data)
    print(f"{name}: {len(data)} bytes")


def main() -> int:
    for url, name in FONTS:
        fetch(url, name)
    return 0


if __name__ == "__main__":
    sys.exit(main())

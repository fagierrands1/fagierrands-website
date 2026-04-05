"""
Generate a QR code that points to a single landing URL. That landing page should
redirect users to the correct store based on their device (iOS -> App Store,
Android -> Play Store).

Usage:
  python generate_qr.py --out qr_fagierrand.png

Optional args:
  --data   Custom URL to encode (defaults to LANDING_URL)
  --out    Output filename (defaults to qr_fagierrand.png)
  --size   Box size (pixels per QR module, default 10)
  --border Border size (modules, default 4)
  --fg     Foreground color (default black)
  --bg     Background color (default white)
"""

from __future__ import annotations
import argparse
import sys

import qrcode
from qrcode.constants import ERROR_CORRECT_M

# Store links (for reference/documentation)
APP_STORE_URL = "https://apps.apple.com/ke/app/fagierrands/id6751052839"
PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.fagierrand.fagitone"

# Your landing URL that performs device-based redirect
LANDING_URL = "https://fagierrand.fagitone.com/fagierrandapp"


def generate_qr(
    data: str,
    out_file: str = "qr_fagierrand.png",
    box_size: int = 10,
    border: int = 4,
    fill_color: str = "black",
    back_color: str = "white",
) -> None:
    """Create and save a QR code PNG for the provided data string."""
    qr = qrcode.QRCode(
        version=None,  # auto-fit
        error_correction=ERROR_CORRECT_M,  # good balance of density and resilience
        box_size=box_size,
        border=border,
    )
    qr.add_data(data)
    qr.make(fit=True)

    img = qr.make_image(fill_color=fill_color, back_color=back_color)
    img.save(out_file)


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate a QR code PNG.")
    parser.add_argument(
        "--data",
        default=LANDING_URL,
        help=f"URL to encode in the QR (default: {LANDING_URL})",
    )
    parser.add_argument(
        "--out",
        default="qr_fagierrand.png",
        help="Output PNG filename (default: qr_fagierrand.png)",
    )
    parser.add_argument("--size", type=int, default=10, help="Box size (default: 10)")
    parser.add_argument("--border", type=int, default=4, help="Border (default: 4)")
    parser.add_argument("--fg", default="black", help="Foreground color (default: black)")
    parser.add_argument("--bg", default="white", help="Background color (default: white)")
    return parser.parse_args(argv)


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    generate_qr(
        data=args.data,
        out_file=args.out,
        box_size=args.size,
        border=args.border,
        fill_color=args.fg,
        back_color=args.bg,
    )
    print(f"QR code saved to {args.out}\nEncoded URL: {args.data}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
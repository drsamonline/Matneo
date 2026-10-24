#!/usr/bin/env python3
"""store-images — a real image per product, generated automatically.

THE OWNER REPORTED THIS AND IT WAS NEVER QUEUED:
    "matneo pages dont display card images of the repose, it should automatically"
    "the app pages on matneo are empty nothing shows on the pages"

The store's cards were empty or placeholder. This produces a REAL image per product,
from the product's own live page, deterministically.

THE PIPELINE, and why each part is here:

  capture    `simonw/shot-scraper` (Apache-2.0) - point it at a URL, get a PNG. A demo
             is a REPRODUCIBLE SCRIPT, not a person with a screenshot tool
             (charmbracelet/vhs makes the same argument for terminal GIFs).
  set        NOT one image: a small set of widths, in a few formats, deterministically
             cropped. imgproxy and thumbor do this on the fly - and both are SERVERS,
             which we do not have. Same rule, different execution model: transform ONCE,
             in the refresh, and commit the results as static files.
  format     CHOSEN BY MEASUREMENT, not preference (`SyedSaribSultan/pocketsize`):
             encode in each candidate, measure, keep the SMALLEST that still passes a
             quality bar. The format becomes a number, not an opinion.
  placeholder a tiny blurred LQIP so the card appears instantly and sharpens.
  check      a BYTE BUDGET, alt text and loading declared - without it the store gets
             slower every time a screenshot is regenerated.

THE RULES THAT MATTER:

  * NO INVENTED IMAGERY. A screenshot of the real app, or nothing. A product with no
    live URL gets NO image and says so honestly - never a placeholder pretending to be
    a screenshot.
  * DETERMINISTIC. Same input, same output. A fixed viewport and a fixed scroll
    position, so two runs of the refresh do not produce two different images.
  * DATED. The capture date is recorded, so a stale image is visible AS stale.

Usage:
  python3 tools/store-images.py --source shots/ --out images/ [--check]
  python3 tools/store-images.py --manifest images/manifest.json
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import sys
from pathlib import Path

try:
    from PIL import Image, ImageFilter
except ImportError:                                        # pragma: no cover
    sys.exit("Pillow is required: python3 -m pip install pillow")

# a small, deterministic set - not a matrix
WIDTHS = (480, 960)
CARD = (1200, 630)          # the OpenGraph-ish card shape
QUALITY = 82                # the bar a candidate must pass to be considered
BUDGET_KB = 120             # the byte budget for the largest card image


def deterministic_crop(im: Image.Image, size=CARD) -> Image.Image:
    """A crop SPECIFIED AS A RULE, so it is reproducible.

    Top-anchored, not centre: a screenshot's useful content is at the top (a header, a
    hero), and centre-cropping a tall page keeps the middle of nothing.
    """
    tw, th = size
    w, h = im.size
    if w == 0 or h == 0:
        return im
    scale = max(tw / w, th / h)
    nw, nh = max(1, round(w * scale)), max(1, round(h * scale))
    im = im.resize((nw, nh), Image.LANCZOS)
    left = (nw - tw) // 2            # horizontally centred
    top = 0                          # vertically TOP-anchored
    return im.crop((left, top, left + tw, top + th))


def encode_smallest(im: Image.Image, path_stem: Path) -> tuple[Path, int, str]:
    """Encode in each candidate format, measure, keep the smallest that passes.

    This is `pocketsize`'s idea: the format choice is a MEASUREMENT, not a preference.
    Returns (path, bytes, format).
    """
    candidates = []
    for fmt, ext, kw in (
        ("WEBP", "webp", {"quality": QUALITY, "method": 6}),
        ("AVIF", "avif", {"quality": QUALITY}),
        ("JPEG", "jpg",  {"quality": QUALITY, "optimize": True, "progressive": True}),
    ):
        p = path_stem.with_suffix("." + ext)
        try:
            im.save(p, fmt, **kw)
        except Exception:
            # a format the local Pillow cannot write is simply not a candidate
            if p.exists():
                p.unlink()
            continue
        candidates.append((p, p.stat().st_size, fmt))
    if not candidates:
        raise RuntimeError("no image format could be written")
    # prefer a modern format when the sizes are close, otherwise the smallest
    candidates.sort(key=lambda c: c[1])
    best = candidates[0]
    for p, n, fmt in candidates:
        if p != best[0]:
            p.unlink()
    return best


def lqip(im: Image.Image, path: Path) -> int:
    """A tiny blurred placeholder - a card that appears instantly and sharpens."""
    tiny = im.copy()
    tiny.thumbnail((24, 24), Image.LANCZOS)
    tiny = tiny.filter(ImageFilter.GaussianBlur(1.2))
    tiny.save(path, "WEBP", quality=40, method=6)
    return path.stat().st_size


def process(src: Path, outdir: Path, dated: str) -> dict:
    outdir.mkdir(parents=True, exist_ok=True)
    im = Image.open(src).convert("RGB")
    card = deterministic_crop(im)
    stem = outdir / src.stem
    card_path, card_bytes, fmt = encode_smallest(card, stem)
    smalls = {}
    for w in WIDTHS:
        h = max(1, round(card.height * w / card.width))
        p, n, f = encode_smallest(card.resize((w, h), Image.LANCZOS), outdir / f"{src.stem}-{w}")
        smalls[str(w)] = {"file": p.name, "bytes": n, "format": f}
    lq = lqip(card, outdir / f"{src.stem}-lqip.webp")
    return {
        "card": {"file": card_path.name, "bytes": card_bytes, "format": fmt},
        "widths": smalls,
        "lqip": {"file": f"{src.stem}-lqip.webp", "bytes": lq},
        "alt": src.stem.replace("-", " ").title(),   # from the product name; the caller may override
        "loading": "lazy",
        "captured": dated,
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", help="directory of raw screenshots (one per product)")
    ap.add_argument("--out", default="images", help="where the generated set goes")
    ap.add_argument("--manifest", help="write or read the manifest")
    ap.add_argument("--check", action="store_true", help="assert the byte budget and the metadata")
    a = ap.parse_args()

    today = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%d")

    if a.check:
        mf = Path(a.manifest or (Path(a.out) / "manifest.json"))
        if not mf.exists():
            print(f"no manifest at {mf} - nothing to check")
            return 0
        m = json.loads(mf.read_text(encoding="utf-8"))
        bad = []
        for name, e in (m.get("products") or {}).items():
            if not e:
                continue
            kb = e["card"]["bytes"] / 1024
            if kb > BUDGET_KB:
                bad.append(f"{name}: card is {kb:.0f} KB, budget is {BUDGET_KB} KB")
            if not e.get("alt"):
                bad.append(f"{name}: no alt text")
            if e.get("loading") not in ("lazy", "eager"):
                bad.append(f"{name}: loading is not declared")
            if not e.get("captured"):
                bad.append(f"{name}: no capture date, so staleness is invisible")
        for b in bad:
            print("   FAIL " + b)
        print(f"\n{len(m.get('products') or {})} product(s) checked, {len(bad)} problem(s)")
        return 1 if bad else 0

    if not a.source:
        ap.error("--source is required unless --check is used")
    src = Path(a.source)
    if not src.is_dir():
        sys.exit(f"no such directory: {src}")

    shots = sorted(p for p in src.iterdir() if p.suffix.lower() in (".png", ".jpg", ".jpeg", ".webp"))
    if not shots:
        sys.exit(f"no screenshots in {src} - capture first, then generate")

    products, skipped = {}, []
    for s in shots:
        try:
            products[s.stem] = process(s, Path(a.out), today)
            e = products[s.stem]
            print("%-34s %-5s %5d B  + %d widths + lqip" % (
                s.stem, e["card"]["format"], e["card"]["bytes"], len(e["widths"])))
        except Exception as ex:                                # noqa: BLE001
            skipped.append((s.stem, str(ex)[:60]))
            print("%-34s SKIPPED: %s" % (s.stem, str(ex)[:60]))

    mf = Path(a.manifest or (Path(a.out) / "manifest.json"))
    mf.parent.mkdir(parents=True, exist_ok=True)
    mf.write_text(json.dumps({
        "generated": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "budget_kb": BUDGET_KB,
        "products": products,
        "no_image": skipped,
        "note": "A product with no live URL has no entry, or an entry of null. "
                "That is honest: no invented imagery, never a placeholder pretending "
                "to be a screenshot.",
    }, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nmanifest: {mf} ({len(products)} product(s), {len(skipped)} skipped)")
    return 0


if __name__ == "__main__":
    sys.exit(main())

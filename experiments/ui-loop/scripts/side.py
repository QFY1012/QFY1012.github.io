"""Two versions of a page side by side, for the 需求 judge: A on the left, B on the right, each image
one band of the page at the same height in both (the tiles are cut at the same offsets from the top).

    python3 scripts/side.py <workspace A> <workspace B> <first tile> <out dir>

Writes side-0.png (the two thumbnails) and side-<n>.png (tile n of both, from <first tile> on;
a version that ends earlier leaves its half blank) and prints the file names, one per line."""
import json, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

wa, wb, first, out = Path(sys.argv[1]), Path(sys.argv[2]), int(sys.argv[3]), Path(sys.argv[4])
out.mkdir(parents=True, exist_ok=True)
GAP, HEAD = 24, 48
font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 32)


def pair(left, right, name):
    w = max(i.width for i in (left, right) if i)
    h = max(i.height for i in (left, right) if i)
    im = Image.new("RGB", (2 * w + GAP, h + HEAD), "white")
    d = ImageDraw.Draw(im)
    d.rectangle([w, 0, w + GAP - 1, h + HEAD], fill=(160, 160, 160))
    for x, label, src in ((0, "A", left), (w + GAP, "B", right)):
        d.text((x + 12, 6), label, fill="black", font=font)
        if src:
            im.paste(src.convert("RGB"), (x, HEAD))
    im.save(out / name)
    print(name)


pair(Image.open(wa / "thumb.png"), Image.open(wb / "thumb.png"), "side-0.png")
ta, tb = (json.loads((w / "tiles.json").read_text()) for w in (wa, wb))
for n in range(first, max(len(ta), len(tb))):
    pair(Image.open(wa / ta[n]["file"]) if n < len(ta) else None, Image.open(wb / tb[n]["file"]) if n < len(tb) else None, f"side-{n + 1}.png")

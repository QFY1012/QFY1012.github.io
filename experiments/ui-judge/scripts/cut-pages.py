# Cut the validation screenshots into what the judge sees:
#   thumb.png        whole page, 624px wide (overall view)
#   clean-N.png      640px tiles from top to bottom, 64px overlap (detail)
#   _pairs/<a>__<b>.png  two whole pages side by side at the same scale, a left
import itertools, json, os
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
OUT = os.path.join(ROOT, "out", "validate")
pages = sorted(d for d in os.listdir(OUT) if not d.startswith("_"))
shots = {}
for v in pages:
    d = os.path.join(OUT, v)
    im = Image.open(os.path.join(d, "shot.png")).convert("RGB")
    shots[v] = im
    im.resize((624, round(im.height * 624 / im.width)), Image.LANCZOS).save(os.path.join(d, "thumb.png"))
    tiles, y = [], 0
    while True:
        h = min(640, im.height - y)
        f = f"clean-{len(tiles) + 1}.png"
        im.crop((0, y, im.width, y + h)).save(os.path.join(d, f))
        tiles.append({"file": f, "y": y, "h": h})
        if y + h >= im.height:
            break
        y += 640 - 64
    json.dump(tiles, open(os.path.join(d, "clean-tiles.json"), "w"))
    print(v, im.size, len(tiles))

# Side by side: each page at 720px wide, 48px gutter, top aligned on white.
os.makedirs(os.path.join(OUT, "_pairs"), exist_ok=True)
W, GAP = 720, 48
for report in sorted({p.split("-")[0] for p in pages}):
    for a, b in itertools.permutations([p for p in pages if p.startswith(report + "-")], 2):
        ia, ib = (shots[x].resize((W, round(shots[x].height * W / shots[x].width)), Image.LANCZOS) for x in (a, b))
        out = Image.new("RGB", (2 * W + GAP, max(ia.height, ib.height)), "white")
        out.paste(ia, (0, 0))
        out.paste(ib, (W + GAP, 0))
        out.save(os.path.join(OUT, "_pairs", f"{a}__{b}.png"))
print("pairs done")

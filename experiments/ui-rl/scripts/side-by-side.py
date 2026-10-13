"""把同一节的 A、B 两张截图左右拼成一张,上方标 A、B。lib/judges.mjs 的 ia2p 调用。

    python3 side-by-side.py <A 的截图或 -> <B 的截图或 -> <输出>

某一边这一节的截图张数少时传 -,那一边留白。
"""
import sys
from PIL import Image, ImageDraw, ImageFont

GAP, HEAD = 32, 56
a, b, out = sys.argv[1:4]
ims = [Image.open(p).convert("RGB") if p != "-" else None for p in (a, b)]
w = max(i.width for i in ims if i)
h = max(i.height for i in ims if i)
o = Image.new("RGB", (2 * w + GAP, h + HEAD), "white")
d = ImageDraw.Draw(o)
try:
    font = ImageFont.truetype("/usr/share/fonts/opentype/unifont/unifont.otf", 40)
except OSError:
    font = ImageFont.load_default()
for k, (im, name) in enumerate(zip(ims, "AB")):
    x = k * (w + GAP)
    d.text((x + 16, 8), f"{name} 版", fill=(0, 0, 0), font=font)
    if im:
        o.paste(im, (x, HEAD))
d.rectangle([w + GAP // 2 - 2, 0, w + GAP // 2 + 1, h + HEAD], fill=(160, 160, 160))
o.save(out)

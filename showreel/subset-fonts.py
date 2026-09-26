"""Builds a tiny Noto Sans SC fallback for the few characters the site's PingFang subset lacks.

The reel is set in PingFang (public/fonts), which only covers the characters used on the site.
This finds every character in composition.html that PingFang is missing (热, 皮肤, 诊断 …), pulls
those glyphs out of the @fontsource/noto-sans-sc package and writes one small woff2 per weight,
used only as a per-character fallback.

    npm pack @fontsource/noto-sans-sc && tar xzf fontsource-noto-sans-sc-*.tgz
    python3 showreel/subset-fonts.py package/files          (needs: pip install fonttools brotli)

Re-run whenever the Chinese copy changes. Noto Sans SC is SIL OFL (see fonts/OFL-NotoSansSC.txt).
"""
import os
import sys
from fontTools.merge import Merger
from fontTools.subset import Options, Subsetter
from fontTools.ttLib import TTFont

here = os.path.dirname(os.path.abspath(__file__))
src_dir = sys.argv[1]
text = open(os.path.join(here, 'composition.html'), encoding='utf-8').read()
pingfang = set(TTFont(os.path.join(here, '..', 'public', 'fonts', 'PingFangSC-Regular.woff2')).getBestCmap())
need = {ord(c) for c in text if ord(c) >= 0x2e80} - pingfang
print('fallback glyphs:', ''.join(sorted(chr(c) for c in need)))

for weight in (400, 500):
    chunks = sorted(f for f in os.listdir(src_dir) if f.endswith(f'-{weight}-normal.woff2') and 'latin' not in f and 'vietnamese' not in f and 'cyrillic' not in f)
    picked = []
    covered = set()
    for f in chunks:
        path = os.path.join(src_dir, f)
        cmap = set(TTFont(path).getBestCmap())
        hit = (cmap & need) - covered
        if hit:
            picked.append(path)
            covered |= hit
    missing = sorted(chr(c) for c in need - covered if c >= 0x2e80)
    tmp = []
    for i, p in enumerate(picked):  # Merger wants sfnt files and subset copies of the same chunk family
        f = TTFont(p)
        f.flavor = None
        q = os.path.join(here, f'.tmp-{weight}-{i}.ttf')
        f.save(q)
        tmp.append(q)
    font = Merger().merge(tmp) if len(tmp) > 1 else TTFont(tmp[0])
    for q in tmp:
        os.remove(q)
    opts = Options()
    opts.flavor = 'woff2'
    opts.layout_features = ['*']
    sub = Subsetter(opts)
    sub.populate(unicodes=sorted(need))
    sub.subset(font)
    name = font['name']
    for rec in name.names:
        if rec.nameID in (1, 4, 16):
            rec.string = 'Noto Sans SC Fallback'
    out = os.path.join(here, 'fonts', f'noto-sans-sc-fallback-{weight}.woff2')
    font.flavor = 'woff2'
    font.save(out)
    print(f'{weight}: {len(picked)} chunks → {out} ({os.path.getsize(out) // 1024} KB)' + (f'; missing {"".join(missing)}' if missing else ''))

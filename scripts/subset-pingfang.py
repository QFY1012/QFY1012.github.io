"""Cuts the site's PingFang webfonts down to the characters the built site uses.

The site (and the showreel, which is served from it) is set in PingFang SC: the system font where it is installed,
else these subsets in public/fonts. Every character in the built pages (dist/**/*.html, *.js, *.css — the showreel
included) is kept, so nothing on the site falls back to another typeface.

    npm run build
    python3 scripts/subset-pingfang.py /path/to/PingFang        (needs: pip install fonttools brotli)

The folder holds Apple's full PingFang SC fonts (PingFangSC-Regular.otf, -Medium, -Semibold …; they stay out of the
repository). Re-run whenever the copy changes. PingFang has no Bold: Semibold is its heaviest weight and the site's 700.
The outlines are converted from CFF to TrueType (within 1/1000 em), which woff2 packs about a fifth smaller.
"""
import glob
import os
import re
import sys
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.subset import Options, Subsetter
from fontTools.ttLib import TTFont, newTable

here = os.path.dirname(os.path.abspath(__file__))
root = os.path.join(here, '..')
src_dir = sys.argv[1]
WEIGHTS = ['Regular', 'Medium', 'Semibold']  # CSS 400 · 500 · 600–700


def to_truetype(font):
    """CFF → glyf: cubic outlines become quadratic ones within 1 unit, drawn in TrueType's direction."""
    glyphs = font.getGlyphSet()
    glyf = newTable('glyf')
    glyf.glyphOrder = font.getGlyphOrder()
    glyf.glyphs = {}
    for name in glyf.glyphOrder:
        pen = TTGlyphPen(None)
        glyphs[name].draw(Cu2QuPen(pen, 1.0, reverse_direction=True))
        glyf.glyphs[name] = pen.glyph()
    del font['CFF ']
    font['glyf'], font['loca'] = glyf, newTable('loca')
    font['head'].glyphDataFormat = 0
    font['post'].formatType = 3.0
    maxp = font['maxp']
    maxp.tableVersion = 0x00010000
    for key in ('maxZones', 'maxTwilightPoints', 'maxStorage', 'maxFunctionDefs', 'maxInstructionDefs', 'maxStackElements',
                'maxSizeOfInstructions', 'maxComponentElements', 'maxComponentDepth'):
        setattr(maxp, key, 0)
    maxp.maxZones = 1
    font.sfntVersion = '\0\1\0\0'


text = set()
for ext in ('html', 'js', 'css'):
    for path in glob.glob(os.path.join(root, 'dist', '**', f'*.{ext}'), recursive=True):
        s = open(path, encoding='utf-8', errors='ignore').read()
        text |= set(re.sub(r'<!--.*?-->', '', s, flags=re.S))  # HTML comments are never shown
if not text:
    sys.exit('dist/ is empty: run `npm run build` first')

for weight in WEIGHTS:
    src = next((p for p in glob.glob(os.path.join(src_dir, '*')) if re.search(rf'pingfangsc-{weight}\.(otf|ttf)$', p, re.I)), None)
    if not src:
        print(f'{weight}: no PingFangSC-{weight} in {src_dir}, skipped')
        continue
    font = TTFont(src)
    cmap = font.getBestCmap()
    keep = sorted(ord(c) for c in text if ord(c) in cmap)
    opts = Options()
    opts.layout_features = ['*']
    opts.name_IDs = ['*']
    sub = Subsetter(opts)
    sub.populate(unicodes=keep)
    sub.subset(font)
    to_truetype(font)
    out = os.path.join(root, 'public', 'fonts', f'PingFangSC-{weight}.woff2')
    font.flavor = 'woff2'
    font.save(out)
    lacking = sorted(c for c in text if ord(c) >= 0x2e80 and ord(c) not in cmap)
    print(f'{weight}: {len(keep)} characters → public/fonts/{os.path.basename(out)} ({os.path.getsize(out) // 1024} KB)'
          + (f'; not in PingFang: {"".join(lacking)}' if lacking else ''))

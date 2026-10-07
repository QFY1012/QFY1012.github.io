"""Cuts the site's PingFang webfonts down to the characters the built site uses.

The site (and the showreel, which is served from it) is set in PingFang SC: the system font where it is installed,
else these subsets in public/fonts. Every character in the built pages (dist/**/*.html, *.js, *.css — the showreel
included) is kept, so nothing on the site falls back to another typeface.

    npm run build
    python3 scripts/subset-pingfang.py /path/to/PingFang        (needs: pip install fonttools brotli)

The folder holds the full PingFang SC 10.11 TrueType fonts (PingFang_Regular.ttf, _Medium, _Bold; they stay out of
the repository). Each subset is named as one family, PingFang SC, with its weight (400 · 500 · 700).
Re-run whenever the copy changes.
"""
import glob
import os
import re
import sys
from fontTools.subset import Options, Subsetter
from fontTools.ttLib import TTFont

here = os.path.dirname(os.path.abspath(__file__))
root = os.path.join(here, '..')
src_dir = sys.argv[1]
WEIGHTS = {'Regular': 400, 'Medium': 500, 'Bold': 700}

text = set()
for ext in ('html', 'js', 'css'):
    for path in glob.glob(os.path.join(root, 'dist', '**', f'*.{ext}'), recursive=True):
        s = open(path, encoding='utf-8', errors='ignore').read()
        text |= set(re.sub(r'<!--.*?-->', '', s, flags=re.S))  # HTML comments are never shown
if not text:
    sys.exit('dist/ is empty: run `npm run build` first')

for weight, css in WEIGHTS.items():
    src = next((p for p in glob.glob(os.path.join(src_dir, '*'))
                if re.search(rf'pingfang(sc)?[-_ ]?{weight}\.ttf$', p, re.I)), None)
    if not src:
        sys.exit(f'no PingFang {weight} .ttf in {src_dir}')
    font = TTFont(src)
    cmap = font.getBestCmap()
    opts = Options()
    opts.flavor = 'woff2'
    opts.layout_features = ['*']
    opts.name_IDs = ['*']
    sub = Subsetter(opts)
    sub.populate(unicodes=sorted(ord(c) for c in text if ord(c) in cmap))
    sub.subset(font)
    # one family, four names per weight (the sources are each their own family, all marked 400)
    font['OS/2'].usWeightClass = css
    for rec in font['name'].names:
        if rec.nameID in (1, 16):
            rec.string = 'PingFang SC'
        elif rec.nameID in (2, 17):
            rec.string = weight
        elif rec.nameID == 4:
            rec.string = f'PingFang SC {weight}'
        elif rec.nameID == 6:
            rec.string = f'PingFangSC-{weight}'
    out = os.path.join(root, 'public', 'fonts', f'PingFangSC-{weight}.woff2')
    font.save(out)
    lacking = ''.join(sorted(c for c in text if '一' <= c <= '龥' and ord(c) not in cmap))
    print(f'{weight}: {len(font.getBestCmap())} characters → public/fonts/{os.path.basename(out)} '
          f'({os.path.getsize(out) // 1024} KB)' + (f'; not in PingFang: {lacking}' if lacking else ''))

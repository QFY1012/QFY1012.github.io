# Review page for one version of a component change: the demo, the new parts, the code, the
# points the reviewer has to decide, and how to answer. Kept with the version it reviews.
#
#   python3 scripts/review_page.py k1 [round]   → library/k1/r<round>/review.html
# The points to decide come from library/k1/r<round>/notes.json: [{"title": ..., "text": ...}] (HTML allowed).
import json, base64, html, sys
from pathlib import Path
R = Path(__file__).resolve().parent.parent
NAME = sys.argv[1]
K = R / "traces/_components" / NAME
st_all = json.loads((R / "library/state.json").read_text())["proposals"][NAME]
ROUND = int(sys.argv[2]) if len(sys.argv) > 2 else len(st_all["rounds"])
D = R / "library" / NAME / f"r{ROUND}"
out = D / "review.html"
notes = json.loads((D / "notes.json").read_text())
b64 = lambda p: "data:image/png;base64," + base64.b64encode(Path(p).read_bytes()).decode()
st = st_all
rd = st["rounds"][ROUND - 1]
reqs = json.loads((K / "requests.json").read_text())
patch = (D / "change.patch").read_text()
# The lines the change adds to report/index.tsx.
seg = patch[patch.index("diff --git a/src/components/report/index.tsx"):]
seg = seg[:seg.index("\ndiff --git", 1)] if "\ndiff --git" in seg[1:] else seg
code = "\n".join(l[1:] for l in seg.splitlines() if l.startswith("+") and not l.startswith("+++"))
cmd = (D / "components.md").read_text()
sec = cmd[cmd.index(notes["docs"]):] if notes.get("docs") in cmd else ""
e = html.escape

css = """
/* Review sheet: one column of evidence, the demo first, then the parts, the code, and the call. */
:root{--bg:#f6f7f9;--paper:#ffffff;--ink:#1a1d24;--sub:#5d6472;--line:#dfe2e8;--accent:#2d5bd7;--warn:#a5520a;--warn-bg:#fdf3e7;--ok:#24804a;--code:#f0f2f6;
--sans:"Noto Sans SC","PingFang SC","Microsoft YaHei",system-ui,sans-serif;--mono:"IBM Plex Mono",ui-monospace,Menlo,Consolas,monospace}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#14161b;--paper:#1c1f26;--ink:#e8eaef;--sub:#a0a7b4;--line:#2f343e;--accent:#7d9cf0;--warn:#f0a35a;--warn-bg:#2e2418;--ok:#5cc58a;--code:#232730;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#14161b;--paper:#1c1f26;--ink:#e8eaef;--sub:#a0a7b4;--line:#2f343e;--accent:#7d9cf0;--warn:#f0a35a;--warn-bg:#2e2418;--ok:#5cc58a;--code:#232730;color-scheme:dark}
body{background:var(--bg);color:var(--ink);font:15px/1.7 var(--sans)}
main{max-width:1040px;margin:0 auto;padding-inline:16px;padding-block:32px 72px;display:flex;flex-direction:column;gap:40px}
h1{font-size:26px;line-height:1.3;margin:0;text-wrap:balance}
h2{font-size:18px;margin:0 0 12px;text-wrap:balance}
p{margin:0;max-width:68ch}
.eyebrow{font-size:12px;letter-spacing:.08em;color:var(--sub)}
.lead{color:var(--sub);margin-top:8px}
.status{display:inline-block;font-size:12px;padding:2px 10px;border-radius:999px;border:1px solid var(--accent);color:var(--accent);margin-left:8px;vertical-align:4px}
section{display:flex;flex-direction:column;gap:12px;min-width:0}
.facts{display:flex;flex-wrap:wrap;gap:8px 24px;color:var(--sub);font-size:13px;font-variant-numeric:tabular-nums}
.facts b{color:var(--ink);font-weight:600}
.shot{background:var(--paper);border:1px solid var(--line);max-height:720px;overflow:auto}
.shot img{display:block;width:100%;max-width:100%}
.pair{display:grid;grid-template-columns:1fr;gap:16px}
figure{margin:0;display:flex;flex-direction:column;gap:6px;min-width:0}
figure img{display:block;width:100%;max-width:100%;border:1px solid var(--line);background:#fff}
figcaption{font-size:13px;color:var(--sub)}
.tbl{overflow-x:auto}
table{border-collapse:collapse;width:100%;font-size:14px}
th,td{text-align:left;padding:8px 12px 8px 0;border-bottom:1px solid var(--line);vertical-align:top}
th{font-weight:600;font-size:13px;color:var(--sub)}
td code,p code,li code{font-family:var(--mono);font-size:13px;background:var(--code);padding:1px 5px;border-radius:4px}
pre{margin:0;background:var(--code);padding:14px 16px;overflow-x:auto;font:13px/1.6 var(--mono);border-radius:6px}
.flag{background:var(--warn-bg);border-left:3px solid var(--warn);padding:14px 16px;display:flex;flex-direction:column;gap:8px}
.flag h3{margin:0;font-size:15px;color:var(--warn)}
.ok{color:var(--ok);font-weight:600}
ol,ul{margin:0;padding-left:20px;display:flex;flex-direction:column;gap:6px}
.actions{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
.act{background:var(--paper);border:1px solid var(--line);padding:12px 14px;display:flex;flex-direction:column;gap:6px;min-width:0}
.act b{font-size:14px}
.act code{font-family:var(--mono);font-size:12px;word-break:break-all;color:var(--sub)}
@media (min-width:760px){.pair{grid-template-columns:1fr 1fr}}
"""

flags = [(f["title"], f["text"]) for f in notes.get("flags", [])]
parts = [tuple(x) for x in notes.get("parts", [])]

def crop(y, h):
    from PIL import Image
    import io
    im = Image.open(D / "shot.png").crop((0, y, Image.open(D / "shot.png").width, y + h))
    buf = io.BytesIO(); im.save(buf, "PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()

H = []
H.append(f"<title>{NAME} {notes['title']}审批</title><link rel='preconnect' href='https://fonts.googleapis.com'><link rel='stylesheet' href='https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400&family=Noto+Sans+SC:wght@400;600&display=swap'><style>{css}</style><main>")
nb = len([c for c in rd["checks"]]); nl = len(rd["lint"])
fb = (D / "feedback.md").read_text().split("\n", 2)[-1].strip() if (D / "feedback.md").exists() else ""
H.append(f"""<header style="display:flex;flex-direction:column;gap:6px"><div class="eyebrow">组件分支 · {NAME} · 第 {ROUND} 版</div>
<h1>{e(notes['title'])}<span class="status">{'待审' if ROUND == len(st['rounds']) and st['status'] == '待审' else st['status'] if ROUND == len(st['rounds']) else '已有新版'}</span></h1>
<p class="lead">{notes['lead']}</p>
{f'<p class="lead">这一版的起因(审批意见):{e(fb)}</p>' if fb else ''}
<div class="facts"><span>演示页程序检查 <b class="{'ok' if not nb else ''}">{nb} 个报错</b></span><span>组件代码检查 <b class="{'ok' if not nl else ''}">{nl} 个问题</b></span><span>用时 <b>{rd['seconds']//60} 分 {rd['seconds']%60} 秒</b></span><span>tokens <b>{rd['usage']['input']//1000}k 入 / {rd['usage']['output']//1000}k 出</b></span></div></header>""")

H.append(f"<section><h2>需要你决定的{len(flags)}点</h2>" + "".join(f"<div class='flag'><h3>{t}</h3><p>{d}</p></div>" for t, d in flags) + "</section>")

H.append(f"""<section><h2>示例效果</h2><p>{notes['demo']}</p><div class="pair">""" + "".join(f"""<figure><img src="{crop(t['y'], t['h'])}" alt="{e(t['caption'])}"><figcaption>{e(t['caption'])}</figcaption></figure>""" for t in notes.get("crops", [])) + f"""</div>
<div class="shot"><img src="{b64(D/'shot.png')}" alt="演示页整页截图"></div><figcaption>整页截图,可在框内上下滚动</figcaption></section>""")

H.append("<section><h2>新部件</h2><div class='tbl'><table><thead><tr><th>部件</th><th>props</th><th>管什么</th><th>来源</th></tr></thead><tbody>" + "".join(f"<tr><td><code>{a}</code></td><td><code>{b}</code></td><td>{c}</td><td>{d}</td></tr>" for a, b, c, d in parts) + "</tbody></table></div>"
         f"<p>{notes.get('source', '')}</p></section>")

H.append(f"<section><h2>生成 Agent 会读到的说明（components.md 新增）</h2><pre>{e(sec.strip())}</pre></section>")
H.append(f"<section><h2>代码（report/index.tsx 新增部分）</h2><pre>{e(code.strip())}</pre></section>")
H.append("<section><h2>需求（Maintainer 归纳的「组件不够」）</h2><ul>" + "".join(f"<li><b>{e(r['skill'])} {r['id']}</b>（{', '.join(r['pages'])}）：{e(r['problem'])}</li>" for r in reqs) + "</ul></section>")
if notes.get("review"):
    H.append(f"<section><h2>审批结果</h2><p><b>{e(notes['review']['decision'])}</b></p><p>审批意见(原话):{e(notes['review']['feedback'])}</p></section>")
else:
    H.append(f"""<section><h2>怎么处理</h2><div class="actions">
<div class="act"><b>通过</b><span>合并进组件库，两个 Skill 的 12 页按新部件改一遍，再从程序检查开始。</span><code>approve {NAME}</code></div>
<div class="act"><b>提意见重做</b><span>写下意见，组件 Agent 按意见改一版，再给你看。</span><code>revise {NAME} "意见"</code></div>
<div class="act"><b>自己改</b><span>直接改 traces/_components/{NAME}/app/ 里的代码，改完再通过。</span><code>approve {NAME}</code></div>
<div class="act"><b>不采用</b><span>记下原因，下次做组件时 Agent 会读到。</span><code>reject {NAME} "原因"</code></div>
</div><p>直接在对话里告诉我你的决定就行，我来执行。</p></section>""")
H.append("</main>")
out.write_text("".join(H))
print(out, out.stat().st_size)

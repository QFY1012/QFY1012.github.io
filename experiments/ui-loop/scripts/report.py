# Build the loop report page: v0 noise test, experience, rounds so far.
#   python3 scripts/report.py <out.html>
import base64, json, os, re, sys, html
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
T = lambda *p: os.path.join(R, "traces", *p)
NAMES = {"ops":"运营月报","ab":"A/B 实验","sales":"销售复盘","survey":"会员调研","review":"体验走查","hiring":"招聘季报","finance":"财务月报","cs":"客服质检","logistics":"物流时效","energy":"园区能耗"}
TRAIN = ["ops","ab","sales","survey","review","hiring"]; VALID = ["finance","cs","logistics","energy"]
esc = html.escape
def thumb(run, c):
    p = T(run, c, "thumb.png")
    return f'<img alt="{NAMES[c]} {run}" src="data:image/png;base64,{base64.b64encode(open(p,"rb").read()).decode()}">' if os.path.exists(p) else "<p>(未生成)</p>"
def judgements(a, b, c, r=1):
    out = []
    for o in ("AB", "BA"):
        f = T("_compare", f"{a}__{b}", f"{c}__r{r}__{o}.json")
        if os.path.exists(f):
            j = json.load(open(f)); pick = j["A"] if j["json"].get("better") == "A" else j["B"] if j["json"].get("better") == "B" else None
            out.append((o, pick, j["json"].get("reason", "")))
    return out
def verdict(a, b, js):
    p = [x[1] for x in js]
    return "拿不定(两种顺序选了不同的版本)" if len(p) < 2 or p[0] != p[1] else f"{p[0]} 更好"
def md(text):
    s = esc(text)
    s = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)
    lines = []
    for l in s.split("\n"):
        if l.startswith("# "): lines.append(f"<h3>{l[2:]}</h3>")
        elif l.startswith("  - "): lines.append(f'<p class="ev">{l[4:]}</p>')
        elif l.startswith("- "): lines.append(f"<p class=\"li\">{l[2:]}</p>")
        elif l.strip(): lines.append(f"<p>{l}</p>")
    return "\n".join(lines)

css = '''
:root{--bg:#fafaf9;--fg:#1c1917;--muted:#78716c;--line:#e7e5e4;--card:#fff;--win:#15803d;--lose:#b91c1c}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#1c1917;--fg:#f5f5f4;--muted:#a8a29e;--line:#44403c;--card:#292524;--win:#4ade80;--lose:#f87171}}
:root[data-theme="dark"]{--bg:#1c1917;--fg:#f5f5f4;--muted:#a8a29e;--line:#44403c;--card:#292524;--win:#4ade80;--lose:#f87171}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.65 system-ui,"PingFang SC","Noto Sans SC",sans-serif}
main{max-width:1200px;margin:0 auto;padding:32px 16px 80px}
h1{font-size:24px;margin:0 0 6px}h2{font-size:19px;margin:48px 0 12px;padding-bottom:8px;border-bottom:1px solid var(--line)}h3{font-size:16px;margin:24px 0 8px}
.lead,.muted{color:var(--muted)}
table{border-collapse:collapse;width:100%;font-size:14px}th,td{text-align:left;padding:8px 10px;border-bottom:1px solid var(--line);vertical-align:top}th{color:var(--muted);font-weight:500}
.pair{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:12px 0}
.pair figure{margin:0;border:1px solid var(--line);border-radius:8px;overflow:hidden;background:var(--card)}
.pair figcaption{padding:6px 10px;font-size:13px;color:var(--muted);border-bottom:1px solid var(--line)}
.shot{height:420px;overflow:auto;background:#fff}.shot img{width:100%;display:block}
.case{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:16px;margin:20px 0}
.case h3{margin:0 0 4px}.reason{font-size:14px;margin:6px 0}.reason b{font-weight:600}
.li{margin:10px 0 2px}.ev{margin:0 0 0 16px;font-size:13px;color:var(--muted)}
.big{font-size:28px;font-weight:600}
@media (max-width:640px){.pair{grid-template-columns:1fr}}
'''
h = [f'<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>输出层迭代报告</title><style>{css}</style></head><body><main>',
     '<h1>输出层迭代报告</h1><p class="lead">生成 Agent 按 design.md 用组件库写报告页面;judge(rubric31)两两比较;loop 一次改一条规则。本页随 loop 进度更新。</p>']

# ---------- noise test ----------
cases = [c for c in TRAIN if judgements("v0", "v0b", c)]
if cases:
    decided = [c for c in cases if "更好" in verdict("v0", "v0b", judgements("v0", "v0b", c))]
    h.append('<h2>准备:同一份 v0 规范生成两次</h2>')
    h.append(f'<p>6 份训练报告各用 v0 生成两次(v0、v0b),judge 按两种顺序各比一次。两版用的是同一份规范,所以这里判出的输赢全部来自生成时的随机波动。</p>')
    h.append(f'<p><span class="big">{len(decided)} / {len(cases)}</span> 份判出了输赢,{len(cases)-len(decided)} 份拿不定。</p>')
    h.append('<table><tr><th>报告</th><th>结果</th><th>judge 的理由(两种顺序各一条)</th></tr>')
    for c in cases:
        js = judgements("v0", "v0b", c)
        h.append(f'<tr><td>{NAMES[c]}</td><td>{verdict("v0","v0b",js)}</td><td>' + "".join(f'<p class="reason"><b>{o} 顺序选 {p}:</b>{esc(r)}</p>' for o, p, r in js) + '</td></tr>')
    h.append('</table>')
    for c in cases:
        h.append(f'<div class="case"><h3>{NAMES[c]}</h3><div class="pair"><figure><figcaption>v0</figcaption><div class="shot">{thumb("v0", c)}</div></figure><figure><figcaption>v0b(同一规范第二次生成)</figcaption><div class="shot">{thumb("v0b", c)}</div></figure></div></div>')

# ---------- experience ----------
if os.path.exists(os.path.join(R, "experience.md")):
    h.append('<h2>经验库(Maintainer 归纳)</h2>' + md(open(os.path.join(R, "experience.md")).read()))

# ---------- rounds ----------
st = json.load(open(os.path.join(R, "loop-state.json"))) if os.path.exists(os.path.join(R, "loop-state.json")) else None
if st and st.get("history"):
    h.append('<h2>迭代记录</h2><table><tr><th>轮</th><th>候选</th><th>改动</th><th>验证报告(3 轮)</th><th>结果</th></tr>')
    for x in st["history"]:
        g = ",".join(f'{NAMES[c]} {"".join({"b":"赢","a":"输"}.get(r,"分") for r in v["rounds"])}' for c, v in x["gate"].items())
        h.append(f'<tr><td>{x["round"]}</td><td>{x["candidate"]}(基于 {x["base"]})</td><td>{esc(x["change"]["rule"])}:{esc(x["change"]["new"])}</td><td>{g}</td><td>{"采用" if x["accept"] else "未采用"}</td></tr>')
    h.append('</table>')
    h.append(f'<p class="muted">当前版本:{st["current"]}{";已停止:" + st["stop"] if st.get("stop") else ""}</p>')
h.append('</main></body></html>')
open(sys.argv[1], "w").write("".join(h))
print(os.path.getsize(sys.argv[1]))

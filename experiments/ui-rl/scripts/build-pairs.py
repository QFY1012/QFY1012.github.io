"""第 0 阶段:从 ui-loop 真实跑出的页面里抽出待标的页面对。

    python3 experiments/ui-rl/scripts/build-pairs.py

两类页面对:
  cand  flow 的 12 个候选(c1–c12),每个在 6 份样本上和它的基线页比(候选是在基线页上改出来的),72 对
  aa    同一份指南生成两次:ui-loop 每次换版本都按同一指南再写一遍训练页(*-twin),twin 页 vs 当前页,12 对;
        这类对没有「更好」的一方,用来测 judge 会不会把生成的随机差异判成胜负

写出(都在 experiments/ui-rl/labels/):
  pairs.json        给标注页用:编号、左右两张图,不含版本名
  key.json          答案:每对的来源、哪边是候选;标注页不发布这个文件
  pages/<hash>.webp 每个页面一张整页截图(文件名是哈希,看不出版本)
左右位置和标注顺序按固定种子打乱,重跑结果不变。
"""
import hashlib
import json
import random
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
TRACES = ROOT.parent / "ui-loop" / "traces"
OUT = ROOT / "labels"
CASES = ["f1", "f2", "f3", "f4", "f5", "f6"]
TRAIN = ["f1", "f2", "f3", "f4"]

# 每个候选是在哪一版上改的(ui-loop/skills/flow/record.json 的 base,对应到 traces 里的运行名)
BASE_RUN = {"g0": "flow-g0", "g1": "flow-c1", "g2": "flow-c2", "g3": "flow-c10"}
record = json.loads((ROOT.parent / "ui-loop" / "skills" / "flow" / "record.json").read_text())["entries"]
cands = [e for e in record if e.get("candidate")]
TWINS = ["flow-g0", "flow-c10-k3", "flow-c10-k3-k4"]


def page(run, case):
    """把整页截图转成 webp,返回文件名(按运行名和样本名取哈希)。"""
    name = hashlib.sha1(f"{run}/{case}".encode()).hexdigest()[:12] + ".webp"
    dst = OUT / "pages" / name
    if not dst.exists():
        Image.open(TRACES / run / case / "shot.png").convert("RGB").save(dst, quality=82)
    return name


(OUT / "pages").mkdir(parents=True, exist_ok=True)
pairs = []
for e in cands:
    base = BASE_RUN[e["base"]]
    run = f"flow-{e['candidate']}"
    for c in CASES:
        meta = json.loads((TRACES / run / c / "meta.json").read_text())
        assert meta["base"] == base, (run, c, meta["base"], base)
        pairs.append({"kind": "cand", "case": c, "candidate": e["candidate"], "accepted": e["accepted"],
                      "base": base, "cand": run, "changedLines": meta.get("changedLines")})
for run in TWINS:
    for c in TRAIN:
        pairs.append({"kind": "aa", "case": c, "base": run, "cand": f"{run}-twin"})

rng = random.Random(20261013)
rng.shuffle(pairs)
public, key = [], []
for i, p in enumerate(pairs, 1):
    pid = f"p{i:02d}"
    swap = rng.random() < 0.5  # True:候选(或 twin)在左边
    a, b = page(p["base"], p["case"]), page(p["cand"], p["case"])
    left, right = (b, a) if swap else (a, b)
    public.append({"id": pid, "left": left, "right": right})
    key.append({"id": pid, **p, "candSide": "left" if swap else "right"})
    # 不打印来源和左右:标注的人可能看到输出。答案只在 key.json 里。

(OUT / "pairs.json").write_text(json.dumps(public, ensure_ascii=False, indent=1) + "\n")
(OUT / "key.json").write_text(json.dumps(key, ensure_ascii=False, indent=1) + "\n")
n = len(list((OUT / "pages").glob("*.webp")))
size = sum(f.stat().st_size for f in (OUT / "pages").glob("*.webp")) / 1e6
print(f"共 {len(public)} 对(候选 {sum(p['kind'] == 'cand' for p in key)}、A/A {sum(p['kind'] == 'aa' for p in key)}),{n} 张页面图,{size:.1f} MB")

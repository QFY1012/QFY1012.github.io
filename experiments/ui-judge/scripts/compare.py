# Compare judge conditions on the eval set, side by side, on the same pairs.
#   python3 scripts/compare.py rubric7 rubric8 [--set dev|ho|all] [--groups ops,ab] [--common]
# --common keeps only (group, pair, round) present in every condition, so a run
# still in progress can be compared fairly with a finished one.
# A pair is decided when both orders pick the same page; the person's ties are left out.
#   一致率     decided and the person's pick / decided
#   判出率     decided / all
#   轮间稳定   pairs where every round decided the same way / pairs decided at least once
#   第一名     per round, the judge's top (wins in both orders) is the person's top; judge ties share credit
#   1v2        person's 1st against 2nd: right / reversed / split
#   相邻       other pairs one rank apart, agreement when decided
#   Spearman   judge's wins summed over rounds against the person's ranking, mean over groups
#   A 位       share of A among all picks (position bias; 50% is none)
#   条目       per numbered criterion: agreement when decided, how often it equals the overall pick
import json, os, re, sys, itertools
from collections import defaultdict

R = os.path.dirname(os.path.abspath(__file__)) + "/../"
key = {g["id"]: g for g in json.load(open(R + "evalset/key.json"))["groups"]}
human = json.load(open(R + "evalset/human.json"))
args = sys.argv[1:]
opt = lambda k, d=None: args[args.index(k) + 1] if k in args else d
SET = opt("--set", "dev")
GROUPS = opt("--groups")
skip = {opt("--set"), opt("--groups")}
conds = [a for a in args if not a.startswith("--") and a not in skip]
MODEL = os.environ.get("JUDGE_TAG", "@deepseek-v4.1-flash-high")


def want(g):
    if GROUPS: return g in GROUPS.split(",")
    ho = key[g].get("heldout", False)
    return SET == "all" or (SET == "ho") == ho


def load(cond):
    D = R + f"out/aesthetic/evalset/{cond}{MODEL}/"
    J = {}
    for f in os.listdir(D):
        m = re.match(r"(.+?)__(.+?)__(.+?)__r(\d+)\.json$", f)
        if not m or not want(m.group(1)): continue
        try: J[m.groups()] = json.load(open(D + f))["json"]
        except Exception: pass
    return J


data = {c: load(c) for c in conds}
units = None  # (g, x, y, n) with x < y and both orders present
for c, J in data.items():
    u = {(g, x, y, n) for (g, x, y, n) in J if x < y and (g, y, x, n) in J}
    units = u if units is None else (units & u if "--common" in args else units | u)
units = units or set()


# Pairs the person called "about the same" (HANDOFF.md); --near counts them as ties.
NEAR = {("sales", "甲", "丙"), ("style-ab", "丁", "戊"), ("style", "甲", "丁"), ("ops", "戊", "己")}


def rank(g, v):
    lab = {vv: l for l, vv in key[g]["labels"].items()}
    return human[g][lab[v]]


def near(g, x, y):
    lab = {vv: l for l, vv in key[g]["labels"].items()}
    return "--near" in args and ((g, lab[x], lab[y]) in NEAR or (g, lab[y], lab[x]) in NEAR)


def decide(J, g, x, y, n, k=None):
    a, b = J.get((g, x, y, n)), J.get((g, y, x, n))
    if a is None or b is None: return None
    pa = (a.get(k, {}) if k else a).get("better"); pb = (b.get(k, {}) if k else b).get("better")
    wa = {"A": x, "B": y}.get(pa); wb = {"A": y, "B": x}.get(pb)
    return wa if wa and wa == wb else "split"


def spearman(a, b):
    def rk(vals):
        s = sorted(vals, key=lambda v: -v)
        return [sum(i + 1 for i, x in enumerate(s) if x == v) / s.count(v) for v in vals]
    ra, rb = rk(a), rk(b); ma, mb = sum(ra) / len(ra), sum(rb) / len(rb)
    num = sum((x - ma) * (y - mb) for x, y in zip(ra, rb))
    den = (sum((x - ma) ** 2 for x in ra) * sum((y - mb) ** 2 for y in rb)) ** 0.5
    return num / den if den else 0


rows = {}
for c, J in data.items():
    U = [u for u in units if all(k in J for k in (u, (u[0], u[2], u[1], u[3])))]
    s = defaultdict(int); crit = defaultdict(lambda: [0, 0, 0, 0])  # right, decided, same-as-overall, picks
    byp = defaultdict(list)
    for g, x, y, n in U:
        rx, ry = rank(g, x), rank(g, y)
        d = decide(J, g, x, y, n)
        byp[(g, x, y)].append(d)
        if rx == ry or near(g, x, y): continue
        hum = x if rx < ry else y
        s["all"] += 1
        if d != "split":
            s["dec"] += 1; s["ok"] += d == hum
        if {rx, ry} == {1, 2}:
            s["12" + ("s" if d == "split" else "r" if d == hum else "w")] += 1
        elif abs(rx - ry) == 1 and min(rx, ry) > 1 and d != "split":
            s["adjd"] += 1; s["adjok"] += d == hum
        for o in ((g, x, y, n), (g, y, x, n)):
            j = J[o]
            s["picks"] += j.get("better") in ("A", "B"); s["A"] += j.get("better") == "A"
            for k, v in j.items():
                if re.fullmatch(r"\d+", k) and isinstance(v, dict) and v.get("better") in ("A", "B"):
                    crit[k][3] += 1; crit[k][2] += v["better"] == j.get("better")
        for k in {k for o in ((g, x, y, n), (g, y, x, n)) for k in J[o] if re.fullmatch(r"\d+", k)}:
            dk = decide(J, g, x, y, n, k)
            if dk not in (None, "split"):
                crit[k][1] += 1; crit[k][0] += dk == hum
    stable = [all(d == ds[0] for d in ds) and ds[0] != "split" for ds in byp.values() if len(ds) > 1 and any(d != "split" for d in ds)]
    # top-1 and Spearman per group
    top, rhos = [], []
    for g in sorted({u[0] for u in U}):
        vs = sorted({u[1] for u in U if u[0] == g} | {u[2] for u in U if u[0] == g})
        h = {v: rank(g, v) for v in vs}; htop = {v for v in vs if h[v] == min(h.values())}
        tot = defaultdict(int)
        for n in sorted({u[3] for u in U if u[0] == g}):
            w = defaultdict(int)
            for (gg, x, y, nn) in U:
                if gg == g and nn == n:
                    d = decide(J, g, x, y, n)
                    if d != "split": w[d] += 1; tot[d] += 1
            mx = max(w.values(), default=0); jt = [v for v in vs if w[v] == mx]
            top.append(len(set(jt) & htop) / len(jt))
        rhos.append(spearman([tot[v] for v in vs], [-h[v] for v in vs]))
    rows[c] = dict(
        n=len(U) // 1,
        agree=f"{s['ok']}/{s['dec']}={s['ok']/max(1,s['dec']):.0%}",
        decided=f"{s['dec']/max(1,s['all']):.0%}",
        stable=f"{sum(stable)/max(1,len(stable)):.0%}",
        top1=f"{sum(top):.1f}/{len(top)}={sum(top)/max(1,len(top)):.0%}",
        v12=f"{s['12r']}/{s['12w']}/{s['12s']}",
        adj=f"{s['adjok']}/{s['adjd']}={s['adjok']/max(1,s['adjd']):.0%}",
        rho=f"{sum(rhos)/max(1,len(rhos)):+.2f}",
        Apos=f"{s['A']/max(1,s['picks']):.0%}",
        crit=" ".join(f"{k}:{v[0]/max(1,v[1]):.0%}({v[1]})≡{v[2]/max(1,v[3]):.0%}" for k, v in sorted(crit.items(), key=lambda kv: int(kv[0]))),
    )

labels = dict(n="对数(单向)", agree="一致率", decided="判出率", stable="轮间稳定", top1="第一名命中", v12="1v2 对/反/分", adj="相邻(非第一)", rho="Spearman", Apos="A 位", crit="条目 一致率(判出数)≡同总体")
print(f"set={GROUPS or SET} {'common' if '--common' in args else ''} {'near-ties-excluded' if '--near' in args else ''}  pairs×rounds={len(units)}")
w = max(len(c) for c in conds) + 2
for k, name in labels.items():
    if k != "crit": print(f"{name:<14}" + "".join(f"{rows[c][k]:<{max(w, 22)}}" for c in conds))
for c in conds:
    print(f"{c} 条目: {rows[c]['crit']}")

# Paired test between each condition and the first one, on units both have:
# a unit is (group, pair, round) the person does not tie; "right" = decided
# for the person's pick. b = first right and other not, c = other right and
# first not; two-sided sign test on b vs c.
from math import comb
def sign_p(b, c):
    n = b + c
    if n == 0: return 1.0
    k = min(b, c)
    return min(1.0, 2 * sum(comb(n, i) for i in range(k + 1)) / 2 ** n)
base = conds[0]
for c in conds[1:]:
    b = cc = 0
    for (g, x, y, n) in units:
        if rank(g, x) == rank(g, y) or near(g, x, y): continue
        hum = x if rank(g, x) < rank(g, y) else y
        d0, d1 = decide(data[base], g, x, y, n), decide(data[c], g, x, y, n)
        if d0 is None or d1 is None: continue
        r0, r1 = d0 == hum, d1 == hum
        b += r0 and not r1; cc += r1 and not r0
    print(f"配对: {c} 对 {base}: {c} 独对 {cc} 次, {base} 独对 {b} 次, 符号检验 p={sign_p(b, cc):.2f}")

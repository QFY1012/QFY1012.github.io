import json,os,re,sys,itertools
from collections import defaultdict
R=os.path.dirname(os.path.abspath(__file__))+'/../'
key=json.load(open(R+'evalset/key.json'))['groups']; human=json.load(open(R+'evalset/human.json'))
for cond in sys.argv[1:]:
    D=R+f'out/aesthetic/evalset/{cond}@deepseek-v4.1-flash-high/'
    picks={}
    for f in os.listdir(D):
        m=re.match(r'(.+?)__(.+?)__(.+?)__r(\d+)\.json$',f)
        if not m: continue
        try: b=json.load(open(D+f))['json']['better']
        except Exception: b=None
        picks[m.groups()]=b
    print(f'== {cond}')
    tot=[0,0,0]
    for g in key:
        lab={v:l for l,v in g['labels'].items()}
        files=[k for k in picks if k[0]==g['id']]
        vs=sorted({k[1] for k in files}|{k[2] for k in files})
        if not vs: continue
        pairs=list(itertools.combinations(vs,2)); reps=sorted({k[3] for k in files})
        h={v:human[g['id']][lab[v]] for v in vs}; best=min(h.values()); htop={v for v in vs if h[v]==best}
        wins=defaultdict(int); rep_hits=[]; done=0
        for n in reps:
            w=defaultdict(int); complete=True
            for x,y in pairs:
                p1=picks.get((g['id'],x,y,n)); p2=picks.get((g['id'],y,x,n))
                if p1 is None or p2 is None: complete=False; continue
                if p1 in 'AB' and p2 in 'AB':
                    w1=x if p1=='A' else y; w2=y if p2=='A' else x
                    if w1==w2: w[w1]+=1; wins[w1]+=1
            if complete:
                done+=1; mx=max(w.values(),default=0); jt=[v for v in vs if w[v]==mx]
                rep_hits.append(len(set(jt)&htop)/len(jt))  # judge ties at top share credit
        mx=max(wins.values(),default=0); jt=[v for v in vs if wins[v]==mx]
        agg='对' if set(jt)<=htop else ('并列含' if set(jt)&htop else '错')
        # human #1 pairwise: how often does it beat each other version (decided both-order)
        print(f"{g['title']}|轮次完整 {done}/3|每轮第一名命中 {sum(rep_hits):.1f}/{len(rep_hits)}|合计第一名 {'、'.join(lab[v] for v in jt)}({mx}) 你第一 {'、'.join(lab[v] for v in htop)} → {agg}")

# Rank agreement between the judge's ranking (wins in both orders, summed over
# repeats) and the person's ranking, per group: Spearman rho and Kendall tau-b.
# Usage: python3 scripts/analyze-rankcorr.py principles principles2 rubric7
import json,os,re,sys,itertools
from collections import defaultdict
R=os.path.dirname(os.path.abspath(__file__))+'/../'
key=json.load(open(R+'evalset/key.json'))['groups']; human=json.load(open(R+'evalset/human.json'))
def ranks(vals):  # average ranks, larger value = better = rank 1
    s=sorted(vals,key=lambda v:-v); return [ (sum(i+1 for i,x in enumerate(s) if x==v)/s.count(v)) for v in vals]
def spearman(a,b):
    ra,rb=ranks(a),ranks(b); ma,mb=sum(ra)/len(ra),sum(rb)/len(rb)
    num=sum((x-ma)*(y-mb) for x,y in zip(ra,rb)); den=(sum((x-ma)**2 for x in ra)*sum((y-mb)**2 for y in rb))**.5
    return num/den if den else 0
def kendall(a,b):
    c=d=ta=tb=0
    for i,j in itertools.combinations(range(len(a)),2):
        x=(a[i]>a[j])-(a[i]<a[j]); y=(b[i]>b[j])-(b[i]<b[j])
        if x and y: c+= x==y; d+= x!=y
        elif x: tb+=1
        elif y: ta+=1
    den=((c+d+ta)*(c+d+tb))**.5
    return (c-d)/den if den else 0
for cond in sys.argv[1:]:
    D=R+f'out/aesthetic/evalset/{cond}@deepseek-v4.1-flash-high/'
    P={}
    for f in os.listdir(D):
        m=re.match(r'(.+?)__(.+?)__(.+?)__r(\d+)\.json$',f)
        try: P[m.groups()]=json.load(open(D+f))['json']['better']
        except Exception: pass
    print(f'== {cond}'); dev=[];ho=[]
    for g in key:
        lab={v:l for l,v in g['labels'].items()}
        fs=[k for k in P if k[0]==g['id']]
        if not fs: continue
        vs=sorted({k[1] for k in fs}|{k[2] for k in fs}); w=defaultdict(int)
        for (gid,x,y,n),a in P.items():
            if gid!=g['id'] or x>y: continue
            b=P.get((gid,y,x,n))
            wa={'A':x,'B':y}.get(a); wb={'A':y,'B':x}.get(b)
            if wa and wa==wb: w[wa]+=1
        jw=[w[v] for v in vs]; hs=[-human[g['id']][lab[v]] for v in vs]
        rho,tau=spearman(jw,hs),kendall(jw,hs)
        (ho if g.get('heldout') else dev).append((rho,tau))
        print(f"  {g['title']}: Spearman {rho:+.2f}  Kendall {tau:+.2f}")
    for name,xs in (('原来9组',dev),('留出4组',ho)):
        if xs: print(f"  平均({name}): Spearman {sum(x[0] for x in xs)/len(xs):+.2f}  Kendall {sum(x[1] for x in xs)/len(xs):+.2f}")

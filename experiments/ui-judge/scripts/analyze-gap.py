import json,os,re,sys
from collections import defaultdict
R=os.path.dirname(os.path.abspath(__file__))+'/../'
key={g['id']:g for g in json.load(open(R+'evalset/key.json'))['groups']}; human=json.load(open(R+'evalset/human.json'))
for cond in sys.argv[1:]:
    D=R+f'out/aesthetic/evalset/{cond}@deepseek-v4.1-flash-high/'
    P={}
    for f in os.listdir(D):
        m=re.match(r'(.+?)__(.+?)__(.+?)__r(\d+)\.json$',f)
        try: P[m.groups()]=json.load(open(D+f))['json']['better']
        except Exception: pass
    st=defaultdict(lambda:[0,0,0])
    for (g,x,y,n),a in P.items():
        if x>y or g.startswith('ho-') : continue
        b=P.get((g,y,x,n))
        if b is None: continue
        lab={v:l for l,v in key[g]['labels'].items()}; rx,ry=human[g][lab[x]],human[g][lab[y]]
        if rx==ry: continue
        hum=x if rx<ry else y
        seg=('1v2' if {rx,ry}=={1,2} else '1v3+' if min(rx,ry)==1 else '其他相邻' if abs(rx-ry)==1 else '其他')
        wa={'A':x,'B':y}.get(a); wb={'A':y,'B':x}.get(b)
        s=st[seg]
        if wa and wa==wb: s[0 if wa==hum else 1]+=1
        else: s[2]+=1
    print('==',cond,'(原来9组)')
    for k in ('1v2','1v3+','其他相邻','其他'):
        a,b,c=st[k]; print(f"  {k}: 对{a} 反{b} 分{c} → 选你那版 {a/(a+b+c):.0%}, 判出时一致 {a/max(1,a+b):.0%}")

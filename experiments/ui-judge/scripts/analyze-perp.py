import json,os,re,sys
from collections import defaultdict
R=os.path.dirname(os.path.abspath(__file__))+'/../'
key={g['id']:g for g in json.load(open(R+'evalset/key.json'))['groups']}; human=json.load(open(R+'evalset/human.json'))
COND=sys.argv[1] if len(sys.argv)>1 else 'rubric7'
D=R+f'out/aesthetic/evalset/{COND}@deepseek-v4.1-flash-high/'
J={}
for f in os.listdir(D):
    m=re.match(r'(.+?)__(.+?)__(.+?)__r(\d+)\.json$',f)
    try: J[m.groups()]=json.load(open(D+f))['json']
    except Exception: pass
same1=tot1=0
stat={s:defaultdict(lambda:[0,0,0]) for s in ('all','top','rest')}  # agree, against, split
for (g,x,y,n),j in J.items():
    if j.get('1',{}).get('better') in 'AB' and j.get('better') in 'AB':
        tot1+=1; same1+= j['1']['better']==j['better']
    if x>y: continue
    j2=J.get((g,y,x,n))
    if not j2: continue
    lab={v:l for l,v in key[g]['labels'].items()}; h=human[g]; rx,ry=h[lab[x]],h[lab[y]]
    if rx==ry: continue
    hum=x if rx<ry else y
    seg='top' if min(rx,ry)==1 else 'rest'
    for k in list('1234567')+['总']:
        a=(j.get(k,{}) if k!='总' else j).get('better'); b=(j2.get(k,{}) if k!='总' else j2).get('better')
        wa={'A':x,'B':y}.get(a); wb={'A':y,'B':x}.get(b)
        for s in ('all',seg):
            st=stat[s][k]
            if wa and wa==wb: st[0 if wa==hum else 1]+=1
            else: st[2]+=1
print(f'总体选择 = 第1条的选择: {same1}/{tot1} = {same1/tot1:.0%}')
names=dict(zip('1234567',['疏朗' if COND=='rubric7' else '不拥挤','分组节奏','装饰','重点','调性','同类一致','正负形']))
for s in ('all','top','rest'):
    print('==',{'all':'所有对','top':'含你第一名的对','rest':'其他对'}[s])
    for k in list('1234567')+['总']:
        a,b,c=stat[s][k]; print(f"{k}{names.get(k,'总体')}: 判出且对 {a}/{a+b}={a/max(1,a+b):.0%}  判出率 {(a+b)/max(1,a+b+c):.0%}")

import re,sys
from html.parser import HTMLParser
VOID={'area','base','br','col','embed','hr','img','input','link','meta','source','track','wbr'}
def card(cls):
    c=cls.split()
    return ('cf-card' in c) or (any(x.startswith('rounded') for x in c) and any(x=='border' or x.startswith('border-') and not re.match(r'border-(t|b|l|r|x|y|s|e)\b|border-(slate|indigo|emerald|[a-z]+)-\d',x) for x in c) and any(x.startswith('bg-') for x in c))
class P(HTMLParser):
    def __init__(s):
        super().__init__(); s.stack=[]; s.found=[]
    def handle_starttag(s,t,a):
        if t in VOID: return
        cls=dict(a).get('class','') or ''
        isc=card(cls)
        if isc:
            parent=[x for x in s.stack if x[1]]
            if parent: s.found.append((s.getpos()[0],parent[-1][2],cls[:90]))
        s.stack.append((t,isc,s.getpos()[0]))
    def handle_endtag(s,t):
        for i in range(len(s.stack)-1,-1,-1):
            if s.stack[i][0]==t: del s.stack[i:]; break
p=P(); p.feed(open('index.html',encoding='utf-8').read())
print(len(p.found))
from collections import Counter
c=Counter(x[1] for x in p.found)
for line,n in c.most_common(25): print('parent line',line,'children',n)
print('--- detail')
import sys
for line,parent,cls in p.found:
    if parent in (437,885,931,1482,1066,1617,2051): print(line,'<-',parent,cls)

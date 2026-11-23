#!/bin/bash
# uso: tap.sh "regex"  -> toca no centro do 1o elemento cujo text/content-desc casa
export PATH="$LOCALAPPDATA/Android/Sdk/platform-tools:$PATH"
A="adb -s emulator-5580"
$A shell uiautomator dump /sdcard/u.xml >/dev/null 2>&1
$A pull /sdcard/u.xml C:/Users/notefael/projetos/Adbm/.craft/h/u.xml >/dev/null 2>&1
python - "$1" <<'PY'
import re,sys,subprocess,xml.etree.ElementTree as ET
pat=re.compile(sys.argv[1],re.I)
for n in ET.parse('C:/Users/notefael/projetos/Adbm/.craft/h/u.xml').iter('node'):
    t=n.get('text','')+'|'+n.get('content-desc','')
    if pat.search(t):
        x1,y1,x2,y2=map(int,re.findall(r'\d+',n.get('bounds')))
        print('tap',t,(x1+x2)//2,(y1+y2)//2)
        subprocess.run(['adb','-s','emulator-5580','shell','input','tap',str((x1+x2)//2),str((y1+y2)//2)])
        sys.exit(0)
print('NOT FOUND',sys.argv[1]); sys.exit(1)
PY

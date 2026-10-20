import json
t=open('template.html',encoding='utf-8').read()
plants=json.load(open('plants2.json',encoding='utf-8'))
herb=json.load(open('herbier.json',encoding='utf-8'))
pj=json.dumps(plants,ensure_ascii=False,separators=(',',':'))
hj=json.dumps(herb,ensure_ascii=False,separators=(',',':'))
t=t.replace('/*__PLANTS__*/',pj).replace('/*__HERB__*/',hj).replace('/*__ENGINE__*/',open('engine.js',encoding='utf-8').read()).replace('/*__UI__*/',open('ui.js',encoding='utf-8').read())
open('jardin-vivant.html','w',encoding='utf-8').write(t)
print(len(t),'octets')

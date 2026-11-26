# Assemble le jeu en un seul fichier. À lancer depuis n'importe où : python3 src/build.py
# Sources : src/ (template, moteur, interface, 3D, image) et data/ (plantes, herbier).
# Sortie : dist/jardin-vivant.html, copié à l'identique dans jardin-vivant.html et index.html (racine)
# pour que les trois copies ne divergent plus.
import json, os, base64, shutil
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S = lambda f: os.path.join(R, 'src', f)
D = lambda f: os.path.join(R, 'data', f)
rd = lambda p: open(p, encoding='utf-8').read()
t = rd(S('template.html'))
plants = json.load(open(D('plants2.json'), encoding='utf-8'))
herb = json.load(open(D('herbier.json'), encoding='utf-8'))
pj = json.dumps(plants, ensure_ascii=False, separators=(',', ':'))
hj = json.dumps(herb, ensure_ascii=False, separators=(',', ':'))
t = t.replace('/*__PLANTS__*/', pj).replace('/*__HERB__*/', hj).replace('/*__ENGINE__*/', rd(S('engine.js'))).replace('/*__V3D__*/', rd(S('view3d.js'))).replace('/*__UI__*/', rd(S('ui.js')))
t = t.replace('/*__TREES__*/{}', json.dumps(json.load(open(D('arbres.json'))), separators=(',', ':')))
spr = {f[:-5]: 'data:image/webp;base64,' + base64.b64encode(open(S('spr/' + f), 'rb').read()).decode() for f in sorted(os.listdir(S('spr'))) if f.endswith('.webp')}
rg = {f[:-5]: json.load(open(S('rigs/' + f))) for f in sorted(os.listdir(S('rigs'))) if f.endswith('.json')} if os.path.isdir(S('rigs')) else {}
t = t.replace('/*__RIGS__*/{}', json.dumps(rg, separators=(',', ':')))

# Contrôle des images : tout animal du jeu doit avoir une illustration (les plantes sont dessinées automatiquement).
import re
_eng = rd(S('engine.js')); _ui = rd(S('ui.js'))
_m = re.search(r"const FAUNA = \[(.*?)\n  \];", _eng, re.S) or re.search(r"const FAUNA = \[(.*?)\];", _eng, re.S)
_ids = re.findall(r"id:\s*'([a-z_]+)'", _m.group(1)) if _m else []
_ans = dict(re.findall(r"(\w+): '(\w+)'", re.search(r"const ANS = \{(.*?)\};", _ui, re.S).group(1)))
_miss = [i for i in _ids if (_ans.get(i, i)) not in spr and i not in spr]
print('Images animaux :', len(_ids) - len(_miss), '/', len(_ids), ('— MANQUANTES : ' + ', '.join(_miss)) if _miss else '— toutes présentes')
t = t.replace('/*__SPR__*/{}', json.dumps(spr, separators=(',', ':')))
t = t.replace('__GUILDEON__', 'data:image/webp;base64,' + base64.b64encode(open(S('guildeon.webp'), 'rb').read()).decode())
out = os.path.join(R, 'dist', 'jardin-vivant.html')
os.makedirs(os.path.dirname(out), exist_ok=True)
open(out, 'w', encoding='utf-8').write(t)
for c in ('jardin-vivant.html', 'index.html'):
    shutil.copyfile(out, os.path.join(R, c))
print(len(plants), 'plantes,', len(t), 'octets')

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
t = t.replace('__GUILDEON__', 'data:image/webp;base64,' + base64.b64encode(open(S('guildeon.webp'), 'rb').read()).decode())
out = os.path.join(R, 'dist', 'jardin-vivant.html')
os.makedirs(os.path.dirname(out), exist_ok=True)
open(out, 'w', encoding='utf-8').write(t)
for c in ('jardin-vivant.html', 'index.html'):
    shutil.copyfile(out, os.path.join(R, c))
print(len(plants), 'plantes,', len(t), 'octets')

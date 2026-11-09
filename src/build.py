# Assemble le jeu en un seul fichier. À lancer depuis n'importe où : python3 src/build.py
# Sources : src/ (template, moteur, interface, 3D, image) et data/ (plantes, herbier).
# Sortie : dist/jardin-vivant.html, copié à l'identique dans jardin-vivant.html et index.html (racine)
# pour que les trois copies ne divergent plus.
import json, os, base64, shutil
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S = lambda f: os.path.join(R, 'src', f)
D = lambda f: os.path.join(R, 'data', f)
rd = lambda p: open(p, encoding='utf-8').read()
# Variante « carnet » (préproduction) : JV_BACKEND=carnet python3 src/build.py
# Écrit seulement dist/jardin-vivant-carnet.html ; ne touche pas index.html ni la copie publiée.
CARNET = os.environ.get('JV_BACKEND') == 'carnet'
def carnet(ui):
    reps = [
        ("https://wbdduslvjqeersekxaxw.supabase.co", "https://itqvpmdxmzxubhmtezub.supabase.co"),
        ("sb_publishable_m47WNomSZ0jqHim34mbc7A_vs6uCZVX", "sb_publishable_aUvfqIfrNpQNkDtRIrn5Mg_k6rQDaFM"),
        ("AK: 'jardin-vivant-auth'", "AK: 'jardin-vivant-auth-carnet'"),
        ("/rest/v1/saves", "/rest/v1/jv_saves"),
        ("/rest/v1/gardens", "/rest/v1/jv_gardens"),
        ("/rest/v1/rpc/leaderboard", "/rest/v1/rpc/jv_leaderboard"),
        ("Ce compte est propre au jeu, il est indépendant de JF Lab.", "C’est ton compte JF Lab : le même e-mail et le même mot de passe que sur le carnet (jflab.earth). Après l’inscription, un e-mail de confirmation t’est envoyé."),
    ]
    for a, b in reps:
        assert a in ui, a
        ui = ui.replace(a, b)
    return ui
t = rd(S('template.html'))
plants = json.load(open(D('plants2.json'), encoding='utf-8'))
herb = json.load(open(D('herbier.json'), encoding='utf-8'))
pj = json.dumps(plants, ensure_ascii=False, separators=(',', ':'))
hj = json.dumps(herb, ensure_ascii=False, separators=(',', ':'))
t = t.replace('/*__PLANTS__*/', pj).replace('/*__HERB__*/', hj).replace('/*__ENGINE__*/', rd(S('engine.js'))).replace('/*__V3D__*/', rd(S('view3d.js'))).replace('/*__UI__*/', carnet(rd(S('ui.js'))) if CARNET else rd(S('ui.js')))
t = t.replace('__GUILDEON__', 'data:image/webp;base64,' + base64.b64encode(open(S('guildeon.webp'), 'rb').read()).decode())
out = os.path.join(R, 'dist', 'jardin-vivant-carnet.html' if CARNET else 'jardin-vivant.html')
os.makedirs(os.path.dirname(out), exist_ok=True)
open(out, 'w', encoding='utf-8').write(t)
for c in (() if CARNET else ('jardin-vivant.html', 'index.html')):
    shutil.copyfile(out, os.path.join(R, c))
print(len(plants), 'plantes,', len(t), 'octets')

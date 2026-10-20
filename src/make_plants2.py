import json, re, unicodedata, collections, os
B = '/tmp/claude-0/-home-claude/bf4a1d0e-4482-565e-9a8d-b6ea0b6ead94/scratchpad/'
mine = json.load(open(B + 'build/plants.json', encoding='utf-8'))      # 51 plantes ajustées à la main (0-21 calibrées)
prof = json.load(open(B + 'build2/profiles.json', encoding='utf-8'))     # 1635 fiches JF Lab

def norm(s):
    s = unicodedata.normalize('NFD', (s or '').lower())
    return re.sub(r'[^a-z0-9 ]', '', ''.join(c for c in s if unicodedata.category(c) != 'Mn')).strip()

MONTHS = {'janvier':1,'fevrier':2,'mars':3,'avril':4,'mai':5,'juin':6,'juillet':7,'aout':8,'septembre':9,'octobre':10,'novembre':11,'decembre':12}
SEAS = {'printemps':[3,4,5],'ete':[6,7,8],'automne':[9,10,11],'hiver':[12,1,2]}
def months(txt):
    if not txt or txt == 'N/A': return []
    t = norm(txt); out = set()
    for tok in re.finditer(r'(debut |fin |mi )?(janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre|printemps|ete|automne|hiver)', t):
        pre, w = tok.group(1), tok.group(2)
        if w in MONTHS: out.add(MONTHS[w])
        else:
            m = SEAS[w]
            if pre == 'debut ': m = m[:2]
            elif pre == 'fin ': m = m[1:]
            out.update(m)
    # plages "mai a juillet"
    for a, b in re.findall(r'(janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre) a (janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre)', t):
        x, y = MONTHS[a], MONTHS[b]; k = x
        while True:
            out.add(k)
            if k == y: break
            k = k % 12 + 1
    return sorted(out)

def nums(s):
    return [float(x.replace(',', '.')) for x in re.findall(r'\d+(?:[.,]\d+)?', s or '')]

def height_m(s):
    if not s: return None
    v = nums(s)
    if not v: return None
    h = max(v)
    if 'cm' in s.lower() and 'm' not in s.lower().replace('cm', ''): h /= 100
    return h

AZOTE = {'trifolium','vicia','pisum','phaseolus','lupinus','medicago','robinia','alnus','elaeagnus','hippophae','cytisus','gleditsia','glycine','lathyrus','cicer','lens','ceratonia','cercis','wisteria','vigna','arachis','lotus','ononis','genista','spartium','sophora','amorpha','caragana','colutea','ulex'}
REPUL = {'allium','tagetes','lavandula','rosmarinus','salvia','artemisia','tanacetum','mentha','ocimum','calendula','thymus','origanum','satureja','santolina','ruta','nepeta','coriandrum','anethum','foeniculum','petroselinum','melissa','hyssopus'}
MELL = {'lavandula','salvia','thymus','origanum','borago','calendula','tilia','robinia','rubus','ribes','sambucus','cornus','crataegus','prunus','malus','pyrus','mespilus','cydonia','amelanchier','buddleja','echinacea','phacelia','trifolium','mentha','melissa','hyssopus','nepeta','rosmarinus','symphytum','castanea','salix','acer','lonicera','viburnum','eleagnus','elaeagnus','hippophae','cotinus','sorbus','ziziphus','arbutus','feijoa','acca','diospyros','vitex','agastache','borago','anchusa','viola','lamium','ajuga','centaurea','cichorium','cynara','foeniculum','anethum','daucus'}
MULCH = {'symphytum','rheum','urtica','artemisia','petasites','arctium','comarum'}
GOURM = {'solanum','cucurbita','cucumis','zea','brassica','capsicum','lycopersicon','citrullus','helianthus','physalis','abelmoschus','cucurbita','prunus','malus','pyrus','citrus','ficus','vitis','actinidia','cydonia','juglans','castanea','corylus','mespilus','punica','diospyros','olea','morus','ribes','rubus'}
EMO_NAME = [('pomme','🍎'),('poire','🍐'),('cerise','🍒'),('griotte','🍒'),('prune','🍑'),('peche','🍑'),('abricot','🍑'),('fraise','🍓'),('citron','🍋'),('orange','🍊'),('mandarin','🍊'),('clementin','🍊'),('olive','🫒'),('chataign','🌰'),('noisett','🌰'),('noix','🌰'),('amande','🌰'),('raisin','🍇'),('vigne','🍇'),('tomate','🍅'),('maïs','🌽'),('mais','🌽'),('carotte','🥕'),('poireau','🌱'),('ail','🧄'),('oignon','🧅'),('pomme de terre','🥔'),('piment','🌶️'),('poivron','🫑'),('aubergine','🍆'),('courge','🎃'),('citrouille','🎃'),('concombre','🥒'),('courgette','🥒'),('salade','🥬'),('laitue','🥬'),('chou','🥬'),('epinard','🥬'),('brocoli','🥦'),('haricot','🫛'),('pois','🫛'),('feve','🫛'),('banane','🍌'),('ananas','🍍'),('mangue','🥭'),('kiwi','🥝'),('melon','🍈'),('pasteque','🍉'),('myrtille','🫐'),('cassis','🫐'),('mure','🫐'),('framboise','🍓'),('groseille','🍒'),('figue','🌳'),('coco','🥥'),('avocat','🥑'),('gingembre','🫚'),('champignon','🍄'),('menthe','🌿'),('basilic','🌿'),('sauge','🌿'),('thym','🌿'),('romarin','🌿'),('lavande','🪻')]
SEC = {'fruits':('🍎','#d9534f',55,'F'),'agrume':('🍊','#f29b2d',45,'F'),'baies':('🫐','#6a5acd',45,'B'),'oleag':('🌰','#a8742f',620,'O'),
       'feuilles':('🥬','#6fae48',28,'L'),'legume':('🥦','#5fae6e',32,'L'),'racine':('🥕','#ee8a2a',48,'R'),'tubercule':('🥔','#c9a96b',80,'R'),
       'graines':('🌾','#d9b44a',340,'G'),'default':('🌱','#8bc34a',40,'L')}

def secteur(parts, type_):
    p = norm(parts)
    if 'agrume' in p: return 'agrume'
    if 'oleag' in p: return 'oleag'
    if 'baie' in p: return 'baies'
    if 'tubercule' in p: return 'tubercule'
    if 'racine' in p: return 'racine'
    if 'legume' in p: return 'legume'
    if 'graine' in p: return 'graines'
    if 'fruit' in p: return 'fruits'
    if 'feuille' in p or 'petiole' in p: return 'feuilles'
    return 'default'

latin_idx = {}
name_idx = {}
for p in mine:
    latin_idx[norm(p['latin'])] = p['id']; name_idx[norm(p['name'])] = p['id']

out = [dict(p) for p in mine]
for p in out: p.setdefault('cat', None)
herbier = []
stats = collections.Counter()

def first_fruit_years(s):
    if not s: return None
    t = norm(s)
    m = re.search(r'(\d+)\s*(?:a|-)?\s*(\d+)?\s*an', t)
    if m:
        a = int(m.group(1)); b = int(m.group(2)) if m.group(2) else a
        return max(1, min(8, round((a + b) / 2)))
    return None

def cap(s): return s[:1].upper() + s[1:] if s else s

for r in prof:
    f = r['fields']; name = cap((r['name'] or '').strip()); latin = (r['latin'] or '').strip()
    typ = f.get('type') or ''; tn = norm(typ); edible = (f.get('edible') or '').startswith('oui')
    zone = norm(f.get('zone')); aquatic = 'aquati' in tn or 'mare' in zone or 'aquati' in norm(f.get('drought'))
    indoor = 'interieur' in zone or 'serre chaude' in zone
    mushroom = 'champignon' in tn or 'champignon' in norm(f.get('edibleParts'))
    k = norm(latin); nn = norm(name)
    dup = latin_idx.get(k) if k else None
    if dup is None: dup = name_idx.get(nn)
    herb = dict(n=name, l=latin, t=typ, e=1 if edible else 0, z=f.get('zone') or '', h=f.get('height') or '', x=f.get('exposure') or '', ho=f.get('harvest') or '', c=r['catalogId'], row=r['sourceRow'])
    if dup is not None:
        out[dup]['cat'] = r['catalogId']; herb['p'] = dup; herbier.append(herb); stats['deja'] += 1; continue
    if not edible or aquatic or indoor or mushroom or not name:
        herb['why'] = 'plante aquatique (mare)' if aquatic else 'culture en intérieur' if indoor else 'champignon' if mushroom else 'non comestible (auxiliaire ou ornementale)'
        herbier.append(herb); stats['herbier'] += 1; continue
    # ---- plante jouable ----
    h = height_m(f.get('height')); parts = f.get('edibleParts') or ''; sec = secteur(parts, typ)
    life = norm(f.get('lifecycle'))
    layer = norm(f.get('layer'))
    herbtype = any(w in tn for w in ('plante comestible', 'aromat', 'fleur', 'herbe', 'tisane', 'ornementale'))
    if 'grimpant' in tn or 'liane' in tn: strate = 'Grimpante'
    elif 'arbre' in tn and 'arbuste' not in tn: strate = 'Arbre'
    elif 'arbuste' in tn: strate = 'Arbuste'
    elif sec in ('racine', 'tubercule'): strate = 'Racine'
    elif herbtype:
        strate = 'Arbuste' if (h and h >= 2.5) else 'Couvre-sol' if (h and h <= .3) else 'Herbacée'
    elif h and h >= 4: strate = 'Arbre'
    elif h and h >= 1.4: strate = 'Arbuste'
    elif 'haute' in layer or 'emergente' in layer: strate = 'Arbuste'
    elif (h and h <= .3) or 'basse' == layer: strate = 'Couvre-sol'
    else: strate = 'Herbacée'
    woody = strate in ('Arbre', 'Arbuste', 'Grimpante')
    annual = ('annuel' in life or 'bisannuel' in life) and 'vivace' not in life
    if woody: kind = 'vivace'
    elif annual or strate == 'Racine': kind = 'annuelle'
    else: kind = 'continue'
    semis = months(f.get('sowing')) or months(f.get('planting'))
    if not semis: semis = [10, 11, 2, 3] if woody else ([3, 4, 5] if kind == 'annuelle' else [3, 4, 5, 9])
    rec = months(f.get('harvest'))
    estH = False
    if not rec:
        estH = True
        rec = {'F': [8, 9, 10], 'B': [7, 8], 'O': [9, 10], 'L': [4, 5, 6, 7, 8, 9, 10], 'R': [9, 10, 11], 'G': [8, 9]}[SEC[sec][3]]
        if sec == 'default': rec = [7, 8, 9]
        if woody and sec == 'feuilles': rec = [4, 5, 6, 7, 8, 9]
    yrs = first_fruit_years(f.get('firstFruit'))
    germ, croiss, juv = {'Racine': (8, 90, 0), 'Herbacée': (12, 85, 0), 'Couvre-sol': (14, 80, 0), 'Arbuste': (30, 180, 2), 'Grimpante': (30, 200, 3), 'Arbre': (60, 200, 5)}[strate]
    if kind == 'continue': croiss += 20
    if woody: juv = yrs if yrs else juv
    if strate == 'Arbre' and sec == 'oleag': juv = max(juv, 6)
    # eau, soleil, gel
    wt = norm(f.get('water')); eau = 1 if 'faible' in wt else 3 if 'fort' in wt else 2
    if not wt and 'secheresse' in norm(f.get('drought')): eau = 1
    ex = norm(f.get('exposure')); soleil = 6 if ex.startswith('soleil') and 'mi' not in ex else 5 if 'soleil' in ex else 3 if 'mi' in ex else 5
    tm = nums(f.get('temperature')); gel = -tm[0] if tm and '-' in (f.get('temperature') or '') else (0 if tm else None)
    if gel is None:
        hd = norm(f.get('hardiness')); gel = -20 if hd == 'forte' else -12 if 'moyenne a forte' in hd else -8 if hd == 'moyenne' else -4 if 'fragile' in hd and 'tres' not in hd else -1 if 'tres' in hd else (-12 if woody or kind == 'continue' else -3)
    gel = int(gel)
    if kind == 'annuelle' and gel < -5 and not woody: pass
    # rendement (estimé selon la catégorie d'organe récolté et la strate)
    base = {'Arbre': 14, 'Arbuste': 3, 'Grimpante': 4, 'Herbacée': .4, 'Couvre-sol': .15, 'Racine': .5}[strate]
    if sec == 'oleag': base = {'Arbre': 4, 'Arbuste': 1.2, 'Grimpante': 2}.get(strate, .3)
    if sec == 'baies' and strate == 'Arbuste': base = 2.5
    if sec in ('feuilles', 'legume') and woody: base = 1.5
    if sec == 'tubercule': base = .8
    if sec == 'graines': base = {'Herbacée': .25}.get(strate, 1.5)
    kcal = SEC[sec][2]; prot = {'oleag': 14, 'graines': 11, 'feuilles': 2.4, 'legume': 2.2}.get(sec, 1.0)
    cons = {'F': 30, 'B': 3, 'O': 300, 'L': 4, 'R': 60, 'G': 365}[SEC[sec][3]] if sec != 'default' else 7
    # étiquettes
    gen = (latin.split() or [''])[0].lower(); gen = norm(gen)
    tags = []
    if gen in AZOTE: tags.append('azote')
    if gen in MELL or 'fleur' in tn or sec == 'default' and 'aromat' in tn: tags.append('mellifere')
    if gen in REPUL or 'aromat' in tn: tags.append('repulsif')
    if gen in MULCH: tags.append('mulch')
    if (gen in GOURM or (strate in ('Arbre',) and sec in ('fruits', 'agrume'))) and 'azote' not in tags: tags.append('gourmand')
    tags = list(dict.fromkeys(tags))
    # rareté
    hdn = norm(f.get('hardiness'))
    if 'tres' in hdn or 'tropical' in norm(f.get('climate')) or gel > -6 and woody or gel >= 0 or yrs and yrs >= 6: rar = 'Rare'
    elif woody or sec in ('agrume', 'oleag'): rar = 'Peu commune'
    else: rar = 'Commune'
    if 'fragile' in hdn and rar == 'Commune': rar = 'Peu commune'
    # apparence
    emoji, col = SEC[sec][0], SEC[sec][1]
    for kw, em in EMO_NAME:
        if kw in nn: emoji = em; break
    else:
        if strate == 'Arbre': emoji = '🌳'
        elif strate == 'Grimpante': emoji = '🍇'
        elif strate == 'Arbuste' and sec in ('fruits', 'baies'): emoji = '🫐'
        elif sec == 'fruits': emoji = '🍓'
        elif 'aromat' in tn: emoji = '🌿'
        elif 'fleur' in tn: emoji = '🌸'
    prop = 'Plant' if woody or kind == 'continue' else 'Graine'
    if re.search('semis', norm(f.get('propagation')) + norm(f.get('sowing'))) and not woody: prop = 'Graine'
    if woody and 'semis' in norm(f.get('propagation')) and sec in ('fruits', 'oleag'): prop = 'Graine'
    bits = [cap(typ) if typ else cap(strate)]
    if f.get('height'): bits.append(f['height'] + (' de haut' if 'm' in f['height'] else ''))
    if f.get('exposure'): bits.append(f['exposure'])
    if f.get('temperature'): bits.append('supporte ' + f['temperature'].strip())
    note = ' · '.join(bits) + '.'
    if f.get('pollination') and len(f['pollination']) < 90 and woody: note += ' Pollinisation : ' + f['pollination'] + '.'
    pid = len(out)
    out.append(dict(name=name, latin=latin, emoji=emoji, strate=strate, propagation=prop, semis=semis, recolte=rec, germ=germ, croiss=croiss, juv=int(juv), eau=eau, soleil=soleil, gel=gel,
                    kg=base, kcal=kcal, prot=prot, cons=cons, rarete=rar, note=note, kind=kind, tags=tags, col=col, regrow=7 if kind == 'continue' and woody is False and sec in ('feuilles', 'default') else (10 if kind == 'continue' else 0),
                    est=True, estH=estH, cat=r['catalogId'], row=r['sourceRow'], id=pid, perenne=bool('vivace' in life and not woody)))
    herb['p'] = pid; herbier.append(herb); stats['jouable'] += 1
    stats['strate_' + strate] += 1; stats['rar_' + rar] += 1

for i, p in enumerate(out): p['id'] = i

# --- fenêtre de plantation : arbres, arbustes, grimpantes et vivaces se plantent d'octobre à mars ---
WIN = [10, 11, 12, 1, 2, 3]
PERENNIAL_HERBS = {'Ciboulette', 'Thym', 'Menthe', 'Sauge', 'Romarin', 'Fraisier des bois', 'Trèfle blanc', 'Consoude', 'Rhubarbe', 'Artichaut', 'Topinambour'}
for p in out:
    if p['strate'] in ('Arbre', 'Arbuste', 'Grimpante'): p['semis'] = sorted(WIN)
    elif (p['id'] < 51 and p['name'] in PERENNIAL_HERBS) or p.get('perenne'): p['semis'] = sorted(set(p['semis']) | set(WIN))
print(stats)
print('semis vides', sum(1 for p in out if not p['semis']), 'rec vides', sum(1 for p in out if not p['recolte'] and p['kg'] > 0))
json.dump(out, open(B + 'build2/plants2.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
json.dump(herbier, open(B + 'build2/herbier.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(len(out), len(herbier), os.path.getsize(B + 'build2/plants2.json'), os.path.getsize(B + 'build2/herbier.json'))

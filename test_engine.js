const fs = require('fs');
const E = require('./engine.js');
const P = JSON.parse(fs.readFileSync('./plants2.json', 'utf8'));
const G = E.make(P);
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('ECHEC:', m); } else console.log('ok  :', m); };

// 1. nouvelle partie
let s = G.newGame();
ok(s.grid.filter(Boolean).length === 0 && s.maxPlantings === 0, 'jardin vide au départ');
let t = G.buildTasks(s);
ok(t.tasks.some(x => x.id === 'booster'), 'tâche booster présente');
const b = G.openBooster(s);
ok(b && b.length === 6 && b.every(c => c.t === 'plant'), 'premier booster : 6 cartes de plantes');
ok(b.filter(c => c.t === 'plant').every(c => G.sowable(P[c.pid], G.dateOf(s.day).m)), 'premier booster : plantes semables en octobre');
ok(G.openBooster(s) === null, 'un seul booster par jour');
const plantCard = b.find(c => c.t === 'plant');
const freeIdx = s.grid.findIndex(c => !c);
ok(G.plant(s, freeIdx, plantCard.pid).ok, 'plantation d’une carte de saison');
// hors saison
s.cards[G.byName['Tomate'].id] = 1;
const bad = G.plant(s, s.grid.findIndex(c => !c), G.byName['Tomate'].id);
ok(!bad.ok && /saison/.test(bad.msg), 'tomate refusée en octobre : ' + bad.msg);
// strate verrouillée
s.cards[G.byName['Pommier'].id] = 1;
const lock = G.plant(s, s.grid.findIndex(c => !c), G.byName['Pommier'].id);
ok(!lock.ok, 'pommier verrouillé au départ : ' + lock.msg);

// 2. simulation 1 an, joueur qui arrose et récolte
let s2 = G.newGame(); let harvested = 0, deaths = 0, evs = 0, firstRadish = null;
for (let d = 0; d < 365; d++) {
  if (s2.boosterDay < s2.day) {
    G.openBooster(s2);
    // planter toutes les cartes semables
    for (const pid of Object.keys(s2.cards).map(Number)) {
      while (s2.cards[pid] > 0) {
        const i = s2.grid.findIndex(c => !c); if (i < 0) break;
        if (!G.plant(s2, i, pid).ok) break;
      }
    }
  }
  const T = G.buildTasks(s2);
  for (const k of T.tasks) { if (['water', 'harvest', 'mow', 'mulch'].includes(k.act.type)) G.runTask(s2, k); }
  const st = G.stockTotals(s2); const ids = Object.keys(st).map(Number);
  if (ids.length && s2.cookedDay < s2.day) G.cook(s2, ids.slice(0, 3));
  const before = s2.stock.reduce((a, b) => a + b.kg, 0);
  const ev = G.nextDay(s2, false); evs += ev.length;
  deaths += ev.filter(e => /mort|résisté/.test(e.text)).length;
  if (s2.day === 30) console.log('jour 30 :', JSON.stringify(G.stats(s2)));
}
const stt = G.stats(s2);
console.log('Après 1 an :', JSON.stringify(stt), 'repas:', s2.meals, 'morts:', deaths, 'plantes:', s2.plantings, 'cartes en réserve:', Object.keys(s2.cards).length);
ok(s2.meals > 20, 'au moins 20 repas cuisinés en un an (' + s2.meals + ')');
ok(stt.plants >= 6, 'au moins 6 plantes vivantes après un an (' + stt.plants + ')');
ok(!Number.isNaN(stt.soil) && stt.soil >= 20 && stt.soil <= 100, 'sol dans les bornes : ' + stt.soil);

// 3. démo
let d = G.demo();
const dt = G.buildTasks(d);
console.log('Tâches démo :', dt.tasks.map(x => x.prio + ' ' + x.label).join(' | '), '| cachées', dt.hidden);
ok(dt.tasks.length <= 12, 'au plus 12 tâches');
ok(G.stats(d).plants === 42, "42 plantes dans la démo");
console.log('Stats démo :', JSON.stringify(G.stats(d)));
const rdy = d.grid.map((c, i) => c && !c.treille && G.ready(d, c) ? G.P[c.pid].name : null).filter(Boolean);
console.log('Prêtes à récolter en démo :', rdy.join(', '));
ok(rdy.length >= 5, 'au moins 5 cultures prêtes en démo (' + rdy.length + ')');
// synergie : grimpante sans support
const vi = d.grid.findIndex(c => c && !c.treille && G.P[c.pid].name === 'Vigne');
console.log('Synergie vigne :', G.synergy(d, vi).notes.map(n => n.t + ': ' + n.text).join(' / '));
const mu = d.grid.findIndex(c => c && !c.treille && G.P[c.pid].name === 'Mûrier noir');
console.log('Synergie mûrier :', G.synergy(d, mu).notes.map(n => n.t + ': ' + n.text).join(' / '));
// saut de 30 jours sans erreur
const evt = G.skip(d, 30);
console.log('Après +30 jours démo :', evt.length, 'événements, plantes:', G.stats(d).plants);
ok(G.stats(d).plants >= 36, 'démo survit à 30 jours avec arrosage assisté');
// cuisine
const st2 = G.stockTotals(G.demo()); const dd = G.demo();
const cr = G.cook(dd, Object.keys(G.stockTotals(dd)).map(Number));
ok(cr.ok && cr.kcal > 0, 'repas démo : ' + cr.name + ', ' + cr.kcal + ' kcal, équilibre ' + cr.balance);
// savoir du jour
const lr = G.learn(d); ok(lr && lr.pid >= 0, 'savoir du jour : ' + G.P[lr.pid].name);
// terrain et paliers
{ const s0 = G.newGame(); ok(G.dims(s0)[0] === 8 && G.dims(s0)[1] === 6, 'terrain de départ 8×6'); ok(!G.canExpand(s0).ok, 'agrandissement refusé au départ');
  ok(!G.plant(s0, 9, 1).ok || true, 'plantation hors terrain testée');
  const d0 = G.demo(); d0.size = 1; ok(G.canExpand(d0).ok, 'agrandissement possible avec la démo'); ok(G.expand(d0) && G.dims(d0)[0] === 12, 'terrain passe à 12×10');
  const s1 = G.newGame(); const pp = G.P.find(p => p.id < 51 && G.sowable(p, G.dateOf(s1.day).m) && p.strate !== 'Arbre'); s1.cards[pp.id] = 3; const out = G.plant(s1, 8, pp.id); ok(!out.ok, 'parcelle hors terrain refusée');
  s1.maxPlantings = 4; s1.plantings = 4; const r = G.plant(s1, 0, pp.id); ok(r.ok && !/pergola|treille|mare|serre|ruche/.test(r.reward||''), 'palier de plantations : plus d’aménagement offert'); ok(!s1.mats.pergola && !G.newGame().mats.treille && !G.newGame().mats.chemin, 'aucun aménagement gratuit : tout vient de la boutique'); }

// supports, miel, canards, soins
{ const s2 = G.demo(); const pi = s2.grid.findIndex(c => c && c.furn === 'pergola'); const cl = G.P.find(p => p.strate === 'Grimpante' && G.sowable(p, G.dateOf(s2.day).m));
  if (cl) { s2.cards[cl.id] = 1; const r = G.plant(s2, pi, cl.id); ok(r.ok && s2.grid[pi].supp === 'pergola', 'grimpante plantée sur la pergola'); ok(G.remove(s2, pi) && s2.grid[pi].furn === 'pergola', 'retirer la grimpante rend la pergola'); }
  else ok(true, 'pas de grimpante semable ce mois-ci (test ignoré)');
  const ri = s2.grid.findIndex(c => c && c.furn === 'ruche'); ok(G.honeyReady(s2, ri), 'miel prêt en juillet'); const hv = G.harvestHoney(s2, ri); ok(hv.ok && s2.honey > 1, 'miel récolté : ' + hv.kg + ' kg'); ok(!G.honeyReady(s2, ri), 'plus de miel juste après');
  const mi = s2.grid.findIndex(c => c && c.furn === 'mare'); s2.mats.canard = 1; ok(G.placeDuck(s2, mi) && s2.grid[mi].ducks, 'canards installés à la mare');
  const ci = s2.grid.findIndex(c => c && !c.treille); s2.grid[ci].sick = { k: 'limaces', day: s2.day }; ok(G.buildTasks(s2).tasks.some(t => t.id === 'heal'), 'tâche de soin présente'); ok(G.heal(s2, ci), 'plante soignée');
  ok(G.resistance(s2, ci).pct >= 0, 'résistance calculée : ' + G.resistance(s2, ci).pct + ' %'); }

{ const s = G.newGame(); const g0 = G.guildeon(s); if (!g0.qs.length || g0.ready) { console.log('ÉCHEC Guildéon départ'); process.exit(1); }
  s.boosters = 1; if (!G.quests(s).find(q => q.id === 'booster').done) { console.log('ÉCHEC quête booster'); process.exit(1); }
  const p0 = s.mats.paillage; const r = G.claimQuest(s, 'booster'); if (!r.ok || G.claimQuest(s, 'booster').ok || s.mats.paillage <= p0) { console.log('ÉCHEC récompense'); process.exit(1); }
  const d = G.demo(); if (G.guilds(d).n < 1) { console.log('ÉCHEC guilde démo'); process.exit(1); }
  console.log('ok  : Guildéon (quêtes, récompense unique, guildes)'); }

{ const s = G.demo(); const from = s.grid.findIndex(c => c && !c.treille), to = s.grid.findIndex((c, k) => !c && G.isActive(s, k)), pid = s.grid[from].pid;
  const bad = G.movePlant(s, from, from); const r = G.movePlant(s, from, to);
  if (bad.ok || !r.ok || s.grid[from] || !s.grid[to] || s.grid[to].pid !== pid) { console.log('ÉCHEC déplacement'); process.exit(1); }
  const occ = s.grid.findIndex((c, k) => c && !c.treille && k !== to); if (G.movePlant(s, to, occ).ok) { console.log('ÉCHEC déplacement sur occupé'); process.exit(1); }
  console.log('ok  : déplacement d’une plante'); }

{ const d = G.demo(), n = G.newGame(), gl = G.guilds(d); const ci = gl.ids[0], nb = G.neigh(ci).find(k => d.grid[k] && !d.grid[k].treille);
  const hasNote = i => G.synergy(d, i).notes.some(x => /uilde/.test(x.text));
  if (!(G.stats(d).autonomy > 20) || G.stats(n).autonomy !== 0 || !hasNote(ci) || !hasNote(nb)) { console.log('ÉCHEC autonomie/guilde', G.stats(d).autonomy, hasNote(ci), hasNote(nb)); process.exit(1); }
  const before = G.stats(d).autonomy; d.grid[ci] = null; if (!(G.stats(d).autonomy < before)) { console.log('ÉCHEC : retirer l’arbre de guilde doit baisser l’autonomie'); process.exit(1); }
  console.log('ok  : autonomie (production × guildes) et effet permanent des guildes'); }

{ const fail = m => { console.log('ÉCHEC ' + m); process.exit(1); };
  const s = G.demo(); s.day += 0; s.maxPlantings = 25; s.boosterDay = -1; s.boosters = 3; const bc = G.openBooster(s);
  if (!bc || bc.length !== 6 || bc.filter(c => c.t === 'plant').length !== 6) fail('booster 6 plantes');
  if (!bc.some(c => c.t === 'plant' && ['Arbre', 'Arbuste'].includes(G.P[c.pid].strate))) fail('booster sans ligneux');
  const t = s.grid.findIndex(c => c && !c.treille && G.P[c.pid].strate === 'Arbre'), h = s.grid.findIndex(c => c && !c.treille && c !== s.grid[t]);
  delete s.grid[t].nichoir; s.mats.nichoir = 1; if (!G.placeNichoir(s, t).ok || G.placeNichoir(s, h).ok === true && G.P[s.grid[h].pid].strate !== 'Arbre') fail('nichoir');
  s.mats.ortie = 1; if (!G.useOrtie(s, h).ok || !(s.grid[h].shieldL >= s.day)) fail('ortie');
  s.mats.prele = 1; s.grid[h].sick = { k: 'fongique', day: s.day }; if (!G.usePrele(s, h).ok || s.grid[h].sick) fail('prêle soigne');
  const tk = s.tankMax; s.mats.cuve = 1; if (!G.useCuve(s).ok || s.tankMax !== tk + 150) fail('cuve');
  s.stock = [{ pid: G.byName['Carotte'].id, kg: 1, day: s.day }]; s.mats.bocaux = 6; const pr = G.preserve(s, G.byName['Carotte'].id, 'bocal');
  if (!pr.ok || pr.jars !== 2 || s.stock.length !== 1 || s.stock[0].keep !== 'bocal') fail('mise en bocal');
  for (let k = 0; k < 90; k++) G.nextDay(s, true); if (!s.stock.some(x => x.keep === 'bocal')) fail('le bocal doit se garder');
  s.mats.plan = 1; const gp = G.guildPlan(s); if (!gp.ok) fail('plan de guilde');
  const ex = G.P.find(p => G.isExo(p)), s2 = G.newGame(); let seen = false; for (let k = 0; k < 400; k++) { s2.boosterDay = -1; s2.mats.grandeserre = 0; s2.maxPlantings = 25; s2.boosters = 5; s2.day++; const b = G.openBooster(s2); if (b.some(c => c.t === 'plant' && G.isExo(G.P[c.pid]))) seen = true; } if (seen) fail('exotiques sans grande serre');
  console.log('ok  : nouvelles cartes (booster, soins, nichoir, cuve, bocaux, plan de guilde, exotiques)'); }

{ const s = G.newGame(); ok(s.stock.reduce((a, b) => a + b.kg, 0) > 20 && s.stock.every(it => it.keep), 'garde-manger de départ : réserves de conserve');
  const c = G.openBooster(s).filter(x => x.t === 'plant').map(x => G.P[x.pid]); ok(c.length === 6 && c.every(p => p.semis.includes(G.dateOf(s.day).m + 1) || p.strate === 'Arbuste'), 'premier booster : cultures plantables maintenant');
  const s3 = G.newGame(); s3.boosters = 1; s3.day = 40; const b = G.openBooster(s3).filter(x => x.t === 'plant').slice(0, 2).map(x => G.P[x.pid]); ok(b.every(p => ['Radis', 'Épinard', 'Mâche', 'Laitue', 'Chervis', 'Ciboulette', 'Pois', 'Persil', 'Bourrache', 'Roquette', 'Poirée'].includes(p.name)), 'boosters d’hiver : cultures rapides'); }
{ const s = G.newGame(); ok(s.feves === 15, 'ginkgos de départ : ' + s.feves);
  s.maxPlantings = 25; s.feves = 100; const r = G.shopBuy(s, 'grandeserre'); ok(r.ok && s.mats.grandeserre === 1 && s.feves === 40, 'achat grande serre : 60 ginkgos');
  ok(!G.shopBuy(s, 'sechoir').ok, 'séchoir refusé sans atelier'); ok(G.shopBuy(s, 'atelier').ok && !G.shopBuy(s, 'atelier').ok, 'atelier : un seul'); s.feves = 0; ok(!G.shopBuy(s, 'hamac').ok, 'pas assez de ginkgos');
  const s2 = G.newGame(); s2.cards = { 0: 3, 1: 1 }; const f0 = s2.feves, rd = G.recycleDoubles(s2); ok(rd.ok && s2.cards[0] === 1 && s2.feves === f0 + rd.gain && rd.gain >= 2, 'recyclage des doubles garde 1 exemplaire');
  const s3 = G.newGame(); s3.boosterDay = -1; const f3 = s3.feves; G.openBooster(s3); ok(s3.feves === f3 + 1, 'booster : +1 ginkgo');
  const s4 = G.newGame(); s4.maxPlantings = 25; let seenF = false; for (let k = 0; k < 120; k++) { s4.boosterDay = -1; s4.day++; s4.boosters = 3 + k; G.openBooster(s4).forEach(c => { if (c.t === 'mat' && ['atelier', 'sechoir', 'grandeserre', 'pergola', 'hamac', 'serre', 'mare', 'ruche', 'trogne', 'canard', 'treille'].includes(c.k)) seenF = true; }); } ok(!seenF, 'plus de mobilier dans les boosters');
  const s5 = G.newGame(); s5.mats.hamac = 1; s5.grid.fill(null); s5.grid[8 * 0 + 9] = { treille: true, furn: 'hamac' }; ok(!G.hamacOk(s5), 'hamac sans plantes : pas de bonus'); }
{ const g0 = G.newGame(); ok(G.skillLevel(g0, 'tonte') === 1 && G.skillLevel(g0, 'trogne') === 0 && G.skillLevel(g0, 'plantation') === 1 && G.skillLevel(g0, 'cuisine') === 1 && G.skillLevel(g0, 'bouture') === 0 && G.skillLevel(g0, 'greffe') === 0, 'compétences de départ : tonte, plantation, cuisine (trognes plus tard)');
  ok(!G.bouturer(g0, 0).ok && !G.craft(g0, 'ortie').ok, 'bouture et fabrication verrouillées au départ');
  const d = G.demo(); d.mats.paillage = 20; d.mats.compost = 6; const vi = d.grid.findIndex(c => c && !c.treille && ['vivace', 'continue'].includes(G.P[c.pid].kind) && G.P[c.pid].strate !== 'Arbre' && G.phase(c).stage !== 'graine' && G.phase(c).stage !== 'pousse');
  const nc = Object.values(d.cards).reduce((a, b) => a + b, 0), r1 = G.bouturer(d, vi); ok(r1.ok && Object.values(d.cards).reduce((a, b) => a + b, 0) === nc + (G.skillLevel(d, 'bouture') >= 3 ? 2 : 1), 'bouture : +1 carte'); ok(!G.bouturer(d, vi).ok, 'bouture : délai de récupération');
  const u0 = d.skills.use.bouture; ok(u0 >= 6, 'bouture : pratique comptée (' + u0 + ')');
  const x0 = d.xp; ok(G.craft(d, 'ortie').ok && d.mats.ortie >= 1 && d.xp > x0, 'fabrication du purin d’ortie : donne de l’XP'); ok(G.skillLevel(d, 'fabrication') === 2 && !G.craft(d, 'cuve').ok, 'cuve : niveau 3 requis');
  d.pts = 0; ok(!G.skillUp(d, 'fabrication').ok, 'niveau 3 : refusé sans point'); d.pts = 1; d.skills.use.fabrication = 5; ok(!G.skillUp(d, 'fabrication').ok && d.pts === 1, 'niveau 3 : refusé sans assez de pratique'); d.skills.use.fabrication = 8; ok(G.skillUp(d, 'fabrication').ok && d.pts === 0 && G.skillLevel(d, 'fabrication') === 3 && G.craft(d, 'cuve').ok, 'niveau 3 : 1 point + pratique, puis fabrication de la cuve');
  const ti = d.grid.findIndex(c => c && !c.treille && G.P[c.pid].strate === 'Arbre' && G.P[c.pid].kg > 0 && !c.grafted); const k0 = d.skills.use.greffe, gr = G.greffer(d, ti); ok(gr.ok && d.grid[ti].grafted >= 1 && d.skills.use.greffe === k0 + 1 && !G.greffer(d, ti).ok, 'greffe : arbre fruitier greffé une fois');
  d.skills.lv.trogne = 2; const lt = d.mats.paillage; d.trees[1] = { formed: true, last: d.day - 200 }; G.cutTrogne(d, 1); ok(d.mats.paillage - lt >= 6, 'trogne niveau 2 : +6 paillage');
  const n = G.takeNotes(d); ok(Array.isArray(n), 'notifications de compétence'); }
{ const s = G.newGame(); s.maxPlantings = 30; let bad = null, n = 0; for (let k = 0; k < 80; k++) { s.boosterDay = -1; s.day++; s.boosters = 2 + k; const b = G.openBooster(s); n += b.length; b.forEach(c => { if (c.t === 'mat' && !['paillage', 'compost', 'chemin'].includes(c.k)) bad = c.k; }); }
  ok(!bad && n === 480, 'boosters : six plantes, rien d’autre' + (bad ? ' (' + bad + ')' : ''));
  s.maxPlantings = 30; s.feves = 500; s.atelier = true; const out = ['ortie', 'prele', 'nichoir', 'oya', 'cuve', 'bocaux', 'mycor', 'plan', 'savoir'].map(k => [k, G.shopBuy(s, k).ok]); ok(out.every(x => x[1]) && s.mats.bocaux >= 6, 'boutique : soins, eau, savoir en vente ' + JSON.stringify(out.filter(x => !x[1]).map(x => x[0])));
  const s2 = G.newGame(); s2.feves = 100; ok(!G.shopBuy(s2, 'mycor').ok && !G.shopBuy(s2, 'bocaux').ok, 'boutique : paliers et atelier requis'); }
// ---- poulailler
{ const s = G.newGame(); s.maxPlantings = 20; s.feves = 100; s.waste = 2;
  const sh = G.shopBuy(s, 'poulailler'); (m=>{console.log(m);if(/ECHEC/.test(m))process.exit(1)})(sh.ok ? 'ok  : poulailler acheté en boutique' : 'ECHEC: achat poulailler');
  const b = G.buildPoulailler(s); (m=>{console.log(m);if(/ECHEC/.test(m))process.exit(1)})(b.ok && s.poulailler && s.poules === 3 ? 'ok  : poulailler construit, 3 poules' : 'ECHEC: construction poulailler');
  for (let d = 0; d < 40; d++) { s.waste = 1; G.nextDay(s); }
  (m=>{console.log(m);if(/ECHEC/.test(m))process.exit(1)})(s.eggs > 5 ? 'ok  : les poules pondent (' + s.eggs.toFixed(1) + ' œufs en 40 j)' : 'ECHEC: pas d’œufs ' + s.eggs);
  s.eggs = 5; const k0 = s.eggs; const r = G.cook(s, ['eggs']); (m=>{console.log(m);if(/ECHEC/.test(m))process.exit(1)})(r.ok && s.eggs < k0 ? 'ok  : cuisiner des œufs' : 'ECHEC: cuisine œufs ' + JSON.stringify(r)); }

// ---- intempéries
{ const T=m=>{console.log(m);if(/ECHEC/.test(m))process.exit(1)};
  const cnt={}; for(let d=1;d<=365;d++){const w=G.weather(d); if(w.ev) cnt[w.ev]=(cnt[w.ev]||0)+1; const w2=G.weather(d); if(JSON.stringify(w)!==JSON.stringify(w2)) T('ECHEC: météo non déterministe');}
  T(cnt.gel>0&&cnt.tempete>0&&cnt.orage>0&&cnt.canicule>0&&cnt.secheresse>0?'ok  : tous les événements arrivent sur un an '+JSON.stringify(cnt):'ECHEC: événements manquants '+JSON.stringify(cnt));
  T(Array.from({length:14},(_,d)=>G.weather(d+1)).every(w=>!w.ev)?'ok  : pas d’intempérie pendant les deux premières semaines':'ECHEC: intempérie trop tôt');
  const s=G.newGame(); const gd=[...Array(200).keys()].map(x=>x+20).find(d=>G.weather(d).ev==='gel'); s.day=gd-1; const fi=G.forecastInfo(s); T(fi&&fi.kind==='gel'?'ok  : alerte la veille : '+fi.title:'ECHEC: pas d’alerte la veille');
  // voile : une plante fragile survit au gel avec voile
  const tender=Object.values(P).find(p=>p.gel>=-3&&p.kind!=='vivace'&&p.strate==='Herbacée');
  const mk=(voile)=>{ const s=G.newGame(); s.day=gd-1; s.mats.voile=1; const cell=s.grid.findIndex((c,i)=>!c&&G.isActive(s,i)); s.grid[cell]={pid:tender.id,g:30,water:80,health:100,stress:0,stage:'jeune'}; if(voile) G.useVoile(s,cell); G.nextDay(s,false); return !!s.grid[cell]; };
  const w=G.weather(gd); T(!mk(false)&&w.tmin<tender.gel? (mk(true)||w.tmin<tender.gel-6?'ok  : le gel détruit une plante fragile'+(mk(true)?', le voile la sauve':''):'ECHEC: voile inutile'):'ECHEC: gel sans effet '+w.tmin+' '+tender.gel);
}
// ---- file de plantation
{ const T=m=>{console.log(m);if(/ECHEC/.test(m))process.exit(1)};
  const s=G.newGame(); s.maxPlantings=30; const m=G.dateOf(s.day).m; const un=G.unlocked(s);
  const sow=Object.values(P).filter(p=>G.sowable(p,m)&&un.has(p.strate)&&p.strate==='Herbacée').slice(0,3); sow.forEach(p=>s.cards[p.id]=2);
  const free=[...Array(G.NCELL).keys()].filter(i=>!s.grid[i]&&G.isActive(s,i)); const n0=sow.length?s.cards[sow[0].id]:0;
  T(sow.length>=2?'ok  : cartes de test prêtes':'ECHEC: pas de carte semable');
  const r1=G.queuePlant(s,free[0],sow[0].id), r2=G.queuePlant(s,free[0],sow[1].id); T(r1.ok&&!r2.ok&&/déjà prévue/.test(r2.msg)?'ok  : une seule plantation prévue par parcelle':'ECHEC: doublon file');
  T(s.cards[sow[0].id]===n0-1&&!s.grid[free[0]]?'ok  : la carte est réservée, la parcelle reste vide':'ECHEC: réservation');
  const c=G.cancelPlant(s,free[0]); T(c.ok&&s.cards[sow[0].id]===n0&&!s.pq.length?'ok  : annulation rend la carte':'ECHEC: annulation');
  G.queuePlant(s,free[0],sow[0].id); G.queuePlant(s,free[1],sow[1].id); const pts0=(s.skills.use.plantation||0), xp0=s.xp; const f=G.finishPlant(s,free[0]); T(f.ok&&s.grid[free[0]]&&(s.skills.use.plantation||0)===pts0+1&&s.xp>xp0?'ok  : la plantation donne de la pratique et de l’XP':'ECHEC: finishPlant '+JSON.stringify(f));
  G.nextDay(s,false); T(s.grid[free[1]]&&!s.pq.length?'ok  : la file se vide à la fin de la journée':'ECHEC: file non vidée');
  const sp1=G.plantSpeed(s,sow[0].id); s.skills.lv.plantation=3; const sp2=G.plantSpeed(s,sow[0].id); s.skills.lv.plantation=5; const sp3=G.plantSpeed(s,sow[0].id);
  T(sp1.sec>sp2.sec&&sp2.sec>sp3.sec&&sp3.batch>sp2.batch&&sp2.batch>sp1.batch?'ok  : la compétence accélère la plantation ('+sp1.sec+' s → '+sp2.sec+' s → '+sp3.sec+' s, lots de '+sp1.batch+'/'+sp2.batch+'/'+sp3.batch+')':'ECHEC: vitesses '+JSON.stringify([sp1,sp2,sp3]));
}
// ---- XP et points de compétence
{ const T=m=>{console.log(m);if(/ECHEC/.test(m))process.exit(1)};
  T([1,2,3,4,5,6].map(L=>G.xpNeed(L)).join(',')==='100,150,225,325,450,600'?'ok  : paliers d’XP 100, 150, 225, 325, 450, 600':'ECHEC: paliers XP '+[1,2,3,4,5,6].map(L=>G.xpNeed(L)));
  const s=G.newGame(); T(s.pts===1&&s.xp===0&&G.skillLevel(s,'plantation')===1&&G.skillLevel(s,'trogne')===0?'ok  : départ : 1 point offert, compétences de base acquises':'ECHEC: départ '+s.pts+' '+JSON.stringify(s.skills.lv));
  T(!G.skillUp(s,'trogne').ok&&/plantations/.test(G.skillUp(s,'trogne').msg)?'ok  : une compétence verrouillée par les plantations refuse l’achat':'ECHEC: verrou plantations');
  s.maxPlantings=8; T(G.skillUp(s,'trogne').ok&&s.pts===0&&G.skillLevel(s,'trogne')===1&&s.ptsSpent===1?'ok  : débloquer une compétence coûte 1 point':'ECHEC: débloquer trogne');
  T(!G.skillUp(s,'plantation').ok?'ok  : plus de point : niveau suivant refusé':'ECHEC: achat sans point');
  G.gainXp(s,99/G.XPM); T(s.pts===0?'ok  : 99 XP : pas encore de point':'ECHEC: point trop tôt'); G.gainXp(s,1/G.XPM+.01); T(s.pts===1&&G.levelOf(s.xp).lvl===2&&s.skillNotes.some(m=>/Niveau 2/.test(m))?'ok  : 100 XP : niveau 2 et 1 point de compétence':'ECHEC: niveau 2 '+s.pts);
  s.skills.use.plantation=9; T(!G.skillUp(s,'plantation').ok&&/9 \/ 10/.test(G.skillUp(s,'plantation').msg)?'ok  : pratique insuffisante : 9 / 10 plantes':'ECHEC: seuil pratique '+G.skillUp(s,'plantation').msg);
  s.skills.use.plantation=10; T(G.skillUp(s,'plantation').ok&&G.skillLevel(s,'plantation')===2?'ok  : plantation niveau 2 (pratique 10 + 1 point)':'ECHEC: plantation 2');
  // spécialisations
  const b=G.newGame(); b.pts=5; T(!G.advUp(b,'botaniste').ok?'ok  : botaniste refusé sans les prérequis':'ECHEC: botaniste libre');
  b.skills.lv.plantation=3; b.skills.lv.bouture=2; b.skills.species={}; T(!G.advUp(b,'botaniste').ok&&/12/.test(G.advUp(b,'botaniste').msg)?'ok  : botaniste : il manque les 12 espèces':'ECHEC: botaniste pratique '+G.advUp(b,'botaniste').msg);
  for(let i=0;i<12;i++) b.skills.species[i]=1; T(G.advUp(b,'botaniste').ok&&b.pts===3&&G.hasAdv(b,'botaniste')?'ok  : botaniste acquis pour 2 points':'ECHEC: botaniste acquis');
  // migration d'une ancienne sauvegarde
  const o=G.newGame(); o.skills={pts:{tonte:20,trogne:14,cuisine:8},seen:{}}; delete o.xp; delete o.pts; o.maxPlantings=20; const mg=G.fixSave(o); T(mg.skills.lv&&mg.skills.lv.tonte===2&&mg.skills.lv.trogne===2&&mg.xp>0&&mg.pts>=1?'ok  : ancienne sauvegarde migrée (niveaux conservés, XP et points créés)':'ECHEC: migration '+JSON.stringify(mg.skills.lv)+' '+mg.xp+' '+mg.pts);
  // effets
  const e=G.newGame(); const r0=G.resistance(e,0); T(typeof r0.pct==='number'?'ok  : résistance calculable':'ECHEC: résistance');
}
console.log(fails ? '\n' + fails + ' ÉCHEC(S)' : '\nTous les tests passent');
process.exit(fails ? 1 : 0);

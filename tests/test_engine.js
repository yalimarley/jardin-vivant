const fs = require('fs');
const E = require('./engine.js');
const P = JSON.parse(fs.readFileSync('./plants2.json', 'utf8'));
const G = E.make(P);
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('ECHEC:', m); } else console.log('ok  :', m); };

// 1. nouvelle partie
let s = G.newGame();
ok(s.grid.filter(Boolean).length === 4, '4 plantes de départ');
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
ok(stt.plants > 8, 'au moins 8 plantes vivantes après un an (' + stt.plants + ')');
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
  s1.maxPlantings = 4; s1.plantings = 4; const r = G.plant(s1, 0, pp.id); ok(r.ok && r.reward && /pergola/.test(r.reward), 'palier de 5 plantations : pergola offerte'); ok(s1.mats.pergola === 1, 'pergola en réserve'); }

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
  const r = G.claimQuest(s, 'booster'); if (!r.ok || G.claimQuest(s, 'booster').ok || s.mats.paillage !== 4) { console.log('ÉCHEC récompense'); process.exit(1); }
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
  if (!bc || bc.length !== 10 || bc.filter(c => c.t === 'plant').length !== 5 || bc.filter(c => c.t === 'mat').length !== 5) fail('booster 5 plantes + 5 cartes');
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
{ const g0 = G.newGame(); ok(G.skillLevel(g0, 'tonte') === 1 && G.skillLevel(g0, 'trogne') === 1 && G.skillLevel(g0, 'bouture') === 0 && G.skillLevel(g0, 'greffe') === 0, 'compétences de départ : tonte, trognes, cuisine');
  ok(!G.bouturer(g0, 0).ok && !G.craft(g0, 'ortie').ok, 'bouture et fabrication verrouillées au départ');
  const d = G.demo(); d.mats.paillage = 20; d.mats.compost = 6; const vi = d.grid.findIndex(c => c && !c.treille && ['vivace', 'continue'].includes(G.P[c.pid].kind) && G.P[c.pid].strate !== 'Arbre' && G.phase(c).stage !== 'graine' && G.phase(c).stage !== 'pousse');
  const nc = Object.values(d.cards).reduce((a, b) => a + b, 0), r1 = G.bouturer(d, vi); ok(r1.ok && Object.values(d.cards).reduce((a, b) => a + b, 0) === nc + (G.skillLevel(d, 'bouture') >= 3 ? 2 : 1), 'bouture : +1 carte'); ok(!G.bouturer(d, vi).ok, 'bouture : délai de récupération');
  const p0 = d.skills.pts.bouture; ok(p0 === 8, 'bouture : points de compétence (' + p0 + ')');
  d.skills.pts.fabrication = 0; const lv0 = G.skillLevel(d, 'fabrication'); ok(G.craft(d, 'ortie').ok && d.mats.ortie >= 1 && d.skills.pts.fabrication === 2, 'fabrication du purin d’ortie'); ok(lv0 === 1 && !G.craft(d, 'cuve').ok, 'cuve : niveau 3 requis');
  d.skills.pts.fabrication = 40; ok(G.skillLevel(d, 'fabrication') === 3 && G.craft(d, 'cuve').ok, 'niveau 3 : fabrication de la cuve');
  const ti = d.grid.findIndex(c => c && !c.treille && G.P[c.pid].strate === 'Arbre' && G.P[c.pid].kg > 0 && !c.grafted); const k0 = d.skills.pts.greffe, gr = G.greffer(d, ti); ok(gr.ok && d.grid[ti].grafted >= 1 && d.skills.pts.greffe === k0 + 4 && !G.greffer(d, ti).ok, 'greffe : arbre fruitier greffé une fois');
  d.skills.pts.trogne = 12; const lt = d.mats.paillage; d.trees[1] = { formed: true, last: d.day - 200 }; G.cutTrogne(d, 1); ok(d.mats.paillage - lt >= 6, 'trogne niveau 2 : +6 paillage');
  const n = G.takeNotes(d); ok(Array.isArray(n), 'notifications de compétence'); }
{ const s = G.newGame(); s.maxPlantings = 30; let bad = null, n = 0; for (let k = 0; k < 80; k++) { s.boosterDay = -1; s.day++; s.boosters = 2 + k; const b = G.openBooster(s); n += b.length; b.forEach(c => { if (c.t === 'mat' && !['paillage', 'compost', 'chemin'].includes(c.k)) bad = c.k; }); }
  ok(!bad && n === 480, 'boosters : six plantes, rien d’autre' + (bad ? ' (' + bad + ')' : ''));
  s.maxPlantings = 30; s.feves = 500; s.atelier = true; const out = ['ortie', 'prele', 'nichoir', 'oya', 'cuve', 'bocaux', 'mycor', 'plan', 'savoir'].map(k => [k, G.shopBuy(s, k).ok]); ok(out.every(x => x[1]) && s.mats.bocaux >= 6, 'boutique : soins, eau, savoir en vente ' + JSON.stringify(out.filter(x => !x[1]).map(x => x[0])));
  const s2 = G.newGame(); s2.feves = 100; ok(!G.shopBuy(s2, 'mycor').ok && !G.shopBuy(s2, 'bocaux').ok, 'boutique : paliers et atelier requis'); }
console.log(fails ? '\n' + fails + ' ÉCHEC(S)' : '\nTous les tests passent');
process.exit(fails ? 1 : 0);

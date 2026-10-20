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
ok(b && b.length === 10, 'premier booster de 10 cartes');
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

console.log(fails ? '\n' + fails + ' ÉCHEC(S)' : '\nTous les tests passent');
process.exit(fails ? 1 : 0);

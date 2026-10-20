// ===== MOTEUR : pur JavaScript, sans DOM =====
(function (root) {
'use strict';
const START = Date.UTC(2026, 9, 19), DAYMS = 86400000;
const MONTHS = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
const COLS = 12, ROWS = 10, NCELL = COLS * ROWS;
const SIZES = [[8, 6], [10, 8], [12, 10]];
const SIZE_REQ = [null, { plant: 10, species: 6 }, { plant: 25, species: 14 }];
const MILESTONES = [[4, { trogne: 1 }, 'une carte Trogne (arbre têtard)'], [3, { treille: 1 }, 'une treille'], [5, { pergola: 1 }, 'une pergola'], [6, { mare: 1, canard: 1 }, 'une mare et un couple de canards coureurs indiens'], [8, { serre: 1 }, 'une serre froide'], [12, { ruche: 1 }, 'une ruche']];
const CLIM = [[1,9],[2,11],[4,14],[6,17],[10,21],[13,25],[15,28],[15,28],[12,24],[9,19],[5,13],[2,9]];
const RAINP = [.3,.27,.28,.32,.3,.24,.17,.2,.24,.3,.32,.32];
const EVAP = [2,2.5,4,6,8,11,14,13,9,6,3,2];
const SEASONF = [.15,.2,.5,.85,1,1,1,1,.9,.7,.35,.15];
const NEEDF = {1:.7, 2:1, 3:1.4};
const UNLOCK = {'Arbuste':2, 'Grimpante':4, 'Arbre':6};
const FURN = ['chemin', 'treille', 'pergola', 'serre', 'mare', 'ruche'];
const FURN_UNLOCK = { chemin: 0, treille: 3, pergola: 5, mare: 6, serre: 8, ruche: 12, trogne: 4, canard: 6 };
const MAT_QTY = { chemin: 3 };
const BOOSTER_SIZE = 10, NEED_KCAL = 2000, CORE = 51;
const SAVE_VERSION = 1;
const LAWN_N = 8, LAWN_DAYS = 14, TREE_N = 5, TREE_DAYS = 90, LAWN_MULCH = 2, TREE_MULCH = 4;
function defaultFamily() { return [{ n: 'Camille', role: 'Adulte', need: 2100, joy: 50, hist: [] }, { n: 'Julien', role: 'Adulte', need: 2400, joy: 50, hist: [] }, { n: 'Léa', role: '10 ans', need: 1900, joy: 50, hist: [] }, { n: 'Noé', role: '6 ans', need: 1500, joy: 50, hist: [] }]; }
const famNeed = s => (s.family || []).reduce((a, m) => a + m.need, 0) || NEED_KCAL;

function dateOf(day) { const d = new Date(START + day * DAYMS); return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate() }; }
function dayOfDate(y, m, d) { return Math.round((Date.UTC(y, m, d) - START) / DAYMS); }
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const r1 = v => Math.round(v * 10) / 10, r2 = v => Math.round(v * 100) / 100;
function weather(day) {
  const m = dateOf(day).m, r = mulberry(day * 7919 + 101), b = CLIM[m], sw = (r() - .5) * 7;
  const tmin = r1(b[0] + sw), tmax = r1(b[1] + sw + (r() - .5) * 2);
  const rain = r() < RAINP[m] ? r1(1 + r() * r() * 18) : 0;
  return { tmin, tmax, rain };
}
function neigh(i) {
  const c = i % COLS, r = (i / COLS) | 0, out = [];
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    if (!dr && !dc) continue;
    const cc = c + dc, rr = r + dr;
    if (cc >= 0 && cc < COLS && rr >= 0 && rr < ROWS) out.push(rr * COLS + cc);
  }
  return out;
}

function make(P) {
  const byName = {}; P.forEach(p => { if (!byName[p.name]) byName[p.name] = p; });
  const maturity = p => p.germ + p.croiss;
  const totalDays = p => maturity(p) + p.juv * 365;

  function blank() {
    return { v: SAVE_VERSION, day: 0, grid: Array(NCELL).fill(null), cards: {}, mats: { paillage: 2, compost: 1, treille: 1, chemin: 3, pergola: 0, serre: 0, mare: 0, ruche: 0, trogne: 0, canard: 0 }, honey: 0, lawn: Array(LAWN_N).fill(-99), trees: Array.from({ length: TREE_N }, () => ({ formed: false, last: -999 })), boostUntil: -1, size: 0, rewarded: { 3: true }, family: defaultFamily(),
      tank: 300, tankMax: 500, stock: [], eaten: [], boosterDay: -1, boosters: 0, plantings: 0, maxPlantings: 0,
      cookedDay: -1, learnedDay: -1, knowledge: [], log: [], doneToday: { day: 0, n: 0 }, demo: false, w: weather(0), soil: 45, meals: 0 };
  }
  function cell(pid, day, g) { return { pid, g: g || 0, water: 85, health: 100, stress: 0, mulch: false, compostUntil: -1, lastPick: -9999, born: day, ready: false, stage: 'graine' }; }
  function dims(s) { return SIZES[s.size || 0]; }
  function isActive(s, i) { const d = dims(s); return (i % COLS) < d[0] && ((i / COLS) | 0) < d[1]; }
  function newGame() {
    const s = blank();
    [['Trèfle blanc', 1, 3, 20], ['Radis', 3, 3, 12], ['Ail', 5, 2, 16], ['Fève', 6, 4, 18]].forEach(([n, c, r, g]) => { s.grid[r * COLS + c] = cell(byName[n].id, 0, g); });
    s.plantings = 4; s.maxPlantings = 4;
    log(s, 'good', 'Bienvenue. Trois plantes de saison sont déjà en terre. Ouvre ton booster du jour.');
    return s;
  }
  function log(s, type, text) { s.log.unshift({ day: s.day, type, text }); if (s.log.length > 60) s.log.length = 60; }

  function unlocked(s) {
    const u = new Set(['Racine', 'Herbacée', 'Couvre-sol']);
    for (const k in UNLOCK) if (s.maxPlantings >= UNLOCK[k]) u.add(k);
    return u;
  }
  function phase(c) {
    const p = P[c.pid], mat = maturity(p), tot = totalDays(p); let stage;
    if (c.g < p.germ) stage = 'graine';
    else if (c.g < p.germ + .35 * p.croiss) stage = 'pousse';
    else if (c.g < mat) stage = 'croissance';
    else if (c.g < tot) stage = 'jeune';
    else stage = 'mature';
    return { stage, prog: clamp(c.g / tot, 0, 1), total: tot, left: Math.max(0, tot - c.g) };
  }
  function inWindow(p, m) { return p.recolte.indexOf(m + 1) >= 0; }
  function sowable(p, m) { return p.semis.indexOf(m + 1) >= 0; }

  // ----- synergies de voisinage -----
  function synergy(s, i) {
    const c = s.grid[i], res = { growth: 0, yield: 0, evap: 1, notes: [], score: 0 };
    if (!c || c.treille) return res;
    const p = P[c.pid], m = dateOf(s.day).m;
    let azote = 0, mell = 0, rep = 0, couvre = 0, mul = 0, comp = 0, same = 0, support = false, tree = null, pathNear = -1;
    const add = (t, text, from, g, y) => {
      res.growth += g || 0; res.yield += y || 0;
      const ex = res.notes.find(n => n.text === text);
      if (ex) { ex.n++; ex.froms.push(from); return; }
      res.notes.push({ t, text, from, froms: [from], n: 1 }); res.score += t === 'good' ? 1 : -1;
    };
    for (const j of neigh(i)) {
      const n = s.grid[j]; if (!n) continue;
      if (n.treille || n.supp) {
        const f = n.treille ? (n.furn || 'treille') : n.supp;
        if ((f === 'treille' || f === 'pergola') && p.strate === 'Grimpante') support = true;
        if (f === 'pergola' && p.soleil <= 4 && m >= 4 && m <= 7) add('good', 'La pergola voisine donne une ombre fraîche : ' + p.name + ' apprécie.', j, .06, 0);
        if (f === 'mare' && n.ducks) add('good', 'Les canards coureurs indiens de la mare mangent les limaces : ' + p.name.toLowerCase() + ' est mieux protégé.', j, .02, .03);
        if (f === 'mare') { res.evap = Math.min(res.evap, .85); add('good', 'La mare voisine garde l’air humide et attire grenouilles et libellules : moins de limaces, plus de pollinisateurs.', j, .03, .07); }
        if (f === 'serre') add('good', 'La serre voisine abrite du gel et réchauffe le sol en hiver.', j, (m >= 10 || m <= 2) ? .12 : 0, 0);
        if (f === 'chemin') pathNear = j;
        if (f === 'ruche' && (p.kind === 'vivace' || p.tags.includes('gourmand'))) add('good', 'La ruche voisine : les abeilles pollinisent, plus de fruits pour ' + p.name + '.', j, 0, .1);
        if (n.treille) continue;
      }
      const q = P[n.pid], st = phase(n).stage;
      if (p.strate === 'Grimpante' && (q.strate === 'Arbre' || q.strate === 'Arbuste')) support = true;
      if (st === 'graine') continue;
      if (q.tags.includes('azote') && p.tags.includes('gourmand') && azote < 2) { azote++; add('good', q.name + ' fixe l’azote de l’air : ' + p.name + ' en profite.', j, .12, .12); }
      if (q.tags.includes('mellifere') && (p.kind === 'vivace' || (p.tags.includes('gourmand') && p.kg >= 1)) && q.pid !== c.pid && mell < 2) { mell++; add('good', q.name + ' attire les pollinisateurs : plus de fruits pour ' + p.name + '.', j, 0, .1); }
      if (q.tags.includes('repulsif') && q.pid !== c.pid && rep < 2) { rep++; add('good', q.name + ' (odeur forte) éloigne une partie des ravageurs.', j, .03, .08); }
      if (q.strate === 'Couvre-sol' && couvre < 1 && q.pid !== c.pid) { couvre++; res.evap = .8; add('good', q.name + ' couvre le sol : il garde l’humidité, tu arroses moins.', j, 0, 0); }
      if (q.tags.includes('mulch') && mul < 1) { mul++; add('good', q.name + ' nourrit le sol quand on la fauche.', j, .08, 0); }
      if (q.strate === 'Arbre' && p.strate === 'Arbre' && comp < 2) { comp++; add('bad', 'Deux arbres côte à côte se disputent lumière et eau.', j, -.15, -.1); }
      if (q.strate === 'Arbre' && p.strate !== 'Arbre') { const qs = phase(n).stage; if (qs === 'jeune' || qs === 'mature') tree = { j, q }; }
      if (n.pid === c.pid && same < 1 && !(p.strate === 'Couvre-sol')) { same++; add('bad', 'Même espèce voisine : les maladies se transmettent plus vite.', j, -.1, 0); }
    }
    if (c.supp) support = true;
    if (p.strate === 'Grimpante') {
      if (support) add('good', p.name + (c.supp ? ' grimpe sur ' + (c.supp === 'pergola' ? 'la pergola' : 'la treille') + '.' : ' grimpe sur le support voisin.'), -1, c.supp ? .06 : 0, c.supp ? .06 : 0);
      else add('bad', p.name + ' n’a rien pour grimper : pose une treille ou une pergola, ou plante-la près d’un arbuste.', -1, -.4, -.2);
    }
    // accès : une plante à plus de deux parcelles du bord et sans chemin voisin est piétinée à chaque soin
    { const dm = dims(s), r = (i / COLS) | 0, cc = i % COLS, edge = Math.min(r, dm[1] - 1 - r, cc, dm[0] - 1 - cc);
      if (pathNear >= 0) add('good', 'Un chemin voisin : tu soignes ' + p.name.toLowerCase() + ' sans piétiner le sol.', pathNear, .03, .02);
      else if (edge >= 2) add('bad', 'Parcelle enclavée : tu piétines le sol pour atteindre ' + p.name.toLowerCase() + '. Trace un chemin à côté.', -1, -.06, -.08); }
    if (tree) {
      if (p.soleil >= 6) add('bad', tree.q.name + ' fait de l’ombre : ' + p.name + ' manque de soleil (besoin : ' + p.soleil + ' h).', tree.j, -.25, -.25);
      else if (p.soleil <= 4 && m >= 4 && m <= 7) add('good', tree.q.name + ' donne une ombre d’été que ' + p.name + ' apprécie.', tree.j, .08, 0);
    }
    res.growth = clamp(res.growth, -.6, .5); res.yield = clamp(res.yield, -.5, .5);
    return res;
  }

  // ----- récolte -----
  function ready(s, c) {
    if (!c || c.treille) return false;
    const p = P[c.pid]; if (!p.recolte.length || p.kg <= 0) return false;
    if (phase(c).stage !== 'mature') return false;
    if (!inWindow(p, dateOf(s.day).m)) return false;
    if (p.kind === 'annuelle') return true;
    if (p.kind === 'continue') return s.day - c.lastPick >= p.regrow;
    return s.day - c.lastPick >= 200;
  }
  function yieldKg(s, i) {
    const c = s.grid[i], p = P[c.pid], sy = synergy(s, i);
    let kg = p.kind === 'continue' ? p.kg * .3 : p.kg;
    if (p.kind === 'vivace' && p.juv > 0) { const yrs = (c.g - totalDays(p)) / 365; kg *= Math.min(1, .35 + .65 * Math.max(0, yrs) / 4); }
    return Math.max(0, r2(kg * (c.health / 100) * (1 + sy.yield) * (c.pruned === pruneKey(s) ? 1.1 : 1) * (c.sick ? .7 : 1)));
  }
  function harvest(s, i) {
    const c = s.grid[i]; if (!ready(s, c)) return { ok: false };
    const p = P[c.pid], kg = yieldKg(s, i);
    s.stock.push({ pid: p.id, kg, day: s.day });
    if (p.kind === 'annuelle') { s.grid[i] = null; s.soil = clamp(s.soil + .3, 0, 100); }
    else c.lastPick = s.day;
    log(s, 'good', 'Récolte : ' + kg.toFixed(2).replace('.', ',') + ' kg de ' + p.name.toLowerCase() + '.');
    bump(s); return { ok: true, kg, name: p.name };
  }
  function mowReady(s, c) { return c && !c.treille && P[c.pid].tags.includes('mulch') && phase(c).stage !== 'graine' && phase(c).stage !== 'pousse' && s.day - c.lastPick >= 21; }
  function mow(s, i) { const c = s.grid[i]; if (!mowReady(s, c)) return false; c.lastPick = s.day; s.mats.paillage += 2; log(s, 'good', 'Consoude fauchée : +2 paillage.'); bump(s); return true; }
  function bump(s) { if (s.doneToday.day !== s.day) s.doneToday = { day: s.day, n: 0 }; s.doneToday.n++; }

  // ----- actions -----
  function plant(s, i, pid) {
    const p = P[pid];
    if (!p) return { ok: false, msg: 'Carte inconnue.' };
    if (!(s.cards[pid] > 0)) return { ok: false, msg: 'Tu n’as plus cette carte.' };
    if (!isActive(s, i)) return { ok: false, msg: 'Cette parcelle n’est pas encore à toi : agrandis le terrain.' };
    const occ = s.grid[i];
    if (occ && !(occ.treille && (occ.furn === 'treille' || occ.furn === 'pergola') && p.strate === 'Grimpante')) return { ok: false, msg: 'Cette parcelle est occupée.' };
    if (!unlocked(s).has(p.strate)) return { ok: false, msg: 'Strate pas encore débloquée.' };
    const m = dateOf(s.day).m;
    if (!sowable(p, m)) return { ok: false, msg: 'Pas la bonne saison pour ' + p.name.toLowerCase() + ' (' + (['Arbre', 'Arbuste', 'Grimpante'].includes(p.strate) ? 'plantation' : 'semis') + ' : ' + monthRange(p.semis) + '). Garde la carte.' };
    s.cards[pid]--; if (!s.cards[pid]) delete s.cards[pid];
    s.grid[i] = cell(pid, s.day); if (occ && occ.treille) s.grid[i].supp = occ.furn; s.plantings++; s.maxPlantings = Math.max(s.maxPlantings, s.plantings);
    log(s, 'good', p.name + ' planté' + (p.propagation === 'Plant' ? '' : ' (' + p.propagation.toLowerCase() + ')') + '.');
    let reward = null; const gl = []; s.rewarded = s.rewarded || {};
    for (const [n, gift, label] of MILESTONES) if (s.maxPlantings >= n && !s.rewarded[n]) { s.rewarded[n] = true; for (const k in gift) s.mats[k] = (s.mats[k] || 0) + gift[k]; gl.push(label); }
    if (gl.length) { reward = 'Palier de plantations : tu reçois ' + gl.join(', ') + '.'; log(s, 'good', reward); }
    bump(s); return { ok: true, reward };
  }
  function canExpand(s) {
    const n = (s.size || 0) + 1; if (n >= SIZES.length) return { ok: false, done: true };
    const rq = SIZE_REQ[n], sp = stats(s).species; const pl = s.maxPlantings;
    return { ok: pl >= rq.plant && sp >= rq.species, plant: [Math.min(pl, rq.plant), rq.plant], species: [Math.min(sp, rq.species), rq.species], to: SIZES[n] };
  }
  function expand(s) { const c = canExpand(s); if (!c.ok) return false; s.size = (s.size || 0) + 1; log(s, 'good', 'Terrain agrandi : ' + SIZES[s.size][0] + ' × ' + SIZES[s.size][1] + ' parcelles.'); bump(s); return true; }
  function placeFurn(s, i, k) { if (!FURN.includes(k) || !isActive(s, i) || s.grid[i] || !(s.mats[k] > 0)) return false; s.mats[k]--; s.grid[i] = { treille: true, furn: k }; if (k === 'ruche') s.grid[i].honeyDay = s.day; bump(s); return true; }
  function placeTreille(s, i) { return placeFurn(s, i, 'treille'); }
  function fixSave(s) { s.lawn = s.lawn && s.lawn.length === LAWN_N ? s.lawn : Array(LAWN_N).fill(-99); s.trees = s.trees && s.trees.length === TREE_N ? s.trees : Array.from({ length: TREE_N }, () => ({ formed: false, last: -999 })); if (s.boostUntil == null) s.boostUntil = -1; s.mats.trogne = s.mats.trogne || 0; s.mats.canard = s.mats.canard || 0; s.honey = s.honey || 0; return s; }
  function lawnReady(s, k) { return s.day - s.lawn[k] >= LAWN_DAYS; }
  function mowLawn(s, k) { if (!lawnReady(s, k)) return false; s.lawn[k] = s.day; s.mats.paillage += LAWN_MULCH; bump(s); return true; }
  function treeReady(s, k) { const t = s.trees[k]; return !!(t && t.formed && s.day - t.last >= TREE_DAYS); }
  function trogneReward(s) { s.mats.paillage += TREE_MULCH; s.boostUntil = Math.min(s.day + 60, Math.max(s.boostUntil, s.day) + 20); log(s, 'good', 'Trogne coupée : +' + TREE_MULCH + ' paillage, les plantes poussent plus vite pendant ' + Math.min(60, s.boostUntil - s.day) + ' jours.'); }
  function formTrogne(s, k) { const t = s.trees[k]; if (!t || t.formed || !(s.mats.trogne > 0)) return false; s.mats.trogne--; t.formed = true; t.last = s.day; trogneReward(s); bump(s); return true; }
  function cutTrogne(s, k) { if (!treeReady(s, k)) return false; s.trees[k].last = s.day; trogneReward(s); bump(s); return true; }
  function honeyReady(s, i) { const c = s.grid[i], m = dateOf(s.day).m; return !!(c && c.furn === 'ruche' && m >= 4 && m <= 8 && s.day - (c.honeyDay == null ? -999 : c.honeyDay) >= 45); }
  function honeyKg(s) { let nm = 0; s.grid.forEach(c => { if (c && !c.treille && P[c.pid].tags.includes('mellifere')) nm++; }); return r2(1 + Math.min(3, nm * .15)); }
  function harvestHoney(s, i) { if (!honeyReady(s, i)) return { ok: false }; const kg = honeyKg(s); s.grid[i].honeyDay = s.day; s.honey = r2((s.honey || 0) + kg); log(s, 'good', 'Miel récolté : ' + kg + ' kg.'); bump(s); return { ok: true, kg }; }
  function placeDuck(s, i) { const c = s.grid[i]; if (!c || c.furn !== 'mare' || c.ducks || !(s.mats.canard > 0)) return false; s.mats.canard--; c.ducks = true; log(s, 'good', 'Deux canards coureurs indiens s’installent à la mare.'); bump(s); return true; }
  function duckNear(s, i) { const r = (i / COLS) | 0, cc = i % COLS; return s.grid.some((c, j) => c && c.ducks && Math.max(Math.abs(((j / COLS) | 0) - r), Math.abs(j % COLS - cc)) <= 3); }
  function resistance(s, i) { const sy = synergy(s, i), links = new Set(sy.notes.filter(n => n.t === 'good').flatMap(n => n.froms).filter(j => j >= 0)).size; return { links, pct: Math.round(Math.min(.85, links * .1) * 100) }; }
  function heal(s, i) { const c = s.grid[i]; if (!c || c.treille || !c.sick) return false; c.sick = null; c.health = Math.min(100, c.health + 4); bump(s); return true; }
  function pests(s, w, m, ev) {
    const rn = mulberry(s.day * 977 + 13), kinds = [];
    const pS = w.rain >= 2 ? .22 : w.rain >= .5 ? .08 : .005, pF = (w.rain >= 1 && w.tmax >= 14 && w.tmax <= 28 && m >= 3 && m <= 10) ? .12 : .004;
    s.pestDay = s.pestDay || {};
    if (rn() < pS && w.tmin > 2 && s.day - (s.pestDay.limaces == null ? -99 : s.pestDay.limaces) >= 14) kinds.push('limaces'); if (rn() < pF && s.day - (s.pestDay.fongique == null ? -99 : s.pestDay.fongique) >= 21) kinds.push('fongique');
    kinds.forEach(k => { s.pestDay[k] = s.day; });
    const BS = { Herbacée: .5, Racine: .5, 'Couvre-sol': .4, Grimpante: .25, Arbuste: .1, Arbre: .03 }, BF = { Herbacée: .3, Racine: .2, 'Couvre-sol': .08, Grimpante: .4, Arbuste: .2, Arbre: .15 };
    for (const k of kinds) {
      let n = 0;
      for (let i = 0; i < NCELL; i++) { const c = s.grid[i]; if (!c || c.treille || c.sick) continue; const p = P[c.pid]; let b = (k === 'limaces' ? BS : BF)[p.strate] || .2; if (k === 'limaces' && duckNear(s, i)) b *= .08; if (c.supp === 'pergola' && k === 'fongique') b *= .8; const hit = b * (1 - resistance(s, i).pct / 100); if (rn() < hit) { c.sick = { k, day: s.day }; n++; } }
      if (n) ev.push({ t: 'warn', text: (k === 'limaces' ? 'Attaque de limaces : ' : 'Maladie fongique : ') + n + ' plante' + (n > 1 ? 's' : '') + ' touchée' + (n > 1 ? 's' : '') + '. Soigne-les vite.' });
    }
  }
  const WOODY = ['Arbre', 'Arbuste', 'Grimpante'];
  function pruneKey(s) { const d = dateOf(s.day); return d.m >= 9 ? d.y + 1 : d.y; }
  function needsPrune(s, c) { if (!c || c.treille || !WOODY.includes(P[c.pid].strate)) return false; const m = dateOf(s.day).m; if (!(m >= 10 || m <= 2)) return false; const st = phase(c).stage; if (st === 'graine' || st === 'pousse') return false; return c.pruned !== pruneKey(s); }
  function prune(s, i) { const c = s.grid[i]; if (!needsPrune(s, c)) return false; c.pruned = pruneKey(s); c.stress = Math.max(0, (c.stress || 0) - 2); bump(s); return true; }
  function mulch(s, i) { const c = s.grid[i]; if (!c || c.treille || c.mulch || !(s.mats.paillage > 0)) return false; s.mats.paillage--; c.mulch = true; s.soil = clamp(s.soil + .4, 0, 100); bump(s); return true; }
  function compost(s, i) { const c = s.grid[i]; if (!c || c.treille || !(s.mats.compost > 0)) return false; s.mats.compost--; c.compostUntil = s.day + 30; s.soil = clamp(s.soil + 1.5, 0, 100); bump(s); return true; }
  function remove(s, i) { const c = s.grid[i]; if (!c) return false; if (c.supp) { s.grid[i] = { treille: true, furn: c.supp }; return true; } if (c.ducks) s.mats.canard = (s.mats.canard || 0) + 1; if (c.treille) s.mats[c.furn || 'treille'] = (s.mats[c.furn || 'treille'] || 0) + 1; s.grid[i] = null; return true; }
  function waterCost(c) { return 4 * P[c.pid].eau; }
  function waterCells(s, list) {
    let n = 0, short = false;
    for (const i of list) {
      const c = s.grid[i]; if (!c || c.treille) continue;
      const cost = waterCost(c); if (s.tank < cost) { short = true; break; }
      s.tank -= cost; c.water = 95; n++;
    }
    if (n) bump(s); return { n, short };
  }
  function monthRange(arr) {
    if (!arr.length) return '—';
    const a = arr.slice().sort((x, y) => x - y), runs = []; let st = a[0], pr = a[0];
    for (let k = 1; k <= a.length; k++) { if (a[k] === pr + 1) { pr = a[k]; continue; } runs.push([st, pr]); st = a[k]; pr = a[k]; }
    if (runs.length > 1 && runs[0][0] === 1 && runs[runs.length - 1][1] === 12) { const l = runs.pop(); runs[0][0] = l[0]; }
    return runs.map(([x, y]) => x === y ? MONTHS[x - 1] : MONTHS[x - 1] + ' à ' + MONTHS[y - 1]).join(', ');
  }

  // ----- booster -----
  function pickPlant(s, rng, force) {
    const u = unlocked(s), m = dateOf(s.day).m, el = P.filter(p => u.has(p.strate) && (!force || (sowable(p, m) && p.rarete !== 'Rare')));
    if (!el.length) return P[0];
    const SW = { Arbre: 20, Arbuste: 22, Herbacée: 22, Racine: 12, 'Couvre-sol': 8, Grimpante: 8 };
    const sts = [...new Set(el.map(p => p.strate))]; let xs = rng() * sts.reduce((a, k) => a + SW[k], 0), st = sts[sts.length - 1];
    for (const k of sts) { xs -= SW[k]; if (xs <= 0) { st = k; break; } }
    const el2 = el.filter(p => p.strate === st);
    const roll = rng(), rar = roll < .72 ? 'Commune' : roll < .93 ? 'Peu commune' : 'Rare';
    let pool = el2.filter(p => p.rarete === rar); if (!pool.length) pool = el2;
    const w = pool.map(p => (sowable(p, m) ? 3 : 1) * (p.id < CORE ? 5 : 1) * ((st === 'Arbre' || st === 'Arbuste') && p.kg > 0 ? 2.5 : 1)), tot = w.reduce((a, b) => a + b, 0); let x = rng() * tot;
    for (let k = 0; k < pool.length; k++) { x -= w[k]; if (x <= 0) return pool[k]; }
    return pool[pool.length - 1];
  }
  function matPick(s, r) {
    const w = [['paillage', 30], ['compost', 24], ['chemin', 22]]; const mp = s.maxPlantings;
    for (const k of ['treille', 'pergola', 'serre', 'mare', 'ruche', 'trogne', 'canard']) if (mp >= FURN_UNLOCK[k]) w.push([k, k === 'treille' ? 8 : k === 'pergola' ? 7 : k === 'canard' ? 4 : 5]);
    const tot = w.reduce((a, b) => a + b[1], 0); let x = r * tot;
    for (const [k, v] of w) { x -= v; if (x <= 0) return k; }
    return 'paillage';
  }
  function openBooster(s) {
    if (s.boosterDay >= s.day) return null;
    const rng = mulberry(s.day * 131 + s.boosters * 17 + 7), cards = [], m = dateOf(s.day).m;
    if (s.boosters === 0) {
      const used = new Set(), want = ['Racine', 'Herbacée', 'Couvre-sol', 'Herbacée', 'Racine', 'Herbacée', 'Arbuste', 'Arbre'];
      for (const st of want) {
        let pool = P.filter(p => p.strate === st && sowable(p, m) && p.rarete !== 'Rare' && !used.has(p.id) && (st !== 'Arbre' && st !== 'Arbuste' || p.kg > 0)); const core = pool.filter(p => p.id < CORE); if (core.length && rng() < .8) pool = core;
        if (pool.length) { const p = pool[Math.floor(rng() * pool.length)]; used.add(p.id); cards.push({ t: 'plant', pid: p.id }); }
      }
      cards.push({ t: 'mat', k: 'paillage' }); cards.push({ t: 'mat', k: 'compost' });
    } else {
      const ug = unlocked(s).has('Grimpante');
      for (let k = 0; k < BOOSTER_SIZE; k++) {
        if (rng() < .22) cards.push({ t: 'mat', k: matPick(s, rng()) });
        else cards.push({ t: 'plant', pid: pickPlant(s, rng).id });
      }
    }
    for (const c of cards) { if (c.t === 'plant') s.cards[c.pid] = (s.cards[c.pid] || 0) + 1; else { c.q = MAT_QTY[c.k] || 1; s.mats[c.k] = (s.mats[c.k] || 0) + c.q; } }
    s.boosterDay = s.day; s.boosters++; bump(s);
    log(s, 'good', 'Booster du jour ouvert : ' + cards.length + ' cartes.');
    return cards;
  }

  // ----- cuisine -----
  function stockTotals(s) { const t = {}; for (const it of s.stock) t[it.pid] = (t[it.pid] || 0) + it.kg; return t; }
  function cook(s, pids) {
    if (!pids.length) return { ok: false, msg: 'Choisis au moins un ingrédient.' };
    const t = stockTotals(s); let kcal = 0, prot = 0, grams = 0; const used = [];
    for (const pid of pids) {
      if (pid === 'honey') { const g = Math.min(40 * ((s.family || []).length || 1), Math.round((s.honey || 0) * 1000)); if (g < 20) continue; s.honey = r2(s.honey - g / 1000); kcal += g * 3; prot += g * .003; grams += g; used.push({ name: 'miel', strate: 'Miel', kcal: 300 }); continue; }
      const have = t[pid] || 0, g = Math.min(180 * (s.family || []).length || 180, Math.round(have * 1000)); if (g < 30) continue;
      let need = g / 1000;
      for (const it of s.stock) { if (it.pid !== pid || need <= 0) continue; const take = Math.min(it.kg, need); it.kg = r2(it.kg - take); need -= take; }
      const p = P[pid]; kcal += g * p.kcal / 100; prot += g * p.prot / 100; grams += g; used.push(p);
    }
    s.stock = s.stock.filter(it => it.kg > 0.004);
    if (!used.length) return { ok: false, msg: 'Pas assez de récolte pour cuisiner.' };
    const strata = new Set(used.filter(p => p.strate !== 'Miel').map(p => p.strate)).size, kinds = used.length;
    const balance = clamp((strata - 1) * 34 + (prot > 8 ? 30 : prot > 4 ? 15 : 0) + (kinds >= 3 ? 12 : 0), 0, 100);
    s.eaten.push({ day: s.day, kcal: Math.round(kcal), prot: r1(prot) }); s.cookedDay = s.day; s.meals++;
    const fam = s.family || [], tn = famNeed(s), shares = [];
    for (const f of fam) { const sh = kcal * f.need / tn; f.hist.push({ day: s.day, kcal: Math.round(sh), bal: Math.round(balance) }); f.hist = f.hist.filter(x => s.day - x.day <= 6); shares.push({ n: f.n, ratio: Math.min(1.5, sh / f.need) }); f.joy = clamp(f.joy + Math.min(14, sh / f.need * 22) * (.6 + balance / 250), 0, 100); }
    bump(s);
    const name = mealName(used);
    log(s, 'good', 'Repas : ' + name + ' (' + Math.round(kcal) + ' kcal).');
    return { ok: true, name, kcal: Math.round(kcal), prot: r1(prot), grams, balance, shares, need: tn };
  }
  function mealName(used) {
    const n = used.map(p => p.name.toLowerCase());
    const has = st => used.some(p => p.strate === st);
    const list = n.length === 1 ? n[0] : n.slice(0, -1).join(', ') + ' et ' + n[n.length - 1];
    if (used.some(p => p.kcal > 300)) return 'Assiette de ' + list;
    if (has('Racine') && n.length >= 2) return 'Soupe de ' + list;
    if (has('Arbre') || has('Arbuste')) return 'Assiette fraîche de ' + list;
    return 'Salade de ' + list;
  }

  // ----- savoir du jour -----
  function tips(p) {
    const t = [];
    if (p.tags.includes('azote')) t.push('Ses racines abritent des bactéries qui captent l’azote de l’air : les voisines gourmandes en profitent.');
    if (p.tags.includes('repulsif')) t.push('Son parfum brouille l’odorat de certains ravageurs : un bon voisin pour les cultures sensibles.');
    if (p.tags.includes('mellifere')) t.push('Ses fleurs nourrissent abeilles et syrphes : plus de pollinisateurs, plus de fruits alentour.');
    if (p.tags.includes('mulch')) t.push('Faucher ses feuilles et les laisser au pied des voisines fabrique du paillage gratuit.');
    if (p.strate === 'Couvre-sol') t.push('Un sol couvert perd moins d’eau et reste vivant : moins d’arrosage, moins d’herbes indésirables.');
    if (p.strate === 'Arbre') t.push('Un arbre met des années à fructifier mais structure toute la guilde : ombre, abri, feuilles pour le sol.');
    if (p.strate === 'Grimpante') t.push('Une grimpante gagne de la place en hauteur : elle a besoin d’un support (treille, arbuste ou arbre).');
    return t;
  }
  function learn(s) {
    const alive = s.grid.filter(c => c && !c.treille).map(c => c.pid);
    const seen = new Set(s.knowledge);
    let pool = [...new Set(alive)].filter(id => !seen.has(id));
    if (!pool.length) pool = Object.keys(s.cards).map(Number).filter(id => !seen.has(id));
    if (!pool.length) pool = P.filter(p => !seen.has(p.id)).map(p => p.id);
    if (!pool.length) pool = P.map(p => p.id);
    const pid = pool[Math.floor(mulberry(s.day * 53 + s.knowledge.length)() * pool.length)], p = P[pid];
    if (!seen.has(pid)) s.knowledge.push(pid);
    s.learnedDay = s.day; bump(s);
    return { pid, tips: tips(p) };
  }

  // ----- tâches du jour -----
  function listCells(s, f) { const o = []; s.grid.forEach((c, i) => { if (c && !c.treille && f(c, i)) o.push(i); }); return o; }
  function buildTasks(s) {
    const T = [], m = dateOf(s.day).m, free = s.grid.some((c, i) => !c && isActive(s, i));
    if (s.boosterDay < s.day) T.push({ id: 'booster', prio: 1, icon: 'pack', label: 'Ouvrir le booster du jour', sub: 'Dix cartes : graines, plants et matériel', act: { type: 'booster' } });
    const urgent = listCells(s, c => c.water < 25);
    const soon = listCells(s, c => c.water >= 25 && c.water < 45 && s.w.rain < 3);
    if (urgent.length) T.push({ id: 'water-u', prio: 0, icon: 'drop', label: 'Arroser ' + urgent.length + (urgent.length > 1 ? ' plantes assoiffées' : ' plante assoiffée'), sub: 'Réserve d’eau : ' + Math.round(s.tank) + ' L', act: { type: 'water', cells: urgent } });
    if (soon.length) T.push({ id: 'water-s', prio: 1, icon: 'drop', label: 'Arroser ' + soon.length + (soon.length > 1 ? ' plantes' : ' plante'), sub: 'Le sol sèche', act: { type: 'water', cells: soon } });
    const rd = listCells(s, (c, i) => ready(s, c)), groups = {};
    rd.forEach(i => { const n = P[s.grid[i].pid].name; (groups[n] = groups[n] || []).push(i); });
    const gk = Object.keys(groups);
    if (gk.length > 3) T.push({ id: 'harv-all', prio: 1, icon: 'basket', label: 'Récolter ' + rd.length + ' cultures', sub: gk.slice(0, 4).join(', ') + '…', act: { type: 'harvest', cells: rd } });
    else gk.forEach(n => T.push({ id: 'harv-' + n, prio: 1, icon: 'basket', label: 'Récolter ' + n.toLowerCase() + (groups[n].length > 1 ? ' ×' + groups[n].length : ''), sub: 'Prêt maintenant', act: { type: 'harvest', cells: groups[n] } }));
    const stockKg = s.stock.reduce((a, b) => a + b.kg, 0);
    if (stockKg >= .25 && s.cookedDay < s.day) T.push({ id: 'cook', prio: 1, icon: 'pot', label: 'Cuisiner un repas du jardin', sub: stockKg.toFixed(1).replace('.', ',') + ' kg en garde-manger', act: { type: 'cook' } });
    const sowCard = Object.keys(s.cards).map(Number).find(pid => sowable(P[pid], m) && unlocked(s).has(P[pid].strate));
    if (sowCard !== undefined && free) T.push({ id: 'sow', prio: 2, icon: 'seed', label: 'Semer : ' + P[sowCard].name.toLowerCase(), sub: 'De saison, une parcelle est libre', act: { type: 'sow', pid: sowCard } });
    if (s.mats.paillage > 0) {
      const nm = listCells(s, c => !c.mulch && phase(c).stage !== 'graine' && P[c.pid].eau >= 2 && P[c.pid].strate !== 'Couvre-sol').slice(0, s.mats.paillage);
      if (nm.length) T.push({ id: 'mulch', prio: 2, icon: 'leaf', label: 'Pailler ' + nm.length + (nm.length > 1 ? ' plantes' : ' plante'), sub: 'Garde l’eau, nourrit le sol', act: { type: 'mulch', cells: nm } });
    }
    const sk = listCells(s, c => c.sick);
    if (sk.length) T.push({ id: 'heal', prio: 0, icon: 'leaf', label: 'Soigner ' + sk.length + (sk.length > 1 ? ' plantes attaquées' : ' plante attaquée'), sub: 'Limaces ou maladie fongique', act: { type: 'heal', cells: sk } });
    const hn = []; s.grid.forEach((c, i) => { if (honeyReady(s, i)) hn.push(i); });
    if (hn.length) T.push({ id: 'honey', prio: 1, icon: 'basket', label: 'Récolter le miel de ' + (hn.length > 1 ? hn.length + ' ruches' : 'la ruche'), sub: '≈ ' + String(honeyKg(s)).replace('.', ',') + ' kg par ruche', act: { type: 'honey', cells: hn } });
    const lr = []; for (let k = 0; k < LAWN_N; k++) if (lawnReady(s, k)) lr.push(k);
    if (lr.length) T.push({ id: 'lawn', prio: 2, icon: 'leaf', label: 'Tondre ' + lr.length + (lr.length > 1 ? ' zones d’herbe' : ' zone d’herbe'), sub: '+' + lr.length * LAWN_MULCH + ' paillage', act: { type: 'lawn', cells: lr } });
    const tr = []; for (let k = 0; k < TREE_N; k++) if (treeReady(s, k)) tr.push(k);
    if (tr.length) T.push({ id: 'trogne', prio: 1, icon: 'leaf', label: 'Couper ' + tr.length + (tr.length > 1 ? ' trognes' : ' trogne'), sub: 'Paillage et croissance accélérée', act: { type: 'trogne', cells: tr } });
    const pr = listCells(s, c => needsPrune(s, c));
    if (pr.length) T.push({ id: 'prune', prio: 2, icon: 'leaf', label: 'Tailler ' + pr.length + (pr.length > 1 ? ' arbres et arbustes' : ' arbre ou arbuste'), sub: 'Hiver : +10 % de fruits à la saison', act: { type: 'prune', cells: pr } });
    const mw = listCells(s, (c, i) => mowReady(s, c));
    if (mw.length) T.push({ id: 'mow', prio: 2, icon: 'leaf', label: 'Faucher la consoude', sub: '+2 paillage par pied', act: { type: 'mow', cells: mw } });
    if (s.learnedDay < s.day) T.push({ id: 'learn', prio: 2, icon: 'book', label: 'Savoir du jour', sub: 'Une plante, une association', act: { type: 'learn' } });
    T.sort((a, b) => a.prio - b.prio);
    const hidden = Math.max(0, T.length - 12); T.length = Math.min(T.length, 12);
    return { tasks: T, hidden, caughtUp: !T.some(t => t.prio <= 1) };
  }
  function runTask(s, t) {
    const a = t.act;
    if (a.type === 'water') return { r: waterCells(s, a.cells) };
    if (a.type === 'harvest') { let kg = 0; a.cells.forEach(i => { const h = harvest(s, i); if (h.ok) kg += h.kg; }); return { r: { kg } }; }
    if (a.type === 'mulch') { let n = 0; a.cells.forEach(i => { if (mulch(s, i)) n++; }); return { r: { n } }; }
    if (a.type === 'heal') { let n = 0; a.cells.forEach(i => { if (heal(s, i)) n++; }); return { r: { n } }; }
    if (a.type === 'honey') { let kg = 0; a.cells.forEach(i => { const h = harvestHoney(s, i); if (h.ok) kg += h.kg; }); return { r: { kg: r2(kg) } }; }
    if (a.type === 'lawn') { let n = 0; a.cells.forEach(k => { if (mowLawn(s, k)) n++; }); return { r: { n } }; }
    if (a.type === 'trogne') { let n = 0; a.cells.forEach(k => { if (cutTrogne(s, k)) n++; }); return { r: { n } }; }
    if (a.type === 'prune') { let n = 0; a.cells.forEach(i => { if (prune(s, i)) n++; }); return { r: { n } }; }
    if (a.type === 'mow') { let n = 0; a.cells.forEach(i => { if (mow(s, i)) n++; }); return { r: { n } }; }
    return { r: null };
  }

  // ----- jour suivant -----
  function autoWater(s) { for (let i = 0; i < NCELL; i++) { const c = s.grid[i]; if (c && !c.treille && c.water < 30) { const cost = waterCost(c); if (s.tank >= cost) { s.tank -= cost; c.water = 90; } } } }
  function nextDay(s, assist) {
    const ev = [];
    if (assist) autoWater(s);
    s.day++; const w = weather(s.day), m = dateOf(s.day).m, tm = (w.tmin + w.tmax) / 2; s.w = w;
    s.tank = Math.min(s.tankMax, s.tank + w.rain * 10);
    if (w.tmin < 0) ev.push({ t: 'warn', text: 'Gelée cette nuit (' + String(w.tmin).replace('.', ',') + ' °C).' });
    for (let i = 0; i < NCELL; i++) {
      const c = s.grid[i]; if (!c || c.treille) continue;
      const p = P[c.pid], sy = synergy(s, i), wasStage = c.stage, wasReady = c.ready;
      c.water = clamp(c.water - EVAP[m] * NEEDF[p.eau] * (c.mulch ? .6 : 1) * sy.evap * (w.tmax > 25 ? 1.15 : 1) + w.rain * 5, 0, 100);
      if (c.water < 20) c.stress++; else c.stress = Math.max(0, c.stress - 2);
      if (c.stress > 7) { if (c.stress >= 44) c.health -= 3; else c.health = Math.max(1, c.health - 1.2); }
      else if (c.stress === 0) c.health = Math.min(100, c.health + 1.5);
      const ph0 = phase(c).stage;
      const gelEff = p.gel - (neigh(i).some(j => s.grid[j] && s.grid[j].furn === 'serre') ? 4 : 0);
      if (w.tmin < gelEff && ph0 !== 'graine') {
        if (p.gel >= -3 && p.kind !== 'vivace') c.health = 0; else c.health -= p.gel >= -3 ? 30 : 15;
      }
      if (c.sick) { c.health = Math.max(1, c.health - (c.sick.k === 'limaces' ? 2.2 : 1.6)); if (s.day - c.sick.day >= 8) { c.health = Math.max(1, c.health - 12); c.sick = null; ev.push({ t: 'warn', text: p.name + ' a beaucoup souffert faute de soin.' }); } }
      if (c.health <= 0) { ev.push({ t: 'bad', text: p.name + (w.tmin < gelEff ? ' n’a pas résisté au gel.' : ' est mort de soif.') }); s.grid[i] = c.supp ? { treille: true, furn: c.supp } : null; continue; }
      let f = 1;
      if (c.g < p.germ) f = (tm < 5 && p.gel >= -5) ? .3 : 1;
      else if (c.g < maturity(p)) { f = SEASONF[m]; f = f + (1 - f) * (1 - Math.min(1, p.croiss / 120)); if (tm < 8 && p.gel >= 0) f *= .3; }
      else f = 1;
      const sf = c.stress > 7 ? .3 : c.stress > 0 ? .5 : 1;
      c.g += f * clamp(1 + sy.growth, .3, 1.5) * (.7 + s.soil / 100 * .6) * sf * (s.day <= c.compostUntil ? 1.2 : 1) * (s.day <= s.boostUntil ? 1.6 : 1) * (c.sick ? .5 : 1);
      const st = phase(c).stage; c.stage = st; c.ready = ready(s, c);
      if (st === 'mature' && wasStage !== 'mature' && wasStage !== undefined) ev.push({ t: 'good', text: p.name + ' est arrivé à maturité.' });
      if (c.ready && !wasReady) ev.push({ t: 'good', text: p.name + ' est prêt à récolter.' });
    }
    s.stock = s.stock.filter(it => { const p = P[it.pid]; if (s.day - it.day > Math.max(1, p.cons)) { ev.push({ t: 'warn', text: it.kg.toFixed(2).replace('.', ',') + ' kg de ' + p.name.toLowerCase() + ' perdus (trop vieux).' }); return false; } return true; });
    pests(s, w, m, ev);
    for (const f of (s.family || [])) { const rec = f.hist.filter(x => s.day - x.day < 3).reduce((a, b) => a + b.kcal, 0) / 3, ratio = rec / f.need; const tgt = ratio <= 0 ? 12 : clamp(18 + ratio * 70, 12, 100); f.joy = clamp(f.joy + (tgt - f.joy) * .12 - (ratio < .25 ? 3 : 0), 0, 100); }
    { const hungry = (s.family || []).filter(f => f.joy < 25); if (hungry.length && s.day % 3 === 0) ev.push({ t: 'warn', text: hungry.map(f => f.n).join(', ') + (hungry.length > 1 ? ' ont faim' : ' a faim') + ' : cuisine avec ta récolte.' }); }
    const st = stats(s); s.soil += (st.soilTarget - s.soil) * .02;
    if (s.day % 30 === 0) s.eaten = s.eaten.filter(e => s.day - e.day <= 60);
    ev.forEach(e => log(s, e.t, e.text));
    return ev;
  }
  function skip(s, n) {
    const all = []; for (let k = 0; k < n; k++) all.push(...nextDay(s, true));
    return all;
  }

  // ----- indicateurs -----
  function stats(s) {
    const cs = s.grid.map((c, i) => ({ c, i })).filter(o => o.c && !o.c.treille);
    const sp = new Set(cs.map(o => o.c.pid)), strata = new Set(cs.map(o => P[o.c.pid].strate));
    let mell = 0, couvre = 0, azote = 0, mul = 0, pk = 0, pkc = 0, comp = 0;
    cs.forEach(({ c, i }) => {
      const p = P[c.pid];
      if (p.tags.includes('mellifere')) mell++;
      if (p.strate === 'Couvre-sol') couvre++;
      if (p.tags.includes('azote')) azote++;
      if (p.tags.includes('mulch')) comp++;
      if (c.mulch) mul++;
      if (p.kg > 0) { const k = p.kg * (1 + synergy(s, i).yield) * (p.kind === 'continue' ? (p.recolte.length / 12) * 2.2 : 1); pk += k; pkc += k * 10 * p.kcal; }
    });
    const mares = s.grid.filter(c => c && c.furn === 'mare').length;
    const ruches = s.grid.filter(c => c && c.furn === 'ruche').length + Math.min(2, s.grid.filter(c => c && c.ducks).length);
    const biodiv = cs.length ? Math.round(clamp(5 + sp.size * 1.4 + strata.size * 2 + Math.min(mell, 10) * 1.2 + Math.min(2, mares) * 5 + Math.min(2, ruches) * 3, 0, 100)) : 0;
    const eaten30 = s.eaten.filter(e => s.day - e.day < 30).reduce((a, b) => a + b.kcal, 0);
    const target = clamp(45 + Math.min(20, couvre * 3) + Math.min(10, azote * 2.5) + (cs.length ? mul / cs.length * 10 : 0) + comp * 1.5, 20, 95);
    return { autonomy: Math.round(clamp(eaten30 / (famNeed(s) * 30) * 100, 0, 100) * 10) / 10, biodiv, soil: Math.round(s.soil), soilTarget: target,
      species: sp.size, plants: cs.length, potKg: Math.round(pk * 10) / 10, potCover: Math.round(clamp(pkc / (famNeed(s) * 365) * 100, 0, 100)), eaten30: Math.round(eaten30) };
  }

  // ----- jardin mature (démo) -----
  function demo() {
    const s = blank(); s.demo = true; s.day = dayOfDate(2027, 6, 12); s.w = weather(s.day);
    const L = [
      [0,0,'Thym'],[1,0,'Cerisier'],[2,0,'Sauge'],[3,0,'Bourrache'],[4,0,'Pommier'],[5,0,'Ciboulette'],[6,0,'Souci'],[7,0,'Prunier'],
      [0,1,'Trèfle blanc'],[1,1,'Groseillier'],[2,1,'Trèfle blanc'],[3,1,'Persil'],[4,1,'Fraisier des bois'],[5,1,'Framboisier'],[6,1,'Trèfle blanc'],[7,1,'Mûrier noir'],
      [0,2,'Menthe'],[1,2,'Vigne'],[2,2,'Tomate'],[3,2,'Basilic'],[4,2,'Courge'],[5,2,'Poirée'],[6,2,'Haricot sec'],[7,2,'Carotte'],
      [0,3,'Ail'],[1,3,'Capucine'],[2,3,'Poirier'],[3,3,'Artichaut'],[4,3,'Chou kale'],[5,3,'Betterave'],[6,3,'Consoude'],[7,3,'Rhubarbe'],
      [0,4,'Figuier'],[1,4,'Romarin'],[2,4,'Topinambour'],[3,4,'Épinard'],[4,4,'Pêcher'],[5,4,'Thym'],[6,4,'Sureau noir'],[7,4,'Sauge'],
      [0,5,'Kiwi'],[1,5,'Souci'],[2,5,'Feijoa'],[3,5,'Poireau'],[4,5,'Trèfle blanc'],[5,5,'Arbousier'],[6,5,'Grenadier'],[7,5,'Amandier']];
    L.forEach(([c, r, n]) => { const p = byName[n], g = p.juv > 0 ? totalDays(p) + 420 : maturity(p) + 6; const k = cell(p.id, s.day - 400, g); k.water = 70; k.mulch = ['Pommier','Cerisier','Poirier','Pêcher'].includes(n); s.grid[r * COLS + c] = k; });
    s.grid[2 * COLS + 5].mulch = true;
    s.plantings = L.length; s.maxPlantings = 99;
    s.cards = {}; [['Poirée', 2], ['Carotte', 2], ['Chou kale', 1], ['Haricot sec', 1]].forEach(([n, q]) => s.cards[byName[n].id] = q);
    s.family.forEach((f, k) => { f.joy = [78, 70, 84, 66][k]; }); s.size = 1; s.rewarded = { 3: true, 5: true, 6: true, 8: true, 12: true };
    s.mats = { paillage: 5, compost: 2, treille: 1, chemin: 2, pergola: 1, serre: 1, mare: 1, ruche: 1, trogne: 1 }; s.mats.canard = 1; s.honey = 0.6; s.trees[1] = { formed: true, last: s.day - 100 }; s.trees[3] = { formed: true, last: s.day - 40 }; s.lawn = s.lawn.map((_, k) => k % 2 ? s.day - 3 : -99); s.tank = 420; s.soil = 68;
    [[3, 2, 'chemin'], [3, 3, 'chemin'], [3, 4, 'chemin'], [6, 1, 'mare'], [5, 4, 'serre'], [1, 3, 'pergola'], [8, 2, 'ruche']].forEach(([c, r, k]) => { s.grid[r * COLS + c] = { treille: true, furn: k }; if (k === 'ruche') s.grid[r * COLS + c].honeyDay = s.day - 60; });
    [['Fraisier des bois', .25], ['Carotte', .5], ['Poirée', .4], ['Cerisier', 1.2]].forEach(([n, kg]) => s.stock.push({ pid: byName[n].id, kg, day: s.day - 1 }));
    s.knowledge = []; log(s, 'good', 'Jardin mature de démonstration : trois ans de travail, un matin de juillet.');
    s.grid.forEach((c, i) => { if (c && !c.treille) { c.stage = phase(c).stage; c.ready = ready(s, c); } });
    return s;
  }

  return { P, byName, COLS, ROWS, NCELL, MONTHS, newGame, demo, nextDay, skip, plant, placeTreille, mulch, compost, remove, waterCells, harvest, mow, openBooster, cook, learn, tips,
    buildTasks, runTask, synergy, placeFurn, honeyReady, honeyKg, harvestHoney, placeDuck, duckNear, resistance, heal, fixSave, lawnReady, mowLawn, treeReady, formTrogne, cutTrogne, LAWN_N, TREE_N, LAWN_DAYS, TREE_DAYS, prune, needsPrune, defaultFamily, famNeed, FURN, FURN_UNLOCK, MAT_QTY, dims, isActive, canExpand, expand, SIZES, SIZE_REQ, MILESTONES, phase, ready, yieldKg, stats, stockTotals, unlocked, sowable, inWindow, monthRange, dateOf, weather, neigh, waterCost, mowReady, UNLOCK, NEED_KCAL, SAVE_VERSION };
}
const api = { make, MONTHS, COLS, ROWS };
if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Engine = api;
})(typeof window !== 'undefined' ? window : globalThis);

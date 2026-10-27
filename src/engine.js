// ===== MOTEUR : pur JavaScript, sans DOM =====
(function (root) {
'use strict';
const START = Date.UTC(2026, 9, 19), DAYMS = 86400000;
const MONTHS = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
const COLS = 12, ROWS = 10, NCELL = COLS * ROWS;
const SIZES = [[8, 6], [10, 8], [12, 10]];
const SIZE_REQ = [null, { plant: 10, species: 6 }, { plant: 25, species: 14 }];
const MILESTONES = [[4, { paillage: 4 }, '4 paillage pour tes premières trognes']];
const CLIM = [[1,9],[2,11],[4,14],[6,17],[10,21],[13,25],[15,28],[15,28],[12,24],[9,19],[5,13],[2,9]];
const RAINP = [.3,.27,.28,.32,.3,.24,.17,.2,.24,.3,.32,.32];
const EVAP = [2,2.5,4,6,8,11,14,13,9,6,3,2];
const SEASONF = [.15,.2,.5,.85,1,1,1,1,.9,.7,.35,.15];
const NEEDF = {1:.7, 2:1, 3:1.4};
const UNLOCK = {'Arbuste':2, 'Grimpante':4, 'Arbre':6};
const FURN = ['treille', 'pergola', 'serre', 'mare', 'ruche', 'grandeserre', 'hamac'];
const FURN_UNLOCK = { chemin: 0, treille: 3, pergola: 5, mare: 6, serre: 8, ruche: 12, trogne: 8, canard: 6, grandeserre: 20, hamac: 8 };
const SHOP = { paillage: 3, compost: 4, chemin: 5, ortie: 6, prele: 6, bocaux: 8, savoir: 8, plan: 10, nichoir: 10, oya: 15, cuve: 20, mycor: 25, treille: 15, hamac: 30, pergola: 40, serre: 40, canard: 30, sechoir: 35, mare: 50, ruche: 60, atelier: 60, poulailler: 50, voile: 6, grandeserre: 150 };
const SKILLS = {
  plantation: { n: 'Plantation', cat: 'culture', max: 5, req: 0, use: [10, 30, 60, 120], unit: 'plantes plantées', xpk: 5, d: ['Le jardinier plante une plante à la fois, environ 7 secondes (un peu plus pour un arbre).', 'Plantation plus rapide : 6 secondes par plante.', 'Il plante deux plantes à la fois, en 4,5 secondes.', 'Deux plantes à la fois, en 3 secondes.', 'Plantation experte : quatre plantes à la fois, en 2 secondes.'], how: 'Plante une carte.' },
  tonte: { n: 'Tonte', cat: 'entretien', max: 5, req: 0, use: [8, 25, 50, 90], unit: 'zones tondues', xpk: 8, d: ['Tondre l’herbe : +2 paillage par zone.', '+3 paillage par zone.', '+4 paillage par zone.', '+5 paillage par zone, et l’herbe repousse 3 jours plus vite.', '+6 paillage par zone.'], how: 'Tonds les zones d’herbe autour du jardin.' },
  trogne: { n: 'Trognes', cat: 'entretien', max: 3, req: 8, use: [4, 10], unit: 'trognes formées ou coupées', xpk: 6, d: ['Tailler un arbre en trogne : +4 paillage et croissance accélérée 20 jours.', '+6 paillage par coupe.', '+8 paillage par coupe, croissance accélérée 30 jours, et une coupe tous les 75 jours.'], how: 'Forme une trogne puis coupe-la.' },
  bouture: { n: 'Bouture', cat: 'culture', max: 3, req: 6, use: [3, 8], unit: 'boutures prélevées', xpk: 4, d: ['Prélever une bouture sur une plante vivace mature : une nouvelle carte de la même espèce (une par plante tous les 45 jours).', 'Une bouture par plante tous les 30 jours.', 'Tous les 20 jours, et 2 cartes par bouture.'], how: 'Prélève une bouture.' },
  greffe: { n: 'Greffe', cat: 'culture', max: 3, req: 14, use: [2, 6], unit: 'greffes réussies', xpk: 6, d: ['Greffer un arbre ou un arbuste fruitier (1 compost) : +10 % de récolte et croissance avancée de 15 %.', '+20 % de récolte, croissance avancée de 25 %.', '+30 % de récolte, croissance avancée de 35 %.'], how: 'Greffe un arbre ou un arbuste.' },
  fabrication: { n: 'Fabrication', cat: 'entretien', max: 3, req: 8, use: [3, 8], unit: 'fabrications', xpk: 5, d: ['Fabriquer soi-même du purin d’ortie et de la prêle avec du paillage et du compost.', 'Fabriquer aussi des nichoirs et des oyas.', 'Fabriquer aussi des cuves de récupération.'], how: 'Fabrique un soin ou un équipement.' },
  sechage: { n: 'Séchage', cat: 'expertise', max: 3, req: 10, use: [3, 8], unit: 'séchages', xpk: 5, d: ['Sécher herbes et fruits au séchoir : 3 kg par jour.', '5 kg par jour.', '8 kg par jour.'], how: 'Sèche une récolte au séchoir.' },
  transformation: { n: 'Transformation', cat: 'expertise', max: 3, req: 8, use: [3, 8], unit: 'mises en bocaux', xpk: 5, d: ['Mettre fruits et légumes en bocaux : 0,5 kg par bocal.', 'Confitures, compotes, jus : 0,7 kg par bocal.', 'Lacto-fermentation et conserves généreuses : 1 kg par bocal.'], how: 'Mets une récolte en bocaux.' },
  cuisine: { n: 'Cuisine', cat: 'expertise', max: 5, req: 0, use: [3, 8, 16, 30], unit: 'repas cuisinés', xpk: 7, d: ['Cuisiner les repas de la famille.', 'Les repas rendent la famille 5 % plus heureuse.', '10 % plus heureuse.', '15 % plus heureuse.', '20 % plus heureuse.'], how: 'Cuisine un repas.' }
};
const ADV = {
  botaniste: { n: 'Botaniste', cat: 'expertise', cost: 2, reqs: { plantation: 3, bouture: 2 }, prac: { k: 'species', n: 12, t: 'espèces différentes cultivées' }, d: 'Toutes tes plantes poussent 10 % plus vite.' },
  resilient: { n: 'Jardinier résilient', cat: 'expertise', cost: 2, reqs: { fabrication: 2, trogne: 2 }, prac: { k: 'soin', n: 6, t: 'soins apportés aux plantes' }, d: 'Tes plantes résistent mieux aux intempéries et aux maladies (+10 % de résistance).' },
  autonome: { n: 'Garde-manger autonome', cat: 'expertise', cost: 2, reqs: { transformation: 2, cuisine: 3 }, prac: { k: 'meals', n: 20, t: 'repas cuisinés' }, d: 'La récolte fraîche se garde 50 % plus longtemps.' }
};
const XPB = { harvest: 4, water: 2, mulch: 3, soin: 5, honey: 8, prune: 6, compost: 6 };
const xpNeed = L => 100 + 25 * (L * (L + 1) / 2 - 1);
function levelOf(xp) { let L = 1, r = xp || 0; while (r >= xpNeed(L)) { r -= xpNeed(L); L++; } return { lvl: L, into: r, need: xpNeed(L) }; }

const RECIPES = { ortie: { lvl: 1, paillage: 2, compost: 1 }, prele: { lvl: 1, paillage: 2, compost: 1 }, nichoir: { lvl: 2, paillage: 3 }, oya: { lvl: 2, paillage: 4, compost: 1 }, cuve: { lvl: 3, paillage: 6, compost: 3 } };
const RECYCLE = { 'Commune': 2, 'Peu commune': 3, 'Rare': 6 };
const MAT_UNLOCK = { savoir: 3, voile: 3, cuve: 4, plan: 5, ortie: 6, prele: 8, bocaux: 8, atelier: 10, poulailler: 12, nichoir: 10, oya: 10, sechoir: 12, mycor: 14 };
const EGG_CAP = 30, EGG_KCAL = 86, EGG_PROT = 7.5, EGG_G = 60;
const NEWMATS = Object.keys(MAT_UNLOCK).concat(['grandeserre', 'hamac']), JAR_KG = .5, DRY_CAP = 3;
const JARKG = [0, .5, .7, 1], DRYCAP = [0, 3, 5, 8];
const MAT_QTY = { voile: 2, chemin: 6, bocaux: 6, paillage: 5, compost: 3 };
const COMPOST_RATE = .6, COMPOST_KG = 2.5;
const NOT_EXO = new Set(['Maïs', 'Tournesol', 'Basilic vivace', 'Basilic']), EXO_EXTRA = new Set(['Curcuma', 'Poivre-cannelle', 'Thym antillais']);
const isExo = p => !NOT_EXO.has(p.name) && p.gel >= -1 && (p.strate === "Arbre" || p.strate === "Arbuste" || EXO_EXTRA.has(p.name) || /^Bananier/.test(p.name));
const gshare = s => Math.min(.25, .04 + .0002 * (s.day || 0)), BOOSTER_SIZE = 5, RCY_CAP = 12, KGM = { annuelle: 2.4, continue: 2, vivace: 1.4 }, NEED_KCAL = 2000, CORE = 51;
const SAVE_VERSION = 1;
const LAWN_N = 8, LAWN_DAYS = 14, TREE_N = 5, TREE_DAYS = 90, LAWN_MULCH = 2, TREE_MULCH = 4;
function defaultFamily() { return [{ n: 'Camille', role: 'Adulte', need: 2100, joy: 50, hist: [] }, { n: 'Julien', role: 'Adulte', need: 2400, joy: 50, hist: [] }, { n: 'Léa', role: '10 ans', need: 1900, joy: 50, hist: [] }, { n: 'Noé', role: '6 ans', need: 1500, joy: 50, hist: [] }]; }
const famNeed = s => (s.family || []).reduce((a, m) => a + m.need, 0) || NEED_KCAL;

function dateOf(day) { const d = new Date(START + day * DAYMS); return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate() }; }
function dayOfDate(y, m, d) { return Math.round((Date.UTC(y, m, d) - START) / DAYMS); }
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const r1 = v => Math.round(v * 10) / 10, r2 = v => Math.round(v * 100) / 100;
const xr = (day, salt) => mulberry(day * 104729 + salt * 7717 + 13)();
function extremeOf(day, m, tmin, tmax, rain) {
  let ev = null, hail = false;
  if (day >= 14) {
    const blk = Math.floor(day / 21), bm = dateOf(blk * 21).m, dry = bm >= 5 && bm <= 8 && xr(blk, 1) < .3 && day - blk * 21 < 12;
    let heat = false; for (let k = 0; k < 5; k++) { const d0 = day - k, m0 = dateOf(d0).m; if (d0 >= 14 && m0 >= 5 && m0 <= 7 && xr(d0, 2) < .03 && k < 3 + Math.floor(xr(d0, 3) * 3)) { heat = true; break; } }
    if (heat) { ev = 'canicule'; tmax = r1(Math.max(tmax, 33) + 3 + xr(day, 4) * 4); tmin = r1(Math.max(tmin, 17) + 2); rain = 0; }
    else if (dry) { ev = 'secheresse'; rain = 0; tmax = r1(tmax + 2); }
    if (!ev) {
      if ((m === 3 || m === 4) && xr(day, 5) < .025) { ev = 'gel'; tmin = r1(Math.min(tmin, -2 - xr(day, 6) * 3)); }
      else if ((m === 11 || m === 0 || m === 1) && xr(day, 5) < .03) { ev = 'gel'; tmin = r1(Math.min(tmin, -7 - xr(day, 6) * 5)); }
    }
    if (!ev && (m >= 9 || m <= 2) && xr(day, 7) < .02) { ev = 'tempete'; rain = r1(rain + 6 + xr(day, 8) * 10); }
    if (!ev && m >= 5 && m <= 8 && xr(day, 9) < .035) { ev = 'orage'; rain = r1(rain + 10 + xr(day, 10) * 14); hail = xr(day, 11) < .4; }
  }
  return { tmin, tmax, rain, ev, hail };
}
function weather(day) {
  const m = dateOf(day).m, r = mulberry(day * 7919 + 101), b = CLIM[m], sw = (r() - .5) * 7;
  const tmin = r1(b[0] + sw), tmax = r1(b[1] + sw + (r() - .5) * 2);
  const rain = r() < RAINP[m] ? r1(1 + r() * r() * 18) : 0;
  return extremeOf(day, m, tmin, tmax, rain);
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
    return { v: SAVE_VERSION, day: 0, grid: Array(NCELL).fill(null), paths: [], cards: {}, mats: { voile: 0, paillage: 2, compost: 1, treille: 0, chemin: 0, pergola: 0, serre: 0, mare: 0, ruche: 0, trogne: 0, canard: 0 }, honey: 0, lawn: Array(LAWN_N).fill(-99), trees: Array.from({ length: TREE_N }, () => ({ formed: false, last: -999 })), boostUntil: -1, size: 0, rewarded: { 3: true }, family: defaultFamily(), gq: { claimed: {}, cnt: {}, dc: { day: -1 } },
      tank: 300, tankMax: 500, stock: [], eaten: [], boosterDay: -1, boosters: 0, plantings: 0, maxPlantings: 0,
      cookedDay: -1, learnedDay: -1, knowledge: [], log: [], doneToday: { day: -1, n: 0 }, demo: false, w: weather(0), soil: 45, meals: 0 };
  }
  function cell(pid, day, g) { return { pid, g: g || 0, water: 85, health: 100, stress: 0, mulch: false, compostUntil: -1, lastPick: -9999, born: day, ready: false, stage: 'graine' }; }
  function dims(s) { return SIZES[s.size || 0]; }
  function isActive(s, i) { const d = dims(s); return (i % COLS) < d[0] && ((i / COLS) | 0) < d[1]; }
  function newGame() {
    const s = fixSave(blank());
    s.plantings = 0; s.maxPlantings = 0; s.mats.paillage = 8; s.mats.compost = 3;
    checkSkills(s, true);
    log(s, 'good', 'Bienvenue. Ton jardin est vide : tout reste à planter. Le garde-manger est vide : il se remplira avec ta première récolte. Ouvre ton premier booster.');
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
  const isWoody = p => !!p && (p.strate === 'Arbre' || p.strate === 'Arbuste') && p.kind !== 'annuelle';
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
        if (f === 'grandeserre') add('good', 'La grande serre voisine garde la chaleur : les plantes frileuses y prospèrent, même en hiver.', j, (m >= 10 || m <= 3) ? .22 : .06, isExo(p) ? .12 : 0);
        if (f === 'serre') add('good', 'La serre voisine abrite du gel et réchauffe le sol en hiver.', j, (m >= 10 || m <= 2) ? .12 : 0, 0);
                if (f === 'ruche' && (p.kind === 'vivace' || p.tags.includes('gourmand'))) add('good', 'La ruche voisine : les abeilles pollinisent, plus de fruits pour ' + p.name + '.', j, 0, .1);
        if (n.treille) continue;
      }
      const q = P[n.pid], st = phase(n).stage;
      if (n.nichoir) add('good', 'Un nichoir à mésanges voisin : les mésanges mangent chenilles et pucerons.', j, 0, .04);
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
      if (pathAccess(s, i)) add('good', 'Un sentier longe la parcelle : tu soignes ' + p.name.toLowerCase() + ' sans piétiner le sol.', -1, .03, .02);
      else if (edge >= 2) add('bad', 'Parcelle enclavée : tu piétines le sol pour atteindre ' + p.name.toLowerCase() + '. Trace un sentier depuis le bord du jardin.', -1, -.06, -.08); }
    if (tree) {
      if (p.soleil >= 6) add('bad', tree.q.name + ' fait de l’ombre : ' + p.name + ' manque de soleil (besoin : ' + p.soleil + ' h).', tree.j, -.25, -.25);
      else if (p.soleil <= 4 && m >= 4 && m <= 7) add('good', tree.q.name + ' donne une ombre d’été que ' + p.name + ' apprécie.', tree.j, .08, 0);
    }
    { const gd = guildOf(s, i);
      if (gd) { if (gd.auto) add('good', 'Guilde autonome : l’arbre, un fixateur d’azote et un attracteur de pollinisateurs ou répulsif travaillent ensemble. ' + p.name + ' pousse mieux et donne plus.', gd.c, .12, .15);
        else add('good', 'Guilde : un arbre entouré d’au moins 4 strates et 5 espèces différentes. ' + p.name + ' pousse un peu mieux et donne plus.', gd.c, .06, .08); } }
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
    let kg = (p.kind === 'continue' ? p.kg * .3 : p.kg) * (KGM[p.kind] || 1);
    if (p.kind === 'vivace' && p.juv > 0) { const yrs = (c.g - totalDays(p)) / 365; kg *= Math.min(1, .35 + .65 * Math.max(0, yrs) / 4); }
    const late = c.ready && c.readyDay != null ? s.day - c.readyDay : 0, fresh = late <= 3 ? 1 : Math.max(.5, 1 - (late - 3) * .04), cared = s.day - (c.care == null ? -99 : c.care) <= 3 ? 1.2 : 1;
    return Math.max(0, r2(kg * fresh * cared * (c.health / 100) * (1 + sy.yield) * (c.pruned === pruneKey(s) ? 1.1 : 1) * (c.sick ? .7 : 1) * (c.grafted ? 1 + .1 * c.grafted : 1)));
  }
  function harvest(s, i) {
    const c = s.grid[i]; if (!ready(s, c)) return { ok: false };
    const p = P[c.pid], kg = yieldKg(s, i);
    s.waste = r2((s.waste || 0) + kg * .6); s.stock.push({ pid: p.id, kg, day: s.day }); (s.prod = s.prod || []).push({ day: s.day, kcal: Math.round(kg * 10 * p.kcal) });
    if (p.kind === 'annuelle') { s.grid[i] = null; s.soil = clamp(s.soil + .3, 0, 100); }
    else c.lastPick = s.day;
    const lateD = c.readyDay != null ? s.day - c.readyDay : 0; c.readyDay = null;
    log(s, 'good', 'Récolte : ' + kg.toFixed(2).replace('.', ',') + ' kg de ' + p.name.toLowerCase() + (lateD > 3 ? ' (un peu passé : récolte plus vite la prochaine fois).' : '.'));
    discover(s, 'harvest', p.id, 60);
    let seed = false; if (p.kind !== 'vivace' && s.seedDay !== s.day && mulberry(s.day * 31 + i * 7 + s.plantings)() < .22) { s.seedDay = s.day; s.cards[p.id] = (s.cards[p.id] || 0) + 1; seed = true; log(s, 'good', 'Tu as gardé des graines de ' + p.name.toLowerCase() + ' : une carte en plus.'); }
    bump(s, 'harvest'); return { ok: true, kg, name: p.name, seed };
  }
  function mowReady(s, c) { return c && !c.treille && P[c.pid].tags.includes('mulch') && phase(c).stage !== 'graine' && phase(c).stage !== 'pousse' && s.day - c.lastPick >= 21; }
  function mow(s, i) { const c = s.grid[i]; if (!mowReady(s, c)) return false; c.lastPick = s.day; s.mats.paillage += 2; log(s, 'good', 'Consoude fauchée : +2 paillage.'); bump(s); return true; }
  function gqInit(s) { if (!s.gq) s.gq = { claimed: {}, cnt: {}, dc: { day: -1 } }; if (!s.gq.claimed) s.gq.claimed = {}; if (!s.gq.cnt) s.gq.cnt = {}; if (!s.gq.dc) s.gq.dc = { day: -1 }; return s.gq; }
  function bump(s, k, n) { if (s.doneToday.day !== s.day) { s.doneToday = { day: s.day, n: 0 }; s.streak = s.lastActive === s.day - 1 ? (s.streak || 0) + 1 : 1; s.lastActive = s.day; if (s.streak % 7 === 0) { s.feves = (s.feves || 0) + 3; log(s, 'good', 'Série de ' + s.streak + ' jours au jardin : 3 ginkgos offerts.'); } } s.doneToday.n++; if (k) { const g = gqInit(s), a = n == null ? 1 : n; g.cnt[k] = (g.cnt[k] || 0) + a; if (g.dc.day !== s.day) g.dc = { day: s.day }; g.dc[k] = (g.dc[k] || 0) + a; }  if (k && XPB[k]) gainXp(s, XPB[k] * (n == null ? 1 : n)); }

  // ----- actions -----
  function plantCheck(s, i, pid) {
    const p = P[pid];
    if (!p) return { ok: false, msg: 'Carte inconnue.' };
    if (!(s.cards[pid] > 0)) return { ok: false, msg: 'Tu n’as plus cette carte.' };
    if (!isActive(s, i)) return { ok: false, msg: 'Cette parcelle n’est pas encore à toi : agrandis le terrain.' };
    if ((s.pq || []).some(q => q.i === i)) return { ok: false, msg: 'Une plantation est déjà prévue ici.' };
    const occ = s.grid[i];
    if (occ && !(occ.treille && (occ.furn === 'treille' || occ.furn === 'pergola') && p.strate === 'Grimpante')) return { ok: false, msg: 'Cette parcelle est occupée.' };
    if (!unlocked(s).has(p.strate)) return { ok: false, msg: 'Strate pas encore débloquée.' };
    const m = dateOf(s.day).m;
    if (!sowable(p, m)) return { ok: false, msg: 'Pas la bonne saison pour ' + p.name.toLowerCase() + ' (' + (['Arbre', 'Arbuste', 'Grimpante'].includes(p.strate) ? 'plantation' : 'semis') + ' : ' + monthRange(p.semis) + '). Garde la carte.' };
    return { ok: true };
  }
  function queuePlant(s, i, pid, opt) { const c = plantCheck(s, i, pid); if (!c.ok) return c; s.cards[pid]--; if (!s.cards[pid]) delete s.cards[pid]; (s.pq = s.pq || []).push({ i, pid, noyau: !!(opt && opt.noyau && isWoody(P[pid])) }); return { ok: true }; }
  function cancelPlant(s, i) { const k = (s.pq || []).findIndex(q => q.i === i); if (k < 0) return { ok: false }; const q = s.pq.splice(k, 1)[0]; s.cards[q.pid] = (s.cards[q.pid] || 0) + 1; return { ok: true, name: P[q.pid].name }; }
  function finishPlant(s, i) { const k = (s.pq || []).findIndex(q => q.i === i); if (k < 0) return { ok: false, none: true }; const q = s.pq.splice(k, 1)[0]; s.cards[q.pid] = (s.cards[q.pid] || 0) + 1; const r = plant(s, i, q.pid, { noyau: q.noyau }); return r; }
  function flushPlantQueue(s) { (s.pq || []).slice().forEach(q => finishPlant(s, q.i)); s.pq = []; }
  function plantSpeed(s, pid) { const lv = Math.max(1, skillLevel(s, 'plantation')); const woody = ['Arbre', 'Arbuste'].includes((P[pid] || {}).strate); return { sec: [7, 6, 4.5, 3, 2][lv - 1] * (woody ? 1.5 : 1), batch: [1, 1, 2, 2, 4][lv - 1], lv }; }
  function plant(s, i, pid, opt) {
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
    s.grid[i] = cell(pid, s.day); { const wd = isWoody(p), ny = wd && !!(opt && opt.noyau); if (ny) s.grid[i].noyau = true; else if (wd) { s.grid[i].g = maturity(p) + Math.round(.5 * p.juv * 365); s.grid[i].young = true; } } if (occ && occ.treille) s.grid[i].supp = occ.furn; s.plantings++; s.maxPlantings = Math.max(s.maxPlantings, s.plantings); discover(s, 'plant', pid, 30);
    log(s, 'good', s.grid[i].noyau ? p.name + ' : semis en pleine terre. Il sera long, mais il se débrouillera tout seul.' : p.name + ' planté' + (s.grid[i].young ? ' (jeune plant)' : p.propagation === 'Plant' ? '' : ' (' + p.propagation.toLowerCase() + ')') + '.');
    let reward = null; const gl = []; s.rewarded = s.rewarded || {};
    for (const [n, gift, label] of MILESTONES) if (s.maxPlantings >= n && !s.rewarded[n]) { s.rewarded[n] = true; for (const k in gift) s.mats[k] = (s.mats[k] || 0) + gift[k]; gl.push(label); }
    if (gl.length) { reward = 'Palier de plantations : tu reçois ' + gl.join(', ') + '.'; log(s, 'good', reward); }
    s.skills.species[pid] = 1; gainSkill(s, 'plantation', 1); gainXp(s, p.strate === 'Arbre' ? 35 : p.strate === 'Arbuste' || p.strate === 'Grimpante' ? 10 : 0); checkSkills(s); bump(s); return { ok: true, reward };
  }
  function canExpand(s) {
    const n = (s.size || 0) + 1; if (n >= SIZES.length) return { ok: false, done: true };
    const rq = SIZE_REQ[n], sp = stats(s).species; const pl = s.maxPlantings;
    return { ok: pl >= rq.plant && sp >= rq.species, plant: [Math.min(pl, rq.plant), rq.plant], species: [Math.min(sp, rq.species), rq.species], to: SIZES[n] };
  }
  function expand(s) { const c = canExpand(s); if (!c.ok) return false; s.size = (s.size || 0) + 1; log(s, 'good', 'Terrain agrandi : ' + SIZES[s.size][0] + ' × ' + SIZES[s.size][1] + ' parcelles.'); bump(s); return true; }
  function placeFurn(s, i, k) { if (!FURN.includes(k) || !isActive(s, i) || s.grid[i] || !(s.mats[k] > 0)) return false; s.mats[k]--; s.grid[i] = { treille: true, furn: k }; if (k === 'ruche') s.grid[i].honeyDay = s.day; bump(s); return true; }
  function placeTreille(s, i) { return placeFurn(s, i, 'treille'); }
  function fixSave(s) { gqInit(s); if (!s.skillNotes) s.skillNotes = []; if (!Array.isArray(s.paths)) s.paths = []; if (!s.disc) s.disc = { plant: {}, harvest: {} };
    s.grid.forEach((c, i) => { if (c && c.treille && c.furn === 'chemin') { s.grid[i] = null; s.mats.chemin = (s.mats.chemin || 0) + 2; s.pathMigrated = (s.pathMigrated || 0) + 1; } });
    if (!s.skills || !s.skills.lv) { const o = s.skills || { pts: {}, seen: {} }, op = o.pts || {}, lv = {}, use = {}; let tot = 0;
      const OLD = { tonte: [0, 15, 45], trogne: [4, 12, 30], bouture: [6, 12, 36], fabrication: [8, 14, 40], sechage: [10, 10, 30], transformation: [8, 10, 30], cuisine: [0, 12, 36], greffe: [14, 12, 32] };
      Object.keys(OLD).forEach(k => { const [rq, t1, t2] = OLD[k], p = op[k] || 0; tot += p; use[k] = Math.min(p, 40); if ((s.maxPlantings || 0) >= rq) lv[k] = 1 + (p >= t1 ? 1 : 0) + (p >= t2 ? 1 : 0); });
      lv.plantation = Math.max(1, lv.plantation || 0); lv.tonte = Math.max(1, lv.tonte || 0); lv.cuisine = Math.max(1, lv.cuisine || 0);
      const sp = {}; (s.grid || []).forEach(c => { if (c && !c.treille) sp[c.pid] = 1; });
      s.skills = { lv, use, adv: {}, species: sp, seen: o.seen || {} }; s.xp = s.xp || tot * 6; s.ptsSpent = s.ptsSpent || 0; s.pts = s.pts != null ? s.pts : levelOf(s.xp).lvl - 1 + 1; }
    if (!s.skills.adv) s.skills.adv = {}; if (!s.skills.use) s.skills.use = {}; if (!s.skills.species) s.skills.species = {}; if (s.xp == null) s.xp = 0; if (s.pts == null) s.pts = 0; if (!s.pq) s.pq = []; if (!s.tuto) s.tuto = (s.day > 1 || (s.boosters || 0) > 1 || s.maxPlantings > 6) ? { done: true } : { step: 0 }; if (s.waste == null) { s.waste = 0; s.compostPts = 0; s.compostMade = 0; } Object.keys(SKILLS).forEach(k => { if (skillLevel(s, k) > 0) s.skills.seen[k] = 1; }); if (s.feves == null) s.feves = 15; NEWMATS.forEach(k => { s.mats[k] = s.mats[k] || 0; }); s.cuves = s.cuves || 0; if (s.atelier == null) s.atelier = false; if (s.poulailler == null) { s.poulailler = false; s.poules = 0; s.eggs = 0; s.eggsMade = 0; } if (s.sechoir == null) s.sechoir = false; if (!s.prod) s.prod = []; s.lawn = s.lawn && s.lawn.length === LAWN_N ? s.lawn : Array(LAWN_N).fill(-99); s.trees = s.trees && s.trees.length === TREE_N ? s.trees : Array.from({ length: TREE_N }, () => ({ formed: false, last: -999 })); if (s.boostUntil == null) s.boostUntil = -1; s.mats.trogne = s.mats.trogne || 0; s.mats.canard = s.mats.canard || 0; s.honey = s.honey || 0; return s; }
  function lawnReady(s, k) { return s.day - s.lawn[k] >= LAWN_DAYS - (skillLevel(s, 'tonte') >= 4 ? 3 : 0); }
  function mowLawn(s, k) { if (!lawnReady(s, k)) return false; s.lawn[k] = s.day; s.mats.paillage += LAWN_MULCH + Math.max(0, skillLevel(s, 'tonte') - 1); gainSkill(s, 'tonte', 1); bump(s, 'mow'); return true; }
  function treeReady(s, k) { const t = s.trees[k]; return !!(t && t.formed && s.day - t.last >= TREE_DAYS - (skillLevel(s, 'trogne') >= 3 ? 15 : 0)); }
  function trogneReward(s) { const lv = skillLevel(s, 'trogne'), mu = TREE_MULCH + 2 * Math.max(0, lv - 1); s.mats.paillage += mu; s.boostUntil = Math.min(s.day + 60, Math.max(s.boostUntil, s.day) + (lv >= 3 ? 30 : 20)); log(s, 'good', 'Trogne coupée : +' + mu + ' paillage, les plantes poussent plus vite pendant ' + Math.min(60, s.boostUntil - s.day) + ' jours.'); }
  function formTrogne(s, k) { const t = s.trees[k]; if (!t || t.formed || !(s.mats.trogne > 0 || skillLevel(s, 'trogne') >= 1)) return false; if (s.mats.trogne > 0) s.mats.trogne--; t.formed = true; t.last = s.day; trogneReward(s); gainSkill(s, 'trogne', 2); bump(s, 'trogne'); return true; }
  function cutTrogne(s, k) { if (!treeReady(s, k)) return false; s.trees[k].last = s.day; trogneReward(s); gainSkill(s, 'trogne', 3); bump(s, 'trogne'); return true; }
  function honeyReady(s, i) { const c = s.grid[i], m = dateOf(s.day).m; return !!(c && c.furn === 'ruche' && m >= 4 && m <= 8 && s.day - (c.honeyDay == null ? -999 : c.honeyDay) >= 45); }
  function honeyKg(s) { let nm = 0; s.grid.forEach(c => { if (c && !c.treille && P[c.pid].tags.includes('mellifere')) nm++; }); return r2(1 + Math.min(3, nm * .15)); }
  function harvestHoney(s, i) { if (!honeyReady(s, i)) return { ok: false }; const kg = honeyKg(s); s.grid[i].honeyDay = s.day; s.honey = r2((s.honey || 0) + kg); (s.prod = s.prod || []).push({ day: s.day, kcal: Math.round(kg * 3000) }); log(s, 'good', 'Miel récolté : ' + kg + ' kg.'); bump(s, 'honey'); return { ok: true, kg }; }
  function placeDuck(s, i) { const c = s.grid[i]; if (!c || c.furn !== 'mare' || c.ducks || !(s.mats.canard > 0)) return false; s.mats.canard--; c.ducks = true; log(s, 'good', 'Deux canards coureurs indiens s’installent à la mare.'); bump(s); return true; }
  function duckNear(s, i) { const r = (i / COLS) | 0, cc = i % COLS; return s.grid.some((c, j) => c && c.ducks && Math.max(Math.abs(((j / COLS) | 0) - r), Math.abs(j % COLS - cc)) <= 3); }
  function resistance(s, i) { const sy = synergy(s, i), links = new Set(sy.notes.filter(n => n.t === 'good').flatMap(n => n.froms).filter(j => j >= 0)).size; return { links, pct: Math.round(Math.min(.85, links * .1 + (hasAdv(s, 'resilient') ? .1 : 0)) * 100) }; }
  function heal(s, i) { const c = s.grid[i]; if (!c || c.treille || !c.sick) return false; c.sick = null; c.health = Math.min(100, c.health + 4); bump(s); return true; }
  function pests(s, w, m, ev) {
    const rn = mulberry(s.day * 977 + 13), kinds = [];
    const pS = (w.rain >= 2 ? .22 : w.rain >= .5 ? .08 : .005) * (s.poulailler ? .85 : 1), pF = (w.rain >= 1 && w.tmax >= 14 && w.tmax <= 28 && m >= 3 && m <= 10) ? .12 : .004;
    s.pestDay = s.pestDay || {};
    if (rn() < pS && w.tmin > 2 && s.day - (s.pestDay.limaces == null ? -99 : s.pestDay.limaces) >= 14) kinds.push('limaces'); if (rn() < pF && s.day - (s.pestDay.fongique == null ? -99 : s.pestDay.fongique) >= 21) kinds.push('fongique');
    kinds.forEach(k => { s.pestDay[k] = s.day; });
    const BS = { Herbacée: .5, Racine: .5, 'Couvre-sol': .4, Grimpante: .25, Arbuste: .1, Arbre: .03 }, BF = { Herbacée: .3, Racine: .2, 'Couvre-sol': .08, Grimpante: .4, Arbuste: .2, Arbre: .15 };
    for (const k of kinds) {
      let n = 0;
      for (let i = 0; i < NCELL; i++) { const c = s.grid[i]; if (!c || c.treille || c.sick) continue; if ((k === 'limaces' && (c.shieldL || -1) >= s.day) || (k === 'fongique' && (c.shieldF || -1) >= s.day)) continue; const p = P[c.pid]; let b = (k === 'limaces' ? BS : BF)[p.strate] || .2; if (nichoirNear(s, i)) b *= .5; if (k === 'limaces' && duckNear(s, i)) b *= .08; if (c.supp === 'pergola' && k === 'fongique') b *= .8; const hit = b * (1 - resistance(s, i).pct / 100); if (rn() < hit) { c.sick = { k, day: s.day }; n++; } }
      if (n) ev.push({ t: 'warn', text: (k === 'limaces' ? 'Attaque de limaces : ' : 'Maladie fongique : ') + n + ' plante' + (n > 1 ? 's' : '') + ' touchée' + (n > 1 ? 's' : '') + '. Soigne-les vite.' });
    }
  }
  const WOODY = ['Arbre', 'Arbuste', 'Grimpante'];
  function pruneKey(s) { const d = dateOf(s.day); return d.m >= 9 ? d.y + 1 : d.y; }
  function needsPrune(s, c) { if (!c || c.treille || !WOODY.includes(P[c.pid].strate)) return false; const m = dateOf(s.day).m; if (!(m >= 10 || m <= 2)) return false; const st = phase(c).stage; if (st === 'graine' || st === 'pousse') return false; return c.pruned !== pruneKey(s); }
  function prune(s, i) { const c = s.grid[i]; if (!needsPrune(s, c)) return false; c.pruned = pruneKey(s); c.care = s.day; c.stress = Math.max(0, (c.stress || 0) - 2); bump(s, 'prune'); return true; }
  function mulch(s, i) { const c = s.grid[i]; if (!c || c.treille || c.mulch || !(s.mats.paillage > 0)) return false; s.mats.paillage--; c.mulch = true; c.mulchDay = s.day; c.care = s.day; s.soil = clamp(s.soil + .4, 0, 100); bump(s, 'mulch'); return true; }
  function compost(s, i) { const c = s.grid[i]; if (!c || c.treille || !(s.mats.compost > 0)) return false; s.mats.compost--; c.care = s.day; c.compostUntil = s.day + 30; s.soil = clamp(s.soil + 1.5, 0, 100); bump(s, 'compost'); return true; }
  function remove(s, i) { const c = s.grid[i]; if (!c) return false; if (c.supp) { s.grid[i] = { treille: true, furn: c.supp }; return true; } if (c.ducks) s.mats.canard = (s.mats.canard || 0) + 1; if (c.treille) s.mats[c.furn || 'treille'] = (s.mats[c.furn || 'treille'] || 0) + 1; s.grid[i] = null; return true; }
  function waterSave(s, i) { const c = s.grid[i], g = c && !c.treille ? guildOf(s, i) : null; return (c && c.mulch ? .5 : 1) * (g ? (g.auto ? .55 : .65) : 1); }
  function waterCost(c, s, i) { return 2.5 * P[c.pid].eau * (s && i != null ? waterSave(s, i) : 1); }
  function waterCells(s, list) {
    let n = 0, short = false;
    for (const i of list) {
      const c = s.grid[i]; if (!c || c.treille) continue;
      const cost = waterCost(c, s, i); if (s.tank < cost) { short = true; break; }
      s.tank -= cost; c.water = 95; c.care = s.day; n++;
    }
    if (n) bump(s, 'water', n); return { n, short };
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
    const u = unlocked(s), m = dateOf(s.day).m, el = P.filter(p => u.has(p.strate) && (!isExo(p) || hasGS(s)) && (!force || (sowable(p, m) && p.rarete !== 'Rare')));
    if (!el.length) return P[0];
    const SW = { Arbre: 20, Arbuste: 22, Herbacée: 22, Racine: 12, 'Couvre-sol': 8, Grimpante: 8 };
    const sts = [...new Set(el.map(p => p.strate))]; let xs = rng() * sts.reduce((a, k) => a + SW[k], 0), st = sts[sts.length - 1];
    for (const k of sts) { xs -= SW[k]; if (xs <= 0) { st = k; break; } }
    const el2 = el.filter(p => p.strate === st);
    const roll = rng(), rar = roll < .72 ? 'Commune' : roll < .93 ? 'Peu commune' : 'Rare';
    let pool = el2.filter(p => p.rarete === rar); if (!pool.length) pool = el2;
    const w = pool.map(p => (sowable(p, m) ? 3 : 1) * (p.id < CORE ? 5 : 1) * (p.fc ? 2.5 : 1) * ((st === 'Arbre' || st === 'Arbuste') && p.kg > 0 ? 2.5 : 1)), tot = w.reduce((a, b) => a + b, 0); let x = rng() * tot;
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
  const FAST_NAMES = ['Radis', 'Épinard', 'Mâche', 'Laitue', 'Chervis', 'Ciboulette', 'Pois', 'Persil', 'Bourrache', 'Roquette', 'Poirée'];
  function fastPool(s, m, strates) { const u = unlocked(s); return FAST_NAMES.map(n => byName[n]).filter(p => p && sowable(p, m) && u.has(p.strate) && (!strates || strates.includes(p.strate))); }
  const boosterGap = s => s.boosters < 3 ? 3 : 7;
  function boosterIn(s) { return s.boosterDay < 0 ? 0 : Math.max(0, s.boosterDay + boosterGap(s) - s.day); }
  function boosterReady(s) { return boosterIn(s) === 0; }
  function openBooster(s) {
    if (!boosterReady(s)) return null; gainXp(s, 40);
    const rng = mulberry(s.day * 131 + s.boosters * 17 + 7), cards = [], m = dateOf(s.day).m;
    if (s.boosters === 0) {
      const used = new Set(), want = ['Racine', 'Herbacée', 'Couvre-sol', 'Herbacée', 'Racine', 'Arbuste'];
      for (const st of want) {
        let pool = P.filter(p => p.strate === st && sowable(p, m) && p.rarete !== 'Rare' && !used.has(p.id) && (st !== 'Arbre' && st !== 'Arbuste' || p.kg > 0)); const core = pool.filter(p => p.id < CORE); if (core.length && rng() < .8) pool = core;
        if (st === 'Racine' || st === 'Herbacée') { const fp = fastPool({ day: s.day, maxPlantings: 99, plantings: 99 }, m, [st]).filter(p => !used.has(p.id)); if (fp.length) pool = fp; }
        if (pool.length) { const p = pool[Math.floor(rng() * pool.length)]; used.add(p.id); cards.push({ t: 'plant', pid: p.id }); }
      }
    } else {
      const wood = p => p.strate === 'Arbre' || p.strate === 'Arbuste', used = new Set(), u = unlocked(s);
      const add = p => { if (p && !used.has(p.id)) { used.add(p.id); cards.push({ t: 'plant', pid: p.id }); return true; } return false; };
      const known = new Set([...Object.keys(s.cards).map(Number), ...s.grid.filter(c => c && !c.treille).map(c => c.pid)]);
      // 3 plantes de saison (au début, des cultures rapides en automne et en hiver)
      if (s.boosters < 14 && (m >= 9 || m <= 2)) { const fp = fastPool(s, m); for (let k = 0; k < 2 && fp.length; k++) add(fp.splice(Math.floor(rng() * fp.length), 1)[0]); }
      for (let tries = 0; tries < 60 && cards.length < 3; tries++) add(pickPlant(s, rng, true));
      // au moins un arbre ou arbuste semable quand la strate est débloquée
      if (u.has('Arbuste') && !cards.some(c => wood(P[c.pid]))) { for (let tries = 0; tries < 40; tries++) { const p = pickPlant(s, rng, tries < 10); if (wood(p) && !used.has(p.id)) { used.delete(P[cards[2].pid].id); cards[2] = { t: 'plant', pid: p.id }; used.add(p.id); break; } } }
      // une espèce encore jamais vue : la découverte de la semaine
      { const pool = P.filter(p => !known.has(p.id) && !used.has(p.id) && u.has(p.strate) && (!isExo(p) || hasGS(s)) && sowable(p, m) && p.rarete !== 'Rare'); const pool2 = pool.length ? pool : P.filter(p => !used.has(p.id) && u.has(p.strate) && (!isExo(p) || hasGS(s)) && sowable(p, m) && p.rarete !== 'Rare'); if (pool2.length) { const fq = pool2.filter(p => p.fc), src = fq.length && rng() < .5 ? fq : pool2; add(src[Math.floor(rng() * src.length)]); } }
      // dernière carte : une plante rare (1 fois sur 4) ou du matériel
      { let done = false; if (rng() < .25) { let rp = P.filter(p => p.rarete === 'Rare' && !used.has(p.id) && u.has(p.strate) && (!isExo(p) || hasGS(s))); { const fr = rp.filter(p => p.fc); if (fr.length && rng() < .5) rp = fr; } if (rp.length) { const sw = rp.filter(p => sowable(p, m)), pool = sw.length ? sw : rp; done = add(pool[Math.floor(rng() * pool.length)]); } }
        if (!done) cards.push({ t: 'mat', k: ['paillage', 'compost', 'chemin'][Math.min(2, Math.floor(rng() * 3))] }); }
      while (cards.length < BOOSTER_SIZE) add(pickPlant(s, rng, true));
    }
    for (const c of cards) { if (c.t === 'plant') s.cards[c.pid] = (s.cards[c.pid] || 0) + 1; else { c.q = MAT_QTY[c.k] || 1; s.mats[c.k] = (s.mats[c.k] || 0) + c.q; } }
    s.boosterDay = s.day; s.boosters++; s.feves = (s.feves || 0) + 2; bump(s);
    if (Object.values(s.cards).reduce((a, b) => a + b, 0) > 30) recycleDoubles(s);
    log(s, 'good', 'Booster ouvert : ' + cards.length + ' cartes.');
    return cards;
  }

  // ----- cuisine -----
  function stockTotals(s) { const t = {}; for (const it of s.stock) t[it.pid] = (t[it.pid] || 0) + it.kg; return t; }
  function cook(s, pids) {
    if (!pids.length) return { ok: false, msg: 'Choisis au moins un ingrédient.' };
    const t = stockTotals(s); let kcal = 0, prot = 0, grams = 0; const used = [];
    for (const pid of pids) {
      if (pid === 'honey') { const g = Math.min(40 * ((s.family || []).length || 1), Math.round((s.honey || 0) * 1000)); if (g < 20) continue; s.honey = r2(s.honey - g / 1000); kcal += g * 3; prot += g * .003; grams += g; used.push({ name: 'miel', strate: 'Miel', kcal: 300 }); continue; }
      if (pid === 'eggs') { const n = Math.min(2 * ((s.family || []).length || 1), Math.floor(s.eggs || 0)); if (n < 1) continue; s.eggs = r2(s.eggs - n); kcal += n * EGG_KCAL; prot += n * EGG_PROT; grams += n * EGG_G; used.push({ name: 'œufs', strate: 'Œuf', kcal: n * EGG_KCAL }); continue; }
      const have = t[pid] || 0, g = Math.min(180 * (s.family || []).length || 180, Math.round(have * 1000)); if (g < 30) continue;
      let need = g / 1000;
      for (const it of [...s.stock].sort((a, b) => (a.keep ? 1 : 0) - (b.keep ? 1 : 0))) { if (it.pid !== pid || need <= 0) continue; const take = Math.min(it.kg, need); it.kg = r2(it.kg - take); need -= take; }
      const p = P[pid]; kcal += g * p.kcal / 100; prot += g * p.prot / 100; grams += g; used.push(p);
    }
    s.stock = s.stock.filter(it => it.kg > 0.004);
    if (!used.length) return { ok: false, msg: 'Pas assez de récolte pour cuisiner.' };
    const strata = new Set(used.filter(p => p.strate !== 'Miel' && p.strate !== 'Œuf').map(p => p.strate)).size, kinds = used.length;
    const balance = clamp((strata - 1) * 34 + (prot > 8 ? 30 : prot > 4 ? 15 : 0) + (kinds >= 3 ? 12 : 0), 0, 100);
    s.eaten.push({ day: s.day, kcal: Math.round(kcal), prot: r1(prot) }); s.cookedDay = s.day; s.meals++;
    const fam = s.family || [], tn = famNeed(s), shares = [];
    for (const f of fam) { const sh = kcal * f.need / tn; f.hist.push({ day: s.day, kcal: Math.round(sh), bal: Math.round(balance) }); f.hist = f.hist.filter(x => s.day - x.day <= 6); shares.push({ n: f.n, ratio: Math.min(1.5, sh / (f.need * gshare(s))) }); f.joy = clamp(f.joy + Math.min(14, sh / (f.need * gshare(s)) * 22) * (.6 + balance / 250) * (1 + .05 * Math.max(0, skillLevel(s, 'cuisine') - 1)), 0, 100); }
    s.waste = r2((s.waste || 0) + grams / 1000 * .3); gainSkill(s, 'cuisine', 2); gainXp(s, Math.round(balance / 10)); bump(s);
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
    if (boosterReady(s)) T.push({ id: 'booster', prio: 1, icon: 'pack', label: 'Ouvrir le booster de la semaine', sub: 'Sept cartes : graines, noyaux et plants', act: { type: 'booster' } });
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
  function autoWater(s) { for (let i = 0; i < NCELL; i++) { const c = s.grid[i]; if (c && !c.treille && c.water < 30) { const cost = waterCost(c, s, i); if (s.tank >= cost) { s.tank -= cost; c.water = 90; } } } }
  function nextDay(s, assist) {
    const ev = []; if (s.pq && s.pq.length) flushPlantQueue(s);
    if (assist) autoWater(s);
    s.day++; const w = weather(s.day), m = dateOf(s.day).m, tm = (w.tmin + w.tmax) / 2; s.w = w;
    s.tank = Math.min(s.tankMax, s.tank + w.rain * 10 * (1 + .3 * (s.cuves || 0)));
    if (w.tmin < 0) ev.push({ t: 'warn', text: 'Gelée cette nuit (' + String(w.tmin).replace('.', ',') + ' °C).' });
    if (w.ev) { s.wxCount = s.wxCount || {}; s.wxCount[w.ev] = (s.wxCount[w.ev] || 0) + 1; const WT = { canicule: 'Canicule : ' + String(w.tmax).replace('.', ',') + ' °C, le sol sèche vite.', secheresse: 'Période sèche : pas de pluie, pense à arroser et à pailler.', tempete: 'Tempête de vent cette nuit.', orage: w.hail ? 'Orage de grêle !' : 'Orage : la cuve se remplit.' }; if (WT[w.ev]) ev.push({ t: 'warn', text: WT[w.ev] }); }
    let wxHit = 0;
    for (let i = 0; i < NCELL; i++) {
      const c = s.grid[i]; if (!c || c.treille) continue;
      if ((c.oyaUntil || -1) >= s.day) c.water = Math.max(c.water, 80);
      if (c.mulch) { if (c.mulchDay == null) c.mulchDay = s.day; else if (s.day - c.mulchDay > 120) { c.mulch = false; c.mulchDay = null; ev.push({ t: 'warn', text: 'Le paillage de ' + P[c.pid].name.toLowerCase() + ' est décomposé : il nourrit le sol, remets-en pour garder l’eau.' }); } }
      const p = P[c.pid], sy = synergy(s, i), gdw = guildOf(s, i), gdok = !!c.noyau || !!gdw && ['jeune', 'mature'].includes(phase(s.grid[gdw.c]).stage), wasStage = c.stage, wasReady = c.ready;
      c.water = clamp(c.water - EVAP[m] * NEEDF[p.eau] * (c.mulch ? .35 : 1) * (gdw ? (gdw.auto ? .65 : .75) : 1) * sy.evap * (w.ev === 'canicule' ? (shadeOf(s, i, p) ? 1.25 : 1.7) : w.ev === 'secheresse' ? 1.2 : w.tmax > 25 ? 1.15 : 1) + w.rain * 5, 0, 100);
      if (c.noyau) c.water = 100;
      if (c.water < 20) c.stress++; else c.stress = Math.max(0, c.stress - 2);
      if (c.stress > 7) { if (c.stress >= 44) c.health -= 3; else c.health = Math.max(1, c.health - 1.2); }
      else if (c.stress === 0) c.health = Math.min(100, c.health + 1.5);
      const ph0 = phase(c).stage;
      const rs = (w.ev || w.tmin < 3) ? resistance(s, i).pct / 100 : 0, voile = (c.voileUntil || -1) >= s.day;
      const gelEff = p.gel - (gsNear(s, i) ? 9 : neigh(i).some(j => s.grid[j] && s.grid[j].furn === 'serre') ? 4 : 0) - rs * 4 - (voile ? 9 : 0) - (neigh(i).some(j => { const q = s.grid[j]; return q && !q.treille && P[q.pid].strate === 'Arbre' && phase(q).stage !== 'graine' && phase(q).stage !== 'pousse'; }) ? 2 : 0) - (gdw ? (gdw.auto ? 3 : 1.5) : 0);
      if (w.tmin < gelEff && ph0 !== 'graine' && !gdok) {
        if (p.gel >= -3 && p.kind !== 'vivace') { if (gelEff - w.tmin <= 1.5 && c.health > 45) c.health -= 45; else c.health = 0; } else c.health -= p.gel >= -3 ? 30 : 15;
      }
      if (w.ev && c.g >= 0 && !gdok) {
        let dmg = 0, tallN = neigh(i).filter(j => s.grid[j] && !s.grid[j].treille && P[s.grid[j].pid].strate === 'Arbre').length;
        if (w.ev === 'canicule' && c.water < 10) dmg = (p.strate === 'Arbre' ? 1.5 : 7) * (1 - rs) * (shadeOf(s, i, p) ? .6 : 1);
        else if (w.ev === 'secheresse' && c.water < 5) dmg = (p.strate === 'Arbre' ? .8 : 3) * (1 - rs);
        else if (w.ev === 'tempete' && (p.strate === 'Arbre' || p.strate === 'Arbuste' || p.strate === 'Grimpante')) { dmg = (p.strate === 'Arbre' ? 10 : p.strate === 'Grimpante' ? 22 : 12) * (1 - rs) * (tallN >= 2 ? .4 : tallN === 1 ? .7 : 1); if (c.supp) dmg *= .6; }
        else if (w.ev === 'orage' && w.hail && !voile && !neigh(i).some(j => s.grid[j] && s.grid[j].furn === 'serre')) { if (p.strate === 'Herbacée' || p.strate === 'Racine' || p.strate === 'Couvre-sol') dmg = 30 * (1 - rs) * (tallN ? .7 : 1); else if (p.strate === 'Arbuste') dmg = 8 * (1 - rs); }
        if (dmg > 0.5) { c.health = Math.max(0, c.health - dmg); wxHit++; }
      }
      if (c.sick) { c.health = Math.max(1, c.health - (c.sick.k === 'limaces' ? 2.2 : 1.6)); if (s.day - c.sick.day >= 8) { c.health = Math.max(1, c.health - 12); c.sick = null; ev.push({ t: 'warn', text: p.name + ' a beaucoup souffert faute de soin.' }); } }
      if (c.health <= 0) { ev.push({ t: 'bad', text: p.name + (w.tmin < gelEff ? ' n’a pas résisté au gel.' : w.ev === 'tempete' ? ' a été brisé par la tempête.' : w.ev === 'orage' ? ' a été haché par la grêle.' : w.ev === 'canicule' ? ' n’a pas supporté la canicule.' : ' est mort de soif.') }); s.grid[i] = c.supp ? { treille: true, furn: c.supp } : null; continue; }
      let f = 1;
      if (c.g < p.germ) f = (tm < 5 && p.gel >= -5) ? .3 : 1;
      else if (c.g < maturity(p)) { f = SEASONF[m]; f = f + (1 - f) * (1 - Math.min(1, p.croiss / 120)); if (p.gel <= -8 && p.croiss <= 130 && ['Herbacée', 'Racine'].includes(p.strate)) f = Math.max(f, .6); if (tm < 8 && p.gel >= 0 && !gsNear(s, i)) f *= .3; }
      else f = 1;
      const sf = c.stress > 7 ? .3 : c.stress > 0 ? .5 : 1;
      c.g += f * (c.noyau ? .6 : 1) * clamp(1 + (c.noyau ? Math.max(0, sy.growth) : sy.growth), .3, 1.5) * (.7 + s.soil / 100 * .6) * sf * (s.day <= c.compostUntil ? 1.2 : 1) * ((c.ortieUntil || -1) >= s.day ? 1.2 : 1) * ((c.mycoUntil || -1) >= s.day ? 1.25 : 1) * (s.day <= s.boostUntil ? 1.6 : 1) * (c.sick ? .5 : 1) * (hasAdv(s, 'botaniste') ? 1.1 : 1);
      const st = phase(c).stage; c.stage = st; c.ready = ready(s, c);
      if (st === 'mature' && wasStage !== 'mature' && wasStage !== undefined) ev.push({ t: 'good', text: p.name + ' est arrivé à maturité.' });
      if (c.ready && !wasReady) { c.readyDay = s.day; ev.push({ t: 'good', text: p.name + ' est prêt à récolter.' }); }
    }
    if (wxHit && w.ev !== 'canicule' && w.ev !== 'secheresse') ev.push({ t: 'bad', text: (w.ev === 'tempete' ? 'Tempête' : 'Grêle') + ' : ' + wxHit + ' plante' + (wxHit > 1 ? 's' : '') + ' abîmée' + (wxHit > 1 ? 's' : '') + '. Les guildes et les grands arbres protègent mieux.' });
    s.stock = s.stock.filter(it => { const p = P[it.pid]; if (s.day - it.day > (it.keep ? (it.keep === 'sec' ? 400 : 300) : Math.max(1, p.cons * (hasAdv(s, 'autonome') ? 1.5 : 1)))) { ev.push({ t: 'warn', text: it.kg.toFixed(2).replace('.', ',') + ' kg de ' + p.name.toLowerCase() + ' perdus (trop vieux).' }); return false; } return true; });
    { const sea = Math.floor((m % 12) / 3); if (s.lastSea == null) s.lastSea = sea; else if (s.lastSea !== sea) { s.lastSea = sea; gainXp(s, 350); ev.push({ t: 'good', text: 'Une nouvelle saison s’installe : ton jardin a bien vécu, de l’expérience en plus.' }); } }
    pests(s, w, m, ev);
    for (const f of (s.family || [])) { const rec = f.hist.filter(x => s.day - x.day < 3).reduce((a, b) => a + b.kcal, 0) / 3, ratio = rec / (f.need * gshare(s)); const tgt = clamp((ratio <= 0 ? 12 : clamp(18 + ratio * 70, 12, 100)) + (hamacOk(s) ? 10 : 0) + pathJoy(s), 12, 100); f.joy = clamp(f.joy + (tgt - f.joy) * .12 - (ratio < .25 ? 3 : 0), s.day < 45 ? 35 : 0, 100); }
    { const hungry = (s.family || []).filter(f => f.joy < 25); if (hungry.length && s.day % 3 === 0) ev.push({ t: 'warn', text: hungry.map(f => f.n).join(', ') + (hungry.length > 1 ? ' ont faim' : ' a faim') + ' : cuisine avec ta récolte.' }); }
    { s.waste = (s.waste || 0) + s.grid.filter(c => c && c.furn === 'mare' && c.ducks).length * .25; if (s.poulailler) { const hm = dateOf(s.day).m, per = (hm >= 3 && hm <= 8) ? .75 : (hm === 2 || hm === 9) ? .5 : .2, ate = Math.min(s.waste, .3), fed = ate >= .25 ? 1 : .5, lay = (s.poules || 3) * per * fed; s.waste = r2(s.waste - ate + (s.poules || 3) * .12); const before = s.eggs || 0; s.eggs = Math.min(EGG_CAP, r2(before + lay)); const got = s.eggs - before; s.eggsMade = r2((s.eggsMade || 0) + got); if (got > 0) (s.prod = s.prod || []).push({ day: s.day, kcal: Math.round(got * EGG_KCAL) }); }
    const take = Math.min(s.waste, COMPOST_RATE); s.waste = r2(s.waste - take); s.compostPts = (s.compostPts || 0) + take; while (s.compostPts >= COMPOST_KG) { s.compostPts -= COMPOST_KG; s.mats.compost = (s.mats.compost || 0) + 1; s.compostMade = (s.compostMade || 0) + 1; } }
    const st = stats(s); s.soil += (st.soilTarget - s.soil) * .02; s.soil = Math.min(s.soil, 70 + 25 * clamp((s.day || 0) / 730, 0, 1));
    if (s.day % 30 === 0) { s.eaten = s.eaten.filter(e => s.day - e.day <= 60); s.prod = (s.prod || []).filter(e => s.day - e.day <= 120); }
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
      if (p.kg > 0) { const k = p.kg * (KGM[p.kind] || 1) * (1 + synergy(s, i).yield) * (p.kind === 'continue' ? (p.recolte.length / 12) * 2.2 : 1); pk += k; pkc += k * 10 * p.kcal; }
    });
    const mares = s.grid.filter(c => c && c.furn === 'mare').length;
    const ruches = s.grid.filter(c => c && c.furn === 'ruche').length + Math.min(2, s.grid.filter(c => c && c.ducks).length);
    const woody = cs.filter(o => P[o.c.pid].strate === 'Arbre' || P[o.c.pid].strate === 'Arbuste'), woodyMature = woody.filter(o => phase(o.c).stage === 'mature').length, nich = cs.filter(o => o.c.nichoir).length;
    const biodiv = cs.length ? Math.round(clamp(5 + Math.min(sp.size, 80) * .55 + strata.size * 2 + Math.min(mell, 10) * 1.2 + Math.min(2, mares) * 5 + Math.min(2, ruches) * 3 + Math.min(3, nich) * 2 + (woody.length ? woodyMature / woody.length * 12 : 0), 0, 100)) : 0;
    const eaten30 = s.eaten.filter(e => s.day - e.day < 30).reduce((a, b) => a + b.kcal, 0);
    const target = Math.min(clamp(45 + Math.min(20, couvre * 3) + Math.min(10, azote * 2.5) + (cs.length ? mul / cs.length * 10 : 0) + comp * 1.5, 20, 95), 70 + 25 * clamp((s.day || 0) / 730, 0, 1));
    const need = famNeed(s) * gshare(s), prod90 = (s.prod || []).filter(x => s.day - x.day < 90).reduce((a, b) => a + b.kcal, 0), gl = guilds(s);
    const aEat = clamp(eaten30 / (need * 30), 0, 1) * 100, aProd = clamp(prod90 / (need * 90), 0, 1) * 100, aPot = clamp(pkc / (need * 365), 0, 1) * 100, base = aEat * .55 + aProd * .3 + aPot * .15, boost = Math.min(.6, gl.auto * .06 + (gl.n - gl.auto) * .025);
    const autonomy = Math.round(clamp(base * (1 + boost), 0, 100) * 10) / 10;
    return { autonomy, aParts: { eat: Math.round(aEat), prod: Math.round(aProd), pot: Math.round(aPot), base: Math.round(base), boost: Math.round(boost * 100) }, guildsN: gl.n, guildsAuto: gl.auto, biodiv, soil: Math.round(s.soil), soilTarget: target,
      species: sp.size, plants: cs.length, potKg: Math.round(pk * 10) / 10, potCover: Math.round(clamp(pkc / (famNeed(s) * 365) * 100, 0, 100)), eaten30: Math.round(eaten30) };
  }

  // ----- jardin mature (démo) -----
  function demo() {
    const s = fixSave(blank()); s.demo = true; s.tuto = { done: true }; s.feves = 80; s.day = dayOfDate(2027, 6, 12); s.w = weather(s.day);
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
    [[6, 1, 'mare'], [5, 4, 'serre'], [1, 3, 'pergola'], [8, 2, 'ruche']].forEach(([c, r, k]) => { s.grid[r * COLS + c] = { treille: true, furn: k }; if (k === 'ruche') s.grid[r * COLS + c].honeyDay = s.day - 60; });
    s.paths = ['4,0-4,1', '4,1-4,2', '4,2-4,3', '4,3-4,4', '4,3-5,3', '5,3-6,3'];
    [['Fraisier des bois', .25], ['Carotte', .5], ['Poirée', .4], ['Cerisier', 1.2]].forEach(([n, kg]) => s.stock.push({ pid: byName[n].id, kg, day: s.day - 1 }));
    s.atelier = true; s.sechoir = true; s.poulailler = true; s.poules = 3; s.eggs = 6; s.cuves = 1; s.tankMax = 650; s.tank = 520; Object.assign(s.mats, { bocaux: 6, ortie: 1, prele: 1, nichoir: 1, oya: 1, cuve: 1, plan: 1, mycor: 1, savoir: 1, grandeserre: 1 });
    { const ti = s.grid.findIndex(c => c && !c.treille && P[c.pid].strate === 'Arbre'); if (ti >= 0) s.grid[ti].nichoir = true; const oi = s.grid.findIndex(c => c && !c.treille && P[c.pid].strate === 'Herbacée'); if (oi >= 0) s.grid[oi].oyaUntil = s.day + 30; const gi = s.grid.findIndex((c, k) => !c && isActive(s, k) && (k % COLS) >= 2); if (gi >= 0) s.grid[gi] = { treille: true, furn: 'grandeserre' }; }
    s.stock.push({ pid: byName['Tomate'].id, kg: 1.2, day: s.day - 5, keep: 'bocal' }, { pid: byName['Thym'].id, kg: .3, day: s.day - 8, keep: 'sec' });
    s.prod = [{ day: s.day - 20, kcal: 30000 }, { day: s.day - 50, kcal: 20000 }, { day: s.day - 75, kcal: 10000 }]; s.knowledge = []; log(s, 'good', 'Jardin mature de démonstration : trois ans de travail, un matin de juillet.');
    s.skills.lv = { plantation: 3, tonte: 4, cuisine: 3, trogne: 2, bouture: 2, fabrication: 2, sechage: 1, transformation: 2, greffe: 1 }; s.skills.use = { plantation: 45, tonte: 60, cuisine: 20, trogne: 8, bouture: 5, fabrication: 6, sechage: 4, transformation: 6, greffe: 3 }; s.xp = 1500; s.ptsSpent = 14; s.pts = 2; Object.keys(s.skills.lv).forEach(k => { s.skills.seen[k] = 1; }); checkSkills(s, true);
    s.grid.forEach((c, i) => { if (c && !c.treille) { c.stage = phase(c).stage; c.ready = ready(s, c); } });
    return s;
  }


  function moveCheck(s, from, to) {
    const c = s.grid[from]; if (!c || c.treille) return { ok: false, msg: 'Rien à déplacer ici.' };
    if (from === to) return { ok: false, msg: 'C’est déjà sa place.' };
    if (!isActive(s, to)) return { ok: false, msg: 'Cette parcelle n’est pas encore à toi.' };
    const t = s.grid[to], p = P[c.pid];
    if (t && !(t.treille && (t.furn === 'treille' || t.furn === 'pergola') && p.strate === 'Grimpante')) return { ok: false, msg: 'Cette parcelle est occupée.' };
    return { ok: true, support: t && t.treille ? t.furn : null, p };
  }
  function movePlant(s, from, to) {
    const k = moveCheck(s, from, to); if (!k.ok) return k;
    const c = s.grid[from], woody = k.p.strate === 'Arbre' || k.p.strate === 'Arbuste';
    s.grid[from] = c.supp ? { treille: true, furn: c.supp } : null;
    delete c.supp; if (k.support) c.supp = k.support;
    c.stress = (c.stress || 0) + (woody ? 2 : 1); c.water = Math.max(0, (c.water || 0) - 8);
    s.grid[to] = c; log(s, 'good', k.p.name + ' déplacé' + (woody ? ' (il reprendra mieux en repos)' : '') + '.'); bump(s);
    return { ok: true, name: k.p.name, woody };
  }


  // ----- nouvelles cartes : atelier, soins, eau, savoir -----
  function hasGS(s) { return (s.mats.grandeserre || 0) > 0 || s.grid.some(c => c && c.furn === 'grandeserre'); }
  function gsNear(s, i) { return neigh(i).some(j => s.grid[j] && s.grid[j].furn === 'grandeserre'); }
  function nichoirNear(s, i) { return s.grid[i] && s.grid[i].nichoir || neigh(i).some(j => s.grid[j] && s.grid[j].nichoir); }
  function plantCell(s, i) { const c = s.grid[i]; return c && !c.treille ? c : null; }
  function shadeOf(s, i, p) { return p.strate === 'Arbre' || neigh(i).some(j => s.grid[j] && !s.grid[j].treille && P[s.grid[j].pid].strate === 'Arbre'); }
  function useVoile(s, i) {
    if (!plantCell(s, i)) return { ok: false, msg: 'Choisis une plante.' }; if (!(s.mats.voile > 0)) return { ok: false, msg: 'Plus de voile d’hivernage.' };
    s.mats.voile--; const g = group(s, i); g.forEach(j => { s.grid[j].voileUntil = s.day + 10; });
    log(s, 'good', 'Voile d’hivernage posé sur ' + g.length + ' plante' + (g.length > 1 ? 's' : '') + ' pour 10 jours : gel et grêle.'); bump(s, 'soin'); return { ok: true, n: g.length };
  }
  function forecastInfo(s) {
    const isGel = w => w.ev === 'gel' || (w.tmin != null && w.tmin <= .5); let f = null, dd = 1;
    for (let k = 1; k <= 3; k++) { const g = weather(s.day + k); if (isGel(g)) { f = Object.assign({}, g, { ev: 'gel' }); dd = k; break; } if (g.ev && ['canicule', 'secheresse', 'tempete', 'orage'].includes(g.ev) && !(g.ev === 'orage' && !g.hail && k > 1)) { f = g; dd = k; break; } }
    const mo = dateOf(s.day).m;
    if (!f) { if (s.tank < s.tankMax * .25 && mo >= 5 && mo <= 9 && s.grid.some(c => c && !c.treille)) return { kind: 'secheresse', title: 'Réserve d’eau basse (' + Math.round(s.tank) + ' L)', tip: 'Pose du paillage : il garde l’humidité. Chaque cuve de récupération ajoute 150 L.', hail: false, days: 0 }; return null; }
    const ex = { gel: ['Gel annoncé cette nuit', 'Une guilde établie (arbre jeune ou adulte) résiste à tout : gel, canicule, sécheresse, tempête et grêle. Sinon, un voile d’hivernage protège jusqu’à 9 °C de plus. Un grand arbre voisin, une guilde (surtout autonome) ou une serre aident aussi. Un gel léger ne tue plus d’un coup une plante en bonne santé.'], canicule: ['Canicule annoncée', 'Arrose avant la chaleur, pose du paillage : les plantes à l’ombre des arbres souffrent moins.'], secheresse: ['Période sèche annoncée', 'Garde de l’eau en cuve, pose des oyas et du paillage.'], tempete: ['Tempête annoncée', 'Arbres, arbustes et grimpantes sont exposés. Un grand arbre voisin coupe le vent.'], orage: ['Orage annoncé', f.hail ? 'Risque de grêle : pose un voile sur les cultures tendres.' : 'La cuve va se remplir.'] };
    const base = f.ev === 'gel' && dd > 1 ? 'Gel annoncé' : ex[f.ev][0];
    return { kind: f.ev, title: base + (dd > 1 ? ' dans ' + dd + ' jours' : '') + (f.ev === 'gel' ? ' (' + String(f.tmin).replace('.', ',') + ' °C)' : f.ev === 'canicule' ? ' (' + String(Math.round(f.tmax)) + ' °C)' : ''), tip: ex[f.ev][1], hail: f.hail, days: dd, tmin: f.tmin };
  }
  function protectFrost(s) {
    const fc = forecastInfo(s); if (!fc || fc.kind !== 'gel') return { ok: false, msg: 'Aucun gel annoncé.' };
    const risk = i => { const c = s.grid[i]; if (!plantCell(s, i)) return false; if ((c.voileUntil || -1) >= s.day + fc.days) return false; const p = P[c.pid]; return fc.tmin < p.gel - (gsNear(s, i) ? 9 : neigh(i).some(j => s.grid[j] && s.grid[j].furn === 'serre') ? 4 : 0); };
    let used = 0, covered = 0;
    while ((s.mats.voile || 0) > 0 && used < 12) { let best = -1, bn = 0; for (let i = 0; i < NCELL; i++) { if (!isActive(s, i) || !plantCell(s, i)) continue; const n = group(s, i).filter(risk).length; if (n > bn) { bn = n; best = i; } } if (best < 0) break; const r = useVoile(s, best); if (!r.ok) break; used++; covered += bn; }
    const left = []; for (let i = 0; i < NCELL; i++) if (isActive(s, i) && risk(i)) left.push(i);
    return { ok: used > 0, used, covered, left: left.length, msg: used ? used + ' voile' + (used > 1 ? 's' : '') + ' posé' + (used > 1 ? 's' : '') + (left.length ? ' · ' + left.length + ' plante' + (left.length > 1 ? 's' : '') + ' restent fragiles.' : ' : tes plantes fragiles sont couvertes.') : (left.length ? 'Plus de voile d’hivernage : ' + left.length + ' plante' + (left.length > 1 ? 's sont fragiles' : ' est fragile') + '.' : 'Rien de fragile à protéger.') };
  }
  function group(s, i) { return [i].concat(neigh(i)).filter(j => plantCell(s, j)); }
  function useOrtie(s, i) {
    if (!plantCell(s, i)) return { ok: false, msg: 'Choisis une plante.' }; if (!(s.mats.ortie > 0)) return { ok: false, msg: 'Plus de purin d’ortie.' };
    s.mats.ortie--; const g = group(s, i); g.forEach(j => { const x = s.grid[j]; x.ortieUntil = s.day + 30; x.shieldL = s.day + 21; });
    log(s, 'good', 'Purin d’ortie : ' + g.length + ' plante' + (g.length > 1 ? 's' : '') + ' stimulée' + (g.length > 1 ? 's' : '') + ' et protégée' + (g.length > 1 ? 's' : '') + ' des limaces 3 semaines.'); bump(s, 'soin'); return { ok: true, n: g.length };
  }
  function usePrele(s, i) {
    if (!plantCell(s, i)) return { ok: false, msg: 'Choisis une plante.' }; if (!(s.mats.prele > 0)) return { ok: false, msg: 'Plus de prêle.' };
    s.mats.prele--; const g = group(s, i); let cured = 0; g.forEach(j => { const x = s.grid[j]; x.shieldF = s.day + 30; if (x.sick && x.sick.k === 'fongique') { delete x.sick; cured++; } });
    log(s, 'good', 'Décoction de prêle : ' + g.length + ' plante' + (g.length > 1 ? 's' : '') + ' protégée' + (g.length > 1 ? 's' : '') + ' des maladies fongiques 1 mois' + (cured ? ', ' + cured + ' soignée' + (cured > 1 ? 's' : '') : '') + '.'); bump(s, 'soin'); return { ok: true, n: g.length, cured };
  }
  function placeNichoir(s, i) {
    const c = plantCell(s, i); if (!c || P[c.pid].strate !== 'Arbre') return { ok: false, msg: 'Un nichoir se fixe dans un arbre.' };
    if (c.nichoir) return { ok: false, msg: 'Cet arbre a déjà un nichoir.' }; if (!(s.mats.nichoir > 0)) return { ok: false, msg: 'Plus de nichoir.' };
    s.mats.nichoir--; c.nichoir = true; log(s, 'good', 'Nichoir à mésanges installé dans ' + P[c.pid].name.toLowerCase() + '.'); bump(s, 'soin'); return { ok: true };
  }
  function useOya(s, i) {
    const c = plantCell(s, i); if (!c) return { ok: false, msg: 'Choisis une plante.' }; if (!(s.mats.oya > 0)) return { ok: false, msg: 'Plus d’oya.' };
    s.mats.oya--; c.oyaUntil = s.day + 45; c.water = Math.max(c.water, 80); log(s, 'good', 'Oya enterrée près de ' + P[c.pid].name.toLowerCase() + ' : arrosage automatique 45 jours.'); bump(s, 'soin'); return { ok: true };
  }
  function useMycor(s, i) {
    const c = plantCell(s, i); if (!c || !['Arbre', 'Arbuste'].includes(P[c.pid].strate)) return { ok: false, msg: 'Les mycorhizes se mettent sur un arbre ou un arbuste.' };
    if (!(s.mats.mycor > 0)) return { ok: false, msg: 'Plus d’inoculum.' }; s.mats.mycor--; c.mycoUntil = s.day + 60; log(s, 'good', 'Inoculum de mycorhizes : ' + P[c.pid].name.toLowerCase() + ' pousse plus vite 2 mois.'); bump(s, 'soin'); return { ok: true };
  }
  function useCuve(s) {
    if ((s.cuves || 0) >= 4) return { ok: false, msg: 'Tu as déjà 4 cuves.' }; if (!(s.mats.cuve > 0)) return { ok: false, msg: 'Plus de cuve.' };
    s.mats.cuve--; s.cuves = (s.cuves || 0) + 1; s.tankMax += 150; s.tank = Math.min(s.tankMax, s.tank + 150); log(s, 'good', 'Cuve de récupération installée : réserve d’eau agrandie de 150 L.'); bump(s, 'soin'); return { ok: true };
  }
  function buildPoulailler(s) { if (s.poulailler) return { ok: false, msg: 'Le poulailler est déjà construit.' }; if (!(s.mats.poulailler > 0)) return { ok: false, msg: 'Pas de carte Poulailler.' }; s.mats.poulailler--; s.poulailler = true; s.poules = 3; s.eggs = 0; log(s, 'good', 'Poulailler construit : trois poules s’installent près de la maison.'); bump(s); return { ok: true }; }
  function henInfo(s) { return { on: !!s.poulailler, poules: s.poules || 0, eggs: Math.floor(s.eggs || 0), made: s.eggsMade || 0, cap: EGG_CAP }; }
  function buildAtelier(s) { if (s.atelier) return { ok: false, msg: 'L’atelier est déjà construit.' }; if (!(s.mats.atelier > 0)) return { ok: false, msg: 'Pas de carte Atelier.' }; s.mats.atelier--; s.atelier = true; log(s, 'good', 'Atelier de transformation construit à côté de la maison.'); bump(s); return { ok: true }; }
  function installSechoir(s) { if (!s.atelier) return { ok: false, msg: 'Construis d’abord l’atelier.' }; if (s.sechoir) return { ok: false, msg: 'Le séchoir est déjà installé.' }; if (!(s.mats.sechoir > 0)) return { ok: false, msg: 'Pas de carte Séchoir.' }; s.mats.sechoir--; s.sechoir = true; log(s, 'good', 'Séchoir installé dans l’atelier.'); bump(s); return { ok: true }; }
  function compostInfo(s) { return { hens: s.poulailler ? (s.poules || 3) : 0, waste: r2(s.waste || 0), pts: r2(s.compostPts || 0), kg: COMPOST_KG, rate: COMPOST_RATE, made: s.compostMade || 0, ducks: s.grid.filter(c => c && c.furn === 'mare' && c.ducks).length }; }
  /* ---- sentiers : arêtes entre les parcelles, reliés au bord du jardin ---- */
  const pk = (x1, y1, x2, y2) => (x1 < x2 || (x1 === x2 && y1 <= y2)) ? x1 + ',' + y1 + '-' + x2 + ',' + y2 : x2 + ',' + y2 + '-' + x1 + ',' + y1;
  const pparse = k => { const m = k.split('-').map(t => t.split(',').map(Number)); return [m[0][0], m[0][1], m[1][0], m[1][1]]; };
  const onBorder = (s, x, y) => { const d = dims(s); return x === 0 || y === 0 || x === d[0] || y === d[1]; };
  function pathEdgeOk(s, x1, y1, x2, y2) {
    const d = dims(s); if (Math.abs(x1 - x2) + Math.abs(y1 - y2) !== 1) return false;
    if (Math.min(x1, x2, y1, y2) < 0 || Math.max(x1, x2) > d[0] || Math.max(y1, y2) > d[1]) return false;
    if ((x1 === x2 && (x1 === 0 || x1 === d[0])) || (y1 === y2 && (y1 === 0 || y1 === d[1]))) return false;
    return true;
  }
  function pathLinked(s) { // sommets reliés au bord par des sentiers
    const adj = {}; (s.paths || []).forEach(k => { const [a, b, c, e] = pparse(k), u = a + ',' + b, v = c + ',' + e; (adj[u] = adj[u] || []).push(v); (adj[v] = adj[v] || []).push(u); });
    const seen = new Set(), q = []; Object.keys(adj).forEach(u => { const [x, y] = u.split(',').map(Number); if (onBorder(s, x, y)) { seen.add(u); q.push(u); } });
    while (q.length) { const u = q.pop(); for (const v of adj[u]) if (!seen.has(v)) { seen.add(v); q.push(v); } }
    return seen;
  }
  function pathLinkedEdges(s) { const L = pathLinked(s); return (s.paths || []).filter(k => { const [a, b] = pparse(k); return L.has(a + ',' + b); }); }
  function pathAccess(s, i) {
    if (!s.paths || !s.paths.length) return false; const c = i % COLS, r = (i / COLS) | 0, E = pathLinkedEdges(s); if (!E.length) return false; const set = new Set(E);
    return set.has(pk(c, r, c + 1, r)) || set.has(pk(c, r + 1, c + 1, r + 1)) || set.has(pk(c, r, c, r + 1)) || set.has(pk(c + 1, r, c + 1, r + 1));
  }
  function addPath(s, x1, y1, x2, y2) {
    if (!pathEdgeOk(s, x1, y1, x2, y2)) return { ok: false, why: 'bord', msg: 'Le sentier se trace entre les parcelles, pas le long du bord.' };
    const k = pk(x1, y1, x2, y2); if ((s.paths || []).includes(k)) return { ok: true, exists: true, key: k };
    const L = pathLinked(s); if (!(onBorder(s, x1, y1) || onBorder(s, x2, y2) || L.has(x1 + ',' + y1) || L.has(x2 + ',' + y2))) return { ok: false, why: 'relie', msg: 'Un sentier part du bord du jardin ou d’un sentier déjà tracé.' };
    if (!(s.mats.chemin > 0)) return { ok: false, why: 'stock', msg: 'Plus de gravier : achète du chemin à la boutique.' };
    s.mats.chemin--; (s.paths = s.paths || []).push(k); bump(s); return { ok: true, key: k };
  }
  function removePath(s, k) { const n = (s.paths || []).indexOf(k); if (n < 0) return false; s.paths.splice(n, 1); s.mats.chemin = (s.mats.chemin || 0) + 1; return true; }
  function pathJoy(s) { const n = pathLinkedEdges(s).length; return n >= 10 ? 5 : n >= 5 ? 3 : 0; }
  function hamacOk(s) { return s.grid.some((c, i) => c && c.treille && c.furn === 'hamac' && neigh(i).filter(j => s.grid[j] && !s.grid[j].treille && s.grid[j].health > 60).length >= 3); }
  function shopInfo(s, k) {
    const price = SHOP[k], un = (MAT_UNLOCK[k] != null ? MAT_UNLOCK[k] : FURN_UNLOCK[k]) || 0;
    let why = null; if (s.maxPlantings < un) why = 'Débloqué après ' + un + ' plantations'; else if (k === 'poulailler' && (s.poulailler || s.mats.poulailler > 0)) why = s.poulailler ? 'Déjà construit' : 'Déjà en réserve'; else if (k === 'atelier' && (s.atelier || s.mats.atelier > 0)) why = s.atelier ? 'Déjà construit' : 'Déjà en réserve'; else if (k === 'sechoir' && (s.sechoir || s.mats.sechoir > 0)) why = s.sechoir ? 'Déjà installé' : 'Déjà en réserve'; else if (k === 'sechoir' && !s.atelier && !(s.mats.atelier > 0)) why = 'Il faut d’abord un atelier';
    if (!why && k === 'cuve' && (s.cuves || 0) + (s.mats.cuve || 0) >= 4) why = 'Tu as déjà 4 cuves';
    if (!why && k === 'bocaux' && !s.atelier) why = 'Il faut d’abord un atelier';
    return { price, qty: MAT_QTY[k] || 1, unlock: un, why, owned: s.mats[k] || 0, can: !why && (s.feves || 0) >= price };
  }
  function shopBuy(s, k) {
    if (!SHOP[k]) return { ok: false, msg: 'Cet article n’est pas en vente.' }; const f = shopInfo(s, k);
    if (f.why) return { ok: false, msg: f.why + '.' }; if ((s.feves || 0) < f.price) return { ok: false, msg: 'Il te manque ' + (f.price - s.feves) + ' ginkgos.' };
    s.feves -= f.price; s.mats[k] = (s.mats[k] || 0) + (MAT_QTY[k] || 1); log(s, 'good', 'Boutique : achat de « ' + k + ' » pour ' + f.price + ' ginkgos.'); bump(s, 'shop'); return { ok: true, price: f.price };
  }
  function recycleValue(s, pid, n) { return (RECYCLE[P[pid].rarete] || 1) * n; }
  function recycleLeft(s) { const w = Math.floor(s.day / 7); if (!s.rcy || s.rcy.w !== w) s.rcy = { w, g: 0 }; return RCY_CAP - s.rcy.g; }
  function recycleCards(s, pid, n) { const have = s.cards[pid] || 0; n = Math.min(n == null ? 1 : n, have); if (n <= 0) return { ok: false, gain: 0 }; const unit = RECYCLE[P[pid].rarete] || 1, left = recycleLeft(s); if (left < unit) return { ok: false, gain: 0, n: 0, capped: true }; n = Math.min(n, Math.floor(left / unit)); const g = recycleValue(s, pid, n); s.rcy.g += g; s.cards[pid] -= n; if (!s.cards[pid]) delete s.cards[pid]; s.feves = (s.feves || 0) + g; bump(s); return { ok: true, gain: g, n }; }
  function recycleDoubles(s) { let g = 0, n = 0; for (const k of Object.keys(s.cards)) { const pid = +k, extra = s.cards[pid] - 1; if (extra > 0) { const r = recycleCards(s, pid, extra); g += r.gain; n += r.n; } } if (n) log(s, 'good', 'Recyclage : ' + n + ' carte' + (n > 1 ? 's' : '') + ' en double contre ' + g + ' ginkgos.'); return { ok: n > 0, gain: g, n, left: recycleLeft(s) }; }
  function skillLevel(s, k) { return (s.skills && s.skills.lv && s.skills.lv[k]) || 0; }
  function hasAdv(s, k) { return !!(s.skills && s.skills.adv && s.skills.adv[k]); }
  const XPM = 0.4;
  function discover(s, k, pid, xp) { const d = (s.disc = s.disc || { plant: {}, harvest: {} }); if (!d[k]) d[k] = {}; if (d[k][pid]) return false; d[k][pid] = 1; gainXp(s, xp); return true; }
  function gainXp(s, n) {
    if (!(n > 0)) return; const b = levelOf(s.xp).lvl; s.xp = Math.round(((s.xp || 0) + n * XPM) * 10) / 10; const a = levelOf(s.xp).lvl;
    if (a > b) { s.pts = (s.pts || 0) + (a - b); const m = 'Niveau ' + a + ' ! Tu gagnes ' + (a - b > 1 ? (a - b) + ' points' : '1 point') + ' de compétence.'; s.skillNotes.push(m); log(s, 'good', m); }
  }
  function gainSkill(s, k, n) { s.skills.use[k] = (s.skills.use[k] || 0) + 1; gainXp(s, (n || 1) * (SKILLS[k] ? SKILLS[k].xpk : 5)); }
  function checkSkills(s, quiet) { for (const k of Object.keys(SKILLS)) if (skillLevel(s, k) === 0 && (s.maxPlantings || 0) >= SKILLS[k].req && !s.skills.seen[k]) { s.skills.seen[k] = 1; if (!quiet) { const m = 'Compétence disponible : « ' + SKILLS[k].n + ' » (1 point pour la débloquer).'; s.skillNotes.push(m); log(s, 'good', m); } } }
  function skillState(s, k) {
    const d = SKILLS[k], lv = skillLevel(s, k), use = s.skills.use[k] || 0; if (lv >= d.max) return { max: true, lv };
    const nx = lv + 1; let why = null;
    if (lv === 0 && (s.maxPlantings || 0) < d.req) why = 'Débloquée après ' + d.req + ' plantations';
    else if (nx >= 2 && use < d.use[nx - 2]) why = 'Pratique : ' + use + ' / ' + d.use[nx - 2] + ' ' + d.unit;
    else if (!((s.pts || 0) >= 1)) why = 'Il te faut 1 point de compétence';
    return { lv, nx, why, can: !why, use, need: nx >= 2 ? d.use[nx - 2] : 0 };
  }
  function skillUp(s, k) {
    const d = SKILLS[k]; if (!d) return { ok: false, msg: 'Compétence inconnue.' }; const st = skillState(s, k);
    if (st.max) return { ok: false, msg: 'Niveau maximum atteint.' }; if (!st.can) return { ok: false, msg: st.why + '.' };
    s.pts--; s.ptsSpent = (s.ptsSpent || 0) + 1; s.skills.lv[k] = st.nx;
    const m = 'Compétence « ' + d.n + ' » : niveau ' + st.nx + ' ! ' + d.d[st.nx - 1]; s.skillNotes.push(m); log(s, 'good', m); bump(s); return { ok: true, lv: st.nx, name: d.n };
  }
  function advProgress(s, k) { const a = ADV[k], v = a.prac.k === 'species' ? Object.keys(s.skills.species || {}).length : a.prac.k === 'soin' ? ((s.gq && s.gq.cnt.soin) || 0) : (s.meals || 0); return v; }
  function advState(s, k) {
    const a = ADV[k]; if (hasAdv(s, k)) return { have: true };
    const reqs = Object.keys(a.reqs).map(r => ({ k: r, n: SKILLS[r].n, need: a.reqs[r], ok: skillLevel(s, r) >= a.reqs[r] })), prog = advProgress(s, k);
    let why = null; const miss = reqs.filter(r => !r.ok);
    if (miss.length) why = 'Il faut ' + miss.map(r => r.n + ' niveau ' + r.need).join(' et '); else if (prog < a.prac.n) why = 'Pratique : ' + prog + ' / ' + a.prac.n + ' ' + a.prac.t; else if ((s.pts || 0) < a.cost) why = 'Il te faut ' + a.cost + ' points de compétence';
    return { have: false, reqs, prog, why, can: !why };
  }
  function advUp(s, k) { const a = ADV[k]; if (!a) return { ok: false, msg: 'Spécialisation inconnue.' }; const st = advState(s, k); if (st.have) return { ok: false, msg: 'Déjà acquise.' }; if (!st.can) return { ok: false, msg: st.why + '.' }; s.pts -= a.cost; s.ptsSpent = (s.ptsSpent || 0) + a.cost; s.skills.adv[k] = 1; const m = 'Spécialisation « ' + a.n + ' » acquise ! ' + a.d; s.skillNotes.push(m); log(s, 'good', m); bump(s); return { ok: true, name: a.n }; }
  function xpInfo(s) { const L = levelOf(s.xp); const acq = Object.keys(SKILLS).filter(k => skillLevel(s, k) > 0).length + Object.keys(ADV).filter(k => hasAdv(s, k)).length; return { lvl: L.lvl, into: L.into, need: L.need, xp: s.xp || 0, pts: s.pts || 0, spent: s.ptsSpent || 0, acq, total: Object.keys(SKILLS).length + Object.keys(ADV).length }; }
  function skillList(s) { return Object.keys(SKILLS).map(k => { const d = SKILLS[k], st = skillState(s, k); return { k, n: d.n, cat: d.cat, lv: skillLevel(s, k), max: d.max, d: d.d, use: s.skills.use[k] || 0, how: d.how, unit: d.unit, req: d.req, st, locked: skillLevel(s, k) === 0 }; }); }
  function advList(s) { return Object.keys(ADV).map(k => ({ k, n: ADV[k].n, cat: ADV[k].cat, d: ADV[k].d, cost: ADV[k].cost, st: advState(s, k), prac: ADV[k].prac })); }
  function takeNotes(s) { const o = s.skillNotes || []; s.skillNotes = []; return o; }
  function boutureCheck(s, i) {
    const c = s.grid[i]; if (!c || c.treille) return { ok: false, msg: 'Choisis une plante.' }; const lv = skillLevel(s, 'bouture'); if (lv < 1) return { ok: false, msg: 'Débloque la compétence Bouture dans « Mon jardinier ».' };
    const p = P[c.pid]; if (!['vivace', 'continue'].includes(p.kind) || p.strate === 'Arbre') return { ok: false, msg: p.name + ' ne se bouture pas (annuelle ou arbre : essaie la greffe pour les arbres).' };
    const st = phase(c).stage; if (st === 'graine' || st === 'pousse') return { ok: false, msg: 'Trop jeune : attends qu’elle ait grandi.' };
    const gap = [0, 45, 30, 20][lv], left = gap - (s.day - (c.cutDay == null ? -999 : c.cutDay)); if (left > 0) return { ok: false, msg: 'Elle se remet de la dernière bouture : encore ' + left + ' jours.' };
    return { ok: true, lv };
  }
  function bouturer(s, i) { const ck = boutureCheck(s, i); if (!ck.ok) return ck; const c = s.grid[i], p = P[c.pid], n = ck.lv >= 3 ? 2 : 1; c.cutDay = s.day; c.health = Math.max(40, c.health - 6); s.cards[p.id] = (s.cards[p.id] || 0) + n; log(s, 'good', 'Bouture de ' + p.name.toLowerCase() + ' : +' + n + ' carte' + (n > 1 ? 's' : '') + '.'); gainSkill(s, 'bouture', 3); bump(s, 'bouture'); return { ok: true, n, name: p.name }; }
  function craft(s, k) {
    const r = RECIPES[k]; if (!r) return { ok: false, msg: 'Recette inconnue.' }; const lv = skillLevel(s, 'fabrication');
    if (lv < r.lvl) return { ok: false, msg: lv < 1 ? 'Compétence Fabrication : disponible après ' + SKILLS.fabrication.req + ' plantations.' : 'Il faut le niveau ' + r.lvl + ' en Fabrication.' };
    if (k === 'cuve' && (s.cuves || 0) + (s.mats.cuve || 0) >= 4) return { ok: false, msg: 'Tu as déjà 4 cuves.' };
    for (const m of ['paillage', 'compost']) if ((r[m] || 0) > (s.mats[m] || 0)) return { ok: false, msg: 'Il te manque du ' + m + '.' };
    for (const m of ['paillage', 'compost']) s.mats[m] -= r[m] || 0; s.mats[k] = (s.mats[k] || 0) + 1; log(s, 'good', 'Fabriqué : ' + k + '.'); gainSkill(s, 'fabrication', 2); bump(s, 'fab'); return { ok: true };
  }
  function greffeCheck(s, i) {
    const c = s.grid[i]; if (!c || c.treille) return { ok: false, msg: 'Choisis un arbre ou un arbuste.' }; const lv = skillLevel(s, 'greffe'); if (lv < 1) return { ok: false, msg: 'Débloque la compétence Greffe dans « Mon jardinier ».' };
    const p = P[c.pid]; if (!['Arbre', 'Arbuste'].includes(p.strate) || !(p.kg > 0)) return { ok: false, msg: 'On greffe un arbre ou un arbuste fruitier.' };
    if (c.grafted) return { ok: false, msg: 'Déjà greffé.' }; if (!(s.mats.compost > 0)) return { ok: false, msg: 'Il faut 1 compost pour souder la greffe.' };
    return { ok: true, lv };
  }
  function greffer(s, i) { const ck = greffeCheck(s, i); if (!ck.ok) return ck; const c = s.grid[i], p = P[c.pid]; s.mats.compost--; c.grafted = ck.lv; c.g = Math.min(maturity(p), c.g + maturity(p) * [0, .15, .25, .35][ck.lv]); log(s, 'good', p.name + ' greffé : plus de fruits, et plus vite.'); gainSkill(s, 'greffe', 4); bump(s, 'greffe'); return { ok: true, name: p.name }; }
  function useSavoir(s) { if (!(s.mats.savoir > 0)) return { ok: false, msg: 'Plus de carte Savoir.' }; s.mats.savoir--; return { ok: true, r: learn(s) }; }
  function preserve(s, pid, kind) {
    if (!s.atelier) return { ok: false, msg: 'Construis d’abord l’atelier.' };
    const JK = JARKG[Math.max(1, skillLevel(s, 'transformation'))], DC = DRYCAP[Math.max(1, skillLevel(s, 'sechage'))];
    const fresh = s.stock.filter(it => it.pid === pid && !it.keep), tot = fresh.reduce((a, b) => a + b.kg, 0); if (tot <= 0.004) return { ok: false, msg: 'Rien de frais à transformer.' };
    let kg = tot, jars = 0;
    if (kind === 'bocal') { jars = Math.min(s.mats.bocaux || 0, Math.ceil(tot / JK - 1e-9)); if (jars <= 0) return { ok: false, msg: 'Plus de bocaux : joue une carte Bocaux.' }; kg = Math.min(tot, jars * JK); jars = Math.ceil(kg / JK - 1e-9); s.mats.bocaux -= jars; }
    else { if (!s.sechoir) return { ok: false, msg: 'Installe d’abord le séchoir.' }; const used = s.dryDay === s.day ? s.dryKg : 0, left = DC - used; if (left <= 0.004) return { ok: false, msg: 'Le séchoir est plein pour aujourd’hui (' + DC + ' kg par jour).' }; kg = Math.min(tot, left); s.dryDay = s.day; s.dryKg = r2(used + kg); }
    kg = r2(kg); let need = kg; for (const it of fresh.sort((a, b) => a.day - b.day)) { if (need <= 0) break; const t = Math.min(it.kg, need); it.kg = r2(it.kg - t); need = r2(need - t); }
    s.stock = s.stock.filter(it => it.kg > 0.004); s.stock.push({ pid, kg, day: s.day, keep: kind === 'bocal' ? 'bocal' : 'sec' });
    log(s, 'good', (kind === 'bocal' ? 'Mise en bocaux : ' : 'Séchage : ') + kg.toFixed(2).replace('.', ',') + ' kg de ' + P[pid].name.toLowerCase() + ' (se garde longtemps).'); gainSkill(s, kind === 'bocal' ? 'transformation' : 'sechage', 2); bump(s, 'preserve'); return { ok: true, kg, jars, name: P[pid].name };
  }
  function guildPlan(s) {
    if (!(s.mats.plan > 0)) return { ok: false, msg: 'Plus de plan de guilde.' };
    let best = null; const m = dateOf(s.day).m;
    s.grid.forEach((c, i) => {
      if (!c || c.treille || P[c.pid].strate !== 'Arbre') return; const st = new Set(), sp = new Set(); let az = P[c.pid].tags.includes('azote'), po = false, free = [];
      for (const j of neigh(i)) { const n = s.grid[j]; if (!n) { if (isActive(s, j)) free.push(j); continue; } if (n.treille) continue; const q = P[n.pid]; if (GSTR.includes(q.strate) && q.id !== c.pid) { st.add(q.strate); sp.add(q.id); if (q.tags.includes('azote')) az = true; if (q.tags.includes('mellifere') || q.tags.includes('repulsif')) po = true; } }
      const done = st.size >= 4 && sp.size >= 5, score = (done ? -50 : 0) + st.size * 4 + sp.size + Math.min(free.length, 4) * 1.5; if (!best || score > best.score) best = { score, i, st, sp, az, po, free, done };
    });
    if (!best) { s.mats.plan--; bump(s); return { ok: true, noTree: true, trees: P.filter(p => p.strate === 'Arbre' && p.kg > 0 && sowable(p, m) && p.id < CORE).slice(0, 4).map(p => p.name) }; }
    s.mats.plan--; bump(s);
    const missing = GSTR.filter(x => !best.st.has(x)), owned = Object.keys(s.cards).map(Number), sug = {};
    missing.forEach(st => { const mine = owned.map(id => P[id]).filter(p => p.strate === st).slice(0, 2).map(p => p.name + ' (dans ta réserve)'); const more = P.filter(p => p.strate === st && p.id < CORE && p.rarete !== 'Rare' && sowable(p, m)).slice(0, 3).map(p => p.name); sug[st] = mine.concat(more).slice(0, 3); });
    return { ok: true, center: best.i, name: P[s.grid[best.i].pid].name, have: [...best.st], missing, speciesHave: best.sp.size, needStrata: Math.max(0, 4 - best.st.size), needSpecies: Math.max(0, 5 - best.sp.size), azote: best.az, pollin: best.po, free: best.free, suggest: sug, done: best.done };
  }

  // ----- Guildéon : objectifs, guildes, bonus -----
  const GSTR = ['Arbuste', 'Herbacée', 'Racine', 'Grimpante', 'Couvre-sol'];
  function guildAt(s, i) {
    const c = s.grid[i]; if (!c || c.treille) return null; const p = P[c.pid]; if (p.strate !== 'Arbre') return null;
    const st = new Set(), sp = new Set(); let az = false, po = false, pr = false;
    for (const j of neigh(i)) { const n = s.grid[j]; if (!n || n.treille) continue; const q = P[n.pid]; if (GSTR.includes(q.strate) && q.id !== p.id) { st.add(q.strate); sp.add(q.id); if (q.tags.includes('azote')) az = true; if (q.tags.includes('mellifere')) po = true; if (q.tags.includes('repulsif')) pr = true; } }
    if (p.tags.includes('azote')) az = true;
    return st.size >= 4 && sp.size >= 5 ? { strata: st.size, species: sp.size, auto: az && (po || pr) } : null;
  }
  function guilds(s) { let n = 0, auto = 0; const ids = []; s.grid.forEach((c, i) => { const g = guildAt(s, i); if (g) { n++; if (g.auto) auto++; ids.push(i); } }); return { n, auto, ids }; }
  function guildOf(s, i) { let best = null; const g0 = guildAt(s, i); if (g0) best = { c: i, auto: g0.auto }; for (const j of neigh(i)) { const g = guildAt(s, j); if (g && (!best || (g.auto && !best.auto))) best = { c: j, auto: g.auto }; } return best; }
  function nSpecies(s) { return new Set(s.grid.filter(c => c && !c.treille).map(c => c.pid)).size; }
  const GQ = [
    { id: 'booster', t: 'Ouvre 3 boosters', say: 'Ouvre tes boosters : cinq cartes t’attendent chaque semaine (tous les trois jours au début). Ouvres-en trois.', need: 3, have: s => s.boosters, rw: { paillage: 2 } },
    { id: 'hiver', t: 'Prépare l’hiver', say: 'Le froid arrive. Voici trois voiles d’hivernage : quand un gel est annoncé, touche « Protéger » et le jardinier les pose sur les plantes fragiles. Plante 8 cartes pour les recevoir.', need: 8, have: s => s.maxPlantings, rw: { voile: 3 } },
    { id: 'herbier1', t: 'Premier herbier', say: 'Chaque espèce plantée entre dans ton herbier. Plante 12 espèces différentes : tes plantes poussent plus vite pendant quelques jours.', need: 12, have: s => Object.keys((s.skills && s.skills.species) || {}).length, rw: { boost: 3 } },
    { id: 'rare1', t: 'Une plante rare', say: 'Certaines plantes sont rares ou oubliées. Plante-en une pour recevoir du compost et un peu de paillage.', need: 1, have: s => Object.keys((s.skills && s.skills.species) || {}).filter(k => P[k] && P[k].rarete === 'Rare').length, rw: { compost: 3, paillage: 3 } },
    { id: 'herbier2', t: 'Herbier de 40 espèces', say: 'Quarante espèces différentes plantées : ton jardin devient une vraie collection. Compost et croissance accélérée à la clé.', need: 40, have: s => Object.keys((s.skills && s.skills.species) || {}).length, rw: { boost: 5, compost: 3 } },
    { id: 'sentier0', t: 'Découvre les sentiers', say: 'Une plante loin du bord, sans sentier, se piétine à chaque soin. Voici 6 tronçons : touche « Chemin », puis glisse depuis le bord du jardin. Plante 10 cartes pour les recevoir.', need: 10, have: s => s.maxPlantings, rw: { chemin: 6 } },
    { id: 'sentier1', t: 'Trace ton premier sentier', say: 'Trace 6 tronçons reliés au bord du jardin : les plantes qu’il longe se soignent sans piétiner le sol, et la famille aime se promener.', need: 6, have: s => pathLinkedEdges(s).length, rw: { boost: 5, compost: 2 } },
    { id: 'p3', t: 'Plante 6 cartes', say: 'Pose 6 plantes dans ta forêt. Une graine en terre, c’est déjà un jardin.', need: 6, have: s => s.maxPlantings, rw: { compost: 1 } },
    { id: 'eau3', t: 'Arrose 10 plantes', say: 'Elles ont soif ! Arrose 10 plantes au total, la goutte bleue te montre lesquelles.', need: 10, have: s => (s.gq.cnt.water || 0), rw: { boost: 3 } },
    { id: 'cuve1', t: 'Récupère la pluie', say: 'L’été, la réserve d’eau se vide vite. Voici une cuve de récupération : joue-la depuis ton matériel pour agrandir ta réserve de 150 L. Atteins 14 plantations pour la recevoir.', need: 14, have: s => s.maxPlantings, rw: { cuve: 1 } },
    { id: 'guilde1', t: 'Plante ta première guilde', say: 'Plante une guilde : un arbre entouré d’au moins 5 plantes d’espèces différentes couvrant 4 strates (arbuste, herbacée, racine, grimpante, couvre-sol). Je te donne un bonus de croissance !', need: 1, have: s => guilds(s).n, rw: { boost: 7, paillage: 3 } },
    { id: 'rec3', t: 'Récolte 8 fois', say: 'Un panier orange sur une plante : c’est prêt ! Récolte 8 fois.', need: 8, have: s => (s.gq.cnt.harvest || 0), rw: { compost: 1 } },
    { id: 'repas1', t: 'Cuisine 3 repas', say: 'Direction le garde-manger : cuisine trois repas de ta forêt pour ta famille.', need: 3, have: s => s.meals, rw: { paillage: 2 } },
    { id: 'paille3', t: 'Paille 8 plantes', say: 'La paille garde l’eau et nourrit le sol. Paille 8 plantes.', need: 8, have: s => (s.gq.cnt.mulch || 0), rw: { boost: 3 } },
    { id: 'atelier1', t: 'Construis ton atelier', say: 'Un atelier près de la maison : tu y feras tes conserves et ton séchage. Joue une carte Atelier !', need: 1, have: s => s.atelier ? 1 : 0, rw: { boost: 5, compost: 2 } },
    { id: 'conserve1', t: 'Fais 3 conserves', say: 'L’hiver, rien ne pousse : mets une récolte en bocal ou fais-la sécher dans ton atelier.', need: 3, have: s => (s.gq.cnt.preserve || 0), rw: { paillage: 3, boost: 5 } },
    { id: 'soin1', t: 'Soigne tes plantes 3 fois avec un purin', say: 'Purin d’ortie, prêle, oya, nichoir : un soin naturel protège plusieurs plantes à la fois.', need: 3, have: s => (s.gq.cnt.soin || 0), rw: { compost: 2, boost: 3 } },
    { id: 'bouture1', t: 'Prélève 2 boutures', say: 'Une bouture, c’est une plante gratuite ! Ouvre les Compétences, choisis Bouture et touche une vivace mature.', need: 2, have: s => (s.gq.cnt.bouture || 0), rw: { boost: 3, compost: 1 } },
    { id: 'fab1', t: 'Fabrique ton premier soin', say: 'Avec du paillage et du compost, tu peux fabriquer ton propre purin d’ortie : ouvre les Compétences, onglet Fabrication.', need: 1, have: s => (s.gq.cnt.fab || 0), rw: { boost: 3, paillage: 2 } },
    { id: 'boutique1', t: 'Fais un achat à la boutique', say: 'Tu as des ginkgos ! À la boutique, tu peux t’offrir un meuble ou un bâtiment pour ton jardin.', need: 1, have: s => (s.gq.cnt.shop || 0), rw: { boost: 3 } },
    { id: 'sp6', t: '9 espèces différentes', say: 'Plus c’est varié, plus c’est résistant. Plante 9 espèces différentes.', need: 9, have: s => nSpecies(s), rw: { compost: 2 } },
    { id: 'tonte1', t: 'Tonds 5 zones d’herbe', say: 'L’herbe haute autour du jardin ? Tonds-la, tu récupères du paillage.', need: 5, have: s => (s.gq.cnt.mow || 0), rw: { paillage: 2 } },
    { id: 'p12', t: 'Atteins 20 plantations', say: 'Ta forêt grandit ! Continue jusqu’à 20 plantations.', need: 20, have: s => s.maxPlantings, rw: { boost: 5 } },
    { id: 'guilde2', t: 'Deux guildes', say: 'Une deuxième guilde ! Elles se protègent entre elles.', need: 2, have: s => guilds(s).n, rw: { boost: 10, compost: 2 } },
    { id: 'auto25', t: 'Autonomie à 30 %', say: 'Plus ta forêt produit et plus tes guildes sont autonomes, plus tu es autonome. Vise 30 %.', need: 30, have: s => Math.floor(stats(s).autonomy), rw: { boost: 7, compost: 2 } },
    { id: 'trogne1', t: 'Taille une trogne', say: 'Ouvre les Compétences, choisis Trognes, puis touche un arbre au bord du jardin pour le tailler en têtard, et coupe-le ensuite : paillage et pousse accélérée.', need: 1, have: s => (s.gq.cnt.trogne || 0), rw: { paillage: 4 } },
    { id: 'repas5', t: 'Cuisine 15 repas', say: 'Ta famille compte sur toi : 15 repas au total.', need: 15, have: s => s.meals, rw: { boost: 5 } },
    { id: 'miel1', t: 'Récolte du miel', say: 'Les abeilles ont travaillé ! Récolte le miel de la ruche (de mai à septembre).', need: 1, have: s => (s.gq.cnt.honey || 0), rw: { boost: 5, paillage: 2 } },
    { id: 'sp12', t: '18 espèces différentes', say: 'Une vraie forêt, c’est de la diversité : 18 espèces.', need: 18, have: s => nSpecies(s), rw: { compost: 3 } },
    { id: 'auto50', t: 'Autonomie à 60 %', say: 'Plus de la moitié de tes besoins couverts par ton jardin : c’est énorme. Vise 60 %.', need: 60, have: s => Math.floor(stats(s).autonomy), rw: { boost: 14, paillage: 5 } },
    { id: 'guilde4', t: 'Quatre guildes', say: 'Quatre guildes, bravo ! Tu penses comme une forêt.', need: 4, have: s => guilds(s).n, rw: { boost: 14, paillage: 4 } },
    { id: 'p30', t: 'Atteins 50 plantations', say: 'Ta forêt devient un vrai jardin-forêt. Cap sur 50 plantations.', need: 50, have: s => s.maxPlantings, rw: { boost: 10, compost: 3 } }
  ];
  const DAILY = [
    { k: 'water', t: 'Arrose 8 plantes aujourd’hui', say: 'Défi du jour : arrose 8 plantes.', need: 8, rw: { paillage: 1 } },
    { k: 'harvest', t: 'Récolte 4 fois aujourd’hui', say: 'Défi du jour : récolte 4 fois.', need: 4, rw: { compost: 1 } },
    { k: 'mulch', t: 'Paille 4 plantes aujourd’hui', say: 'Défi du jour : paille 4 plantes.', need: 4, rw: { boost: 2 } }
  ];
  function rwLabel(rw) { const o = []; if (rw.paillage) o.push(rw.paillage + ' paillage'); if (rw.compost) o.push(rw.compost + ' compost'); if (rw.boost) o.push('croissance accélérée ' + rw.boost + ' j'); if (rw.eau) o.push(rw.eau + ' L d’eau'); if (rw.voile) o.push(rw.voile + ' voiles d’hivernage'); if (rw.chemin) o.push(rw.chemin + ' tronçons de sentier'); if (rw.cuve) o.push('une cuve de récupération'); return o.join(' + '); }
  function quests(s) {
    gqInit(s); const out = [];
    for (const q of GQ) { const have = Math.min(q.need, q.have(s)), done = have >= q.need, claimed = !!s.gq.claimed[q.id]; out.push({ id: q.id, t: q.t, say: q.say, have, need: q.need, done, claimed, rw: q.rw, label: rwLabel(q.rw), daily: false }); }
    let di = s.day % DAILY.length; if (DAILY[di].k === 'mulch' && !(s.mats.paillage > 0) && !(s.gq.dc.day === s.day && s.gq.dc.mulch)) di = 0;
    const d = DAILY[di], dc = s.gq.dc.day === s.day ? (s.gq.dc[d.k] || 0) : 0, did = 'j' + s.day;
    if (s.day % 3 === 0 || dc > 0 || s.gq.claimed[did]) out.push({ id: did, t: d.t, say: d.say, have: Math.min(d.need, dc), need: d.need, done: dc >= d.need, claimed: !!s.gq.claimed[did], rw: d.rw, label: rwLabel(d.rw), daily: true });
    out.forEach(q => { q.fv = q.daily ? 1 : Math.max(2, Math.round(2 + ((q.rw && q.rw.boost) || 0) * .3)); q.label = (q.label ? q.label + ' + ' : '') + q.fv + ' ginkgos'; });
    return out;
  }
  function claimQuest(s, id) {
    const q = quests(s).find(x => x.id === id); if (!q || !q.done || q.claimed) return { ok: false }; gainXp(s, 40);
    s.gq.claimed[id] = s.day + 1;
    for (const k of ['paillage', 'compost']) if (q.rw[k]) s.mats[k] = (s.mats[k] || 0) + q.rw[k];
    if (q.rw.eau) s.tank = Math.min(s.tankMax, s.tank + q.rw.eau);
    if (q.rw.voile) s.mats.voile = (s.mats.voile || 0) + q.rw.voile; if (q.rw.chemin) s.mats.chemin = (s.mats.chemin || 0) + q.rw.chemin; if (q.rw.cuve) s.mats.cuve = (s.mats.cuve || 0) + q.rw.cuve;
    s.feves = (s.feves || 0) + q.fv;
    if (q.rw.boost) s.boostUntil = Math.min(s.day + 60, Math.max(s.boostUntil, s.day) + q.rw.boost);
    log(s, 'good', 'Guildéon : objectif « ' + q.t + ' » réussi. Bonus : ' + q.label + '.');
    return { ok: true, label: q.label, t: q.t };
  }
  function guildeon(s) {
    const qs = quests(s), ready = qs.filter(q => q.done && !q.claimed), open = qs.filter(q => !q.done && !q.daily), daily = qs.find(q => q.daily);
    let text, mood = 'talk';
    if (ready.length) { text = 'Bravo ! « ' + ready[0].t + ' » est réussi. Touche-moi pour récupérer ton bonus.'; mood = 'joy'; }
    else if (open.length) text = open[0].say;
    else if (daily && !daily.claimed) text = daily.say;
    else text = 'Ta forêt est belle. Reviens demain pour un nouveau défi !';
    return { text, mood, ready: ready.length, qs, guilds: guilds(s).n, boost: Math.max(0, s.boostUntil - s.day) };
  }

  return { XPM, gainXp, levelOf, xpNeed, xpInfo, skillState, skillUp, advList, advUp, advState, hasAdv, ADV, queuePlant, cancelPlant, finishPlant, flushPlantQueue, plantSpeed, useVoile, forecastInfo, buildPoulailler, henInfo, compostInfo, SKILLS, RECIPES, skillLevel, skillList, boutureCheck, bouturer, craft, greffeCheck, greffer, takeNotes, SHOP, RECYCLE, shopInfo, shopBuy, recycleCards, recycleDoubles, recycleValue, hamacOk, useOrtie, usePrele, placeNichoir, useOya, useMycor, useCuve, buildAtelier, installSechoir, useSavoir, preserve, guildPlan, hasGS, isExo, MAT_UNLOCK, guildOf, moveCheck, movePlant, guilds, guildAt, quests, claimQuest, guildeon, P, byName, COLS, ROWS, NCELL, MONTHS, newGame, demo, nextDay, skip, plant, placeTreille, mulch, compost, remove, waterCells, harvest, mow, openBooster, cook, learn, tips,
    buildTasks, runTask, isWoody, waterSave, synergy, gshare, boosterReady, boosterIn, recycleLeft, protectFrost, discover, placeFurn, pathEdgeOk, pathLinked, pathLinkedEdges, pathAccess, addPath, removePath, pathJoy, pk, pparse, honeyReady, honeyKg, harvestHoney, placeDuck, duckNear, resistance, heal, fixSave, lawnReady, mowLawn, treeReady, formTrogne, cutTrogne, LAWN_N, TREE_N, LAWN_DAYS, TREE_DAYS, prune, needsPrune, defaultFamily, famNeed, FURN, FURN_UNLOCK, MAT_QTY, dims, isActive, canExpand, expand, SIZES, SIZE_REQ, MILESTONES, phase, ready, yieldKg, stats, stockTotals, unlocked, sowable, inWindow, monthRange, dateOf, weather, neigh, waterCost, mowReady, UNLOCK, NEED_KCAL, SAVE_VERSION };
}
const api = { make, MONTHS, COLS, ROWS };
if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Engine = api;
})(typeof window !== 'undefined' ? window : globalThis);

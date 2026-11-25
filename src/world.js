// Monde multi-parcelles (fiche Notion 51). NON intégré au jeu : module autonome, non inclus dans le build.
// Fonctions pures : aucune lecture/écriture de localStorage ni de Supabase.
(function (root) {
'use strict';
const WORLD_VERSION = 2, MAX_PARCELS = 10, UNLOCK_PCT = 0.8, COLS = 16;
const SIZES = [[8, 6], [10, 8], [12, 10], [14, 12], [16, 14]];   // copie de engine.js (à exporter du moteur à l'intégration)
const TYPES = ['balcon', 'petit', 'grand'];                       // balcon = taille 0, petit jardin = 1–2, grand jardin = 3–4
// Ce que le jardinier porte d'une parcelle à l'autre (partagé par référence) ou en valeur (recopié).
const SHARED_OBJ = ['cards', 'mats', 'knowledge', 'skills', 'stock', 'eaten', 'rewarded', 'gq', 'disc', 'skillNotes', 'doneToday'];
const SHARED_VAL = ['xp', 'pts', 'ptsSpent', 'plantings', 'maxPlantings', 'boosters', 'boosterDay', 'cookedDay', 'learnedDay', 'meals'];
const clone = o => JSON.parse(JSON.stringify(o));
const typeOfSize = z => z === 0 ? 'balcon' : z <= 2 ? 'petit' : 'grand';

// Ancienne sauvegarde (un seul jardin) -> monde. L'original n'est jamais modifié.
function fromSingle(S1) {
  const S = clone(S1), shared = { vals: {} };
  SHARED_OBJ.forEach(k => { if (k in S) { shared[k] = S[k]; delete S[k]; } });
  SHARED_VAL.forEach(k => { if (k in S) { shared.vals[k] = S[k]; delete S[k]; } });
  const day = S.day || 0;
  return { v: WORLD_VERSION, day, gardener: { first: '', last: '' }, shared, active: 'p1',
    parcels: [{ id: 'p1', type: typeOfSize(S.size || 0), state: 'open', S }] };
}

// Jardin de travail pour le moteur : champs partagés = mêmes objets que W.shared.
function compose(W, id) {
  const p = W.parcels.find(q => q.id === id); if (!p) return null;
  const S = Object.assign({}, p.S);
  SHARED_OBJ.forEach(k => { if (k in W.shared) S[k] = W.shared[k]; });
  SHARED_VAL.forEach(k => { if (k in W.shared.vals) S[k] = W.shared.vals[k]; });
  S.day = W.day;
  return S;
}
// Recopie du jardin de travail dans le monde (après un appel au moteur).
function writeBack(W, id, S) {
  const p = W.parcels.find(q => q.id === id), own = Object.assign({}, S);
  SHARED_OBJ.forEach(k => { if (k in own) { W.shared[k] = own[k]; delete own[k]; } });
  SHARED_VAL.forEach(k => { if (k in own) { W.shared.vals[k] = own[k]; delete own[k]; } });
  delete own.day; p.S = own;
}
function withParcel(W, id, fn) { const S = compose(W, id); if (!S) return undefined; const r = fn(S); writeBack(W, id, S); return r; }

// Retour à un jardin unique (export / contrôle d'aller-retour).
function toSingle(W, id) { const S = compose(W, id); return clone(S); }

function activeCells(S) { const d = SIZES[S.size || 0]; return d[0] * d[1]; }
function pct(S) {
  const d = SIZES[S.size || 0]; let n = 0;
  for (let i = 0; i < S.grid.length; i++) if (S.grid[i] && (i % COLS) < d[0] && ((i / COLS) | 0) < d[1]) n++;
  return n / (d[0] * d[1]);
}

// Ouvre la parcelle suivante quand une parcelle ouverte atteint 80 %. Renvoie l'id ouvert ou null.
function updateUnlocks(W) {
  const planted = W.parcels.filter(p => p.state !== 'locked' && pct(p.S) >= UNLOCK_PCT);
  planted.forEach(p => { if (p.state === 'open') p.state = 'planted'; });
  const hasLocked = W.parcels.find(p => p.state === 'locked');
  const allOpenPlanted = W.parcels.filter(p => p.state !== 'locked').every(p => p.state === 'planted');
  if (hasLocked && allOpenPlanted) { hasLocked.state = 'open'; return hasLocked.id; }
  return null;
}
// Ajoute une parcelle verrouillée (max 10). `fresh` = jardin vide fourni par le moteur (G.newGame()).
function addParcel(W, type, size, fresh) {
  if (W.parcels.length >= MAX_PARCELS) return null;
  const id = 'p' + (W.parcels.length + 1), S = clone(fresh);
  SHARED_OBJ.concat(SHARED_VAL).forEach(k => delete S[k]);
  S.size = size; S.day = W.day;
  W.parcels.push({ id, type: type || typeOfSize(size), state: 'locked', S });
  return id;
}
// Faune : niveau croissant avec le nombre de parcelles plantées (0 = ville sans vie).
function faunaLevel(W) { return W.parcels.filter(p => p.state === 'planted').length; }

// Jour suivant pour toutes les parcelles ouvertes (une seule horloge). `nextDay(S)` vient du moteur.
function nextDayAll(W, nextDay) {
  W.day++;
  W.parcels.forEach(p => { if (p.state !== 'locked') withParcel(W, p.id, S => { S.day = W.day - 1; nextDay(S); W.day = S.day; }); });
  updateUnlocks(W);
}
const api = { WORLD_VERSION, MAX_PARCELS, UNLOCK_PCT, SHARED_OBJ, SHARED_VAL, fromSingle, compose, writeBack, withParcel, toSingle, pct, activeCells, updateUnlocks, addParcel, faunaLevel, nextDayAll, typeOfSize };
if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.World = api;
})(typeof window !== 'undefined' ? window : globalThis);

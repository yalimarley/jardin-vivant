// Tests de world.js (non intégré). Lancer depuis un dossier contenant plants2.json : node test_world.js
const fs = require('fs'), path = require('path');
const E = require('./engine.js'), W0 = require('./world.js');
const P = JSON.parse(fs.readFileSync(fs.existsSync('./plants2.json') ? './plants2.json' : path.join(__dirname, '../data/plants2.json'), 'utf8'));
const G = E.make(P);
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('ECHEC:', m); } else console.log('ok  :', m); };
const sortK = o => Array.isArray(o) ? o.map(sortK) : o && typeof o === 'object' ? Object.keys(o).sort().reduce((r, k) => (r[k] = sortK(o[k]), r), {}) : o;
const J = o => JSON.stringify(sortK(o));   // égalité profonde, indépendante de l'ordre des clés

// 1. migration v1 -> monde, sans modifier l'original
const s0 = G.newGame(); G.demo(s0);
const snap = J(s0);
const W = W0.fromSingle(s0);
ok(J(s0) === snap, 'fromSingle ne modifie pas la sauvegarde d’origine');
ok(W.v === 2 && W.parcels.length === 1 && W.parcels[0].state === 'open', 'monde v2 : une parcelle ouverte');
ok(W.shared.cards === W.shared.cards && 'mats' in W.shared && !('cards' in W.parcels[0].S), 'cartes/matériaux partagés, absents de la parcelle');

// 2. aller-retour identique
ok(J(W0.toSingle(W, 'p1')) === snap, 'aller-retour v1 -> monde -> v1 identique');

// 3. même évolution que le jardin seul
const A = JSON.parse(snap), B = W0.fromSingle(A);
for (let i = 0; i < 20; i++) G.nextDay(A);
for (let i = 0; i < 20; i++) W0.nextDayAll(B, G.nextDay);
ok(B.day === A.day, 'horloge du monde = horloge du jardin seul (jour ' + B.day + ')');
ok(J(W0.toSingle(B, 'p1')) === J(A), '20 jours : monde identique au jardin seul');

// 4. pourcentage et déblocage
const E1 = G.newGame();
ok(W0.pct(E1) === 0, 'jardin vide : 0 %');
const W2 = W0.fromSingle(E1);
W0.addParcel(W2, 'petit', 1, G.newGame()); W0.addParcel(W2, 'grand', 4, G.newGame());
ok(W2.parcels.length === 3 && W2.parcels[1].state === 'locked', 'parcelles ajoutées verrouillées');
ok(W0.updateUnlocks(W2) === null, '0 % : rien ne s’ouvre');
const S1 = W2.parcels[0].S, d = [8, 6], cells = [];
for (let i = 0; i < S1.grid.length; i++) if ((i % 16) < d[0] && ((i / 16) | 0) < d[1]) cells.push(i);
const need = Math.ceil(cells.length * 0.8);
cells.slice(0, need - 1).forEach(i => { S1.grid[i] = { treille: true, furn: 'banc' }; });
ok(W0.pct(S1) < 0.8 && W0.updateUnlocks(W2) === null, 'sous 80 % : la suivante reste verrouillée');
S1.grid[cells[need - 1]] = { treille: true, furn: 'banc' };
ok(W0.pct(S1) >= 0.8, '80 % atteints : ' + W0.pct(S1).toFixed(2));
ok(W0.updateUnlocks(W2) === 'p2' && W2.parcels[0].state === 'planted' && W2.parcels[1].state === 'open', '80 % : p1 plantée, p2 ouverte');
ok(W0.faunaLevel(W2) === 1, 'faune niveau 1 avec une parcelle plantée');
ok(W0.updateUnlocks(W2) === null && W2.parcels[2].state === 'locked', 'p3 reste verrouillée tant que p2 < 80 %');

// 5. maximum 10 parcelles
const W3 = W0.fromSingle(G.newGame());
for (let i = 0; i < 12; i++) W0.addParcel(W3, 'petit', 1, G.newGame());
ok(W3.parcels.length === 10, 'maximum 10 parcelles');

// 6. objets partagés : un changement via une parcelle est vu par l'autre
const W4 = W0.fromSingle(G.newGame()); W0.addParcel(W4, 'petit', 1, G.newGame()); W4.parcels[1].state = 'open';
W0.withParcel(W4, 'p1', S => { S.mats.paillage += 5; S.xp = (S.xp || 0) + 10; });
const seen = W0.withParcel(W4, 'p2', S => [S.mats.paillage, S.xp]);
ok(seen[0] === G.newGame().mats.paillage + 5 && seen[1] === (G.newGame().xp || 0) + 10, 'matériaux et XP partagés entre parcelles');

// 7. sérialisation
ok(J(JSON.parse(J(W2))) === J(W2), 'le monde se sérialise sans perte');
console.log(fails ? fails + ' ÉCHEC(S)' : 'TOUS LES TESTS PASSENT'); process.exit(fails ? 1 : 0);

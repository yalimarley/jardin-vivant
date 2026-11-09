// Plantes retirées du jeu (retired:true) : jamais proposées, mais une ancienne sauvegarde qui les contient reste valide.
const fs = require('fs');
const E = require('./engine.js');
const P = JSON.parse(fs.readFileSync('./plants2.json', 'utf8'));
const G = E.make(P);
const RET = P.filter(p => p.retired).map(p => p.id);
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('ECHEC:', m); } else console.log('ok  :', m); };
ok(RET.length === 4 && [111, 112, 479, 561].every(i => RET.includes(i)), '4 plantes marquées retirées (111, 112, 479, 561)');
ok(P.every((p, i) => p.id === i), 'les identifiants restent égaux aux positions');
let seen = new Set(), n = 0;
for (let run = 0; run < 25; run++) {
  const s = G.newGame();
  for (let d = 0; d < 400; d++) { const c = G.openBooster(s); if (c) { n++; c.forEach(x => x.t === 'plant' && seen.add(x.pid)); } G.nextDay(s, true); }
}
ok(n > 200, 'boosters ouverts : ' + n);
ok(RET.every(i => !seen.has(i)), 'aucun booster ne propose une plante retirée');
const s = G.newGame();
s.cards[111] = 2; s.cards[479] = 1;
const idx = s.grid.findIndex(c => !c);
let threw = false;
try { G.plant(s, idx, 112); G.nextDay(s); G.nextDay(s); } catch (e) { threw = true; console.log(e.message); }
ok(!threw, 'une sauvegarde contenant des plantes retirées continue de fonctionner');
console.log(fails ? '\n' + fails + ' ÉCHEC(S)' : '\nTous les tests passent');
process.exit(fails ? 1 : 0);

const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const html = fs.readFileSync('jardin-vivant.html', 'utf8');
const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => errors.push('jsdomError: ' + (e.detail && e.detail.stack || e.message)));
vc.on('error', e => errors.push('console.error: ' + e));
const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://jv.example/', virtualConsole: vc, pretendToBeVisual: true });
const w = dom.window, d = w.document;
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('ECHEC:', m); } else console.log('ok  :', m); };
const click = el => el.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
const q = (s, r) => (r || d).querySelector(s), qa = (s, r) => [...(r || d).querySelectorAll(s)];

ok(qa('#garden .cell').length === 48, '48 parcelles dessinées (terrain de départ 8×6)');
ok(qa('#gauges .gauge').length === 3, '3 jauges');
ok(qa('#today .task').length >= 1, 'tâches affichées : ' + qa('#today .task b').map(x => x.textContent).join(' | '));
ok(/Hiver|Printemps|Été|Automne/.test(q('#when').textContent), 'date et saison : ' + q('#when').textContent.trim());

// booster
click(qa('#today .task').find(t => /booster/i.test(t.textContent)));
ok(q('#layer .modal'), 'fenêtre booster ouverte');
click(q('[data-act="rip"]'));
const fl = qa('.flipper');
ok(fl.length === 10, '10 cartes dans le booster');
click(q('[data-act="flipall"]'));
ok(qa('.flipper.up').length === 10, 'toutes retournées');
click(q('[data-act="close"]'));
ok(!q('#layer .modal'), 'fenêtre fermée');
ok(qa('#strip .card').length >= 3, 'cartes dans la réserve : ' + qa('#strip .card h4').map(x => x.textContent).join(', '));
ok(!qa('#today .task').some(t => /booster/i.test(t.textContent)), 'tâche booster disparue');

// planter
const card = q('#strip button.card');
click(card);
ok(q('#hint').textContent.includes('Choisis une parcelle libre'), 'mode plantation : ' + q('#hint').textContent.slice(0, 60));
const free = qa('#garden .cell.free')[0];
const before = qa('#garden .cell.free').length;
click(free);
ok(qa('#garden .cell.free').length === before - 1, 'plante posée sur une parcelle libre');
ok(q('#fiche h2').textContent.length > 0, 'fiche affichée : ' + q('#fiche h2').textContent);
// hors saison
// sélection d'une plante existante
click(qa('#garden .cell:not(.free)')[0]);
ok(q('#fiche .meters'), 'fiche avec jauges');
// passer des jours
click(q('[data-act="time"]'));
click(q('[data-act="skip"][data-n="30"]'));
ok(/novembre|décembre/.test(q('#when').textContent), 'avancé de 30 jours : ' + q('#when b').textContent);
// démo
click(q('[data-act="time"]'));
click(q('[data-act="demo"]'));
ok(/juillet 2027/.test(q('#when').textContent), 'démo juillet 2027');
ok(qa('#garden .badge[data-badge="harvest"]').length >= 5, 'badges de récolte : ' + qa('#garden .badge[data-badge="harvest"]').length);
// fiche d'un arbre avec voisins
const cell = qa('#garden .cell')[1];
click(cell);
ok(qa('#fiche .notes li').length >= 1, 'notes de voisinage : ' + qa('#fiche .notes li').length);
ok(qa('#garden path[stroke-dasharray]').length >= 1, 'lignes de synergie dessinées');
// tâche récolte
const harv = qa('#today .task').find(t => /Récolter/.test(t.textContent));
ok(harv, 'tâche de récolte présente');
click(harv);
// cuisine
click(q('[data-act="kitchen"]'));
const boxes = qa('#kit input');
ok(boxes.length >= 2, 'ingrédients en cuisine : ' + boxes.length);
boxes[0].checked = true; boxes[1].checked = true; boxes[0].dispatchEvent(new w.Event('change', { bubbles: true }));
ok(!q('#cookBtn').disabled, 'bouton cuisiner activé');
click(q('#cookBtn'));
ok(q('.sum .nm') && /kcal/.test(q('.sum').textContent), 'repas cuisiné : ' + q('.sum .nm').textContent);
click(q('[data-act="close"]'));
// savoir du jour
const learn = qa('#today .task').find(t => /Savoir/.test(t.textContent));
if (learn) { click(learn); ok(q('#layer .modal h2').textContent === 'Savoir du jour', 'savoir du jour ouvert'); click(q('[data-act="close"]')); }
// message de fin de journée : tout faire
for (let k = 0; k < 8; k++) {
  const t = qa('#today .task.p0, #today .task.p1')[0]; if (!t) break;
  click(t); if (q('[data-act="rip"]')) click(q('[data-act="rip"]')); if (q('#layer .modal')) { if (q('#kit')) { const b = qa('#kit input'); b.slice(0, 2).forEach(x => x.checked = true); b[0].dispatchEvent(new w.Event('change', { bubbles: true })); click(q('#cookBtn')); } click(q('[data-act="close"]')); }
}
ok(q('#today .done-box'), 'message « Ton jardin est à jour » affiché (restent : ' + qa('#today .task.p0 b, #today .task.p1 b').map(x => x.textContent).join(' | ') + ')');
click(q('#today [data-act="next"]'));
ok(/13 juillet/.test(q('#when').textContent), 'lendemain atteint : ' + q('#when b').textContent);
// herbier
click(q('[data-act="herbier"]'));
ok(qa('.hrow').length === 60, 'herbier : 60 lignes affichées, ' + q('#hcount').textContent);
const hq = q('#hq'); hq.value = 'noisetier'; hq.dispatchEvent(new w.Event('input', { bubbles: true }));
ok(qa('.hrow').length >= 1 && /oisetier/i.test(q('.hrow b').textContent), 'recherche herbier : ' + qa('.hrow b').map(x => x.textContent).slice(0, 4).join(', '));
click(q('.hrow')); ok(q('#layer .modal'), 'fiche herbier ouverte : ' + q('#layer .modal h2').textContent);
click(q('[data-act="close"]'));
const hp = q('[data-act="herbier"]'); click(hp); q('#hplay').checked = true; q('#hplay').dispatchEvent(new w.Event('input', { bubbles: true }));
ok(/^\d+ fiche/.test(q('#hcount').textContent) && parseInt(q('#hcount').textContent) < 700, 'filtre jouables : ' + q('#hcount').textContent);
click(q('[data-act="close"]'));
// mobilier et personnages
ok(qa('#garden .chr').length === 4, 'jardinier, chien et deux membres de la famille présents : ' + qa('#garden .chr').map(x => x.dataset.who).join(','));
click(q('[data-act="time"]')); click(q('[data-act="newgame"]'));
ok(q('[data-act="mode-mat"][data-k="chemin"]') && !q('[data-act="mode-mat"][data-k="mare"]'), 'pastille chemin visible, mare cachée au départ');
click(q('[data-act="mode-mat"][data-k="chemin"]'));
const fcell = qa('#garden .cell.free')[10]; click(fcell);
ok(q('#fiche h2').textContent === 'Chemin', 'chemin posé : fiche ' + q('#fiche h2').textContent);
ok(/Chemin 2/.test(q('#res').textContent), 'stock de chemin décrémenté : ' + q('#res').textContent.match(/Chemin \d/));
click(q('[data-act="remove"]')); click(q('[data-act="remove"]'));
ok(/Chemin 3/.test(q('#res').textContent), 'chemin repris en main');
// Guildéon
ok(q('#gmasc') && q('#gsay'), 'Guildéon présent');
click(q('#gmasc')); ok(!q('#gcard').hidden && qa('#gcard .gq').length >= 2, 'panneau Guildéon : objectifs listés');
click(q('#gmasc')); ok(q('#gcard').hidden, 'panneau Guildéon fermé');
// strates
ok(new Set(qa('#garden .cell:not(.free) polygon').map(e => e.getAttribute('fill')).filter(Boolean)).size >= 3, 'cases teintées selon la strate');
click(q('[data-act="strate-menu"]')); ok(!q('#strmenu').hidden && qa('#strmenu .sch').length === 7, 'menu strates');
click(q('[data-act="strate-set"][data-s="Arbre"]')); ok(qa('#garden .spr.dim').length >= 1, 'filtre strate grise les autres');
click(q('[data-act="strate-set"][data-s=""]')); ok(qa('#garden .spr.dim').length === 0, 'filtre retiré');
click(q('[data-act="strate-menu"]'));
// boîte à outils
ok(qa('#tools .tb').length === 9, 'boîte à outils : 9 boutons');
const vb0 = q('#garden').getAttribute('viewBox'); click(q('[data-act="zoom-in"]'));
ok(q('#garden').getAttribute('viewBox') !== vb0, 'zoom change la vue');
for (let k = 0; k < 4; k++) { click(q('[data-act="rot-r"]')); ok(qa('#garden .cell').length === 48, 'rotation ' + (k + 1) + ' : 48 cases'); }
click(q('[data-act="view-reset"]'));
click(q('[data-tool="delete"]'));
const nb = qa('#garden .cell:not(.free)').length; const tgt = qa('#garden .cell:not(.free)')[0];
if (tgt) { click(tgt); ok(qa('#garden .cell.delp').length === 1, 'suppression : 1er toucher = confirmation'); click(qa('#garden .cell.delp')[0]); ok(qa('#garden .cell:not(.free)').length === nb - 1, 'suppression : 2e toucher supprime'); }
click(q('[data-tool="select"]'));
ok(qa('#garden .chr').length === 4, 'personnages toujours là après rendu');
// sauvegarde
ok(w.localStorage.getItem('jardin-vivant-proto-v2'), 'partie sauvegardée');
console.log('\nErreurs JS :', errors.length ? errors.join('\n') : 'aucune');
if (errors.length) fails++;
console.log(fails ? fails + ' ÉCHEC(S)' : 'Tous les tests UI passent');
process.exit(fails ? 1 : 0);

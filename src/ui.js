(function () {
'use strict';
const G = Engine.make(PLANTS), P = G.P, STR = G.COLS, MONTHS = G.MONTHS;
let COLS = 8, ROWS = 6;
function syncDims() { const d = G.dims(S); COLS = d[0]; ROWS = d[1]; }
const KEY = 'jardin-vivant-proto-v2';
let S = load() || G.newGame(), ui = { sel: -1, mode: null, confirmDel: false, tool: 'select', delPending: -1 };
S.w = G.weather(S.day); syncDims();
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fmt = (n, d) => Number(n).toFixed(d == null ? 1 : d).replace('.', ',');
function withFamily(o) { if (!o.family) o.family = G.defaultFamily(); return G.fixSave(o); }
function load() { try { const r = load0(); return r ? withFamily(r) : r; } catch (e) { return null; } }
function load0() { try { const t = localStorage.getItem(KEY); if (!t) return null; const o = JSON.parse(t); if (o && o.v === 1 && o.grid && o.grid.length === G.NCELL) { o.mats = Object.assign({ paillage: 0, compost: 0, treille: 0, chemin: 0, pergola: 0, serre: 0, mare: 0, ruche: 0 }, o.mats); o.size = o.size || 0; o.rewarded = o.rewarded || {}; return o; } if (o && o.v === 1 && o.grid && o.grid.length === 48) { const g = Array(G.NCELL).fill(null); o.grid.forEach((c, i) => { g[((i / 8) | 0) * STR + (i % 8)] = c; }); o.grid = g; o.mats = Object.assign({ paillage: 0, compost: 0, treille: 0, chemin: 0, pergola: 0, serre: 0, mare: 0, ruche: 0 }, o.mats); o.size = 0; o.rewarded = {}; return o; } } catch (e) {} return null; }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

/* ---------- icônes ---------- */
const IC = {
  snail: '<path d="M3 16h13M5 16c-1.5-4 .5-6 3-6M8 10c0-3 3-5 6-3s2 7-2 9M5 10V6M7.5 10V7"/>',
  fungus: '<path d="M3 11a7 6 0 0 1 14 0zM8 11v5h4v-5"/><path d="M6 8.5h.01M11 6.5h.01M13.5 8.5h.01"/>',
  jar: '<rect x="5" y="7" width="10" height="9.5" rx="2"/><path d="M6 7V5h8v2M8 11.5h4"/>',
  compost: '<path d="M4 8h12l-1.5 8h-9z"/><path d="M3 8h14M8 5.5c0-2 4-2 4 0"/>',
  mower: '<path d="M3 16h14M5 16v-6h9v6M12 10V4h3"/><circle cx="6" cy="16.5" r="1.4"/><circle cx="14" cy="16.5" r="1.4"/>',
  saw: '<path d="M3 14L14 5l3 3-9 9zM6 12.5l1.2 1.6M8.2 10.7l1.2 1.6M10.4 8.9l1.2 1.6"/>',
  prune: '<path d="M4 16l7-9M9 16l6-11"/><circle cx="4" cy="16" r="1.8"/><circle cx="9" cy="16.4" r="1.8"/><path d="M13 3l3 1"/>',
  straw: '<path d="M3 16h14M4 12h12M7 3l1.5 5M10 3v5M13 3l-1.5 5"/>',
  drop: '<path d="M10 2.5c3 4 5 6.4 5 9a5 5 0 0 1-10 0c0-2.6 2-5 5-9z"/>',
  basket: '<path d="M3 8h14l-1.5 8h-11z"/><path d="M6.5 8 9 3M13.5 8 11 3"/>',
  pack: '<rect x="4" y="3" width="12" height="15" rx="2"/><path d="M4 7h12M8 3v4"/>',
  pot: '<path d="M3.5 9h13v3a5 5 0 0 1-5 5h-3a5 5 0 0 1-5-5z"/><path d="M7 5c0-1.5 1.5-1.5 1.5-3M11.5 5c0-1.5 1.5-1.5 1.5-3"/>',
  seed: '<path d="M10 17V9"/><path d="M10 11c-4 0-6-2-6-5 4 0 6 2 6 5zM10 9c0-3 2-5 6-5 0 3-2 5-6 5z"/>',
  leaf: '<path d="M4 16C4 8 9 4 16 4c0 7-4 12-12 12zM4 16l7-7"/>',
  book: '<path d="M3.5 4.5H9a2 2 0 0 1 2 2V17a2 2 0 0 0-2-2H3.5zM16.5 4.5H11v12a2 2 0 0 1 2-2h3.5z"/>',
  sun: '<circle cx="10" cy="10" r="3.2"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.3 4.3l1.4 1.4M14.3 14.3l1.4 1.4M15.7 4.3l-1.4 1.4M5.7 14.3l-1.4 1.4"/>',
  cloud: '<path d="M6 15a3.5 3.5 0 0 1-.4-7A4.5 4.5 0 0 1 14 7.5a3.8 3.8 0 0 1 0 7.5z"/>',
  rain: '<path d="M6 11a3.5 3.5 0 0 1-.4-7A4.5 4.5 0 0 1 14 3.500a3.8 3.8 0 0 1 0 7.500zM7 14l-1 3M11 14l-1 3M15 14l-1 3"/>',
  frost: '<path d="M10 2v16M3 6l14 8M3 14l14-8"/>',
  clock: '<circle cx="10" cy="10" r="7"/><path d="M10 6v4l3 2"/>'
};
const ico = n => '<svg class="ico" viewBox="0 0 20 20" aria-hidden="true">' + IC[n] + '</svg>';

/* ---------- couleurs et dessin des plantes ---------- */
const EVERGREEN = new Set(['Romarin', 'Arbousier', 'Feijoa', 'Thym', 'Sauge', 'Trèfle blanc', 'Chou kale', 'Persil', 'Ciboulette', 'Menthe']);
function shade(hex, amt) { const n = parseInt(hex.slice(1), 16); const f = v => clamp(v + amt, 0, 255); return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(f).map(v => v.toString(16).padStart(2, '0')).join(''); }
function mix(a, b, t) { const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16); const ch = s => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t); return '#' + [16, 8, 0].map(s => ch(s).toString(16).padStart(2, '0')).join(''); }
function rnd(seed) { let x = Math.sin(seed * 12.9898) * 43758.5453; return () => { x = Math.sin(x * 78.233) * 43758.5453; return x - Math.floor(x); }; }
function leafColor(p, m, dry) {
  if (dry) return '#98a050';
  const woody = p.strate === 'Arbre' || p.strate === 'Arbuste' || p.strate === 'Grimpante';
  if (EVERGREEN.has(p.name)) return (m >= 11 || m <= 1) ? '#4a7d52' : '#3e8449';
  if (woody) { if (m >= 2 && m <= 4) return '#7dbb5c'; if (m >= 5 && m <= 7) return '#3d8c44'; if (m === 8) return '#6f9a3a'; if (m === 9) return '#d08a2a'; if (m === 10) return '#a8612a'; return null; }
  if (m >= 2 && m <= 4) return '#7dbb5c'; if (m >= 5 && m <= 8) return '#459646'; if (m === 9) return '#6f9a3a'; if (m === 10) return '#6c8f47'; return '#6f9a64';
}
const STRC = { 'Arbre': '#a0522d', 'Arbuste': '#7b5aa6', 'Herbacée': '#4f9a4a', 'Racine': '#e08a1e', 'Grimpante': '#2f8f8a', 'Couvre-sol': '#a3c23f' };
const STRS = { 'Arbre': 1.3, 'Arbuste': .95, 'Herbacée': .92, 'Racine': .82, 'Grimpante': 1, 'Couvre-sol': 1.05 };
const strIco = st => '<i class="sw" style="background:' + (STRC[st] || '#888') + '"></i>';
// dessine dans un repère 80x80, pied de la plante en (40,66)
function sprite(p, o) {
  const R = rnd(o.seed + p.id * 7), lc = leafColor(p, o.m, o.dry), dk = lc ? shade(lc, -26) : '#5b4630', lt = lc ? shade(lc, 22) : '#8a6b4a';
  let s = '';
  const dots = (pts, r) => pts.map(([x, y]) => '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + r + '" fill="' + p.col + '" stroke="' + shade(p.col, -45) + '" stroke-width=".7"/><circle cx="' + (x - r * .3).toFixed(1) + '" cy="' + (y - r * .3).toFixed(1) + '" r="' + (r * .3).toFixed(1) + '" fill="#fff" opacity=".45"/>').join('');
  if (o.stage === 'graine') return '<ellipse cx="40" cy="65" rx="13" ry="6" fill="#4f3a2a" opacity=".6"/><circle cx="36" cy="64" r="1.7" fill="#e0d2aa"/><circle cx="44" cy="66" r="1.7" fill="#e0d2aa"/>';
  if (o.stage === 'pousse') { const c = lc || '#7dbb5c'; return '<path d="M40 66V56" stroke="' + shade(c, -30) + '" stroke-width="2.4" stroke-linecap="round"/><path d="M40 58C36 50 29 49 26 50c2 6 8 9 14 8z" fill="' + c + '"/><path d="M40 58c4-8 11-9 14-8-2 6-8 9-14 8z" fill="' + shade(c, 18) + '"/>'; }
  const mature = o.stage === 'mature';
  if (p.strate === 'Herbacée' || p.strate === 'Racine') {
    const sf = clamp(.35 + .65 * o.prog, .35, 1), n = 4 + Math.round(sf * 5), h = 10 + 24 * sf, tips = [];
    if (p.strate === 'Racine' && o.stage !== 'pousse') s += '<ellipse cx="40" cy="67" rx="' + (4 + 3.5 * sf).toFixed(1) + '" ry="' + (2.6 + 2.4 * sf).toFixed(1) + '" fill="' + p.col + '" stroke="' + shade(p.col, -45) + '" stroke-width=".8"/>';
    for (let k = 0; k < n; k++) {
      const a = (k / (n - 1) - .5) * 1.7, len = h * (.75 + R() * .4), x2 = 40 + Math.sin(a) * len * .9, y2 = 66 - Math.cos(a) * len;
      tips.push([x2, y2]);
      s += '<path d="M40 66Q' + (40 + Math.sin(a) * len * .25).toFixed(1) + ' ' + (66 - len * .65).toFixed(1) + ' ' + x2.toFixed(1) + ' ' + y2.toFixed(1) + '" stroke="' + (k % 2 ? lc : dk) + '" stroke-width="' + (2.2 + sf * 1.6).toFixed(1) + '" stroke-linecap="round" fill="none"/>';
    }
    if (mature && p.tags.includes('mellifere') && o.m >= 3 && o.m <= 8) s += tips.filter((_, k) => k % 2 === 0).map(([x, y]) => '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="3" fill="' + p.col + '"/>').join('');
    if (mature && o.ready && p.strate === 'Herbacée') s += dots([[33, 60], [46, 62], [40, 54], [49, 55]], 3.6);
    return s;
  }
  if (p.strate === 'Couvre-sol') {
    const sf = clamp(.4 + .6 * o.prog, .4, 1), pts = [];
    for (let k = 0; k < 8; k++) { const cx = 40 + (R() - .5) * 38 * sf, cy = 62 + (R() - .5) * 9, r = (7 + R() * 4) * sf; pts.push([cx, cy]); s += '<ellipse cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" rx="' + (r * 1.15).toFixed(1) + '" ry="' + (r * .5).toFixed(1) + '" fill="' + (k % 2 ? lc : lt) + '"/>'; }
    if (mature && (o.ready || (p.tags.includes('mellifere') && o.m >= 3 && o.m <= 8))) s += pts.slice(0, 6).map(([x, y]) => '<circle cx="' + x.toFixed(1) + '" cy="' + (y - 3).toFixed(1) + '" r="2.6" fill="' + p.col + '"/>').join('');
    return s;
  }
  if (p.strate === 'Arbuste') {
    const sf = clamp(.3 + .9 * o.prog, .3, 1);
    s += '<path d="M40 67V54" stroke="#5b4630" stroke-width="3" stroke-linecap="round"/>';
    if (!lc) { for (let k = 0; k < 7; k++) { const a = (k / 6 - .5) * 2, L = 22 * sf; s += '<path d="M40 60L' + (40 + Math.sin(a) * L).toFixed(1) + ' ' + (60 - Math.cos(a) * L).toFixed(1) + '" stroke="#5b4630" stroke-width="2" stroke-linecap="round"/>'; } return s; }
    const cs = [[40, 48, 13], [29, 55, 10], [51, 55, 10], [35, 42, 9], [46, 41, 9]], pts = [];
    cs.forEach(([x, y, r], k) => { const cx = 40 + (x - 40) * sf, cy = 62 + (y - 62) * sf; pts.push([cx, cy]); s += '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + (r * sf).toFixed(1) + '" fill="' + (k % 2 ? lc : lt) + '"/>'; });
    if (mature && o.ready) s += dots(pts.map(([x, y], k) => [x + (k % 2 ? 5 : -5), y + 3]).concat(pts.map(([x, y]) => [x + 2, y - 4])), 3.1);
    else if (mature && p.tags.includes('mellifere') && o.m >= 3 && o.m <= 6) s += pts.map(([x, y]) => '<circle cx="' + (x + 3).toFixed(1) + '" cy="' + (y - 3).toFixed(1) + '" r="2.4" fill="#fff" opacity=".9"/>').join('');
    return s;
  }
  if (p.strate === 'Grimpante') {
    const sf = clamp(.3 + .9 * o.prog, .3, 1), top = 66 - 52 * sf;
    s += '<path d="M27 68V' + (top - 4).toFixed(1) + 'M53 68V' + (top - 4).toFixed(1) + '" stroke="#8a6b4a" stroke-width="2.6" stroke-linecap="round"/>';
    [.25, .55, .85].forEach(f => { const y = 68 - (68 - top) * f; s += '<path d="M27 ' + y.toFixed(1) + 'H53" stroke="#8a6b4a" stroke-width="1.8"/>'; });
    const pts = [], n = 4 + Math.round(sf * 4); let d = 'M40 68';
    for (let k = 1; k <= n; k++) { const y = 68 - (68 - top) * k / n, x = k % 2 ? 31 : 49; d += 'L' + x + ' ' + y.toFixed(1); pts.push([x, y]); }
    s += '<path d="' + d + '" stroke="' + (lc ? dk : '#5b4630') + '" stroke-width="2.4" fill="none" stroke-linejoin="round"/>';
    if (lc) pts.forEach(([x, y], k) => { s += '<circle cx="' + (x + (k % 2 ? -2 : 2)) + '" cy="' + y.toFixed(1) + '" r="' + (6 * sf + 2).toFixed(1) + '" fill="' + (k % 2 ? lc : lt) + '"/>'; });
    if (mature && o.ready) s += dots(pts.map(([x, y]) => [x + (x < 40 ? 7 : -7), y + 6]), 3.2);
    return s;
  }
  // Arbre
  const sf = clamp(.22 + .9 * o.prog, .22, 1), th = 18 + 38 * sf, ty = 66 - th, cy = ty - 4;
  s += '<ellipse cx="40" cy="67" rx="' + (16 + 9 * sf).toFixed(1) + '" ry="5.5" fill="#000" opacity=".16"/>';
  s += '<rect x="' + (40 - (2 + 3.5 * sf)).toFixed(1) + '" y="' + ty.toFixed(1) + '" width="' + (4 + 7 * sf).toFixed(1) + '" height="' + th.toFixed(1) + '" rx="2.2" fill="#6b4a30"/>';
  if (!lc) { for (let k = 0; k < 6; k++) { const a = (k / 5 - .5) * 2.3, L = 14 * sf + 8; s += '<path d="M40 ' + (ty + 6).toFixed(1) + 'L' + (40 + Math.sin(a) * L).toFixed(1) + ' ' + (ty + 6 - Math.cos(a) * L).toFixed(1) + '" stroke="#6b4a30" stroke-width="' + (2.2 * sf + 1).toFixed(1) + '" stroke-linecap="round"/>'; } return s; }
  const cs = [[40, cy, 14 * sf + 6], [40 - 12 * sf - 3, cy + 6 * sf, 10 * sf + 4], [40 + 12 * sf + 3, cy + 5 * sf, 10 * sf + 4], [40, cy - 7 * sf, 9 * sf + 4]];
  cs.forEach(([x, y, r], k) => { s += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + r.toFixed(1) + '" fill="' + (k % 2 ? lc : lt) + '"/>'; });
  if (mature && o.ready) s += dots(cs.flatMap(([x, y, r], k) => [[x - r * .35, y + r * .3], [x + r * .4, y - r * .1]]), 3.3);
  else if (mature && o.m >= 2 && o.m <= 3) s += cs.map(([x, y, r]) => '<circle cx="' + (x + 2).toFixed(1) + '" cy="' + (y - 2).toFixed(1) + '" r="3" fill="#fff" opacity=".85"/>').join('');
  return s;
}
function treille() { return '<path d="M24 68V16M56 68V16" stroke="#8a6b4a" stroke-width="3.4" stroke-linecap="round"/><path d="M24 24H56M24 40H56M24 56H56" stroke="#a5835a" stroke-width="2.4"/><path d="M24 24L56 40M56 24L24 40" stroke="#a5835a" stroke-width="1.2" opacity=".7"/>'; }
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
/* Photos : iNaturalist retiré. Les images viendront de la base JF Lab (champ p.photo, p.credit) quand la connexion sera faite. */
function phInfo(p) { return p.photo ? { u: p.photo, c: p.credit, l: p.plink } : null; }
function phImg(p) { const i = phInfo(p); return i ? '<img class="phimg" src="' + esc(i.u) + '" alt="" loading="lazy" referrerpolicy="no-referrer" title="' + esc(i.c || 'JF Lab') + '" onerror="this.remove()">' : ''; }
function wantPhotos() {}
function cardArt(p) { return '<svg viewBox="-8 -30 96 112" aria-hidden="true"><ellipse cx="40" cy="66" rx="30" ry="9" fill="#6a4e39" opacity=".35"/>' + sprite(p, { stage: 'mature', prog: 1, ready: true, m: 6, seed: p.id + 3 }) + '</svg>'; }

/* ---------- calendrier de saisons ---------- */
const sw = p => ['Arbre', 'Arbuste', 'Grimpante'].includes(p.strate) ? 'Plantation' : 'Semis';
function cal(p, m) {
  let h = '<div class="cal" role="img" aria-label="' + sw(p) + ' : ' + G.monthRange(p.semis) + '. Récolte : ' + G.monthRange(p.recolte) + '">';
  for (let k = 0; k < 12; k++) { const s = p.semis.includes(k + 1), r = p.recolte.includes(k + 1); h += '<i class="' + (s && r ? 'sh' : s ? 's' : r ? 'h' : '') + (k === m ? ' cur' : '') + '"></i>'; }
  return h + '</div>';
}
const legend = '<div class="legend"><span><b style="background:var(--leaf-2)"></b>semis ou plantation</span><span><b style="background:var(--fruit)"></b>récolte</span><span><b style="outline:1.5px solid var(--ink);outline-offset:1px;background:var(--surface-2)"></b>mois en cours</span></div>';

/* ---------- cartes ---------- */
function cardHtml(p, o) {
  o = o || {}; const m = G.dateOf(S.day).m, now = G.sowable(p, m), rar = p.rarete === 'Commune' ? '' : p.rarete === 'Rare' ? 'rar-Rare' : 'rar-Peu';
  const verb = p.propagation === 'Plant' ? 'plant' : p.propagation.toLowerCase();
  return '<' + (o.btn ? 'button type="button" data-act="mode-plant" data-pid="' + p.id + '"' : 'article') + ' class="card t-' + p.strate + ' ' + rar + (o.on ? ' on' : '') + '">' +
    '<div class="art" data-pid="' + p.id + '">' + cardArt(p) + phImg(p) + (o.btn ? (now ? '<span class="now">De saison</span>' : '<span class="now no">Hors saison</span>') : '') + (o.count > 1 ? '<span class="cnt">×' + o.count + '</span>' : '') + '</div>' +
    '<h4>' + p.name + '</h4><p class="lat">' + p.latin + '</p>' +
    '<div class="tags"><span class="tag">' + strIco(p.strate) + p.strate + '</span><span class="tag">' + verb + '</span></div>' + '<div class="cal-wrap">' + cal(p, m) + '</div>' +
    '</' + (o.btn ? 'button' : 'article') + '>';
}
const MATS = {
  paillage: { n: 'Paillage', d: 'Couvre le sol : garde l’eau.', svg: '<path d="M10 62c10-8 14-8 24 0s14 8 24 0M6 48c10-8 14-8 24 0s14 8 24 0M14 34c10-8 14-8 24 0s14 8 24 0" stroke="#b08a4a" stroke-width="5" fill="none" stroke-linecap="round"/>' },
  compost: { n: 'Compost', d: 'Nourrit une plante 30 jours.', svg: '<path d="M16 28h48l-5 40H21z" fill="#6a4e39"/><path d="M12 28h56" stroke="#8a6b4a" stroke-width="5" stroke-linecap="round"/><circle cx="32" cy="44" r="4" fill="#4a3526"/><circle cx="46" cy="52" r="3.5" fill="#4a3526"/><circle cx="40" cy="38" r="3" fill="#7dbb5c"/>' },
  treille: { n: 'Treille', d: 'Support pour une grimpante.', svg: treille() },
  chemin: { n: 'Chemin', d: 'Accès sans piétiner le sol.', svg: '<path d="M8 66L40 50l32 16-32 16z" fill="#d9c9a2" transform="translate(0 -14)"/><ellipse cx="26" cy="54" rx="7" ry="3" fill="#bfae88"/><ellipse cx="42" cy="46" rx="8" ry="3.2" fill="#efe5c6"/><ellipse cx="55" cy="55" rx="6" ry="2.6" fill="#bfae88"/><ellipse cx="38" cy="60" rx="5" ry="2.2" fill="#efe5c6"/><ellipse cx="22" cy="46" rx="4" ry="1.8" fill="#efe5c6"/>' },
  pergola: { n: 'Pergola', d: 'Support et ombre fraîche.', svg: '<path d="M14 70V24M66 70V24" stroke="#8a6240" stroke-width="5" stroke-linecap="round"/><path d="M8 24h64M12 32h56" stroke="#7a5636" stroke-width="4.5" stroke-linecap="round"/><path d="M20 22v-6M30 22v-6M40 22v-6M50 22v-6M60 22v-6" stroke="#7a5636" stroke-width="3.4" stroke-linecap="round"/><circle cx="22" cy="30" r="5" fill="#5aa04c"/><circle cx="38" cy="34" r="5.5" fill="#6bb35a"/><circle cx="54" cy="30" r="5" fill="#5aa04c"/><circle cx="46" cy="39" r="3" fill="#6a3d8f"/><circle cx="30" cy="40" r="3" fill="#6a3d8f"/>' },
  serre: { n: 'Serre froide', d: 'Protège du gel.', svg: '<path d="M10 66V38l30-16 30 16v28z" fill="#dff0f6" opacity=".75" stroke="#fff" stroke-width="3" stroke-linejoin="round"/><path d="M10 38h60M40 22v44M25 30v36M55 30v36" stroke="#fff" stroke-width="2.2"/><path d="M10 66h60" stroke="#6a4e39" stroke-width="5"/><circle cx="26" cy="58" r="3.4" fill="#7dbb5c"/><circle cx="40" cy="56" r="3.4" fill="#7dbb5c"/><circle cx="54" cy="58" r="3.4" fill="#7dbb5c"/>' },
  ruche: { n: 'Ruche', d: 'Abeilles : plus de fruits.', svg: '<ellipse cx="40" cy="68" rx="24" ry="6" fill="#000" opacity=".15"/><path d="M22 66V50h36v16" fill="#e8c36a" stroke="#a77d2a" stroke-width="2"/><path d="M20 50V36h40v14" fill="#f0d283" stroke="#a77d2a" stroke-width="2"/><path d="M18 36h44l-4-10H22z" fill="#c8553a"/><rect x="34" y="56" width="12" height="4" rx="2" fill="#4a3526"/><circle cx="58" cy="26" r="3" fill="#f2b13a"/><circle cx="66" cy="34" r="2.6" fill="#f2b13a"/>' },
  trogne: { n: 'Trogne', d: 'Arbre têtard : paillage et pousse.', svg: '<ellipse cx="40" cy="70" rx="20" ry="5" fill="#000" opacity=".15"/><path d="M33 70l2-30h10l2 30z" fill="#6b4a30"/><ellipse cx="40" cy="38" rx="12" ry="7" fill="#5a3d26"/><g stroke="#7a5636" stroke-width="3" stroke-linecap="round"><path d="M32 36L20 14M36 33L32 10M40 32V8M44 33L48 10M48 36L60 14"/></g><g fill="#5aa04c"><circle cx="20" cy="14" r="5"/><circle cx="32" cy="10" r="5"/><circle cx="40" cy="8" r="5.5"/><circle cx="48" cy="10" r="5"/><circle cx="60" cy="14" r="5"/></g>' },
  canard: { n: 'Canards', d: 'Coureurs indiens : mangent les limaces.', svg: '<ellipse cx="40" cy="70" rx="26" ry="6" fill="#000" opacity=".15"/><g><path d="M28 68c-4-14 0-30 7-36 4-4 10-2 9 3-1 4-4 5-5 8 3 11 0 20-4 25z" fill="#f3e7cf" stroke="#b8a67e" stroke-width="1.4"/><path d="M43 33l9 2-8 3z" fill="#e8892b"/><circle cx="40" cy="32" r="1.5" fill="#2b2018"/></g><g transform="translate(18 6)"><path d="M28 68c-4-14 0-30 7-36 4-4 10-2 9 3-1 4-4 5-5 8 3 11 0 20-4 25z" fill="#c8a46a" stroke="#8f7440" stroke-width="1.4"/><path d="M43 33l9 2-8 3z" fill="#e8892b"/><circle cx="40" cy="32" r="1.5" fill="#2b2018"/></g>' },
  mare: { n: 'Mare', d: 'Biodiversité et humidité.', svg: '<ellipse cx="40" cy="56" rx="32" ry="14" fill="#8f8b7d"/><ellipse cx="40" cy="55" rx="27" ry="11" fill="#4f9bd0"/><ellipse cx="36" cy="54" rx="9" ry="3" fill="none" stroke="#d8f0fb" stroke-width="1.4" opacity=".7"/><ellipse cx="50" cy="52" rx="6" ry="2.4" fill="#4d9a4c"/><path d="M16 56c-1-12 2-18 4-24M22 58c0-10 4-16 6-20M62 56c1-12-2-18-4-24" stroke="#4f7d3a" stroke-width="2.4" fill="none" stroke-linecap="round"/>' },
  atelier: { n: 'Atelier', d: 'Près de la maison : conserve et sèche la récolte.', svg: '<ellipse cx="40" cy="70" rx="30" ry="6" fill="#000" opacity=".15"/><path d="M14 68V38l26-12 26 12v30z" fill="#c9a574"/><path d="M40 26l26 12v30H40z" fill="#a8825a"/><path d="M8 40L40 20l32 20" stroke="#a3402c" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect x="22" y="48" width="12" height="20" fill="#6b4a2e"/><rect x="46" y="44" width="14" height="12" fill="#8fc1d6" stroke="#6b4a2e" stroke-width="2"/>' },
  bocaux: { n: 'Bocaux', d: 'Six bocaux : la récolte se garde plus d’un an.', svg: '<g stroke="#8aa67a" stroke-width="1.6"><rect x="10" y="38" width="20" height="28" rx="4" fill="#f2f6e6"/><rect x="30" y="30" width="20" height="36" rx="4" fill="#f2f6e6"/><rect x="50" y="40" width="20" height="26" rx="4" fill="#f2f6e6"/></g><g fill="#a3402c"><rect x="12" y="33" width="16" height="6" rx="2"/><rect x="32" y="25" width="16" height="6" rx="2"/><rect x="52" y="35" width="16" height="6" rx="2"/></g><rect x="13" y="48" width="14" height="14" rx="3" fill="#e0603a"/><rect x="33" y="42" width="14" height="20" rx="3" fill="#f0b23a"/><rect x="53" y="50" width="14" height="12" rx="3" fill="#7dbb5c"/>' },
  sechoir: { n: 'Séchoir', d: 'Sèche herbes et fruits : se garde très longtemps.', svg: '<path d="M12 70V22M68 70V22" stroke="#8a6240" stroke-width="5" stroke-linecap="round"/><path d="M8 24h64" stroke="#7a5636" stroke-width="5" stroke-linecap="round"/><g stroke-linecap="round"><path d="M24 26v18M40 26v24M56 26v16" stroke="#6b4a2e" stroke-width="2"/></g><path d="M18 44c4-4 10-4 12 0l-6 10z" fill="#7dbb5c"/><path d="M34 50c4-4 10-4 12 0l-6 12z" fill="#b9a24a"/><path d="M50 42c4-4 10-4 12 0l-6 10z" fill="#cc7a2b"/>' },
  grandeserre: { n: 'Grande serre', d: 'Cultive les plantes exotiques fragiles au froid.', svg: '<path d="M8 68V34l32-18 32 18v34z" fill="#dff0f6" opacity=".8" stroke="#fff" stroke-width="3" stroke-linejoin="round"/><path d="M8 34h64M40 16v52M24 26v42M56 26v42" stroke="#fff" stroke-width="2.2"/><path d="M8 68h64" stroke="#6a4e39" stroke-width="5"/><path d="M40 66q2-14 0-26" stroke="#7a5636" stroke-width="3.5" fill="none" stroke-linecap="round"/><g stroke="#4f9a4a" stroke-width="3.5" fill="none" stroke-linecap="round"><path d="M40 40q-10-2-14 8M40 40q10-2 14 8M40 40q-6-10-14-8M40 40q6-10 14-8"/></g><circle cx="52" cy="60" r="3" fill="#f0b23a"/><circle cx="28" cy="62" r="3" fill="#e0603a"/>' },
  ortie: { n: 'Purin d’ortie', d: 'Stimule la croissance, éloigne les limaces.', svg: '<ellipse cx="40" cy="70" rx="24" ry="5" fill="#000" opacity=".15"/><path d="M24 36h32l-3 32H27z" fill="#5f8a3a"/><path d="M22 36h36" stroke="#3f6a28" stroke-width="5" stroke-linecap="round"/><g fill="#4f9a4a" stroke="#2f6a2c" stroke-width="1.2"><path d="M40 34c-4-10-12-14-18-12 2 8 8 14 18 12z"/><path d="M40 34c4-12 12-16 18-14-2 8-8 16-18 14z"/><path d="M40 34c-1-8 1-14 0-20 4 6 4 14 0 20z"/></g><path d="M30 52q10 5 20 0" stroke="#cfe8a0" stroke-width="2.5" fill="none" stroke-linecap="round"/>' },
  prele: { n: 'Prêle', d: 'Décoction : protège des maladies fongiques.', svg: '<ellipse cx="40" cy="70" rx="24" ry="5" fill="#000" opacity=".15"/><g stroke="#6f9a52" stroke-width="3.4" stroke-linecap="round"><path d="M26 70V22M40 70V12M54 70V26"/></g><g stroke="#3f6a28" stroke-width="1.6" stroke-linecap="round"><path d="M21 56h10M21 42h10M21 30h10M35 58h10M35 44h10M35 30h10M35 18h10M49 58h10M49 44h10M49 32h10"/></g>' },
  nichoir: { n: 'Nichoir à mésanges', d: 'Les mésanges mangent chenilles et pucerons.', svg: '<path d="M40 4v14" stroke="#6b4a2e" stroke-width="2.4"/><path d="M20 66V34l20-14 20 14v32z" fill="#c9a574" stroke="#8a6240" stroke-width="2"/><path d="M12 36L40 14l28 22" stroke="#a3402c" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="40" cy="44" r="7" fill="#3a2a1c"/><path d="M34 62h12" stroke="#6b4a2e" stroke-width="3" stroke-linecap="round"/><g transform="translate(60 56)"><ellipse rx="6" ry="4.4" fill="#f0c43a"/><circle cx="-4" cy="-3" r="3" fill="#2f4a6a"/><path d="M6 0l5 -1-4 3z" fill="#e8892b"/></g>' },
  cuve: { n: 'Cuve', d: 'Récupère la pluie : +150 L de réserve.', svg: '<ellipse cx="40" cy="70" rx="26" ry="6" fill="#000" opacity=".16"/><path d="M16 22v44a24 8 0 0 0 48 0V22z" fill="#7b5a3d"/><path d="M16 38a24 8 0 0 0 48 0M16 54a24 8 0 0 0 48 0" stroke="#4d3826" stroke-width="2.4" fill="none"/><ellipse cx="40" cy="22" rx="24" ry="8" fill="#4d3826"/><ellipse cx="40" cy="23" rx="20" ry="6" fill="#4f9bd0"/><path d="M62 52h10" stroke="#8a8a8a" stroke-width="4" stroke-linecap="round"/>' },
  oya: { n: 'Oya', d: 'Jarre enterrée : arrose seule pendant 45 jours.', svg: '<ellipse cx="40" cy="72" rx="26" ry="5" fill="#6a4e39"/><path d="M26 66c-8-10-6-28 14-28s22 18 14 28z" fill="#c8764a" stroke="#a85a34" stroke-width="2"/><rect x="34" y="30" width="12" height="9" rx="3" fill="#a85a34"/><path d="M40 8c-4 6-6 9-6 12a6 6 0 0 0 12 0c0-3-2-6-6-12z" fill="#4f9bd0"/>' },
  plan: { n: 'Plan de guilde', d: 'Te dit quoi planter autour d’un arbre.', svg: '<path d="M14 18h48v52H14z" fill="#f1e6c8" stroke="#b8a67e" stroke-width="2.4"/><path d="M62 18l6 6v52l-6-6z" fill="#d9c9a2"/><circle cx="38" cy="44" r="8" fill="#4f9a4a"/><g fill="none" stroke="#6f9a52" stroke-width="2.4" stroke-dasharray="3 3"><circle cx="38" cy="44" r="17"/></g><g fill="#e0603a"><circle cx="38" cy="25" r="3"/><circle cx="55" cy="44" r="3"/></g><g fill="#f0b23a"><circle cx="21" cy="44" r="3"/><circle cx="38" cy="63" r="3"/></g>' },
  mycor: { n: 'Inoculum de mycorhizes', d: 'Un arbre ou arbuste pousse plus vite 2 mois.', svg: '<ellipse cx="40" cy="70" rx="28" ry="5" fill="#6a4e39"/><g stroke="#f4efe0" stroke-width="2.2" fill="none" stroke-linecap="round"><path d="M14 70q10-10 20-4t22-6 14-4M26 66q-4-8 0-14M50 62q6-8 2-16"/></g><path d="M40 62V44" stroke="#efe5c6" stroke-width="6" stroke-linecap="round"/><path d="M26 44a14 11 0 0 1 28 0z" fill="#c8553a"/><circle cx="34" cy="38" r="2.2" fill="#fff"/><circle cx="44" cy="35" r="2.6" fill="#fff"/><circle cx="48" cy="41" r="1.8" fill="#fff"/>' },
  savoir: { n: 'Savoir', d: 'Apprends une plante de saison.', svg: '<path d="M10 22c10-4 22-4 30 2v44c-8-6-20-6-30-2z" fill="#f1e6c8" stroke="#b8a67e" stroke-width="2"/><path d="M70 22c-10-4-22-4-30 2v44c8-6 20-6 30-2z" fill="#f7efd6" stroke="#b8a67e" stroke-width="2"/><g stroke="#b8a67e" stroke-width="1.8" stroke-linecap="round"><path d="M16 32c6-1 12-1 18 2M16 42c6-1 12-1 18 2M46 34c6-3 12-3 18-2M46 44c6-3 12-3 18-2"/></g><path d="M40 20c-6-6-4-12 2-14 2 6 0 10-2 14z" fill="#4f9a4a"/>' }
};
function matCard(k, q) { const mt = MATS[k]; return '<article class="card t-mat"><div class="art"><svg viewBox="0 0 80 80" aria-hidden="true">' + mt.svg + '</svg>' + (q > 1 ? '<span class="cnt">×' + q + '</span>' : '') + '</div><h4>' + mt.n + '</h4><p class="lat" style="font-style:normal">' + mt.d + '</p><div class="tags"><span class="tag">' + (k === 'paillage' || k === 'compost' ? 'matériel' : k === 'trogne' ? 'technique' : k === 'canard' || k === 'nichoir' ? 'animal' : ['atelier', 'bocaux', 'sechoir'].includes(k) ? 'transformation' : ['ortie', 'prele', 'mycor'].includes(k) ? 'soin' : ['cuve', 'oya'].includes(k) ? 'eau' : ['plan', 'savoir'].includes(k) ? 'savoir' : 'mobilier') + '</span></div></article>'; }

/* ---------- haut de page ---------- */
const SEASON = m => (m >= 2 && m <= 4) ? 'Printemps' : (m >= 5 && m <= 7) ? 'Été' : (m >= 8 && m <= 10) ? 'Automne' : 'Hiver';
const SEASON_COL = { 'Printemps': '#7dbb5c', 'Été': '#e3b13b', 'Automne': '#cc7a2b', 'Hiver': '#7aa3c4' };
function dateStr(day, short) { const d = G.dateOf(day); return d.d + ' ' + (short ? MONTHS[d.m].slice(0, 4) + (MONTHS[d.m].length > 4 ? '.' : '') : MONTHS[d.m] + ' ' + d.y); }
function renderTop() {
  const d = G.dateOf(S.day), w = S.w, st = G.stats(S), se = SEASON(d.m);
  const wi = w.tmin < 0 ? 'frost' : w.rain >= 1 ? 'rain' : w.tmax > 22 ? 'sun' : 'cloud';
  $('when').innerHTML = '<b>' + dateStr(S.day) + '</b><span class="chip"><i style="background:' + SEASON_COL[se] + '"></i>' + se + '</span>' +
    '<span style="display:inline-flex;align-items:center;gap:6px">' + ico(wi) + fmt(w.tmin, 0) + ' à ' + fmt(w.tmax, 0) + ' °C' + (w.rain >= 1 ? ' · pluie ' + fmt(w.rain, 0) + ' mm' : w.tmin < 0 ? ' · gelée' : '') + '</span>';
  const g = (n, v, t, cls) => '<div class="gauge" title="' + t + '"><div class="row"><span>' + n + '</span><strong>' + v + '</strong></div><div class="bar ' + (cls || '') + '"><i style="width:' + clamp(parseFloat(String(v).replace(',', '.')), 0, 100) + '%"></i></div></div>';
  $('gauges').innerHTML = g('Autonomie', fmt(st.autonomy) + ' %', 'Part de ce qu’une forêt comestible peut couvrir (le quart des besoins : fruits, légumes, aromatiques). Base ' + st.aParts.base + ' % (récolte réelle sur 90 jours ' + st.aParts.prod + ' %, potentiel de la forêt ' + st.aParts.pot + ' %), multipliée par le bonus de tes guildes : +' + st.aParts.boost + ' % (' + st.guildsAuto + ' autonome(s) sur ' + st.guildsN + ' guilde(s)).') +
    g('Biodiversité', st.biodiv + ' %', 'Espèces différentes, strates présentes, plantes qui nourrissent les pollinisateurs.') +
    g('Sol vivant', st.soil + ' %', 'Couvre-sols, légumineuses, paillage et compost améliorent le sol, et donc la croissance.');
}
const HAIR = ['#6b3f22', '#2b2018', '#d9a441', '#8a4b22'], SKIN = ['#f1c9a0', '#e3b184', '#f6d3b0', '#f1c9a0'];
function face(k, joy, sz) {
  const m = joy >= 66 ? 'M-6 4q6 7 12 0' : joy >= 40 ? 'M-5 6h10' : joy >= 22 ? 'M-5 8q5 -4 10 0' : 'M-6 9q6 -7 12 0';
  return '<svg class="face" width="' + (sz || 44) + '" height="' + (sz || 44) + '" viewBox="-18 -18 36 36" aria-hidden="true"><circle r="15" fill="' + SKIN[k % 4] + '"/><path d="M-15 -3a15 15 0 0 1 30 0q-8 -9 -15 -8t-15 8z" fill="' + HAIR[k % 4] + '"/>' + (k === 2 ? '<circle cx="-14" cy="-2" r="4" fill="' + HAIR[k % 4] + '"/><circle cx="14" cy="-2" r="4" fill="' + HAIR[k % 4] + '"/>' : '') + '<circle cx="-5" cy="0" r="1.8" fill="#2b2018"/><circle cx="5" cy="0" r="1.8" fill="#2b2018"/><path d="' + m + '" stroke="#7a3b2a" stroke-width="1.8" fill="none" stroke-linecap="round"/>' + (joy < 22 ? '<path d="M-8 -5l4 1M8 -5l-4 1" stroke="#2b2018" stroke-width="1.4"/>' : '') + '</svg>';
}
const mood = j => j >= 80 ? 'Radieux' : j >= 60 ? 'Content' : j >= 40 ? 'Tranquille' : j >= 22 ? 'Grognon' : 'A faim';
function familyHtml() {
  const f = S.family, avg = Math.round(f.reduce((a, b) => a + b.joy, 0) / f.length);
  return '<p class="note-p">Plus ils mangent de ton jardin, des repas variés, plus ils sont heureux. Bonheur moyen : <b>' + avg + ' %</b>.</p><div class="fam">' + f.map((m, k) => {
    const t = m.hist.filter(x => S.day - x.day < 1).reduce((a, b) => a + b.kcal, 0);
    return '<div class="fm' + (m.joy < 25 ? ' sad' : '') + '">' + face(k, m.joy, 46) + '<div><b>' + m.n + '</b> <span class="k">' + m.role + '</span><div class="bar"><i style="width:' + Math.round(m.joy) + '%"></i></div><span class="k">' + mood(m.joy) + ' · ' + t + ' / ' + m.need + ' kcal aujourd’hui</span></div></div>'; }).join('') + '</div><div class="acts"><button type="button" class="btn sm primary" data-act="kitchen">' + ico('pot') + 'Cuisiner pour la famille</button></div>';
}
function openFamily() { modal('La famille', familyHtml() + '<p class="note-p" style="margin-top:10px">Camille et Léa vivent dans la maison. Ils sortent dans la cour de 10 h à 11 h et de 16 h à 17 h (heure de ton appareil), soit 2 h par jour.</p>'); }
function renderRes() {
  const st = G.stats(S), m = S.mats, mode = ui.mode && ui.mode.type === 'mat' ? ui.mode.k : null;
  const mat = k => (m[k] > 0 || ['paillage', 'compost', 'chemin'].includes(k)) ? '<button type="button" class="pill mat ' + (mode === k ? 'on' : '') + '" data-act="mode-mat" data-k="' + k + '"' + (m[k] > 0 ? '' : ' disabled') + '>' + MATS[k].n + ' ' + (m[k] || 0) + '</button>' : '';
  const kg = S.stock.reduce((a, b) => a + b.kg, 0);
  $('res').innerHTML = '<div class="items"><span class="pill" title="Eau de pluie récupérée. Elle se remplit quand il pleut.">' + ico('drop') + Math.round(S.tank) + ' / ' + S.tankMax + ' L</span>' + mat('paillage') + mat('compost') + mat('chemin') + mat('treille') + mat('pergola') + mat('serre') + mat('mare') + mat('ruche') + mat('grandeserre') + mat('ortie') + mat('prele') + mat('nichoir') + mat('oya') + mat('cuve') + mat('mycor') + mat('plan') + mat('savoir') + mat('atelier') + mat('sechoir') + mat('bocaux') + (S.atelier ? '<button type="button" class="pill mat" data-act="atelier">Atelier</button>' : '') + mat('trogne') + mat('canard') + '</div>' +
    '<div class="items"><button type="button" class="btn sm" data-act="kitchen">' + ico('pot') + 'Garde-manger ' + fmt(kg) + ' kg</button><button type="button" class="btn sm primary" data-act="amenager">' + ico('leaf') + 'Aménager' + (G.canExpand(S).ok ? ' · terrain à agrandir' : '') + '</button><button type="button" class="btn sm" data-act="herbier">' + ico('leaf') + 'Herbier</button><button type="button" class="btn sm" data-act="journal">' + ico('book') + 'Carnet</button><button type="button" class="btn sm" data-act="time">' + ico('clock') + 'Temps</button><button type="button" class="btn sm" data-act="famille">' + ico('leaf') + 'Famille</button></div>';
}

/* ---------- jardin isométrique ---------- */
const GROUND = { 'Printemps': ['#a9d37e', '#8fc069'], 'Été': ['#b9cc68', '#a2b956'], 'Automne': ['#b9bc6a', '#a5a85a'], 'Hiver': ['#c3d0bc', '#aebfa4'] };
const TW = 46, TH = 23, OX = 334, OY = 150, BH = 8, PT = 14, INS = .06;
let VROT = 0, view = { z: 1, cx: 380, cy: 286 };
function rot(c, r) { switch (VROT) { case 0: return [c, r]; case 1: return [ROWS - r, c]; case 2: return [COLS - c, ROWS - r]; default: return [r, COLS - c]; } }
function irot(a, b) { switch (VROT) { case 0: return [a, b]; case 1: return [b, ROWS - a]; case 2: return [COLS - a, ROWS - b]; default: return [COLS - b, a]; } }
const dispDims = () => VROT % 2 ? [ROWS, COLS] : [COLS, ROWS];
const isoX = (c, r) => { const q = rot(c, r); return OX + (q[0] - q[1]) * TW; }, isoY = (c, r) => { const q = rot(c, r); return OY + (q[0] + q[1]) * TH; };
function kview(dw, dh) { return { KS: Math.min(1, 14 / (dw + dh)), CGx: OX + (dw - dh) / 2 * TW, CGy: OY + (dw + dh) / 2 * TH }; }
function wpos(X, Y) {
  if (!VROT) return [X, Y]; const b = kview(COLS, ROWS), xl = (X - 380) / b.KS + b.CGx, yl = (Y - 311) / b.KS + b.CGy, s1 = (xl - OX) / TW, s2 = (yl - OY) / TH, c = (s1 + s2) / 2, r = (s2 - s1) / 2, q = rot(c, r), d = dispDims(), k = kview(d[0], d[1]);
  return [380 + (OX + (q[0] - q[1]) * TW - k.CGx) * k.KS, 311 + (OY + (q[0] + q[1]) * TH - k.CGy) * k.KS];
}
function mv(X, Y, svg) { const p = wpos(X, Y), dx = p[0] - X, dy = p[1] - Y; return VROT ? '<g transform="translate(' + dx.toFixed(1) + ' ' + dy.toFixed(1) + ')">' + svg + '</g>' : svg; }
const pt = (c, r, lift) => (isoX(c, r)).toFixed(1) + ',' + (isoY(c, r) - (lift || 0)).toFixed(1);
const poly = (pts, fill, extra) => '<polygon points="' + pts.join(' ') + '" fill="' + fill + '"' + (extra || '') + '/>';
function shade2(hex, f) { return shade(hex, f); }


function decorExtras(m) {
  let s = '';
  const cols = ['#f2b13a', '#e9654f', '#f4f1ea', '#b86fd0', '#6ea8e0', '#f08ab0'];
  const fl = [[60, 400], [120, 436], [200, 462], [40, 340], [88, 372], [320, 500], [660, 440], [712, 392], [610, 478], [690, 300], [736, 440], [250, 512]];
  fl.forEach(([x, y], k) => { const r = rnd(k * 17 + 2); let f = ''; f += '<ellipse cx="' + x + '" cy="' + (y + 4) + '" rx="16" ry="5" fill="#000" opacity=".08"/>';
    for (let n = 0; n < 6; n++) { const px = x + (r() - .5) * 26, py = y + (r() - .5) * 8, h = 7 + r() * 8; f += '<path d="M' + px.toFixed(1) + ' ' + py.toFixed(1) + 'v-' + h.toFixed(1) + '" stroke="#4f7d3a" stroke-width="1.6"/><circle cx="' + px.toFixed(1) + '" cy="' + (py - h).toFixed(1) + '" r="' + (2.6 + r() * 1.6).toFixed(1) + '" fill="' + (m >= 2 && m <= 9 ? cols[(k + n) % 6] : '#b9a77a') + '"/>'; } s += mv(x, y, f); });
  [[40, 470], [560, 508], [716, 500], [20, 250]].forEach(([x, y], k) => { s += mv(x, y, '<ellipse cx="' + x + '" cy="' + y + '" rx="12" ry="6.5" fill="#9a968a"/><ellipse cx="' + (x - 2) + '" cy="' + (y - 2) + '" rx="8" ry="4" fill="#b4b0a3"/>'); });
  // brouette
  s += mv(66, 258, '<g transform="translate(66 258)"><ellipse cx="2" cy="6" rx="22" ry="6" fill="#000" opacity=".15"/><path d="M-16 -2l26-8 8 8-26 10z" fill="#a8623a"/><path d="M-16 -2l26-8" stroke="#7a431f" stroke-width="2"/><circle cx="-14" cy="6" r="5" fill="#3a2b20"/><path d="M12 -8l16-6M14 0l16-6" stroke="#8a6240" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="-2" cy="-7" rx="9" ry="3" fill="#6a4e39"/></g>');
  return s;
}

function decorHouse(x, y, m) {
  const a = 36, b = 18, H = 40, A = 4, wl = '#efe3c9', wr = '#d5c3a0', r1 = '#c8553a', r2 = '#a3402c';
  const L = [x - a, y], R = [x + a, y], B = [x, y + b], T = [x, y - b];
  const up = (p, h) => [p[0], p[1] - h], ap = [x, y - H - 30];
  const f = p => p[0].toFixed(1) + ',' + p[1].toFixed(1);
  const ov = 1.14, Lo = [x - a * ov, y - H + 3], Ro = [x + a * ov, y - H + 3], Bo = [x, y + b * ov - H + 3];
  let s = '<ellipse cx="' + x + '" cy="' + (y + 8) + '" rx="' + (a + 16) + '" ry="' + (b + 7) + '" fill="#000" opacity=".16"/>';
  s += poly([f(L), f(B), f(up(B, H)), f(up(L, H))], wl) + poly([f(B), f(R), f(up(R, H)), f(up(B, H))], wr);
  // porte (face gauche) et fenêtre (face droite)
  s += poly([(x - 22) + ',' + (y + 5.5), (x - 12) + ',' + (y + 10.5), (x - 12) + ',' + (y - 14), (x - 22) + ',' + (y - 19)], '#7a5236');
  s += '<circle cx="' + (x - 14) + '" cy="' + (y - 3) + '" r="1.1" fill="#f1d28a"/>';
  s += poly([(x + 10) + ',' + (y + 4), (x + 25) + ',' + (y - 3.5), (x + 25) + ',' + (y - 20), (x + 10) + ',' + (y - 12.5)], '#8fc1d6', ' stroke="#7a5236" stroke-width="1.6"');
  s += '<path d="M' + (x + 17.5) + ' ' + (y + .2) + 'V' + (y - 16.5) + 'M' + (x + 10) + ' ' + (y - 4) + 'L' + (x + 25) + ' ' + (y - 11.8) + '" stroke="#7a5236" stroke-width="1.2"/>';
  // toit en pavillon
  s += poly([f(ap), f(Lo), f(Bo)], r1) + poly([f(ap), f(Bo), f(Ro)], r2);
  s += '<path d="M' + f(Lo) + 'L' + f(Bo) + 'L' + f(Ro) + '" fill="none" stroke="#7d3322" stroke-width="1.2"/>';
  // cheminée + fumée
  s += poly([(x + 14) + ',' + (y - H - 22), (x + 22) + ',' + (y - H - 18), (x + 22) + ',' + (y - H - 36), (x + 14) + ',' + (y - H - 40)], '#8b6a56');
  s += '<ellipse cx="' + (x + 18) + '" cy="' + (y - H - 38) + '" rx="4.6" ry="2.4" fill="#5e463a"/>';
  if (m <= 3 || m >= 9) s += '<g class="smoke" fill="#fff" opacity=".7"><circle cx="' + (x + 18) + '" cy="' + (y - H - 46) + '" r="3.4"/><circle cx="' + (x + 21) + '" cy="' + (y - H - 55) + '" r="4.6"/><circle cx="' + (x + 17) + '" cy="' + (y - H - 66) + '" r="5.6" opacity=".6"/></g>';
  return s;
}
const ATX = 122, ATY = 240;
function decorBarrel(x, y, ratio) {
  const w = 15, h = 24, lvl = clamp(ratio, 0, 1);
  return '<ellipse cx="' + x + '" cy="' + (y + 2) + '" rx="' + (w + 5) + '" ry="7" fill="#000" opacity=".18"/>' +
    '<path d="M' + (x - w) + ' ' + (y - h) + 'v' + h + 'a' + w + ' 6.5 0 0 0 ' + (2 * w) + ' 0v-' + h + 'z" fill="#7b5a3d"/>' +
    '<path d="M' + (x - w) + ' ' + (y - h * .62) + 'a' + w + ' 6.5 0 0 0 ' + (2 * w) + ' 0M' + (x - w) + ' ' + (y - h * .22) + 'a' + w + ' 6.5 0 0 0 ' + (2 * w) + ' 0" stroke="#4d3826" stroke-width="2" fill="none"/>' +
    '<ellipse cx="' + x + '" cy="' + (y - h) + '" rx="' + w + '" ry="6.5" fill="#4d3826"/><ellipse cx="' + x + '" cy="' + (y - h + (1 - lvl) * 2.4) + '" rx="' + (w - 2.2) + '" ry="4.6" fill="#4f9bd0" opacity="' + (.35 + lvl * .6).toFixed(2) + '"/>';
}
function decorTree(x, y, sc, m, seed, col) {
  const q = { id: 900 + seed, name: 'décor', strate: 'Arbre', col: col || '#d9383a', tags: [] };
  return '<g transform="translate(' + (x - 40 * sc).toFixed(1) + ' ' + (y - 66 * sc).toFixed(1) + ') scale(' + sc + ')">' + sprite(q, { stage: 'mature', prog: 1, ready: false, m, seed }) + '</g>';
}
function decorBush(x, y, sc, m, seed) {
  const q = { id: 950 + seed, name: 'décor', strate: 'Arbuste', col: '#d9383a', tags: [] };
  return '<g transform="translate(' + (x - 40 * sc).toFixed(1) + ' ' + (y - 66 * sc).toFixed(1) + ') scale(' + sc + ')">' + sprite(q, { stage: 'mature', prog: 1, ready: false, m, seed }) + '</g>';
}
function butterflies(n, m) {
  if (m < 3 || m > 9 || n <= 0) return '';
  const cols = ['#f2b13a', '#6ea8e0', '#f08a6b', '#fff3c4'];
  let s = '<g style="pointer-events:none">';
  for (let k = 0; k < n; k++) { const r = rnd(k * 31 + 7), x = 120 + r() * 520, y = 120 + r() * 260, c = cols[k % 4];
    s += '<g transform="translate(' + x.toFixed(0) + ' ' + y.toFixed(0) + ')"><g class="bfly" style="animation-delay:' + (-r() * 6).toFixed(1) + 's"><ellipse cx="-4" cy="0" rx="4.4" ry="3" fill="' + c + '" stroke="#5b4630" stroke-width=".6"/><ellipse cx="4" cy="0" rx="4.4" ry="3" fill="' + c + '" stroke="#5b4630" stroke-width=".6"/><path d="M0-2V3" stroke="#3a2b20" stroke-width="1.2"/></g></g>'; }
  return s + '</g>';
}

/* ---------- mobilier ---------- */
const FURN_INFO = {
  chemin: { n: 'Chemin', d: 'Un passage de gravier : tu soignes les plantes voisines sans piétiner le sol (+ croissance et rendement). Indispensable pour atteindre le cœur du jardin.', unit: 'une parcelle' },
  treille: { n: 'Treille', d: 'Un support pour les grimpantes voisines (haricot, pois, vigne, kiwi).' },
  pergola: { n: 'Pergola', d: 'Support pour les grimpantes voisines, et ombre fraîche l’été pour les plantes qui la préfèrent.' },
  serre: { n: 'Serre froide', d: 'Abrite ses voisines du gel (jusqu’à 4 °C de plus) et réchauffe le sol en hiver.' },
  mare: { n: 'Mare', d: 'Garde l’air humide, attire grenouilles et libellules (moins de limaces) et augmente la biodiversité.' },
  canard: { n: 'Canards coureurs indiens', d: 'Ces canards se tiennent debout comme des bouteilles et patrouillent toute la journée : ils mangent les limaces. Installe-les à la mare : les plantes dans un rayon de 3 parcelles sont presque à l’abri des attaques de limaces.' },
  trogne: { n: 'Trogne (arbre têtard)', d: 'Une technique de taille ancestrale : on coupe un arbre à hauteur d’homme, il repart en dizaines de rejets. Tous les 3 mois, tu récoltes les branches : +4 paillage et les plantes poussent 60 % plus vite pendant 20 jours (cumulable jusqu’à 60 jours). Touche un arbre au bord du jardin pour le former.' },
  grandeserre: { n: 'Grande serre', d: 'Une vraie serre : les plantes exotiques fragiles au froid (bananier, agrumes, curcuma…) y survivent, et ses voisines sont protégées du gel (jusqu’à 9 °C de plus). Elle donne aussi un coup de pouce de croissance l’hiver. Les plantes exotiques n’apparaissent dans les boosters qu’une fois la serre posée.' },
  ruche: { n: 'Ruche', d: 'Les abeilles pollinisent les fleurs voisines : plus de fruits pour les vivaces et les plantes gourmandes proches. Compte aussi dans la biodiversité.' }
};
const FURNK = ['chemin', 'treille', 'pergola', 'serre', 'grandeserre', 'mare', 'ruche'];
const TARGET = { ortie: 'Touche une plante : le purin agit sur elle et ses voisines.', prele: 'Touche une plante : la décoction protège elle et ses voisines.', oya: 'Touche la plante à arroser en continu.', mycor: 'Touche un arbre ou un arbuste.', nichoir: 'Touche un arbre pour y fixer le nichoir.' };
const INSTANT = ['atelier', 'sechoir', 'cuve', 'savoir', 'plan', 'bocaux'];
const dia = (cx, cy, k) => [(cx).toFixed(1) + ',' + (cy - TH * k).toFixed(1), (cx + TW * k).toFixed(1) + ',' + cy.toFixed(1), (cx).toFixed(1) + ',' + (cy + TH * k).toFixed(1), (cx - TW * k).toFixed(1) + ',' + cy.toFixed(1)];
function furnTile(k, cx, cy, m, seed, cell) {
  const R = rnd(seed * 11 + 3); let s = '';
  if (k === 'chemin') {
    s += poly(dia(cx, cy + 5, .98), '#9c8a66') + poly(dia(cx, cy + 3, .96), '#d9c9a2');
    for (let n = 0; n < 11; n++) { const a = R() * 6.28, d = R() * .62, x = cx + Math.cos(a) * d * TW * .9, y = cy + 3 + Math.sin(a) * d * TH * .9; s += '<ellipse cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" rx="' + (3 + R() * 3).toFixed(1) + '" ry="' + (1.6 + R() * 1.6).toFixed(1) + '" fill="' + (n % 3 ? '#bfae88' : '#efe5c6') + '" opacity=".9"/>'; }
    return s;
  }
  if (k === 'ruche') {
    s += poly(dia(cx, cy + 4, .9), '#7d9a52') + poly(dia(cx, cy + 3, .84), '#8fae5f');
    s += '<g stroke="#4f7d3a" stroke-width="2" fill="none" stroke-linecap="round"><path d="M' + (cx - 28) + ' ' + (cy + 8) + 'q-2 -10 1 -16M' + (cx + 26) + ' ' + (cy + 9) + 'q2 -10 -1 -17"/></g><circle cx="' + (cx - 27) + '" cy="' + (cy - 9) + '" r="3.2" fill="#f2b13a"/><circle cx="' + (cx + 25) + '" cy="' + (cy - 10) + '" r="3.2" fill="#f4f1ea"/>';
    s += '<rect x="' + (cx - 15) + '" y="' + (cy - 2) + '" width="4" height="9" fill="#6b4a2e"/><rect x="' + (cx + 11) + '" y="' + (cy - 2) + '" width="4" height="9" fill="#6b4a2e"/>';
    s += '<path d="M' + (cx - 17) + ' ' + (cy - 2) + 'v-12h34v12z" fill="#e8c36a" stroke="#a77d2a" stroke-width="1.6"/><path d="M' + (cx - 18) + ' ' + (cy - 14) + 'v-12h36v12z" fill="#f0d283" stroke="#a77d2a" stroke-width="1.6"/><path d="M' + (cx - 21) + ' ' + (cy - 26) + 'h42l-5 -10h-32z" fill="#c8553a" stroke="#8f3a28" stroke-width="1.4"/><rect x="' + (cx - 6) + '" y="' + (cy - 9) + '" width="12" height="3.6" rx="1.8" fill="#4a3526"/>';
    for (let n = 0; n < 4; n++) s += '<g class="bee b' + n + '"><ellipse cx="' + (cx - 14 + n * 9) + '" cy="' + (cy - 30 - (n % 2) * 8) + '" rx="3.2" ry="2.2" fill="#f2b13a"/><path d="M' + (cx - 14 + n * 9) + ' ' + (cy - 32 - (n % 2) * 8) + 'v4" stroke="#2b2018" stroke-width="1.2"/><ellipse cx="' + (cx - 14 + n * 9) + '" cy="' + (cy - 33.5 - (n % 2) * 8) + '" rx="2.4" ry="1.2" fill="#dff0f6" opacity=".8"/></g>';
    return s;
  }
  if (k === 'mare') {
    s += poly(dia(cx, cy + 6, .98), '#6d6a60') + poly(dia(cx, cy + 4, .94), '#a9a597');
    s += poly(dia(cx, cy + 4, .76), '#3f86b4') + poly(dia(cx, cy + 4, .62), '#5aa9d6');
    s += '<ellipse class="ripple" cx="' + (cx - 8) + '" cy="' + (cy + 3) + '" rx="12" ry="4.6" fill="none" stroke="#d8f0fb" stroke-width="1.4" opacity=".6"/><ellipse class="ripple r2" cx="' + (cx + 10) + '" cy="' + (cy + 7) + '" rx="9" ry="3.4" fill="none" stroke="#d8f0fb" stroke-width="1.2" opacity=".5"/>';
    s += '<ellipse cx="' + (cx + 12) + '" cy="' + (cy + 2) + '" rx="7" ry="2.8" fill="#4d9a4c"/><ellipse cx="' + (cx - 14) + '" cy="' + (cy + 9) + '" rx="5.4" ry="2.2" fill="#5fae58"/><circle cx="' + (cx + 14) + '" cy="' + (cy + 1) + '" r="2.3" fill="#f6b8cf"/>';
    for (let n = 0; n < 6; n++) { const x = cx - 38 + n * 3 + (n > 2 ? 52 : 0), y = cy + 6 - Math.abs(n - 2.5) * 2.6; s += '<path d="M' + x + ' ' + (y + 5) + 'q' + (n % 2 ? 2 : -2) + ' -14 ' + (n % 2 ? 4 : -3) + ' -22" stroke="#4f7d3a" stroke-width="2" fill="none" stroke-linecap="round"/>'; }
    if (cell && cell.ducks) [[-12, 6, '#f3e7cf', '#b8a67e'], [10, 2, '#c8a46a', '#8f7440']].forEach(([dx, dy, f, st], n) => { s += '<g class="duck d' + n + '" transform="translate(' + (cx + dx) + ' ' + (cy + dy) + ')"><ellipse cx="0" cy="2" rx="6" ry="2" fill="#000" opacity=".18"/><path d="M-4 0c-3-9 0-19 5-23 3-2 7-1 6 2-1 3-3 4-4 6 2 8 0 13-3 15z" fill="' + f + '" stroke="' + st + '" stroke-width=".9"/><path d="M7 -20l6 1.4-5.6 2z" fill="#e8892b"/><circle cx="5.4" cy="-21" r="1" fill="#2b2018"/></g>'; });
    s += '<ellipse cx="' + (cx - 26) + '" cy="' + (cy + 8) + '" rx="5" ry="3" fill="#8f8b7d"/><ellipse cx="' + (cx + 27) + '" cy="' + (cy + 6) + '" rx="4.2" ry="2.5" fill="#7f7b6e"/>';
    return s;
  }
  if (k === 'pergola') {
    const H = 58, left = [cx - TW * .86, cy + 1], right = [cx + TW * .86, cy + 1], top = [cx, cy - TH * .86 + 1], bot = [cx, cy + TH * .86 + 1];
    const post = (p, a) => '<rect x="' + (p[0] - 2.8) + '" y="' + (p[1] - H) + '" width="5.6" height="' + (H + 2) + '" rx="1.5" fill="' + (a ? '#7a5636' : '#966b45') + '"/>';
    s += poly(dia(cx, cy + 3, .98), '#8a6a4a') + poly(dia(cx, cy + 2, .93), '#b08a5a');
    s += '<g stroke="#8d6a45" stroke-width="1.2" opacity=".8"><path d="M' + (cx - 26) + ' ' + (cy - 3) + 'l26 13M' + (cx - 12) + ' ' + (cy - 10) + 'l26 13M' + (cx + 2) + ' ' + (cy - 17) + 'l26 13"/></g>';
    s += post(top, 1) + post(left, 1) + post(right, 0) + post(bot, 0);
    const ty = -H, A = [top[0], top[1] + ty], Bq = [right[0], right[1] + ty], C = [bot[0], bot[1] + ty], D = [left[0], left[1] + ty];
    s += poly([A, Bq, C, D].map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)), '#a07848', ' opacity=".28"');
    for (let n = 0; n <= 6; n++) { const t = n / 6, x1 = A[0] + (D[0] - A[0]) * t, y1 = A[1] + (D[1] - A[1]) * t, x2 = Bq[0] + (C[0] - Bq[0]) * t, y2 = Bq[1] + (C[1] - Bq[1]) * t; s += '<path d="M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + 'L' + x2.toFixed(1) + ' ' + y2.toFixed(1) + '" stroke="#7a5636" stroke-width="3.2" stroke-linecap="round"/>'; }
    s += '<path d="M' + A.join(' ') + 'L' + Bq.join(' ') + 'L' + C.join(' ') + 'L' + D.join(' ') + 'Z" fill="none" stroke="#6b4a2e" stroke-width="3.4" stroke-linejoin="round"/>';
    if (m >= 3 && m <= 10) for (let n = 0; n < 9; n++) { const x = A[0] - 40 + R() * 80, y = A[1] + 6 + R() * 24; s += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (3 + R() * 2.6).toFixed(1) + '" fill="' + (m >= 9 ? '#c7a24a' : '#5aa04c') + '" opacity=".9"/>'; }
    return s;
  }
  if (k === 'grandeserre') {
    const H = 40, a = .94, L = [cx - TW * a, cy + 2], Rr = [cx + TW * a, cy + 2], T = [cx, cy - TH * a + 2], B = [cx, cy + TH * a + 2];
    const up = (p, h) => [p[0], p[1] - h], f = p => p[0].toFixed(1) + ',' + p[1].toFixed(1);
    const ridgeA = [(T[0] + Rr[0]) / 2, (T[1] + Rr[1]) / 2 - H - 18], ridgeB = [(L[0] + B[0]) / 2, (L[1] + B[1]) / 2 - H - 18];
    s += poly(dia(cx, cy + 3, .99), '#7f6a4b') + poly(dia(cx, cy + 2, .92), '#5f4630');
    s += poly([f(up(T, H)), f(up(Rr, H)), f(Rr), f(T)], '#cfe6ee', ' opacity=".3"') + poly([f(up(T, H)), f(up(L, H)), f(L), f(T)], '#cfe6ee', ' opacity=".26"');
    const px = cx - 6, py = cy + 4;
    s += '<path d="M' + px + ' ' + py + 'q4-18 0-34" stroke="#7a5636" stroke-width="4" fill="none" stroke-linecap="round"/>';
    [[-18, -2], [18, -2], [-12, 9], [12, 9], [0, -13]].forEach(([dx, dy]) => { s += '<path d="M' + px + ' ' + (py - 34) + 'q' + dx + ' ' + (dy - 10) + ' ' + (dx * 1.5) + ' ' + (dy + 7) + '" stroke="#4f9a4a" stroke-width="4.5" fill="none" stroke-linecap="round"/>'; });
    s += '<ellipse cx="' + (cx + 20) + '" cy="' + (cy + 4) + '" rx="9" ry="4" fill="#6fae58"/><ellipse cx="' + (cx + 14) + '" cy="' + (cy - 6) + '" rx="8" ry="3.4" fill="#5fae58" transform="rotate(-24 ' + (cx + 14) + ' ' + (cy - 6) + ')"/><ellipse cx="' + (cx + 27) + '" cy="' + (cy - 5) + '" rx="8" ry="3.4" fill="#7dbb5c" transform="rotate(22 ' + (cx + 27) + ' ' + (cy - 5) + ')"/><circle cx="' + (cx + 20) + '" cy="' + (cy + 8) + '" r="2.6" fill="#f0b23a"/><circle cx="' + (cx - 20) + '" cy="' + (cy + 8) + '" r="2.8" fill="#e0603a"/><circle cx="' + (cx - 28) + '" cy="' + (cy + 5) + '" r="2.6" fill="#f0b23a"/>';
    s += poly([f(up(L, H)), f(up(B, H)), f(B), f(L)], '#dff0f6', ' opacity=".42"') + poly([f(up(B, H)), f(up(Rr, H)), f(Rr), f(B)], '#c3e0ea', ' opacity=".4"');
    s += poly([f(up(L, H)), f(up(B, H)), f(ridgeB)], '#e8f6fa', ' opacity=".5"') + poly([f(up(B, H)), f(up(Rr, H)), f(ridgeA), f(ridgeB)], '#dcf0f6', ' opacity=".45"');
    s += '<path d="M' + f(up(L, H)) + 'L' + f(up(B, H)) + 'L' + f(up(Rr, H)) + 'M' + f(L) + 'L' + f(B) + 'L' + f(Rr) + 'M' + f(up(B, H)) + 'V' + B[1].toFixed(1) + 'M' + f(up(L, H)) + 'V' + L[1].toFixed(1) + 'M' + f(up(Rr, H)) + 'V' + Rr[1].toFixed(1) + 'M' + f(up(L, H)) + 'L' + f(ridgeB) + 'L' + f(up(B, H)) + 'M' + f(ridgeB) + 'L' + f(ridgeA) + 'L' + f(up(Rr, H)) + '" stroke="#fff" stroke-width="2" fill="none" opacity=".9" stroke-linejoin="round"/>';
    return s;
  }
  if (k === 'serre') {
    const H = 26, a = .86, L = [cx - TW * a, cy + 2], Rr = [cx + TW * a, cy + 2], T = [cx, cy - TH * a + 2], B = [cx, cy + TH * a + 2];
    const up = (p, h) => [p[0], p[1] - h], f = p => p[0].toFixed(1) + ',' + p[1].toFixed(1);
    const ridgeA = [(T[0] + Rr[0]) / 2, (T[1] + Rr[1]) / 2 - H - 14], ridgeB = [(L[0] + B[0]) / 2, (L[1] + B[1]) / 2 - H - 14];
    s += poly(dia(cx, cy + 3, .98), '#7f6a4b') + poly(dia(cx, cy + 2, .9), '#6a4e39');
    s += poly([f(up(T, H)), f(up(Rr, H)), f(Rr), f(T)], '#cfe6ee', ' opacity=".28"') + poly([f(up(T, H)), f(up(L, H)), f(L), f(T)], '#cfe6ee', ' opacity=".25"');
    for (let n = 0; n < 4; n++) { const x = cx - 18 + n * 12, y = cy - 2 + (n % 2) * 6; s += '<path d="M' + x + ' ' + y + 'v-6" stroke="#4f9a4a" stroke-width="2" stroke-linecap="round"/><circle cx="' + x + '" cy="' + (y - 8) + '" r="3.4" fill="#7dbb5c"/>'; }
    s += poly([f(up(L, H)), f(up(B, H)), f(B), f(L)], '#dff0f6', ' opacity=".42"') + poly([f(up(B, H)), f(up(Rr, H)), f(Rr), f(B)], '#c3e0ea', ' opacity=".5"');
    s += poly([f(up(L, H)), f(up(B, H)), f(ridgeB)], '#e8f6fa', ' opacity=".5"') + poly([f(up(B, H)), f(up(Rr, H)), f(ridgeA), f(ridgeB)], '#dcf0f6', ' opacity=".55"');
    s += '<path d="M' + f(up(L, H)) + 'L' + f(up(B, H)) + 'L' + f(up(Rr, H)) + 'M' + f(L) + 'L' + f(B) + 'L' + f(Rr) + 'M' + f(up(B, H)) + 'V' + B[1].toFixed(1) + 'M' + f(up(L, H)) + 'L' + f(ridgeB) + 'L' + f(up(B, H)) + 'M' + f(ridgeB) + 'L' + f(ridgeA) + 'L' + f(up(Rr, H)) + 'M' + f(up(L, H)) + 'V' + L[1].toFixed(1) + 'M' + f(up(Rr, H)) + 'V' + Rr[1].toFixed(1) + '" stroke="#fff" stroke-width="2.2" fill="none" stroke-linejoin="round" stroke-linecap="round" opacity=".95"/>';
    return s;
  }
  // treille
  return '<g transform="translate(' + (cx - 40).toFixed(1) + ' ' + (cy - 62).toFixed(1) + ')">' + treille() + '</g>';
}

/* ---------- le jardinier et le chien ---------- */
const RING = .26;
const walk = { N: {}, ring: [] };
function rebuildWalk() {
  const N = {}, ring = [], add = (k, c, r) => { N[k] = { k, c, r, adj: [] }; return k; };
  const link = (a, b) => { if (!N[a] || !N[b] || a === b) return; if (!N[a].adj.includes(b)) N[a].adj.push(b); if (!N[b].adj.includes(a)) N[b].adj.push(a); };
  const seq = [[-RING, -RING]]; for (let c = 0; c < COLS; c++) seq.push([c + .5, -RING]); seq.push([COLS + RING, -RING]);
  for (let r = 0; r < ROWS; r++) seq.push([COLS + RING, r + .5]); seq.push([COLS + RING, ROWS + RING]);
  for (let c = COLS - 1; c >= 0; c--) seq.push([c + .5, ROWS + RING]); seq.push([-RING, ROWS + RING]);
  for (let r = ROWS - 1; r >= 0; r--) seq.push([-RING, r + .5]);
  const key = (c, r) => 'b' + c.toFixed(2) + '_' + r.toFixed(2);
  seq.forEach(([c, r]) => ring.push(add(key(c, r), c, r)));
  ring.forEach((k, n) => link(k, ring[(n + 1) % ring.length]));
  S.grid.forEach((cell, i) => { if (!cell || cell.furn !== 'chemin') return; const c = i % STR, r = (i / STR) | 0; if (c >= COLS || r >= ROWS) return; add('p' + i, c + .5, r + .5); });
  S.grid.forEach((cell, i) => { if (!cell || cell.furn !== 'chemin') return; const c = i % STR, r = (i / STR) | 0, k = 'p' + i; if (c >= COLS || r >= ROWS) return;
    if (c + 1 < COLS) link(k, 'p' + (i + 1)); if (r + 1 < ROWS) link(k, 'p' + (i + STR));
    if (r === 0) link(k, key(c + .5, -RING)); if (r === ROWS - 1) link(k, key(c + .5, ROWS + RING));
    if (c === 0) link(k, key(-RING, r + .5)); if (c === COLS - 1) link(k, key(COLS + RING, r + .5)); });
  { const KS = Math.min(1, 14 / (COLS + ROWS)), CGx = OX + (COLS - ROWS) / 2 * TW, CGy = OY + (COLS + ROWS) / 2 * TH;
    const ys = YARD.map(([X, Y], n) => { const xl = (X - 380) / KS + CGx, yl = (Y - 311) / KS + CGy, s1 = (xl - OX) / TW, s2 = (yl - OY) / TH; return add('y' + n, (s1 + s2) / 2, (s2 - s1) / 2); });
    ys.forEach((a, n) => ys.forEach((b, m) => { if (n < m && Math.hypot(N[a].c - N[b].c, N[a].r - N[b].r) < 2.6 / KS * .6 + 1.2) link(a, b); }));
    [ys[5], ys[3], ys[4]].forEach(a => { let best = null, bd = 1e9; ring.forEach(k => { const d = (N[k].c - N[a].c) ** 2 + (N[k].r - N[a].r) ** 2; if (d < bd) { bd = d; best = k; } }); link(a, best); }); }
  walk.N = N; walk.ring = ring;
}
function bfs(a, b) {
  const N = walk.N; if (!N[a] || !N[b]) return [];
  const prev = { [a]: null }, q = [a];
  while (q.length) { const u = q.shift(); if (u === b) break; for (const v of N[u].adj) if (!(v in prev)) { prev[v] = u; q.push(v); } }
  if (!(b in prev)) return []; const out = []; for (let u = b; u !== a; u = prev[u]) out.push(u); return out.reverse();
}
function nearestNode(c, r) { let best = null, bd = 1e9; for (const k in walk.N) { const n = walk.N[k], d = (n.c - c) ** 2 + (n.r - r) ** 2; if (d < bd) { bd = d; best = k; } } return best; }
const agents = {
  g: { who: 'g', c: -RING, r: 1.5, node: null, path: [], speed: .95, pause: 1.2, face: 1, act: null, actT: 0, el: null, fl: null },
  d: { who: 'd', c: -RING, r: 2.5, node: null, path: [], speed: 2.2, pause: .5, face: 1, act: null, actT: 0, el: null, fl: null }
};
[[0, .8], [2, 1.05]].forEach(([k, sp]) => { agents['f' + k] = { who: 'f', k, c: 0, r: 0, node: null, path: [], speed: sp, pause: 1 + k * 1.3, face: 1, act: null, actT: 0, el: null, fl: null }; });
const YARD = [[96, 204], [132, 218], [70, 220], [116, 236], [158, 218], [52, 238]];
const GARD = '<g class="flip"><g class="legs"><rect class="leg l1" x="-4.2" y="-13" width="3.8" height="13" rx="1.7" fill="#6b4a30"/><rect class="leg l2" x=".4" y="-13" width="3.8" height="13" rx="1.7" fill="#7a5636"/></g>' +
  '<rect x="-4.6" y="-1.8" width="4.6" height="2.6" rx="1.2" fill="#3a2b20"/><rect x=".2" y="-1.8" width="4.6" height="2.6" rx="1.2" fill="#3a2b20"/>' +
  '<rect x="-6.6" y="-27" width="13.2" height="16" rx="4.4" fill="#4f8f4c"/><rect x="-6.6" y="-15.5" width="13.2" height="4.4" rx="2" fill="#6a8f3a"/><rect x="-6.6" y="-20" width="13.2" height="2.2" fill="#3e7a3c" opacity=".6"/>' +
  '<rect class="arm a1" x="-9.8" y="-26" width="3.8" height="12" rx="1.9" fill="#4f8f4c"/><circle cx="-7.9" cy="-13.4" r="2.1" fill="#e8bf98"/>' +
  '<g class="carry"><path d="M8.4 -14.5h10.4l-1.6 8.6h-7.2z" fill="#b98a4c" stroke="#8a6234" stroke-width=".8"/><circle cx="11.6" cy="-15.4" r="2.4" fill="#d9483a"/><circle cx="15.6" cy="-15.2" r="2.2" fill="#e8892b"/><circle cx="13.6" cy="-16.8" r="2" fill="#7dbb5c"/></g>' +
  '<rect class="arm a2" x="6" y="-26" width="3.8" height="12" rx="1.9" fill="#4f8f4c"/><circle cx="8" cy="-13.4" r="2.1" fill="#e8bf98"/>' +
  '<circle cx="0" cy="-32" r="5.7" fill="#e8bf98"/><circle cx="2.3" cy="-32.4" r="1" fill="#3a2b20"/><path d="M-7 -34.6h14" stroke="#c8a24c" stroke-width="1"/>' +
  '<ellipse cx="0" cy="-35" rx="11.5" ry="3.6" fill="#e3c36a" stroke="#b8943c" stroke-width=".8"/><path d="M-5.8 -35.4c0-6.2 11.6-6.2 11.6 0z" fill="#ecd07e" stroke="#b8943c" stroke-width=".8"/><path d="M-5.8 -36.2h11.6" stroke="#c8553a" stroke-width="2.2"/></g>' +
  '<g class="pop"><circle cx="0" cy="-54" r="9.4" fill="var(--surface)" stroke="var(--line)" stroke-width="1.5"/><g class="pi" transform="translate(-6.5 -60.5) scale(.65)" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></g></g>';
const DOG = '<g class="flip"><path class="tail" d="M-9 -12c-5 -2 -7 -7 -5 -11" stroke="#c98e52" stroke-width="3.2" fill="none" stroke-linecap="round"/>' +
  '<rect class="leg l1" x="-7.4" y="-8" width="3" height="8" rx="1.4" fill="#b87a42"/><rect class="leg l2" x="-3.6" y="-8" width="3" height="8" rx="1.4" fill="#d9a064"/>' +
  '<ellipse cx="0" cy="-11" rx="10" ry="5.6" fill="#dca468"/><ellipse cx="-1" cy="-8.4" rx="6.4" ry="3" fill="#f3e2c4"/>' +
  '<rect class="leg l3" x="3.4" y="-8" width="3" height="8" rx="1.4" fill="#b87a42"/><rect class="leg l4" x="7" y="-8" width="3" height="8" rx="1.4" fill="#d9a064"/>' +
  '<g class="head"><circle cx="9" cy="-16.5" r="5.2" fill="#dca468"/><ellipse cx="13" cy="-14.8" rx="3.4" ry="2.5" fill="#f3e2c4"/><circle cx="15.6" cy="-15.4" r="1.2" fill="#2b2018"/><circle cx="10.6" cy="-17.6" r="1" fill="#2b2018"/><path d="M5.4 -21l-1.4 -4.4 4.4 2.2zM11.6 -21.6l2 -4.2 1.4 4.6z" fill="#a8672f"/></g></g>';
const SHIRT = ['#c8553a', '#3f7fb5', '#e0a23a', '#8a5aa6'], PANTS = ['#4a5a7a', '#6b4a30', '#5a7a5a', '#3a4a6a'];
function personSvg(k) {
  const sk = SKIN[k % 4], hr = HAIR[k % 4], sh = SHIRT[k % 4], pa = PANTS[k % 4], kid = k >= 2;
  return '<g transform="scale(' + (kid ? (k === 3 ? .72 : .84) : 1) + ')"><g class="flip"><rect class="leg l1" x="-4" y="-13" width="3.6" height="13" rx="1.7" fill="' + pa + '"/><rect class="leg l2" x=".4" y="-13" width="3.6" height="13" rx="1.7" fill="' + pa + '" opacity=".9"/>' +
    '<rect x="-4.6" y="-1.8" width="4.6" height="2.6" rx="1.2" fill="#3a2b20"/><rect x=".2" y="-1.8" width="4.6" height="2.6" rx="1.2" fill="#3a2b20"/>' +
    '<rect x="-6.4" y="-27" width="12.8" height="15.6" rx="4.4" fill="' + sh + '"/><rect class="arm a1" x="-9.6" y="-26" width="3.6" height="12" rx="1.8" fill="' + sh + '"/><circle cx="-7.8" cy="-13.4" r="2" fill="' + sk + '"/>' +
    '<rect class="arm a2" x="6" y="-26" width="3.6" height="12" rx="1.8" fill="' + sh + '"/><circle cx="7.8" cy="-13.4" r="2" fill="' + sk + '"/>' +
    '<circle cx="0" cy="-32" r="5.8" fill="' + sk + '"/><circle cx="2.3" cy="-32.4" r="1" fill="#3a2b20"/><path d="M-6 -33.5c0-6 12-6 12 0c-2-2.2-4-2.8-6-2.8s-4 .6-6 2.8z" fill="' + hr + '"/>' + (k === 0 ? '<path d="M-5.6 -33l-1 7" stroke="' + hr + '" stroke-width="2.6" stroke-linecap="round"/>' : '') + (k === 2 ? '<path d="M-5.6 -32l-2 8" stroke="' + hr + '" stroke-width="2.6" stroke-linecap="round"/>' : '') + '</g></g>';
}
function famOut() { const d = new Date(), h = d.getHours() + d.getMinutes() / 60; return (h >= 10 && h < 11) || (h >= 16 && h < 17); }
function famStep(a) {
  const out = famOut();
  if (!out) { if (!a.inside) { if (a.node === 'y0' && !a.path.length) a.inside = true; else { if (!(a.path.length && a.path[a.path.length - 1] === 'y0')) a.path = bfs(a.node, 'y0'); a.pause = 0; a.act = null; } } }
  else if (a.inside && walk.N.y0) { a.inside = false; a.node = 'y0'; a.c = walk.N.y0.c; a.r = walk.N.y0.r; a.path = []; a.pause = .4 + a.k * 1.6; }
}
function agentSvg(a) { if (a.who === 'f') return '<g class="chr person" data-who="f' + a.k + '"><ellipse cx="0" cy="1" rx="8" ry="3" fill="#000" opacity=".22"/>' + personSvg(a.k) + '</g>'; return '<g class="chr ' + (a.who === 'g' ? 'gardener' : 'doggy') + '" data-who="' + a.who + '"><ellipse cx="0" cy="1" rx="' + (a.who === 'g' ? 9 : 10) + '" ry="3.2" fill="#000" opacity=".22"/>' + (a.who === 'g' ? GARD : DOG) + '</g>'; }
function agentPos(a) { const k = a.node && walk.N[a.node]; const onPath = k && k.k[0] === 'p'; return [isoX(a.c, a.r), isoY(a.c, a.r) - (onPath ? 3 : 0)]; }
function placeAgent(a) {
  const gr = $('garden'); if (!gr) return;
  if (!a.el || !a.el.isConnected) { const tmp = document.createElementNS('http://www.w3.org/2000/svg', 'g'); tmp.innerHTML = agentSvg(a); a.el = tmp.firstChild; a.fl = null; }
  const back = $('gBack'), front = $('gFront'); if (!back || !front) return;
  const c = a.c, r = a.r; let target;
  const [dc, dr] = rot(c, r), [DW0, DH0] = dispDims();
  if (dr < 0 || dc < 0) target = back;
  else if (dr > DH0 || dc > DW0) target = front;
  else { const ci = Math.min(ROWS - 1, Math.floor(r)) * STR + Math.min(COLS - 1, Math.floor(c)), cellEl = gr.querySelector('.cell[data-i="' + ci + '"]'); if (cellEl) { if (cellEl.nextSibling !== a.el) cellEl.after(a.el); a.layerKey = 'i' + ci; return; } target = front; }
  const key = target === back ? 'back' : 'front';
  if (a.layerKey !== key || a.el.parentNode !== target) { target.appendChild(a.el); a.layerKey = key; }
}
function drawAgent(a) {
  if (!a.el) return; a.el.style.display = a.inside ? 'none' : ''; const [x, y] = agentPos(a), moving = !!a.path.length && a.pause <= 0;
  a.el.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')');
  const fl = a.fl || (a.fl = a.el.querySelector('.flip')); if (fl) fl.setAttribute('transform', a.face < 0 ? 'scale(-1 1)' : '');
  a.el.classList.toggle('walk', moving); a.el.classList.toggle('work', !!a.act && a.actT > 0); a.el.classList.toggle('rest', !moving && !a.act);
}
function mountChars() {
  rebuildWalk();
  for (const k in agents) { const a = agents[k]; if (a.who === 'f' && !a.node) { a.inside = !famOut(); a.node = 'y0'; a.c = walk.N[a.node].c; a.r = walk.N[a.node].r; } if (a.node && walk.N[a.node] && !a.path.length) { a.c = walk.N[a.node].c; a.r = walk.N[a.node].r; } if (!a.node || !walk.N[a.node]) { const n = nearestNode(a.c, a.r); a.node = n; a.c = walk.N[n].c; a.r = walk.N[n].r; a.path = []; a.act = null; }
    if (a.who === 'g' && a.act) setPop(a, a.act); a.el = null; placeAgent(a); drawAgent(a); }
}
const POPS = { prune: IC.prune, water: IC.drop, harvest: IC.basket, plant: IC.seed, mulch: IC.leaf, compost: IC.leaf };
function setPop(a, kind) { if (!a.el) return; const pi = a.el.querySelector('.pi'); if (pi) pi.innerHTML = POPS[kind] || ''; }
function sendGardener(i, kind) {
  const a = agents.g; if (!walk.N || !$('garden')) return;
  const c = i % STR, r = (i / STR) | 0, goal = nearestNode(c + .5, r + .5); if (!goal) return;
  a.path = bfs(a.node, goal); a.act = kind; a.actT = 1.8; a.pause = 0; setPop(a, kind);
}
function pickRoam(a) {
  const N = walk.N, keys = Object.keys(N);
  if (a.who === 'd') { const g = agents.g; if ((a.c - g.c) ** 2 + (a.r - g.r) ** 2 > 7 || Math.random() < .35) return g.node; return keys[Math.floor(Math.random() * keys.length)]; }
  if (a.who === 'f') { const L = keys.filter(k => k[0] === 'y'); return L[Math.floor(Math.random() * L.length)]; }
  // le jardinier va vers une plante qui a besoin de soin, sinon flâne
  const need = []; S.grid.forEach((c, i) => { if (c && !c.treille && (c.ready || c.water < 45)) need.push(i); });
  if (need.length && Math.random() < .7) { const i = need[Math.floor(Math.random() * need.length)]; a.act = S.grid[i].ready ? 'harvest' : 'water'; a.actT = 2.2; setPop(a, a.act); return nearestNode(i % STR + .5, ((i / STR) | 0) + .5); }
  return walk.ring[Math.floor(Math.random() * walk.ring.length)];
}
function stepAgent(a, dt) {
  if (a.pause > 0) { a.pause -= dt; return; }
  if (a.act && !a.path.length && a.actT > 0) { a.actT -= dt; if (a.actT <= 0) { a.act = null; a.pause = .3; } return; }
  if (!a.path.length) { const goal = pickRoam(a); a.path = goal && goal !== a.node ? bfs(a.node, goal) : []; if (!a.path.length) { a.pause = a.who === 'd' ? .4 + Math.random() * 1.2 : a.who === 'f' ? 1.5 + Math.random() * 3.5 : 1 + Math.random() * 2.2; return; } }
  const t = walk.N[a.path[0]]; if (!t) { a.path = []; return; }
  const dx = t.c - a.c, dy = t.r - a.r, d = Math.hypot(dx, dy), step = a.speed * dt;
  const sdx = dx - dy; if (Math.abs(sdx) > .01) a.face = sdx > 0 ? 1 : -1;
  if (d <= step) { a.c = t.c; a.r = t.r; a.node = a.path.shift(); if (!a.path.length) a.pause = a.who === 'd' ? .5 + Math.random() * 2 : (a.act ? 0 : .8 + Math.random() * 2); }
  else { a.c += dx / d * step; a.r += dy / d * step; }
}
let lastT = 0, animOn = false;
function tick(ts) {
  if (!lastT) lastT = ts; const dt = Math.min(.06, (ts - lastT) / 1000); lastT = ts;
  if (!document.hidden && $('garden') && walk.ring.length) { for (const k in agents) { const a = agents[k]; if (!a.el || !a.el.isConnected) continue; if (a.who === 'f') famStep(a); if (!a.inside) stepAgent(a, dt); placeAgent(a); drawAgent(a); } }
  requestAnimationFrame(tick);
}
function startChars() { if (animOn) return; animOn = true; try { if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return; } catch (e) {} requestAnimationFrame(tick); }

const BD = { limaces: ['#7a8a3a', 'snail', 'Soigner : limaces'], fongique: ['#a0527a', 'fungus', 'Soigner : maladie'], honey: ['#e0a21a', 'jar', 'Récolter le miel'], compost: ['#6a4e39', 'compost', 'Compost'], lawn: ['#6aa84f', 'mower', 'Tondre'], trogne: ['#8a5a34', 'saw', 'Couper la trogne'], water: ['var(--water)', 'drop', 'Arroser'], harvest: ['var(--sun)', 'basket', 'Récolter'], prune: ['#7a5aa6', 'prune', 'Tailler'], mulch: ['#b08a4a', 'straw', 'Pailler'] };
const TREES = [[470, 120, .62, 1], [530, 142, .78, 2], [600, 172, .9, 3], [676, 214, 1, 4], [716, 262, .8, 5]];
const LAWNS = [[80, 384], [152, 428], [232, 466], [326, 492], [524, 500], [612, 472], [690, 432], [728, 398]];
function lawnClick(k, el) { const pos = el && badgePos(el), ok = G.mowLawn(S, k); if (ok) toast('Herbe tondue : +2 paillage.'); else toast('L’herbe repousse : prête dans ' + Math.max(1, 14 - (S.day - S.lawn[k])) + ' jours.'); render(); if (ok) flyIcon('lawn', pos); }
function treeClick(k, el) {
  const t = S.trees[k], pos = el && badgePos(el);
  if (ui.mode && ui.mode.k === 'trogne' && !t.formed) { if (G.formTrogne(S, k)) { toast('Trogne formée : +4 paillage, la forêt pousse plus vite.'); if (!(S.mats.trogne > 0)) ui.mode = null; render(); flyIcon('trogne', pos); } return; }
  if (t.formed) { if (G.cutTrogne(S, k)) { toast('Trogne coupée : +4 paillage, croissance accélérée.'); render(); flyIcon('trogne', pos); } else toast('La trogne repousse : prête dans ' + Math.max(1, 90 - (S.day - t.last)) + ' jours.'); return; }
  toast('Un arbre ordinaire. Joue une carte Trogne pour le tailler en têtard.');
}
function lawnPatch(k, x, y, ready, gc) {
  const R = rnd(k * 13 + 5), dark = shade(gc[1], -34), mid = shade(gc[1], -16);
  let s = '<g class="lawn" data-k="' + k + '" role="button" tabindex="0" aria-label="Zone d’herbe' + (ready ? ', à tondre' : '') + '"><ellipse cx="' + x + '" cy="' + y + '" rx="38" ry="13" fill="' + shade(gc[1], ready ? -10 : 8) + '" opacity=".85"/>';
  const n = ready ? 26 : 10;
  for (let i = 0; i < n; i++) { const bx = x + (R() - .5) * 62, by = y + (R() - .5) * 16, h = ready ? 13 + R() * 11 : 3 + R() * 3, lean = (R() - .5) * 6; s += '<path d="M' + bx.toFixed(1) + ' ' + by.toFixed(1) + 'q' + (lean / 2).toFixed(1) + ' ' + (-h / 2).toFixed(1) + ' ' + lean.toFixed(1) + ' ' + (-h).toFixed(1) + '" stroke="' + (i % 3 ? dark : mid) + '" stroke-width="' + (ready ? 1.9 : 1.5) + '" fill="none" stroke-linecap="round"/>'; if (ready && i % 5 === 0) s += '<circle cx="' + (bx + lean).toFixed(1) + '" cy="' + (by - h).toFixed(1) + '" r="1.7" fill="#d9c97a"/>'; }
  return s + '<rect x="' + (x - 40) + '" y="' + (y - 28) + '" width="80" height="40" fill="transparent"/></g>';
}
function trogneArt(x, y, sc, m, k, t) {
  const p = Math.max(0, Math.min(1, (S.day - t.last) / 90)), leafy = m >= 3 && m <= 9, R = rnd(k * 29 + 3), lc = m >= 8 ? ['#c98a2f', '#d9a23e'] : ['#5aa04c', '#6bb35a'];
  let s = '<ellipse cx="' + x + '" cy="' + (y + 2) + '" rx="' + (22 * sc) + '" ry="' + (7 * sc) + '" fill="#000" opacity=".18"/><path d="M' + (x - 8 * sc) + ' ' + y + 'l' + (2 * sc) + ' ' + (-40 * sc) + 'h' + (12 * sc) + 'l' + (2 * sc) + ' ' + (40 * sc) + 'z" fill="#6b4a30"/><path d="M' + (x - 3 * sc) + ' ' + y + 'v' + (-38 * sc) + 'M' + (x + 3 * sc) + ' ' + y + 'v' + (-34 * sc) + '" stroke="#4f3622" stroke-width="' + (1.2 * sc) + '" fill="none"/><ellipse cx="' + x + '" cy="' + (y - 41 * sc) + '" rx="' + (11 * sc) + '" ry="' + (7 * sc) + '" fill="#5a3d26"/>';
  const L = (7 + 36 * p) * sc, n = 9;
  for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (i - (n - 1) / 2) * .27 + (R() - .5) * .08, l = L * (.8 + R() * .3), x1 = x + Math.cos(a) * 6 * sc, y1 = y - 43 * sc, x2 = x1 + Math.cos(a) * l, y2 = y1 + Math.sin(a) * l; s += '<path d="M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + 'L' + x2.toFixed(1) + ' ' + y2.toFixed(1) + '" stroke="#7a5636" stroke-width="' + (2.6 * sc).toFixed(1) + '" stroke-linecap="round"/>'; if (leafy) s += '<circle cx="' + x2.toFixed(1) + '" cy="' + y2.toFixed(1) + '" r="' + ((3 + 6 * p) * sc).toFixed(1) + '" fill="' + lc[i % 2] + '"/><circle cx="' + ((x1 + x2) / 2 + 2).toFixed(1) + '" cy="' + ((y1 + y2) / 2).toFixed(1) + '" r="' + ((2 + 4 * p) * sc).toFixed(1) + '" fill="' + lc[(i + 1) % 2] + '" opacity=".9"/>'; }
  return s;
}
function worldBadge(kind, x, y, k) { return '<g class="badge" data-badge="' + kind + '" data-k="' + k + '" transform="translate(' + x + ' ' + y + ')" role="button" aria-label="' + BD[kind][2] + '"><g class="bb"><circle class="bg" r="12" fill="' + BD[kind][0] + '" stroke="#fff" stroke-width="2.2"/><g transform="translate(-8 -8) scale(.8)" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + IC[BD[kind][1]] + '</g></g></g>'; }
let combo = { n: 0, t: 0 };

function badgePos(b) { try { const svg = $('garden'), r = b.getBoundingClientRect(), pt = svg.createSVGPoint(); pt.x = r.left + r.width / 2; pt.y = r.top + r.height / 2; const q = pt.matrixTransform(svg.getScreenCTM().inverse()); return [q.x, q.y]; } catch (e) { return null; } }
function flyIcon(kind, pos) {
  if (!pos) return; const svg = $('garden'); if (!svg) return; const now = Date.now(); combo.n = now - combo.t < 2600 ? combo.n + 1 : 1; combo.t = now;
  const col = BD[kind][0], ic = BD[kind][1];
  let s = '<g class="fly" transform="translate(' + pos[0].toFixed(1) + ' ' + pos[1].toFixed(1) + ')"><g class="flyin"><circle r="12" fill="' + col + '" stroke="#fff" stroke-width="2.4"/><g transform="translate(-9 -9) scale(.9)" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + IC[ic] + '</g></g>';
  for (let k = 0; k < 6; k++) { const a = k / 6 * 6.28; s += '<circle class="spk" r="2.4" fill="' + col + '" style="--dx:' + (Math.cos(a) * 26).toFixed(0) + 'px;--dy:' + (Math.sin(a) * 20 - 10).toFixed(0) + 'px"/>'; }
  if (combo.n >= 3) s += '<text class="combo" y="-24" text-anchor="middle">×' + combo.n + '</text>';
  s += '</g>'; const g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.innerHTML = s; const el = g.firstChild; svg.appendChild(el); setTimeout(() => el.remove(), 1100);
}
function renderGarden() {
  syncDims(); const [DW, DH] = dispDims(), { KS, CGx, CGy } = kview(DW, DH);
  const m = G.dateOf(S.day).m, se = SEASON(m), gc = GROUND[se], w = S.w, st = G.stats(S);
  let h = '<defs><linearGradient id="gg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + gc[0] + '"/><stop offset="1" stop-color="' + gc[1] + '"/></linearGradient></defs>';
  h += '<rect x="-400" y="-300" width="1560" height="1140" fill="url(#gg)"/>';
  for (let k = 0; k < 90; k++) { const r = rnd(k + 5), x = r() * 760, y = r() * 540; h += '<path d="M' + x.toFixed(0) + ' ' + y.toFixed(0) + 'l-2-5M' + x.toFixed(0) + ' ' + y.toFixed(0) + 'l2-6" stroke="' + shade(gc[1], -24) + '" stroke-width="1.4" stroke-linecap="round" opacity=".35"/>'; }
  // fond : arbres et haies
  LAWNS.forEach(([x, y], k) => { h += mv(x, y, lawnPatch(k, x, y, G.lawnReady(S, k), gc)); });
  TREES.forEach(([x, y, sc, sd], k) => { const t = S.trees[k], pick = ui.mode && ui.mode.k === 'trogne' && !t.formed; h += '<g class="tree' + (pick ? ' pick' : '') + '" data-tree="' + k + '" role="button" tabindex="0" aria-label="' + (t.formed ? 'Trogne' : 'Arbre') + '"' + (VROT ? ' transform="translate(' + (wpos(x, y)[0] - x).toFixed(1) + ' ' + (wpos(x, y)[1] - y).toFixed(1) + ')"' : '') + '>' + (t.formed ? trogneArt(x, y, sc, m, k, t) : decorTree(x, y, sc, m, sd, sd % 2 ? '#d9383a' : '#e8a43a')) + (pick ? '<circle cx="' + x + '" cy="' + (y - 60 * sc) + '" r="13" fill="var(--leaf)" opacity=".92"/><path d="M' + x + ' ' + (y - 60 * sc - 7) + 'v14M' + (x - 7) + ' ' + (y - 60 * sc) + 'h14" stroke="#fff" stroke-width="3" stroke-linecap="round"/>' : '') + '</g>'; });
  [[250, 118], [292, 128], [210, 132], [610, 108], [650, 130]].forEach(([x, y], k) => { h += mv(x, y, decorBush(x, y, .56, m, k)); });
  h += decorExtras(m) + mv(104, 176, decorHouse(104, 176, m)) + mv(170, 192, decorBarrel(170, 192, S.tank / S.tankMax)) + [[198, 202], [152, 206], [218, 214]].slice(0, Math.max(0, S.cuves || 0)).map(([bx, by]) => mv(bx, by, decorBarrel(bx, by, S.tank / S.tankMax))).join('') + (S.atelier ? mv(ATX, ATY, decorAtelier(ATX, ATY, S.sechoir, (S.mats.bocaux || 0) > 0 || S.stock.some(it => it.keep === 'bocal'))) : '');
  // plateforme graviers
  const cs = [[-.4, -.4], [COLS + .4, -.4], [COLS + .4, ROWS + .4], [-.4, ROWS + .4]];
  h += '<g id="gGrid" transform="translate(380 311) scale(' + KS.toFixed(4) + ') translate(' + (-CGx).toFixed(1) + ' ' + (-CGy).toFixed(1) + ')">';
  const P0 = cs.map(([c, r]) => [isoX(c, r), isoY(c, r)]);
  { const Lp = P0.reduce((p, q) => q[0] < p[0] ? q : p), Rp = P0.reduce((p, q) => q[0] > p[0] ? q : p), Bp = P0.reduce((p, q) => q[1] > p[1] ? q : p);
    h += poly([Lp.join(','), Bp.join(','), Bp[0] + ',' + (Bp[1] + PT), Lp[0] + ',' + (Lp[1] + PT)], '#8a6b4a') + poly([Bp.join(','), Rp.join(','), Rp[0] + ',' + (Rp[1] + PT), Bp[0] + ',' + (Bp[1] + PT)], '#6e5338'); }
  h += poly(P0.map(p => p.join(',')), '#d8c79f') + poly(P0.map(p => p.join(',')), 'none', ' stroke="#b8a37a" stroke-width="2"');
  h += '<g id="gBack"></g>';
  const picking = ui.mode && ui.mode.type === 'plant', tre = ui.mode && ui.mode.type === 'mat' && FURNK.includes(ui.mode.k);
  const dry = c => c.water < 25;
  const order = []; for (let s = 0; s < DW + DH - 1; s++) for (let rr = 0; rr < DH; rr++) { const cc = s - rr; if (cc >= 0 && cc < DW) { const q = irot(cc + .5, rr + .5); order.push([Math.floor(q[0]), Math.floor(q[1])]); } }
  const centers = {};
  for (const [c, r] of order) {
    const i = r * STR + c, cell = S.grid[i], free = !cell, lift = BH;
    const a = c + INS, b2 = c + 1 - INS, rr0 = r + INS, rr1 = r + 1 - INS;
    const cor = [[a, rr0], [b2, rr0], [b2, rr1], [a, rr1]].map(([x, y]) => [isoX(x, y), isoY(x, y) - lift]), T = cor.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1));
    const Lc = cor.reduce((p, q) => q[0] < p[0] ? q : p), Rc = cor.reduce((p, q) => q[0] > p[0] ? q : p), Bc = cor.reduce((p, q) => q[1] > p[1] ? q : p), up = p => p[0].toFixed(1) + ',' + p[1].toFixed(1), dn = p => p[0].toFixed(1) + ',' + (p[1] + lift).toFixed(1);
    const cx = isoX(c + .5, r + .5), cyTop = isoY(c + .5, r + .5) - lift; centers[i] = [cx, cyTop];
    const fk = cell && cell.treille ? (cell.furn || 'treille') : null, flat = fk && fk !== 'treille';
    const soilTop = free ? '#8a6a4a' : fk ? '#8a6a4a' : (() => { const base = mix('#5c4433', '#b09a74', 1 - cell.water / 100), sc = STRC[P[cell.pid].strate]; if (!sc) return base; const t = ui.strF ? (ui.strF === P[cell.pid].strate ? .78 : 0) : .5; return mix(base, sc, t); })();
    const climbPick = picking && P[ui.mode.pid].strate === 'Grimpante' && fk && (fk === 'treille' || fk === 'pergola'), duckPick = ui.mode && ui.mode.k === 'canard' && fk === 'mare' && !cell.ducks;
    const relT = ui.tool === 'reloc' && ui.mvFrom >= 0 && ui.mvFrom !== i && G.moveCheck(S, ui.mvFrom, i).ok, cls = 'cell ' + (free ? 'free ' : '') + ((picking || tre) && free || climbPick || duckPick || relT || (free && ui.planHl && ui.planHl.includes(i)) ? 'pick ' : '') + (ui.sel === i ? 'sel' : '') + (ui.delPending === i ? ' delp' : '');
    let lab = free ? 'Parcelle libre' : fk ? FURN_INFO[fk].n : P[cell.pid].name;
    h += '<g class="' + cls + '" data-i="' + i + '" tabindex="0" role="button" aria-label="' + lab + ', colonne ' + (c + 1) + ' rangée ' + (r + 1) + '">';
    // faces latérales du bac
    if (!flat) { h += poly([up(Lc), up(Bc), dn(Bc), dn(Lc)], '#7a5a3c') + poly([up(Bc), up(Rc), dn(Rc), dn(Bc)], '#5f4630'); h += poly(T, soilTop); }
    if (free) h += '<path d="M' + (cx - 20) + ' ' + (cyTop + 1) + 'l9-3M' + (cx + 4) + ' ' + (cyTop - 4) + 'l10 3M' + (cx - 6) + ' ' + (cyTop + 7) + 'l10-3" stroke="#6e5238" stroke-width="2" stroke-linecap="round" opacity=".6"/>';
    if (cell && !cell.treille) {
      const p = P[cell.pid], ph = G.phase(cell);
      if (cell.supp) h += furnTile(cell.supp, cx, cell.supp === 'treille' ? cyTop : isoY(c + .5, r + .5), m, i);
      if (cell.mulch) h += '<ellipse cx="' + cx + '" cy="' + (cyTop + 1) + '" rx="32" ry="13" fill="#b4894f" opacity=".85"/><path d="M' + (cx - 20) + ' ' + cyTop + 'l8-2M' + (cx + 6) + ' ' + (cyTop + 5) + 'l9-1M' + (cx - 4) + ' ' + (cyTop - 4) + 'l6 1" stroke="#7a5a35" stroke-width="2" stroke-linecap="round"/>';
      h += '<ellipse cx="' + (cx + 6) + '" cy="' + (cyTop + 1) + '" rx="' + (ph.stage === 'graine' ? 14 : 24) + '" ry="8" fill="#000" opacity=".2"/>';
      { const sc = STRS[p.strate] || 1, dim = ui.strF && ui.strF !== p.strate;
        h += '<g class="spr' + (dim ? ' dim' : '') + '" transform="translate(' + (cx - 40 * sc).toFixed(1) + ' ' + (cyTop + 3 - 66 * sc).toFixed(1) + ') scale(' + sc + ')"' + (cell.stress > 7 ? ' opacity=".8"' : '') + '>' + sprite(p, { stage: ph.stage, prog: ph.prog, ready: cell.ready, m, dry: dry(cell), seed: i }) + '</g>';
        if (cell.nichoir) h += '<g transform="translate(' + (cx + 11 * sc).toFixed(1) + ' ' + (cyTop - 34 * sc).toFixed(1) + ')"><path d="M0 -14v7" stroke="#6b4a2e" stroke-width="1.2"/><path d="M-4.5 -7v10h9v-10z" fill="#c9a574" stroke="#8a6240" stroke-width=".8"/><path d="M-7 -7l7-6 7 6z" fill="#a3402c"/><circle cx="0" cy="-2" r="1.7" fill="#2b2018"/></g>';
        if (cell.oyaUntil > S.day) h += '<g transform="translate(' + (cx - 17) + ' ' + (cyTop + 5) + ')"><ellipse cx="0" cy="3" rx="6.4" ry="2.2" fill="#000" opacity=".22"/><path d="M-4.4 3c-3.4-5.4 0-9.6 4.4-9.6s7.8 4.2 4.4 9.6z" fill="#c8764a" stroke="#a85a34" stroke-width=".8"/><rect x="-2.4" y="-9.4" width="4.8" height="3.2" rx="1.2" fill="#a85a34"/></g>';
      }
    } else if (fk) {
      h += furnTile(fk, cx, flat ? isoY(c + .5, r + .5) : cyTop, m, i, cell);
      if (climbPick || duckPick) h += '<circle cx="' + cx + '" cy="' + (cyTop - 30) + '" r="11" fill="var(--leaf)" opacity=".92"/><path d="M' + cx + ' ' + (cyTop - 36) + 'v12M' + (cx - 6) + ' ' + (cyTop - 30) + 'h12" stroke="#fff" stroke-width="2.8" stroke-linecap="round"/>';
    } else if (picking || tre || relT || (ui.planHl && ui.planHl.includes(i))) h += '<path d="M' + cx + ' ' + (cyTop - 8) + 'v16M' + (cx - 8) + ' ' + cyTop + 'h16" stroke="var(--leaf)" stroke-width="3.5" stroke-linecap="round" opacity=".9"/>';
    h += '<polygon class="frame" points="' + T.join(' ') + '"/><polygon points="' + [pt(c, r, lift), pt(c + 1, r, lift), pt(c + 1, r + 1, lift), pt(c, r + 1, lift)].join(' ') + '" fill="transparent"/></g>';
  }
  h += '<g id="gFront"></g>';
  if (ui.sel >= 0 && S.grid[ui.sel] && !S.grid[ui.sel].treille) {
    const sy = G.synergy(S, ui.sel), A = centers[ui.sel];
    sy.notes.forEach(n => n.froms.forEach(j => { if (j < 0) return; const good = n.t === 'good', Bq = centers[j];
      h += '<g style="pointer-events:none"><path d="M' + A[0] + ' ' + A[1] + 'L' + Bq[0] + ' ' + Bq[1] + '" stroke="' + (good ? 'var(--leaf)' : 'var(--fruit)') + '" stroke-width="3.5" stroke-dasharray="' + (good ? '1 7' : '7 6') + '" stroke-linecap="round" opacity=".95"/><circle cx="' + Bq[0] + '" cy="' + (Bq[1] - 40) + '" r="9" fill="' + (good ? 'var(--leaf)' : 'var(--fruit)') + '"/><path d="' + (good ? 'M-3.5 0L-1 2.5L4 -2.5' : 'M-3 -3L3 3M3 -3L-3 3') + '" transform="translate(' + Bq[0] + ' ' + (Bq[1] - 40) + ')" stroke="' + (good ? 'var(--on-leaf)' : 'var(--on-fruit)') + '" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>'; }));
    const pn = P[S.grid[ui.sel].pid].name, tw = pn.length * 6.6 + 18;
    h += '<g style="pointer-events:none"><rect x="' + (A[0] - tw / 2).toFixed(1) + '" y="' + (A[1] + 10) + '" width="' + tw.toFixed(1) + '" height="20" rx="10" fill="var(--ink)" opacity=".88"/><text x="' + A[0] + '" y="' + (A[1] + 24) + '" text-anchor="middle" font-family="var(--font-b)" font-size="12" font-weight="600" fill="var(--bg)">' + pn + '</text></g>';
  }
  const badge = (kind, bx, by, urgent, i, k) => '<g class="badge" data-badge="' + kind + '" data-i="' + i + '" transform="translate(' + bx + ' ' + by + ') scale(' + (1 / KS).toFixed(3) + ')" role="button" aria-label="' + BD[kind][2] + '"><g class="bb" style="animation-delay:-' + ((i * 7 + k * 3) % 10) / 10 + 's"><circle class="bg" r="11" fill="' + BD[kind][0] + '" stroke="' + (urgent ? 'var(--fruit)' : '#fff') + '" stroke-width="' + (urgent ? 3.2 : 2) + '"/><g transform="translate(-7.5 -7.5) scale(.75)" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + IC[BD[kind][1]] + '</g></g></g>';
  const okM = [], okC = []; S.grid.forEach((c, i) => { if (!c || c.treille) return; const p = P[c.pid]; if (p.strate === 'Couvre-sol') return; if (!c.mulch && S.mats.paillage > 0) okM.push(i); if (S.mats.compost > 0 && S.day > (c.compostUntil || -1) && G.phase(c).stage !== 'graine') okC.push(i); });
  const byH = (a, b) => S.grid[a].health - S.grid[b].health, setM = new Set(okM.sort(byH).slice(0, Math.max(3, S.mats.paillage))), setC = new Set(okC.sort(byH).slice(0, Math.max(2, S.mats.compost * 2)));
  S.grid.forEach((cell, i) => { if (!cell || cell.treille) return; const [cx, cy] = centers[i], p = P[cell.pid], tall = p.strate === 'Arbre' ? 80 : p.strate === 'Grimpante' ? 52 : p.strate === 'Arbuste' ? 42 : p.strate === 'Racine' ? 26 : 30;
    if (ui.strF && ui.strF !== p.strate) return;
    const L = []; if (cell.sick) L.push([cell.sick.k, 1]); if (cell.ready) L.push(['harvest', 0]); if (cell.water < 60) L.push(['water', cell.water < 25]); if (G.needsPrune(S, cell)) L.push(['prune', 0]); if (setM.has(i)) L.push(['mulch', 0]); if (setC.has(i)) L.push(['compost', 0]); L.splice(4);
    L.forEach(([kd, urg], k) => { h += badge(kd, cx + (L.length === 1 ? 0 : (k % 2 ? 15 : -15)), cy - tall - Math.floor(k / 2) * 25, urg, i, k); }); });
  S.grid.forEach((cell, i) => { if (cell && cell.furn === 'ruche' && G.honeyReady(S, i)) { const [cx, cy] = centers[i]; h += badge('honey', cx, cy - 58, 1, i, 0); } });
  h += '</g>';
  LAWNS.forEach(([x, y], k) => { if (G.lawnReady(S, k)) { const q = wpos(x, y - 36); h += worldBadge('lawn', q[0].toFixed(1), q[1].toFixed(1), k); } });
  TREES.forEach(([x, y, sc], k) => { if (G.treeReady(S, k)) { const q = wpos(x, y - 92 * sc); h += worldBadge('trogne', q[0].toFixed(1), q[1].toFixed(1), k); } });
  h += butterflies(Math.floor(st.biodiv / 22), m);
  if (w.rain >= 1) { h += '<g class="rain" style="pointer-events:none">'; for (let k = 0; k < 90; k++) { const r = rnd(k + 99), x = r() * 780, y = r() * 550; h += '<line x1="' + x.toFixed(0) + '" y1="' + y.toFixed(0) + '" x2="' + (x - 5).toFixed(0) + '" y2="' + (y + 13).toFixed(0) + '"/>'; } h += '</g><rect x="-400" y="-300" width="1560" height="1140" fill="#35506b" opacity=".12" style="pointer-events:none"/>'; }
  if (w.tmin < 0) h += '<rect x="-400" y="-300" width="1560" height="1140" fill="#dcecff" opacity=".24" style="pointer-events:none"/>';
  h += '<rect x="-400" y="-300" width="1560" height="1140" style="fill:var(--dim);pointer-events:none"/>';
  $('garden').innerHTML = h;
  const hint = $('hint');
  if (ui.tool === 'reloc' && !ui.mode) hint.innerHTML = '<span><b>Déplacer une plante :</b> ' + (ui.mvFrom >= 0 ? 'touche maintenant une parcelle libre (en surbrillance).' : 'touche la plante à déplacer.') + ' Un arbre ou arbuste déplacé a besoin de repos.</span><button type="button" class="btn sm" data-act="tool-select">Terminer</button>';
  else if (ui.tool === 'move' && !ui.mode) hint.innerHTML = '<span><b>Déplacer :</b> glisse la carte pour te déplacer. Molette ou boutons + / − pour zoomer, flèches rondes pour tourner autour du jardin.</span><button type="button" class="btn sm" data-act="tool-select">Terminer</button>';
  else if (ui.tool === 'delete' && !ui.mode) hint.innerHTML = '<span><b>Supprimer :</b> touche une plante ou un meuble, puis touche-le encore pour confirmer.</span><button type="button" class="btn sm" data-act="tool-select">Terminer</button>';
  else if (ui.mode && ui.mode.type === 'plant') { const p = P[ui.mode.pid]; hint.innerHTML = '<span>Choisis une parcelle libre' + (p.strate === 'Grimpante' ? ' ou une <b>treille / pergola</b>' : '') + ' pour <b>' + p.name.toLowerCase() + '</b>. ' + sw(p) + ' : ' + G.monthRange(p.semis) + '.</span><button type="button" class="btn sm" data-act="cancel">Annuler</button>'; }
  else if (ui.mode) { const k = ui.mode.k; hint.innerHTML = '<span>' + (k === 'canard' ? 'Touche une <b>mare</b> pour y installer les canards.' : k === 'trogne' ? 'Touche un arbre au bord du jardin pour le tailler en <b>trogne</b>.' : TARGET[k] ? TARGET[k] : FURNK.includes(k) ? 'Touche une parcelle libre pour poser : <b>' + FURN_INFO[k].n.toLowerCase() + '</b>.' : 'Touche une plante pour lui donner du <b>' + k + '</b>.') + '</span><button type="button" class="btn sm" data-act="cancel">Annuler</button>'; }
  else hint.innerHTML = '<span>Touche une plante pour voir sa fiche et ses voisines. Goutte = elle a soif. Panier = prête à récolter. Les papillons viennent avec la biodiversité. Trace des chemins pour atteindre le cœur du jardin.</span>';
}

/* ---------- réserve ---------- */
function renderTray() {
  const m = G.dateOf(S.day).m, ids = Object.keys(S.cards).map(Number).sort((a, b) => (G.sowable(P[b], m) - G.sowable(P[a], m)) || P[a].name.localeCompare(P[b].name, 'fr'));
  const un = G.unlocked(S), nextU = Object.keys(G.UNLOCK).filter(k => !un.has(k)).sort((a, b) => G.UNLOCK[a] - G.UNLOCK[b])[0];
  $('trayInfo').textContent = ids.length ? ids.reduce((a, id) => a + S.cards[id], 0) + ' cartes' + (nextU ? ' · ' + nextU.toLowerCase() + 's dès ' + G.UNLOCK[nextU] + ' plantations (' + Math.min(S.plantings, G.UNLOCK[nextU]) + '/' + G.UNLOCK[nextU] + ')' : '') : (nextU ? nextU.toLowerCase() + 's dès ' + G.UNLOCK[nextU] + ' plantations (' + Math.min(S.plantings, G.UNLOCK[nextU]) + '/' + G.UNLOCK[nextU] + ')' : '');
  $('strip').innerHTML = ids.length ? ids.map(id => cardHtml(P[id], { btn: true, count: S.cards[id], on: ui.mode && ui.mode.type === 'plant' && ui.mode.pid === id })).join('') : '<p class="empty">Aucune carte en réserve. Ouvre le booster du jour pour en recevoir.</p>';
}

/* ---------- tâches ---------- */
function renderToday() {
  const T = G.buildTasks(S), done = S.doneToday.day === S.day ? S.doneToday.n : 0;
  let h = '<h2>Aujourd’hui<small>' + done + ' action' + (done > 1 ? 's' : '') + ' faite' + (done > 1 ? 's' : '') + '</small></h2>';
  if (T.caughtUp) h += '<div class="done-box"><h3>Ton jardin est à jour.</h3><p>Tout ce qui presse est fait. Le prochain booster t’attend demain.</p><button type="button" class="btn primary" data-act="next">Passer au lendemain</button></div>';
  const names = ['Urgent', 'À faire', 'Si tu as le temps'];
  [0, 1, 2].forEach(pr => { const L = T.tasks.filter(t => t.prio === pr); if (!L.length) return; h += '<div class="grp">' + names[pr] + '</div>' + L.map(t => '<button type="button" class="task p' + pr + '" data-act="task" data-id="' + t.id + '"><span class="disc">' + ico(t.icon) + '</span><span><b>' + t.label + '</b><span class="sub">' + t.sub + '</span></span></button>').join(''); });
  if (T.hidden) h += '<p class="note-p">' + T.hidden + ' tâche' + (T.hidden > 1 ? 's' : '') + ' optionnelle' + (T.hidden > 1 ? 's' : '') + ' mise' + (T.hidden > 1 ? 's' : '') + ' de côté.</p>';
  if (!T.caughtUp) h += '<div style="margin-top:8px"><button type="button" class="btn sm" data-act="next">Terminer la journée</button></div>';
  $('today').innerHTML = h;
}

/* ---------- fiche ---------- */
function dur(days) { return days < 60 ? Math.max(1, Math.round(days)) + ' jours' : days < 730 ? Math.round(days / 30) + ' mois' : fmt(days / 365) + ans(days); }
const ans = () => ' ans';
function renderFiche() {
  const el = $('fiche'), i = ui.sel, c = i >= 0 ? S.grid[i] : null, m = G.dateOf(S.day).m;
  if (i < 0) { el.innerHTML = '<h2>Parcelle</h2><p class="empty-f">Touche une plante pour voir ses besoins, ses voisines et ce qu’elle apporte à la guilde.</p>'; return; }
  if (!c) { el.innerHTML = '<h2>Parcelle libre</h2><p class="empty-f">Choisis une carte dans ta réserve pour semer ou planter ici. Seules les plantes de saison peuvent être mises en terre.</p>'; return; }
  if (c.treille) { const k = c.furn || 'treille', inf = FURN_INFO[k]; el.innerHTML = '<div class="fiche"><h2>' + inf.n + '</h2><p class="note-p">' + inf.d + '</p>' + (k === 'mare' ? '<p class="note-p">' + (c.ducks ? 'Deux canards coureurs indiens y vivent : les plantes à 3 parcelles ou moins craignent beaucoup moins les limaces.' : 'Pas encore de canards. ' + (S.mats.canard > 0 ? 'Choisis la carte Canards dans ton matériel, puis touche la mare.' : 'Une carte Canards arrive dans les boosters.')) + '</p>' : '') + (k === 'ruche' ? '<p class="note-p">' + (G.honeyReady(S, i) ? 'Le miel est prêt !' : 'Miel : récolte possible de mai à septembre, toutes les 6 semaines environ.') + '</p>' : '') + '<div class="acts"><button type="button" class="btn sm warn" data-act="remove">' + (ui.confirmDel ? 'Confirmer : reprendre la carte' : 'Reprendre en main') + '</button></div></div>'; return; }
  const p = P[c.pid], ph = G.phase(c), sy = G.synergy(S, i), rdy = c.ready;
  let state;
  if (ph.stage === 'graine') state = 'Graine en terre, elle germe dans ' + dur(Math.max(1, p.germ - c.g));
  else if (ph.stage === 'pousse') state = 'Jeune pousse';
  else if (ph.stage === 'croissance') state = 'En croissance, mature dans ' + dur(Math.max(1, ph.total - c.g));
  else if (ph.stage === 'jeune') state = 'Jeune plant, première récolte dans ' + dur(ph.left);
  else if (rdy) state = 'Prête à récolter';
  else state = p.recolte.length ? 'Mature, récolte en ' + G.monthRange(p.recolte) : 'Installée, elle travaille pour le sol';
  const perYear = p.kg > 0 ? p.kg * (p.kind === 'continue' ? p.recolte.length / 12 * 2.2 : 1) * (1 + sy.yield) : 0;
  const bar = (v, cls) => '<div class="bar ' + cls + '"><i style="width:' + clamp(v, 0, 100) + '%"></i></div>';
  const eauT = ['', 'sobre en eau', 'besoin d’eau modéré', 'gourmande en eau'][p.eau];
  let h = '<div class="fiche"><div class="head"><div class="art phs"><svg viewBox="-8 -30 96 112" aria-hidden="true"><ellipse cx="40" cy="66" rx="30" ry="9" fill="#6a4e39" opacity=".35"/>' + sprite(p, { stage: ph.stage, prog: ph.prog, ready: rdy, m, dry: c.water < 25, seed: i }) + '</svg></div><div class="phslot" data-pid="' + p.id + '">' + phImg(p) + '</div><div><h2>' + p.name + '</h2><div class="lat">' + p.latin + '</div>' + (p.est ? '<span class="est" title="Valeurs de semis, de récolte et de rendement proposées pour le prototype. À vérifier par un jardinier.">Valeurs estimées, à vérifier</span>' : '') + '</div></div>';
  h += '<p class="note-p"><b style="color:var(--ink)">' + state + '.</b></p>';
  h += '<div class="meters"><div class="meter"><span>Croissance</span>' + bar(ph.prog * 100, '') + '<b>' + Math.round(ph.prog * 100) + ' %</b></div><div class="meter"><span>Eau du sol</span>' + bar(c.water, c.water < 25 ? 'f' : 'w') + '<b>' + Math.round(c.water) + ' %</b></div><div class="meter"><span>Santé</span>' + bar(c.health, c.health < 50 ? 'f' : '') + '<b>' + Math.round(c.health) + ' %</b></div></div>';
  { const rs = G.resistance(S, i); h += '<p class="note-p">Résistance aux limaces et maladies : <b>' + rs.pct + ' %</b> (' + rs.links + ' liaison' + (rs.links > 1 ? 's' : '') + ' avec les plantes voisines). Plus elle a d’alliées, mieux elle résiste.</p>'; if (c.sick) h += '<div class="sum"><div class="nm">' + (c.sick.k === 'limaces' ? 'Attaque de limaces' : 'Maladie fongique') + '</div><div class="note-p">Soigne-la vite : elle pousse deux fois moins et s’affaiblit chaque jour.</div></div>'; }
  { const sts = [], dl = d => ' (' + (d - S.day) + ' j)'; if (c.nichoir) sts.push('nichoir à mésanges'); if (c.oyaUntil > S.day) sts.push('oya' + dl(c.oyaUntil)); if (c.ortieUntil > S.day) sts.push('purin d’ortie' + dl(c.ortieUntil)); if (c.mycoUntil > S.day) sts.push('mycorhizes' + dl(c.mycoUntil)); if (c.shieldF > S.day) sts.push('prêle' + dl(c.shieldF));
    if (sts.length) h += '<p class="note-p"><b style="color:var(--ink)">Soins en cours :</b> ' + sts.join(', ') + '.</p>';
    if (G.isExo(p)) h += '<p class="note-p"><b style="color:var(--ink)">Plante exotique :</b> fragile au froid. Place-la à côté d’une grande serre pour qu’elle passe l’hiver.</p>'; }
  h += '<ul class="notes">' + (sy.notes.length ? sy.notes.map(n => '<li class="' + n.t + '"><span class="m">' + (n.t === 'good' ? '✓' : '✕') + '</span><span>' + n.text + (n.n > 1 ? ' (×' + n.n + ')' : '') + '</span></li>').join('') : '<li><span class="m" style="background:var(--surface-2);color:var(--ink-2)">·</span><span>Pas encore d’interaction avec les voisines. Une guilde se construit en associant les strates.</span></li>') + '</ul>';
  h += cal(p, m) + legend;
  h += '<p class="note-p">' + eauT.charAt(0).toUpperCase() + eauT.slice(1) + ' · ' + p.soleil + ' h de soleil · résiste jusqu’à ' + p.gel + ' °C' + (perYear > 0 ? ' · environ ' + fmt(perYear) + ' kg par an à maturité' : '') + '.</p><p class="note-p">' + p.note + '</p>' + (phInfo(p) ? '<p class="note-p cred">Photo : ' + esc(phInfo(p).c || 'JF Lab') + '</p>' : '');
  const cost = G.waterCost(c), acts = [];
  if (c.sick) acts.push('<button type="button" class="btn sm primary" data-act="heal1">Soigner (' + (c.sick.k === 'limaces' ? 'ramasser les limaces' : 'retirer les parties malades') + ')</button>');
  if (c.water < 95) acts.push('<button type="button" class="btn sm" data-act="water1"' + (S.tank < cost ? ' disabled' : '') + '>' + ico('drop') + 'Arroser (' + cost + ' L)</button>');
  if (!c.mulch && S.mats.paillage > 0) acts.push('<button type="button" class="btn sm" data-act="mulch1">Pailler</button>');
  if (S.mats.compost > 0) acts.push('<button type="button" class="btn sm" data-act="compost1">Compost</button>');
  if (rdy) acts.push('<button type="button" class="btn sm primary" data-act="harvest1">' + ico('basket') + 'Récolter ~' + fmt(G.yieldKg(S, i), 2) + ' kg</button>');
  if (G.mowReady(S, c)) acts.push('<button type="button" class="btn sm primary" data-act="mow1">Faucher (+2 paillage)</button>');
  acts.push('<button type="button" class="btn sm warn" data-act="remove">' + (ui.confirmDel ? 'Confirmer le retrait' : 'Retirer') + '</button>');
  el.innerHTML = h + '<div class="acts">' + acts.join('') + '</div></div>';
}
function renderFoot() {
  const n = P.filter(p => p.id < 22).length, c = P.filter(p => p.id >= 51).length;
  $('foot').innerHTML = '<span>' + P.length + ' plantes jouables : ' + n + ' calibrées dans ton jeu, ' + (P.length - n) + ' aux valeurs estimées (dont ' + c + ' tirées du catalogue JF Lab). ' + HERB.length + ' fiches dans l’herbier. Partie sauvegardée sur cet appareil.</span><button type="button" class="btn sm" data-act="newgame">Nouvelle partie</button>';
}

/* ---------- fenêtres ---------- */
function openAmenager() {
  syncDims();
  const c = G.canExpand(S), mp = S.maxPlantings, bar = (v, t) => '<div class="bar"><i style="width:' + Math.min(100, Math.round(v / t * 100)) + '%"></i></div>';
  let h = '<h3 style="margin:2px 0 6px">Terrain</h3><p class="note-p">Ton terrain fait <b>' + COLS + ' × ' + ROWS + '</b> parcelles.</p>';
  if (c.done) h += '<p class="note-p">Tu as atteint la taille maximale. Les paliers de plantation continuent de t’offrir du mobilier.</p>';
  else h += '<div class="amen-card"><b>Prochain agrandissement : ' + c.to[0] + ' × ' + c.to[1] + '</b><div class="amen-req"><span>Plantations réussies : ' + c.plant[0] + ' / ' + c.plant[1] + '</span>' + bar(c.plant[0], c.plant[1]) + '</div><div class="amen-req"><span>Espèces différentes dans le jardin : ' + c.species[0] + ' / ' + c.species[1] + '</span>' + bar(c.species[0], c.species[1]) + '</div><div class="acts"><button type="button" class="btn primary" data-act="expand"' + (c.ok ? '' : ' disabled') + '>Agrandir le terrain</button></div></div>';
  h += '<h3 style="margin:14px 0 6px">Embellir la forêt comestible</h3><p class="note-p">Le mobilier arrive dans les boosters, et chaque palier de plantations t’en offre un. Touche « Poser » puis une parcelle libre.</p><div class="amen-grid">';
  G.FURN.concat(['trogne', 'canard']).forEach(k => {
    const q = (S.mats[k] || 0), un = mp >= G.FURN_UNLOCK[k], ms = G.MILESTONES.find(x => x[1][k]);
    const st = !un ? 'Débloqué après ' + G.FURN_UNLOCK[k] + ' plantations (tu en as ' + mp + ')' : q > 0 ? 'En réserve : ' + q : 'Dans les prochains boosters' + (ms && !S.rewarded[ms[0]] ? ' ou au palier de ' + ms[0] + ' plantations' : '');
    h += '<div class="amen-item' + (un ? '' : ' lock') + '"><svg viewBox="0 0 80 80" aria-hidden="true">' + MATS[k].svg + '</svg><div><b>' + FURN_INFO[k].n + '</b><p>' + FURN_INFO[k].d + '</p><small>' + st + '</small>' + (q > 0 ? '<div class="acts"><button type="button" class="btn sm primary" data-act="use-furn" data-k="' + k + '">Poser</button></div>' : '') + '</div></div>';
  });
  h += '</div><h3 style="margin:14px 0 6px">Atelier, soins et eau</h3><p class="note-p">Dans les boosters tu trouveras aussi : <b>Atelier</b> (à côté de la maison, avec bocaux et séchoir pour garder la récolte), <b>purin d’ortie</b> et <b>prêle</b> (soins), <b>nichoir à mésanges</b> (dans un arbre), <b>cuve</b> et <b>oya</b> (eau), <b>inoculum de mycorhizes</b>, <b>plan de guilde</b> et <b>carte Savoir</b>. Ils apparaissent dans ta barre du haut dès que tu en as. Touche la carte, puis la plante concernée.</p><h3 style="margin:14px 0 6px">Autour du jardin</h3><p class="note-p"><b>Tonte :</b> l’herbe autour du jardin repousse tous les 14 jours. Chaque zone tondue te donne +2 paillage.</p><p class="note-p"><b>Trognes :</b> les arbres au bord de la forêt, une fois taillés en têtard, repartent tous les 3 mois. Chaque coupe donne +4 paillage et accélère la pousse des plantes.</p>';
  modal('Aménager le jardin', h, true);
}
function modal(title, body, wide) {
  setTimeout(wantPhotos, 0);
  $('layer').innerHTML = '<div class="veil" data-act="veil"><div class="modal" role="dialog" aria-modal="true" aria-label="' + title + '"' + (wide ? ' style="width:min(880px,100%)"' : '') + '><header><h2>' + title + '</h2><button type="button" class="x" data-act="close" aria-label="Fermer">×</button></header>' + body + '</div></div>';
  const f = $('layer').querySelector('.x'); if (f) f.focus();
}
function closeModal() { $('layer').innerHTML = ''; render(); }
function openBooster() {
  if (S.boosterDay >= S.day) { toast('Le booster du jour est déjà ouvert.'); return; }
  modal('Booster du jour', '<div class="pack"><svg width="150" height="190" viewBox="0 0 150 190" aria-hidden="true"><path d="M20 20h110l-6 150H26z" fill="var(--leaf)"/><path d="M20 20c18 12 36 12 55 0 19 12 37 12 55 0" fill="color-mix(in srgb,var(--leaf) 70%,#000)"/><circle cx="75" cy="92" r="34" fill="var(--surface)"/><path d="M75 115V88" stroke="var(--leaf)" stroke-width="4" stroke-linecap="round"/><path d="M75 94c-14 0-20-6-20-16 14 0 20 6 20 16zM75 88c0-12 8-18 20-18 0 12-8 18-20 18z" fill="var(--leaf-2)"/><text x="75" y="150" text-anchor="middle" font-family="var(--font-d)" font-weight="800" font-size="15" fill="var(--on-leaf)">GRAINES DE VIE</text></svg><p>Dix cartes de saison : graines, noyaux, plants et matériel. Les plantes de la saison en cours sont plus fréquentes.</p><button type="button" class="btn primary" data-act="rip">Ouvrir le sachet</button></div>');
}
function ripBooster() {
  const cards = G.openBooster(S); if (!cards) return; save();
  const body = '<p class="note-p" style="margin-bottom:8px">Touche une carte pour la retourner. Elles sont déjà dans ta réserve.</p><div class="deal">' + cards.map((c, k) => '<button type="button" class="flipper" data-act="flip" aria-label="Carte ' + (k + 1) + '"><div class="in"><div class="face back"><svg width="46" height="46" viewBox="0 0 40 40" aria-hidden="true"><path d="M20 31V19" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M20 22c-6 0-9-3-9-8 6 0 9 3 9 8zM20 19c0-5 3-8 9-8 0 5-3 8-9 8z" fill="currentColor"/></svg></div><div class="face front">' + (c.t === 'plant' ? cardHtml(P[c.pid], {}) : matCard(c.k, c.q)) + '</div></div></button>').join('') + '</div><div class="acts" style="justify-content:flex-end"><button type="button" class="btn" data-act="flipall">Tout retourner</button><button type="button" class="btn primary" data-act="close">Terminé</button></div>';
  modal('Tes cartes du jour', body, true);
}
function openKitchen(res) {
  const t = G.stockTotals(S), ids = Object.keys(t).map(Number).filter(id => t[id] > .03), hasH = (S.honey || 0) > .02;
  let h = '';
  if (res) h += '<div class="fam fam-res">' + S.family.map((m, k) => face(k, m.joy, 40)).join('') + '</div><div class="note-p">' + S.family.map(m => m.n).join(', ') + ' : ' + (res.kcal / res.need >= .6 ? 'ils se régalent.' : 'c’est un peu léger pour toute la famille.') + '</div><div class="sum"><div class="nm">' + res.name + '</div><div>' + res.kcal + ' kcal · ' + fmt(res.prot) + ' g de protéines · ' + res.grams + ' g de récolte</div><div class="bar"><i style="width:' + res.balance + '%"></i></div><div class="note-p">Équilibre du repas : ' + res.balance + ' %. ' + (res.balance < 60 ? 'Mélange des strates (racine, feuille, fruit) pour l’améliorer.' : 'Un repas varié, bien joué.') + '</div></div>';
  if (!ids.length && !hasH) h += '<p class="empty-f">Le garde-manger est vide. Récolte d’abord quelques cultures.</p>';
  else h += '<p class="note-p">Choisis les ingrédients du repas de la famille (jusqu’à 180 g par personne et par ingrédient). Les fruits et légumes frais se gardent peu de temps.</p><div class="acts" style="justify-content:flex-start;margin:0 0 6px"><button type="button" class="btn sm" data-act="kall">Tout sélectionner</button><button type="button" class="btn sm" data-act="knone">Tout désélectionner</button></div><div class="kit" id="kit">' + (hasH ? '<label class="ing"><input type="checkbox" data-pid="honey"><span><b>Miel</b> <span class="k">· ne se perd pas</span></span><span class="k">' + fmt(S.honey, 2) + ' kg</span></label>' : '') + ids.map(id => { const p = P[id], it = S.stock.filter(x => x.pid === id), kp = it.filter(x => x.keep).reduce((a, b) => a + b.kg, 0), age = S.day - Math.min(...it.map(x => x.day)); return '<label class="ing"><input type="checkbox" data-pid="' + id + '"><span><b>' + p.name + '</b> <span class="k">· ' + p.strate.toLowerCase() + (p.cons ? ' · se garde ' + p.cons + ' j (récolté il y a ' + age + ' j)' : '') + (kp > .01 ? ' · dont ' + fmt(kp, 2) + ' kg en conserve' : '') + '</span></span><span class="k">' + fmt(t[id], 2) + ' kg</span></label>'; }).join('') + '</div><div class="sum" id="kprev"><div class="nm">Aucun ingrédient choisi</div></div><div class="acts" style="justify-content:flex-end"><button type="button" class="btn" data-act="cookall">' + ico('pot') + 'Tout cuisiner d’un coup</button><button type="button" class="btn primary" id="cookBtn" data-act="cook" disabled>' + ico('pot') + 'Cuisiner la sélection</button></div>';
  modal('Garde-manger et cuisine', h);
  const kit = $('kit'); if (kit) kit.addEventListener('change', kitchenPreview);
}
const pidOf = x => x.dataset.pid === 'honey' ? 'honey' : +x.dataset.pid;
function kitchenPreview() {
  const t = G.stockTotals(S), sel = [...document.querySelectorAll('#kit input:checked')].map(pidOf);
  let kcal = 0, prot = 0; const used = [];
  sel.forEach(id => { if (id === 'honey') { const g = Math.min(40 * S.family.length, Math.round(S.honey * 1000)); kcal += g * 3; used.push({ strate: 'Miel' }); return; } const g = Math.min(180 * S.family.length, Math.round(t[id] * 1000)), p = P[id]; kcal += g * p.kcal / 100; prot += g * p.prot / 100; used.push(p); });
  const strata = new Set(used.filter(p => p.strate !== 'Miel').map(p => p.strate)).size, bal = clamp((strata - 1) * 34 + (prot > 8 ? 30 : prot > 4 ? 15 : 0) + (used.length >= 3 ? 12 : 0), 0, 100);
  const fn = G.famNeed(S);
  $('kprev').innerHTML = sel.length ? '<div class="nm">' + Math.round(kcal) + ' kcal · ' + fmt(prot) + ' g de protéines</div><div class="note-p">La famille a besoin d’environ ' + fn + ' kcal par jour (le jardin vise un quart : fruits, légumes, aromatiques) : ce repas en couvre ' + Math.round(kcal / fn * 100) + ' %.</div><div class="bar"><i style="width:' + bal + '%"></i></div><div class="note-p">Équilibre estimé : ' + bal + ' %. ' + strata + ' strate' + (strata > 1 ? 's' : '') + ' représentée' + (strata > 1 ? 's' : '') + '.</div>' : '<div class="nm">Aucun ingrédient choisi</div>';
  $('cookBtn').disabled = !sel.length;
}
function openLearn(pre) {
  const r = pre || G.learn(S), p = P[r.pid], m = G.dateOf(S.day).m; save();
  modal('Savoir du jour', '<div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start"><div style="flex:none">' + cardHtml(p, {}) + '</div><div style="flex:1 1 240px;min-width:0;display:grid;gap:10px"><h3 style="font-size:20px">' + p.name + '</h3><p class="note-p" style="color:var(--ink)">' + p.note + '</p>' + (r.tips.length ? r.tips.map(t => '<p class="note-p">' + t + '</p>').join('') : '') + '<p class="note-p">' + sw(p) + ' : ' + G.monthRange(p.semis) + '. Récolte : ' + (G.monthRange(p.recolte) === '—' ? 'aucune, elle sert le jardin' : G.monthRange(p.recolte)) + '.</p>' + (p.est ? '<span class="est" style="justify-self:start">Valeurs estimées, à vérifier</span>' : '') + '<p class="note-p">Notée dans ton carnet (' + S.knowledge.length + ' plante' + (S.knowledge.length > 1 ? 's' : '') + ' apprise' + (S.knowledge.length > 1 ? 's' : '') + ').</p></div></div>');
}
function useInstant(k) {
  let r;
  if (k === 'atelier') { r = G.buildAtelier(S); if (!r.ok) { toast(r.msg); return; } toast('Atelier construit à côté de la maison. Touche-le pour transformer ta récolte.'); }
  else if (k === 'sechoir') { r = G.installSechoir(S); if (!r.ok) { toast(r.msg); return; } toast('Séchoir installé à l’atelier : 3 kg par jour.'); }
  else if (k === 'cuve') { r = G.useCuve(S); if (!r.ok) { toast(r.msg); return; } toast('Cuve installée : réserve d’eau +150 L.'); }
  else if (k === 'bocaux') { if (!S.atelier) { toast('Construis d’abord l’atelier : les bocaux se remplissent là-bas.'); return; } save(); render(); openAtelier(); return; }
  else if (k === 'savoir') { r = G.useSavoir(S); if (!r.ok) { toast(r.msg); return; } save(); render(); openLearn(r.r); return; }
  else if (k === 'plan') { r = G.guildPlan(S); if (!r.ok) { toast(r.msg); return; } save(); openPlan(r); return; }
  save(); render();
}
function openPlan(r) {
  let h;
  if (r.noTree) h = '<p class="note-p">Une guilde commence par un arbre, et tu n’en as pas encore planté. Arbres à planter en ce moment : <b>' + (r.trees.length ? r.trees.join(', ') : 'regarde tes cartes') + '</b>. Autour de lui, il faudra 5 espèces différentes couvrant au moins 4 strates.</p>';
  else {
    h = '<p class="note-p">Meilleure candidate : la guilde de <b>' + r.name + '</b>' + (r.done ? ', déjà complète (garde-la !).' : '.') + ' Elle a <b>' + r.have.length + '/5</b> strates (il en faut 4) et <b>' + r.speciesHave + '/5</b> espèces voisines.</p>';
    if (r.missing.length && !r.done) h += '<ul class="notes">' + r.missing.map(st => '<li class="good"><span class="m">+</span><span><b>' + st + '</b> : ' + (r.suggest[st] && r.suggest[st].length ? r.suggest[st].join(', ') : 'tout ce qui te plaît') + '</span></li>').join('') + '</ul>';
    h += '<p class="note-p">' + (r.azote ? 'Un fixateur d’azote est déjà là. ' : 'Ajoute une légumineuse (fixe l’azote). ') + (r.pollin ? 'Une plante mellifère aide aussi. ' : 'Ajoute une plante mellifère ou répulsive pour la guilde autonome. ') + '</p><p class="note-p">' + (r.free.length ? r.free.length + ' parcelle' + (r.free.length > 1 ? 's' : '') + ' libre' + (r.free.length > 1 ? 's' : '') + ' autour de l’arbre (marquée' + (r.free.length > 1 ? 's' : '') + ' en vert sur le plan).' : 'Plus de place autour de l’arbre : déplace une plante ou agrandis le terrain.') + '</p>';
    ui.sel = r.center; ui.planHl = r.free.slice();
  }
  render(); modal('Plan de guilde', h);
}
function openAtelier() {
  if (!S.atelier) { toast('Pas encore d’atelier : joue une carte Atelier.'); return; }
  const fresh = {}, kept = {}; S.stock.forEach(it => { const o = it.keep ? kept : fresh; o[it.pid] = (o[it.pid] || 0) + it.kg; });
  const dried = S.dryDay === S.day ? S.dryKg : 0, jars = S.mats.bocaux || 0, fid = Object.keys(fresh).map(Number).filter(id => fresh[id] > .03), kid = Object.keys(kept).map(Number).filter(id => kept[id] > .03);
  let h = '<p class="note-p">Ici tu transformes la récolte fraîche pour la garder longtemps. <b>Bocaux</b> : ' + jars + ' en réserve (un bocal = 0,5 kg, se garde plus d’un an). <b>Séchoir</b> : ' + (S.sechoir ? fmt(Math.max(0, 3 - dried), 1) + ' kg libres aujourd’hui sur 3 kg.' : 'pas encore installé.') + '</p>';
  if (!S.sechoir) h += S.mats.sechoir > 0 ? '<div class="acts" style="justify-content:flex-start"><button type="button" class="btn sm primary" data-act="inst-sechoir">Installer le séchoir</button></div>' : '<p class="note-p">Une carte Séchoir te permettra de sécher herbes et fruits.</p>';
  h += '<h3 style="margin:10px 0 6px">À transformer</h3>' + (fid.length ? '<div class="kit">' + fid.map(id => '<div class="ing"><span><b>' + P[id].name + '</b> <span class="k">· ' + fmt(fresh[id], 2) + ' kg frais</span></span><span class="acts" style="margin:0;gap:6px"><button type="button" class="btn sm" data-act="preserve" data-pid="' + id + '" data-kind="bocal"' + (jars > 0 ? '' : ' disabled') + '>Bocaux</button><button type="button" class="btn sm" data-act="preserve" data-pid="' + id + '" data-kind="sec"' + (S.sechoir && dried < 3 ? '' : ' disabled') + '>Sécher</button></span></div>').join('') + '</div>' : '<p class="empty-f">Rien de frais pour l’instant. Récolte d’abord.</p>');
  if (kid.length) h += '<h3 style="margin:12px 0 6px">En conserve</h3><p class="note-p">' + kid.map(id => P[id].name + ' ' + fmt(kept[id], 2) + ' kg').join(' · ') + '</p><p class="note-p">La cuisine utilise d’abord le frais, puis la conserve : rien ne se perd pendant l’hiver.</p>';
  modal('Atelier de transformation', h);
}
function decorAtelier(x, y, sech, jars) {
  const a = 26, b = 13, H = 28, L = [x - a, y], R = [x + a, y], B = [x, y + b];
  const up = (p, h) => [p[0], p[1] - h], f = p => p[0].toFixed(1) + ',' + p[1].toFixed(1), ap = [x, y - H - 13], o = 1.14, Lo = [x - a * o, y - H + 3], Ro = [x + a * o, y - H + 3], Bo = [x, y + b * o - H + 3];
  let s = '<g class="atl" data-atelier="1" role="button" tabindex="0" aria-label="Atelier de transformation"><ellipse cx="' + x + '" cy="' + (y + 6) + '" rx="' + (a + 14) + '" ry="' + (b + 6) + '" fill="#000" opacity=".16"/>';
  s += poly([f(L), f(B), f(up(B, H)), f(up(L, H))], '#c9a574') + poly([f(B), f(R), f(up(R, H)), f(up(B, H))], '#a8825a');
  s += poly([(x - 19) + ',' + (y + 3.5), (x - 9) + ',' + (y + 8.5), (x - 9) + ',' + (y - 12), (x - 19) + ',' + (y - 17)], '#6b4a2e');
  s += poly([(x + 7) + ',' + (y + 3), (x + 19) + ',' + (y - 3), (x + 19) + ',' + (y - 17), (x + 7) + ',' + (y - 11)], '#8fc1d6', ' stroke="#6b4a2e" stroke-width="1.6"');
  s += poly([f(ap), f(Lo), f(Bo)], '#b0583a') + poly([f(ap), f(Bo), f(Ro)], '#8f4430');
  s += '<path d="M' + f(Lo) + 'L' + f(Bo) + 'L' + f(Ro) + '" fill="none" stroke="#6d3322" stroke-width="1.2"/>';
  if (jars) for (let n = 0; n < 3; n++) s += '<rect x="' + (x + 24 + n * 8) + '" y="' + (y + 2 - n * 3) + '" width="6" height="8" rx="1.6" fill="#f2f6e6" stroke="#8aa67a"/><rect x="' + (x + 24.5 + n * 8) + '" y="' + (y - 1 - n * 3) + '" width="5" height="3" fill="#a3402c"/><rect x="' + (x + 25.5 + n * 8) + '" y="' + (y + 4 - n * 3) + '" width="3" height="4" fill="' + ['#e0603a', '#f0b23a', '#7dbb5c'][n] + '"/>';
  if (sech) { const rx = x - 46, ry = y + 12; s += '<path d="M' + (rx - 14) + ' ' + (ry + 6) + 'V' + (ry - 24) + 'M' + (rx + 14) + ' ' + (ry + 6) + 'V' + (ry - 24) + '" stroke="#8a6240" stroke-width="3" stroke-linecap="round"/><path d="M' + (rx - 17) + ' ' + (ry - 24) + 'h34" stroke="#7a5636" stroke-width="3.4" stroke-linecap="round"/>' + [[-8, '#7dbb5c'], [0, '#b9a24a'], [8, '#cc7a2b']].map(([dx, col]) => '<path d="M' + (rx + dx) + ' ' + (ry - 23) + 'v6" stroke="#6b4a2e" stroke-width="1.4"/><path d="M' + (rx + dx - 3.4) + ' ' + (ry - 17) + 'h6.8l-3.4 12z" fill="' + col + '"/>').join(''); }
  return s + '<ellipse cx="' + x + '" cy="' + (y - 4) + '" rx="' + (a + 20) + '" ry="' + (b + 24) + '" fill="transparent"/></g>';
}

function openJournal() {
  modal('Carnet du jardinier', (S.knowledge.length ? '<p class="note-p">Plantes apprises : ' + S.knowledge.map(id => P[id].name).join(', ') + '.</p>' : '') + '<ul class="log">' + (S.log.length ? S.log.map(l => '<li><span class="d">' + dateStr(l.day, true) + '</span><span class="' + (l.type === 'warn' ? 'warn' : l.type === 'bad' ? 'bad' : '') + '">' + l.text + '</span></li>').join('') : '<li>Rien pour l’instant.</li>') + '</ul>');
}
function openTime() {
  modal('Temps', '<p class="note-p">En vrai, tu joues un jour à la fois. Ces raccourcis servent à voir pousser les plantes : pendant le saut, le jardinier arrose avec ta réserve d’eau.</p><div class="time"><div class="row"><button type="button" class="btn primary" data-act="skip" data-n="1">Demain</button><button type="button" class="btn" data-act="skip" data-n="7">+7 jours</button><button type="button" class="btn" data-act="skip" data-n="30">+30 jours</button><button type="button" class="btn" data-act="skip" data-n="90">+90 jours</button></div><div class="sep"></div><button type="button" class="btn" data-act="demo">Voir un jardin mature (démo, juillet 2027)</button><button type="button" class="btn warn" data-act="newgame">Nouvelle partie</button></div>');
}


/* ---------- herbier JF Lab ---------- */
const nrm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const HI = HERB.map(h => nrm(h.n + ' ' + h.l));
let hLimit = 60;
function herbRows() {
  const q = nrm(($('hq') || { value: '' }).value.trim()), play = $('hplay') && $('hplay').checked, ed = $('hedible') && $('hedible').checked;
  const out = []; let total = 0;
  for (let k = 0; k < HERB.length; k++) { const h = HERB[k]; if (play && h.p == null) continue; if (ed && !h.e) continue; if (q && HI[k].indexOf(q) < 0) continue; total++; if (out.length < hLimit) out.push(h); }
  return { out, total };
}
function herbHtml() {
  const { out, total } = herbRows();
  return '<p class="note-p" id="hcount">' + total + ' fiche' + (total > 1 ? 's' : '') + '</p>' + out.map(h => {
    const pl = h.p != null ? P[h.p] : null;
    return '<button type="button" class="hrow' + (pl ? ' play' : '') + '" data-act="herb-open" data-k="' + HERB.indexOf(h) + '"><span class="hn"><b>' + esc(h.n) + '</b><i>' + esc(h.l) + '</i></span><span class="hm">' + esc(h.t || '—') + (h.h ? ' · ' + esc(h.h) : '') + '</span><span class="hb ' + (pl ? 'ok' : '') + '">' + (pl ? 'Jouable' : 'Herbier') + '</span></button>';
  }).join('') + (total > out.length ? '<button type="button" class="btn sm" data-act="herb-more" style="margin-top:8px">Afficher plus (' + (total - out.length) + ' restantes)</button>' : '');
}
function openHerbier() {
  hLimit = 60;
  modal('Herbier JF Lab', '<p class="note-p">Les ' + HERB.length + ' plantes de ton catalogue. Celles qui sont comestibles et assez documentées sont jouables ; les autres (ornementales, aquatiques, d’intérieur) restent consultables.</p><div class="hbar"><input id="hq" type="search" placeholder="Chercher une plante (nom ou latin)" aria-label="Chercher une plante" autocomplete="off"><label><input type="checkbox" id="hplay"> jouables</label><label><input type="checkbox" id="hedible"> comestibles</label></div><div id="hlist" class="hlist">' + herbHtml() + '</div>', true);
}
function openPlantInfo(k) {
  const h = HERB[k], p = h.p != null ? P[h.p] : null, m = G.dateOf(S.day).m;
  let body;
  if (p) body = '<div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start"><div style="flex:none">' + cardHtml(p, {}) + '</div><div style="flex:1 1 240px;min-width:0;display:grid;gap:10px"><h3 style="font-size:20px">' + esc(p.name) + '</h3><p class="note-p" style="color:var(--ink)">' + esc(p.note) + '</p><p class="note-p">' + sw(p) + ' : ' + G.monthRange(p.semis) + '. Récolte : ' + (G.monthRange(p.recolte) === '—' ? 'aucune' : G.monthRange(p.recolte)) + '.</p>' + cal(p, m) + legend + (p.est ? '<span class="est" style="justify-self:start">Valeurs de jeu estimées' + (p.estH ? ', mois de récolte compris' : '') + '</span>' : '<span class="est" style="justify-self:start;background:color-mix(in srgb,var(--leaf-2) 25%,var(--surface))">Valeurs calibrées</span>') + '<p class="note-p">Source : catalogue JF Lab' + (h.row ? ', ligne ' + h.row + ' du classeur' : '') + '.</p></div></div>';
  else body = '<div style="display:grid;gap:8px"><h3 style="font-size:20px">' + esc(h.n) + '</h3><p class="note-p"><i>' + esc(h.l || 'nom latin non renseigné') + '</i></p><p class="note-p">' + [h.t, h.h && 'Hauteur ' + h.h, h.x && 'Exposition ' + h.x, h.z && 'Zone ' + h.z, h.ho && 'Récolte ' + h.ho].filter(Boolean).map(esc).join(' · ') + '</p><span class="est" style="justify-self:start">Pas encore jouable : ' + esc(h.why || 'données insuffisantes') + '</span><p class="note-p">Source : catalogue JF Lab' + (h.row ? ', ligne ' + h.row + ' du classeur' : '') + '.</p></div>';
  modal(p ? 'Fiche plante' : 'Fiche de l’herbier', body);
}
document.addEventListener('input', e => { if (e.target.id === 'hq' || e.target.id === 'hplay' || e.target.id === 'hedible') { hLimit = 60; $('hlist').innerHTML = herbHtml(); } });

/* ---------- actions ---------- */
let tt; function toast(msg) { const t = $('toast'); t.textContent = msg; t.hidden = false; clearTimeout(tt); tt = setTimeout(() => { t.hidden = true; }, 3400); }
function applyView() {
  const svg = $('garden'); if (!svg) return; view.z = clamp(view.z, .8, 3.2); const w = 760 / view.z, h = 460 / view.z;
  const x = clamp(view.cx - w / 2, -150, 910 - w), y = clamp(view.cy - h / 2, -60, 600 - h); view.cx = x + w / 2; view.cy = y + h / 2;
  svg.setAttribute('viewBox', x.toFixed(1) + ' ' + y.toFixed(1) + ' ' + w.toFixed(1) + ' ' + h.toFixed(1));
  const wrap = svg.parentNode; wrap.classList.toggle('panable', ui.tool === 'move' || view.z > 1.001); wrap.dataset.tool = ui.tool || 'select';
}
function zoomBy(f) { view.z *= f; applyView(); }
function renderGuil() {
  const m = $('gmasc'); if (!m) return; const g = G.guildeon(S), say = $('gsay'), card = $('gcard'), bd = $('gbadge'), now = Date.now();
  if (g.text !== ui.gText || g.ready > (ui.gReady || 0)) { ui.gText = g.text; ui.gUntil = now + 15000; clearTimeout(ui.gT); ui.gT = setTimeout(() => { const s2 = $('gsay'); if (s2) s2.hidden = true; }, 15200); }
  ui.gReady = g.ready;
  m.classList.toggle('joy', g.ready > 0); bd.hidden = !g.ready; bd.textContent = g.ready;
  say.textContent = g.text; say.hidden = !(ui.gUntil > now) || !!ui.gOpen;
  card.hidden = !ui.gOpen; m.setAttribute('aria-expanded', ui.gOpen ? 'true' : 'false');
  if (!ui.gOpen) return;
  const row = q => '<li class="gq' + (q.done ? ' done' : '') + '"><div class="gqt"><b>' + esc(q.t) + '</b>' + (q.daily ? '<em>Défi du jour</em>' : '') + '</div><div class="gqb"><i style="width:' + Math.round(q.have / q.need * 100) + '%"></i></div><div class="gqr"><span>' + q.have + ' / ' + q.need + ' · ' + esc(q.label) + '</span>' + (q.done && !q.claimed ? '<button type="button" class="btn sm pri" data-act="guil-claim" data-id="' + q.id + '">Récupérer</button>' : q.claimed ? '<span class="ok">Fait</span>' : '') + '</div></li>';
  const ready = g.qs.filter(q => q.done && !q.claimed), open = g.qs.filter(q => !q.done && !q.daily).slice(0, 3), daily = g.qs.find(q => q.daily && !ready.includes(q)), nd = g.qs.filter(q => q.claimed && !q.daily).length;
  card.innerHTML = '<div class="gh"><b>Guildéon</b><button type="button" class="gx" data-act="guil-toggle" aria-label="Fermer">×</button></div><p class="gsp">' + esc(g.text) + '</p>' + (g.boost ? '<p class="gbo">Croissance accélérée : encore ' + g.boost + ' j</p>' : '') + '<ul class="gl">' + ready.map(row).join('') + open.map(row).join('') + (daily ? row(daily) : '') + '</ul><p class="gfoot">' + nd + ' objectif' + (nd > 1 ? 's' : '') + ' réussi' + (nd > 1 ? 's' : '') + ' · ' + g.guilds + ' guilde' + (g.guilds > 1 ? 's' : '') + ' dans ta forêt</p>';
}
function renderStr() {
  const m = $('strmenu'); if (!m) return; m.hidden = !ui.strOpen;
  document.querySelectorAll('#tools [data-act="strate-menu"]').forEach(b => b.classList.toggle('on', !!ui.strF || !!ui.strOpen));
  if (!ui.strOpen) return;
  const n = {}; S.grid.forEach(c => { if (c && !c.treille) { const s = P[c.pid].strate; n[s] = (n[s] || 0) + 1; } });
  m.innerHTML = '<b>Strates</b>' + ['Arbre', 'Arbuste', 'Grimpante', 'Herbacée', 'Racine', 'Couvre-sol'].map(s => '<button type="button" class="sch' + (ui.strF === s ? ' on' : '') + '" data-act="strate-set" data-s="' + s + '">' + strIco(s) + '<span>' + s + '</span><em>' + (n[s] || 0) + '</em></button>').join('') + '<button type="button" class="sch' + (!ui.strF ? ' on' : '') + '" data-act="strate-set" data-s="">Tout afficher</button>';
}
function renderTools() { document.querySelectorAll('#tools [data-tool]').forEach(b => b.classList.toggle('on', (ui.tool || 'select') === b.dataset.tool)); }
(function initPan() {
  const wrap = document.querySelector('.garden-wrap'); if (!wrap) return; const ptrs = new Map(); let moved = 0, pinch = null;
  const dist = () => { const [a, b] = [...ptrs.values()]; return Math.hypot(a.x - b.x, a.y - b.y) || 1; };
  wrap.addEventListener('pointerdown', e => { if (!e.target.closest('#garden')) return; ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); moved = 0; if (ptrs.size === 2) pinch = { d: dist(), z: view.z }; });
  wrap.addEventListener('pointermove', e => { const p = ptrs.get(e.pointerId); if (!p) return; const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
    if (ptrs.size === 2 && pinch) { view.z = pinch.z * dist() / pinch.d; moved = 99; applyView(); return; }
    if (ui.tool === 'move' || view.z > 1.001) { moved += Math.abs(dx) + Math.abs(dy); if (moved > 6) { const r = $('garden').getBoundingClientRect(); view.cx -= dx * (760 / view.z) / r.width; view.cy -= dy * (460 / view.z) / r.height; applyView(); } } });
  const up = e => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; };
  wrap.addEventListener('pointerup', up); wrap.addEventListener('pointercancel', up); wrap.addEventListener('pointerleave', up);
  wrap.addEventListener('click', e => { if (moved > 6) { e.stopPropagation(); e.preventDefault(); moved = 0; } }, true);
  wrap.addEventListener('wheel', e => { if (e.ctrlKey || e.metaKey || ui.tool === 'move') { e.preventDefault(); zoomBy(e.deltaY < 0 ? 1.12 : 1 / 1.12); } }, { passive: false });
})();
function render() { renderTop(); renderGarden(); applyView(); renderTools(); renderStr(); renderGuil(); mountChars(); renderRes(); renderTray(); renderToday(); renderFiche(); renderFoot(); save(); wantPhotos(); }
function advance(n) {
  const before = S.day; const ev = n === 1 ? G.nextDay(S, false) : G.skip(S, n);
  ui.confirmDel = false; const bad = ev.filter(e => e.t === 'bad' || e.t === 'warn');
  render(); const rd = S.grid.filter(c => c && c.ready).length;
  toast(n === 1 ? (S.w.rain >= 1 ? 'Nouveau jour : pluie ' + fmt(S.w.rain, 0) + ' mm.' : 'Nouveau jour.') + (bad.length ? ' ' + bad[0].text : '') + (rd ? ' ' + rd + ' culture' + (rd > 1 ? 's' : '') + ' à récolter.' : '') : (S.day - before) + ' jours passés. ' + (bad.length ? bad.length + ' alerte' + (bad.length > 1 ? 's' : '') + ' dans le carnet.' : 'Le jardin se porte bien.') + (rd ? ' ' + rd + ' à récolter.' : ''));
}
function doTask(id) {
  const t = G.buildTasks(S).tasks.find(x => x.id === id); if (!t) { render(); return; }
  const a = t.act;
  if (a.type === 'booster') return openBooster();
  if (a.type === 'cook') return openKitchen();
  if (a.type === 'learn') { openLearn(); return; }
  if (a.type === 'sow') { ui.mode = { type: 'plant', pid: a.pid }; render(); $('garden').scrollIntoView({ block: 'nearest', behavior: 'smooth' }); toast('Choisis une parcelle libre.'); return; }
  const firstCell = a.cells && a.cells[0];
  const r = G.runTask(S, t).r;
  if (a.type === 'water') toast(r.n + ' plante' + (r.n > 1 ? 's' : '') + ' arrosée' + (r.n > 1 ? 's' : '') + (r.short ? '. Réserve d’eau insuffisante pour les autres.' : '.'));
  if (a.type === 'harvest') toast('Récolte rentrée : ' + fmt(r.kg, 2) + ' kg au garde-manger.');
  if (a.type === 'heal') toast(r.n + ' plante' + (r.n > 1 ? 's soignées' : ' soignée') + '.');
  if (a.type === 'honey') toast('+' + fmt(r.kg, 1) + ' kg de miel au garde-manger.');
  if (a.type === 'lawn') toast('Herbe tondue : +' + 2 * r.n + ' paillage.');
  if (a.type === 'trogne') toast(r.n + ' trogne' + (r.n > 1 ? 's coupées' : ' coupée') + ' : paillage et croissance accélérée.');
  if (a.type === 'prune') toast(r.n + ' arbre' + (r.n > 1 ? 's' : '') + ' ou arbuste' + (r.n > 1 ? 's' : '') + ' taillé' + (r.n > 1 ? 's' : '') + ' : +10 % de fruits.');
  if (a.type === 'mulch') toast(r.n + ' plante' + (r.n > 1 ? 's' : '') + ' paillée' + (r.n > 1 ? 's' : '') + '.');
  if (a.type === 'mow') toast('Consoude fauchée : +' + 2 * r.n + ' paillage.');
  render(); if (firstCell != null) if (a.type !== 'lawn' && a.type !== 'trogne' && a.type !== 'honey') sendGardener(firstCell, a.type === 'mow' || a.type === 'prune' || a.type === 'heal' ? 'mulch' : a.type);
}
function clickCell(i) {
  const c = S.grid[i];
  if (ui.tool === 'reloc') {
    if (ui.mvFrom >= 0 && ui.mvFrom !== i && !(c && !c.treille)) {
      const r = G.movePlant(S, ui.mvFrom, i); if (!r.ok) { toast(r.msg); return; }
      toast(r.name + ' déplacé.' + (r.woody ? ' Un arbre ou arbuste déplacé a besoin de repos : arrose-le.' : '')); ui.mvFrom = -1; ui.sel = i; render(); return;
    }
    if (c && !c.treille) { ui.mvFrom = ui.mvFrom === i ? -1 : i; ui.sel = i; if (ui.mvFrom >= 0) toast('Touche une parcelle libre pour déplacer ' + P[c.pid].name.toLowerCase() + '.'); render(); return; }
    toast(ui.mvFrom >= 0 ? G.moveCheck(S, ui.mvFrom, i).msg || 'Choisis une parcelle libre.' : 'Touche d’abord la plante à déplacer.'); return;
  }
  if (ui.tool === 'delete') {
    if (!c) { toast('Rien à supprimer ici.'); return; }
    const nm = c.treille ? FURN_INFO[c.furn || 'treille'].n : P[c.pid].name;
    if (ui.delPending === i) { G.remove(S, i); ui.delPending = -1; ui.sel = -1; toast(nm + ' : supprimé.'); render(); } else { ui.delPending = i; ui.sel = i; toast('Touche encore pour supprimer : ' + nm.toLowerCase() + '.'); render(); }
    return;
  } setTimeout(() => { if (window.innerWidth <= 1040 && ui.sel === i && !ui.mode) $('fiche').scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, 60);
  if (ui.mode && ui.mode.type === 'plant') {
    if (c && !(c.treille && (c.furn === 'treille' || c.furn === 'pergola') && P[ui.mode.pid].strate === 'Grimpante')) { ui.sel = i; ui.confirmDel = false; render(); return; }
    const r = G.plant(S, i, ui.mode.pid); if (!r.ok) { toast(r.msg); return; } if (r.reward) setTimeout(() => toast(r.reward), 900); setTimeout(() => sendGardener(i, 'plant'), 0);
    if (!S.cards[ui.mode.pid]) ui.mode = null; ui.sel = i; toast('Planté.'); render(); return;
  }
  ui.planHl = null;
  if (ui.mode && ui.mode.type === 'mat') {
    const k = ui.mode.k; if (k === 'canard') { if (c && c.furn === 'mare') { if (G.placeDuck(S, i)) { toast('Les canards s’installent à la mare.'); if (!(S.mats.canard > 0)) ui.mode = null; ui.sel = i; render(); } else toast('Cette mare a déjà ses canards.'); } else toast('Touche une mare pour y installer les canards.'); return; }
    if (k === 'trogne') { toast('Touche un arbre au bord du jardin.'); return; }
    if (TARGET[k]) {
      if (!c || c.treille) { toast(TARGET[k]); return; }
      const r = ({ ortie: G.useOrtie, prele: G.usePrele, oya: G.useOya, mycor: G.useMycor, nichoir: G.placeNichoir })[k](S, i); if (!r.ok) { toast(r.msg); return; }
      toast(({ ortie: 'Purin versé : croissance stimulée, limaces repoussées.', prele: 'Prêle appliquée : protégée des champignons un mois.', oya: 'Oya enterrée : arrosage automatique 45 jours.', mycor: 'Mycorhizes ajoutées : croissance accélérée 2 mois.', nichoir: 'Nichoir fixé : les mésanges veillent.' })[k]);
      if (!(S.mats[k] > 0)) ui.mode = null; ui.sel = i; save(); render(); return;
    }
    if (FURNK.includes(k)) { if (c) { toast('Pose-le sur une parcelle libre.'); return; } G.placeFurn(S, i, k); }
    else { if (!c || c.treille) { toast('Touche une plante.'); return; } if (!(k === 'paillage' ? G.mulch(S, i) : G.compost(S, i))) { toast(k === 'paillage' ? 'Cette plante est déjà paillée.' : 'Plus de compost.'); return; } }
    if (!(S.mats[k] > 0)) ui.mode = null; ui.sel = i; render(); return;
  }
  ui.sel = i; ui.confirmDel = false; render();
}
document.addEventListener('click', e => {
  if (ui.tool === 'move' && e.target.closest('#garden')) return;
  if (ui.tool && ui.tool !== 'select' && e.target.closest('[data-badge],[data-tree],.lawn')) return;
  const atl = e.target.closest('[data-atelier]'); if (atl && (!ui.tool || ui.tool === 'select') && !ui.mode) { openAtelier(); return; }
  const b = e.target.closest('[data-badge]');
  if (b && (b.dataset.badge === 'lawn' || b.dataset.badge === 'trogne')) { if (b.dataset.badge === 'lawn') lawnClick(+b.dataset.k, b); else treeClick(+b.dataset.k, b); return; }
  const trEl = e.target.closest('[data-tree]'); if (trEl && !b) { treeClick(+trEl.dataset.tree, trEl); return; }
  const lwEl = e.target.closest('.lawn'); if (lwEl && !b) { lawnClick(+lwEl.dataset.k, lwEl); return; }
  if (b) { const i = +b.dataset.i, kd = b.dataset.badge; let done = false;
    const pos = badgePos(b);
    if (kd === 'water') { const r = G.waterCells(S, [i]); toast(r.n ? 'Arrosée.' : 'Réserve d’eau insuffisante.'); done = !!r.n; if (done) setTimeout(() => sendGardener(i, 'water'), 0); }
    else if (kd === 'harvest') { const h = G.harvest(S, i); if (h.ok) { done = true; toast('+' + fmt(h.kg, 2) + ' kg de ' + h.name.toLowerCase() + '.'); setTimeout(() => sendGardener(i, 'harvest'), 0); } }
    else if (kd === 'prune') { done = G.prune(S, i); if (done) { toast('Taillée : +10 % de fruits cette saison.'); setTimeout(() => sendGardener(i, 'mulch'), 0); } }
    else if (kd === 'limaces' || kd === 'fongique') { done = G.heal(S, i); if (done) { toast(kd === 'limaces' ? 'Limaces ramassées.' : 'Parties malades retirées.'); setTimeout(() => sendGardener(i, 'mulch'), 0); } }
    else if (kd === 'honey') { const h2 = G.harvestHoney(S, i); done = h2.ok; if (done) toast('+' + fmt(h2.kg, 1) + ' kg de miel au garde-manger.'); }
    else if (kd === 'compost') { done = G.compost(S, i); if (done) { toast('Compost étalé : la plante pousse mieux pendant 30 jours.'); setTimeout(() => sendGardener(i, 'compost'), 0); } }
    else if (kd === 'mulch') { done = G.mulch(S, i); if (done) setTimeout(() => sendGardener(i, 'mulch'), 0); else toast('Plus de paillage.'); }
    ui.sel = i; render(); if (done) flyIcon(kd, pos); return; }
  const cell = e.target.closest('.cell'); if (cell) { clickCell(+cell.dataset.i); return; }
  const a = e.target.closest('[data-act]'); if (!a) return;
  const act = a.dataset.act, i = ui.sel;
  if (act === 'veil') { if (e.target === a) closeModal(); return; }
  switch (act) {
    case 'close': closeModal(); break;
    case 'task': doTask(a.dataset.id); break;
    case 'next': advance(1); break;
    case 'skip': $('layer').innerHTML = ''; advance(+a.dataset.n); break;
    case 'mode-plant': { ui.tool = 'select'; ui.mvFrom = -1; ui.delPending = -1; const pid = +a.dataset.pid; ui.mode = (ui.mode && ui.mode.type === 'plant' && ui.mode.pid === pid) ? null : { type: 'plant', pid }; render(); break; }
    case 'mode-mat': { ui.tool = 'select'; ui.mvFrom = -1; ui.delPending = -1; const k = a.dataset.k; if (INSTANT.includes(k)) { ui.mode = null; useInstant(k); break; } ui.mode = (ui.mode && ui.mode.k === k) ? null : { type: 'mat', k }; render(); break; }
    case 'strate-menu': ui.strOpen = !ui.strOpen; render(); break;
    case 'strate-set': ui.strF = a.dataset.s || ''; render(); break;
    case 'guil-toggle': ui.gOpen = !ui.gOpen; ui.gUntil = 0; render(); break;
    case 'guil-claim': { const r = G.claimQuest(S, a.dataset.id); if (r.ok) { toast('Bonus de Guildéon : ' + r.label + '.'); ui.gUntil = 0; render(); } break; }
    case 'tool-reloc': ui.tool = ui.tool === 'reloc' ? 'select' : 'reloc'; ui.mode = null; ui.delPending = -1; ui.mvFrom = -1; render(); break;
    case 'tool-select': ui.tool = 'select'; ui.delPending = -1; ui.mvFrom = -1; render(); break;
    case 'tool-move': ui.tool = ui.tool === 'move' ? 'select' : 'move'; ui.mvFrom = -1; ui.mode = null; ui.delPending = -1; render(); break;
    case 'tool-delete': ui.tool = ui.tool === 'delete' ? 'select' : 'delete'; ui.mvFrom = -1; ui.mode = null; ui.delPending = -1; render(); break;
    case 'zoom-in': zoomBy(1.3); break;
    case 'zoom-out': zoomBy(1 / 1.3); break;
    case 'rot-l': VROT = (VROT + 3) % 4; render(); break;
    case 'rot-r': VROT = (VROT + 1) % 4; render(); break;
    case 'view-reset': view = { z: 1, cx: 380, cy: 286 }; VROT = 0; render(); break;
    case 'cancel': ui.mode = null; render(); break;
    case 'kitchen': openKitchen(); break;
    case 'atelier': openAtelier(); break;
    case 'inst-sechoir': useInstant('sechoir'); openAtelier(); break;
    case 'preserve': { const r = G.preserve(S, +a.dataset.pid, a.dataset.kind); if (!r.ok) toast(r.msg); else { toast((a.dataset.kind === 'bocal' ? 'Mis en bocaux : ' : 'Séché : ') + fmt(r.kg, 2) + ' kg de ' + r.name.toLowerCase() + '.'); } save(); render(); openAtelier(); break; }
    case 'journal': openJournal(); break;
    case 'kall': document.querySelectorAll('#kit input').forEach(x => { x.checked = true; }); kitchenPreview(); break;
    case 'knone': document.querySelectorAll('#kit input').forEach(x => { x.checked = false; }); kitchenPreview(); break;
    case 'cookall': { const pids = [...document.querySelectorAll('#kit input')].map(pidOf); const r = G.cook(S, pids); if (!r.ok) { toast(r.msg); break; } save(); openKitchen(r); render(); break; }
    case 'herbier': openHerbier(); break;
    case 'famille': openFamily(); break;
    case 'amenager': openAmenager(); break;
    case 'expand': if (G.expand(S)) { save(); toast('Terrain agrandi : ' + COLS + ' × ' + ROWS + ' parcelles.'); render(); openAmenager(); } break;
    case 'use-furn': { closeModal(); ui.mode = { type: 'mat', k: a.dataset.k }; render(); $('garden').scrollIntoView({ block: 'nearest', behavior: 'smooth' }); break; }
    case 'herb-open': openPlantInfo(+a.dataset.k); break;
    case 'herb-more': hLimit += 80; $('hlist').innerHTML = herbHtml(); break;
    case 'time': openTime(); break;
    case 'rip': ripBooster(); break;
    case 'flip': a.classList.toggle('up'); break;
    case 'flipall': document.querySelectorAll('.flipper').forEach(f => f.classList.add('up')); break;
    case 'cook': { const pids = [...document.querySelectorAll('#kit input:checked')].map(pidOf); const r = G.cook(S, pids); if (!r.ok) { toast(r.msg); break; } save(); openKitchen(r); render(); break; }
    case 'heal1': G.heal(S, i); toast('Soignée.'); render(); sendGardener(i, 'mulch'); break;
    case 'water1': { const r = G.waterCells(S, [i]); toast(r.n ? 'Arrosée.' : 'Réserve d’eau insuffisante.'); render(); if (r.n) sendGardener(i, 'water'); break; }
    case 'mulch1': G.mulch(S, i); render(); sendGardener(i, 'mulch'); break;
    case 'compost1': G.compost(S, i); toast('Compost étalé : la plante pousse mieux pendant 30 jours.'); render(); sendGardener(i, 'compost'); break;
    case 'harvest1': { const h = G.harvest(S, i); if (h.ok) toast('+' + fmt(h.kg, 2) + ' kg de ' + h.name.toLowerCase() + '.'); render(); if (h.ok) sendGardener(i, 'harvest'); break; }
    case 'mow1': G.mow(S, i); toast('Consoude fauchée : +2 paillage.'); render(); break;
    case 'remove': if (!ui.confirmDel) { ui.confirmDel = true; renderFiche(); } else { G.remove(S, i); ui.confirmDel = false; ui.sel = -1; render(); } break;
    case 'demo': S = G.demo(); ui = { sel: -1, mode: null, confirmDel: false, tool: 'select', delPending: -1 }; $('layer').innerHTML = ''; render(); toast('Jardin de démonstration : touche une plante pour voir ses voisines.'); break;
    case 'newgame': S = G.newGame(); ui = { sel: -1, mode: null, confirmDel: false, tool: 'select', delPending: -1 }; $('layer').innerHTML = ''; render(); toast('Nouvelle partie.'); break;
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { if ($('layer').innerHTML) closeModal(); else if (ui.mode) { ui.mode = null; render(); } return; }
  if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('cell')) { e.preventDefault(); clickCell(+e.target.dataset.i); }
});
render(); startChars();
})();

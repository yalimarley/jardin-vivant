/* ===== Vue 3D low-poly (Three.js r128) ===== */
(function () {
'use strict';
const T = window.THREE, V = window.V3D = { ok: false, on: false };
if (!T) return;
/* ---------- utilitaires ---------- */
function rngMaker(seed){ return function(){ seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
let rng = rngMaker(20261029);
const smooth = (a,b,x) => { const t = Math.min(1, Math.max(0, (x-a)/(b-a))); return t*t*(3-2*t); };
const lerp = (a,b,t) => a + (b-a)*t;
/* ---------- matériaux partagés (changent avec la saison) ---------- */
const L = c => new T.MeshLambertMaterial({color:c});
const mat = {
  leafA:L(0x6aa64a), leafB:L(0x86c05e), blossom:L(0xf2b6c6), trunk:L(0x7a5a3a), soil:L(0x6e5035), bedEdge:L(0x8a6a48), stone:L(0xd6c8a4),
  red:L(0xc9453a), purple:L(0x5b3a7a), yellow:L(0xf0c84a), white:L(0xf6f4ec), pink:L(0xe58aa8), blue:L(0x5b8fd6), violet:L(0x8f6bb0),
  wall:L(0xf1e7d0), roof:L(0xb5503c), rock:L(0x9aa09a), wood:L(0xa07a4f), water:new T.MeshPhongMaterial({color:0x4f9fd0, specular:0xffffff, shininess:90, transparent:true, opacity:.84, flatShading:true}),
  pine:L(0x2f6b45), skin:L(0xe8b890), shirt:L(0x4f7a9a), straw:L(0xe0c070)
};
mat.crownA = new T.MeshLambertMaterial({color:0x6aa64a, vertexColors:true});
mat.crownB = new T.MeshLambertMaterial({color:0x86c05e, vertexColors:true});
mat.crownBl = new T.MeshLambertMaterial({color:0xf2b6c6, vertexColors:true});
const SEASONS = {
  spring:{zen:0x7fbfe6, tuft:0x86bf60, sky:0xcfe9f2, gA:0x6fae52, gB:0x85c261, leafA:0x74b252, leafB:0x93cc68, blossom:0xf4b6c8, light:0xfff3e0, parts:0xf6c3d2, flow:true, fruit:false},
  summer:{zen:0x5aa6e6, tuft:0x74ad4e, sky:0xbfe2f6, gA:0x559a3c, gB:0x6cb04a, leafA:0x4c963f, leafB:0x66ae4a, blossom:0x4c963f, light:0xfff0cc, parts:null, flow:true, fruit:true},
  autumn:{zen:0x9fb8d0, tuft:0xb4a64a, sky:0xf1dcc2, gA:0x8f9a4a, gB:0xa9a554, leafA:0xd9822b, leafB:0xc2562b, blossom:0xe0a04a, light:0xffe4bc, parts:0xe08a35, flow:false, fruit:true},
  winter:{zen:0xaec2d2, tuft:0xe6eef2, sky:0xdde8ef, gA:0xe6edf0, gB:0xf6f9fa, leafA:0x8a7a6a, leafB:0x7a6a5a, blossom:0x8a7a6a, light:0xdfeaff, parts:0xffffff, flow:false, fruit:false}
};
/* ---------- briques pour les plantes ---------- */
const cache = {};
const geo = {
  ico:(r,d=0)=>cache['i'+r+d] || (cache['i'+r+d] = new T.IcosahedronGeometry(r,d)),
  cyl:(rt,rb,h,s)=>new T.CylinderGeometry(rt,rb,h,s),
  cone:(r,h,s)=>new T.ConeGeometry(r,h,s),
  dod:(r)=>cache['d'+r] || (cache['d'+r] = new T.DodecahedronGeometry(r,0)),
  box:(a,b,c)=>new T.BoxGeometry(a,b,c)
};
function mesh(g, m, x=0, y=0, z=0, shadow=true){ const o = new T.Mesh(g, m); o.position.set(x,y,z); o.castShadow = shadow; o.receiveShadow = true; return o; }

function branches(g){
  [[.0,.9,.1,.5],[.0,.7,-.5,-.4],[.1,1.0,.0,.3]].forEach((b,i)=>{
    const m = mesh(geo.cyl(.025,.04,.7,4), mat.trunk, b[0]*.4, .95 + i*.12, 0); m.rotation.z = (i%2?1:-1)*(.5+i*.15); m.rotation.y = i*2; g.add(m);
  });
}
const LM = () => rng() > .5 ? mat.crownA : mat.crownB;
function hash3(x,y,z){ const q = Math.sin(x*127.1 + y*311.7 + z*74.7)*43758.5453; return q - Math.floor(q); }
function jitter(g, amt){ const p = g.attributes.position; for(let i=0;i<p.count;i++){ const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 1 + (hash3(Math.round(x*100)/100, Math.round(y*100)/100, Math.round(z*100)/100) - .5)*2*amt; p.setXYZ(i, x*k, y*k, z*k); } g.computeVertexNormals(); return g; }
function blob(r, detail){ const g = jitter(new T.IcosahedronGeometry(r, detail || 1), .13), p = g.attributes.position, col = new Float32Array(p.count*3);
  for(let i=0;i<p.count;i++){ let y = p.getY(i); if(y < -.45*r){ p.setY(i, y*.7); y = p.getY(i); } const t = Math.min(1, Math.max(0, (y/r + 1)/2)), sh = .7 + .36*t; col[i*3] = col[i*3+1] = col[i*3+2] = sh; }
  g.setAttribute('color', new T.BufferAttribute(col,3)); return g; }
const rockGeo = r => jitter(new T.DodecahedronGeometry(r,0), .2);
function GG(){ const g = new T.Group(), body = new T.Group(); g.add(body); return [g, body]; }
function done(g, s, apply, sway){ g.scale.setScalar(s); g.userData.apply = apply; g.userData.sway = sway || 0; g.userData.age = 1; return g; }
const mature = g => g.userData.age >= .75;
mat.rhub = L(0xb03a3a); mat.dark = L(0x2a2018);
function put(body, arr, m, x, y, z){ body.add(m); m.position.set(x,y,z); if(arr) arr.push(m); return m; }
function berries(body, def, n, rx, y0, ry, rz, size){ const a = []; for(let i=0;i<n;i++) put(body, a, mesh(geo.ico(size,0), def.fruitMat || mat.red, 0,0,0,false), (rng()-.5)*rx, y0 + rng()*ry, (rng()-.5)*rz); return a; }
const dormant = (body, S, k) => { body.scale.y = season === 'winter' ? (k || .2) : 1; };

const TREES = {
  apple:{th:1.15, cr:[[-.35,1.45,.05,.62],[.38,1.5,-.1,.58],[0,1.95,0,.6],[.05,1.45,.4,.5]], fn:6, sc:1},
  cherry:{th:1.5, cr:[[-.25,1.95,0,.5],[.3,2.0,.05,.48],[0,2.45,0,.5],[0,1.75,.35,.4]], fn:12, fs:.1, sc:1.05},
  pear:{th:1.2, cr:[[0,1.5,0,.72,1.1],[0,2.0,0,.56,1.25],[0,2.5,0,.4,1.4]], fn:6, sc:1.05},
  walnut:{th:1.4, cr:[[-.55,1.9,0,.8],[.6,1.95,-.1,.78],[0,2.5,0,.8],[0,1.9,.6,.65]], fn:0, sc:1.25}
};
function buildTree(def, s){
  const o = TREES[def.m] || TREES.apple, [g, body] = GG();
  body.add(mesh(geo.cyl(.09,.15,o.th,5), mat.trunk, 0, o.th/2, 0)); branches(body);
  const cm = def.blossom ? mat.crownBl : LM();
  body.add(mesh(geo.cone(.2,.32,6), mat.trunk, 0, .14, 0));
  const crowns = o.cr.map(c => { const m = mesh(blob(c[3],1), cm, c[0], c[1], c[2]); if(c[4]) m.scale.y = c[4]; m.rotation.set(rng()*3, rng()*3, 0); body.add(m); return m; });
  const fruits = def.fruit && o.fn ? berries(body, def, o.fn, 1.4, o.th + .2, .9, 1.3, o.fs || .13) : [];
  return done(g, s*o.sc, S => { crowns.forEach(c => c.visible = season !== 'winter'); fruits.forEach(f => f.visible = S.fruit && mature(g)); }, .012);
}
function buildHazel(def, s){
  const [g, body] = GG(), crowns = [], cat = [];
  for(let i=0;i<6;i++){ const a = i/6*6.28 + rng()*.3, cx = Math.cos(a), cz = Math.sin(a);
    const cane = mesh(geo.cyl(.03,.05,1.5,4), mat.trunk, cx*.3, .7, cz*.3); cane.rotation.z = -cx*.35; cane.rotation.x = cz*.35; body.add(cane);
    const lf = mesh(blob(.42,1), LM(), cx*.62, 1.35, cz*.62); lf.scale.y = .8; lf.rotation.set(rng()*3, rng()*3, 0); put(body, crowns, lf, cx*.62, 1.35, cz*.62);
    const c = mesh(geo.cone(.035,.32,4), mat.yellow, 0,0,0,false); c.rotation.x = Math.PI; put(body, cat, c, cx*.76, 1.15, cz*.76); }
  const nuts = def.fruit ? berries(body, def, 6, 1.1, .9, .6, 1.1, .1) : [];
  return done(g, s, S => { crowns.forEach(c => c.visible = season !== 'winter'); cat.forEach(c => c.visible = season === 'winter' || season === 'spring'); nuts.forEach(f => f.visible = S.fruit && mature(g)); }, .02);
}
function buildCassis(def, s){
  const [g, body] = GG(), parts = [], fr = [];
  [[0,.5,0,.55],[.4,.42,.1,.42],[-.38,.42,-.1,.45],[.05,.46,.42,.4]].forEach(c => { const m = mesh(blob(c[3],1), LM(), c[0], c[1], c[2]); m.scale.y = .9; m.rotation.set(rng()*3, rng()*3, 0); body.add(m); parts.push(m); });
  for(let k=0;k<5;k++){ const bx = (rng()-.5)*1.0, by = .25 + rng()*.55, bz = (rng()-.5)*.9; for(let j=0;j<3;j++) put(body, fr, mesh(geo.ico(.07,0), def.fruitMat, 0,0,0,false), bx + (j-1)*.08, by - (j%2)*.07, bz); }
  return done(g, s, S => { parts.forEach(p => p.visible = season !== 'winter'); fr.forEach(f => f.visible = S.fruit && mature(g)); }, .02);
}
function buildRasp(def, s){
  const [g, body] = GG(), parts = [], fr = [];
  for(let i=0;i<8;i++){ const a = i/8*6.28 + rng()*.3, cx = Math.cos(a), cz = Math.sin(a), h = 1.3 + rng()*.5;
    const cane = mesh(geo.cyl(.025,.04,h,4), mat.trunk, cx*.22, h/2, cz*.22); cane.rotation.z = -cx*.28; cane.rotation.x = cz*.28; body.add(cane);
    for(let k=0;k<2;k++){ const lf = mesh(blob(.2,1), LM(), 0,0,0); lf.scale.set(1,.6,1.2); lf.rotation.y = rng()*3; put(body, parts, lf, cx*(.38+k*.18), h*(.5+k*.4), cz*(.38+k*.18)); }
    put(body, fr, mesh(geo.ico(.075,0), def.fruitMat, 0,0,0,false), cx*.5, h*.45, cz*.5); put(body, fr, mesh(geo.ico(.075,0), def.fruitMat, 0,0,0,false), cx*.58, h*.62, cz*.58); }
  return done(g, s, S => { parts.forEach(p => p.visible = season !== 'winter'); fr.forEach(f => f.visible = S.fruit && mature(g)); }, .025);
}
function buildElder(def, s){
  const [g, body] = GG(), parts = [], fl = [], fr = [];
  body.add(mesh(geo.cyl(.07,.12,.9,5), mat.trunk, 0, .45, 0));
  [[-.4,1.2,0,.6],[.45,1.25,-.1,.55],[0,1.6,.1,.55],[.05,1.2,.5,.48]].forEach(c => { const m = mesh(blob(c[3],1), LM(), c[0], c[1], c[2]); m.rotation.set(rng()*3, rng()*3, 0); body.add(m); parts.push(m); });
  [[-.4,1.72],[.45,1.78],[0,2.1],[.05,1.62],[.5,1.45]].forEach((c,i) => { const x = c[0], z = i === 3 ? .5 : (i === 4 ? .2 : 0.05);
    put(body, fl, mesh(new T.CylinderGeometry(.34,.3,.05,8), mat.white, 0,0,0,false), x, c[1], z);
    put(body, fr, mesh(new T.CylinderGeometry(.3,.26,.08,8), def.fruitMat, 0,0,0,false), x, c[1] - .05, z); });
  return done(g, s, S => { parts.forEach(p => p.visible = season !== 'winter'); fl.forEach(f => f.visible = S.flow && season !== 'winter' && mature(g)); fr.forEach(f => f.visible = S.fruit && mature(g)); }, .015);
}
function buildFennel(def, s){
  const [g, body] = GG(), fl = [];
  for(let i=0;i<3;i++){ const a = i*2.1, x = Math.cos(a)*.18, z = Math.sin(a)*.18, h = 1.3 + i*.2;
    body.add(mesh(geo.cyl(.025,.04,h,4), mat.leafA, x, h/2, z));
    for(let k=0;k<4;k++){ const f = mesh(geo.cone(.06,.5,3), mat.leafB, x + Math.cos(k*1.6)*.14, .3 + k*.28, z + Math.sin(k*1.6)*.14); f.rotation.z = Math.cos(k*1.6)*.4; f.rotation.x = -Math.sin(k*1.6)*.4; body.add(f); }
    const u = mesh(new T.CylinderGeometry(.3,.26,.05,8), def.flower || mat.yellow, x, h + .05, z, false); put(body, fl, u, x, h + .05, z); }
  return done(g, s, S => { dormant(body, S); fl.forEach(f => f.visible = S.flow); }, .05);
}
function buildLavender(def, s){
  const [g, body] = GG(), fl = [];
  const mound = mesh(geo.ico(.4,0), mat.leafB, 0, .22, 0); mound.scale.set(1.2,.55,1.2); body.add(mound);
  for(let i=0;i<9;i++){ const a = i/9*6.28, r = .06 + (i%3)*.1, x = Math.cos(a)*r, z = Math.sin(a)*r;
    const st = mesh(geo.cyl(.012,.02,.6,3), mat.leafA, x, .55, z); st.rotation.z = -x*.8; st.rotation.x = z*.8; body.add(st);
    put(body, fl, mesh(geo.cone(.06,.3,5), def.flower || mat.violet, 0,0,0,false), x*1.25, .92, z*1.25); }
  return done(g, s, S => { dormant(body, S, .35); fl.forEach(f => f.visible = S.flow); }, .03);
}
function buildComfrey(def, s){
  const [g, body] = GG(), fl = [];
  for(let i=0;i<6;i++){ const a = i/6*6.28, m = mesh(geo.dod(.42), i%2 ? mat.leafA : mat.leafB, Math.cos(a)*.32, .3 + (i%2)*.1, Math.sin(a)*.32); m.scale.set(1.2,.14,.55); m.rotation.y = -a; m.rotation.z = .3; body.add(m); }
  body.add(mesh(geo.cyl(.03,.04,1.0,4), mat.leafA, 0, .5, 0));
  for(let i=0;i<5;i++){ const c = mesh(geo.cone(.08,.22,5), def.flower || mat.violet, 0,0,0,false); c.rotation.x = Math.PI; put(body, fl, c, Math.cos(i*1.3)*.16, .85 + i*.04, Math.sin(i*1.3)*.16); }
  return done(g, s, S => { dormant(body, S); fl.forEach(f => f.visible = S.flow); }, .03);
}
function buildBorage(def, s){
  const [g, body] = GG(), fl = [];
  for(let i=0;i<5;i++){ const a = i/5*6.28, m = mesh(geo.dod(.3), mat.leafA, Math.cos(a)*.25, .22, Math.sin(a)*.25); m.scale.set(1,.2,.6); m.rotation.y = -a; body.add(m); }
  for(let i=0;i<4;i++){ const a = i*1.6, x = Math.cos(a)*.22, z = Math.sin(a)*.22, h = .7 + (i%2)*.2;
    body.add(mesh(geo.cyl(.012,.02,h,3), mat.leafA, x, h/2 + .1, z));
    const star = mesh(geo.ico(.12,0), def.flower || mat.blue, 0,0,0,false); star.scale.y = .45; put(body, fl, star, x, h + .1, z);
    const c = mesh(geo.ico(.04,0), mat.dark, x, h + .14, z, false); body.add(c); fl.push(c); }
  return done(g, s, S => { dormant(body, S); fl.forEach(f => f.visible = S.flow); }, .04);
}
function buildChive(def, s){
  const [g, body] = GG(), fl = [];
  for(let i=0;i<16;i++){ const a = rng()*6.28, r = rng()*.18, h = .45 + rng()*.35; const b = mesh(geo.cone(.022,h,3), mat.leafA, Math.cos(a)*r, h/2, Math.sin(a)*r); b.rotation.z = Math.cos(a)*.15; b.rotation.x = -Math.sin(a)*.15; body.add(b); }
  for(let i=0;i<3;i++){ const a = i*2.1, x = Math.cos(a)*.15, z = Math.sin(a)*.15; body.add(mesh(geo.cyl(.012,.015,.75,3), mat.leafA, x, .38, z)); put(body, fl, mesh(geo.ico(.12,0), def.flower || mat.pink, 0,0,0,false), x, .8, z); }
  return done(g, s, S => { dormant(body, S); fl.forEach(f => f.visible = S.flow); }, .03);
}
function buildRhubarb(def, s){
  const [g, body] = GG();
  for(let i=0;i<6;i++){ const a = i/6*6.28 + .3, cx = Math.cos(a), cz = Math.sin(a);
    const st = mesh(geo.cyl(.04,.06,.75,5), mat.rhub, cx*.25, .38, cz*.25); st.rotation.z = -cx*.45; st.rotation.x = cz*.45; body.add(st);
    const lf = mesh(geo.dod(.5), i%2 ? mat.leafA : mat.leafB, cx*.52, .72 + (i%3)*.05, cz*.52); lf.scale.set(1,.12,.85); lf.rotation.y = -a; lf.rotation.z = .2; body.add(lf); }
  return done(g, s, S => { dormant(body, S, .15); }, .02);
}
function buildArtichoke(def, s){
  const [g, body] = GG(), fl = [];
  for(let i=0;i<8;i++){ const a = i/8*6.28, cx = Math.cos(a), cz = Math.sin(a), lf = mesh(geo.cone(.15,1.0,4), i%2 ? mat.leafB : mat.leafA, cx*.4, .5, cz*.4); lf.rotation.z = -cx*.9; lf.rotation.x = cz*.9; lf.scale.z = .45; body.add(lf); }
  body.add(mesh(geo.cyl(.04,.06,1.35,5), mat.leafA, 0, .68, 0));
  body.add(mesh(geo.ico(.2,0), mat.leafB, 0, 1.4, 0));
  put(body, fl, mesh(geo.ico(.16,0), def.flower || mat.violet, 0,0,0,false), 0, 1.58, 0);
  return done(g, s, S => { dormant(body, S, .15); fl.forEach(f => f.visible = S.flow); }, .02);
}
function buildStraw(def, s){
  const [g, body] = GG(), fr = [];
  for(let i=0;i<5;i++){ const a = i/5*6.28, cx = Math.cos(a)*.3, cz = Math.sin(a)*.3;
    for(let j=0;j<3;j++){ const b = j*2.09, m = mesh(geo.dod(.14), j%2 ? mat.leafA : mat.leafB, cx + Math.cos(b)*.13, .14, cz + Math.sin(b)*.13); m.scale.y = .35; m.rotation.y = b; body.add(m); } }
  for(let i=0;i<5;i++){ const a = i*1.3; put(body, fr, mesh(geo.ico(.07,0), def.fruitMat, 0,0,0,false), Math.cos(a)*.32, .13, Math.sin(a)*.32); }
  return done(g, s, S => { dormant(body, S, .4); fr.forEach(f => f.visible = S.fruit && mature(g)); }, 0);
}
function buildClover(def, s){
  const [g, body] = GG(), fl = [];
  for(let i=0;i<7;i++){ const a = i/7*6.28, m = mesh(geo.dod(.3), i%2 ? mat.leafA : mat.leafB, Math.cos(a)*.32, .08, Math.sin(a)*.32); m.scale.y = .28; m.rotation.y = rng()*3; body.add(m); }
  const c = mesh(geo.dod(.3), mat.leafB, 0, .1, 0); c.scale.y = .3; body.add(c);
  for(let i=0;i<8;i++){ const a = i*.8; body.add(mesh(geo.cyl(.01,.012,.25,3), mat.leafA, Math.cos(a)*.34, .15, Math.sin(a)*.34)); put(body, fl, mesh(geo.ico(.07,0), mat.white, 0,0,0,false), Math.cos(a)*.34, .3, Math.sin(a)*.34); }
  return done(g, s, S => { dormant(body, S, .4); fl.forEach(f => f.visible = S.flow); }, 0);
}
function buildSquash(def, s){
  const [g, body] = GG(), fr = [];
  for(let i=0;i<5;i++){ const a = i/5*6.28 + .4, m = mesh(geo.dod(.48), i%2 ? mat.leafA : mat.leafB, Math.cos(a)*.42, .13 + (i%2)*.05, Math.sin(a)*.42); m.scale.set(1,.14,1); m.rotation.y = rng()*3; body.add(m); }
  for(let i=0;i<2;i++){ const a = 1.2 + i*3; const p = mesh(geo.ico(.26,1), def.fruitMat, 0,0,0); p.scale.y = .75; put(body, fr, p, Math.cos(a)*.5, .22, Math.sin(a)*.5); }
  return done(g, s, S => { dormant(body, S, .3); fr.forEach(f => f.visible = S.fruit && mature(g)); }, 0);
}
function buildVine(def, s){
  const [g, body] = GG(), leaves = [], grapes = [];
  [-.7,.7].forEach(x => body.add(mesh(geo.cyl(.05,.06,1.7,5), mat.wood, x, .85, 0)));
  [.5,1.0,1.55].forEach(y => body.add(mesh(geo.box(1.5,.05,.05), mat.wood, 0, y, 0)));
  for(let i=0;i<10;i++){ const m = mesh(geo.ico(.26,0), i%2 ? mat.leafA : mat.leafB, -.62 + (i%5)*.31, .6 + Math.floor(i/5)*.6 + (i%3)*.1, (i%2 ? .07 : -.07)); m.rotation.set(rng()*3, rng()*3, 0); body.add(m); leaves.push(m); }
  for(let k=0;k<4;k++){ const bx = -.5 + k*.34; for(let j=0;j<7;j++){ const row = j < 3 ? 0 : j < 5 ? 1 : 2, nx = row === 0 ? (j-1)*.07 : row === 1 ? (j-3.5)*.07 : 0; put(body, grapes, mesh(geo.ico(.055,0), def.fruitMat, 0,0,0,false), bx + nx, .98 - row*.09, .12); } }
  return done(g, s, S => { leaves.forEach(l => l.visible = season !== 'winter'); grapes.forEach(f => f.visible = S.fruit && mature(g)); }, 0);
}
const MODEL = {apple:buildTree, cherry:buildTree, pear:buildTree, walnut:buildTree, hazel:buildHazel, cassis:buildCassis, rasp:buildRasp, elder:buildElder,
  fennel:buildFennel, lavender:buildLavender, comfrey:buildComfrey, borage:buildBorage, chive:buildChive, rhubarb:buildRhubarb, artichoke:buildArtichoke,
  strawberry:buildStraw, clover:buildClover, squash:buildSquash, vine:buildVine};
function buildShrub(def, s){
  const g = new T.Group(), body = new T.Group(); g.add(body);
  const cm = def.blossom ? mat.blossom : (rng()>.5 ? mat.leafA : mat.leafB);
  const parts = [[0,.38,0,.5],[.34,.3,.1,.38],[-.3,.3,-.12,.4]].map(c => { const m = mesh(geo.ico(c[3],0), cm, c[0], c[1], c[2]); m.scale.y = .85; m.rotation.set(rng()*3, rng()*3, 0); body.add(m); return m; });
  body.add(mesh(geo.cyl(.03,.05,.3,4), mat.trunk, 0, .12, 0));
  const fruits = [];
  if(def.fruit){ for(let i=0;i<5;i++){ const f = mesh(geo.ico(.1,0), def.fruitMat || mat.red, (rng()-.5)*.9, .3+rng()*.4, (rng()-.5)*.8, false); body.add(f); fruits.push(f);} }
  g.scale.setScalar(s);
  g.userData.apply = S => { parts.forEach(p => p.visible = season !== 'winter'); fruits.forEach(f => f.visible = S.fruit); };
  g.userData.sway = .02; return g;
}
function buildHerb(def, s){
  const g = new T.Group(), body = new T.Group(); g.add(body);
  const blades = [];
  for(let i=0;i<8;i++){
    const h = .55 + rng()*.55, a = i/8*Math.PI*2 + rng()*.4;
    const b = mesh(geo.cone(.07,h,4), rng()>.5 ? mat.leafA : mat.leafB, Math.cos(a)*.14, h/2, Math.sin(a)*.14);
    b.rotation.z = Math.cos(a)*.35; b.rotation.x = -Math.sin(a)*.35; body.add(b); blades.push(b);
  }
  const flowers = [];
  if(def.flower){ for(let i=0;i<4;i++){ const a = i*1.7; const f = mesh(geo.ico(.1,0), def.flower, Math.cos(a)*.22, .75+rng()*.35, Math.sin(a)*.22, false); body.add(f); flowers.push(f);} }
  g.scale.setScalar(s);
  g.userData.apply = S => { body.scale.y = season === 'winter' ? .2 : 1; flowers.forEach(f => f.visible = S.flow); };
  g.userData.sway = .045; return g;
}
function buildBroad(def, s){
  const g = new T.Group(), body = new T.Group(); g.add(body);
  for(let i=0;i<6;i++){
    const a = i/6*Math.PI*2, m = mesh(geo.dod(.38), i%2 ? mat.leafA : mat.leafB, Math.cos(a)*.32, .42 + (i%3)*.1, Math.sin(a)*.32);
    m.scale.set(1,.16,.8); m.rotation.y = -a; m.rotation.z = .35; body.add(m);
  }
  const flowers = [];
  if(def.flower){ const f = mesh(geo.ico(.16,0), def.flower, 0, 1.05, 0, false); body.add(f); body.add(mesh(geo.cyl(.025,.03,.8,4), mat.leafA, 0, .6, 0)); flowers.push(f); }
  g.scale.setScalar(s);
  g.userData.apply = S => { body.scale.y = season === 'winter' ? .2 : 1; flowers.forEach(f => f.visible = S.flow); };
  g.userData.sway = .025; return g;
}
function buildCover(def, s){
  const g = new T.Group(), body = new T.Group(); g.add(body);
  for(let i=0;i<5;i++){ const a = i/5*Math.PI*2, m = mesh(geo.dod(.3), i%2 ? mat.leafA : mat.leafB, Math.cos(a)*.3, .1, Math.sin(a)*.3); m.scale.y = .38; m.rotation.y = rng()*3; body.add(m); }
  body.add(mesh(geo.dod(.32), mat.leafB, 0, .13, 0)); body.children[5].scale.y = .4;
  const fr = [];
  if(def.fruit){ for(let i=0;i<4;i++){ const a = i*1.6; const f = mesh(geo.ico(.1,0), def.fruitMat || mat.red, Math.cos(a)*.3, .2, Math.sin(a)*.3, false); body.add(f); fr.push(f);} }
  g.scale.setScalar(s);
  g.userData.apply = S => { body.scale.y = season === 'winter' ? .3 : 1; fr.forEach(f => f.visible = S.fruit); };
  g.userData.sway = 0; return g;
}
const BUILD = {tree:buildTree, shrub:buildShrub, herb:buildHerb, broad:buildBroad, cover:buildCover, vine:buildVine};

/* ---------- état et utilitaires du jeu ---------- */
let season = 'summer', curS = SEASONS.summer, trans = null, hour = 15;
const CELL = 2.1;
let A = null, R = null, scene, camera, canvas, wrap, bdiv, ro = null;
let COLS = 8, ROWS = 6, HW = 8, HH = 6, STRN = 16, dimKey = '';
const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const GS = 4.4, RG = 1.7; let BCOLS = 4, BROWS = 3, cpos = {};
const hj = (a, b) => { const q = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return q - Math.floor(q); };
function bcenter(bx, by) { const par = ((by % 2) + 2) % 2, j = (bx >= 0 && by >= 0 && bx < BCOLS && by < BROWS) ? 1 : 0;
  return [(bx + .5 - BCOLS / 2) * GS + (par ? .11 : -.11) * GS + (hj(bx, by) - .5) * .8 * j, (by + .5 - BROWS / 2) * GS + (hj(by + 7, bx + 3) - .5) * .8 * j]; }
function cr2xz(c, r) { const ci = Math.floor(r) * STRN + Math.floor(c); if (c >= 0 && r >= 0 && cpos[ci]) return [cpos[ci][0] + (c - Math.floor(c) - .5) * .5, cpos[ci][1] + (r - Math.floor(r) - .5) * .5]; const bx = Math.floor(c / 2), by = Math.floor(r / 2), q = bcenter(bx, by); return [q[0] + (c - 2 * bx - 1) * .85, q[1] + (r - 2 * by - 1) * .85]; }
function cellXZ(i) { if (cpos[i]) return cpos[i]; const c = i % STRN, r = (i / STRN) | 0; return bcenter(c >> 1, r >> 1); }
function hAt(x, z) {
  const r = Math.hypot(x / (HW + 4.5), z / (HH + 4.5)), k = smooth(1.05, 2.2, r);
  const n = Math.sin(x * .19 + 1.3) * Math.cos(z * .16) * 1.4 + Math.sin((x + z) * .09) * 2 + Math.sin(x * .4) * Math.sin(z * .35) * .5;
  return k * (n + k * 5);
}
const seasonKey = m => (m >= 2 && m <= 4) ? 'spring' : (m >= 5 && m <= 7) ? 'summer' : (m >= 8 && m <= 10) ? 'autumn' : 'winter';

/* ---------- plantes du jeu -> modèles ---------- */
const NAMEMAP = [
  [/pommier/, 'apple'], [/poirier|cognassier|nefli|nashi/, 'pear'], [/cerisier|merisier|prunier|prunellier|abricotier|pecher|amandier|mirabell|nectarin|brugnon|pruneau/, 'cherry'],
  [/noyer|chataignier|figuier|murier|kaki|chene|noisetier de byzance|pacanier/, 'walnut'], [/noisetier/, 'hazel'],
  [/cassis|groseill|myrtille|gadelle|aronia|cassissier|jostaberry|casseille/, 'cassis'], [/framboisier|ronce|roncier|mure/, 'rasp'], [/sureau/, 'elder'],
  [/fenouil|aneth/, 'fennel'], [/lavande|romarin|sauge|thym|origan|hysope|sarriette|menthe/, 'lavender'], [/consoude/, 'comfrey'], [/bourrache|bugle|pulmonaire/, 'borage'],
  [/ciboulette|ail |^ail|oignon|poireau|echalote|civette/, 'chive'], [/rhubarbe|oseille/, 'rhubarb'], [/artichaut|cardon|chardon/, 'artichoke'],
  [/fraisier|fraise/, 'strawberry'], [/trefle|luzerne|lotier/, 'clover'], [/courge|courgette|potiron|citrouille|melon|pasteque|concombre|potimarron/, 'squash'], [/vigne|raisin/, 'vine']
];
const KIND = { 'Arbre': 'tree', 'Arbuste': 'shrub', 'Herbacée': 'herb', 'Racine': 'broad', 'Grimpante': 'vine', 'Couvre-sol': 'cover' };
const FRUITTREE = new Set(['apple', 'pear', 'cherry']);
const mcache = {};
function modelFor(p) {
  if (mcache[p.id] !== undefined) return mcache[p.id];
  const n = norm(p.name); let m = null;
  for (const [re, k] of NAMEMAP) if (re.test(n)) { m = k; break; }
  if (m && ['apple', 'pear', 'cherry', 'walnut'].includes(m) && p.strate !== 'Arbre') m = null;
  if (m === 'vine' && p.strate !== 'Grimpante') m = null;
  if (m === 'squash' && p.strate === 'Arbre') m = null;
  if (!m && p.strate === 'Arbre') m = ['apple', 'pear', 'cherry', 'walnut'][p.id % 4];
  return (mcache[p.id] = m);
}
const lcache = {};
function lpal(col) {
  if (lcache[col]) return lcache[col];
  const c = new T.Color(col), c2 = c.clone().offsetHSL(0, .02, .07), cm = x => new T.MeshLambertMaterial({ color: x, vertexColors: true });
  return (lcache[col] = { leafA: L(c), leafB: L(c2), crownA: cm(c), crownB: cm(c2), crownBl: cm(0xf2b6c6), blossom: L(0xf2b6c6) });
}
const fmat = {};
const fruitM = col => fmat[col] || (fmat[col] = L(col));
function buildPlant(p, cell, st) {
  const sk = st.sk, m = st.mo, woody = p.strate === 'Arbre' || p.strate === 'Arbuste' || p.strate === 'Grimpante';
  let lc = A.leafColor(p, m, st.dry), bare = false;
  if (!lc) { bare = true; lc = '#8a7a6a'; }
  const pal = lpal(lc), keep = {}; ['leafA', 'leafB', 'crownA', 'crownB', 'crownBl', 'blossom'].forEach(k => { keep[k] = mat[k]; mat[k] = pal[k]; });
  const model = modelFor(p), fr = p.kg > 0 || (p.tags && p.tags.includes('fruit'));
  const def = { k: KIND[p.strate] || 'herb', m: model, fruit: fr, fruitMat: fruitM(p.col || '#c9453a'), flower: fruitM(p.kg > 0 ? '#f6f4ec' : (p.col || '#e58aa8')), blossom: FRUITTREE.has(model) && sk === 'spring' };
  const savedSeason = season; season = woody ? (bare ? 'winter' : (sk === 'winter' ? 'autumn' : sk)) : sk;
  const sizeBase = def.k === 'tree' ? 1.15 : 1;
  let g; try { g = (MODEL[model] || BUILD[def.k])(def, sizeBase * (.92 + rng() * .18)); } catch (e) { g = BUILD.cover(def, 1); }
  const age = (st.stage === 'mature' || st.stage === 'jeune' || st.ready) ? 1 : .5; g.userData.age = age;
  g.userData.apply({ fruit: !!st.ready, flow: (sk === 'spring' || sk === 'summer') && st.stage !== 'pousse' && st.stage !== 'graine' });
  season = savedSeason; Object.assign(mat, keep);
  const gf = .2 + .8 * smooth(0, 1, st.prog); g.scale.multiplyScalar(gf); g.userData.base = g.scale.x; g.userData.phase = rng() * 6;
  return g;
}

/* ---------- mobilier ---------- */
const glass = new T.MeshPhongMaterial({ color: 0xcfeaf2, transparent: true, opacity: .3, shininess: 80, flatShading: true, depthWrite: false });
function furn(k, cell) {
  const g = new T.Group(), B = (w, h, d, m, x, y, z) => { const o = mesh(geo.box(w, h, d), m, x, y, z); g.add(o); return o; };
  if (k === 'treille') { [-.75, .75].forEach(x => B(.09, 1.9, .09, mat.wood, x, .95, 0)); [.6, 1.1, 1.65].forEach(y => B(1.6, .04, .04, mat.wood, 0, y, 0)); }
  else if (k === 'pergola') { [[-.85, -.85], [.85, -.85], [-.85, .85], [.85, .85]].forEach(a => B(.12, 2.3, .12, mat.wood, a[0], 1.15, a[1])); for (let i = 0; i < 6; i++) B(2, .06, .12, mat.wood, 0, 2.32, -.85 + i * .34); [-.85, .85].forEach(z => B(2, .1, .1, mat.wood, 0, 2.2, z)); }
  else if (k === 'serre' || k === 'grandeserre') {
    const s = k === 'grandeserre' ? 1.28 : 1, w = 1.7 * s, h = 1.25 * s; const f = new T.MeshLambertMaterial({ color: 0xe8e2d0 });
    B(w, .08, w, f, 0, .06, 0); B(w, h, w, glass, 0, h / 2 + .08, 0); const ro = mesh(new T.CylinderGeometry(.01, w * .78, .75 * s, 4), glass, 0, h + .46, 0); ro.rotation.y = Math.PI / 4; g.add(ro);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(a => B(.07, h, .07, f, a[0] * w / 2, h / 2 + .08, a[1] * w / 2)); B(w, .06, .06, f, 0, h + .08, w / 2); B(w, .06, .06, f, 0, h + .08, -w / 2);
    for (let i = 0; i < 3; i++) { const q = mesh(geo.ico(.22, 0), i % 2 ? mat.leafA : mat.leafB, (i - 1) * .45 * s, .4, (i % 2 ? .3 : -.3) * s); q.scale.y = .8; g.add(q); }
  }
  else if (k === 'mare') {
    const pg = new T.CircleGeometry(.98, 16); pg.rotateX(-Math.PI / 2); const w = new T.Mesh(pg, mat.water); w.position.y = .07; g.add(w); g.userData.water = w;
    const bk = mesh(new T.CylinderGeometry(1.0, 1.06, .1, 14), mat.soil, 0, .03, 0, false); g.add(bk);
    for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28, rk = mesh(rockGeo(.16 + rng() * .1), mat.rock, Math.cos(a) * 1.0, .1, Math.sin(a) * 1.0); g.add(rk); }
    for (let i = 0; i < 6; i++) { const a = i * 1.1 + .3, pad = mesh(geo.dod(.2), mat.leafA, Math.cos(a) * (.35 + (i % 3) * .2), .09, Math.sin(a) * (.3 + (i % 2) * .2), false); pad.scale.set(1, .1, 1); g.add(pad); }
    for (let i = 0; i < 5; i++) { const a = i * 1.3, h = .7 + rng() * .4; g.add(mesh(geo.cyl(.012, .016, h, 3), mat.leafA, Math.cos(a) * .85, h / 2, Math.sin(a) * .8, false)); g.add(mesh(geo.cyl(.04, .04, .18, 5), mat.trunk, Math.cos(a) * .85, h, Math.sin(a) * .8, false)); }
    if (cell && cell.ducks) [[-.3, .2, 0xf3e7cf], [.35, -.15, 0xc8a46a]].forEach(d => { const b = mesh(geo.ico(.15, 0), L(d[2]), d[0], .17, d[1]); b.scale.set(1, .8, 1.35); g.add(b); const h = mesh(geo.ico(.08, 0), L(d[2]), d[0], .34, d[1] + .1); g.add(h); g.add(mesh(geo.cone(.04, .1, 4), mat.yellow, d[0], .33, d[1] + .2, false)).rotation.x = Math.PI / 2; });
  }
  else if (k === 'ruche') {
    [-.35, .35].forEach(x => B(.08, .35, .08, mat.wood, x, .18, 0)); B(.9, .3, .7, mat.straw, 0, .5, 0); B(.9, .3, .7, mat.white, 0, .8, 0); B(1.0, .08, .8, mat.roof, 0, 1.02, 0); B(.3, .06, .1, mat.dark, 0, .56, .36);
    g.userData.bees = true;
  }
  else if (k === 'hamac') {
    [-.95, .95].forEach(x => B(.1, 1.7, .1, mat.wood, x, .85, 0)); const h = mesh(geo.box(1.7, .06, .5), L(0xc8553a), 0, .8, 0); h.scale.set(1, 1, 1); g.add(h); h.geometry = h.geometry.clone();
    const pa = h.geometry.attributes.position; for (let i = 0; i < pa.count; i++) { const x = pa.getX(i); pa.setY(i, pa.getY(i) + (x * x / .72 - 1) * .1 - .08 + (x * x) * .0); } pa.needsUpdate = true; h.geometry.computeVertexNormals();
  }
  else B(.7, .5, .7, mat.wood, 0, .25, 0);
  return g;
}

/* ---------- décor ---------- */
const SH = [0xc8553a, 0x3f7fb5, 0xe0a23a, 0x8a5aa6], PA = [0x4a5a7a, 0x6b4a30, 0x5a7a5a, 0x3a4a6a], SK = [0xe8bf98, 0xd9a47a, 0xf0cfa8, 0xc58a62], HR = [0x3a2b20, 0x7a4a24, 0xd9b45a, 0x2a1f18];
function house() {
  const h = new T.Group();
  h.add(mesh(geo.box(4.2, 2.4, 3.4), mat.wall, 0, 1.2, 0));
  const roof = mesh(new T.ConeGeometry(3.5, 1.9, 4), mat.roof, 0, 3.3, 0); roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, .82); h.add(roof);
  h.add(mesh(geo.box(.7, 1.4, .1), mat.wood, .6, .7, 1.72)); h.add(mesh(geo.box(.7, .6, .1), L(0xa9d0e0), -.9, 1.4, 1.72)); h.add(mesh(geo.box(.5, 1.2, .5), mat.rock, 1.2, 3.5, -.6));
  return h;
}
function barrel(level) {
  const g = new T.Group(); g.add(mesh(geo.cyl(.45, .5, .95, 8), mat.wood, 0, .48, 0));
  for (const y of [.2, .75]) g.add(mesh(geo.cyl(.5, .5, .05, 8), mat.dark, 0, y, 0));
  const w = mesh(geo.cyl(.4, .4, .02, 8), mat.water, 0, .5 + .42 * Math.max(.05, level), 0, false); g.add(w); return g;
}
function composter(f) {
  const g = new T.Group();
  [[0, .2, .55, 1.1, .14, .06], [0, .45, .55, 1.1, .14, .06], [0, .7, .55, 1.1, .14, .06], [0, .2, -.55, 1.1, .14, .06], [0, .45, -.55, 1.1, .14, .06], [0, .7, -.55, 1.1, .14, .06], [.55, .45, 0, .06, .6, 1.1], [-.55, .45, 0, .06, .6, 1.1]].forEach(b => g.add(mesh(geo.box(b[3], b[4], b[5]), mat.wood, b[0], b[1], b[2])));
  const fill = mesh(blob(.5, 1), mat.soil, 0, .35 + .35 * f, 0); fill.scale.set(1.1, .6, 1.1); g.add(fill); return g;
}
function poulailler() {
  const g = new T.Group(); g.add(mesh(geo.box(1.5, 1, 1.1), L(0xc9a574), 0, .85, 0)); const r = mesh(new T.ConeGeometry(1.2, .7, 4), mat.roof, 0, 1.7, 0); r.rotation.y = Math.PI / 4; r.scale.set(1.05, 1, .8); g.add(r);
  [.4, .8, 1.2].forEach(x => g.add(mesh(geo.cyl(.03, .03, .8, 4), mat.wood, 1.0 + x, .4, .0))); g.add(mesh(geo.box(.04, .04, 2), mat.wood, 1.6, .4, 0));
  g.add(mesh(geo.box(1.7, .02, 1.6), mat.soil, 1.55, .02, 0, false)); g.add(mesh(geo.box(.04, .9, 1.6), L(0xe6dcc0), 2.35, .45, 0));
  [[1.4, .3, 0xf5efe0], [1.9, -.4, 0xc8764a]].forEach(h => { const b = mesh(geo.ico(.17, 0), L(h[2]), h[0], .25, h[1]); b.scale.set(1, .9, 1.2); g.add(b); g.add(mesh(geo.ico(.08, 0), L(h[2]), h[0] + .08, .43, h[1], false)); g.add(mesh(geo.ico(.04, 0), mat.red, h[0] + .1, .5, h[1], false)); });
  return g;
}
function atelier() {
  const g = new T.Group(); g.add(mesh(geo.box(2.2, 1.3, 1.6), L(0xd9c9a4), 0, .65, 0)); const r = mesh(new T.ConeGeometry(1.9, .9, 4), L(0x7a5a3a), 0, 1.75, 0); r.rotation.y = Math.PI / 4; r.scale.set(1, 1, .78); g.add(r);
  g.add(mesh(geo.box(.5, .9, .08), mat.wood, .5, .45, .84)); g.add(mesh(geo.box(.6, .4, .08), glass, -.5, .8, .84)); g.add(mesh(geo.box(1.4, .08, .5), mat.wood, -.2, .3, 1.1));
  for (let i = 0; i < 3; i++) g.add(mesh(geo.cyl(.1, .1, .22, 6), L([0xc9453a, 0xf0c84a, 0x5b3a7a][i]), -.7 + i * .35, .45, 1.1)); return g;
}
function borderTree(t) {
  const g = new T.Group();
  if (t && t.formed) { g.add(mesh(geo.cyl(.28, .38, 1.4, 6), mat.trunk, 0, .7, 0)); for (let i = 0; i < 9; i++) { const a = i / 9 * 6.28, s = mesh(geo.cyl(.03, .05, 1.1 + (i % 3) * .2, 4), mat.trunk, Math.cos(a) * .22, 1.9, Math.sin(a) * .22); s.rotation.z = -Math.cos(a) * .4; s.rotation.x = Math.sin(a) * .4; g.add(s); if (season !== 'winter') g.add(mesh(geo.ico(.16, 0), mat.leafB, Math.cos(a) * .5, 2.5 + (i % 3) * .1, Math.sin(a) * .5)); } }
  else { g.add(mesh(geo.cyl(.14, .24, 2.2, 6), mat.trunk, 0, 1.1, 0)); if (season !== 'winter') [[0, 2.9, 0, 1.1], [.7, 2.5, .2, .8], [-.65, 2.5, -.2, .8]].forEach((c, i) => { const m = mesh(blob(c[3], 1), i % 2 ? mat.crownB : mat.crownA, c[0], c[1], c[2]); m.rotation.y = i * 2; g.add(m); }); else [[.5, 1.8], [-.5, 2.3], [.1, 2.7]].forEach(b => { const br = mesh(geo.cyl(.03, .06, 1.2, 4), mat.trunk, b[0] * .6, b[1], 0); br.rotation.z = -b[0]; g.add(br); }); }
  return g;
}
function lawnPatch(ready) {
  const g = new T.Group(), n = ready ? 26 : 10, c = ready ? 0x7fb552 : 0x9bc269;
  const base = mesh(new T.CylinderGeometry(1.4, 1.5, .06, 9), L(c), 0, .03, 0, false); base.scale.z = .75; g.add(base);
  const tm = new T.MeshLambertMaterial({ color: ready ? 0x6aa044 : 0x88b85a });
  for (let i = 0; i < n; i++) { const a = rng() * 6.28, r = Math.sqrt(rng()) * 1.2, h = ready ? .55 + rng() * .35 : .16 + rng() * .1; const b = mesh(geo.cone(.07, h, 3), tm, Math.cos(a) * r, h / 2, Math.sin(a) * r * .72, false); b.rotation.set((rng() - .5) * .4, rng() * 6, (rng() - .5) * .4); g.add(b); }
  return g;
}

/* ---------- personnages ---------- */
function human(k, gardener) {
  const g = new T.Group(), body = new T.Group(); g.add(body);
  const sh = gardener ? mat.shirt : L(SH[k % 4]), pa = L(gardener ? 0x3d4a5c : PA[k % 4]), sk = L(gardener ? 0xe8b890 : SK[k % 4]);
  body.add(mesh(geo.cyl(.2, .26, .55, 6), sh, 0, .64, 0)); body.add(mesh(geo.ico(.19, 0), sk, 0, 1.08, 0));
  if (gardener) { body.add(mesh(geo.cyl(.38, .38, .04, 8), mat.straw, 0, 1.2, 0)); body.add(mesh(geo.cyl(.17, .2, .14, 8), mat.straw, 0, 1.27, 0)); }
  else { const hr = mesh(geo.ico(.2, 0), L(HR[k % 4]), 0, 1.14, -.03); hr.scale.y = .7; body.add(hr); }
  const legL = new T.Group(), legR = new T.Group(), armL = new T.Group(), armR = new T.Group();
  [[legL, -.1], [legR, .1]].forEach(a => { a[0].position.set(a[1], .38, 0); a[0].add(mesh(geo.cyl(.07, .06, .38, 5), pa, 0, -.19, 0)); body.add(a[0]); });
  [[armL, -.27], [armR, .27]].forEach(a => { a[0].position.set(a[1], .86, 0); a[0].add(mesh(geo.cyl(.055, .045, .36, 5), sh, 0, -.18, 0)); body.add(a[0]); });
  const can = new T.Group(); can.add(mesh(geo.box(.2, .16, .18), L(0x7aa0b8), 0, 0, 0)); const sp = mesh(geo.cyl(.025, .035, .3, 4), L(0x7aa0b8), 0, .02, .22); sp.rotation.x = Math.PI / 2.4; can.add(sp); can.position.set(0, -.4, .12); can.visible = false; armR.add(can);
  const bask = mesh(geo.cyl(.14, .1, .14, 6), L(0xb98a4c), 0, -.38, .1); bask.visible = false; armL.add(bask);
  if (gardener) body.add(mesh(geo.box(.3, .22, .14), mat.wood, 0, .66, -.27));
  if (!gardener && k >= 2) g.scale.setScalar(k === 3 ? .62 : .78);
  g.userData = { body, legL, legR, armL, armR, can, bask, heading: 0, lx: 0, lz: 0 }; return g;
}
function dog() {
  const g = new T.Group(), body = new T.Group(); g.add(body); const c = L(0xdca468), c2 = L(0xf3e2c4);
  body.add(mesh(geo.box(.62, .28, .26), c, 0, .42, 0)); body.add(mesh(geo.box(.3, .12, .2), c2, .08, .3, 0, false));
  const head = new T.Group(); head.position.set(.36, .6, 0); head.add(mesh(geo.box(.22, .2, .2), c, 0, 0, 0)); head.add(mesh(geo.box(.12, .09, .13), c2, .15, -.04, 0, false)); head.add(mesh(geo.box(.04, .06, .04), mat.dark, .22, -.01, 0, false));
  [-1, 1].forEach(s => { const e = mesh(geo.box(.06, .11, .05), L(0xa8672f), -.02, .13, s * .1, false); head.add(e); }); body.add(head);
  const legs = [[.22, .1], [.22, -.1], [-.22, .1], [-.22, -.1]].map(p => { const l = new T.Group(); l.position.set(p[0], .3, p[1]); l.add(mesh(geo.box(.07, .3, .07), c, 0, -.15, 0)); body.add(l); return l; });
  const tail = new T.Group(); tail.position.set(-.32, .52, 0); tail.add(mesh(geo.box(.22, .05, .05), c, -.1, .04, 0, false)); body.add(tail);
  g.userData = { body, legs, tail, head, heading: 0, lx: 0, lz: 0 }; return g;
}

/* ---------- initialisation ---------- */
let hemi, sun, terrain, tg, tvar, gTerr, gBeds, gDecor, gPaths, gOver, gChars, gFauna, gAmb, gPlate;
let gardener, dogM, fam = {}, cg = {}, deco = {}, pickRoots = [];
const butter = [], beesA = [], birdsA = [], clouds = [], fx = [], pulse = [], rainL = { m: null };
let parts, pg, pm, NP = 140, pp, pvel;
const mistMat = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, fog: false });
const mists = [];
let skyCx, skyTex, tuftMat, timeU = { value: 0 }, tufts = null, meadow = null;
const cam = { az: .6, pol: 1.0, dist: 24, tx: 0, ty: 0, tz: 0, taz: null, tdist: null };

function gradTex(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); return new T.CanvasTexture(c); }
function setup() {
  wrap = document.querySelector('.garden-wrap'); if (!wrap) throw new Error('no wrap');
  canvas = document.createElement('canvas'); canvas.id = 'gl3d'; canvas.setAttribute('aria-label', 'Jardin en 3D'); wrap.insertBefore(canvas, wrap.firstChild);
  R = new T.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  const phone = innerWidth <= 560;
  R.setPixelRatio(Math.min(window.devicePixelRatio || 1, phone ? 1.6 : 2));
  R.shadowMap.enabled = true; R.shadowMap.type = T.PCFSoftShadowMap;
  scene = new T.Scene(); camera = new T.PerspectiveCamera(42, 1, .5, 220);
  hemi = new T.HemisphereLight(0xffffff, 0x7f9a6a, .5); scene.add(hemi);
  sun = new T.DirectionalLight(0xffe4bc, .62); sun.castShadow = true; sun.shadow.mapSize.set(phone ? 1024 : 2048, phone ? 1024 : 2048);
  const sc = sun.shadow.camera; sc.left = -26; sc.right = 26; sc.top = 26; sc.bottom = -26; sc.near = 1; sc.far = 100; sun.shadow.bias = -.0006; scene.add(sun); scene.add(sun.target);
  const skyCv = document.createElement('canvas'); skyCv.width = 4; skyCv.height = 256; skyCx = skyCv.getContext('2d'); skyTex = new T.CanvasTexture(skyCv); scene.background = skyTex;
  gTerr = new T.Group(); gBeds = new T.Group(); gDecor = new T.Group(); gPaths = new T.Group(); gOver = new T.Group(); gChars = new T.Group(); gFauna = new T.Group(); gAmb = new T.Group();
  [gTerr, gPlate = new T.Group(), gPaths, gBeds, gDecor, gOver, gChars, gFauna, gAmb].forEach(g => scene.add(g));
  // terrain
  const SIZE = 150, SEG = 100; tg = new T.PlaneGeometry(SIZE, SIZE, SEG, SEG); tg.rotateX(-Math.PI / 2);
  tvar = new Float32Array(tg.attributes.position.count); for (let i = 0; i < tvar.length; i++) tvar[i] = rng();
  tg.setAttribute('color', new T.BufferAttribute(new Float32Array(tvar.length * 3), 3));
  terrain = new T.Mesh(tg, new T.MeshLambertMaterial({ vertexColors: true })); terrain.receiveShadow = true; terrain.userData.pick = { t: 'ground' }; gTerr.add(terrain);
  // herbe en touffes
  tuftMat = new T.MeshLambertMaterial({ color: 0x5e9a3f });
  tuftMat.onBeforeCompile = s => { s.uniforms.uTime = timeU; s.vertexShader = s.vertexShader.replace('#include <common>', 'uniform float uTime;\n#include <common>').replace('#include <begin_vertex>', '#include <begin_vertex>\n vec4 ip = instanceMatrix * vec4(0.,0.,0.,1.);\n float sw = position.y * 1.6;\n transformed.x += sin(uTime*1.8 + ip.x*0.7 + ip.z*0.5) * sw * 0.22;\n transformed.z += cos(uTime*1.5 + ip.z*0.6) * sw * 0.14;'); };
  // nuages, particules, brume
  for (let i = 0; i < 6; i++) { const c = new T.Group(), m = new T.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: .92 }); for (let j = 0; j < 4; j++) { const b = new T.Mesh(geo.ico(1.6 + rng() * .9, 0), m); b.position.set(j * 1.7 - 2.5, rng() * .6, (rng() - .5) * 1.4); b.scale.y = .6; c.add(b); } c.position.set((rng() - .5) * 150, 40 + rng() * 10, (rng() - .5) * 120); gAmb.add(c); clouds.push(c); }
  pp = new Float32Array(NP * 3); pvel = new Float32Array(NP); for (let i = 0; i < NP; i++) { pp[i * 3] = (rng() - .5) * 50; pp[i * 3 + 1] = rng() * 14; pp[i * 3 + 2] = (rng() - .5) * 50; pvel[i] = .6 + rng() * 1.1; }
  pg = new T.BufferGeometry(); pg.setAttribute('position', new T.BufferAttribute(pp, 3)); pm = new T.PointsMaterial({ color: 0xe08a35, size: .28, sizeAttenuation: true }); parts = new T.Points(pg, pm); parts.frustumCulled = false; gAmb.add(parts);
  const mistTex = gradTex(64, 64, (x, w, h) => { const g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(.55, 'rgba(255,255,255,.4)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); });
  mistMat.map = mistTex; for (let i = 0; i < 7; i++) { const m = new T.Mesh(new T.PlaneGeometry(15 + rng() * 8, 15 + rng() * 8), mistMat); m.rotation.x = -Math.PI / 2; m.position.set((rng() - .5) * 60, .55 + rng() * .4, (rng() - .5) * 50); m.userData.sp = .15 + rng() * .2; gAmb.add(m); mists.push(m); }
  // pluie
  { const N = 260, pos = new Float32Array(N * 6); const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); const l = new T.LineSegments(g, new T.LineBasicMaterial({ color: 0xbcd4ea, transparent: true, opacity: .55 })); l.frustumCulled = false; l.visible = false; gAmb.add(l); rainL.m = l; rainL.N = N; rainL.p = Array.from({ length: N }, () => [(rng() - .5) * 46, rng() * 16, (rng() - .5) * 46]); }
  // faune
  const wingM = c => new T.MeshLambertMaterial({ color: c, side: T.DoubleSide });
  for (let i = 0; i < 7; i++) { const g = new T.Group(), m = wingM([0xf2c14e, 0xe8704a, 0xf4f0e0, 0x8fb7f0, 0xe58aa8][i % 5]); const wg = new T.BufferGeometry(); wg.setAttribute('position', new T.Float32BufferAttribute([0, 0, 0, .26, 0, .2, .26, 0, -.14], 3)); wg.computeVertexNormals(); const w1 = new T.Mesh(wg, m), w2 = new T.Mesh(wg, m); w2.scale.x = -1; g.add(w1, w2, new T.Mesh(geo.box(.03, .03, .2), mat.trunk)); g.userData = { w: [w1, w2], ph: rng() * 9, sp: .6 + rng() * .5, c: null }; gFauna.add(g); butter.push(g); }
  for (let i = 0; i < 6; i++) { const g = new T.Group(); const b = mesh(geo.ico(.06, 0), mat.yellow, 0, 0, 0, false); b.scale.z = 1.5; g.add(b); const st = mesh(geo.ico(.062, 0), mat.dark, 0, 0, -.05, false); st.scale.set(.9, .9, .5); g.add(st); const wm = new T.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: .7, side: T.DoubleSide }), wgm = new T.PlaneGeometry(.09, .05), w1 = new T.Mesh(wgm, wm), w2 = new T.Mesh(wgm, wm); w1.position.set(.05, .06, 0); w2.position.set(-.05, .06, 0); g.add(w1, w2); g.userData = { w: [w1, w2], ph: rng() * 9, sp: 1.4 + rng() * .8, c: null }; gFauna.add(g); beesA.push(g); }
  for (let i = 0; i < 4; i++) { const g = new T.Group(), m = new T.MeshLambertMaterial({ color: 0x3a3a42, side: T.DoubleSide }); const body = new T.Mesh(new T.ConeGeometry(.12, .5, 5), m); body.rotation.x = Math.PI / 2; g.add(body); const wg = new T.BufferGeometry(); wg.setAttribute('position', new T.Float32BufferAttribute([0, 0, .1, .55, 0, -.05, 0, 0, -.12], 3)); wg.computeVertexNormals(); const a = new T.Mesh(wg, m), b = new T.Mesh(wg, m); b.scale.x = -1; g.add(a, b); g.userData = { w: [a, b], ph: rng() * 6.28, R: 11 + rng() * 8, sp: .14 + rng() * .1, h: 9 + rng() * 3 }; gFauna.add(g); birdsA.push(g); }
  // personnages
  gardener = human(0, true); dogM = dog(); gChars.add(gardener, dogM);
  for (const k of [0, 1]) { fam['f' + k] = human(k); gChars.add(fam['f' + k]); }
  // bulles de badges
  bdiv = document.createElement('div'); bdiv.id = 'v3bd'; wrap.appendChild(bdiv);
  bindCamera(); ro = new ResizeObserver(resize); ro.observe(wrap); resize();
}
function resize() { if (!R) return; const w = Math.max(10, wrap.clientWidth), h = Math.max(10, wrap.clientHeight); R.setSize(w, h, false); camera.aspect = w / h; camera.fov = w / h < .8 ? 54 : 42; camera.updateProjectionMatrix(); if (cam.auto) fit(); }
function fit() { const asp = camera.aspect, tv = Math.tan(camera.fov * Math.PI / 360), th = tv * asp, az = asp < .8 ? .35 : .6, w = Math.abs(Math.cos(az)) * HW + Math.abs(Math.sin(az)) * HH + 3.2, dp = (Math.abs(Math.sin(az)) * HW + Math.abs(Math.cos(az)) * HH) * .56 + 5, d = Math.max(w / th, dp / tv); cam.dist = Math.min(80, Math.max(13, d * .88)); cam.az = az; cam.pol = 1.0; cam.tx = 0; cam.tz = HH * .08; cam.auto = true; cam.taz = cam.tdist = null; }

/* ---------- terrain et couleurs ---------- */
const cA = new T.Color(), cB = new T.Color(), cR = new T.Color(0x9a9c92), cS = new T.Color(0xf4f8fa), cT = new T.Color(), cE = new T.Color(0xa88d68), cF = new T.Color(0xdcecf8);
let frost = 0;
function shapeTerrain() {
  const p = tg.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, hAt(p.getX(i), p.getZ(i))); p.needsUpdate = true; tg.computeVertexNormals(); paintTerrain();
}
function paintTerrain() {
  const p = tg.attributes.position, col = tg.attributes.color, S = curS; cA.setHex(S.gA); cB.setHex(S.gB);
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i), x = p.getX(i), z = p.getZ(i); cT.copy(cA).lerp(cB, tvar[i]);
    const r = Math.hypot(x / (HW + 4.5), z / (HH + 4.5)); if (r < 1.1) cT.lerp(cE, (1 - smooth(.85, 1.1, r)) * .0);
    if (y > 3.5) cT.lerp(cR, smooth(3.5, 6.5, y) * .6); if (season === 'winter') cT.lerp(cS, smooth(-.5, 2.5, y) * .5 + .3); if (frost) cT.lerp(cF, frost * .35);
    col.setXYZ(i, cT.r, cT.g, cT.b);
  }
  col.needsUpdate = true;
}
function gradientSky() {
  const h = hour, S = curS, a = (h - 6) / 14 * Math.PI, e = Math.max(0, Math.sin(a)), warm = 1 - smooth(0, .5, e);
  sun.position.set(Math.cos(a) * 34, Math.sin(a) * 26 + 3, 14); sun.target.position.set(0, 0, 0);
  const sc = new T.Color(S.light).lerp(new T.Color(0xff9a58), warm * .85); sun.color.copy(sc);
  const gloom = rainOn ? .55 : 1;
  sun.intensity = (.3 + .45 * smooth(0, .45, e)) * gloom; hemi.intensity = (.45 + .2 * smooth(0, .5, e)) * (rainOn ? .85 : 1);
  hemi.color.setHex(0xffffff).lerp(new T.Color(0xffc9a0), warm * .5);
  const hor = new T.Color(S.sky).lerp(new T.Color(0xf4a878), warm * .65).lerp(new T.Color(0x2a3558), (1 - smooth(0, .25, e)) * .7); if (rainOn) hor.lerp(new T.Color(0x8e9aa6), .5);
  const zen = new T.Color(S.zen).lerp(new T.Color(0x34406a), (1 - smooth(0, .35, e)) * .75); if (rainOn) zen.lerp(new T.Color(0x7a8794), .5);
  const gr = skyCx.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#' + zen.getHexString()); gr.addColorStop(.38, '#' + hor.getHexString()); gr.addColorStop(1, '#' + hor.getHexString()); skyCx.fillStyle = gr; skyCx.fillRect(0, 0, 4, 256); skyTex.needsUpdate = true;
  if (scene.fog) scene.fog.color.copy(hor); else scene.fog = new T.Fog(hor.getHex(), 38, 96);
  mistMat.opacity = Math.max(0, 1 - Math.abs(h - 7.3) / 2.6) * .34 + Math.max(0, (h - 18.3) / 1.7) * .1 + (season === 'winter' ? .07 : season === 'autumn' ? .05 : 0) + (rainOn ? .12 : 0);
  mistMat.color.copy(hor).lerp(new T.Color(0xffffff), .6);
}
function setColors(S) {
  mat.leafA.color.setHex(S.leafA); mat.leafB.color.setHex(S.leafB); mat.blossom.color.setHex(S.blossom); mat.crownA.color.setHex(S.leafA); mat.crownB.color.setHex(S.leafB); mat.crownBl.color.setHex(S.blossom); tuftMat.color.setHex(S.tuft);
}
function lerpSeason(a, b, k) { const o = Object.assign({}, b); ['zen', 'tuft', 'sky', 'gA', 'gB', 'leafA', 'leafB', 'blossom', 'light'].forEach(f => { o[f] = new T.Color(a[f]).lerp(new T.Color(b[f]), k).getHex(); }); return o; }
let rainOn = false;
function applySeason(name, instant) {
  const S = SEASONS[name], prev = curS; season = name;
  parts.visible = !!S.parts; if (S.parts) pm.color.setHex(S.parts); pm.size = name === 'winter' ? .22 : .28;
  if (meadow) meadow.visible = S.flow;
  if (instant) { curS = S; trans = null; setColors(S); paintTerrain(); gradientSky(); } else trans = { a: prev, b: S, t0: performance.now() / 1000 };
}

/* ---------- herbe, fleurs des prés : refaits quand la taille change ---------- */
function scatter() {
  if (tufts) { gTerr.remove(tufts); tufts.geometry.dispose(); } if (meadow) { gTerr.remove(meadow); meadow.geometry.dispose(); }
  const r0 = rng; rng = rngMaker(77);
  const tuftGeo = new T.ConeGeometry(.17, .42, 3); tuftGeo.translate(0, .2, 0); const NT = 1500; tufts = new T.InstancedMesh(tuftGeo, tuftMat, NT); const dm = new T.Object3D();
  const out = (x, z) => Math.abs(x) < HW + 1.4 && Math.abs(z) < HH + 1.4;
  for (let i = 0; i < NT; i++) { let x, z, n = 0; do { x = (rng() - .5) * 90; z = (rng() - .5) * 90; n++; } while (n < 14 && out(x, z)); dm.position.set(x, hAt(x, z), z); dm.rotation.set((rng() - .5) * .4, rng() * 6, (rng() - .5) * .4); const sc = .45 + rng() * .6; dm.scale.set(sc, sc * (.8 + rng() * .7), sc); dm.updateMatrix(); tufts.setMatrixAt(i, dm.matrix); }
  tufts.receiveShadow = true; gTerr.add(tufts);
  meadow = new T.InstancedMesh(geo.ico(.1, 0), new T.MeshLambertMaterial(), 360); const pal = [0xf4f0e0, 0xf2c14e, 0xe58aa8, 0x8fb7f0, 0xb48be0, 0xf08a5a].map(c => new T.Color(c));
  for (let i = 0; i < 360; i++) { let x, z, n = 0; do { x = (rng() - .5) * 70; z = (rng() - .5) * 70; n++; } while (n < 14 && (out(x, z) || Math.hypot(x, z) > 32)); dm.position.set(x, hAt(x, z) + .3, z); dm.rotation.set(0, 0, 0); dm.scale.setScalar(.7 + rng() * .7); dm.updateMatrix(); meadow.setMatrixAt(i, dm.matrix); meadow.setColorAt(i, pal[Math.floor(rng() * pal.length)]); }
  meadow.instanceColor.needsUpdate = true; meadow.visible = curS.flow; gTerr.add(meadow); rng = r0;
}

/* ---------- caméra ---------- */
function bindCamera() {
  const ptrs = new Map(); let down = null, pinchD = 0, pc = null, twA = null;
  canvas.style.touchAction = 'none';
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  canvas.addEventListener('pointerdown', e => { try { canvas.setPointerCapture(e.pointerId); } catch (_) {} ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, btn: e.button }); cam.auto = false; cam.taz = cam.tdist = null;
    if (ptrs.size === 1) down = { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0, btn: e.button }; else { down = null; twA = null; const [a, b] = [...ptrs.values()]; pinchD = Math.hypot(a.x - b.x, a.y - b.y); pc = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; } });
  canvas.addEventListener('pointermove', e => { const p = ptrs.get(e.pointerId); if (!p) return; const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
    if (ptrs.size === 1) { if (down) down.moved += Math.abs(dx) + Math.abs(dy); if (p.btn === 2 || p.btn === 1) pan(dx, dy); else { cam.az -= dx * .006; cam.pol = Math.min(1.35, Math.max(.2, cam.pol - dy * .005)); } }
    else if (ptrs.size === 2 && A.ui().hedgeSel) { const [a, b] = [...ptrs.values()], ang = Math.atan2(b.y - a.y, b.x - a.x); if (twA !== null) { let dd = ang - twA; dd = Math.atan2(Math.sin(dd), Math.cos(dd)); A.rotSpot(A.ui().hedgeSel, dd, false); } twA = ang; }
    else if (ptrs.size === 2) { const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y), c = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; if (pinchD) cam.dist = Math.min(80, Math.max(8, cam.dist * pinchD / d)); pinchD = d; if (pc) pan(c.x - pc.x, c.y - pc.y); pc = c; } });
  const end = e => { const had = ptrs.delete(e.pointerId); if (twA !== null && ptrs.size < 2) { twA = null; if (A.ui().hedgeSel) A.rotSpot(A.ui().hedgeSel, 0, true); } if (had && down && ptrs.size === 0 && down.moved < 10 && performance.now() - down.t < 600 && down.btn === 0) tap(e.clientX, e.clientY); if (ptrs.size < 2) { pinchD = 0; pc = null; } if (ptrs.size === 0) down = null; };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('wheel', e => { e.preventDefault(); cam.auto = false; cam.dist = Math.min(80, Math.max(8, cam.dist * Math.exp(e.deltaY * .001))); }, { passive: false });
}
function pan(dx, dy) { const k = cam.dist * .0017, rx = Math.cos(cam.az), rz = -Math.sin(cam.az), fx = -Math.sin(cam.az), fz = -Math.cos(cam.az); cam.tx += -dx * k * rx + dy * k * fx; cam.tz += -dx * k * rz + dy * k * fz; const lim = Math.max(HW, HH) + 10; cam.tx = Math.max(-lim, Math.min(lim, cam.tx)); cam.tz = Math.max(-lim, Math.min(lim, cam.tz)); }
function placeCamera() { const sp = Math.sin(cam.pol), x = cam.tx + cam.dist * sp * Math.sin(cam.az), y = cam.ty + cam.dist * Math.cos(cam.pol), z = cam.tz + cam.dist * sp * Math.cos(cam.az); camera.position.set(x, Math.max(1.2, y), z); camera.lookAt(cam.tx, cam.ty, cam.tz); }

/* ---------- toucher : on retrouve l'élément 2D correspondant et on clique dessus ---------- */
const ray = new T.Raycaster(), ndc = new T.Vector2();
function fire(el) { if (el) el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window })); }
function tap(cx, cy) {
  const r = canvas.getBoundingClientRect(); ndc.set((cx - r.left) / r.width * 2 - 1, -((cy - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects(pickRoots, true)[0]; if (!hit) return;
  let o = hit.object; while (o && o.userData.pick === undefined && o.parent) o = o.parent; if (!o || o.userData.pick === undefined) return;
  const pk = o.userData.pick, svg = A.svg();
  if (A.ui().tool === 'spade') { A.spadeTap(hit.point.x, hit.point.z, -cam.az, [HW, HH]); return; }
  if (pk.t === 'ground') { if (A.furnTap(hit.point.x, hit.point.z, [HW, HH])) return; }
  if (pk.t === 'ground') return;
  { const ui0 = A.ui(), S0 = A.S(), plain = (!ui0.tool || ui0.tool === 'select') && !ui0.mode, sp0 = pk.t === 'spot' ? (S0.spots || []).find(q => q.id === pk.id) : pk.t === 'cell' ? A.G.spotOf(S0, pk.i) : null, c0 = pk.t === 'cell' ? S0.grid[pk.i] : null;
    if (plain && sp0 && !(c0 && c0.treille)) { A.openSpot(sp0.id); return; } }
  if (pk.t === 'cell') fire(svg.querySelector('.cell[data-i="' + pk.i + '"]'));
  else if (pk.t === 'spot') { const sp = (A.S().spots || []).find(q => q.id === pk.id); if (sp) { const els = sp.cells.map(i => svg.querySelector('.cell[data-i="' + i + '"]')).filter(Boolean), el = els.find(x => x.classList.contains('pick')) || els.find(x => !A.S().grid[+x.dataset.i]) || els[0]; fire(el); } }
  else if (pk.t === 'tree') fire(svg.querySelector('[data-tree="' + pk.k + '"]'));
  else if (pk.t === 'lawn') fire(svg.querySelector('.lawn[data-k="' + pk.k + '"]'));
  else if (pk.t === 'deco') fire(svg.querySelector('[data-' + pk.k + ']'));
}

/* ---------- parcelles ---------- */
const stoneM = new T.MeshLambertMaterial({ color: 0xd8c79f }), plateM = new T.MeshLambertMaterial({ color: 0xcdbb91 });
function rebuildPlate() {
  while (gPlate.children.length) gPlate.remove(gPlate.children[0]);
  const sc = sun.shadow.camera, e = Math.max(HW, HH) + 9; sc.left = -e; sc.right = e; sc.top = e; sc.bottom = -e; sc.updateProjectionMatrix();
}
const emptyM = new T.MeshLambertMaterial({ color: 0x57402d });
function buildSpot(sp, S, m, sk) {
  const g = new T.Group(); g.position.set(sp.x, 0, sp.z); g.userData.pick = { t: 'spot', id: sp.id }; g.userData.plants = []; g.userData.waters = [];
  const soilMat = new T.MeshLambertMaterial({ color: 0x6e5035 }); g.userData.soil = soilMat;
  const hs = hj(sp.id, 5), SL = A.G.slotsOf(sp), R = A.G.spotRadius(sp);
  if (sp.t === 'hedge') {
    const len = (sp.cells.length - 1) * 1.15 + 1.7, ring = mesh(new T.BoxGeometry(len + .35, .06, 1.9), L(0x8a6a48), 0, .03, 0, false), bed = mesh(new T.BoxGeometry(len, .18, 1.45), soilMat, 0, .1, 0, false);
    ring.rotation.y = bed.rotation.y = -(sp.a || 0); g.add(ring, bed);
    const hit = new T.Mesh(new T.BoxGeometry(len, .6, 1.6), new T.MeshBasicMaterial({ visible: false })); hit.position.y = .3; hit.rotation.y = -(sp.a || 0); g.add(hit);
  } else if (sp.f) {
    /* aménagement : pas de butte */
  } else if (sp.t === 'single') {
    g.add(mesh(new T.CylinderGeometry(R * .86, R * .95, .05, 12), L(0x8a6a48), 0, .025, 0, false));
    g.add(mesh(jitter(new T.CylinderGeometry(R * .7, R * .8, .13, 10), .04), soilMat, 0, .08, 0, false));
    const hit = new T.Mesh(new T.CylinderGeometry(R, R, .5, 10), new T.MeshBasicMaterial({ visible: false })); hit.position.y = .25; g.add(hit);
  } else {
    const ring = mesh(new T.CylinderGeometry(R * 1.1, R * 1.17, .05, 18), L(0x8a6a48), 0, .025, 0, false); ring.rotation.y = hs * 6; g.add(ring);
    const mound = mesh(jitter(new T.CylinderGeometry(R * .96, R * 1.06, .14, 16, 1), .05), soilMat, 0, .09, 0, false); mound.rotation.y = hs * 6; g.add(mound);
    const hit = new T.Mesh(new T.CylinderGeometry(R, R, .5, 12), new T.MeshBasicMaterial({ visible: false })); hit.position.y = .25; g.add(hit);
  }
  sp.cells.forEach((i, k) => {
    const cell = S.grid[i], sl = SL[k]; const w = new T.Group();
    if (!cell) { const em = mesh(new T.CylinderGeometry(.42, .5, .09, 10), emptyM, sl[0], .12, sl[1], false); g.add(em); const hit = new T.Mesh(new T.CylinderGeometry(.7, .7, .6, 8), new T.MeshBasicMaterial({ visible: false })); hit.position.set(sl[0], .3, sl[1]); hit.userData.pick = { t: 'cell', i }; g.add(hit); return; }
    w.position.set(sl[0], .15, sl[1]); w.userData.pick = { t: 'cell', i }; rng = rngMaker(i * 977 + (cell.pid || 0) * 13 + 1);
    if (cell.treille) { const f = furn(cell.furn || 'treille', cell); f.scale.setScalar(sp.f ? 1 : .72); w.add(f); if (f.userData.water) g.userData.waters.push(f.userData.water); }
    else {
      const p = A.P[cell.pid], ph = A.G.phase(cell), dry = cell.water < 25, st = { stage: ph.stage, prog: ph.prog, ready: !!cell.ready, dry, sk, mo: m };
      if (ph.stage === 'graine') { const s2 = mesh(geo.ico(.09, 0), mat.dark, 0, .08, 0, false); s2.scale.y = .6; w.add(s2); }
      else { const pl = buildPlant(p, cell, st); pl.scale.multiplyScalar(.85); pl.userData.base = pl.scale.x; w.add(pl); g.userData.plants.push(pl); }
      if (cell.mulch) w.add(mesh(new T.CylinderGeometry(.62, .68, .05, 10), L(0xb4894f), 0, .02, 0, false));
      if (cell.supp) { const f = furn(cell.supp, cell); f.position.set(0, 0, -.5); f.scale.setScalar(.7); w.add(f); }
      if (cell.nichoir) { w.add(mesh(geo.cyl(.025, .025, 1.2, 4), mat.trunk, .6, .6, .3)); w.add(mesh(geo.box(.3, .3, .3), L(0xc9a574), .6, 1.3, .3)); const rf = mesh(geo.cone(.28, .22, 4), mat.roof, .6, 1.56, .3); rf.rotation.y = Math.PI / 4; w.add(rf); }
      if (cell.oyaUntil > S.day) { const oy = mesh(geo.ico(.2, 0), L(0xc8764a), -.55, .22, .45); oy.scale.y = 1.15; w.add(oy); }
    }
    g.add(w);
  });
  return g;
}
function soilColor(w) { return new T.Color(0x5c4433).lerp(new T.Color(0xb09a74), 1 - Math.min(1, Math.max(0, w / 100))); }
let sigPaths = '';
const hedgeM = new T.MeshLambertMaterial({ color: 0x6e5035 });
const trackM = new T.MeshLambertMaterial({ color: 0xd2b27c, side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
function ribbon(a, b, seed, w0, obst) {
  w0 = w0 || .78; const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz) || 1, nx = -dz / len, nz = dx / len, N = Math.max(8, Math.round(len * 2.2)), pos = [], idx = [];
  const base = (hj(seed, 1.7) - .5) * Math.min(2.4, len * .55); let wob = base, bestC = -1e9;
  [base, -base, base * .4, -base * .4, 0].some(cw => { const cx0 = (a[0] + b[0]) / 2 + nx * cw, cz0 = (a[1] + b[1]) / 2 + nz * cw; let cl = 1e9; for (let k = 1; k < 8; k++) { const t = k / 8, u = 1 - t, x = u * u * a[0] + 2 * u * t * cx0 + t * t * b[0], z = u * u * a[1] + 2 * u * t * cz0 + t * t * b[1]; (obst || []).forEach(o => { cl = Math.min(cl, Math.hypot(x - o[0], z - o[1]) - o[2] - w0); }); } if (cl > bestC) { bestC = cl; wob = cw; } return cl >= .15; });
  const cx = (a[0] + b[0]) / 2 + nx * wob, cz = (a[1] + b[1]) / 2 + nz * wob;
  for (let k = 0; k <= N; k++) { const t = k / N, u = 1 - t, x = u * u * a[0] + 2 * u * t * cx + t * t * b[0], z = u * u * a[1] + 2 * u * t * cz + t * t * b[1], tx = 2 * u * (cx - a[0]) + 2 * t * (b[0] - cx), tz = 2 * u * (cz - a[1]) + 2 * t * (b[1] - cz), tl = Math.hypot(tx, tz) || 1, px = -tz / tl, pz = tx / tl, w = w0 + (hj(seed + k, 3.1) - .5) * .26 * (w0 / .78) + Math.sin(t * Math.PI) * .08;
    pos.push(x + px * w, .04, z + pz * w, x - px * w, .04, z - pz * w); if (k < N) { const q = k * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); } }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); const m = new T.Mesh(g, trackM); m.receiveShadow = true; return m;
}
let net = null, netVer = 0;
function routeTo(from, to) {
  if (!net) return [to]; const { nn, adj } = net, dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
  if (dist(from, to) < 2.6) return [to];
  const near = pt => { let b = 0, bd = 1e9; nn.forEach((n, k) => { const d = Math.hypot(n.x - pt[0], n.z - pt[1]) - (n.sp ? 0 : 0); if (d < bd) { bd = d; b = k; } }); return b; };
  const inSp = pt => { for (let k = 1; k < nn.length; k++) { const sp = nn[k].sp; if (!sp) continue; if (A.G.discsOf(sp).some(q => Math.hypot(q[0] - pt[0], q[1] - pt[1]) < q[2] + .4)) return k; } return -1; };
  const sa = inSp(from), sb = inSp(to); if (sa > 0 && sa === sb) return [to];
  const s = sa > 0 ? sa : near(from), g = sb > 0 ? sb : near(to); if (s === g) return [to];
  const D = nn.map(() => 1e9), prev = nn.map(() => -1), done = nn.map(() => false); D[s] = 0;
  for (let it = 0; it < nn.length; it++) { let u = -1; for (let k = 0; k < nn.length; k++) if (!done[k] && (u < 0 || D[k] < D[u])) u = k; if (u < 0 || D[u] >= 1e9) break; done[u] = true; adj[u].forEach(([w, d]) => { if (D[u] + d < D[w]) { D[w] = D[u] + d; prev[w] = u; } }); }
  if (D[g] >= 1e9) return [to]; const pts = []; for (let k = g; k >= 0; k = prev[k]) { pts.unshift([nn[k].x, nn[k].z]); if (k === s) break; } pts.push(to); return pts;
}
function plate(x, z, r) { const m = new T.Mesh(new T.CylinderGeometry(r, r, .03, 14), trackM); m.position.set(x, .045, z); m.receiveShadow = true; return m; }
function syncTracks(S) {
  const sps = S.spots || [], y0 = A.walk().N.y0, root = y0 ? cr2xz(y0.c, y0.r) : [-HW, HH * .2];
  const sg = sps.map(o => o.id + ':' + o.x.toFixed(1) + ':' + o.z.toFixed(1) + ':' + (o.a || 0).toFixed(1)).join(';') + '|' + COLS + 'x' + ROWS + '|' + (y0 ? 1 : 0); if (sg === sigPaths) return; sigPaths = sg;
  while (gPaths.children.length) gPaths.remove(gPaths.children[0]);
  if (!sps.length) { net = null; netVer++; return; }
  const nodes = [{ d: [[root[0], root[1], 0]] }].concat(sps.map(o => ({ d: A.G.discsOf(o) })));
  const link = (i, j) => { let best = null; for (const da of nodes[i].d) for (const db of nodes[j].d) { const dx = db[0] - da[0], dz = db[1] - da[1], dd = Math.hypot(dx, dz) || .01, rim = dd - da[2] - db[2]; if (!best || rim < best.rim) best = { rim, da, db, ux: dx / dd, uz: dz / dd }; }
    const pa = i ? .22 : 0, pb = .22; return { i, j, rim: best.rim, a: [best.da[0] + best.ux * (best.da[2] + pa), best.da[1] + best.uz * (best.da[2] + pa)], b: [best.db[0] - best.ux * (best.db[2] + pb), best.db[1] - best.uz * (best.db[2] + pb)] }; };
  const done = [0], rest = nodes.map((_, k) => k).slice(1), edges = [], deg = nodes.map(() => 0), depth = [0];
  while (rest.length) { let best = null, bj = -1; rest.forEach((j, jj) => done.forEach(i => { const l = link(i, j); if (!best || l.rim < best.rim) { best = l; bj = jj; } })); const j = rest.splice(bj, 1)[0]; done.push(j); edges.push(best); deg[best.i]++; deg[j]++; depth[j] = depth[best.i] + 1; }
  // boucles de promenade : un second lien pour les voisins proches
  const has = (i, j) => edges.some(e => (e.i === i && e.j === j) || (e.i === j && e.j === i));
  for (let i = 1; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) { if (has(i, j) || deg[i] >= 3 || deg[j] >= 3) continue; const l = link(i, j); if (l.rim < 4.2) { edges.push(l); deg[i]++; deg[j]++; } }
  { const nn = [{ x: root[0], z: root[1] }], adj = [[]]; sps.forEach(o => { nn.push({ x: o.x, z: o.z, sp: o }); adj.push([]); });
    const lk = (p, q) => { const d = Math.hypot(nn[p].x - nn[q].x, nn[p].z - nn[q].z); adj[p].push([q, d]); adj[q].push([p, d]); };
    const add = pt => { nn.push({ x: pt[0], z: pt[1] }); adj.push([]); return nn.length - 1; };
    edges.forEach(e => { const ia = e.i === 0 ? 0 : add(e.a), ib = add(e.b); lk(ia, ib); if (e.i) lk(ia, e.i); lk(ib, e.j); });
    net = { nn, adj }; netVer++; }
  const allD = nodes.map((n, k) => n.d.map(q => [q[0], q[1], q[2], k]));
  edges.forEach((e, n) => {
    const obst = []; allD.forEach((ds, k) => { if (k !== e.i && k !== e.j) ds.forEach(q => obst.push(q)); });
    const w = e.i === 0 ? 1.05 : depth[e.j] <= 2 ? .88 : .72;
    gPaths.add(ribbon(e.a, e.b, e.i * 31 + e.j * 7 + n, w, obst)); gPaths.add(plate(e.a[0], e.a[1], w * .98)); gPaths.add(plate(e.b[0], e.b[1], w * .98));
  });
}
let sigDec = '';
function ypos(k, dx, dz) { const N = A.walk().N, n = N['y' + k]; if (!n) return null; const q = cr2xz(n.c, n.r); return [q[0] + (dx || 0), q[1] + (dz || 0)]; }
function syncDecor(S, sk) {
  const tr = S.trees.map(t => t.formed ? 1 : 0).join(''), lw = [0, 1, 2, 3, 4, 5, 6, 7].map(k => A.G.lawnReady(S, k) ? 1 : 0).join('');
  const sg = [COLS, ROWS, S.cuves | 0, S.poulailler ? 1 : 0, S.atelier ? 1 : 0, Math.round(S.tank / S.tankMax * 8), Math.round(Math.min(1, (S.waste || 0) / 6) * 6), tr, lw, sk, A.walk().N.y0 ? 1 : 0].join('|');
  if (sg === sigDec) return; sigDec = sg;
  while (gDecor.children.length) gDecor.remove(gDecor.children[0]); pickRoots.length = 0; pickRoots.push(gBeds, gDecor, terrain); rng = rngMaker(4242);
  const add = (o, x, z, ry, pick) => { o.position.set(x, hAt(x, z), z); if (ry) o.rotation.y = ry; if (pick) o.userData.pick = pick; gDecor.add(o); return o; };
  const hp = ypos(0, -2.8, -2.4) || [-HW - 6, -HH + 1]; add(house(), hp[0], hp[1], .5); deco.chim = new T.Vector3(hp[0] + 1.1, hAt(hp[0], hp[1]) + 4.2, hp[1] - .9);
  const bp = ypos(4, 0, 1.4) || [-HW - 3, -HH + 3], lvl = S.tank / S.tankMax; add(barrel(lvl), bp[0], bp[1]);
  for (let k = 0; k < Math.max(0, S.cuves || 0) && k < 3; k++) add(barrel(lvl), bp[0] + 1.1 * (k + 1), bp[1] + .3 * (k % 2 ? -1 : 1));
  const cp = ypos(3, -1.6, -1.6) || [-HW - 5, -HH + 5]; add(composter(Math.min(1, (S.waste || 0) / 6)), cp[0], cp[1], .5, { t: 'deco', k: 'compost' });
  if (S.poulailler) add(poulailler(), HW + 3.4, -HH * .2, -Math.PI / 2 + .2, { t: 'deco', k: 'poulailler' });
  if (S.atelier) add(atelier(), -HW - 4, HH * .5, .6, { t: 'deco', k: 'atelier' });
  S.trees.forEach((t, k) => { const x = -HW + 2 + (HW * 2 + 8) * (k / 4), z = -HH - 4 - (k % 2) * 1.5; add(borderTree(t), x, z, k * 1.7, { t: 'tree', k }); });
  for (let k = 0; k < 8; k++) { const ready = A.G.lawnReady(S, k); let x, z; if (k < 4) { x = -HW + 2 + (2 * HW - 4) * (k / 3); z = HH + 3.2 + (k % 2) * .8; } else { x = HW + 3.6 + (k % 2) * .8; z = -HH + 3 + (2 * HH - 6) * ((k - 4) / 3); } add(lawnPatch(ready), x, z, k * .8, { t: 'lawn', k }); deco['L' + k] = [x, z]; deco['T' + k] = [-HW + 2 + (HW * 2 + 8) * (k / 4), -HH - 4 - (k % 2) * 1.5]; }
  for (let i = 0; i < 12; i++) { const a = rng() * 6.28, rr = Math.max(HW, HH) + 12 + rng() * 16, x = Math.cos(a) * rr * 1.2, z = Math.sin(a) * rr; const g = new T.Group(); const pine = rng() > .55, s = .9 + rng() * .9; g.add(mesh(geo.cyl(.1, .16, 1.2, 5), mat.trunk, 0, .6, 0)); if (pine) [0, .6, 1.15, 1.65].forEach((y, j) => { const c = mesh(geo.cone(1 - j * .2, 1.15, 7), mat.pine, 0, 1.4 + y, 0); c.rotation.y = j * .6; g.add(c); }); else { [[0, 1.9, 0, .9], [.5, 1.65, .15, .62], [-.45, 1.7, -.2, .6]].forEach(c => { const m = mesh(blob(c[3], 1), rng() > .5 ? mat.crownA : mat.crownB, c[0], c[1], c[2]); m.rotation.y = rng() * 3; g.add(m); }); } g.scale.setScalar(s); add(g, x, z, 0); }
  for (let i = 0; i < 10; i++) { const a = rng() * 6.28, rr = Math.max(HW, HH) + 6 + rng() * 22, x = Math.cos(a) * rr * 1.2, z = Math.sin(a) * rr, rk = mesh(rockGeo(.4 + rng() * .7), mat.rock, 0, .2, 0); rk.scale.y = .7; add(rk, x, z, 0); }
}

/* ---------- parcelles : mise à jour ---------- */
function syncCells(S, m, sk) {
  const G = A.G, P = A.P, fcells = []; cpos = {}; const live = {};
  (S.spots || []).forEach(sp => {
    const SL = G.slotsOf(sp); live[sp.id] = 1; let sig = [sp.id, sp.t, sp.n, sp.x.toFixed(2), sp.z.toFixed(2), (sp.a || 0).toFixed(2)].join(',') + '|', wsum = 0, wn = 0;
    sp.cells.forEach((i, k) => { cpos[i] = [sp.x + SL[k][0], sp.z + SL[k][1]]; const cell = S.grid[i];
      if (!cell) { sig += '.|'; return; } if (cell.treille) { sig += 'F' + (cell.furn || 'treille') + (cell.ducks ? 1 : 0) + '|'; return; }
      const p = P[cell.pid], ph = G.phase(cell), dry = cell.water < 25; fcells.push(i); wsum += cell.water; wn++;
      sig += [cell.pid, ph.stage, Math.round(ph.prog * 14), cell.ready ? 1 : 0, dry ? 1 : 0, sk, A.leafColor(p, m, dry), cell.mulch ? 1 : 0, cell.supp || '', cell.nichoir ? 1 : 0, cell.oyaUntil > S.day ? 1 : 0].join(',') + '|'; });
    let e = cg[sp.id]; if (!e || e.sig !== sig) { if (e) gBeds.remove(e.g); const g = buildSpot(sp, S, m, sk); gBeds.add(g); e = cg[sp.id] = { g, sig }; }
    if (e.g.userData.soil) e.g.userData.soil.color.copy(soilColor(wn ? wsum / wn : 40));
  });
  for (const k in cg) if (!live[k]) { gBeds.remove(cg[k].g); delete cg[k]; }
  deco.cells = fcells;
}

/* ---------- marqueurs de choix, sélection, file d'attente, synergies ---------- */
const plusM = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .8 }), selM = new T.MeshBasicMaterial({ color: 0xfff1a8, transparent: true, opacity: .95, side: T.DoubleSide, depthTest: false }), delM = new T.MeshBasicMaterial({ color: 0xe04a3a, transparent: true, opacity: .95, side: T.DoubleSide, depthTest: false }), qM = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .8, side: T.DoubleSide });
function syncOver(S) {
  while (gOver.children.length) gOver.remove(gOver.children[0]); pulse.length = 0; const svg = A.svg(), blocks = {};
  svg.querySelectorAll('.cell.pick, .cell.sel, .cell.delp').forEach(el => {
    const i = +el.dataset.i, cl = el.classList; if (!A.G.spotOf(S, i)) return; const [x, z] = cellXZ(i);
    if (cl.contains('sel') || cl.contains('delp')) { const rg = new T.Mesh(new T.RingGeometry(.78, .95, 28), cl.contains('delp') ? delM : selM); rg.rotation.x = -Math.PI / 2; rg.position.set(x, .3, z); rg.renderOrder = 5; gOver.add(rg); pulse.push(rg); }
    if (cl.contains('pick') && !S.grid[i]) { const g = new T.Group(); g.position.set(x, .85, z); g.add(mesh(new T.CylinderGeometry(.5, .5, .06, 16), plusM, 0, 0, 0, false)); const wm = new T.MeshBasicMaterial({ color: 0x3f8f3a }); g.add(mesh(geo.box(.5, .08, .11), wm, 0, .06, 0, false)); g.add(mesh(geo.box(.11, .08, .5), wm, 0, .06, 0, false)); g.userData.bob = 1; gOver.add(g); pulse.push(g); }
  });
  (S.pq || []).forEach(q => { const p = A.P[q.pid], c = cellXZ(q.i), x = c[0], z = c[1];
    const rg = new T.Mesh(new T.RingGeometry(.6, .72, 20), qM); rg.rotation.x = -Math.PI / 2; rg.position.set(x, .3, z); gOver.add(rg); const gh = mesh(geo.cone(.28, .7, 5), new T.MeshLambertMaterial({ color: new T.Color(A.leafColor(p, 6, false) || '#7dbb5c'), transparent: true, opacity: .55 }), x, .65, z, false); gOver.add(gh); });
  const ui = A.ui();
  if (ui.sel >= 0 && S.grid[ui.sel] && !S.grid[ui.sel].treille) {
    const sy = A.G.synergy(S, ui.sel), [ax, az] = cellXZ(ui.sel);
    sy.notes.forEach(n => n.froms.forEach(j => { if (j < 0) return; const good = n.t === 'good', [bx, bz] = cellXZ(j), mm = new T.MeshBasicMaterial({ color: good ? 0x59c24a : 0xe0503a, depthTest: false, transparent: true, opacity: .95 });
      for (let k = 1; k < 9; k++) { const t = k / 9, o = new T.Mesh(geo.ico(.07, 0), mm); o.position.set(ax + (bx - ax) * t, 1.2 + Math.sin(t * Math.PI) * .6, az + (bz - az) * t); o.renderOrder = 6; gOver.add(o); }
      const mk = new T.Mesh(geo.ico(.26, 1), mm); mk.position.set(bx, 2.9, bz); mk.renderOrder = 6; gOver.add(mk); pulse.push(mk); }));
  }
}

/* ---------- pastilles d'action (HTML, déduites des badges 2D) ---------- */
const btns = {};
function syncBadges() {
  const svg = A.svg(), S = A.S(), seen = {}, per = {};
  svg.querySelectorAll('.badge[data-badge]').forEach(el => {
    const kind = el.dataset.badge, i = el.dataset.i, k = el.dataset.k, id = kind + ':' + (i !== undefined ? i : 'k' + k);
    const slot = i !== undefined ? (per[i] = (per[i] === undefined ? 0 : per[i] + 1)) : 0;
    seen[id] = true; let b = btns[id];
    if (!b) { b = btns[id] = document.createElement('button'); b.type = 'button'; b.className = 'v3b'; b.setAttribute('aria-label', el.getAttribute('aria-label') || 'Action'); b.innerHTML = '<svg class="badge" viewBox="-21 -21 42 42" width="42" height="42" aria-hidden="true">' + el.innerHTML + '</svg>'; bdiv.appendChild(b); b.addEventListener('click', ev => { ev.stopPropagation(); fire(b._el); }); }
    b._el = el; b._slot = slot; b._kind = kind; b._i = i; b._k = k;
  });
  for (const id in btns) if (!seen[id]) { btns[id].remove(); delete btns[id]; }
}
const gbtn = {};
function syncPlus() {
  const S = A.S(), seen = {};
  (S.spots || []).forEach(sp => {
    seen[sp.id] = 1;
    if (!gbtn[sp.id]) { const b = document.createElement('button'); b.type = 'button'; b.className = 'v3b v3plus'; b.setAttribute('aria-label', 'Choisir les plantes'); b.title = 'Choisir les plantes'; b.innerHTML = '<i>+</i>'; bdiv.appendChild(b); b.addEventListener('click', ev => { ev.stopPropagation(); A.openSpot(b._sp.id); }); gbtn[sp.id] = b; }
    gbtn[sp.id]._sp = sp;
  });
  for (const k in gbtn) if (!seen[k]) { gbtn[k].remove(); delete gbtn[k]; }
}
const topH = { 'Arbre': 3.7, 'Grimpante': 2.6, 'Arbuste': 2.2, 'Racine': 1.3, 'Herbacée': 1.6, 'Couvre-sol': .9 };
const vtmp = new T.Vector3();
function placeBadges() {
  const S = A.S(), w = canvas.clientWidth, h = canvas.clientHeight, bs = Math.min(1, Math.max(.52, 30 / cam.dist));
  for (const k in gbtn) { const b = gbtn[k], sp = b._sp, R = A.G.spotRadius(sp), hx = sp.t === 'hedge' ? sp.x + Math.cos(sp.a || 0) * (R + .5) : sp.x + R * .72, hz = sp.t === 'hedge' ? sp.z + Math.sin(sp.a || 0) * (R + .5) : sp.z + R * .72; vtmp.set(hx, .6, hz).project(camera); if (vtmp.z > 1 || vtmp.z < -1) { b.style.display = 'none'; continue; } b.style.display = ''; b.style.transform = 'translate(' + ((vtmp.x * .5 + .5) * w - 21).toFixed(1) + 'px,' + ((-vtmp.y * .5 + .5) * h - 21).toFixed(1) + 'px) scale(' + bs.toFixed(2) + ')'; }
  for (const id in btns) {
    const b = btns[id]; let x, y, z, ox = 0, oy = 0;
    if (b._kind === 'lawn') { const q = deco['L' + b._k]; if (!q) { b.style.display = 'none'; continue; } x = q[0]; z = q[1]; y = 1.3; }
    else if (b._kind === 'trogne') { const q = deco['T' + b._k]; if (!q) { b.style.display = 'none'; continue; } x = q[0]; z = q[1]; y = 4.4; }
    else { const i = +b._i, c = S.grid[i]; if (!c) { b.style.display = 'none'; continue; } [x, z] = cellXZ(i); const pl = A.P[c.pid]; y = c.treille ? 2.3 : (topH[pl.strate] || 1.6) * (.45 + .55 * smooth(0, 1, 0.5 + .5 * 1)); const n = b._slot; ox = n % 2 ? 15 : -15; oy = -Math.floor(n / 2) * 26; if (b._kind === 'honey') { y = 1.9; ox = 0; } }
    vtmp.set(x, y, z).project(camera);
    if (vtmp.z > 1 || vtmp.z < -1) { b.style.display = 'none'; continue; }
    b.style.display = ''; b.style.transform = 'translate(' + ((vtmp.x * .5 + .5) * w + ox * bs - 21).toFixed(1) + 'px,' + ((-vtmp.y * .5 + .5) * h + oy * bs - 21).toFixed(1) + 'px) scale(' + bs.toFixed(2) + ')';
  }
}

/* ---------- synchronisation globale ---------- */
let first = true, lastHour = -1, frostPrev = -1, sigAll = '';
function sync() {
  if (!A || !V.on || !R) return;
  const S = A.S(), d = A.dims(); const ncols = d[0], nrows = d[1];
  if (!S.spots) { if (S.grid.some(c => c)) A.G.adoptLegacy(S); else S.spots = []; }
  const m = A.G.dateOf(S.day).m, sk = seasonKey(m);
  COLS = ncols; ROWS = nrows; STRN = A.STR; BCOLS = Math.ceil(COLS / 2); BROWS = Math.ceil(ROWS / 2); HW = BCOLS * GS / 2 + 1.5; HH = BROWS * GS / 2 + 1.5;
  if (sk !== season || first) applySeason(sk, first);
  const dk = COLS + 'x' + ROWS; if (dk !== dimKey) { dimKey = dk; for (const k in cg) gBeds.remove(cg[k].g); cg = {}; sigDec = ''; sigPaths = ''; shapeTerrain(); scatter(); rebuildPlate(); if (cam.auto || first) fit(); }
  const w = S.w || {}; const rn = (w.rain || 0) >= 1, fr = (w.tmin !== undefined && w.tmin < 0) ? 1 : 0; let sk2 = false;
  if (rn !== rainOn) { rainOn = rn; sk2 = true; } if (fr !== frostPrev) { frostPrev = fr; frost = fr; paintTerrain(); }
  const h = new Date(); hour = Math.min(20, Math.max(6.2, h.getHours() + h.getMinutes() / 60)); const hq = Math.round(hour * 4) + (rainOn ? 100 : 0); if (hq !== lastHour || sk2) { lastHour = hq; gradientSky(); }
  { const hn = document.getElementById('hint'); if (hn && hn.innerHTML) hn.innerHTML = hn.innerHTML.replace('Choisis une parcelle libre', 'Touche un emplacement libre').replace('Touche une parcelle libre pour poser', 'Touche le sol pour poser'); }
  syncCells(S, m, sk); syncTracks(S); syncDecor(S, sk); syncOver(S); syncBadges();
  const st = A.G.stats(S); deco.biodiv = st.biodiv || 0; deco.ruches = 0; S.grid.forEach(c => { if (c && c.furn === 'ruche') deco.ruches++; });
  first = false;
}

/* ---------- boucle d'animation ---------- */
let clock = null, raf = 0; const reduceM = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } })();
function fauna(t) {
  const cl = deco.cells || [], warm = season === 'spring' || season === 'summer', nB = Math.min(7, Math.floor((deco.biodiv || 0) / 22)), nBee = Math.min(6, (deco.ruches || 0) * 2 + Math.floor((deco.biodiv || 0) / 45));
  const anchor = u => { if (!u.c || (u.c.t !== undefined && t > u.c.t)) { const i = cl.length ? cl[Math.floor(Math.random() * cl.length)] : 0, q = cellXZ(i); u.c = { x: q[0], z: q[1], t: t + 8 + Math.random() * 10 }; } return u.c; };
  butter.forEach((b, i) => { const u = b.userData; b.visible = warm && i < nB && hour > 7.5 && hour < 19 && cl.length > 0; if (!b.visible) return; const c = anchor(u), q = t * u.sp + u.ph, nx = c.x + Math.sin(q) * 1.7 + Math.sin(q * 2.3) * .5, nz = c.z + Math.cos(q * .9) * 1.7, ny = 1.4 + Math.sin(q * 1.7) * .4 + Math.sin(t * 6 + u.ph) * .05; b.rotation.y = Math.atan2(nx - b.position.x, nz - b.position.z); b.position.set(nx, ny, nz); const f = Math.sin(t * 16 + u.ph) * .9; u.w[0].rotation.z = f; u.w[1].rotation.z = -f; });
  beesA.forEach((b, i) => { const u = b.userData; b.visible = (warm || season === 'autumn') && i < nBee && hour > 8 && hour < 18.5 && cl.length > 0; if (!b.visible) return; const c = anchor(u), q = t * u.sp + u.ph, nx = c.x + Math.sin(q * 1.3) * .9 + Math.sin(q * 3.1) * .2, nz = c.z + Math.cos(q) * .9, ny = 1.1 + Math.sin(q * 2) * .25; b.rotation.y = Math.atan2(nx - b.position.x, nz - b.position.z); b.position.set(nx, ny, nz); const f = Math.sin(t * 60) * .6; u.w[0].rotation.z = f; u.w[1].rotation.z = -f; });
  birdsA.forEach(b => { const u = b.userData, q = t * u.sp + u.ph; b.visible = hour > 6.5 && hour < 19.5 && !rainOn; const nx = Math.cos(q) * u.R * 1.2, nz = Math.sin(q) * u.R, ny = u.h + Math.sin(q * 3) * .6; b.rotation.y = Math.atan2(nx - b.position.x, nz - b.position.z); b.rotation.z = -.25; b.position.set(nx, ny, nz); const f = Math.sin(t * 9 + u.ph) * .7; u.w[0].rotation.z = f; u.w[1].rotation.z = -f; });
}
const WORKS = { water: 1, harvest: 1, prune: 1, mulch: 1, compost: 1, plant: 1 };
const dropGeo = new T.IcosahedronGeometry(.045, 0), dropMat = new T.MeshLambertMaterial({ color: 0x6fb6e8 });
function spawn(geom, m, pos, v, life) { const o = new T.Mesh(geom, m); o.position.copy(pos); gAmb.add(o); fx.push({ m: o, v, life }); }
function moveChar(obj, a, dt, t, kind) {
  const xz0 = cr2xz(a.c, a.r), x = xz0[0], z = xz0[1], u = obj.userData; obj.visible = !a.inside;
  let px = obj.position.x, pz = obj.position.z, hx = x, hz = z;
  if (!u.init) { px = x; pz = z; u.init = 1; }
  else if (kind === 'd' || !net) { const d = Math.hypot(x - px, z - pz); if (d > .0005) { const st = Math.min(d, Math.min(9 * dt, Math.max(d * Math.min(1, dt * 10), 1.5 * dt))); px += (x - px) / d * st; pz += (z - pz) / d * st; } }
  else {
    if (!u.rt || u.rt.v !== netVer || Math.hypot(u.rt.tx - x, u.rt.tz - z) > .8) u.rt = { tx: x, tz: z, v: netVer, pts: routeTo([px, pz], [x, z]), k: 0 };
    else if (u.rt.pts.length) { u.rt.pts[u.rt.pts.length - 1] = [x, z]; }
    let rem = Math.min(10, Math.max(3.6, Math.hypot(x - px, z - pz) * 1.2)) * dt;
    while (rem > 0 && u.rt.k < u.rt.pts.length) { const w = u.rt.pts[u.rt.k], dx0 = w[0] - px, dz0 = w[1] - pz, d = Math.hypot(dx0, dz0); if (d <= rem) { px = w[0]; pz = w[1]; rem -= d; u.rt.k++; } else { px += dx0 / d * rem; pz += dz0 / d * rem; hx = w[0]; hz = w[1]; rem = 0; } }
  }
  const mvd = Math.hypot(px - obj.position.x, pz - obj.position.z), moving = (!!a.path.length && a.pause <= 0) || mvd / Math.max(dt, .001) > .35;
  if (mvd > .0004) { const want = Math.atan2(px - obj.position.x, pz - obj.position.z); let df = want - u.heading; df = Math.atan2(Math.sin(df), Math.cos(df)); u.heading += df * Math.min(1, dt * 10); }
  obj.position.set(px, hAt(px, pz) + .06, pz); obj.rotation.y = u.heading;
  const sw = moving ? Math.sin(t * (kind === 'd' ? 16 : 10)) : 0;
  if (kind === 'd') { u.legs.forEach((l, i) => { l.rotation.z = (i % 3 ? -1 : 1) * sw * .8; }); u.tail.rotation.y = Math.sin(t * 9) * (moving ? .6 : .9); u.body.position.y = moving ? Math.abs(Math.sin(t * 8)) * .04 : 0; u.head.rotation.z = moving ? 0 : Math.sin(t * 1.3) * .12; return; }
  u.legL.rotation.x = sw * .7; u.legR.rotation.x = -sw * .7; u.armL.rotation.x = -sw * .6; u.armR.rotation.x = sw * .6; u.body.position.y = moving ? Math.abs(Math.sin(t * 10)) * .06 : 0; u.body.rotation.x = 0;
  if (u.can) { u.can.visible = false; u.bask.visible = false; }
  if (kind === 'g' && a.act && a.actT > 0 && !moving && !a.path.length) {
    const ci = Math.max(0, Math.min(COLS - 1, Math.floor(a.c))), ri = Math.max(0, Math.min(ROWS - 1, Math.floor(a.r))), tq = cr2xz(ci + .5, ri + .5), tx = tq[0], tz = tq[1], want = Math.atan2(tx - x, tz - z); let df = want - u.heading; df = Math.atan2(Math.sin(df), Math.cos(df)); u.heading += df * Math.min(1, dt * 8);
    if (a.act === 'water') { u.can.visible = true; u.armR.rotation.x = -1.3; u.can.rotation.x = .45; if (Math.random() < dt * 18) { const f = new T.Vector3(Math.sin(u.heading), 0, Math.cos(u.heading)), p = obj.position.clone().addScaledVector(f, .55); p.y += .5; spawn(dropGeo, dropMat, p, f.clone().multiplyScalar(1.3 + Math.random() * .4).add(new T.Vector3((Math.random() - .5) * .4, .6, (Math.random() - .5) * .4)), .6); } }
    else if (a.act === 'harvest') { u.bask.visible = true; u.armR.rotation.x = -2.5 + Math.sin(t * 9) * .35; u.armL.rotation.x = -.5; }
    else { u.body.rotation.x = .55; u.armR.rotation.x = -1.1 + Math.sin(t * 14) * .5; u.armL.rotation.x = -.6; if (Math.random() < dt * 4) { const f = new T.Vector3(Math.sin(u.heading), 0, Math.cos(u.heading)), p = obj.position.clone().addScaledVector(f, .7); p.y += .2; for (let i = 0; i < 3; i++) spawn(dropGeo, mat.soil, p, new T.Vector3((Math.random() - .5) * 1.2, 1.6 + Math.random(), (Math.random() - .5) * 1.2), .5); } }
  }
}
function frame() {
  raf = requestAnimationFrame(frame); if (!V.on || document.hidden) return;
  const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime, now = performance.now() / 1000; timeU.value = t;
  for (const k in cg) { const u = cg[k].g.userData; if (!reduceM) u.plants.forEach(q => { q.rotation.z = Math.sin(t * .9 + q.userData.phase) * (q.userData.sway || 0); }); u.waters.forEach(w => { w.position.y = .07 + Math.sin(t * 1.6) * .008; }); }
  clouds.forEach(c => { c.position.x += dt * .6; if (c.position.x > 90) c.position.x = -90; c.visible = true; });
  if (parts.visible) { const a = pg.attributes.position, fall = season === 'winter' ? .5 : 1; for (let i = 0; i < NP; i++) { let y = a.getY(i) - pvel[i] * dt * fall; if (y < 0) y = 14; a.setY(i, y); a.setX(i, a.getX(i) + Math.sin(t * .8 + i) * dt * .6); } a.needsUpdate = true; }
  if (rainL.m) { rainL.m.visible = rainOn; if (rainOn) { const pos = rainL.m.geometry.attributes.position; for (let i = 0; i < rainL.N; i++) { const p = rainL.p[i]; p[1] -= dt * 22; if (p[1] < 0) p[1] += 16; const x = cam.tx + p[0], z = cam.tz + p[2]; pos.setXYZ(i * 2, x, p[1], z); pos.setXYZ(i * 2 + 1, x - .08, p[1] + .6, z); } pos.needsUpdate = true; } }
  if (deco.chim) { }
  if (trans) { const k = Math.min(1, (now - trans.t0) / 1.5), e = k * k * (3 - 2 * k); curS = lerpSeason(trans.a, trans.b, e); setColors(curS); paintTerrain(); gradientSky(); if (k >= 1) { curS = trans.b; trans = null; } }
  mists.forEach(m => { m.position.x += dt * m.userData.sp; if (m.position.x > 40) m.position.x = -40; });
  const ag = A.agents; moveChar(gardener, ag.g, dt, t, 'g'); moveChar(dogM, ag.d, dt, t, 'd'); ['f0', 'f1'].forEach(k => { if (ag[k]) moveChar(fam[k], ag[k], dt, t, 'f'); });
  for (let i = fx.length - 1; i >= 0; i--) { const f = fx[i]; f.life -= dt; if (f.life <= 0) { gAmb.remove(f.m); fx.splice(i, 1); continue; } f.v.y -= 9 * dt; f.m.position.addScaledVector(f.v, dt); }
  fauna(t);
  pulse.forEach((o, i) => { if (o.userData.bob) { o.position.y = .75 + Math.sin(t * 3 + i) * .1; o.rotation.y = t * 1.2; } else o.scale.setScalar(1 + Math.sin(t * 4) * .06); });
  if (cam.taz !== null) { cam.az += (cam.taz - cam.az) * Math.min(1, dt * 6); if (Math.abs(cam.taz - cam.az) < .003) { cam.az = cam.taz; cam.taz = null; } }
  if (cam.tdist !== null) { cam.dist += (cam.tdist - cam.dist) * Math.min(1, dt * 6); if (Math.abs(cam.tdist - cam.dist) < .05) { cam.tdist = null; } }
  if (scene.fog) { scene.fog.near = cam.dist * .9 + 6; scene.fog.far = cam.dist * .9 + 70; }
  placeCamera(); sun.target.position.set(0, 0, 0); R.render(scene, camera); placeBadges();
}

/* ---------- interface publique ---------- */
function setOn(on) {
  V.on = !!on; document.body.classList.toggle('v3d-on', V.on);
  document.querySelectorAll('[data-act="view3d"]').forEach(b => { b.classList.toggle('on', V.on); b.setAttribute('aria-pressed', String(V.on)); b.title = V.on ? 'Passer en vue 2D' : 'Passer en vue 3D'; });
  try { localStorage.setItem('jv_v3d', V.on ? '1' : '0'); } catch (e) {}
  if (V.on) { first = first || !dimKey; resize(); sync(); if (!clock) clock = new T.Clock(); if (!raf) raf = requestAnimationFrame(frame); }
  else { if (raf) cancelAnimationFrame(raf); raf = 0; }
}
V.mount = function (api) {
  A = api;
  try { setup(); applySeason('summer', true); } catch (e) { try { console.warn('Vue 3D indisponible', e); } catch (_) {} document.querySelectorAll('[data-act="view3d"]').forEach(b => b.remove()); if (canvas && canvas.parentNode) canvas.remove(); if (bdiv && bdiv.parentNode) bdiv.remove(); R = null; return false; }
  V.ok = true; V.gardenerPos = () => [gardener.position.x, gardener.position.z]; V.netInfo = () => net && { n: net.nn.length, nodes: net.nn.map(q => [q.x, q.z]) }; V.sync = sync; V.setOn = setOn; V.screenXZ = (x, z) => { const v = new T.Vector3(x, 0, z).project(camera), r = canvas.getBoundingClientRect(); return [r.left + (v.x * .5 + .5) * r.width, r.top + (-v.y * .5 + .5) * r.height]; }; V.screenOf = i => { const [x, z] = cellXZ(i), v = new T.Vector3(x, .3, z).project(camera), r = canvas.getBoundingClientRect(); return [r.left + (v.x * .5 + .5) * r.width, r.top + (-v.y * .5 + .5) * r.height]; };
  window.addEventListener('click', e => {
    const t = e.target.closest && e.target.closest('[data-act]'); if (!t) return; const a = t.dataset.act;
    if (a === 'view3d') { e.stopPropagation(); e.preventDefault(); setOn(!V.on); A.rerender(); return; }
    if (!V.on) return;
    if (a === 'zoom-in' || a === 'zoom-out' || a === 'rot-l' || a === 'rot-r' || a === 'view-reset') { e.stopPropagation(); e.preventDefault(); cam.auto = false;
      if (a === 'zoom-in') cam.tdist = Math.max(8, cam.dist / 1.3); else if (a === 'zoom-out') cam.tdist = Math.min(80, cam.dist * 1.3);
      else if (a === 'rot-l') cam.taz = (cam.taz === null ? cam.az : cam.taz) + Math.PI / 2; else if (a === 'rot-r') cam.taz = (cam.taz === null ? cam.az : cam.taz) - Math.PI / 2; else fit(); }
  }, true);
  let want = true; try { want = localStorage.getItem('jv_v3d') !== '0'; } catch (e) {}
  setOn(want); return true;
};
})();

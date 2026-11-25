// Carte de la ville (fiche Notion 52) : vue 3D légère de 10 parcelles. NON intégré au jeu, non inclus dans le build.
// Tout ce qui n'est pas planté = herbe tondue verte, sans fleurs ni faune. Volumes simples (modèles Tripo plus tard).
(function (root) {
'use strict';
const SIZES = [[8, 6], [10, 8], [12, 10], [14, 12], [16, 14]], CELL = 1.0;
// Disposition : 2 rangées de 5 parcelles de part et d'autre d'une rue centrale. Ordre = ordre de déblocage.
function layout(parcels) {
  const out = [], X0 = -46, DX = 20, STREET = 7;
  parcels.forEach((p, i) => {
    const col = i % 5, row = (i / 5) | 0, d = SIZES[p.S ? p.S.size || 0 : p.size || 0];
    const w = d[0] * CELL, h = d[1] * CELL;
    out.push({ id: p.id, state: p.state, type: p.type, w, h, x: X0 + col * DX + DX / 2, z: (row ? 1 : -1) * (STREET / 2 + 9 + 0), size: p.S ? p.S.size || 0 : p.size || 0 });
  });
  return out;
}
function build(T, parcels, opt) {
  opt = opt || {};
  const scene = new T.Scene(); scene.background = new T.Color(0xbcd7e6); scene.fog = new T.Fog(0xbcd7e6, 120, 260);
  scene.add(new T.HemisphereLight(0xffffff, 0x6a8f4e, .85));
  const sun = new T.DirectionalLight(0xfff3d6, .8); sun.position.set(40, 70, 30); scene.add(sun);
  const M = c => new T.MeshLambertMaterial({ color: c });
  const lawn = new T.Mesh(new T.PlaneGeometry(400, 400), M(0x4a8a36)); lawn.rotation.x = -Math.PI / 2; scene.add(lawn);   // herbe tondue partout
  const road = new T.Mesh(new T.PlaneGeometry(130, 7), M(0x8d8f8c)); road.rotation.x = -Math.PI / 2; road.position.y = .03; scene.add(road);
  const lay = layout(parcels), groups = {};
  lay.forEach(L => {
    const g = new T.Group(); g.position.set(L.x, 0, L.z); g.userData = { id: L.id, state: L.state };
    // parcelle : carré d'herbe légèrement plus clair (tondue), bordure claire ; verrouillée = grise-verte terne
    const plot = new T.Mesh(new T.PlaneGeometry(L.w + 1, L.h + 1), M(L.state === 'locked' ? 0x5a9a40 : 0x3f8a2e)); plot.rotation.x = -Math.PI / 2; plot.position.y = .05; g.add(plot);
    const edge = new T.Mesh(new T.PlaneGeometry(L.w + 1.6, L.h + 1.6), M(0xcfc8b2)); edge.rotation.x = -Math.PI / 2; edge.position.y = .04; g.add(edge);
    // bâtiment côté rue
    const side = L.z < 0 ? 1 : -1, bz = side * (L.h / 2 - 1.2) * -1;
    let b;
    if (L.type === 'balcon') {          // immeuble à balcons
      b = new T.Group(); const body = new T.Mesh(new T.BoxGeometry(L.w * .9, 9, 4), M(0xe6dccb)); body.position.y = 4.5; b.add(body);
      for (let f = 0; f < 3; f++) for (let k = 0; k < 3; k++) { const bal = new T.Mesh(new T.BoxGeometry(1.8, .25, 1.1), M(0xb98b5e)); bal.position.set(-2.4 + k * 2.4, 2 + f * 3, 2.5 * -side); b.add(bal); }
    } else {                            // maison : murs + toit
      b = new T.Group(); const w = L.type === 'petit' ? 5 : 7, body = new T.Mesh(new T.BoxGeometry(w, 3.2, 4.5), M(0xf1e7d3)); body.position.y = 1.6; b.add(body);
      const roof = new T.Mesh(new T.ConeGeometry(w * .78, 2.2, 4), M(0xb5533c)); roof.rotation.y = Math.PI / 4; roof.position.y = 4.3; b.add(roof);
    }
    b.position.set(0, 0, bz + side * -1.5 * 0); b.position.z = (L.z < 0 ? 1 : -1) * (L.h / 2 + 2.6) * -1; g.add(b);
    // parcelle ouverte non plantée : petit piquet "à planter" ; plantée : arbuste-repère vert foncé (remplacé plus tard par la vraie forêt)
    if (L.state === 'planted') for (let k = 0; k < 7; k++) { const t = new T.Mesh(new T.SphereGeometry(.9 + (k % 3) * .35, 8, 6), M(0x2f7a32)); t.position.set(-L.w / 2 + 1.5 + (k * (L.w - 3) / 6), 1, ((k * 5) % 3 - 1) * L.h / 5); g.add(t); }
    if (L.state === 'open') { const s = new T.Mesh(new T.BoxGeometry(.2, 1.6, .2), M(0xb55a3c)); s.position.set(0, .8, 0); g.add(s); }
    scene.add(g); groups[L.id] = g;
  });
  // jardinier unique : silhouette simple, se déplace par la rue jusqu'à la parcelle visée
  const gard = new T.Group(); { const bd = new T.Mesh(new T.CylinderGeometry(.35, .45, 1.3, 10), M(0x3b6ea5)); bd.position.y = .85; gard.add(bd); const hd = new T.Mesh(new T.SphereGeometry(.34, 10, 8), M(0xf0c9a0)); hd.position.y = 1.75; gard.add(hd); const hat = new T.Mesh(new T.CylinderGeometry(.5, .5, .08, 10), M(0xd8b45a)); hat.position.y = 2; gard.add(hat); }
  gard.position.set(-52, 0, 0); scene.add(gard);
  const byId = {}; lay.forEach(L => { byId[L.id] = L; });
  // trajet : rue (z=0) puis entrée de la parcelle (côté rue)
  function route(from, id) { const L = byId[id], gate = [L.x, 0, L.z + (L.z < 0 ? 1 : -1) * (L.h / 2 + .8)], inside = [L.x, 0, L.z]; return [[from.x, 0, 0], [L.x, 0, 0], gate, inside]; }
  let path = null, seg = 0, done = null;
  function goTo(id, cb) { path = route(gard.position, id); seg = 1; done = cb || null; }
  function leave(id, cb) { const L = byId[id], g = gard.position; path = [[g.x, 0, g.z], [L.x, 0, L.z + (L.z < 0 ? 1 : -1) * (L.h / 2 + .8)], [L.x, 0, 0]]; seg = 1; done = cb || null; }
  function update(dt) {
    if (!path) return; const a = gard.position, b = path[seg], d = Math.hypot(b[0] - a.x, b[2] - a.z), step = 14 * dt;
    if (d <= step) { gard.position.set(b[0], 0, b[2]); seg++; if (seg >= path.length) { path = null; if (done) { const f = done; done = null; f(); } } }
    else { gard.position.x += (b[0] - a.x) / d * step; gard.position.z += (b[2] - a.z) / d * step; gard.rotation.y = Math.atan2(b[0] - a.x, b[2] - a.z); }
  }
  // clic sur une parcelle : renvoie son id (ou null) à partir d'une position écran
  const ray = new T.Raycaster(), V = new T.Vector2();
  function pick(camera, dom, cx, cy) {
    const r = dom.getBoundingClientRect(); V.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1); ray.setFromCamera(V, camera);
    const ground = new T.Plane(new T.Vector3(0, 1, 0), 0), pt = new T.Vector3(); if (!ray.ray.intersectPlane(ground, pt)) return null;
    for (const L of lay) if (Math.abs(pt.x - L.x) <= L.w / 2 + 2 && Math.abs(pt.z - L.z) <= L.h / 2 + 2) return L.id; return null;
  }
  function setState(id, st) { const L = byId[id]; if (L) L.state = st; }
  return { scene, groups, layout: lay, gardener: gard, goTo, leave, update, pick, setState };
}
const api = { layout, build, SIZES };
if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.City3D = api;
})(typeof window !== 'undefined' ? window : globalThis);

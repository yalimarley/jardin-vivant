// NODE_PATH=/path/to/jsdom/node_modules node tests/test_catalog_links.cjs [previous-build.html]
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { JSDOM, VirtualConsole } = require('jsdom');
const root = path.resolve(__dirname, '..');
const plants = JSON.parse(fs.readFileSync(path.join(root, 'data/plants2.json')));
const ids = [0, 6, 36, 46, 104, 489, 557, 578, 663, ...Array.from({length: 15}, (_, i) => 685 + i)];
const key = 'jardin-vivant-proto-v2';
function boot(html, save) {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { if (e.type !== 'not implemented') errors.push(e.message); });
  const dom = new JSDOM(html, {runScripts: 'dangerously', url: 'https://test.invalid/?dev', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.__JV_INSTANT = true;
      w.fetch = async () => ({ok: true, json: async () => []});
      w.matchMedia = () => ({matches: false, addListener() {}, removeListener() {}, addEventListener() {}});
      w.HTMLElement.prototype.scrollIntoView = function () {};
      if (save) w.localStorage.setItem(key, save);
    }
  });
  assert.ok(dom.window.__jv, 'built game starts');
  return {dom, errors};
}
let save;
if (process.argv[2]) {
  const previous = boot(fs.readFileSync(process.argv[2], 'utf8'));
  const api = previous.dom.window.__jv;
  Object.assign(api.state(), api.G.demo());
  for (const id of [...ids, 111, 112, 479, 561]) api.state().cards[id] = 3;
  api.flush();
  save = previous.dom.window.localStorage.getItem(key);
  assert.ok(JSON.parse(save).grid.some(Boolean), 'old build saves a planted garden');
  assert.deepEqual(previous.errors, []);
  previous.dom.window.close();
}
const current = boot(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), save);
const w = current.dom.window, api = w.__jv, state = api.state();
if (save) {
  const old = JSON.parse(save);
  for (const field of ['day', 'cards', 'grid']) assert.equal(JSON.stringify(state[field]), JSON.stringify(old[field]), 'preserved ' + field);
  console.log('PASS: previous-build save preserves day, inventory and planted grid');
}
assert.equal(plants.length, 700);
assert.equal(plants.filter(p => !p.retired).length, 696);
assert.ok(plants.every((p, i) => p.id === i && /^[0-9a-f-]{36}$/.test(p.cat)));
// Use the game's real renderer, with a valid cell from its demo garden.
const demo = api.G.demo();
const cell = JSON.parse(JSON.stringify(demo.grid.find(c => c && !c.treille)));
for (const id of ids) {
  state.grid[0] = {...cell, pid: id}; api.ui.sel = 0; api.ui.ficheFull = true; api.flush();
  w.document.querySelector('[data-act="fiche-open"]')?.click();
  const link = w.document.querySelector('#fiche a[href*="/catalogue-plantes/"]');
  assert.ok(link, 'link rendered for ' + id);
  assert.equal(link.href, 'https://www.jflab.earth/catalogue-plantes/' + plants[id].cat);
  assert.equal(w.document.querySelector('#fiche .lat').textContent, plants[id].latin);
}
for (const latin of ['Hemerocallis fulva', 'Quercus robur', 'Origanum vulgare', 'Helianthus strumosus']) {
  const button = w.document.createElement('button'); button.dataset.act = 'herbier'; w.document.body.append(button); button.click(); button.remove();
  const input = w.document.querySelector('#hq'); input.value = latin; input.dispatchEvent(new w.Event('input', {bubbles: true}));
  assert.ok(w.document.querySelector('#hlist .hrow'), 'herbarium search: ' + latin);
}
assert.deepEqual(current.errors, []);
w.close();
console.log('PASS: 24 rendered catalogue links, 4 botanical searches, 700 stable card IDs');

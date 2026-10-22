const { chromium } = require('playwright'); let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('ECHEC:', m); } else console.log('ok  :', m); };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [name, vp] of [['bureau', { width: 1440, height: 800 }], ['téléphone', { width: 390, height: 800 }]]) {
    const ctx = await b.newContext({ viewport: vp, hasTouch: name !== 'bureau' }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + process.cwd() + '/jardin-vivant.html'); await p.waitForTimeout(400); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(400);
    if (await p.$('[data-act="tuto-skip"]')) await p.click('[data-act="tuto-skip"]');
    const r = await p.evaluate(() => { const J = window.__jv, S = J.state(), G = J.G; let d = S.day, found = -1; for (let k = 0; k < 200; k++) { S.day = d + k; const f = G.forecastInfo(S); if (f && f.kind === 'gel') { found = S.day; break; } } if (found < 0) return null; S.w = G.weather(S.day); S.maxPlantings = 30; const hp = G.P.slice().sort((a, b) => b.gel - a.gel)[0]; [30, 31].forEach(i => { S.grid[i] = { pid: hp.id, g: 60, water: 80, health: 100, stress: 0, stage: 'jeune', lastPick: -99, planted: 0 }; }); S.mats.voile = 2; J.flush(); return found; });
    ok(r != null, name + ' : un gel est annoncé quelque part dans les 200 jours (jour ' + r + ')');
    ok(await p.evaluate(() => !document.getElementById('wxalert').hidden && /Gel|Gelée/.test(document.getElementById('wxalert').textContent)), name + ' : bandeau d’alerte gel visible');
    ok(!!(await p.$('[data-act="protect"]')), name + ' : bouton Protéger affiché');
    await p.evaluate(() => document.querySelector('[data-act="protect"]').click()); await p.waitForTimeout(300);
    const st = await p.evaluate(() => { const S = window.__jv.state(); return { v: S.mats.voile, c: [30, 31].map(i => S.grid[i].voileUntil >= S.day) }; });
    ok(st.v === 1 && st.c.every(Boolean), name + ' : un voile couvre les deux haricots (reste ' + st.v + ')');
    ok(errs.length === 0, name + ' : aucune erreur JS ' + errs.join('|')); await ctx.close();
  }
  await b.close(); console.log(fails ? '\n' + fails + ' ÉCHEC(S)' : '\nTests gel : tout passe'); process.exit(fails ? 1 : 0);
})();

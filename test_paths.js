const { chromium } = require('playwright'); let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('ECHEC:', m); } else console.log('ok  :', m); };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [name, vp, touch] of [['bureau', { width: 1440, height: 800 }, false], ['téléphone', { width: 390, height: 800 }, true]]) {
    const ctx = await b.newContext({ viewport: vp, hasTouch: touch }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + process.cwd() + '/jardin-vivant.html'); await p.waitForTimeout(500);
    await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(500);
    await p.evaluate(() => { try { localStorage.setItem('jv_tuto_off', '1'); } catch (e) {} });
    if (await p.$('[data-act="tuto-skip"]')) await p.click('[data-act="tuto-skip"]');
    const V = (x, y) => p.evaluate(([x, y]) => window.__jv.trace.vertexClient(x, y), [x, y]);
    const S = () => p.evaluate(() => ({ paths: window.__jv.state().paths.slice(), chemin: window.__jv.state().mats.chemin }));
    await p.evaluate(() => { const s = window.__jv.state(); s.mats.chemin = 12; window.__jv.ui.mode = { type: 'mat', k: 'chemin' }; window.__jv.ui.tool = 'select'; window.__jv.flush(); });
    // zoom arrière pour tout voir sur téléphone
    // 1. tracé depuis le bord
    const pts = [[4, 0], [4, 1], [4, 2], [4, 3], [5, 3]]; const c = [];
    for (const [x, y] of pts) c.push(await V(x, y));
    ok(c.every(q => q.x > 0 && q.x < vp.width && q.y > 0 && q.y < vp.height), name + ' : sommets visibles à l’écran ' + JSON.stringify(c.map(q => [Math.round(q.x), Math.round(q.y)])));
    await p.mouse.move(c[0].x, c[0].y); await p.mouse.down();
    for (let k = 1; k < c.length; k++) { await p.mouse.move((c[k - 1].x + c[k].x) / 2, (c[k - 1].y + c[k].y) / 2, { steps: 3 }); await p.mouse.move(c[k].x, c[k].y, { steps: 3 }); }
    await p.mouse.up(); await p.waitForTimeout(300);
    let st = await S(); ok(st.paths.length === 4 && st.chemin === 8, name + ' : 4 tronçons tracés depuis le bord (' + st.paths.join(' ') + ', reste ' + st.chemin + ')');
    // 2. départ au milieu : refusé
    const m = await V(8, 7); await p.mouse.move(m.x, m.y); await p.mouse.down(); const m2 = await V(8, 5); await p.mouse.move(m2.x, m2.y, { steps: 5 }); await p.mouse.up(); await p.waitForTimeout(200);
    st = await S(); ok(st.paths.length === 4, name + ' : pas de départ au milieu du jardin');
    // 3. toucher un tronçon dans le mode sentier le retire
    const a = await V(4, 1), a2 = await V(4, 2); await p.mouse.click((a.x + a2.x) / 2, (a.y + a2.y) / 2); await p.waitForTimeout(300);
    st = await S(); ok(st.paths.length === 3 && st.chemin === 9 && !st.paths.includes('4,1-4,2'), name + ' : un tronçon touché est retiré (+1)');
    // 4. outil supprimer
    await p.evaluate(() => { window.__jv.ui.mode = null; window.__jv.ui.tool = 'delete'; window.__jv.flush(); });
    const d1 = await V(4, 2), d2 = await V(4, 3); await p.mouse.click((d1.x + d2.x) / 2, (d1.y + d2.y) / 2); await p.waitForTimeout(300);
    st = await S(); ok(!st.paths.includes('4,2-4,3') && st.chemin === 10, name + ' : l’outil supprimer retire un tronçon (' + st.paths.join(' ') + ')');
    // 5. plus de gravier
    await p.evaluate(() => { const s = window.__jv.state(); s.mats.chemin = 2; window.__jv.ui.tool = 'select'; window.__jv.ui.mode = { type: 'mat', k: 'chemin' }; window.__jv.flush(); });
    const e0 = await V(7, 0), e1 = await V(7, 4); await p.mouse.move(e0.x, e0.y); await p.mouse.down(); await p.mouse.move(e1.x, e1.y, { steps: 12 }); await p.mouse.up(); await p.waitForTimeout(300);
    st = await S(); ok(st.chemin === 0 && st.paths.filter(k => k.startsWith('7,')).length === 2, name + ' : le tracé s’arrête quand le gravier manque');
    const mode = await p.evaluate(() => window.__jv.ui.mode); ok(mode === null, name + ' : le mode sentier se ferme');
    // capture
    await p.evaluate(() => { const s = window.__jv.state(); s.mats.chemin = 20; window.__jv.ui.mode = { type: 'mat', k: 'chemin' }; window.__jv.flush(); });
    await p.screenshot({ path: 'paths_' + (touch ? 'm' : 'd') + '.png' });
    ok(errs.length === 0, name + ' : aucune erreur JS ' + errs.join('|')); await ctx.close();
  }
  await b.close(); console.log(fails ? '\n' + fails + ' ÉCHEC(S)' : '\nTous les tests de sentiers passent'); process.exit(fails ? 1 : 0);
})();

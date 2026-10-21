const { chromium } = require('playwright'); let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('ECHEC:', m); } else console.log('ok  :', m); };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const run = async (name, vp, fn) => {
    const ctx = await b.newContext({ viewport: vp, hasTouch: name !== 'bureau' }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_|Failed to load/.test(m.text())) errs.push(m.text()); });
    await p.goto('file://' + process.cwd() + '/jardin-vivant.html'); await p.waitForTimeout(500);
    await p.evaluate(() => { localStorage.clear(); window.__ev = []; document.addEventListener('click', e => window.__ev.push(e.target.id || e.target.tagName)); });
    // utilitaires dans la page
    await p.evaluate(() => {
      window.T = {
        pe: (type, id, x, y, o = {}) => document.getElementById('garden').dispatchEvent(new PointerEvent(type, Object.assign({ bubbles: true, cancelable: true, pointerId: id, pointerType: o.pt || 'mouse', clientX: x, clientY: y, button: o.button || 0, isPrimary: true }, o))),
        up: (id, x, y, pt) => window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: id, pointerType: pt || 'mouse', clientX: x, clientY: y })),
        vb: () => document.getElementById('garden').getAttribute('viewBox').split(' ').map(Number),
        world: (cx, cy) => { const s = document.getElementById('garden'), r = s.getBoundingClientRect(), v = window.T.vb(), sc = Math.min(r.width / v[2], r.height / v[3]); return { x: v[0] + (cx - r.left - (r.width - v[2] * sc) / 2) / sc, y: v[1] + (cy - r.top - (r.height - v[3] * sc) / 2) / sc }; },
        click: () => document.getElementById('garden').dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: 300, clientY: 300 }))
      };
    });
    await fn(p); ok(errs.length === 0, name + ' : aucune erreur JS ' + errs.join('|')); await ctx.close();
  };
  const center = async p => p.evaluate(() => { const r = document.getElementById('garden').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  const vbv = p => p.evaluate(() => window.T.vb());

  await run('bureau', { width: 1200, height: 900 }, async p => {
    const c = await center(p); const v0 = await vbv(p);
    // zoom molette ancré au curseur
    const cur = { x: c.x + 120, y: c.y - 60 };
    const w0 = await p.evaluate(([x, y]) => window.T.world(x, y), [cur.x, cur.y]);
    const pd = await p.evaluate(([x, y]) => { const e = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: -100, clientX: x, clientY: y }); document.getElementById('garden').dispatchEvent(e); return e.defaultPrevented; }, [cur.x, cur.y]);
    const v1 = await vbv(p), w1 = await p.evaluate(([x, y]) => window.T.world(x, y), [cur.x, cur.y]);
    ok(pd && v1[2] < v0[2], 'molette sur la carte : zoom avant, défilement de page bloqué');
    ok(Math.hypot(w0.x - w1.x, w0.y - w1.y) < 1.5, 'zoom ancré : le point sous le curseur reste le même (' + w0.x.toFixed(1) + ',' + w0.y.toFixed(1) + ' → ' + w1.x.toFixed(1) + ',' + w1.y.toFixed(1) + ')');
    const out = await p.evaluate(() => { const e = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 100, clientX: 10, clientY: 10 }); document.getElementById('res').dispatchEvent(e); return e.defaultPrevented; });
    ok(!out, 'molette hors de la carte : défilement normal conservé');
    await p.evaluate(() => { for (let i = 0; i < 60; i++) document.getElementById('garden').dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: -300, clientX: 600, clientY: 400 })); });
    let z = await p.evaluate(() => window.__jv.view().z); ok(z <= 3.2 + 1e-6 && isFinite(z), 'zoom max borné : ' + z.toFixed(2));
    await p.evaluate(() => { for (let i = 0; i < 80; i++) document.getElementById('garden').dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 300, clientX: 600, clientY: 400, deltaMode: 0 })); });
    z = await p.evaluate(() => window.__jv.view().z); ok(z >= 0.8 - 1e-6 && isFinite(z), 'zoom min borné : ' + z.toFixed(2));
    // clic droit : pan, menu contextuel bloqué sur la carte uniquement
    await p.evaluate(() => { document.querySelector('[data-act="view-reset"]').click(); for (let i = 0; i < 4; i++) document.querySelector('[data-act="zoom-in"]').click(); });
    const a = await vbv(p); const cc = await center(p);
    await p.evaluate(([x, y]) => { T.pe('pointerdown', 1, x, y, { button: 2, buttons: 2 }); T.pe('pointermove', 1, x, y); window.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerId: 1, pointerType: 'mouse', clientX: x - 120, clientY: y - 50 })); T.up(1, x - 120, y - 50); }, [cc.x, cc.y]);
    const a2 = await vbv(p); ok(a2[0] > a[0] && a2[1] > a[1], 'clic droit + glisser : la caméra se déplace (' + a[0].toFixed(0) + ' → ' + a2[0].toFixed(0) + ')');
    const ctxMap = await p.evaluate(() => { const e = new MouseEvent('contextmenu', { bubbles: true, cancelable: true }); document.getElementById('garden').dispatchEvent(e); return e.defaultPrevented; });
    const ctxOut = await p.evaluate(() => { const e = new MouseEvent('contextmenu', { bubbles: true, cancelable: true }); document.getElementById('res').dispatchEvent(e); return e.defaultPrevented; });
    ok(ctxMap && !ctxOut, 'menu contextuel supprimé sur la carte seulement');
    // clic gauche simple non bloqué ; après drag clic droit, un clic ultérieur passe
    await p.waitForTimeout(500); await p.evaluate(() => { window.__ev.length = 0; T.pe('pointerdown', 2, 300, 300, {}); T.up(2, 300, 300); T.click(); });
    ok((await p.evaluate(() => window.__ev.length)) === 1, 'clic gauche simple : atteint la carte (sélection / outil)');
    // clavier
    const k0 = await vbv(p);
    await p.keyboard.down('d'); await p.waitForTimeout(250); await p.keyboard.up('d'); const k1 = await vbv(p);
    ok(k1[0] > k0[0], 'D : la caméra se déplace vers la droite (' + k0[0].toFixed(0) + ' → ' + k1[0].toFixed(0) + ')');
    await p.keyboard.down('q'); await p.waitForTimeout(250); await p.keyboard.up('q'); const k2 = await vbv(p); ok(k2[0] < k1[0], 'Q (AZERTY) : la caméra se déplace vers la gauche');
    await p.keyboard.down('ArrowDown'); await p.waitForTimeout(200); await p.keyboard.up('ArrowDown'); const k3 = await vbv(p); ok(k3[1] !== k2[1] || k2[1] >= 0, 'flèches : déplacement vertical');
    await p.evaluate(() => { const i = document.createElement('input'); i.id = 'tmpin'; document.body.appendChild(i); i.focus(); });
    const t0 = await vbv(p); await p.keyboard.down('d'); await p.waitForTimeout(200); await p.keyboard.up('d'); await p.keyboard.press('Space');
    const t1 = await vbv(p); ok(t0.every((v, i) => v === t1[i]), 'champ de saisie : ZQSD et Espace ignorés');
    await p.evaluate(() => { document.getElementById('tmpin').remove(); document.activeElement.blur(); });
    await p.keyboard.press('Space'); const sp = await p.evaluate(() => window.__jv.view()); ok(Math.abs(sp.z - 1) < 1e-6 && sp.cx === 380, 'Espace : recentre la vue (z=' + sp.z + ')');
    // Echap : annule l'outil
    await p.click('[data-act="tool-delete"]'); await p.keyboard.press('Escape'); ok(await p.evaluate(() => document.querySelector('[data-tool="delete"]').classList.contains('on')) === false, 'Échap : outil Supprimer annulé');
    // glisser clic gauche en outil Déplacer, sans clic fantôme
    await p.click('[data-act="tool-move"]'); await p.evaluate(() => { window.__ev.length = 0; }); const m0 = await vbv(p);
    await p.evaluate(() => { T.pe('pointerdown', 5, 500, 400); window.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerId: 5, pointerType: 'mouse', clientX: 450, clientY: 380 })); T.up(5, 450, 380); T.click(); });
    const m1 = await vbv(p); ok(m1[0] !== m0[0] && (await p.evaluate(() => window.__ev.length)) === 0, 'outil Déplacer : glisser gauche = pan, aucun clic fantôme');
    // resize
    await p.evaluate(() => { for (let i = 0; i < 6; i++) document.querySelector('[data-act="zoom-in"]').click(); }); await p.setViewportSize({ width: 700, height: 600 }); await p.waitForTimeout(150);
    const rv = await p.evaluate(() => { const v = window.T.vb(); return v; }); ok(rv.every(Number.isFinite) && rv[0] >= -150 - 1e-6 && rv[0] + rv[2] <= 910 + 1e-6, 'redimensionnement : vue toujours dans les limites');
  });

  await run('téléphone', { width: 390, height: 800 }, async p => {
    const c = await center(p); const X = c.x, Y = c.y;
    await p.evaluate(() => { for (let i = 0; i < 2; i++) document.querySelector('[data-act="zoom-in"]').click(); });
    // tap
    await p.evaluate(([x, y]) => { window.__ev.length = 0; T.pe('pointerdown', 1, x, y, { pt: 'touch' }); T.up(1, x, y, 'touch'); T.click(); }, [X, Y]);
    const tap = await p.evaluate(() => window.__ev.length); ok(tap === 1, 'tap : sélection (clic transmis), caméra immobile');
    // glisser 1 doigt en mode navigation
    await p.waitForTimeout(450); const a = await vbv(p);
    await p.evaluate(([x, y]) => { window.__ev.length = 0; T.pe('pointerdown', 1, x, y, { pt: 'touch' }); for (let i = 1; i <= 5; i++) window.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerId: 1, pointerType: 'touch', clientX: x - i * 14, clientY: y - i * 6 })); T.up(1, x - 70, y - 30, 'touch'); T.click(); }, [X, Y]);
    const a2 = await vbv(p); ok(a2[0] > a[0] && (await p.evaluate(() => window.__ev.length)) === 0, '1 doigt en navigation : pan sans sélection parasite');
    // pinch
    await p.waitForTimeout(450); const z0 = await p.evaluate(() => window.__jv.view().z); const cw0 = await p.evaluate(([x, y]) => T.world(x, y), [X, Y]);
    await p.evaluate(([x, y]) => { window.__ev.length = 0; T.pe('pointerdown', 1, x - 40, y, { pt: 'touch' }); T.pe('pointerdown', 2, x + 40, y, { pt: 'touch' }); for (let i = 1; i <= 6; i++) { window.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerId: 1, pointerType: 'touch', clientX: x - 40 - i * 8, clientY: y })); window.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerId: 2, pointerType: 'touch', clientX: x + 40 + i * 8, clientY: y })); } }, [X, Y]);
    const z1 = await p.evaluate(() => window.__jv.view().z), cw1 = await p.evaluate(([x, y]) => T.world(x, y), [X, Y]);
    ok(z1 > z0 * 1.3, 'pincement : zoom avant (' + z0.toFixed(2) + ' → ' + z1.toFixed(2) + ')'); ok(Math.hypot(cw0.x - cw1.x, cw0.y - cw1.y) < 3, 'pincement : ancré au centre des deux doigts');
    // pan à deux doigts avec distance constante
    const b0 = await vbv(p);
    await p.evaluate(([x, y]) => { for (let i = 1; i <= 5; i++) { window.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerId: 1, pointerType: 'touch', clientX: x - 88 + i * 10, clientY: y + i * 10 })); window.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerId: 2, pointerType: 'touch', clientX: x + 88 + i * 10, clientY: y + i * 10 })); } }, [X, Y]);
    const b1 = await vbv(p); ok(Math.abs(b1[2] - b0[2]) < 0.01 && (b1[0] !== b0[0] || b1[1] !== b0[1]), 'deux doigts parallèles : pan sans changement de zoom');
    // fin du pinch : un doigt reste, aucun pan ni clic
    const zz = await p.evaluate(() => window.__jv.view().z);
    await p.evaluate(([x, y]) => { T.up(2, x + 138, y + 50, 'touch'); const vb0 = T.vb(); window.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerId: 1, pointerType: 'touch', clientX: x - 20, clientY: y + 90 })); window.__after = [vb0, T.vb()]; T.up(1, x - 20, y + 90, 'touch'); T.click(); }, [X, Y]);
    const aft = await p.evaluate(() => window.__after), zf = await p.evaluate(() => window.__jv.view().z);
    ok(aft[0].every((v, i) => v === aft[1][i]) && Math.abs(zf - zz) < 1e-9 && (await p.evaluate(() => window.__ev.length)) === 0, 'fin de pincement : pas de pan résiduel, pas de zoom brusque, pas de clic fantôme');
    // mode outil : un doigt ne déplace pas, deux doigts naviguent
    await p.waitForTimeout(450); await p.click('[data-act="tool-delete"]');
    const d0 = await vbv(p);
    await p.evaluate(([x, y]) => { window.__ev.length = 0; T.pe('pointerdown', 7, x, y, { pt: 'touch' }); for (let i = 1; i <= 5; i++) window.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerId: 7, pointerType: 'touch', clientX: x - i * 15, clientY: y })); T.up(7, x - 75, y, 'touch'); T.click(); }, [X, Y]);
    const d1 = await vbv(p); ok(d0.every((v, i) => v === d1[i]) && (await p.evaluate(() => window.__ev.length)) === 0, 'mode outil : 1 doigt glissé ne déplace pas la caméra et n’agit pas');
    await p.waitForTimeout(450); await p.evaluate(([x, y]) => { window.__ev.length = 0; T.pe('pointerdown', 8, x - 30, y, { pt: 'touch' }); T.pe('pointerdown', 9, x + 30, y, { pt: 'touch' }); for (let i = 1; i <= 5; i++) { window.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerId: 8, pointerType: 'touch', clientX: x - 30 + i * 10, clientY: y })); window.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerId: 9, pointerType: 'touch', clientX: x + 30 + i * 10, clientY: y })); } T.up(8, x + 20, y, 'touch'); T.up(9, x + 80, y, 'touch'); T.click(); }, [X, Y]);
    const d2 = await vbv(p); ok(d2[0] !== d1[0] && (await p.evaluate(() => window.__ev.length)) === 0, 'mode outil : 2 doigts naviguent sans déclencher l’outil');
    // pointercancel
    await p.evaluate(([x, y]) => { T.pe('pointerdown', 11, x, y, { pt: 'touch' }); T.pe('pointerdown', 12, x + 50, y, { pt: 'touch' }); window.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true, pointerId: 11, pointerType: 'touch' })); window.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true, pointerId: 12, pointerType: 'touch' })); }, [X, Y]);
    ok((await p.evaluate(() => window.__jv.cam.state())).ptrs === 0, 'pointercancel : état de geste réinitialisé');
    // panneaux : la barre d'outils et les fenêtres ne bougent pas la caméra
    const e0 = await vbv(p); await p.click('[data-act="tool-select"]'); await p.tap('.rb[data-act="skills"]'); await p.waitForTimeout(200); await p.keyboard.press('Escape'); const e1 = await vbv(p);
    ok(e0.every((v, i) => v === e1[i]), 'barre d’outils / fenêtre Compétences : la caméra ne bouge pas');
    ok(await p.evaluate(() => getComputedStyle(document.getElementById('garden')).touchAction) === 'none', 'touch-action: none sur la carte (pas de défilement ni zoom natif)');
    // orientation
    await p.setViewportSize({ width: 800, height: 390 }); await p.waitForTimeout(200); const o = await vbv(p); ok(o.every(Number.isFinite) && o[2] > 0, 'rotation d’écran : vue valide');
  });
  await b.close(); console.log(fails ? '\n' + fails + ' ÉCHEC(S)' : '\nTous les tests de navigation passent'); process.exit(fails ? 1 : 0);
})();

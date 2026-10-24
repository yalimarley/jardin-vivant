const { chromium } = require('playwright'); let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('ECHEC:', m); } else console.log('ok  :', m); };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext({ viewport: { width: 1200, height: 800 } }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  const calls = []; let store = null;
  await p.route('https://wbdduslvjqeersekxaxw.supabase.co/**', async r => {
    const req = r.request(), u = req.url(); calls.push(req.method() + ' ' + u.replace('https://wbdduslvjqeersekxaxw.supabase.co', ''));
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'content-type': 'application/json' };
    if (req.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: cors });
    if (u.includes('/auth/v1/token')) return r.fulfill({ status: 200, headers: cors, body: JSON.stringify({ access_token: 'a', refresh_token: 'r', expires_in: 3600, user: { id: 'u1', email: 'a@b.fr' } }) });
    if (u.includes('/auth/v1/signup')) return r.fulfill({ status: 200, headers: cors, body: JSON.stringify({ id: 'u1', email: 'a@b.fr' }) });
    if (u.includes('/rest/v1/saves') && req.method() === 'POST') { store = JSON.parse(req.postData()); return r.fulfill({ status: 201, headers: cors, body: '' }); }
    if (u.includes('/rest/v1/saves')) return r.fulfill({ status: 200, headers: cors, body: JSON.stringify(store ? [{ data: store.data, day: store.day, updated_at: store.updated_at }] : []) });
    return r.fulfill({ status: 200, headers: cors, body: '{}' });
  });
  await p.goto('file://' + process.cwd() + '/jardin-vivant.html'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(400);
  if (await p.$('[data-act="tuto-skip"]')) await p.click('[data-act="tuto-skip"]');
  await p.evaluate(() => document.querySelector('[data-act="menu"]').click()); await p.waitForTimeout(150);
  ok(await p.evaluate(() => /Compte en ligne/.test(document.getElementById('layer').textContent)), 'le menu propose « Compte en ligne »');
  await p.click('[data-act="compte"]'); await p.waitForTimeout(100);
  ok(!!(await p.$('#acc-mail')), 'formulaire de compte affiché');
  await p.fill('#acc-mail', 'a@b'); await p.fill('#acc-pw', 'motdepasse1'); await p.click('[data-act="cloud-in"]'); await p.waitForTimeout(150);
  ok(/e-mail valide/.test(await p.textContent('#acc-msg')), 'e-mail invalide refusé');
  await p.fill('#acc-mail', 'a@b.fr'); await p.fill('#acc-pw', 'court'); await p.click('[data-act="cloud-in"]'); await p.waitForTimeout(150);
  ok(/8 caract/.test(await p.textContent('#acc-msg')), 'mot de passe trop court refusé');
  await p.fill('#acc-pw', 'motdepasse1'); await p.click('[data-act="cloud-in"]'); await p.waitForTimeout(700);
  ok(calls.some(c => c.startsWith('POST /auth/v1/token')), 'connexion appelée');
  ok(store && store.user_id === 'u1' && store.data && store.data.grid, 'la partie est envoyée en ligne à la première connexion');
  ok(/Mon compte|Connecté/.test(await p.evaluate(() => document.getElementById('layer').textContent)), 'écran compte connecté');
  // modifier la partie localement puis reprendre la version en ligne
  const d0 = await p.evaluate(() => window.__jv.state().day); await p.evaluate(() => { window.__jv.state().day += 5; });
  await p.click('[data-act="cloud-pull"]'); await p.waitForTimeout(500);
  ok(await p.evaluate(() => window.__jv.state().day) === d0, 'reprendre la partie en ligne restaure le jour sauvegardé');
  await p.evaluate(() => document.querySelector('[data-act="menu"]').click()); await p.click('[data-act="compte"]'); await p.click('[data-act="cloud-out"]'); await p.waitForTimeout(200);
  ok(await p.evaluate(() => localStorage.getItem('jardin-vivant-auth')) === null, 'déconnexion : session effacée');
  ok(errs.length === 0, 'aucune erreur JS ' + errs.join('|'));
  await b.close(); console.log(fails ? fails + ' ECHEC(S)' : 'Tests compte : tout passe'); process.exit(fails ? 1 : 0);
})();

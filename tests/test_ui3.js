const { chromium } = require('playwright'); const fs=require('fs');
const E=require('./engine.js'); const P=JSON.parse(fs.readFileSync('plants2.json','utf8')); const G=E.make(P);
let fails=0; const ok=(c,m)=>{ if(c) console.log('ok  :',m); else { console.log('ECHEC:',m); fails++; } };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }); const errs=[];
  const p = await (await b.newContext({ viewport:{width:1280,height:1000} })).newPage(); p.on('pageerror',e=>errs.push(e.message));
  const s=G.demo(); s.w=G.weather(s.day); s.mats.paillage=20; s.mats.compost=6;
  await p.addInitScript(v=>{localStorage.setItem('jardin-vivant-proto-v2',v)},JSON.stringify(s));
  await p.goto('file://'+process.cwd()+'/jardin-vivant.html'); await p.waitForTimeout(1200);
  const txt=async sel=>(await p.$eval(sel,e=>e.textContent));
  await p.click('[data-act="skills"]'); await p.waitForTimeout(300);
  ok(/Compétences du jardinier/.test(await txt('#layer .modal')) && /Bouture/.test(await txt('#layer .modal')),'page Compétences');
  await p.screenshot({path:'k_1.png'});
  await p.evaluate(()=>{document.querySelector('#layer .modal').scrollTop=2000}); await p.waitForTimeout(150); await p.screenshot({path:'k_2.png'});
  await p.click('[data-act="craft"][data-k="ortie"]'); await p.waitForTimeout(300);
  ok(/Fabriqué/.test(await txt('#toast')),'fabrication du purin');
  await p.click('[data-act="skill-mode"][data-k="bouture"]'); await p.waitForTimeout(300);
  ok(/Bouture/.test(await txt('#hint')),'mode bouture');
  let done=false; for(const c of await p.$$('#garden .cell')){ const cls=await c.getAttribute('class'); if(/free/.test(cls)) continue; await c.dispatchEvent('click'); await p.waitForTimeout(120); if(/Bouture prélevée/.test(await txt('#toast'))){done=true;break;} }
  ok(done,'bouture prélevée');
  await p.click('[data-act="cancel"]');
  await p.click('[data-act="skills"]'); await p.click('[data-act="skill-mode"][data-k="greffe"]'); await p.waitForTimeout(200);
  let gr=false; for(const c of await p.$$('#garden .cell')){ const cls=await c.getAttribute('class'); if(/free/.test(cls)) continue; await c.dispatchEvent('click'); await p.waitForTimeout(120); if(/greffé/.test(await txt('#toast'))){gr=true;break;} }
  ok(gr,'greffe');
  console.log(errs); ok(!errs.length,'aucune erreur JS'); await b.close(); process.exit(fails?1:0);
})();

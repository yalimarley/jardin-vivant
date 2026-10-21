const { chromium } = require('playwright'); const fs=require('fs');
const E=require('./engine.js'); const P=JSON.parse(fs.readFileSync('plants2.json','utf8')); const G=E.make(P);
let fails=0; const ok=(c,m)=>{ if(c) console.log('ok  :',m); else { console.log('ECHEC:',m); fails++; } };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }); const errs=[];
  const p = await (await b.newContext({ viewport:{width:1280,height:900} })).newPage(); p.on('pageerror',e=>errs.push(e.message));
  const s=G.demo(); s.w=G.weather(s.day); s.mats.ortie=2; s.mats.plan=1; s.mats.savoir=1; s.mats.oya=1; s.mats.cuve=1; s.mats.nichoir=1; s.mats.mycor=1; s.mats.prele=1; s.mats.hamac=1; s.cards[0]=3; s.feves=100;
  await p.addInitScript(v=>{localStorage.setItem('jardin-vivant-proto-v2',v)},JSON.stringify(s));
  await p.goto('file://'+process.cwd()+'/jardin-vivant.html'); await p.waitForTimeout(1200);
  const txt=async sel=>(await p.$eval(sel,e=>e.textContent));
  const pills=await p.$$eval('#res .pill.mat',a=>a.map(x=>x.textContent).join('|'));
  ok(/Purin/.test(pills)&&/Oya/.test(pills)&&/Atelier/.test(pills)&&/Bocaux/.test(pills),'pastilles des nouvelles cartes');
  ok(await p.$('#garden .atl'),'atelier dessiné près de la maison');
  await p.click('#garden .atl',{force:true}); await p.waitForTimeout(300);
  ok(/Atelier de transformation/.test(await txt('#layer .modal')),'clic atelier ouvre la fenêtre');
  const before=await p.$$eval('[data-act="preserve"][data-kind="bocal"]:not([disabled])',a=>a.length);
  await p.click('[data-act="preserve"][data-kind="bocal"]:not([disabled])'); await p.waitForTimeout(300);
  ok(/en conserve/i.test(await txt('#layer .modal')),'mise en bocaux : section « En conserve »');
  await p.click('[data-act="close"]');
  // cible : ortie sur une plante
  await p.click('[data-act="mode-mat"][data-k="ortie"]'); ok(/Touche une plante/.test(await txt('#hint')),'indice purin');
  await p.click('#garden .cell:not(.free):not(.furn) .frame',{force:true}).catch(()=>{}); await p.waitForTimeout(300);
  const cells=await p.$$('#garden .cell');
  let used=false; for(const c of cells){ const cls=await c.getAttribute('class'); if(/free/.test(cls)) continue; await c.dispatchEvent('click'); await p.waitForTimeout(150); if(/Purin versé/.test(await txt('#toast'))){used=true;break;} }
  ok(used,'purin versé sur une plante');
  // nichoir : sur arbre seulement
  await p.click('[data-act="mode-mat"][data-k="nichoir"]'); 
  let nest=false; for(const c of await p.$$('#garden .cell')){ const cls=await c.getAttribute('class'); if(/free/.test(cls)) continue; await c.dispatchEvent('click'); await p.waitForTimeout(120); if(/Nichoir fixé/.test(await txt('#toast'))){nest=true;break;} }
  ok(nest,'nichoir fixé dans un arbre');
  await p.click('[data-act="mode-mat"][data-k="plan"]'); await p.waitForTimeout(300);
  ok(/Plan de guilde/.test(await txt('#layer .modal')),'plan de guilde'); await p.click('[data-act="close"]');
  await p.click('[data-act="mode-mat"][data-k="savoir"]'); await p.waitForTimeout(300);
  ok(/Savoir du jour/.test(await txt('#layer .modal')),'carte savoir'); await p.click('[data-act="close"]');
  await p.click('[data-act="amenager"]'); await p.waitForTimeout(300);
  ok(/Grande serre/.test(await txt('#layer .modal')),'Aménager liste la grande serre'); await p.click('[data-act="close"]');
  await p.click('[data-act="shop"]'); await p.waitForTimeout(300);
  ok(/Boutique/.test(await txt('#layer .modal')) && /Recycler/.test(await txt('#layer .modal')),'boutique ouverte');
  await p.screenshot({path:'n_shop.png'});
  const fev0=await p.$eval('[data-act="shop"]',e=>e.textContent);
  await p.click('[data-act="recycle-all"]'); await p.waitForTimeout(300);
  ok(/Aucune carte en double/.test(await txt('#layer .modal')),'recyclage des doubles');
  const bt2=await p.$('[data-act="shop-buy"]:not([disabled])'); await bt2.click(); await p.waitForTimeout(300);
  ok(/Acheté/.test(await txt('#toast')),'achat à la boutique'); await p.click('[data-act="close"]');
  await p.click('[data-act="mode-mat"][data-k="hamac"]'); await p.click('#garden .cell.free'); await p.waitForTimeout(300);
  ok(await p.$('#garden .cell .frame') && !/Hamac 1/.test(await p.$eval('#res',e=>e.textContent)),'hamac posé');
  await p.screenshot({path:'n_ham.png'});
  ok(!errs.length,'aucune erreur JS '+errs.join(';'));
  console.log(fails?fails+' ÉCHEC(S)':'Tous les tests UI 2 passent'); await b.close();
})();

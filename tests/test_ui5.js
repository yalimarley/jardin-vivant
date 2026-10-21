const { chromium } = require('playwright'); const fs=require('fs');
let fails=0; const ok=(c,m)=>{ if(c) console.log('ok  :',m); else { console.log('ECHEC:',m); fails++; } };
(async()=>{ const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for (const [name,vp,touch] of [['bureau',{width:1280,height:900},false],['téléphone',{width:390,height:844},true]]) {
const ctx=await b.newContext({viewport:vp,deviceScaleFactor:2,isMobile:touch,hasTouch:touch}); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/jardin-vivant.html'); await p.waitForTimeout(900);
const T=async()=>await p.$eval('#tuto',e=>e.hidden?'':e.textContent).catch(()=>'');
const tap=async sel=>{ touch? await p.tap(sel):await p.click(sel); await p.waitForTimeout(350); };
ok(/Bienvenue/.test(await T()),name+' : le tutoriel démarre sur une nouvelle partie');
ok(await p.$('.tuto-ring')!==null,name+' : la cible est entourée');
await p.screenshot({path:`tu_${name}1.png`});
await tap('#today [data-id="booster"]'); await p.waitForTimeout(400);
ok(await p.$eval('#tuto',e=>e.hidden),name+' : le tutoriel se masque derrière une fenêtre');
const rip=await p.$('[data-act="rip"]'); if(rip){ await rip.click(); await p.waitForTimeout(500); } else console.log('pas de bouton rip',await p.$$eval('#layer [data-act]',a=>a.map(x=>x.dataset.act).join(',')));
await tap('[data-act="close"]').catch(()=>{});
const t2=await T(); console.log(name,'après booster :',t2.slice(0,60));
ok(/Pose une plante|Booster|Plante/.test(t2)||/Pose/.test(t2),name+' : passe à l’étape plantation');
await p.screenshot({path:`tu_${name}2.png`});
await tap('[data-act="tuto-skip"]'); ok(await p.$eval('#tuto',e=>e.hidden),name+' : « Passer » ferme le tutoriel');
const saved=await p.evaluate(()=>JSON.parse(localStorage.getItem('jardin-vivant-proto-v2')).tuto); ok(saved&&saved.done,name+' : choix mémorisé');
await p.reload(); await p.waitForTimeout(700); ok(await p.$eval('#tuto',e=>e.hidden),name+' : reste fermé après rechargement');
await p.evaluate(()=>document.querySelector('[data-act="tuto-restart"]').click()); await p.waitForTimeout(300);
ok(!(await p.$eval('#tuto',e=>e.hidden)),name+' : « Revoir le tutoriel » le relance');
ok(!errs.length,name+' : aucune erreur JS '+errs.join('|')); await ctx.close(); }
await b.close(); process.exit(fails?1:0); })();

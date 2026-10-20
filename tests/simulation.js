const E=require('../src/engine.js'),fs=require('fs');const P=JSON.parse(fs.readFileSync('../data/plants2.json','utf8'));const G=E.make(P);
function mul(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function run(profile,seed,days){
  const rnd=mul(seed); const s=G.newGame(); const M=[], log={kg:0,harvests:0,removed:0,boostDays:0,quests:0,meals:0,tankMin:999,planted:0,expand:0,deadSick:0};
  const act=profile.act;
  for(let d=0;d<days;d++){
    const playing=profile.plays(d);
    if(playing){
      if(s.boosterDay<s.day) G.openBooster(s);
      // tâches
      for(let pass=0;pass<2;pass++){ const T=G.buildTasks(s).tasks||[]; for(const t of T){ if(t.act.type==='booster') continue; const r=G.runTask(s,t); if(t.act.type==='harvest'&&r&&r.r){log.kg+=r.r.kg||0;log.harvests++;} } }
      // plantation
      const m=G.dateOf(s.day).m, un=G.unlocked(s);
      for(const pidS of Object.keys(s.cards)){ let pid=+pidS; while(s.cards[pid]>0){ const p=P[pid]; if(!G.sowable(p,m)||!un.has(p.strate)) break;
          const free=[];for(let i=0;i<G.NCELL;i++) if(!s.grid[i]&&G.isActive(s,i)) free.push(i); if(!free.length) break;
          let cell;
          if(profile.place==='random') cell=free[Math.floor(rnd()*free.length)];
          else if(profile.place==='compact') cell=free[0];
          else { let best=-1e9,bi=free[0]; const cand=free.length>40?free.filter(()=>rnd()<40/free.length):free; for(const i of cand){ s.grid[i]={pid,g:0,water:80,health:100,stress:0,stage:'graine'}; const gl=G.guilds(s); const sy=G.synergy(s,i); const sc=gl.auto*6+gl.n*3+sy.score*1.5+rnd()*.5; s.grid[i]=null; if(sc>best){best=sc;bi=i;} } cell=bi; }
          const r=G.plant(s,cell,pid); if(!r.ok) break; log.planted++; } }
      // cuisine
      if(s.cookedDay!==s.day){ const tot=G.stockTotals(s); const pids=Object.keys(tot).filter(k=>tot[k]>.05).slice(0,6).map(Number); if(pids.length){ const r=G.cook(s,pids); if(r.ok) log.meals++; } }
      if(G.canExpand(s).ok){ G.expand(s); log.expand++; }
      for(const q of G.quests(s)) if(q.done&&!q.claimed){ if(G.claimQuest(s,q.id).ok) log.quests++; }
    }
    const before=s.grid.filter(c=>c&&!c.treille).length;
    G.nextDay(s,false);
    const after=s.grid.filter(c=>c&&!c.treille).length; if(after<before) log.removed+=before-after;
    if(s.boostUntil>=s.day) log.boostDays++; log.tankMin=Math.min(log.tankMin,s.tank);
    if((d+1)%30===0){ const st=G.stats(s); const cs=s.grid.filter(c=>c&&!c.treille); const h=cs.reduce((a,c)=>a+c.health,0)/Math.max(1,cs.length);
      M.push({d:d+1,plants:cs.length,sp:st.species,auto:st.autonomy,biodiv:st.biodiv,soil:st.soil,gl:G.guilds(s).n,ga:G.guilds(s).auto,sick:cs.filter(c=>c.sick).length,h:Math.round(h),joy:Math.round(s.family.reduce((a,f)=>a+f.joy,0)/s.family.length),kg:Math.round(log.kg*10)/10}); }
  }
  return {M,log,s};
}
const profiles={
 'A assidu+guildes':{plays:d=>true,place:'guild'},
 'B assidu compact':{plays:d=>true,place:'compact'},
 'C assidu aléatoire':{plays:d=>true,place:'random'},
 'D 1 jour sur 4 +guildes':{plays:d=>d%4===0,place:'guild'},
 'E abandon après 10 j':{plays:d=>d<10,place:'guild'}
};
const days=+process.argv[2]||365, seeds=[1,2,3];
for(const [n,pr] of Object.entries(profiles)){
  const R=seeds.map(sd=>run(pr,sd,days));
  console.log('\n== '+n+' ('+seeds.length+' parties, '+days+' j)');
  const pts=R[0].M.map((_,k)=>k);
  const avg=(k,f)=>Math.round(R.reduce((a,r)=>a+(r.M[k]?r.M[k][f]:0),0)/R.length*10)/10;
  console.log('jour  plantes esp  auto%  biodiv sol  guildes(auto) malades santé joie  kg');
  [2,5,8,11].forEach(k=>{ if(!R[0].M[k]) return; console.log(String(R[0].M[k].d).padEnd(5),String(avg(k,'plants')).padEnd(7),String(avg(k,'sp')).padEnd(4),String(avg(k,'auto')).padEnd(6),String(avg(k,'biodiv')).padEnd(6),String(avg(k,'soil')).padEnd(4),(avg(k,'gl')+'('+avg(k,'ga')+')').padEnd(13),String(avg(k,'sick')).padEnd(7),String(avg(k,'h')).padEnd(5),String(avg(k,'joy')).padEnd(5),avg(k,'kg')); });
  const L=R.map(r=>r.log), a=f=>Math.round(L.reduce((x,l)=>x+l[f],0)/L.length*10)/10;
  console.log('récoltes',a('harvests'),'repas',a('meals'),'plantées',a('planted'),'perdues',a('removed'),'agrandissements',a('expand'),'objectifs',a('quests'),'jours de boost',a('boostDays'),'eau min',a('tankMin'));
}

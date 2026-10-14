// Synthetic teaching model, not IceCube reconstruction software or measured data.
export function rng(seed){let n=seed>>>0;return()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296);}
export const SENSORS=Array.from({length:80},(_,i)=>({id:i+1,p:[(Math.floor(i/5)%4-1.5)*85,(i%5-2)*65,(Math.floor(i/20)-1.5)*85]}));
export function reconstruct(hits){
 const total=hits.reduce((n,h)=>n+h.q,0),c=[0,0,0],cov=Array.from({length:3},()=>[0,0,0]);
 for(const h of hits)for(let i=0;i<3;i++)c[i]+=h.p[i]*h.q/total;
 for(const h of hits)for(let i=0;i<3;i++)for(let j=0;j<3;j++)cov[i][j]+=h.q*(h.p[i]-c[i])*(h.p[j]-c[j])/total;
 let d=[.61,.53,.39];for(let k=0;k<36;k++){const n=cov.map(row=>row.reduce((s,v,j)=>s+v*d[j],0)),l=Math.hypot(...n)||1;d=n.map(v=>v/l);}
 const ordered=[...hits].sort((a,b)=>a.ns-b.ns),delta=ordered.at(-1).p.map((v,i)=>v-ordered[0].p[i]);if(delta.reduce((s,v,i)=>s+v*d[i],0)<0)d=d.map(v=>-v);
 let lo=Infinity,hi=-Infinity,error=0;for(const h of hits){const p=h.p.map((v,i)=>v-c[i]),along=p.reduce((n,v,i)=>n+v*d[i],0);lo=Math.min(lo,along);hi=Math.max(hi,along);error+=h.q*Math.max(0,p.reduce((n,v)=>n+v*v,0)-along*along);}
 const trace=cov[0][0]+cov[1][1]+cov[2][2],lambda=d.reduce((s,v,i)=>s+v*cov[i].reduce((n,a,j)=>n+a*d[j],0),0);
 return {center:c,direction:d,start:c.map((v,i)=>v+d[i]*lo),end:c.map((v,i)=>v+d[i]*hi),residual:Math.sqrt(error/total),linearity:lambda/(trace||1),method:'Eje principal ponderado; sentido temporal orientativo'};
}
export function makeEvent(seed=Date.now()>>>0,quality={},serial=1){
 const r=rng(seed),normal=()=>Math.sqrt(-2*Math.log(Math.max(.00001,r())))*Math.cos(2*Math.PI*r());
 const kind=r()<.68?'track':'cascade',az=r()*Math.PI*2,dy=r()*1.8-.9,dxz=Math.sqrt(1-dy*dy),dir=[Math.cos(az)*dxz,dy,Math.sin(az)*dxz],origin=[(r()-.5)*110,(r()-.5)*100,(r()-.5)*110];
 const snap={sync:Math.abs(quality.sync??1),jitter:quality.jitter??1.8,noise:quality.noise??0,efficiency:quality.efficiency??1};
 const spread=Math.hypot(snap.sync,snap.jitter)+snap.noise*7;
 const candidates=SENSORS.map(sensor=>{const delta=sensor.p.map((v,i)=>v-origin[i]),along=delta.reduce((n,v,i)=>n+v*dir[i],0),s=kind==='track'?Math.max(-200,Math.min(200,along)):0,dist=Math.hypot(...delta.map((v,i)=>v-s*dir[i])),charge=(kind==='track'?22:36)*Math.exp(-dist/(kind==='track'?57:64))*(.76+r()*.48)*snap.efficiency;
  // Light emitted along a charged-particle track, propagating more slowly in ice.
  const time=s/.2998+dist/.225+Math.max(0,normal())*dist*.12+normal()*spread;
  return {id:sensor.id,p:[...sensor.p],q:Math.max(.1,Math.round(charge*10)/10),ns:Math.round(time),rank:charge+r()*.7};});
 const count=12+Math.floor(r()*12),hits=candidates.sort((a,b)=>b.rank-a.rank).slice(0,count).map(({rank,...h})=>h),min=Math.min(...hits.map(h=>h.ns));
 for(const h of hits)h.ns-=min;hits.sort((a,b)=>a.ns-b.ns);
 const fit=reconstruct(hits),confidence=Math.max(.12,Math.min(.96,1-spread/48-(kind==='cascade'?.25:.06)-(1-fit.linearity)*.35));
 return {id:`UX-${String(serial).padStart(4,'0')}-${(seed%9000+1000)}`,seed,serial,kind,hits,fit,quality:snap,confidence,uncertainty:Math.round((kind==='track'?8:26)+spread*1.2+(1-fit.linearity)*30),charge:Math.round(hits.reduce((n,h)=>n+h.q,0)*10)/10,duration:Math.max(...hits.map(h=>h.ns)),sensorCount:SENSORS.length,review:0,reported:false};
}
export function acquisitionTrial(c,noise=0){
 const retained=Math.max(.04,Math.min(.99,1-(c.multiplicity-2)*.115-Math.max(0,1100-c.windowNs)/1300)),rate=+(Math.pow(2,6-c.multiplicity)*(c.windowNs/1000)**2*(c.notch?1:1.45)*(1+noise*.45)).toFixed(1);
 return {retained,rate,accepted:retained>=.53&&rate>=1&&rate<=14&&c.windowNs>=800&&c.windowNs<=1800,multiplicity:c.multiplicity,windowNs:c.windowNs,notch:c.notch};
}
export const HISTORY=[
 {id:'A',name:'A / RELOJ SIN CORREGIR',jitter:19.6,noise:.7,temp:-31.4,good:false,note:'Sesgo de tiempo conocido. No sirve como referencia.'},
 {id:'B',name:'B / REFERENCIA ESTABLE',jitter:1.7,noise:.4,temp:-31.5,good:true,note:'Pulsos y reloj verificados. Comparación válida.'},
 {id:'C',name:'C / PRUEBA CON CARGA',jitter:8.9,noise:4.2,temp:-31.3,good:false,note:'Interferencia documentada. Útil para estudiar fondos.'}
];

// A small, persistent station simulation. All readings are fictional demonstration data.
export const SAVE_KEY='umbral-v2-turno';
const fresh=()=>({version:2,phase:0,time:0,controlTime:0,visited:[],power:true,fault:false,diagnosed:false,moduleSeated:false,repaired:false,calibrated:false,benchTest:false,calibration:null,event:null,review:0,armed:false,observed:false,flash:null,job:null,log:[],position:null});
function rng(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
export function reconstruct(hits){
 const total=hits.reduce((n,h)=>n+h.q,0),c=[0,0,0],cov=Array.from({length:3},()=>[0,0,0]);
 for(const h of hits)for(let i=0;i<3;i++)c[i]+=h.p[i]*h.q/total;
 for(const h of hits)for(let i=0;i<3;i++)for(let j=0;j<3;j++)cov[i][j]+=h.q*(h.p[i]-c[i])*(h.p[j]-c[j])/total;
 let d=[.6,.5,.4];for(let k=0;k<24;k++){const n=cov.map(row=>row.reduce((sum,v,j)=>sum+v*d[j],0)),l=Math.hypot(...n)||1;d=n.map(v=>v/l);}
 const ordered=[...hits].sort((a,b)=>a.ns-b.ns),delta=ordered.at(-1).p.map((v,i)=>v-ordered[0].p[i]);if(delta.reduce((s,v,i)=>s+v*d[i],0)<0)d=d.map(v=>-v);
 let lo=Infinity,hi=-Infinity,error=0;
 for(const h of hits){const p=h.p.map((v,i)=>v-c[i]),along=p.reduce((n,v,i)=>n+v*d[i],0);lo=Math.min(lo,along);hi=Math.max(hi,along);error+=h.q*Math.max(0,p.reduce((n,v)=>n+v*v,0)-along*along);}
 return {center:c,direction:d,start:c.map((v,i)=>v+d[i]*lo),end:c.map((v,i)=>v+d[i]*hi),residual:Math.sqrt(error/total),method:'Eje principal ponderado; orden temporal orientativo'};
}
export function makeEvent(seed=Date.now()>>>0){
 const r=rng(seed),hits=[];
 for(let i=0;i<12;i++){const k=i/11;hits.push({id:11+i,p:[-145+k*300+(r()-.5)*13,-170+k*325+(r()-.5)*16,-110+k*225+(r()-.5)*17],ns:Math.round(k*1630+r()*34),q:Math.round((1+Math.sin(k*Math.PI)*5+r()*2)*10)/10});}
 return {id:'UX-'+(seed%89999+10000),seed,hits,fit:reconstruct(hits),charge:Math.round(hits.reduce((n,h)=>n+h.q,0)*10)/10,duration:Math.max(...hits.map(h=>h.ns))-Math.min(...hits.map(h=>h.ns))};
}
export class Missions{
 constructor(saved=null,onNotice=()=>{}){
  this.state=fresh();this.onNotice=onNotice;this.revision=0;
  if(saved?.version===2&&Number.isInteger(saved.phase)&&saved.phase>=0&&saved.phase<=6){
   const d=this.state;for(const k of ['power','fault','diagnosed','moduleSeated','repaired','calibrated','benchTest','armed','observed'])if(typeof saved[k]==='boolean')d[k]=saved[k];
   d.phase=saved.phase;d.time=Math.max(0,Number(saved.time)||0);d.controlTime=Math.max(0,Number(saved.controlTime)||0);d.review=(Number(saved.review)||0)&7;
   d.visited=Array.isArray(saved.visited)?saved.visited.filter(v=>typeof v==='string').slice(0,20):[];d.log=Array.isArray(saved.log)?saved.log.filter(v=>typeof v==='string').slice(-28):[];
   if(saved.event&&Number.isFinite(saved.event.seed))d.event=makeEvent(saved.event.seed);
   if(saved.calibration&&Number.isFinite(saved.calibration.responses))d.calibration=saved.calibration;
   if(saved.job&&['reseat','calibrate','bench'].includes(saved.job.kind)&&Number.isFinite(saved.job.remaining))d.job={...saved.job,remaining:Math.max(.1,Math.min(7,saved.job.remaining))};
   if(saved.position&&['x','z','yaw','pitch'].every(k=>Number.isFinite(saved.position[k])))d.position=saved.position;
   // A flash never resumes mid-frame after a tab reload.
   d.flash=null;
  }
 }
 note(text,quiet=false){const s=this.state;s.log.push(`${String(Math.floor(s.time/60)).padStart(2,'0')}:${String(Math.floor(s.time%60)).padStart(2,'0')}  ${text}`);s.log=s.log.slice(-28);this.revision++;if(!quiet)this.onNotice(text);return text;}
 tick(dt,zone,canObserve=false){
  const s=this.state;s.time+=dt;
  if(zone&&!s.visited.includes(zone)){s.visited.push(zone);this.revision++;}
  if(s.visited.includes('3')&&s.phase===0){s.controlTime+=dt;if(s.controlTime>=12){s.fault=true;s.phase=1;this.note('CONTROL · Pérdida de sincronía en el canal 17.');}}
  if(s.job){s.job.remaining-=dt;if(s.job.remaining<=0){const kind=s.job.kind;s.job=null;
   if(kind==='reseat'){s.moduleSeated=true;this.note('Módulo 17 reajustado. Restablece alimentación.');}
   if(kind==='bench'){s.benchTest=true;this.note('Banco: módulo de reserva estable.');}
   if(kind==='calibrate'){
    const ok=s.repaired&&s.power;
    s.calibration={responses:s.power?(s.fault?6:10):0,pulses:10,jitter:!s.power?null:s.fault?48.7:1.8,passed:ok};
    if(ok){s.calibrated=true;s.phase=Math.max(s.phase,4);if(!s.event)s.event=makeEvent();this.note('CALIBRACIÓN válida. Candidato disponible en Análisis.');}
    else this.note(!s.power?'Sin respuesta. El enlace no tiene alimentación.':'Prueba registrada. Completa el diagnóstico y reparación.');
   }
  }}
  if(s.armed&&!s.observed&&!s.flash&&canObserve){this.observeWait=(this.observeWait||0)+dt;if(this.observeWait>1.6){s.flash={elapsed:0,u:Number.isFinite(canObserve.u)?canObserve.u:.29+Math.random()*.42,v:Number.isFinite(canObserve.v)?canObserve.v:.34+Math.random()*.28};this.revision++;}}
  else if(!canObserve)this.observeWait=0;
  if(s.flash){s.flash.elapsed+=dt;if(s.flash.elapsed>=.17){s.flash=null;s.armed=false;s.observed=true;s.phase=6;this.note('Registro óptico archivado. Consulta la explicación en la consola.',true);}}
 }
 act(action){
  const s=this.state;if(s.job)return 'Procedimiento en curso. Espera la lectura final.';
  switch(action){
   case 'diagnose':
    if(!s.fault&&!s.repaired)return 'Canales nominales. Adquisición en vigilancia.';
    if(s.repaired)return 'Enlace 17 estable. Continúa con la calibración.';
    s.diagnosed=true;s.phase=2;return this.note('Fallo localizado: contacto del receptor 17. Reparar en Servidores.');
   case 'isolate':
    if(!s.diagnosed)return 'Primero identifica el fallo en la terminal de Control.';
    if(s.repaired)return 'Enlace reparado. No requiere otra intervención.';
    if(!s.power)return 'Alimentación ya aislada.';
    s.power=false;return this.note('Canal 17 aislado. El módulo se puede reajustar.');
   case 'reseat':
    if(!s.diagnosed)return 'Consulta primero el diagnóstico de Control.';
    if(s.power)return 'INTERBLOQUEO: corta la alimentación antes de intervenir.';
    if(s.moduleSeated)return 'Conector asegurado. Restablece alimentación.';
    s.job={kind:'reseat',remaining:3.5,total:3.5};this.revision++;return 'Reajustando conector y comprobando continuidad…';
   case 'restore':
    if(!s.diagnosed)return 'No hay orden de mantenimiento.';
    if(s.power)return 'Alimentación presente.';
    s.power=true;s.repaired=s.moduleSeated;s.fault=!s.repaired;
    if(s.repaired){s.phase=3;return this.note('Enlace restablecido. Ejecuta la prueba en Calibración.');}
    return this.note('Fallo persistente. Aísla y reajusta el conector.');
   case 'calibrate':s.job={kind:'calibrate',remaining:6.4,total:6.4};this.revision++;return 'Secuencia de diez pulsos conocida. Adquiriendo respuestas…';
   case 'bench':s.job={kind:'bench',remaining:2.8,total:2.8};this.revision++;return 'Comprobando continuidad del módulo de reserva…';
   case 'readings':case 'hits':case 'fit':
    if(!s.event||!s.calibrated)return 'Sin candidato validado. Completa la calibración.';
    s.review|={readings:1,hits:2,fit:4}[action];this.revision++;return action==='fit'?'Eje calculado a partir de las posiciones y cargas registradas.':'Lectura consultada.';
   case 'send':
    if(!s.event)return 'No hay un evento disponible.';
    if(s.review!==7)return 'Revisa lecturas, sensores activados y trayectoria antes de enviar.';
    s.phase=Math.max(5,s.phase);return this.note('Registro enviado a Observación. Consulta la consola junto al cristal.');
   case 'observe':
    if(s.phase<5)return 'Espera el registro revisado desde Análisis.';
    if(s.observed)return 'Registro archivado. Abre INFORME para consultar el evento.';
    s.armed=true;this.observeWait=0;this.revision++;return this.note('Registro preparado. Acércate al cristal y mira hacia el hielo.');
   default:return 'Orden no reconocida.';
  }
 }
 objective(){const s=this.state;return [
  'PRIMER TURNO · Explora y acude a Control (03).',
  'CONTROL · Consulta la advertencia del canal 17.',
  !s.power?(s.moduleSeated?'SERVIDORES · Restablece la alimentación.':'SERVIDORES · Reajusta el módulo aislado.'):'SERVIDORES · Aísla el canal 17 para repararlo.',
  'CALIBRACIÓN · Ejecuta diez pulsos de prueba.',
  'ANÁLISIS · Revisa lecturas, sensores y trayectoria.',
  s.armed?'OBSERVACIÓN · Acércate al cristal.':'OBSERVACIÓN · Consulta el registro enviado.',
  'TURNO REGISTRADO · Informe disponible en las consolas.'
 ][s.phase];}
 export(position){return {...this.state,position:position?{x:position.x,z:position.z,yaw:position.yaw,pitch:position.pitch}:this.state.position};}
}

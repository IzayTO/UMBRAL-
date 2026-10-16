import {makeEvent,rng,acquisitionTrial,HISTORY} from './science.js?v=3.1';
import {directorState,directorTick,FAULTS,fault,clearFault,detectorCondition} from './director.js?v=3.1';
export {makeEvent,reconstruct} from './science.js?v=3.1';
export const SAVE_KEY='umbral-v3-turno';
export const MISSION_NAMES=['PRIMER TURNO','RECONOCIMIENTO','LÍNEA SIN RESPUESTA','REPARACIÓN DEL ENLACE','SINCRONIZACIÓN','CALIBRACIÓN LUMINOSA','SELECCIÓN DE SEÑALES','ARCHIVO HISTÓRICO','EVENTO INUSUAL','PREPARAR LOS DATOS','OBSERVACIÓN PROFUNDA','RECONSTRUCCIÓN','ESTACIÓN EN SERVICIO'];
const controls=()=>({syncTrim:0,voltageTrim:0,load:false,multiplicity:2,windowNs:2200,notch:false,fanTrim:5,relayPower:true,commChannel:1,pipeFlow:.8,tempTrim:0,tempReference:false,lampTrim:5,pulseLevel:5,moduleTravel:0,pulseConnected:false,shutterClosed:false,paperTravel:0,spareSeated:false,archiveIndex:1});
const fresh=()=>{const seed=(Date.now()^Math.floor(Math.random()*4294967295))>>>0;return {version:3,mission:1,phase:0,time:0,seed,visited:[],completed:[],briefed:false,mapOwned:false,supplyChecked:false,supervision:false,warningAt:null,power:true,fault:false,diagnosed:false,connectionChecked:false,moduleSeated:false,repaired:false,syncOffset:11.5,baseVoltage:24,tempOffset:0,sync:null,calibrated:false,calibration:null,acquisition:null,trial:null,benchTest:false,historyViewed:[],historical:null,candidateAt:null,event:null,events:[],serial:0,healthChecked:false,preliminary:false,records:0,bundleReady:false,analysisUnlocked:false,armed:false,observed:false,flash:null,review:0,report:null,job:null,controls:controls(),director:directorState(seed^0xa36129),log:[],position:null,nextAcquisition:0};};
const LIMITS={syncTrim:[-30,30,.5],voltageTrim:[-2,2,.1],multiplicity:[2,8,1],windowNs:[400,2400,100],fanTrim:[0,10,.25],commChannel:[1,6,1],pipeFlow:[0,1,.05],tempTrim:[-8,8,.25],lampTrim:[0,10,.25],pulseLevel:[1,10,1],moduleTravel:[0,1,.05],paperTravel:[0,1,.05],archiveIndex:[1,3,1]};
export class Missions{
 constructor(saved=null,onNotice=()=>{}){
  this.state=fresh();this.onNotice=onNotice;this.revision=0;this.observeWait=0;
  if(saved?.version===3&&Number.isInteger(saved.mission)&&saved.mission>=1&&saved.mission<=13&&Number.isFinite(saved.time)){
   const defaults=this.state;this.state={...defaults,...JSON.parse(JSON.stringify(saved)),controls:{...defaults.controls,...saved.controls},director:{...defaults.director,...saved.director}};
   const s=this.state;s.flash=null;s.time=Math.max(0,s.time);s.events=(s.events||[]).slice(-12);s.log=(s.log||[]).slice(-50);s.visited=s.visited.filter(v=>typeof v==='string');
   for(const [k,[lo,hi]]of Object.entries(LIMITS))s.controls[k]=Math.max(lo,Math.min(hi,Number.isFinite(s.controls[k])?s.controls[k]:defaults.controls[k]));
   if(saved.controls?.pulseConnected===undefined&&s.calibration?.passed){s.controls.pulseConnected=true;s.controls.shutterClosed=true;}
   if(saved.controls?.moduleTravel===undefined&&s.moduleSeated)s.controls.moduleTravel=1;
   if(s.job&&!['reseat','bench','sync','calibrate','acquire','report'].includes(s.job.kind))s.job=null;
   if(s.position&&!['x','z','yaw','pitch'].every(k=>Number.isFinite(s.position[k])))s.position=null;
  }
 }
 note(text,quiet=false){const s=this.state;s.log.push(`${String(Math.floor(s.time/60)).padStart(2,'0')}:${String(Math.floor(s.time%60)).padStart(2,'0')}  ${text}`);s.log=s.log.slice(-50);this.revision++;if(!quiet)this.onNotice(text);return text;}
 next(n){const s=this.state;if(s.mission>=n)return;s.completed.push({mission:s.mission,time:s.time});s.mission=n;s.phase=n-1;this.revision++;this.note(`${String(n).padStart(2,'0')} / ${MISSION_NAMES[n-1]}`,n===13);}
 progress(){const s=this.state;if(s.mission===1&&s.briefed&&s.mapOwned)this.next(2);if(s.mission===2&&['2','3','5'].every(z=>s.visited.includes(z))&&s.supplyChecked&&s.supervision){this.next(3);s.warningAt=s.time+23;}}
 condition(){return detectorCondition(this.state);}
 start(kind,total,extra={}){this.state.job={kind,remaining:total,total,...extra};this.revision++;return 'Procedimiento iniciado. Espera la lectura final.';}
 addEvent(){const s=this.state,c=this.condition();s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;const e=makeEvent(s.seed,c,++s.serial);e.recordedAt=s.time;s.events.push(e);if(s.events.length>12){const removable=s.events.findIndex(x=>x.id!==s.event?.id);s.events.splice(removable,1);}if(!s.event){s.event=e;s.review=e.review;}this.revision++;return e;}
 tick(dt,zone,canObserve=false,critical=false){
  const s=this.state;s.time+=dt;if(zone&&!s.visited.includes(zone)){s.visited.push(zone);this.revision++;}this.progress();
  if(s.mission===3&&!s.fault&&s.time>=s.warningAt){s.fault=true;this.note('CONTROL · Lecturas incompletas en la línea 17.');}
  directorTick(s,dt,zone,critical);
  if(s.job){s.job.remaining-=dt;if(s.job.remaining<=0){const job=s.job;s.job=null;this.finish(job);}}
  if(s.mission===9&&!s.event&&s.candidateAt!==null&&s.time>=s.candidateAt&&s.power&&s.repaired){this.addEvent();this.note('CONTROL · Coincidencia inusual registrada. Comprobar instrumentos.');}
  if(s.mission===13&&s.supervision&&s.acquisition&&s.time>=s.nextAcquisition){s.nextAcquisition=s.time+(65+(s.seed%181))/Math.max(.4,s.acquisition.retained);if(this.condition().efficiency>.65){this.addEvent();this.note('Adquisición: nuevo candidato en la memoria de Análisis.',true);}}
  if(s.armed&&!s.observed&&!s.flash&&canObserve){this.observeWait+=dt;if(this.observeWait>=1.6){s.flash={elapsed:0,u:canObserve.u??.5,v:canObserve.v??.5};this.revision++;}}else if(!canObserve)this.observeWait=0;
  if(s.flash){s.flash.elapsed+=dt;if(s.flash.elapsed>=1.2){s.flash=null;s.armed=false;s.observed=true;if(s.mission===11)this.next(12);this.note('Consulta óptica registrada. Completa la reconstrucción en Análisis.',true);}}
 }
 finish(job){const s=this.state,c=this.condition();
  if(job.kind==='reseat'){s.moduleSeated=true;this.note('Módulo asentado. Comprueba el cierre y restablece alimentación.');}
  if(job.kind==='bench'){s.benchTest=true;this.note('Reserva comprobada: 0.3 ohm. Repuesto disponible.');}
  if(job.kind==='sync'){
   const residual=c.sync,passed=s.repaired&&s.power&&residual<=1.5;s.sync={time:s.time,trim:s.controls.syncTrim,residual,passed};
   if(passed){const e=fault(s,'drift');if(e){s.syncOffset+=e.offset;clearFault(s,'drift');}if(s.mission===5)this.next(6);this.note(`Sincronía verificada: ${residual.toFixed(1)} ns residuales.`);}else this.note(`Desfase ${residual.toFixed(1)} ns. Superpone ambos pulsos con la perilla.`);
  }
  if(job.kind==='calibrate'){
   const r=rng(s.seed+Math.round(s.time*100)),level=s.controls.pulseLevel,responses=s.power?(s.repaired?(level<3?level===1?5:8:10):6):0;
   const spread=1.25+c.noise*6+Math.abs(c.voltage-24)*2,signed=s.syncOffset+s.controls.syncTrim+(fault(s,'drift')?.offset||0);
   const times=Array.from({length:10},(_,i)=>i<responses?+(240+signed+(r()-.5)*2*Math.sqrt(3)*spread).toFixed(2):null);
   const jitter=responses?+Math.sqrt(times.filter(v=>v!==null).reduce((n,v)=>n+(v-240)**2,0)/responses).toFixed(2):null;
   const passed=s.repaired&&s.sync?.passed&&responses===10&&jitter<3&&level>=3&&level<=7;

   s.calibration={time:s.time,pulses:10,responses,jitter,passed,times,level:s.controls.pulseLevel};s.calibrated=passed;
   if(passed){if(s.mission===6)this.next(7);this.note('Diez respuestas válidas. Calibración guardada.');}else this.note('Prueba no válida. Revisa enlace, desfase y nivel LED (3–7).');
  }
  if(job.kind==='acquire'){s.trial=acquisitionTrial(s.controls,c.noise);if(s.controls.notch)clearFault(s,'noise');this.note(s.trial.accepted?'Prueba estable. Acepta los criterios en el panel.':s.trial.retained<.53?'Criterio demasiado estricto: se pierden candidatos.':'Exceso de registros. Aumenta coincidencias o reduce ventana.');}
  if(job.kind==='report'){
   if(!s.event||s.event.review!==7)return;const e=s.event;e.reported=true;s.report={eventId:e.id,time:s.time,quality:e.confidence,summary:e.kind==='track'?'Candidato alargado. Orientación aproximada.':'Candidato compacto. Dirección poco determinada.'};
   if(s.mission===12){this.next(13);s.nextAcquisition=s.time+95;}this.note('INFORME REGISTRADO · Primer turno completo. La estación continúa en servicio.');
  }
 }
 adjust(key,value){const s=this.state,l=LIMITS[key];if(!l||s.job)return false;if(key==='moduleTravel'&&(s.power||!s.connectionChecked))return false;const [lo,hi,step]=l,v=Math.round(Math.max(lo,Math.min(hi,value))/step)*step;if(v===s.controls[key])return true;s.controls[key]=+v.toFixed(3);
  if(key==='syncTrim'){if(s.sync)s.sync.passed=false;s.calibrated=false;if(s.calibration)s.calibration.passed=false;}if(['multiplicity','windowNs'].includes(key))s.trial=null;this.revision++;return true;
 }
 act(action,context={}){
  const s=this.state,c=s.controls,physical=context.physical===true;
  if(s.job)return 'Procedimiento en curso. Los mandos quedan enclavados hasta terminar.';
  const physicalOnly=['briefing','isolate','inspectLink','reseat','restore','syncTest','loadToggle','notchToggle','acqTest','acqAccept','relayPower','relayReplace','commReset','tempReference','printerFeed','pulseConnect','shutterToggle','spareConnect','bench','archiveRead','archiveSelect'];
  if((physicalOnly.includes(action)||action.startsWith('verify:')||action.startsWith('inspect:'))&&!physical)return 'Opera el equipo físico de esta sala.';
  if(action==='briefing'){s.briefed=true;this.note('Turno recibido. Recoge el plano de la pared en Acceso.');this.progress();return 'WASD / ratón o joystick / arrastre. E para operar. Busca el plano físico.';}
  if(action==='pickupMap'){if(s.mapOwned)return 'Ya llevas el plano.';s.mapOwned=true;this.note('Plano recogido. M / botón de papel para consultarlo.');this.progress();return 'Plano de la instalación guardado.';}
  if(action==='supervision'){if(s.mission<2)return 'Recibe el turno y recoge el plano en Acceso.';s.supervision=true;this.progress();return this.note('Supervisión general activa. Revisa Taller, Control y Calibración.');}
  if(action==='diagnose'){if(!s.fault)return s.repaired?'Línea 17 restablecida.':'La supervisión aún no registra pérdida de datos.';s.diagnosed=true;if(s.mission===3)this.next(4);return this.note('Canal 17: contacto inestable del receptor. Panel ENLACE en Servidores.');}
  if(action==='isolate'){if(!s.diagnosed)return 'Primero identifica la línea en Control.';if(s.repaired)return 'Enlace reparado; intervención principal cerrada.';s.power=false;s.connectionChecked=false;s.controls.moduleTravel=0;this.revision++;return this.note('Alimentación aislada. Ahora inspecciona las conexiones.');}
  if(action==='inspectLink'){if(s.power)return 'INTERBLOQUEO: aísla alimentación.';s.connectionChecked=true;this.revision++;return 'Pestaña suelta en el conector 17. Reasienta el módulo.';}
  if(action==='reseat'){if(s.power)return 'INTERBLOQUEO: no se manipula un receptor alimentado.';if(!s.connectionChecked)return 'Inspecciona primero las conexiones aisladas.';if(s.controls.moduleTravel<.95)return 'Desliza la corredera del módulo hasta el tope antes de fijarlo.';return this.start('reseat',3.5);}
  if(action==='restore'){if(!s.diagnosed)return 'No hay intervención autorizada.';s.power=true;s.repaired=s.moduleSeated&&s.connectionChecked;s.fault=!s.repaired;this.revision++;if(s.repaired){if(s.mission===4)this.next(5);return this.note('Enlace estable. Ajusta el reloj en el osciloscopio de Calibración.');}return 'Fallo persistente. Aísla, inspecciona y reasienta en ese orden.';}
  if(action==='syncTest'){if(!s.repaired)return 'Se necesita un enlace reparado.';return this.start('sync',2.5);}
  if(action==='pulseConnect'){c.pulseConnected=!c.pulseConnected;this.revision++;return c.pulseConnected?'Conector encajado en el emisor.':'Emisor desconectado.';}
  if(action==='shutterToggle'){c.shutterClosed=!c.shutterClosed;this.revision++;return c.shutterClosed?'Cámara óptica cerrada.':'Obturador abierto. La prueba queda interbloqueada.';}
  if(action==='calibrate'){if(s.mission<6||!s.sync?.passed)return 'Ajusta y verifica primero el osciloscopio.';if(!c.pulseConnected||!c.shutterClosed)return 'Banco óptico: encaja el conector y cierra el obturador antes de emitir.';return this.start('calibrate',6.4);}
  if(action==='spareConnect'){c.spareSeated=!c.spareSeated;s.benchTest=false;this.revision++;return c.spareSeated?'Repuesto encajado. Pulsa MEDIR.':'Zócalo abierto.';}
  if(action==='bench'){if(!c.spareSeated)return 'Inserta el repuesto en el zócalo del banco.';return this.start('bench',2.8);}
  if(action==='loadToggle'){c.load=!c.load;this.revision++;return c.load?'Carga de prueba conectada.':'Carga auxiliar desconectada.';}
  if(action==='notchToggle'){c.notch=!c.notch;s.trial=null;this.revision++;return c.notch?'Filtro de interferencia de red activo.':'Filtro de red desconectado.';}
  if(action==='acqTest'){if(!s.calibration?.passed)return 'Necesitas una prueba luminosa válida.';return this.start('acquire',4);}
  if(action==='acqAccept'){if(!s.trial?.accepted)return 'Ejecuta una prueba válida. Recomendación: 4–5 coincidencias, 1000–1400 ns.';s.acquisition={...s.trial,time:s.time};if(s.mission===7)this.next(8);return this.note('Criterios guardados. Compara referencias en Archivo.');}
  if(action==='archiveRead'){const id=['A','B','C'][c.archiveIndex-1];return this.act('history:'+id);}
  if(action==='archiveSelect'){const id=['A','B','C'][c.archiveIndex-1];return this.act('reference:'+id);}
  if(action.startsWith('history:')){const id=action.split(':')[1];if(!HISTORY.some(h=>h.id===id))return 'Registro no encontrado.';if(!s.historyViewed.includes(id))s.historyViewed.push(id);this.revision++;return 'Registro histórico consultado.';}
  if(action.startsWith('reference:')){if(s.mission<8)return 'Completa primero la adquisición.';const id=action.split(':')[1],h=HISTORY.find(h=>h.id===id);if(s.historyViewed.length<2)return 'Compara al menos dos registros antes de elegir.';if(!h?.good)return 'Ese conjunto tiene una anomalía documentada. Escoge una referencia estable.';s.historical=id;if(s.mission===8){this.next(9);s.candidateAt=s.time+18;}return this.note('Referencia B aceptada. El detector está adquiriendo coincidencias.');}
  if(action==='health'){if(!s.event)return 'El detector está adquiriendo. Aún no hay candidato.';const q=this.condition();if(!q.valid){s.healthChecked=false;return `Comprobar: ${q.sync>1.5||!s.sync?.passed?'sincronía; ':''}${!s.calibration?.passed?'calibración luminosa; ':''}${fault(s,'comms')?'comunicación en Servidores; ':''}${!c.relayPower?'relé aislado en Control; ':''}${Math.abs(q.voltage-24)>=.7?'fuente de Taller; ':''}${q.noise>=.3?'relé o filtro en Control; ':''}consulta los paneles físicos.`;}s.healthChecked=true;this.revision++;if(s.preliminary&&s.mission===9)this.next(10);return 'Instrumentos verificados. Sin fallos conocidos que expliquen la coincidencia.';}
  if(action==='preliminary'){if(!s.event)return 'Sin coincidencia registrada todavía.';s.preliminary=true;if(s.healthChecked&&s.mission===9)this.next(10);return `Candidato ${s.event.id}: ${s.event.hits.length} sensores, ${s.event.duration} ns. Origen pendiente.`;}
  if(action.startsWith('record:')){if(s.mission<10)return 'Primero examina el candidato y comprueba los instrumentos.';const index=Number(action.split(':')[1]),valid=[s.sync?.passed,s.calibration?.passed,s.acquisition&&s.historical,s.healthChecked&&this.condition().valid];if(!valid[index])return ['Verifica sincronización en el osciloscopio.','Repite calibración luminosa en 05.','Valida adquisición y referencia histórica.','Comprueba el estado actual en Control.'][index]||'Registro desconocido.';s.records|=1<<index;this.revision++;return 'Registro anexado al expediente científico.';}
  if(action==='authorize'){if(s.mission<10||s.records!==15)return 'Faltan registros: sincronía, calibración, adquisición o validación.';if(!this.condition().valid)return 'La validación ha cambiado. Revisa el estado en Control.';s.bundleReady=true;s.analysisUnlocked=true;if(s.mission===10)this.next(11);return this.note('Expediente validado. Área de Análisis autorizada permanentemente. Consulta Observación.');}
  if(action==='observe'){if(!s.bundleReady)return 'Prepara y valida los cuatro registros en Control.';if(s.observed)return 'Registro óptico ya consultado. Informe en Análisis.';s.armed=true;this.observeWait=0;this.revision++;return this.note('Registro preparado. Acércate al cristal y contempla el hielo.');}
  if(['readings','hits','fit'].includes(action)){if(!s.analysisUnlocked)return 'Área restringida. Falta validar el expediente en Control.';if(!s.event)return 'No hay candidatos.';s.event.review|={readings:1,hits:2,fit:4}[action];s.review=s.event.review;this.syncEvent();this.revision++;return action==='fit'?(s.event.kind==='cascade'?'Patrón disperso: el eje geométrico no determina una dirección fiable.':'Eje aproximado calculado. No confirma el origen del candidato.'):'Datos del evento consultados.';}
  if(action==='report'){if(!s.observed)return 'Consulta antes el registro en Observación.';if(!s.analysisUnlocked||s.event?.review!==7)return 'Revisa lecturas, sensores y reconstrucción del evento.';return this.start('report',3.2);}
  if(action==='nextEvent'){if(s.events.length<2)return 'La memoria contiene un solo candidato. La adquisición continúa.';const i=s.events.findIndex(e=>e.id===s.event.id);s.event=s.events[(i+1)%s.events.length];s.review=s.event.review;this.revision++;return `Memoria: ${s.event.id}`;}
  return this.maintenance(action);
 }
 syncEvent(){const s=this.state,i=s.events.findIndex(e=>e.id===s.event?.id);if(i>=0)s.events[i]=s.event;}
 maintenance(action){const s=this.state,c=s.controls,type=action.split(':')[1];
  if(action.startsWith('inspect:')){
   if(type==='supply'){s.supplyChecked=true;this.progress();const e=s.director.active.find(e=>e.type==='voltage');if(!e)return `Fuente: ${this.condition().voltage.toFixed(2)} V. Suministro general revisado.`;e.inspected=true;if(e.benign)return 'Ciclo de ensayo normal. No se detecta una avería.';if(Math.abs(this.condition().voltage-24)<.15&&!c.load){s.baseVoltage+=e.offset;clearFault(s,'voltage');return this.note('Fuente auxiliar recuperada.');}return FAULTS.voltage.hint;}
   const e=s.director.active.find(e=>e.type===type);if(!e)return 'Inspección: funcionamiento normal. No requiere reparación.';e.inspected=true;this.revision++;if(e.benign)return 'Operación normal: dilatación o ciclo de servicio. No se detecta una avería.';return FAULTS[type].hint;
  }
  if(action==='relayPower'){c.relayPower=!c.relayPower;this.revision++;const e=fault(s,'relay');if(c.relayPower&&e?.replaced){clearFault(s,'relay');return this.note('Relé nuevo en servicio. Chasquidos eliminados.');}return c.relayPower?'Relé conectado.':'Relé aislado. Puedes revisar el contacto.';}
  if(action==='relayReplace'){const e=fault(s,'relay');if(!e)return 'Contacto normal.';if(c.relayPower)return 'Corta primero el interruptor local del relé.';if(!s.benchTest)return 'Prueba un repuesto en el banco de Taller.';e.replaced=true;s.benchTest=false;this.revision++;return 'Contacto sustituido. Restablece el interruptor local.';}
  if(action==='commReset'){const e=fault(s,'comms');if(!e)return 'Bucle de comunicación: respuesta normal.';if(c.commChannel!==e.channel)return `Sin respuesta. Placa de ruta: canal ${e.channel}.`;clearFault(s,'comms');return this.note('Comunicación auxiliar recuperada.');}
  if(action==='tempReference'){c.tempReference=!c.tempReference;this.revision++;return c.tempReference?'Sonda patrón conectada: −31.5 °C.':'Sonda patrón desconectada.';}
  if(action==='printerFeed'){if(c.paperTravel<.95)return 'Gira el rodillo hasta liberar la hoja.';c.paperTravel=0;clearFault(s,'printer');this.revision++;return this.note('Papel recogido. Registro de servicio archivado.',true);}
  if(action.startsWith('verify:')){const e=fault(s,type);if(!e)return 'Lectura nominal. No hay avería pendiente.';if(!e.inspected)return 'Inspecciona primero el equipo para identificar la causa.';const ok=type==='fan'?Math.abs(c.fanTrim-e.target)<.3:type==='lamp'?Math.abs(c.lampTrim-e.target)<.3:type==='pipe'?c.pipeFlow>=.35&&c.pipeFlow<=.55:type==='temperature'?c.tempReference&&Math.abs((s.tempOffset||0)+c.tempTrim+e.offset)<.31:false;if(!ok)return FAULTS[type]?.hint||'Comprueba el procedimiento.';if(type==='temperature')s.tempOffset+=e.offset;clearFault(s,type);return this.note(`${FAULTS[type].title}: lectura nominal restaurada.`);}
  return 'Orden no disponible en este equipo.';
 }
 objective(){const s=this.state,n=s.mission;const text=[
  s.briefed?'Recoge el plano físico de la pared en Acceso.':'Consulta el panel de turno en Acceso y recoge el plano.',
  !s.supplyChecked?'Revisa la fuente de Taller.':!s.supervision?'Activa la supervisión en Control.':'Reconoce Taller, Control y Calibración.',
  s.fault?'Consulta el diagnóstico de Control.':'Supervisión activa. Explora mientras llegan datos.',
  s.power?'Panel ENLACE en Servidores: aísla alimentación.':!s.connectionChecked?'Inspecciona conexiones del panel aislado.':!s.moduleSeated?'Desliza la corredera del módulo hasta su asiento.':'Restablece alimentación del enlace.',
  'Calibración: superpone pulsos con la perilla del osciloscopio y mide.',
  'Banco óptico de Calibración: conecta el emisor, cierra el obturador y emite diez pulsos.',
  'Panel de Control: ajusta coincidencias / ventana, prueba y acepta.',
  'Archivo: compara dos conjuntos y elige una referencia estable.',
  !s.event?'Detector adquiriendo. Explora; espera una coincidencia.':'Control: comprueba instrumentos y examina la coincidencia.',
  'Control: reúne cuatro registros y valida el expediente.',
  s.armed?'Acércate al cristal de Observación y mira al hielo.':'Consulta el sistema de Observación.',
  'Análisis: revisa datos, sensores, reconstrucción y emite un informe.',
  'Primer turno registrado. Explora, atiende equipos y estudia nuevos candidatos.'
 ][n-1];return `${String(Math.min(n,12)).padStart(2,'0')} / ${MISSION_NAMES[n-1]} · ${text}`;}
 export(position){this.syncEvent();return {...this.state,position:position?{x:position.x,z:position.z,yaw:position.yaw,pitch:position.pitch}:this.state.position};}
}

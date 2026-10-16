import {HISTORY} from './science.js?v=3.1';
export function consoleContent(controller,t,c,time,{line,lines,wrap,GREEN,DIM}){
 const s=controller.missions.state,e=s.event,q=controller.missions.condition(),back=['REGRESAR','page:home'];
 if(t.page==='science'){
  c.font='15px Courier New,monospace';wrap(c,'El neutrino no se ve. Partículas secundarias cargadas pueden emitir luz Cherenkov al superar la velocidad de la luz EN EL HIELO, nunca en el vacío. Tiempos y cargas de fotones ayudan a reconstruir el evento. Muones y ruido también producen señales: un candidato no confirma un neutrino ni su origen.',22,84,468,20);return [back];
 }
 if(t.page==='logs'){c.font='14px Courier New,monospace';(s.log.length?s.log.slice(-6):['Turno iniciado.']).forEach((text,i)=>line(text.slice(0,56),83+i*22));return [back,['PRINCIPIO FÍSICO','page:science']];}
 if(t.id==='control'){
  if(t.page==='health'){lines([`ALIMENTACIÓN  ${q.voltage.toFixed(2)} V`,`DESFASE      ${q.sync.toFixed(1)} ns`,`RUIDO        ${q.noise.toFixed(2)} / referencia`,q.valid?'Instrumentos dentro de tolerancia.':'Revisar los equipos indicados.'],87,25);return [['COMPROBAR','health'],['COINCIDENCIA','preliminary'],back,['EXPEDIENTE','page:bundle']];}
  if(t.page==='candidate'){lines(e?[`CANDIDATO ${e.id}`,`Sensores: ${e.hits.length} / ${e.sensorCount}`,`Ventana: ${e.duration} ns`,`Carga: ${e.charge} p.e.`,'Clasificación pendiente de análisis.']:['ADQUISICIÓN EN CURSO','Esperando coincidencia de sensores.','El sistema registra sin intervención.'],85,23);return [['REVISAR LECTURAS','preliminary'],['COMPROBAR ESTADO','health'],['EXPEDIENTE','page:bundle'],back];}
  if(t.page==='bundle'){lines(['EXPEDIENTE / REGISTROS REQUERIDOS',`${s.records&1?'[X]':'[ ]'} Sincronización verificada`,`${s.records&2?'[X]':'[ ]'} Calibración luminosa`,`${s.records&4?'[X]':'[ ]'} Adquisición + referencia`,`${s.records&8?'[X]':'[ ]'} Validación instrumental`],84,24);return [['AÑADIR SINCRONÍA','record:0'],['AÑADIR CALIBRACIÓN','record:1'],['AÑADIR ADQUISICIÓN','record:2'],['VALIDACIÓN →','page:bundle2']];}
  if(t.page==='bundle2'){lines(['EXPEDIENTE / AUTORIZACIÓN',`${[1,2,4,8].filter(v=>s.records&v).length} / 4 registros reunidos`,s.bundleReady?'Área de Análisis autorizada.':'Reúne los registros y valida.',s.healthChecked?'Instrumentos comprobados.':'Falta comprobar estado actual.'],87,25);return [['AÑADIR VALIDACIÓN','record:3'],['AUTORIZAR ANÁLISIS','authorize'],['← REGISTROS','page:bundle'],back];}
  lines([s.fault?'! LÍNEA 17 / DATOS INCOMPLETOS':'SUPERVISIÓN DEL DETECTOR',s.supervision?'Adquisición en vigilancia.':'Activa la supervisión general.',s.diagnosed&&!s.repaired?'Contacto inestable en receptor 17.':s.repaired?'Receptor 17 estable.':'Líneas profundas / estado nominal.',e?`Memoria: ${e.id}`:'Sin coincidencia validada todavía.',`Tarea ${String(Math.min(12,s.mission)).padStart(2,'0')} / 12`],85,24);
  return [[s.mission<=2?'ACTIVAR SUPERVISIÓN':'DIAGNÓSTICO',s.mission<=2?'supervision':'diagnose'],['ESTADO EQUIPOS','page:health'],['COINCIDENCIA','page:candidate'],['EXPEDIENTE','page:bundle']];
 }
 if(t.id==='servers'){
  lines(['RECEPTOR DE DATOS / CANAL 17',`Alimentación  ${s.power?'24.1 V':'AISLADA'}`,`Contacto      ${s.moduleSeated?'ASEGURADO':'POR REVISAR'}`,s.repaired?'Enlace estable.':'Intervención en PANEL FÍSICO este.','Aislar > inspeccionar > asentar > ON'],86,24);return [['BITÁCORA','page:logs'],['FUNCIÓN DEL ENLACE','page:science']];
 }
 if(t.id==='calibration'){
  if(t.page==='times'){const r=s.calibration;lines(['RESPUESTA A PULSOS CONOCIDOS',...(r?[0,1,2,3,4].map(i=>`${i+1}: ${(r.times[i]?.toFixed(2)??'—')} ns   ${i+6}: ${(r.times[i+5]?.toFixed(2)??'—')} ns`):['No hay prueba registrada.'])],83,23);return [back,['PRINCIPIO FÍSICO','page:science']];}
  const r=s.calibration;lines(['GENERADOR LED / 10 PULSOS',`Emisión: ${s.job?.kind==='calibrate'?Math.floor((1-s.job.remaining/s.job.total)*10):r?.pulses||0} / 10   Nivel: ${s.controls.pulseLevel}`,`Respuestas: ${r?.responses??'—'}   RMS: ${r?.jitter?.toFixed(2)??'—'} ns`,r?.passed?'Validación aceptada.':'Ajusta y verifica primero el reloj.',s.sync?`Desfase medido: ${s.sync.residual.toFixed(1)} ns`:'Osciloscopio: pendiente de medición.'],85,24);return [['EMITIR PULSOS','calibrate'],['TIEMPOS','page:times'],['NOTA CIENTÍFICA','page:science'],['BITÁCORA','page:logs']];
 }
 if(t.id==='archive'){
  if(t.page.startsWith('history:')){const id=t.page.split(':')[1],h=HISTORY.find(h=>h.id===id);lines([h.name,`Dispersión: ${h.jitter} ns / ruido: ${h.noise}`,`Temperatura: ${h.temp} °C`,h.good?'Reloj y LED comprobados.':'Condición anómala documentada.','Series sintéticas de esta instalación.'],85,24);return [['ELEGIR REFERENCIA','reference:'+id],back,['PRINCIPIO FÍSICO','page:science'],['BITÁCORA','page:logs']];}
  lines(['ARCHIVO / SERIES DE COMPARACIÓN','A: reloj sin corregir','B: pulsos y reloj verificados','C: prueba de carga e interferencia',s.historical?'Referencia B incorporada.':'Compara al menos dos registros.'],85,24);return [['SERIE A','history:A'],['SERIE B','history:B'],['SERIE C','history:C'],['BITÁCORA','page:logs']];
 }
 if(t.id==='analysis'){
  if(!s.analysisUnlocked){lines(['ÁREA DE TRABAJO RESTRINGIDA','Valida el expediente en Control.','El paso a Archivo está habilitado.']);return [['PRINCIPIO FÍSICO','page:science']];}
  if(t.page==='report'){
   lines(['INFORME DE INVESTIGACIÓN',e?.id||'Sin candidato.',e?.reported?'Informe de este evento archivado.':`${[1,2,4].filter(b=>e?.review&b).length} / 3 consultas completadas`,s.report?.eventId===e?.id?s.report.summary:'El candidato requiere rechazo de fondos.','Modelo sintético / no dato experimental.'],85,24);return [['REGISTRAR INFORME','report'],['OTRO REGISTRO','nextEvent'],['PRINCIPIO FÍSICO','page:science'],back];
  }
  if(!e)lines(['SIN CANDIDATOS','La adquisición continúa.']);
  else if(['hits','fit'].includes(t.page)){controller.graph(c,e,t.page==='fit');line(`${t.page==='fit'?'RECONSTRUCCIÓN':'SENSORES'} / ${e.id}`,85);c.font='12px Courier New,monospace';line(t.page==='fit'?`${e.kind==='cascade'?'Disperso / eje poco definido':'Alargado / eje aproximado'} · ±${e.uncertainty}° ilustrativos`:'Tono = tiempo · área de punto = carga · malla fija',215,DIM);}
  else lines([`CANDIDATO ${e.id}`,`${e.hits.length} sensores / ${e.duration} ns / ${e.charge} p.e.`,`Calidad instrumental: ${(e.confidence*100).toFixed(0)} %`,e.kind==='track'?'Patrón alargado / comprobar fondos.':'Patrón disperso / dirección incierta.',`Consultas: ${[1,2,4].filter(b=>e.review&b).length} / 3`],85,24);
  return [['LECTURAS','readings'],['SENSORES','hits'],['RECONSTRUIR','fit'],['INFORME / MEMORIA','page:report']];
 }
 if(t.id==='observation'){
  lines(s.bundleReady?[`REGISTRO ${e?.id||'—'}`,s.observed?'Consulta óptica archivada.':'Prepara la consulta y mira al hielo.','Destellos: representación artística','de luz de partículas secundarias.','No son neutrinos visibles.']:['OBSERVACIÓN / REGISTRO EN ESPERA','Falta el expediente validado.','Hielo profundo; visibilidad mínima.','El sistema continúa registrando.'],85,24);return [['CONSULTAR EVENTO','observe'],['NOTA CIENTÍFICA','page:science'],['BITÁCORA','page:logs']];
 }
 if(t.id==='workshop'){lines(['BANCO DE CONTINUIDAD / REPUESTOS',s.benchTest?'Reserva: 0.3 ohm / comprobada.':'Repuesto pendiente de prueba.','Banco físico: pared oeste del Taller.','Repuestos para contactos de relé.','Receptor 17: intervención en Servidores.'],85,24);return [['DÓNDE PROBAR','bench'],['BITÁCORA','page:logs'],['PRINCIPIO FÍSICO','page:science']];}
 return [back];
}

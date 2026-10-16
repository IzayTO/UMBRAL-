import * as T from './three.module.min.js';
import {lineBlocked} from './station.js?v=3.1';
import {boundsOf} from './layout.js?v=3.1';
import {fault,FAULTS} from './director.js?v=3.1';
import {HISTORY} from './science.js?v=3.1';
import {controlGuide} from './control-guide.js?v=3.1';
const G='#8caa79',D='#51664c',A='#b5a474';
export class Instruments{
 constructor(world,missions,canvas,camera,callbacks){
  Object.assign(this,{world,missions,canvas,camera,callbacks});this.active=null;this.candidate=null;this.selected=0;this.ray=new T.Raycaster();this.pointer=new T.Vector2();
  for(const d of world.devices){d.canvas=document.createElement('canvas');d.canvas.width=512;d.canvas.height=256;d.ctx=d.canvas.getContext('2d',{alpha:false});d.texture=new T.CanvasTexture(d.canvas);d.texture.colorSpace=T.SRGBColorSpace;d.texture.magFilter=T.NearestFilter;d.texture.minFilter=T.LinearFilter;d.screen.material.fog=false;d.texture.generateMipmaps=false;d.screen.material.map=d.texture;d.screen.material.needsUpdate=true;d.message='';this.labels(d);this.paint(d,0);}
  this.gateSign();this.guide=document.querySelector('#instrument-guide');
  canvas.addEventListener('pointerdown',e=>{if(!this.active||this.suspended)return;e.preventDefault();this.pointer.set(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2);this.ray.setFromCamera(this.pointer,camera);const d=this.active,hits=this.ray.intersectObjects(d.controls.map(c=>c.hit),false),hit=hits[0];if(!hit)return;const i=d.controls.findIndex(c=>c.hit===hit.object);this.selected=i;const c=d.controls[i];if(['knob','slider'].includes(c.kind)){this.drag={id:e.pointerId,x:e.clientX,y:e.clientY,start:missions.state.controls[c.id]||0,control:c};canvas.setPointerCapture?.(e.pointerId);}else this.operate(c);this.paint(d,this.now||0);});
  canvas.addEventListener('pointermove',e=>{const drag=this.drag;if(!this.active||this.suspended||!drag||e.pointerId!==drag.id)return;e.preventDefault();const c=drag.control,delta=(e.clientX-drag.x-(e.clientY-drag.y))*(c.max-c.min)/(c.id==='archiveIndex'?96:c.kind==='slider'?120:240);missions.adjust(c.id,drag.start+delta);this.active.message="";this.paint(this.active,this.now||0);});
  for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,e=>{if(this.drag?.id===e.pointerId){const control=this.drag.control;this.drag=null;if((control.kind==='slider'||control.id==='paperTravel')&&missions.state.controls[control.id]>=.95)this.operate(control);callbacks.save();}});
  window.addEventListener('keydown',e=>{if(!this.active||this.suspended||e.defaultPrevented)return;const d=this.active;
   if(['Escape','KeyE'].includes(e.code)){e.preventDefault();this.leave();return;}
   if(e.code==='Tab'||e.code==='ArrowDown'||e.code==='ArrowUp'){e.preventDefault();this.selected=(this.selected+(e.code==='ArrowUp'?d.controls.length-1:1))%d.controls.length;}
   else if(/^Digit[1-6]$/.test(e.code)){e.preventDefault();this.selected=Math.min(d.controls.length-1,Number(e.code.at(-1))-1);if(!['knob','slider'].includes(d.controls[this.selected].kind))this.operate(d.controls[this.selected]);}
   else if(['ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();const c=d.controls[this.selected];if(['knob','slider'].includes(c.kind))missions.adjust(c.id,(missions.state.controls[c.id]||0)+(e.code==='ArrowRight'?1:-1)*c.step);}
   else if(['Enter','Space'].includes(e.code)&&!e.repeat){e.preventDefault();this.operate(d.controls[this.selected]);}
   this.paint(d,this.now||0);callbacks.save();
  });
 }
 gateSign(){const can=document.createElement('canvas');can.width=256;can.height=128;const c=can.getContext('2d');c.fillStyle='#4b5040';c.fillRect(0,0,256,128);c.strokeStyle='#998767';c.strokeRect(4,4,248,120);c.fillStyle='#b6a889';c.font='bold 22px Courier New,monospace';c.textAlign='center';c.fillText('06 / ANÁLISIS',128,32);c.font='16px Courier New,monospace';c.fillText('PUESTO RESTRINGIDO',128,63);c.fillText('VALIDAR EXPEDIENTE',128,87);c.fillText('EN CONTROL',128,109);const tex=new T.CanvasTexture(can);tex.colorSpace=T.SRGBColorSpace;tex.magFilter=tex.minFilter=T.NearestFilter;tex.generateMipmaps=false;const mat=new T.MeshBasicMaterial({map:tex}),sign=new T.Mesh(new T.PlaneGeometry(.7,.35),mat);sign.position.set(-.057,1.56,0);sign.rotation.y=-Math.PI/2;this.world.analysisGate.mesh.add(sign);}
 labels(d){
  const can=document.createElement('canvas');can.width=512;can.height=40;const c=can.getContext('2d');c.fillStyle='#4b5040';c.fillRect(0,0,512,40);c.fillStyle='#b2ac91';c.font='bold 15px Courier New,monospace';c.textAlign='center';
  const width=d.id==='printer'?.48:d.size[0]-.08;for(let i=0;i<d.controls.length;i++){const control=d.controls[i],x=(control.mesh.position.x/width+.5)*512;c.fillText(String(i+1),x,14);c.fillText(control.label.slice(0,12),x,31);}
  const tex=new T.CanvasTexture(can);tex.colorSpace=T.SRGBColorSpace;tex.magFilter=tex.minFilter=T.NearestFilter;tex.generateMipmaps=false;
  const mat=new T.MeshLambertMaterial({map:tex,color:0xffffff});mat.name='device-label-'+d.id;mat.onBeforeCompile=this.world.materials.paint.onBeforeCompile;mat.customProgramCacheKey=this.world.materials.paint.customProgramCacheKey;
  const g=new T.PlaneGeometry(width,.062),b=boundsOf(d.zone),arr=new Float32Array(g.attributes.position.count*4);for(let i=0;i<arr.length;i+=4)arr.set(b,i);g.setAttribute('roomBounds',new T.BufferAttribute(arr,4));
  const label=new T.Mesh(g,mat);label.position.set(0,d.id==='printer'?-.215:-.307,.114);d.group.add(label);label.userData.zone=d.zone;this.world.deviceDynamic.push(label);
 }
 find(player){if(this.active)return this.active;const f=this.camera.getWorldDirection(new T.Vector3());let best=null,score=-1;
  const extras=[...(!this.missions.state.mapOwned?[this.world.mapPickup]:[]),...(!this.missions.state.analysisUnlocked?[this.world.analysisGate]:[])];
  for(const d of [...this.world.devices,...extras]){const delta=d.target.clone().sub(this.camera.position),dist=Math.hypot(player.x-d.target.x,player.z-d.target.z),front=(player.x-d.target.x)*d.normal.x+(player.z-d.target.z)*d.normal.z,dot=delta.normalize().dot(f),rank=dot-dist*.025;
   if(dist<1.85&&front>.12&&dot>.65&&!lineBlocked(player,d.target,this.world.walls)&&rank>score){best=d;score=rank;}}
  this.candidate=best;return best;
 }
 enter(d=this.candidate){if(!d||this.active)return false;
  if(d.id==='map-pickup'){this.callbacks.notice(this.missions.act('pickupMap'),8);this.callbacks.save();this.world.mapPickup.mesh.visible=false;return true;}
  if(d.id==='analysis-gate'){this.callbacks.notice('ANÁLISIS · Puesto restringido hasta validar el expediente en Control. El paso hacia Archivo permanece libre.',8);return true;}
  this.active=d;const clearanceRay=new T.Raycaster(d.target.clone().addScaledVector(d.normal,.24),d.normal);const obstacle=clearanceRay.intersectObjects(this.world.parts,false)[0];d.clearance=obstacle?Math.max(.45,obstacle.distance+.08):1.4;this.guide.hidden=false;this.openedAt=this.now||0;this.selected=0;d.message='';document.body.classList.add('inspecting','instrument-mode');this.callbacks.open();this.paint(d,this.now||0);return true;
 }
 leave(resume=true){if(!this.active)return;this.active=null;this.camera.clearViewOffset();this.guide.hidden=true;this.drag=null;document.body.classList.remove('inspecting','instrument-mode');this.callbacks.save();this.callbacks.close(resume);}
 focus(dt){const d=this.active;if(!d)return;const c=this.camera,aspect=innerWidth/innerHeight,wide=aspect>1.3,extent=Math.max(d.size[1]/(wide?1:.72),d.size[0]/(aspect*(wide?.72:1)))*.5*1.15;c.setViewOffset(innerWidth,innerHeight,wide?-innerWidth*.13:0,wide?0:innerHeight*.09,innerWidth,innerHeight);let dist=Math.max(.65,extent/Math.tan(25*Math.PI/180));
  // In the narrow service corridor, widen only the inspection lens rather than
  // moving the camera through the opposite wall in portrait orientation.
  for(const w of this.world.walls){const direction=w.axis==='x'?d.normal.x:d.normal.z;if(Math.abs(direction)<.001)continue;const along=(w.line-(w.axis==='x'?d.target.x:d.target.z))/direction;if(along<=.2)continue;const cross=w.axis==='x'?d.target.z+d.normal.z*along:d.target.x+d.normal.x*along;if(cross>=w.lo&&cross<=w.hi)dist=Math.min(dist,along-.16);}
  dist=Math.max(.4,Math.min(1.4,d.clearance||1.4,dist));const p=d.target.clone().addScaledVector(d.normal,dist);c.fov=2*Math.atan(extent/dist)*180/Math.PI;c.aspect=aspect;c.updateProjectionMatrix();c.position.lerp(p,1-Math.exp(-dt*18));const q=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().lookAt(p,d.target,new T.Vector3(0,1,0)));c.quaternion.slerp(q,1-Math.exp(-dt*18));}

 operate(c){if(c.kind==='knob'){this.active.message='Arrastra la perilla o usa ← / →. TAB selecciona otro mando.';}else{this.active.message=this.missions.act(c.action,{physical:true});this.callbacks.tone();this.callbacks.save();}this.active.messageUntil=(this.now||0)+5;this.updateGuide(this.active);}
 tick(t,player){this.now=t;const s=this.missions.state;
  for(const d of this.world.devices){if(!d.screen.visible)continue;const near=Math.hypot(d.target.x-player.x,d.target.z-player.z)<6;if(!near)continue;
   if(t-(d.lastPaint??-10)>(d===this.active?.09:1)){this.paint(d,t);d.lastPaint=t;}
   for(const c of d.controls){if(c.outline)c.outline.visible=d===this.active&&d.controls[this.selected]===c;const v=s.controls[c.id];if(c.kind==='knob')c.mesh.rotation.z=1.9-(v-c.min)/(c.max-c.min)*3.8;else if(c.kind==='slider'){c.mesh.position.z=c.mesh.userData.restZ+(1-(s.controls[c.id]||0))*c.travel;}else if(c.kind==='plug'){c.mesh.position.z=c.mesh.userData.restZ+((c.id==='spareConnect'?s.controls.spareSeated:s.controls.pulseConnected)?0:.055);}else if(c.kind==='lever'){const on=c.id==='shutterToggle'?s.controls.shutterClosed:c.id==='inspectLink'?s.connectionChecked:!!v;c.mesh.rotation.z=on?-.6:.55;}else if(c.kind==='switch'){const on=c.id==='isolate'?!s.power:c.id==='restore'?s.power:c.id==='notchToggle'?s.controls.notch:!!v;c.mesh.rotation.z=on?.48:-.48;}}
  }
  for(const o of this.world.deviceDynamic)if(o.userData.role==='film-reel'&&o.visible)o.rotation.z=(s.controls.archiveIndex-1)*2.4;
  for(const o of this.world.deviceDynamic)if(o.userData.role==='fan-rotor'&&o.visible&&Math.hypot(player.x-11.5,player.z-10.27)<7)o.rotation.z=t*(fault(s,'fan')?9.3:13)+(fault(s,'fan')?.12*Math.sin(t*27):0);
 }
 updateGuide(d){if(!this.guide)return;const c=d.controls[this.selected],guide=controlGuide(c),value=this.missions.state.controls[c.id];
  document.querySelector('#instrument-guide-name').textContent=guide[0]+(typeof value==='number'?' / '+Number(value.toFixed(2)):'');
  const s=this.missions.state,q=this.missions.condition(),e=s.director.active.find(e=>e.device===d.id),ctrl=s.controls;
  const readings={film:`SERIE ${HISTORY[ctrl.archiveIndex-1].id} / ${HISTORY[ctrl.archiveIndex-1].jitter} ns / RUIDO ${HISTORY[ctrl.archiveIndex-1].noise}`,checkin:s.briefed?'TURNO RECIBIDO':'REGISTRO PENDIENTE',tester:ctrl.spareSeated?(s.benchTest?'0.3 ohm / REPUESTO VÁLIDO':'CONTACTO EN ZÓCALO'):'ZÓCALO ABIERTO',supply:`${q.voltage.toFixed(2)} V / REF. 24.00`,link:s.repaired?'ENLACE RESTABLECIDO':s.power?'24.1 V / ALIMENTADO':`0.0 V / MÓDULO ${Math.round(ctrl.moduleTravel*100)} %`,scope:`Δt ${(s.syncOffset+ctrl.syncTrim+(fault(s,'drift')?.offset||0)).toFixed(1)} ns / LÍMITE ±1.5`,pulser:s.job?.kind==='calibrate'?`PULSOS ${Math.floor((1-s.job.remaining/s.job.total)*10)}/10`:`${ctrl.pulseConnected?'CABLE +':'CABLE −'} · ${ctrl.shutterClosed?'CÁMARA CERRADA':'CÁMARA ABIERTA'}`,acquisition:s.trial?`${s.trial.rate.toFixed(1)} reg/s · ${(s.trial.retained*100).toFixed(0)} % RETENIDO`:`${ctrl.multiplicity} COINC. / ${ctrl.windowNs} ns`,fan:`VIBRACIÓN ${(fault(s,'fan')?Math.abs(ctrl.fanTrim-e.target):.12).toFixed(2)} mm/s`,relay:ctrl.relayPower?'CIRCUITO CONECTADO':'CIRCUITO AISLADO',comms:`CANAL ${ctrl.commChannel} / RUTA ${e?.channel||ctrl.commChannel}`,pipe:`CAUDAL ${ctrl.pipeFlow.toFixed(2)} / BANDA 0.35–0.55`,thermal:`${q.temperature.toFixed(2)} °C / REF. −31.50`,lamp:`${(24+(fault(s,'lamp')?ctrl.lampTrim-e.target:0)).toFixed(2)} V / REF. 24.00`,printer:s.events.at(-1)?.id||'REGISTRO DE SERVICIO'};
  document.querySelector('#instrument-reading').textContent=readings[d.id]||'';
  document.querySelector('#instrument-guide-purpose').textContent=d.message&&(this.now||0)<d.messageUntil?d.message:guide[1];
  document.querySelector('#instrument-guide-gesture').textContent=c.kind==='knob'?'ARRASTRA LA PERILLA · ← / → ajustan · TAB cambia':c.kind==='slider'?'DESLIZA → HASTA EL TOPE · suelta para fijar':c.kind==='plug'?'TOCA EL CONECTOR · ENTER encaja / retira':c.kind==='lever'||c.kind==='switch'?'TOCA LA PALANCA · ENTER acciona':'TOCA EL MANDO · ENTER acciona · TAB cambia';
 }
 paint(d,t){const G=d.palette==='blue'?'#8ebcd1':'#a2bf87',D=d.palette==='blue'?'#3f6679':'#4d6948',A='#c3b58d';const ctx=d.ctx,s=this.missions.state,c=s.controls,q=this.missions.condition(),e=s.director.active.find(e=>e.device===d.id),isPaper=['paper','scale'].includes(d.display);
  ctx.fillStyle=isPaper?'#938771':'#020605';ctx.fillRect(0,0,512,256);ctx.strokeStyle=isPaper?'#5a5140':D;ctx.strokeRect(6,6,500,244);ctx.font='bold 18px Courier New,monospace';ctx.fillStyle=isPaper?'#292c22':G;ctx.fillText(d.title,16,29);
  const line=(v,y=61,col=G)=>{let size=22;ctx.font=`${size}px Courier New,monospace`;while(ctx.measureText(v).width>477&&size>16){size--;ctx.font=`${size}px Courier New,monospace`;}ctx.fillStyle=isPaper?'#292c22':col;ctx.fillText(v,16,y);};let rows=[];
  if(d.id==='checkin')rows=['TURNO 01 / PERSONAL DE INVESTIGACIÓN',s.briefed?'Registro recibido. Plano en la pared.':'Pulsa REGISTRAR antes de iniciar.',s.mapOwned?'Plano recogido. M para consultar.':'Recoge el plano físico de Acceso.','E / SALIR   ·   J / RECORDAR TAREA'];
  if(d.id==='film'){const h=HISTORY[c.archiveIndex-1];rows=[h.name,`Dispersión ${h.jitter} ns / Ruido ${h.noise}`,`Temperatura ${h.temp} °C`,s.historyViewed.includes(h.id)?'SERIE CONSULTADA':'Gira la bobina y pulsa LEER.'];}
  if(d.id==='tester')rows=[c.spareSeated?'CONTACTO INSERTADO':'ZÓCALO ABIERTO',s.job?.kind==='bench'?'MIDIENDO CONTINUIDAD…':s.benchTest?'RESISTENCIA  0.3 ohm':'Referencia: menos de 1 ohm',s.benchTest?'REPUESTO DISPONIBLE':'Encaja el repuesto y pulsa MEDIR.','Destino: relé auxiliar de Control'];
  if(d.id==='supply')rows=[`FUENTE AUXILIAR    ${q.voltage.toFixed(2)} V`,`Carga de ensayo    ${c.load?'CONECTADA':'AISLADA'}`,fault(s,'voltage')?'Referencia: 24.00 V · ajusta tensión.':'Fuente dentro de límites.',s.supplyChecked?'Suministro revisado.':'Pulsa INSPECCIÓN.'];
  if(d.id==='link')rows=[`LÍNEA 17    ${s.power?'24.1 V / CONECTADA':'0.0 V / AISLADA'}`,s.connectionChecked?'Contacto inspeccionado: pestaña suelta.':'1 AISLAR  >  2 CONTACTOS',s.moduleSeated?'Módulo asentado.':'3 REAJUSTAR  >  4 RESTABLECER',s.repaired?'Enlace estable.':'Interbloqueo de alimentación activo.'];
  if(d.id==='scope'){
   ctx.strokeStyle='#283e2b';for(let x=16;x<500;x+=24){ctx.beginPath();ctx.moveTo(x,47);ctx.lineTo(x,139);ctx.stroke();}for(let y=47;y<=139;y+=23){ctx.beginPath();ctx.moveTo(16,y);ctx.lineTo(496,y);ctx.stroke();}
   const signed=s.syncOffset+c.syncTrim+(fault(s,'drift')?.offset||0);
   for(let k=0;k<2;k++){ctx.strokeStyle=k?A:G;ctx.lineWidth=2;ctx.beginPath();for(let x=18;x<495;x+=2){const v=((x-90-(k?signed*4:0))%150+150)%150,y=110-(Math.exp(-(((v-30)/9)**2)))*43;if(x===18)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();}
   line(`DESFASE ${signed.toFixed(1)} ns / LÍMITE ±1.5`,162);line(`Ajuste ${c.syncTrim.toFixed(1)} ns · comparar`,186);rows=null;
  }
  if(d.id==='acquisition')rows=[`${c.multiplicity} coincidencias / ${c.windowNs} ns`,`Filtro de red: ${c.notch?'ACTIVO':'DESCONECTADO'}`,s.trial?`${s.trial.rate.toFixed(1)} reg/s · retiene ${(s.trial.retained*100).toFixed(0)} %`:'Ajusta, PRUEBA y ACEPTAR.',s.trial?(s.trial.accepted?'Banda útil alcanzada.':'Criterios fuera de la banda útil.'):'Referencia útil: 1–14 reg/s; >53 %.'];
  if(d.id==='pulser')rows=[`LED ${c.pulseLevel}/10  ·  BANDA ÚTIL 3–7`,`${c.pulseConnected?'CABLE +':'CABLE −'} / ${c.shutterClosed?'CÁMARA CERRADA':'CÁMARA ABIERTA'}`,s.job?.kind==='calibrate'?`EMITIENDO ${Math.floor((1-s.job.remaining/s.job.total)*10)} / 10 pulsos`:`Última prueba: ${s.calibration?.responses??0} respuestas`,s.calibration?.passed?'Referencia aceptada.':'Ajusta nivel y pulsa EMITIR.'];
  if(d.id==='fan'){const vibration=fault(s,'fan')?Math.abs(c.fanTrim-e.target):.12;rows=[`Vibración: ${vibration.toFixed(2)} mm/s`,`Cojinete: ${(28+vibration*3).toFixed(1)} °C`,'Ajusta BALANCE para minimizar ruido.','Banda aceptable: menos de 0.3 mm/s.'];}
  if(d.id==='relay')rows=[`Circuito: ${c.relayPower?'CONECTADO':'AISLADO'}`,fault(s,'relay')?(e.replaced?'Contacto nuevo instalado.':'Contacto irregular / inspeccionar.'):'Contacto nominal.',s.benchTest?'Repuesto verificado en Taller.':'Repuesto: probar en Taller.','Aislar > sustituir > conectar.'];
  if(d.id==='comms')rows=[`Selector: canal ${c.commChannel}`,`PLACA DE RUTA: canal ${e?.channel||c.commChannel}`,fault(s,'comms')?'Sin acuse de recibo.':'Enlace auxiliar nominal.','Sintoniza y ejecuta REINICIAR.'];
  if(d.id==='pipe')rows=[`Caudal de retorno: ${c.pipeFlow.toFixed(2)}`,`Vibración: ${(fault(s,'pipe')?Math.abs(c.pipeFlow-.45)*8:.08).toFixed(2)} mm/s`,'Banda de servicio: 0.35 a 0.55.','Inspecciona, gira válvula y verifica.'];
  if(d.id==='thermal')rows=[`Sonda: ${q.temperature.toFixed(2)} °C`,`Patrón: ${c.tempReference?'-31.50 °C':'DESCONECTADO'}`,`Corrección: ${c.tempTrim.toFixed(2)} °C`,'Conecta patrón. Diferencia <0.3 °C.'];
  if(d.id==='lamp')rows=[`Regulador: ${c.lampTrim.toFixed(2)}`,`Tensión: ${(24+(fault(s,'lamp')?c.lampTrim-e.target:0)).toFixed(2)} V`,'Busca 24 V y verifica el balasto.','Alumbrado auxiliar / Archivo'];
  if(d.id==='printer')rows=[e?(e.benign?'CICLO NORMAL / REGISTRO':'REGISTRO AUTOMÁTICO'):'REGISTRADOR EN ESPERA',s.events.at(-1)?.id||'RUIDO DE FONDO / NOMINAL',`T + ${Math.floor(s.time)} s`,'LEER / AVANZAR PAPEL'];
  if(rows)rows.forEach((r,i)=>line(r,61+i*28));
  if(s.job&&((d.id==='link'&&s.job.kind==='reseat')||(d.id==='scope'&&s.job.kind==='sync')||(d.id==='acquisition'&&s.job.kind==='acquire')||(d.id==='pulser'&&s.job.kind==='calibrate'))){ctx.fillStyle=D;ctx.fillRect(16,172,480,8);ctx.fillStyle=G;ctx.fillRect(16,172,480*(1-s.job.remaining/s.job.total),8);line(`PROCEDIMIENTO / ${Math.ceil(s.job.remaining)} s`,164);}
  // Live readings stay visible; full procedure feedback belongs to the local
  // inspection guide. The CRT has a short receipt line, never a covering popup.
  if(d.id==='pulser'){ctx.strokeStyle=D;ctx.beginPath();ctx.moveTo(16,184);ctx.lineTo(494,184);ctx.stroke();const count=s.job?.kind==='calibrate'?Math.floor((1-s.job.remaining/s.job.total)*10):s.calibration?.responses||0;for(let i=0;i<10;i++){ctx.fillStyle=i<count?G:D;ctx.fillRect(24+i*47,171,3,13);ctx.fillRect(27+i*47,171,13,3);ctx.fillRect(40+i*47,171,3,13);}}
  if(d.id==='comms'){ctx.strokeStyle=D;ctx.beginPath();ctx.moveTo(42,176);ctx.lineTo(467,176);ctx.stroke();for(let i=0;i<6;i++){ctx.fillStyle=i+1===c.commChannel?G:D;ctx.fillRect(38+i*85,172,8,8);}}
  const receipt=d.message&&t<(d.messageUntil||0);
  if(receipt){ctx.fillStyle=isPaper?'#938771':'#030807';ctx.fillRect(11,201,490,47);ctx.font='15px Courier New,monospace';ctx.fillStyle=isPaper?'#292c22':A;let row='',lines=[];for(const word of d.message.split(' ')){if(ctx.measureText(row+word).width>472){lines.push(row);row='';}row+=word+' ';}lines.push(row);lines.slice(0,2).forEach((v,i)=>ctx.fillText(i===1&&lines.length>2?v.trimEnd()+'…':v,17,217+i*19));}
  const selected=d.controls[d===this.active?this.selected:0];if(!receipt)line(`${(d===this.active?this.selected:0)+1} ${selected.label}${selected.kind==='knob'?'  ← / →  o arrastrar':''}`,219,A);
  ctx.font='13px Courier New,monospace';ctx.fillStyle=D;if(!receipt)ctx.fillText(d===this.active?'TAB / 1–5: SELECCIONAR  ·  ENTER: ACCIONAR':'MANDOS FÍSICOS / ACÉRCATE PARA OPERAR',16,241);
  if(!isPaper){ctx.fillStyle='rgba(0,0,0,.025)';for(let y=1;y<256;y+=3)ctx.fillRect(0,y,512,1);}d.texture.needsUpdate=true;if(d===this.active)this.updateGuide(d);
 }
}

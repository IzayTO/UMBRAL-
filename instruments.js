import * as T from './three.module.min.js';
import {lineBlocked} from './station.js?v=3.0';
import {boundsOf} from './layout.js?v=3.0';
import {fault,FAULTS} from './director.js?v=3.0';
const G='#8caa79',D='#51664c',A='#b5a474';
export class Instruments{
 constructor(world,missions,canvas,camera,callbacks){
  Object.assign(this,{world,missions,canvas,camera,callbacks});this.active=null;this.candidate=null;this.selected=0;this.ray=new T.Raycaster();this.pointer=new T.Vector2();
  for(const d of world.devices){d.canvas=document.createElement('canvas');d.canvas.width=512;d.canvas.height=256;d.ctx=d.canvas.getContext('2d',{alpha:false});d.texture=new T.CanvasTexture(d.canvas);d.texture.colorSpace=T.SRGBColorSpace;d.texture.magFilter=d.texture.minFilter=T.NearestFilter;d.texture.generateMipmaps=false;d.screen.material.map=d.texture;d.screen.material.needsUpdate=true;d.message='';this.labels(d);this.paint(d,0);}
  this.gateSign();
  canvas.addEventListener('pointerdown',e=>{if(!this.active)return;e.preventDefault();this.pointer.set(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2);this.ray.setFromCamera(this.pointer,camera);const d=this.active,hits=this.ray.intersectObjects(d.controls.map(c=>c.hit),false),hit=hits[0];if(!hit)return;const i=d.controls.findIndex(c=>c.hit===hit.object);this.selected=i;const c=d.controls[i];if(c.kind==='knob'){this.drag={id:e.pointerId,x:e.clientX,y:e.clientY,start:missions.state.controls[c.id]||0,control:c};canvas.setPointerCapture?.(e.pointerId);}else this.operate(c);this.paint(d,this.now||0);});
  canvas.addEventListener('pointermove',e=>{const drag=this.drag;if(!this.active||!drag||e.pointerId!==drag.id)return;e.preventDefault();const c=drag.control,delta=(e.clientX-drag.x-(e.clientY-drag.y))*(c.max-c.min)/240;missions.adjust(c.id,drag.start+delta);this.active.message="";this.paint(this.active,this.now||0);});
  for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,e=>{if(this.drag?.id===e.pointerId){this.drag=null;callbacks.save();}});
  window.addEventListener('keydown',e=>{if(!this.active||e.defaultPrevented)return;const d=this.active;
   if(['Escape','KeyE'].includes(e.code)){e.preventDefault();this.leave();return;}
   if(e.code==='Tab'||e.code==='ArrowDown'||e.code==='ArrowUp'){e.preventDefault();this.selected=(this.selected+(e.code==='ArrowUp'?d.controls.length-1:1))%d.controls.length;}
   else if(/^Digit[1-6]$/.test(e.code)){e.preventDefault();this.selected=Math.min(d.controls.length-1,Number(e.code.at(-1))-1);if(d.controls[this.selected].kind!=='knob')this.operate(d.controls[this.selected]);}
   else if(['ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();const c=d.controls[this.selected];if(c.kind==='knob')missions.adjust(c.id,(missions.state.controls[c.id]||0)+(e.code==='ArrowRight'?1:-1)*c.step);}
   else if(['Enter','Space'].includes(e.code)&&!e.repeat){e.preventDefault();this.operate(d.controls[this.selected]);}
   this.paint(d,this.now||0);callbacks.save();
  });
 }
 gateSign(){const can=document.createElement('canvas');can.width=256;can.height=128;const c=can.getContext('2d');c.fillStyle='#4b5040';c.fillRect(0,0,256,128);c.strokeStyle='#998767';c.strokeRect(4,4,248,120);c.fillStyle='#b6a889';c.font='bold 22px Courier New,monospace';c.textAlign='center';c.fillText('06 / ANÁLISIS',128,32);c.font='16px Courier New,monospace';c.fillText('PUESTO RESTRINGIDO',128,63);c.fillText('VALIDAR EXPEDIENTE',128,87);c.fillText('EN CONTROL',128,109);const tex=new T.CanvasTexture(can);tex.colorSpace=T.SRGBColorSpace;tex.magFilter=tex.minFilter=T.NearestFilter;tex.generateMipmaps=false;const mat=new T.MeshBasicMaterial({map:tex}),sign=new T.Mesh(new T.PlaneGeometry(.7,.35),mat);sign.position.set(-.057,1.56,0);sign.rotation.y=-Math.PI/2;this.world.analysisGate.mesh.add(sign);}
 labels(d){
  const can=document.createElement('canvas');can.width=512;can.height=40;const c=can.getContext('2d');c.fillStyle='#4b5040';c.fillRect(0,0,512,40);c.fillStyle='#b2ac91';c.font='bold 12px Courier New,monospace';c.textAlign='center';
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
  this.active=d;this.openedAt=this.now||0;this.selected=0;d.message='';document.body.classList.add('inspecting','instrument-mode');this.callbacks.open();this.paint(d,this.now||0);return true;
 }
 leave(resume=true){if(!this.active)return;this.active=null;this.drag=null;document.body.classList.remove('inspecting','instrument-mode');this.callbacks.save();this.callbacks.close(resume);}
 focus(dt){const d=this.active;if(!d)return;const c=this.camera,aspect=innerWidth/innerHeight,extent=Math.max(d.size[1],d.size[0]/aspect)*.5*1.22;let dist=Math.max(.65,extent/Math.tan(25*Math.PI/180));
  // In the narrow service corridor, widen only the inspection lens rather than
  // moving the camera through the opposite wall in portrait orientation.
  for(const w of this.world.walls){const direction=w.axis==='x'?d.normal.x:d.normal.z;if(Math.abs(direction)<.001)continue;const along=(w.line-(w.axis==='x'?d.target.x:d.target.z))/direction;if(along<=.2)continue;const cross=w.axis==='x'?d.target.z+d.normal.z*along:d.target.x+d.normal.x*along;if(cross>=w.lo&&cross<=w.hi)dist=Math.min(dist,along-.16);}
  dist=Math.max(.4,dist);const p=d.target.clone().addScaledVector(d.normal,dist);c.fov=2*Math.atan(extent/dist)*180/Math.PI;c.aspect=aspect;c.updateProjectionMatrix();c.position.lerp(p,1-Math.exp(-dt*18));const q=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().lookAt(p,d.target,new T.Vector3(0,1,0)));c.quaternion.slerp(q,1-Math.exp(-dt*18));}

 operate(c){if(c.kind==='knob'){this.active.message='Arrastra la perilla o usa ← / →. TAB selecciona otro mando.';}else{this.active.message=this.missions.act(c.action,{physical:true});this.callbacks.tone();this.callbacks.save();}this.active.messageUntil=(this.now||0)+8;}
 tick(t,player){this.now=t;const s=this.missions.state;
  for(const d of this.world.devices){if(!d.screen.visible)continue;const near=Math.hypot(d.target.x-player.x,d.target.z-player.z)<6;if(!near)continue;
   if(t-(d.lastPaint??-10)>(d===this.active?.09:1)){this.paint(d,t);d.lastPaint=t;}
   for(const c of d.controls){const v=s.controls[c.id];if(c.kind==='knob')c.mesh.rotation.z=1.9-(v-c.min)/(c.max-c.min)*3.8;else if(c.kind==='switch'){const on=c.id==='isolate'?!s.power:c.id==='restore'?s.power:c.id==='notchToggle'?s.controls.notch:!!v;c.mesh.rotation.z=on?.48:-.48;}}
  }
  for(const o of this.world.deviceDynamic)if(o.userData.role==='fan-rotor'&&o.visible&&Math.hypot(player.x-11.5,player.z-10.27)<7)o.rotation.z=t*(fault(s,'fan')?9.3:13)+(fault(s,'fan')?.12*Math.sin(t*27):0);
 }
 paint(d,t){const ctx=d.ctx,s=this.missions.state,c=s.controls,q=this.missions.condition(),e=s.director.active.find(e=>e.device===d.id),isPaper=d.display==='paper';
  ctx.fillStyle=isPaper?'#938771':'#0b160e';ctx.fillRect(0,0,512,256);ctx.strokeStyle=isPaper?'#5a5140':D;ctx.strokeRect(6,6,500,244);ctx.font='bold 18px Courier New,monospace';ctx.fillStyle=isPaper?'#292c22':G;ctx.fillText(d.title,16,29);
  const line=(v,y=61,col=G)=>{ctx.font='18px Courier New,monospace';ctx.fillStyle=isPaper?'#292c22':col;ctx.fillText(v,16,y);};let rows=[];
  if(d.id==='checkin')rows=['TURNO 01 / PERSONAL DE INVESTIGACIÓN',s.briefed?'Registro recibido. Plano en la pared.':'Pulsa REGISTRAR antes de iniciar.',s.mapOwned?'Plano recogido. M para consultar.':'Recoge el plano físico de Acceso.','E / SALIR   ·   J / RECORDAR TAREA'];
  if(d.id==='supply')rows=[`FUENTE AUXILIAR    ${q.voltage.toFixed(2)} V`,`Carga de ensayo    ${c.load?'CONECTADA':'AISLADA'}`,fault(s,'voltage')?'Referencia: 24.00 V · ajusta tensión.':'Fuente dentro de límites.',s.supplyChecked?'Suministro revisado.':'Pulsa INSPECCIÓN.'];
  if(d.id==='link')rows=[`LÍNEA 17    ${s.power?'24.1 V / CONECTADA':'0.0 V / AISLADA'}`,s.connectionChecked?'Contacto inspeccionado: pestaña suelta.':'1 AISLAR  >  2 CONTACTOS',s.moduleSeated?'Módulo asentado.':'3 REAJUSTAR  >  4 RESTABLECER',s.repaired?'Enlace estable.':'Interbloqueo de alimentación activo.'];
  if(d.id==='scope'){
   ctx.strokeStyle='#283e2b';for(let x=16;x<500;x+=24){ctx.beginPath();ctx.moveTo(x,47);ctx.lineTo(x,139);ctx.stroke();}for(let y=47;y<=139;y+=23){ctx.beginPath();ctx.moveTo(16,y);ctx.lineTo(496,y);ctx.stroke();}
   const signed=s.syncOffset+c.syncTrim+(fault(s,'drift')?.offset||0);
   for(let k=0;k<2;k++){ctx.strokeStyle=k?A:G;ctx.lineWidth=2;ctx.beginPath();for(let x=18;x<495;x+=2){const v=((x-90-(k?signed*4:0))%150+150)%150,y=110-(Math.exp(-(((v-30)/9)**2)))*43;if(x===18)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();}
   line(`DESFASE ${signed.toFixed(1)} ns / LÍMITE ±1.5`,162);line(`Ajuste ${c.syncTrim.toFixed(1)} ns · comparar`,186);rows=null;
  }
  if(d.id==='acquisition')rows=[`${c.multiplicity} coincidencias / ${c.windowNs} ns`,`Filtro de red: ${c.notch?'ACTIVO':'DESCONECTADO'}`,s.trial?`${s.trial.rate.toFixed(1)} reg/s · retiene ${(s.trial.retained*100).toFixed(0)} %`:'Ajusta, PRUEBA y ACEPTAR.',s.trial?(s.trial.accepted?'Banda útil alcanzada.':'Criterios fuera de la banda útil.'):'Referencia útil: 1–14 reg/s; >53 %.'];
  if(d.id==='pulser')rows=[`Nivel de referencia: ${c.pulseLevel} / 10`,'Rango útil del banco: 3 a 7.',s.job?.kind==='calibrate'?`EMITIENDO ${Math.floor((1-s.job.remaining/s.job.total)*10)} / 10 pulsos`:`Última prueba: ${s.calibration?.responses??0} respuestas`,s.calibration?.passed?'Referencia aceptada.':'Ajusta nivel y pulsa EMITIR.'];
  if(d.id==='fan'){const vibration=fault(s,'fan')?Math.abs(c.fanTrim-e.target):.12;rows=[`Vibración: ${vibration.toFixed(2)} mm/s`,`Cojinete: ${(28+vibration*3).toFixed(1)} °C`,'Ajusta BALANCE para minimizar ruido.','Banda aceptable: menos de 0.3 mm/s.'];}
  if(d.id==='relay')rows=[`Circuito: ${c.relayPower?'CONECTADO':'AISLADO'}`,fault(s,'relay')?(e.replaced?'Contacto nuevo instalado.':'Contacto irregular / inspeccionar.'):'Contacto nominal.',s.benchTest?'Repuesto verificado en Taller.':'Repuesto: probar en Taller.','Aislar > sustituir > conectar.'];
  if(d.id==='comms')rows=[`Selector: canal ${c.commChannel}`,`PLACA DE RUTA: canal ${e?.channel||c.commChannel}`,fault(s,'comms')?'Sin acuse de recibo.':'Enlace auxiliar nominal.','Sintoniza y ejecuta REINICIAR.'];
  if(d.id==='pipe')rows=[`Caudal de retorno: ${c.pipeFlow.toFixed(2)}`,`Vibración: ${(fault(s,'pipe')?Math.abs(c.pipeFlow-.45)*8:.08).toFixed(2)} mm/s`,'Banda de servicio: 0.35 a 0.55.','Inspecciona, gira válvula y verifica.'];
  if(d.id==='thermal')rows=[`Sonda: ${q.temperature.toFixed(2)} °C`,`Patrón: ${c.tempReference?'-31.50 °C':'DESCONECTADO'}`,`Corrección: ${c.tempTrim.toFixed(2)} °C`,'Conecta patrón. Diferencia <0.3 °C.'];
  if(d.id==='lamp')rows=[`Regulador: ${c.lampTrim.toFixed(2)}`,`Tensión: ${(24+(fault(s,'lamp')?c.lampTrim-e.target:0)).toFixed(2)} V`,'Busca 24 V y verifica el balasto.','Alumbrado auxiliar / Archivo'];
  if(d.id==='printer')rows=[e?(e.benign?'CICLO NORMAL / REGISTRO':'REGISTRO AUTOMÁTICO'):'REGISTRADOR EN ESPERA',s.events.at(-1)?.id||'RUIDO DE FONDO / NOMINAL',`T + ${Math.floor(s.time)} s`,'LEER / AVANZAR PAPEL'];
  if(rows)rows.forEach((r,i)=>line(r,61+i*28));
  if(s.job&&((d.id==='link'&&s.job.kind==='reseat')||(d.id==='scope'&&s.job.kind==='sync')||(d.id==='acquisition'&&s.job.kind==='acquire')||(d.id==='pulser'&&s.job.kind==='calibrate'))){ctx.fillStyle=D;ctx.fillRect(16,172,480,8);ctx.fillStyle=G;ctx.fillRect(16,172,480*(1-s.job.remaining/s.job.total),8);line(`PROCEDIMIENTO / ${Math.ceil(s.job.remaining)} s`,164);}
  if(d.message&&t<(d.messageUntil||0)){
   ctx.fillStyle='#162218';ctx.fillRect(11,87,490,113);ctx.font='16px Courier New,monospace';ctx.fillStyle=A;let row='',y=106;for(const w of d.message.split(' ')){if(ctx.measureText(row+w).width>474){ctx.fillText(row,17,y);row='';y+=20;}row+=w+' ';}ctx.fillText(row,17,y);
  }
  const selected=d.controls[d===this.active?this.selected:0];line(`${(d===this.active?this.selected:0)+1} ${selected.label}${selected.kind==='knob'?'  ← / →  o arrastrar':''}`,219,A);
  ctx.font='13px Courier New,monospace';ctx.fillStyle=D;ctx.fillText(d===this.active?'TAB / 1–5: SELECCIONAR  ·  ENTER: ACCIONAR':'MANDOS FÍSICOS / ACÉRCATE PARA OPERAR',16,241);
  if(!isPaper){ctx.fillStyle='rgba(0,0,0,.08)';for(let y=1;y<256;y+=3)ctx.fillRect(0,y,512,1);}d.texture.needsUpdate=true;
 }
}

import * as T from './three.module.min.js';
import {lineBlocked} from './station.js?v=2.0';
const W=512,H=336,GREEN='#8caa79',DIM='#51664c',AMBER='#b5a474';
const clock=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(Math.floor(s%60)).padStart(2,'0')}`;
const wrap=(ctx,text,x,y,max=468,line=22)=>{let row='';for(const word of text.split(' ')){if(ctx.measureText(row+word).width>max&&row){ctx.fillText(row,x,y);y+=line;row='';}row+=word+' ';}if(row){ctx.fillText(row,x,y);y+=line;}return y;};
export class Terminals{
 constructor(world,missions,canvas,camera,{open,close,notice,tone,save}){
  this.world=world;this.missions=missions;this.canvas=canvas;this.camera=camera;this.callbacks={open,close,notice,tone,save};this.active=null;this.candidate=null;this.lastPaint=-1;this.ray=new T.Raycaster();this.cursor=new T.Vector2();this.selected=0;
  for(const t of world.terminals){t.canvas=document.createElement('canvas');t.canvas.width=W;t.canvas.height=H;t.ctx=t.canvas.getContext('2d',{alpha:false});t.texture=new T.CanvasTexture(t.canvas);t.texture.colorSpace=T.SRGBColorSpace;t.texture.magFilter=T.NearestFilter;t.texture.minFilter=T.NearestFilter;t.texture.generateMipmaps=false;t.screen.material.map=t.texture;t.screen.material.color.setHex(0xffffff);t.screen.material.needsUpdate=true;t.page='home';t.message='';t.buttons=[];this.paint(t,0);}
  canvas.addEventListener('pointerdown',e=>{if(!this.active)return;e.preventDefault();this.cursor.set(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2);this.ray.setFromCamera(this.cursor,camera);const hit=this.ray.intersectObject(this.active.screen)[0];if(hit?.uv){const x=hit.uv.x*W,y=(1-hit.uv.y)*H,i=this.active.buttons.findIndex(b=>x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h);if(i>=0)this.choose(i);}});
  window.addEventListener('keydown',e=>{if(!this.active||e.repeat)return;if(['Escape','KeyE'].includes(e.code)){e.preventDefault();this.leave();return;}if(e.code==='Tab'||e.code==='ArrowDown'||e.code==='ArrowRight'){e.preventDefault();this.selected=(this.selected+1)%Math.max(1,this.active.buttons.length);this.paint(this.active,this.now||0);}else if(e.code==='ArrowUp'||e.code==='ArrowLeft'){e.preventDefault();this.selected=(this.selected+this.active.buttons.length-1)%Math.max(1,this.active.buttons.length);this.paint(this.active,this.now||0);}else if(e.code==='Enter'||e.code==='Space'){e.preventDefault();this.choose(this.selected);}else if(/^Digit[1-4]$/.test(e.code)){e.preventDefault();this.choose(Number(e.code.slice(-1))-1);}});
 }
 find(player){
  if(this.active)return this.active;const forward=this.camera.getWorldDirection(new T.Vector3());let best=null,score=0;
  for(const t of this.world.terminals){const delta=t.target.clone().sub(this.camera.position),distance=Math.hypot(player.x-t.target.x,player.z-t.target.z),front=(player.x-t.target.x)*t.normal.x+(player.z-t.target.z)*t.normal.z;
   const dot=delta.normalize().dot(forward);if(distance<1.85&&front>.15&&dot>.72&&!lineBlocked(player,{x:t.target.x,z:t.target.z},this.world.walls)&&dot>score){best=t;score=dot;}}
  this.candidate=best;return best;
 }
 enter(t=this.candidate){if(!t||this.active)return;this.active=t;this.selected=0;this.openedAt=this.now||0;t.message='';document.body.classList.add('inspecting');this.callbacks.open();this.paint(t,this.now||0);}
 leave(resume=true){if(!this.active)return;this.active=null;document.body.classList.remove('inspecting');this.callbacks.close(resume);}
 focus(dt){
  if(!this.active)return;const t=this.active,cam=this.camera,aspect=innerWidth/innerHeight,fov=50,dist=Math.max(.68,Math.max(.56,.86/aspect)*.5/Math.tan(fov*Math.PI/360)*1.18),p=t.target.clone().addScaledVector(t.normal,dist);
  cam.fov=fov;cam.aspect=aspect;cam.updateProjectionMatrix();cam.position.lerp(p,1-Math.exp(-dt*18));const q=new T.Quaternion();const temp=new T.Matrix4().lookAt(p,t.target,new T.Vector3(0,1,0));q.setFromRotationMatrix(temp);cam.quaternion.slerp(q,1-Math.exp(-dt*18));
 }
 tick(t){this.now=t;if(t-this.lastPaint<.12)return;this.lastPaint=t;for(const term of this.world.terminals)if(term.screen.visible&&(term===this.active||t-(term.lastPaint||-10)>1.3)){this.paint(term,t);term.lastPaint=t;}}
 choose(i){const t=this.active,b=t?.buttons[i];if(!b)return;this.selected=i;t.messageUntil=(this.now||0)+6;
  if(b.action.startsWith('page:')){t.page=b.action.slice(5);t.message='';}
  else {t.message=this.missions.act(b.action);if(['readings','hits','fit'].includes(b.action)&&this.missions.state.event)t.page=b.action;this.callbacks.tone();this.callbacks.save();if(b.action==='observe'&&this.missions.state.armed){this.leave();return;}}
  this.paint(t,this.now||0);
 }
 paint(t,time){
  const c=t.ctx,s=this.missions.state,active=this.active===t;let buttons=[];
  c.fillStyle='#0b160e';c.fillRect(0,0,W,H);c.strokeStyle='#344833';c.lineWidth=2;c.strokeRect(8,8,W-16,H-16);
  c.font='bold 15px Courier New,monospace';c.fillStyle=GREEN;c.fillText(`UMBRAL / ${t.title}`,20,31);
  c.font='13px Courier New,monospace';c.fillStyle=DIM;c.fillText(`TURNO 01   ${clock(s.time)}                 ${s.power?'ENLACE +':'ENLACE -'}`,20,51);c.fillRect(20,60,472,1);
  c.font='17px Courier New,monospace';c.fillStyle=GREEN;
  const line=(txt,y=87,color=GREEN)=>{c.fillStyle=color;c.fillText(txt,22,y);};
  const lines=(arr,y=87,step=23)=>arr.forEach((txt,i)=>line(txt,y+i*step));
  if(t.page==='report'){
   c.font='15px Courier New,monospace';
   const text=s.observed?'El neutrino no se ve. Una interacción puede producir partículas cargadas. Al viajar más rápido que la luz EN EL HIELO (no en el vacío), emiten luz Cherenkov. Los sensores registran fotones; sus tiempos y cargas ayudan a estimar una trayectoria. Un candidato aún requiere descartar otros orígenes.':'Los módulos ópticos registran fotones. Los pulsos LED de posición y tiempo conocidos permiten comprobar su respuesta. Una coincidencia entre sensores puede ser un candidato, pero requiere análisis y rechazo de fondos.';
   wrap(c,text,22,84,468,20);buttons=[['REGRESAR','page:home']];
  }else if(t.id==='control'){
   if(s.fault)lines(['! ADVERTENCIA / CANAL 17','Pérdida intermitente de sincronía.','DOM profundo: alimentación nominal.',s.diagnosed?'Receptor local: contacto inestable.':'Ejecuta diagnóstico del enlace.','Destino de mantenimiento: SERVIDORES'],87,23);
   else lines(['ADQUISICIÓN EN VIGILANCIA',s.repaired?'Canal 17: receptor restablecido.':'Canales 01—24: nominales.','Fotomultiplicadores / red temporal',s.phase>=5?'Registro en OBSERVACIÓN (08).':s.calibrated?'Candidato en ANÁLISIS (06).':s.repaired?'Ejecuta CALIBRACIÓN (05).':'Esperando coincidencias de sensores.'],87,24);
   buttons=[['DIAGNÓSTICO','diagnose'],['PRINCIPIO FÍSICO','page:report']];
  }else if(t.id==='servers'){
   lines(['RECEPTOR DE DATOS / CANAL 17',`Alimentación     ${s.power?'24.1 V / PRESENTE':'0.0 V / AISLADA'}`,`Conector        ${s.moduleSeated?'ASEGURADO':'PENDIENTE DE REVISIÓN'}`,`Sincronía       ${s.repaired?'ESTABLE':s.fault?'INTERMITENTE':'NOMINAL'}`],87,25);
   line('Orden: aislar > reajustar > conectar',193,DIM);
   buttons=[['AISLAR CANAL','isolate'],['REAJUSTAR MÓDULO','reseat'],['RESTABLECER','restore'],['FUNCIÓN DEL ENLACE','page:report']];
  }else if(t.id==='calibration'){
   const r=s.calibration;line('PULSOS DE REFERENCIA / LED',87);
   lines([`Pulsos emitidos  ${s.job?.kind==='calibrate'?Math.floor((1-s.job.remaining/s.job.total)*10):r?.pulses||0} / 10`,`Respuestas      ${r?`${r.responses} / 10`:'SIN PRUEBA'}`,`Dispersión      ${r?.jitter!=null?r.jitter.toFixed(1)+' ns':'—'}`,`Validación      ${r?(r.passed?'ACEPTADA':'PENDIENTE'):'PENDIENTE'}`],115,23);
   buttons=[['EJECUTAR PRUEBA','calibrate'],['QUÉ SE MIDE','page:report']];
  }else if(t.id==='analysis'){
   if(!s.event)lines(['SIN CANDIDATOS VALIDADOS','La adquisición necesita un enlace','estable y una calibración aceptada.','Completa el procedimiento en 05.'],87,25);
   else if(t.page==='hits'||t.page==='fit'){this.graph(c,s.event,t.page==='fit');line(`${t.page==='fit'?'EJE PONDERADO':'SENSORES ACTIVADOS'}  /  ${s.event.id}`,85);c.font='12px Courier New,monospace';line(t.page==='fit'?`Residual geométrico: ${s.event.fit.residual.toFixed(1)} m · modelo simplificado`:'Tono = tiempo de llegada · tamaño = carga',215,DIM);}
   else {const e=s.event;lines([`CANDIDATO ${e.id}`,`Sensores activos  ${e.hits.length} / 24`,`Ventana temporal  ${e.duration} ns`,`Carga integrada   ${e.charge} p.e.`,`Revisión          ${[1,2,4].filter(b=>s.review&b).length} / 3`],85,23);}
   buttons=[['LECTURAS','readings'],['SENSORES','hits'],['TRAYECTORIA','fit'],['ENVIAR REGISTRO','send']];
  }else if(t.id==='observation'){
   lines(s.phase<5?['REGISTRO ÓPTICO / EN ESPERA','Recibe un candidato revisado','desde la consola de Análisis.','Hielo profundo. Visibilidad mínima.']:[`REGISTRO ${s.event?.id||'—'}`,s.observed?'REGISTRO CONSULTADO / ARCHIVADO':'CANDIDATO RECIBIDO',s.observed?'La explicación queda en el informe.':'Prepara la consulta y mira al hielo.','Representación artística de fotones,','no una imagen directa del neutrino.'],87,23);
   buttons=[['CONSULTAR EVENTO','observe'],['INFORME CIENTÍFICO','page:report']];
  }else if(t.id==='archive'){
   if(t.page==='logs'){c.font='14px Courier New,monospace';(s.log.length?s.log.slice(-5):['00:00  Turno iniciado. Sin incidencias.']).forEach((txt,i)=>line(txt.slice(0,55),84+i*24));buttons=[['REGRESAR','page:home'],['INFORME','page:report']];}
   else {lines(['ARCHIVO DE OPERACIONES','1979 / INSTALACIÓN EN SERVICIO','1983 / Sustitución de los receptores','1986 / Control de dispersión en hielo',`ACTUAL / ${s.log.length} registros de este turno`],87,23);buttons=[['BITÁCORA REAL','page:logs'],['NOTA CIENTÍFICA','page:report']];}
  }else if(t.id==='workshop'){
   lines(['BANCO DE CONTINUIDAD / REPUESTOS',s.benchTest?'Reserva comprobada: 0.3 ohm.':'Módulo de reserva sin comprobar.','El receptor en uso está en SERVIDORES.',s.diagnosed?'Contacto del canal 17 por reajustar.':'Consulta el estado en Control.'],87,25);
   buttons=[['PROBAR REPUESTO','bench'],['NOTA DEL SISTEMA','page:report']];
  }
  if(s.job&&((s.job.kind==='reseat'&&t.id==='servers')||(s.job.kind==='calibrate'&&t.id==='calibration')||(s.job.kind==='bench'&&t.id==='workshop'))){
   c.fillStyle='#0b160e';c.fillRect(18,181,476,42);c.fillStyle=DIM;c.fillRect(22,203,466,6);c.fillStyle=GREEN;c.fillRect(22,203,466*(1-s.job.remaining/s.job.total),6);c.font='14px Courier New,monospace';c.fillText(`PROCEDIMIENTO ${Math.ceil(s.job.remaining)} s`,22,195);
  }
  if(t.message&&active&&!s.job&&time<(t.messageUntil||0)){c.fillStyle='#152318';c.fillRect(15,165,482,60);c.font='14px Courier New,monospace';c.fillStyle=AMBER;wrap(c,t.message,22,182,468,17);}
  t.buttons=buttons.map(([label,action],i)=>{const x=20+(i%2)*240,y=232+Math.floor(i/2)*47,w=232,h=40;
   c.fillStyle=active&&i===this.selected?'#263a26':'#142217';c.fillRect(x,y,w,h);c.strokeStyle=active&&i===this.selected?GREEN:DIM;c.lineWidth=1;c.strokeRect(x+.5,y+.5,w-1,h-1);c.fillStyle=GREEN;c.font='bold 14px Courier New,monospace';c.fillText(`${i+1} ${label}`,x+8,y+24);return {label,action,x,y,w,h};});
  c.font='11px Courier New,monospace';c.fillStyle=DIM;c.fillText(active?'TOCA UNA TECLA / 1–4 · E SALIR':'CONSOLA LOCAL / ACÉRCATE PARA OPERAR',20,327);
  // Soft phosphor persistence and scanlines exist in the screen texture, not a web panel.
  c.fillStyle='rgba(0,0,0,.08)';for(let y=1;y<H;y+=3)c.fillRect(0,y,W,1);t.texture.needsUpdate=true;
 }
 graph(c,event,fit){
  const proj=p=>[255+p[0]*.38+p[2]*.18,147-p[1]*.26+p[2]*.04];
  c.strokeStyle='#233e2a';c.lineWidth=1;
  for(let x=125;x<=405;x+=35){c.beginPath();c.moveTo(x,99);c.lineTo(x-30,203);c.stroke();}
  for(let y=104;y<=203;y+=24){c.beginPath();c.moveTo(115,y);c.lineTo(397,y);c.stroke();}
  if(fit){const a=proj(event.fit.start),b=proj(event.fit.end);c.strokeStyle=AMBER;c.lineWidth=1.4;c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();c.fillStyle=AMBER;c.fillText('→',b[0]+3,b[1]+4);}
  for(let i=0;i<event.hits.length;i++){const h=event.hits[i],p=proj(h.p);c.fillStyle=`rgb(${122+i*4},${155-i*4},${102-i*3})`;c.beginPath();c.arc(p[0],p[1],2+h.q*.46,0,Math.PI*2);c.fill();if(i%3===0){c.font='10px Courier New,monospace';c.fillText('D'+h.id,p[0]+8,p[1]+3);}}
 }
}

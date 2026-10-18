import * as T from './three.module.min.js';
import {lineBlocked} from './station.js?v=3.1.1';
import {consoleContent} from './console-content.js?v=3.1.1';
const W=512,H=336,GREEN='#8caa79',DIM='#51664c',AMBER='#b5a474';
const clock=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(Math.floor(s%60)).padStart(2,'0')}`;
const wrap=(ctx,text,x,y,max=468,line=22)=>{let row='';for(const word of text.split(' ')){if(ctx.measureText(row+word).width>max&&row){ctx.fillText(row,x,y);y+=line;row='';}row+=word+' ';}if(row){ctx.fillText(row,x,y);y+=line;}return y;};
export class Terminals{
 constructor(world,missions,canvas,camera,{open,close,notice,tone,save}){
  this.world=world;this.missions=missions;this.canvas=canvas;this.camera=camera;this.callbacks={open,close,notice,tone,save};this.active=null;this.candidate=null;this.lastPaint=-1;this.ray=new T.Raycaster();this.cursor=new T.Vector2();this.selected=0;
  for(const t of world.terminals){t.canvas=document.createElement('canvas');t.canvas.width=W;t.canvas.height=H;t.ctx=t.canvas.getContext('2d',{alpha:false});t.texture=new T.CanvasTexture(t.canvas);t.texture.colorSpace=T.SRGBColorSpace;t.texture.magFilter=T.NearestFilter;t.texture.minFilter=T.LinearFilter;t.texture.generateMipmaps=false;t.screen.material.fog=false;t.screen.material.map=t.texture;t.screen.material.color.setHex(0xffffff);t.screen.material.needsUpdate=true;t.page='home';t.message='';t.buttons=[];this.paint(t,0);}
  canvas.addEventListener('pointerdown',e=>{if(!this.active||this.suspended)return;e.preventDefault();this.cursor.set(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2);this.ray.setFromCamera(this.cursor,camera);const hit=this.ray.intersectObject(this.active.screen)[0];if(hit?.uv){const x=hit.uv.x*W,y=(1-hit.uv.y)*H,i=this.active.buttons.findIndex(b=>x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h);if(i>=0)this.choose(i);}});
  window.addEventListener('keydown',e=>{if(!this.active||this.suspended||e.defaultPrevented||e.repeat)return;if(['Escape','KeyE'].includes(e.code)){e.preventDefault();this.leave();return;}if(e.code==='Tab'||e.code==='ArrowDown'||e.code==='ArrowRight'){e.preventDefault();this.selected=(this.selected+1)%Math.max(1,this.active.buttons.length);this.paint(this.active,this.now||0);}else if(e.code==='ArrowUp'||e.code==='ArrowLeft'){e.preventDefault();this.selected=(this.selected+this.active.buttons.length-1)%Math.max(1,this.active.buttons.length);this.paint(this.active,this.now||0);}else if(e.code==='Enter'||e.code==='Space'){e.preventDefault();this.choose(this.selected);}else if(/^Digit[1-4]$/.test(e.code)){e.preventDefault();this.choose(Number(e.code.slice(-1))-1);}});
 }
 find(player){
  if(this.active)return this.active;const forward=this.camera.getWorldDirection(new T.Vector3());let best=null,score=0;
  for(const t of this.world.terminals){if(t.id==='analysis'&&!this.missions.state.analysisUnlocked)continue;const delta=t.target.clone().sub(this.camera.position),distance=Math.hypot(player.x-t.target.x,player.z-t.target.z),front=(player.x-t.target.x)*t.normal.x+(player.z-t.target.z)*t.normal.z;
   const dot=delta.normalize().dot(forward);if(distance<1.85&&front>.15&&dot>.72&&!lineBlocked(player,{x:t.target.x,z:t.target.z},this.world.walls)&&dot>score){best=t;score=dot;}}
  this.candidate=best;return best;
 }
 enter(t=this.candidate){if(!t||this.active)return;if(t.id==='analysis'&&!this.missions.state.analysisUnlocked){this.callbacks.notice('Análisis requiere validar el expediente en Control.',8);return;}this.active=t;this.selected=0;this.openedAt=this.now||0;t.message='';document.body.classList.add('inspecting');this.callbacks.open();this.paint(t,this.now||0);}
 leave(resume=true){if(!this.active)return;this.active=null;document.body.classList.remove('inspecting');this.callbacks.close(resume);}
 focus(dt){
  if(!this.active)return;const t=this.active,cam=this.camera,aspect=innerWidth/innerHeight,fov=50,dist=Math.max(.68,Math.max(.56,.86/aspect)*.5/Math.tan(fov*Math.PI/360)*1.18),p=t.target.clone().addScaledVector(t.normal,dist);
  cam.fov=fov;cam.aspect=aspect;cam.updateProjectionMatrix();cam.position.lerp(p,1-Math.exp(-dt*18));const q=new T.Quaternion();const temp=new T.Matrix4().lookAt(p,t.target,new T.Vector3(0,1,0));q.setFromRotationMatrix(temp);cam.quaternion.slerp(q,1-Math.exp(-dt*18));
 }
 tick(t){this.now=t;if(t-this.lastPaint<.12)return;this.lastPaint=t;for(const term of this.world.terminals)if(term.screen.visible&&(term===this.active||t-(term.lastPaint||-10)>1.3)){this.paint(term,t);term.lastPaint=t;}}
 choose(i){const t=this.active,b=t?.buttons[i];if(!b)return;this.selected=i;t.messageUntil=(this.now||0)+6;
  if(b.action.startsWith('page:')){t.page=b.action.slice(5);t.message='';}
  else {t.message=this.missions.act(b.action);if(['readings','hits','fit'].includes(b.action)&&this.missions.state.event)t.page=b.action;
   if(b.action.startsWith('history:'))t.page=b.action;
   if(b.action==='health')t.page='health';if(b.action==='preliminary')t.page='candidate';this.callbacks.tone();this.callbacks.save();if(b.action==='observe'&&this.missions.state.armed){this.leave();return;}}
  this.paint(t,this.now||0);
 }
 paint(t,time){
  const c=t.ctx,s=this.missions.state,active=this.active===t;let buttons=[];
  c.fillStyle='#020605';c.fillRect(0,0,W,H);c.strokeStyle='#344833';c.lineWidth=2;c.strokeRect(8,8,W-16,H-16);
  c.font='bold 15px Courier New,monospace';c.fillStyle=GREEN;c.fillText(`UMBRAL / ${t.title}`,20,31);
  c.font='13px Courier New,monospace';c.fillStyle=DIM;c.fillText(`TURNO 01   ${clock(s.time)}                 ${s.power?'ENLACE +':'ENLACE -'}`,20,51);c.fillRect(20,60,472,1);
  c.font='17px Courier New,monospace';c.fillStyle=GREEN;
  const line=(txt,y=87,color=GREEN)=>{c.fillStyle=color;c.fillText(txt,22,y);};
  const lines=(arr,y=87,step=23)=>arr.forEach((txt,i)=>line(txt,y+i*step));
  buttons=consoleContent(this,t,c,time,{line,lines,wrap,GREEN,DIM});
  if(s.job&&((s.job.kind==='reseat'&&t.id==='servers')||(s.job.kind==='calibrate'&&t.id==='calibration')||(s.job.kind==='bench'&&t.id==='workshop')||(s.job.kind==='report'&&t.id==='analysis'))){
   c.fillStyle='#020605';c.fillRect(18,181,476,42);c.fillStyle=DIM;c.fillRect(22,203,466,6);c.fillStyle=GREEN;c.fillRect(22,203,466*(1-s.job.remaining/s.job.total),6);c.font='14px Courier New,monospace';c.fillText(`PROCEDIMIENTO ${Math.ceil(s.job.remaining)} s`,22,195);
  }
  if(t.message&&active&&!s.job&&time<(t.messageUntil||0)){c.fillStyle='#050a08';c.fillRect(15,165,482,60);c.font='14px Courier New,monospace';c.fillStyle=AMBER;wrap(c,t.message,22,182,468,17);}
  t.buttons=buttons.map(([label,action],i)=>{const x=20+(i%2)*240,y=232+Math.floor(i/2)*47,w=232,h=40;
   c.fillStyle=active&&i===this.selected?'#102018':'#040a07';c.fillRect(x,y,w,h);c.strokeStyle=active&&i===this.selected?GREEN:DIM;c.lineWidth=1;c.strokeRect(x+.5,y+.5,w-1,h-1);c.fillStyle=GREEN;c.font='bold 14px Courier New,monospace';c.fillText(`${i+1} ${label}`,x+8,y+24);return {label,action,x,y,w,h};});
  c.font='11px Courier New,monospace';c.fillStyle=DIM;c.fillText(active?'TOCA UNA TECLA / 1–4 · E SALIR':'CONSOLA LOCAL / ACÉRCATE PARA OPERAR',20,327);
  // Soft phosphor persistence and scanlines exist in the screen texture, not a web panel.
  c.fillStyle='rgba(0,0,0,.025)';for(let y=1;y<H;y+=3)c.fillRect(0,y,W,1);t.texture.needsUpdate=true;
 }
 graph(c,event,fit){
  const proj=p=>[255+p[0]*.60+p[2]*.24,151-p[1]*.31+p[2]*.035];
  c.strokeStyle='#233e2a';c.lineWidth=1;
  for(let x=125;x<=405;x+=35){c.beginPath();c.moveTo(x,99);c.lineTo(x-30,203);c.stroke();}
  for(let y=104;y<=203;y+=24){c.beginPath();c.moveTo(115,y);c.lineTo(397,y);c.stroke();}
  if(fit){const a=proj(event.fit.start),b=proj(event.fit.end);c.strokeStyle=AMBER;c.lineWidth=1.4;c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();c.fillStyle=AMBER;c.fillRect(Math.round(b[0])-2,Math.round(b[1])-2,4,4);}
  for(let i=0;i<event.hits.length;i++){const h=event.hits[i],p=proj(h.p),phase=h.ns/Math.max(1,event.duration);c.fillStyle=`rgb(${Math.round(165-phase*55)},${Math.round(175-phase*58)},${Math.round(116-phase*28)})`;const r=Math.max(2,Math.round(Math.sqrt(h.q)*1.15));c.fillRect(Math.round(p[0])-r,Math.round(p[1])-r,r*2,r*2);if(i%5===0){c.font='10px Courier New,monospace';c.fillText('D'+h.id,p[0]+r+2,p[1]+3);}}

 }
}

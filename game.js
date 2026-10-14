import * as T from './three.module.min.js';
import {TEX,START,buildStation} from './station.js?v=2.0';
import {zoneAt,WINDOW,LAMP_DATA} from './layout.js?v=2.0';
import {Missions,SAVE_KEY} from './missions.js?v=2.0';
import {Terminals} from './terminals.js?v=2.0';
import {movePlayer,resolvePosition} from './physics.js?v=2.0';
import {Input} from './input.js?v=2.0';
import {Atmosphere} from './audio.js?v=2.0';

const $=s=>document.querySelector(s),canvas=$('#view');
const settings={volume:58,brightness:105,sensitivity:95,quality:'auto',bob:!matchMedia('(prefers-reduced-motion:reduce)').matches,flicker:!matchMedia('(prefers-reduced-motion:reduce)').matches};
try{const saved=JSON.parse(localStorage.getItem('umbral-v1-settings')||'null');if(saved){for(const k in settings)if(typeof saved[k]===typeof settings[k])settings[k]=saved[k];}}catch{}
settings.volume=Math.min(100,Math.max(0,settings.volume));settings.brightness=Math.min(145,Math.max(80,settings.brightness));settings.sensitivity=Math.min(170,Math.max(45,settings.sensitivity));
if(!['auto','detail','low'].includes(settings.quality))settings.quality='auto';
const player={...START};let playing=false,started=false,renderer,world,target,postScene,postCamera,postMaterial,camera,scene,input,terminals;
let savedRun=null;try{savedRun=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');}catch{}
const missions=new Missions(savedRun,text=>{hint(text,8);audio.signal?.();saveRun();});
function saveRun(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(missions.export(player)));}catch{}}
let lastSave=0;const iceRay=new T.Raycaster();
const audio=new Atmosphere();audio.setVolume(settings.volume/100);
let elapsed=0,last=performance.now(),lastMenuFrame=0,stride=0,distanceSinceStep=0,fpsSum=0,fpsCount=0,adaptive=1,lastResize=0,hintTimer;

function hint(text,seconds=6){$('#hint').textContent=text;$('#hint').classList.add('visible');clearTimeout(hintTimer);hintTimer=setTimeout(()=>$('#hint').classList.remove('visible'),seconds*1000);}
function saveSettings(){try{localStorage.setItem('umbral-v1-settings',JSON.stringify(settings));}catch{}}
function pause(){
  if(!playing)return;playing=false;terminals?.leave(false);saveRun();input?.setEnabled(false);audio.pause();$('#hud').hidden=true;$('#menu').hidden=false;
  $('#enter-label').textContent='CONTINUAR';$('#intro').innerHTML='Sigue aquí.<br>Todo sigue aquí.';$('#restart').hidden=false;$('#new-turn').hidden=false;$('#load-status').textContent=missions.objective();
}
function enter(){
  // These calls happen synchronously in the click handler: iOS audio unlock and
  // desktop Pointer Lock are never delayed behind texture loads or promises.
  const sound=audio.start();playing=true;started=true;input.setEnabled(true);input.lock();last=performance.now();
  $('#menu').hidden=true;$('#hud').hidden=false;$('#curtain').classList.add('clear');
  if(!sound)hint('Sonido no disponible en este navegador.');
  else if(!enter.shown){hint(input.touch?'IZQUIERDA  ·  CAMINA\nDERECHA  ·  MIRA · TOCA OPERAR':'W A S D  ·  CAMINA\nE  ·  OPERAR · ESC  ·  PAUSA',8);enter.shown=true;}
}
$('#enter').addEventListener('click',enter);$('#pause').addEventListener('click',pause);
$('#options').addEventListener('click',()=>{const open=$('#settings').hidden;$('#settings').hidden=!open;$('#options').setAttribute('aria-expanded',String(open));$('#options span').textContent=open?'−':'+';});
$('#restart').addEventListener('click',()=>{Object.assign(player,START);stride=0;distanceSinceStep=0;world.updateVisibility(player,renderer,elapsed,true);enter();});
$('#new-turn').addEventListener('click',()=>{missions.state=new Missions().state;missions.revision++;for(const t of world.terminals){t.page='home';t.message='';}Object.assign(player,START);world.updateVisibility(player,renderer,elapsed,true);saveRun();enter();hint('Nuevo turno. Acude a Control (03).',8);});
$('#interact').addEventListener('click',()=>{if(!playing)return;if(terminals.active)terminals.leave();else terminals.enter();});
for(const name of Object.keys(settings)){
  const el=$('#'+name);if(typeof settings[name]==='boolean')el.checked=settings[name];else el.value=settings[name];
  el.addEventListener('input',()=>{
    settings[name]=el.type==='checkbox'?el.checked:el.tagName==='SELECT'?el.value:Number(el.value);
    if(name==='volume')audio.setVolume(settings.volume/100);
    if(name==='quality'){adaptive=1;resize();}saveSettings();
  });
}
function texture(name){return new Promise((resolve,reject)=>new T.TextureLoader().load(new URL('./'+name+'.png',import.meta.url).href,t=>{
  t.colorSpace=T.SRGBColorSpace;t.magFilter=T.NearestFilter;t.minFilter=T.NearestMipmapNearestFilter;t.generateMipmaps=true;
  t.wrapS=t.wrapT=['decals','signs','station-map','glass'].includes(name)?T.ClampToEdgeWrapping:T.RepeatWrapping;t.anisotropy=1;resolve(t);
},undefined,()=>reject(Error('No se encontró '+name+'.png'))));}
function resize(){
  if(!renderer)return;const w=innerWidth,h=innerHeight,ratio=w/h;
  const base=(settings.quality==='detail'?480:settings.quality==='low'?300:400)*adaptive;
  let rw,rh;if(ratio>=1){rh=Math.min(base,h);rw=rh*ratio;}else{rw=Math.min(base,w);rh=rw/ratio;}
  const maxLong=settings.quality==='detail'?1152:900,scale=Math.min(1,maxLong/Math.max(rw,rh));rw=Math.max(160,Math.round(rw*scale));rh=Math.max(160,Math.round(rh*scale));
  renderer.setSize(rw,rh,false);target.setSize(rw,rh);camera.aspect=ratio;camera.fov=terminals?.active?50:ratio<1?76:68;camera.updateProjectionMatrix();
  postMaterial.uniforms.uResolution.value.set(rw,rh);lastResize=elapsed;
}
const vertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}`;
const fragment=`
precision highp float;
uniform sampler2D tScene;
uniform float uTime;uniform float uExposure;
uniform vec2 uResolution;varying vec2 vUv;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
vec3 srgb(vec3 v){return mix(v*12.92,1.055*pow(max(v,vec3(0.0)),vec3(1.0/2.4))-.055,step(vec3(.0031308),v));}
float bayer(vec2 p){vec2 a=mod(floor(p),2.0);vec2 b=mod(floor(p*.5),2.0);float x=2.0*a.x+3.0*a.y-4.0*a.x*a.y;float y=2.0*b.x+3.0*b.y-4.0*b.x*b.y;return (4.0*x+y)/16.0;}
void main(){
 vec3 c=texture2D(tScene,vUv).rgb*uExposure;
 c=srgb(c);
 // The scene already uses authored low-res textures, geometry and restrained light.
 // This final pass only supplies mild 5-bit colour stepping and fine analogue grain.
 vec2 pix=floor(vUv*uResolution);float d=bayer(pix)-.5;
 c=mix(c,floor(clamp(c,0.0,1.0)*31.0+d+.5)/31.0,.38);
 float grain=hash(pix+floor(uTime*11.0)*vec2(13.0,29.0))-.5;
 c+=grain*.018;
 vec2 v=(vUv-.5)*vec2(1.16,1.0);float shade=1.0-.40*smoothstep(.15,.75,length(v));
 c*=shade;gl_FragColor=vec4(clamp(c,0.0,1.0),1.0);
}`;
async function boot(){
  try{
    renderer=new T.WebGLRenderer({canvas,antialias:false,alpha:false,powerPreference:'high-performance',stencil:false,depth:true});
    renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.NoToneMapping;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;renderer.shadowMap.autoUpdate=false;
    scene=new T.Scene();scene.background=new T.Color(0x060906);scene.fog=new T.FogExp2(0x0a0d08,.035);
    camera=new T.PerspectiveCamera(68,innerWidth/innerHeight,.055,38);camera.rotation.order='YXZ';
    const maps={};let count=0;await Promise.all(TEX.map(async n=>{maps[n]=await texture(n);$('#load-status').textContent=`Preparando materiales… ${++count}/${TEX.length}`;}));
    world=buildStation(maps);scene.add(world.root);
    if(missions.state.position&&zoneAt(missions.state.position.x,missions.state.position.z)){Object.assign(player,missions.state.position);Object.assign(player,resolvePosition(player.x,player.z,world.colliders));if(!zoneAt(player.x,player.z))Object.assign(player,START);}
    audio.configure?.(LAMP_DATA);
    // Local contact darkening at wall-floor joins. No global metallic/PBR highlights.
    for(const [name,m] of Object.entries(world.materials)){
      if(!m.isMeshLambertMaterial)continue;m.flatShading=true;
      m.onBeforeCompile=shader=>{
        shader.vertexShader='attribute vec4 roomBounds; varying vec4 vRoomBounds; varying vec3 vPositionWorld;\n'+shader.vertexShader;
        shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvPositionWorld=(modelMatrix*vec4(transformed,1.0)).xyz;vRoomBounds=roomBounds;');
        shader.fragmentShader='varying vec4 vRoomBounds; varying vec3 vPositionWorld;\n'+shader.fragmentShader;
        shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
          float edge=min(min(vPositionWorld.x-vRoomBounds.x,vRoomBounds.z-vPositionWorld.x),min(vPositionWorld.z-vRoomBounds.y,vRoomBounds.w-vPositionWorld.z));
          float corners=mix(.64,1.0,smoothstep(0.0,.64,max(edge,0.0)));
          float base=mix(.70,1.0,smoothstep(0.0,.38,vPositionWorld.y));
          diffuseColor.rgb*=corners*base;
        `);
      };
      m.customProgramCacheKey=()=> 'umbral-contact-v2-bounds';
    }
    target=new T.WebGLRenderTarget(1,1,{minFilter:T.NearestFilter,magFilter:T.NearestFilter,depthBuffer:true,stencilBuffer:false});
    postMaterial=new T.ShaderMaterial({uniforms:{tScene:{value:target.texture},uTime:{value:0},uExposure:{value:settings.brightness/100},uResolution:{value:new T.Vector2(1,1)}},vertexShader:vertex,fragmentShader:fragment,depthTest:false,depthWrite:false});
    postScene=new T.Scene();postCamera=new T.OrthographicCamera(-1,1,1,-1,0,1);postScene.add(new T.Mesh(new T.PlaneGeometry(2,2),postMaterial));
    input=new Input(canvas,pause,()=>hint('Arrastra el ratón para mirar.\nTu navegador no activó la captura.',7));
    terminals=new Terminals(world,missions,canvas,camera,{
      open:()=>{input.setEnabled(false);$('#interact').textContent='E · SALIR';},
      close:resume=>{camera.fov=camera.aspect<1?76:68;camera.updateProjectionMatrix();updateCamera(0);if(resume&&playing){input.setEnabled(true);input.lock();}},
      notice:hint,tone:()=>audio.signal?.(),save:saveRun
    });
    window.addEventListener('keydown',e=>{if(!playing||e.repeat||e.defaultPrevented)return;if(e.code==='KeyE'&&!terminals.active){e.preventDefault();terminals.enter();}if(e.code==='KeyJ'&&!terminals.active)hint(missions.objective(),8);});
    if(input.touch)$('#controls').innerHTML='IZQUIERDA &nbsp; CAMINAR<br>DERECHA &nbsp; MIRAR &nbsp; · &nbsp; TOCA OPERAR';
    resize();window.addEventListener('resize',resize);window.visualViewport?.addEventListener('resize',resize);
    renderer.shadowMap.needsUpdate=true;updateCamera(0);render(0);
    if(renderer.info.programs?.some(p=>p.diagnostics?.runnable===false))throw Error('No se pudo compilar la imagen 3D.');
    $('#enter').disabled=false;$('#enter-label').textContent='ENTRAR';$('#load-status').textContent='';window.umbralReady=true;$('#curtain').classList.add('clear');
    last=performance.now();requestAnimationFrame(frame);
  }catch(e){console.error(e);window.umbralError(e.message.includes('WebGL')?'Este navegador no pudo iniciar WebGL 2. Abre la página en Safari actualizado o en un navegador de escritorio con aceleración gráfica.':e.message+' · Comprueba que todos los archivos estén juntos en el repositorio.');}
}
function updateCamera(dt){
  if(terminals?.active){if(playing){terminals.focus(dt);audio.update(dt,player);}return;}
  if(playing){
    const look=input.consumeLook(),scale=(input.touch?.0031:.0021)*settings.sensitivity/100;
    player.yaw-=Math.max(-300,Math.min(300,look.x))*scale;player.pitch-=Math.max(-300,Math.min(300,look.y))*scale;player.pitch=Math.max(-1.20,Math.min(1.20,player.pitch));
    const v=input.vector(),speed=1.50,dx=(v.x*Math.cos(player.yaw)+v.z*Math.sin(player.yaw))*speed*dt,dz=(-v.x*Math.sin(player.yaw)+v.z*Math.cos(player.yaw))*speed*dt;
    const ox=player.x,oz=player.z;movePlayer(player,dx,dz,world.colliders);const travelled=Math.hypot(player.x-ox,player.z-oz);
    stride+=travelled*10.1;distanceSinceStep+=travelled;if(distanceSinceStep>.70){distanceSinceStep%=.70;audio.step(player);}
    const moving=travelled>.0001?1:0;player.bobMix=(player.bobMix||0)+(moving-(player.bobMix||0))*Math.min(1,dt*9);
    audio.update(dt,player);
  }
  const motion=settings.bob?(player.bobMix||0):0;
  camera.position.set(player.x,1.64+Math.sin(stride)*.010*motion,player.z);
  camera.rotation.set(player.pitch,player.yaw,Math.sin(stride*.5)*.003*motion,'YXZ');
}
function render(t){
  if(world){world.updateVisibility(player,renderer,t);world.updateLights(t,settings.flicker);world.updateInstrumentState(missions.state,t);terminals?.tick(t);const f=missions.state.flash;world.iceUniforms.uFlash.value=f?Math.sin(Math.PI*f.elapsed/.17):0;if(f)world.iceUniforms.uFlashXY.value.set(f.u,f.v);}
  postMaterial.uniforms.uTime.value=t;postMaterial.uniforms.uExposure.value=settings.brightness/100;
  renderer.setRenderTarget(target);renderer.render(scene,camera);renderer.setRenderTarget(null);renderer.render(postScene,postCamera);
}
function frame(now){
  requestAnimationFrame(frame);const raw=(now-last)/1000;last=now;const dt=Math.min(.05,Math.max(0,raw));
  if(document.hidden)return;
  if(playing){
    elapsed+=dt;updateCamera(dt);
    if(!enter.taskShown&&elapsed>9){enter.taskShown=true;hint(missions.objective(),8);}
    const zone=zoneAt(player.x,player.z)?.id,fw=camera.getWorldDirection(new T.Vector3());
    let canObserve=false;
    if(missions.state.armed&&!terminals.active&&zone==='8'&&player.x>18.8&&player.z>19.8){
      iceRay.set(camera.position,fw);const hit=iceRay.intersectObject(world.ice)[0];
      if(hit?.uv&&hit.distance<5){const radius=WINDOW.width/(2*Math.sin(WINDOW.arc/2));
        for(let n=0;n<6;n++){const u=Math.max(.08,Math.min(.92,hit.uv.x+(Math.random()-.5)*.18)),v=Math.max(.22,Math.min(.73,hit.uv.y+(Math.random()-.5)*.16)),a=-WINDOW.arc/2+u*WINDOW.arc,p=new T.Vector3(WINDOW.cx+Math.sin(a)*radius,WINDOW.bottom+v*WINDOW.height,WINDOW.front+(Math.cos(a)-Math.cos(WINDOW.arc/2))*radius).project(camera);
          if(Math.abs(p.x)<.72&&Math.abs(p.y)<.72&&p.z<1){canObserve={u,v};break;}
        }
      }
    }
    missions.tick(dt,zone,canObserve);
    const near=terminals.find(player);$('#interact').hidden=!near;$('#interact').textContent=terminals.active?(input.touch?'SALIR':'E · SALIR'):(input.touch?'OPERAR':'E · OPERAR');
    if(elapsed-lastSave>5){saveRun();lastSave=elapsed;}
    if(settings.quality==='auto'&&elapsed>5){
      fpsSum+=raw;fpsCount++;
      if(fpsCount>=180){const ms=1000*fpsSum/fpsCount;if(ms>24&&adaptive>.75&&elapsed-lastResize>6){adaptive=Math.max(.75,adaptive-.1);resize();}fpsSum=0;fpsCount=0;}
    }
  }else if(now-lastMenuFrame<90)return;
  lastMenuFrame=now;render(elapsed);
}
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();pause();window.umbralError('Safari liberó la memoria gráfica. Pulsa VOLVER A INTENTAR para recuperar las habitaciones.');});
window.addEventListener('blur',()=>{if(terminals?.active)pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
window.addEventListener('pagehide',()=>{pause();audio.pause();});
boot();

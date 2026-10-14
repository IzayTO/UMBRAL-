import * as T from './three.module.min.js';
import {TEX,START,LAMPS,buildWorld,batchWorld} from './world.js';
import {movePlayer} from './physics.js';
import {Input} from './input.js';
import {Atmosphere} from './audio.js';

const $=s=>document.querySelector(s),canvas=$('#view');
const settings={volume:58,brightness:105,sensitivity:95,quality:'auto',bob:!matchMedia('(prefers-reduced-motion:reduce)').matches,flicker:!matchMedia('(prefers-reduced-motion:reduce)').matches};
try{const saved=JSON.parse(localStorage.getItem('umbral-v1-settings')||'null');if(saved){for(const k in settings)if(typeof saved[k]===typeof settings[k])settings[k]=saved[k];}}catch{}
settings.volume=Math.min(100,Math.max(0,settings.volume));settings.brightness=Math.min(145,Math.max(80,settings.brightness));settings.sensitivity=Math.min(170,Math.max(45,settings.sensitivity));
if(!['auto','detail','low'].includes(settings.quality))settings.quality='auto';
const player={...START};let playing=false,started=false,renderer,world,target,postScene,postCamera,postMaterial,camera,scene,input;
const audio=new Atmosphere();audio.setVolume(settings.volume/100);
let elapsed=0,last=performance.now(),lastMenuFrame=0,stride=0,distanceSinceStep=0,fpsSum=0,fpsCount=0,adaptive=1,lastResize=0,hintTimer;

function hint(text,seconds=6){$('#hint').textContent=text;$('#hint').classList.add('visible');clearTimeout(hintTimer);hintTimer=setTimeout(()=>$('#hint').classList.remove('visible'),seconds*1000);}
function saveSettings(){try{localStorage.setItem('umbral-v1-settings',JSON.stringify(settings));}catch{}}
function pause(){
  if(!playing)return;playing=false;input?.setEnabled(false);audio.pause();$('#hud').hidden=true;$('#menu').hidden=false;
  $('#enter-label').textContent='CONTINUAR';$('#intro').innerHTML='Sigue aquí.<br>Todo sigue aquí.';$('#restart').hidden=false;
}
function enter(){
  // These calls happen synchronously in the click handler: iOS audio unlock and
  // desktop Pointer Lock are never delayed behind texture loads or promises.
  const sound=audio.start();playing=true;started=true;input.setEnabled(true);input.lock();last=performance.now();
  $('#menu').hidden=true;$('#hud').hidden=false;$('#curtain').classList.add('clear');
  if(!sound)hint('Sonido no disponible en este navegador.');
  else if(!enter.shown){hint(input.touch?'IZQUIERDA  ·  CAMINA\nDERECHA  ·  MIRA':'W A S D  ·  CAMINA\nESC  ·  PAUSA',8);enter.shown=true;}
}
$('#enter').addEventListener('click',enter);$('#pause').addEventListener('click',pause);
$('#options').addEventListener('click',()=>{const open=$('#settings').hidden;$('#settings').hidden=!open;$('#options').setAttribute('aria-expanded',String(open));$('#options span').textContent=open?'−':'+';});
$('#restart').addEventListener('click',()=>{Object.assign(player,START);stride=0;distanceSinceStep=0;enter();});
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
  t.wrapS=t.wrapT=name==='decals'?T.ClampToEdgeWrapping:T.RepeatWrapping;t.anisotropy=1;resolve(t);
},undefined,()=>reject(Error('No se encontró '+name+'.png'))));}
function resize(){
  if(!renderer)return;const w=innerWidth,h=innerHeight,ratio=w/h;
  const base=(settings.quality==='detail'?480:settings.quality==='low'?300:400)*adaptive;
  let rw,rh;if(ratio>=1){rh=Math.min(base,h);rw=rh*ratio;}else{rw=Math.min(base,w);rh=rw/ratio;}
  const maxLong=settings.quality==='detail'?1152:900,scale=Math.min(1,maxLong/Math.max(rw,rh));rw=Math.max(160,Math.round(rw*scale));rh=Math.max(160,Math.round(rh*scale));
  renderer.setSize(rw,rh,false);target.setSize(rw,rh);camera.aspect=ratio;camera.fov=ratio<1?76:68;camera.updateProjectionMatrix();
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
    camera=new T.PerspectiveCamera(68,innerWidth/innerHeight,.055,22);camera.rotation.order='YXZ';
    const maps={};let count=0;await Promise.all(TEX.map(async n=>{maps[n]=await texture(n);$('#load-status').textContent=`Preparando materiales… ${++count}/${TEX.length}`;}));
    world=batchWorld(buildWorld(maps));scene.add(world.root);
    // Local contact darkening at wall-floor joins. No global metallic/PBR highlights.
    for(const [name,m] of Object.entries(world.materials)){
      if(m.isMeshBasicMaterial)continue;m.flatShading=true;
      m.onBeforeCompile=shader=>{
        shader.vertexShader='varying vec3 vPositionWorld;\n'+shader.vertexShader;
        shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvPositionWorld=(modelMatrix*vec4(transformed,1.0)).xyz;');
        shader.fragmentShader='varying vec3 vPositionWorld;\n'+shader.fragmentShader;
        shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
          float edge=min(3.0-abs(vPositionWorld.x),6.12-abs(vPositionWorld.z));
          if(vPositionWorld.x < -.82 || vPositionWorld.x > 1.04)edge=min(edge,abs(vPositionWorld.z)-.12);
          float corners=mix(.64,1.0,smoothstep(0.0,.64,max(edge,0.0)));
          float base=mix(.70,1.0,smoothstep(0.0,.38,vPositionWorld.y));
          diffuseColor.rgb*=corners*base;
        `);
      };
      m.customProgramCacheKey=()=> 'umbral-contact-v1';
    }
    target=new T.WebGLRenderTarget(1,1,{minFilter:T.NearestFilter,magFilter:T.NearestFilter,depthBuffer:true,stencilBuffer:false});
    postMaterial=new T.ShaderMaterial({uniforms:{tScene:{value:target.texture},uTime:{value:0},uExposure:{value:settings.brightness/100},uResolution:{value:new T.Vector2(1,1)}},vertexShader:vertex,fragmentShader:fragment,depthTest:false,depthWrite:false});
    postScene=new T.Scene();postCamera=new T.OrthographicCamera(-1,1,1,-1,0,1);postScene.add(new T.Mesh(new T.PlaneGeometry(2,2),postMaterial));
    input=new Input(canvas,pause,()=>hint('Arrastra el ratón para mirar.\nTu navegador no activó la captura.',7));
    if(input.touch)$('#controls').innerHTML='IZQUIERDA &nbsp; CAMINAR<br>DERECHA &nbsp; MIRAR &nbsp; · &nbsp; Ⅱ &nbsp; PAUSA';
    resize();window.addEventListener('resize',resize);window.visualViewport?.addEventListener('resize',resize);
    renderer.shadowMap.needsUpdate=true;updateCamera(0);render(0);
    if(renderer.info.programs?.some(p=>p.diagnostics?.runnable===false))throw Error('No se pudo compilar la imagen 3D.');
    $('#enter').disabled=false;$('#enter-label').textContent='ENTRAR';$('#load-status').textContent='';window.umbralReady=true;$('#curtain').classList.add('clear');
    last=performance.now();requestAnimationFrame(frame);
  }catch(e){console.error(e);window.umbralError(e.message.includes('WebGL')?'Este navegador no pudo iniciar WebGL 2. Abre la página en Safari actualizado o en un navegador de escritorio con aceleración gráfica.':e.message+' · Comprueba que todos los archivos estén juntos en el repositorio.');}
}
function updateCamera(dt){
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
  if(world){for(let i=0;i<2;i++){
    const variation=settings.flicker?(1+.009*Math.sin(t*4.7+i)+.008*Math.sin(t*9.3+i*3))*(1-.055*Math.pow(Math.max(0,Math.sin(t*.17+i*2.4)),36)):1;
    world.lamps[i].intensity=LAMPS[i].intensity*variation;
  }}
  postMaterial.uniforms.uTime.value=t;postMaterial.uniforms.uExposure.value=settings.brightness/100;
  renderer.setRenderTarget(target);renderer.render(scene,camera);renderer.setRenderTarget(null);renderer.render(postScene,postCamera);
}
function frame(now){
  requestAnimationFrame(frame);const raw=(now-last)/1000;last=now;const dt=Math.min(.05,Math.max(0,raw));
  if(document.hidden)return;
  if(playing){
    elapsed+=dt;updateCamera(dt);
    if(settings.quality==='auto'&&elapsed>5){
      fpsSum+=raw;fpsCount++;
      if(fpsCount>=180){const ms=1000*fpsSum/fpsCount;if(ms>24&&adaptive>.75&&elapsed-lastResize>6){adaptive=Math.max(.75,adaptive-.1);resize();}fpsSum=0;fpsCount=0;}
    }
  }else if(now-lastMenuFrame<90)return;
  lastMenuFrame=now;render(elapsed);
}
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();pause();window.umbralError('Safari liberó la memoria gráfica. Pulsa VOLVER A INTENTAR para recuperar las habitaciones.');});
window.addEventListener('pagehide',()=>{pause();audio.pause();});
boot();

import * as T from './three.module.min.js';
import {WINDOW} from './layout.js?v=3.1.1';
// Artistic secondary-particle light, never a directly visible neutrino.
// Ambient cues are independent of mapOwned, briefing, mission and authorization.
export const FLASH_SECONDS=1.2;
export const flashEnvelope=t=>t<0||t>=FLASH_SECONDS?0:t<.04?t/.04:Math.pow(1-(t-.04)/1.16,1.8);
const radius=WINDOW.width/(2*Math.sin(WINDOW.arc/2));
const point=new T.Vector3(),ray=new T.Raycaster(),ndc=new T.Vector2();
export function visibleIceSpot(camera,world,zone,random=Math.random){
 if(!['7','h78','8'].includes(zone)||!world.ice.visible)return false;
 camera.updateMatrixWorld();
 // Pick across the complete window, then reject points outside the view. No
 // hidden mission or tiny floor-position trigger is involved.
 for(let i=0;i<24;i++){
  const u=.035+random()*.93,v=.08+random()*.84,a=-WINDOW.arc/2+u*WINDOW.arc;
  point.set(WINDOW.cx+Math.sin(a)*radius,WINDOW.bottom+v*WINDOW.height,WINDOW.front+(Math.cos(a)-Math.cos(WINDOW.arc/2))*radius);
  if(point.distanceToSquared(camera.position)>150)continue;
  const direction=point.clone().sub(camera.position).normalize();
  if(direction.dot(camera.getWorldDirection(new T.Vector3()))<.1)continue;
  const target=point.clone(),p=point.project(camera);if(Math.abs(p.x)>.9||Math.abs(p.y)>.86||p.z>1)continue;
  // A portal must actually expose the pane; wall segments also occlude this cue.
  let blocked=false;for(const w of world.walls){const d=w.axis==='x'?target.x-camera.position.x:target.z-camera.position.z;if(Math.abs(d)<1e-6)continue;const t=(w.line-(w.axis==='x'?camera.position.x:camera.position.z))/d;if(t<=0||t>=1)continue;const cross=w.axis==='x'?camera.position.z+(target.z-camera.position.z)*t:camera.position.x+(target.x-camera.position.x)*t;if(cross>w.lo&&cross<w.hi){blocked=true;break;}}
  if(!blocked)return {u,v};
 }
 // Deterministic fallback: narrow portrait views must not lose readiness just
 // because none of the random samples landed in the visible strip this frame.
 for(const [x,y] of [[0,0],[-.5,0],[.5,0],[0,.5],[0,-.5],[-.6,.5],[.6,.5],[-.6,-.5],[.6,-.5]]){
  ray.setFromCamera(ndc.set(x,y),camera);const hit=ray.intersectObject(world.ice)[0];if(!hit?.uv||hit.distance>12)continue;
  let blocked=false;for(const w of world.walls){const d=w.axis==='x'?hit.point.x-camera.position.x:hit.point.z-camera.position.z;if(Math.abs(d)<1e-6)continue;const t=(w.line-(w.axis==='x'?camera.position.x:camera.position.z))/d;if(t<=0||t>=1)continue;const cross=w.axis==='x'?camera.position.z+(hit.point.z-camera.position.z)*t:camera.position.x+(hit.point.x-camera.position.x)*t;if(cross>w.lo&&cross<w.hi){blocked=true;break;}}
  if(!blocked&&hit.uv.x>.025&&hit.uv.x<.975&&hit.uv.y>.04&&hit.uv.y<.96)return {u:hit.uv.x,v:hit.uv.y};
 }return false;
}
export class IceActivity{
 constructor(random=Math.random){this.random=random;this.reset();}
 reset(){this.next=null;this.ambient=null;this.inSector=false;}
 update(dt,state,visibleSpot,uniforms,zone){
  const sector=zone?['7','h78','8'].includes(zone):state.visited.includes('7')||state.visited.includes('8');
  if(!sector){this.next=null;this.ambient=null;this.inSector=false;uniforms.uFlash.value=0;return;}
  if(!this.inSector){this.inSector=true;this.next=state.time+2+this.random()*4;}
  if(this.next===null)this.next=state.time+2+this.random()*4;
  // Countdown continues while the room is active; on returning to a visible
 // pane a fresh cue is due within 2–6 s, without a backlog of expired flashes.
  if(!visibleSpot){this.ambient=null;this.next=Math.min(this.next,state.time+2);}
  if(visibleSpot&&state.time>=this.next&&!state.flash){
   this.next=state.time+2+this.random()*4;
   const distance=this.random();this.ambient={elapsed:0,u:visibleSpot.u,v:visibleSpot.v,scale:.65+distance*1.55,intensity:.65+distance*.75,hollow:this.random()<.38?1:0};
  }
  if(this.ambient){this.ambient.elapsed+=dt;if(this.ambient.elapsed>=FLASH_SECONDS)this.ambient=null;}
  const f=state.flash||this.ambient;uniforms.uFlash.value=f&&visibleSpot?flashEnvelope(f.elapsed)*(f.intensity||1):0;
  uniforms.uFlashScale.value=f?(f.scale||1.2)*(.3+.7*Math.min(1,f.elapsed/.04)):1;
  if(uniforms.uHollow)uniforms.uHollow.value=f?.hollow||0;
  if(f)uniforms.uFlashXY.value.set(f.u,f.v);
 }
}

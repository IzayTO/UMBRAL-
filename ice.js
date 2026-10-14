// The optical cues are an artistic representation of secondary-particle light.
// The GPU effect is suspended whenever the physical window is not being viewed.
export const flashEnvelope=t=>t<0||t>=1.02?0:t<.04?t/.04:Math.pow(1-(t-.04)/.98,2.25);
export class IceActivity{
 constructor(){this.next=null;this.ambient=null;this.lastMain=false;}
 reset(){this.next=null;this.ambient=null;}
 update(dt,state,visibleSpot,uniforms){
  const enabled=state.visited.includes('7')||state.visited.includes('8');
  if(enabled&&this.next===null)this.next=state.time+38+Math.random()*100;
  if(enabled&&state.time>=this.next){this.next=state.time+35+Math.random()**.5*165;if(visibleSpot&&!state.armed&&!state.flash&&Math.random()<.38)this.ambient={elapsed:0,u:visibleSpot.u,v:visibleSpot.v,scale:.6+Math.random()*.8,intensity:.4+Math.random()*.6};}
  if(!visibleSpot||state.armed||state.flash)this.ambient=null;
  if(this.ambient){this.ambient.elapsed+=dt;if(this.ambient.elapsed>=1.02)this.ambient=null;}
  const f=state.flash||this.ambient;uniforms.uFlash.value=f&&visibleSpot?flashEnvelope(f.elapsed)*(f.intensity||1):0;
  uniforms.uFlashScale.value=f?(f.scale||1)*(.35+.65*Math.min(1,f.elapsed/.04)):1;if(f)uniforms.uFlashXY.value.set(f.u,f.v);
 }
}

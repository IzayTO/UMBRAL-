import {zoneAt,LAMP_DATA} from './layout.js?v=2.0';
// Procedural environmental sound. No music, downloaded recordings or jump cues.
// AudioContext is only created inside the user's ENTRAR gesture.
export class Atmosphere {
  constructor(){this.ctx=null;this.volume=.58;this.muted=false;this.active=false;this.nextEvent=9;this.elapsed=0;this.nodes=[];this.stepSide=1;}
  configure(lamps){this.sources=lamps;}
  start(){
    if(!this.ctx){const C=window.AudioContext||window.webkitAudioContext;if(!C)return false;
      try{this.ctx=new C({latencyHint:'interactive'});this.build();}catch{this.ctx=null;return false;}}
    this.active=true;this.ctx.resume().catch(()=>{});this.applyVolume();return true;
  }
  noiseBuffer(seconds=3){const c=this.ctx,b=c.createBuffer(1,Math.ceil(c.sampleRate*seconds),c.sampleRate),a=b.getChannelData(0);let last=0;
    for(let i=0;i<a.length;i++){last=(last+.025*(Math.random()*2-1))/1.025;a[i]=last*4.1;}
    // Make the noise bed periodic so looping introduces no click.
    const drift=a[a.length-1]-a[0];for(let i=0;i<a.length;i++)a[i]-=drift*i/(a.length-1);return b;}
  build(){
    const c=this.ctx;
    this.master=c.createGain();this.master.gain.value=0;
    const limit=c.createDynamicsCompressor();limit.threshold.value=-16;limit.knee.value=16;limit.ratio.value=4;limit.attack.value=.012;limit.release.value=.25;
    const lowCut=c.createBiquadFilter();lowCut.type='highpass';lowCut.frequency.value=28;
    this.master.connect(lowCut);lowCut.connect(limit);limit.connect(c.destination);
    this.verb=c.createConvolver();const ir=c.createBuffer(2,c.sampleRate*1.15,c.sampleRate);
    for(let ch=0;ch<2;ch++){let d=ir.getChannelData(ch);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.exp(-i/(c.sampleRate*.21))*.35;}
    this.verb.buffer=ir;const wet=c.createGain();wet.gain.value=.22;this.verb.connect(wet);wet.connect(this.master);
    this.noise=this.noiseBuffer(4);this.shortNoise=this.noiseBuffer(.3);
    this.hums=[this.hum([-.65,2.2,2.35],49,.031),this.hum([.6,2.2,-3.05],57,.027)];
    const rumble=c.createBufferSource();rumble.buffer=this.noise;rumble.loop=true;
    const filter=c.createBiquadFilter();filter.type='lowpass';filter.frequency.value=140;
    this.drone=c.createGain();this.drone.gain.value=.075;rumble.connect(filter);filter.connect(this.drone);this.drone.connect(this.master);rumble.start();
    // Slow unrelated oscillations keep the bed from becoming a musical pulse.
    const air=c.createBufferSource();air.buffer=this.noise;air.loop=true;
    const band=c.createBiquadFilter();band.type='bandpass';band.frequency.value=560;band.Q.value=.7;
    this.air=c.createGain();this.air.gain.value=.045;air.connect(band);band.connect(this.air);this.air.connect(this.master);air.start();
  }
  spatial(x,y,z){
    const p=this.ctx.createPanner();p.panningModel='equalpower';p.distanceModel='inverse';p.refDistance=1.0;p.maxDistance=14;p.rolloffFactor=.75;
    if(p.positionX){p.positionX.value=x;p.positionY.value=y;p.positionZ.value=z;}else p.setPosition(x,y,z);
    return p;
  }
  hum(pos,hz,volume){
    const c=this.ctx,g=c.createGain(),filter=c.createBiquadFilter(),p=this.spatial(...pos);
    g.gain.value=volume;filter.type='lowpass';filter.frequency.value=900;
    for(const [f,amp] of [[hz,1],[hz*2,.33],[hz*3,.12]]){
      const o=c.createOscillator(),gain=c.createGain();o.type='sine';o.frequency.value=f;gain.gain.value=amp;o.connect(gain);gain.connect(filter);o.start();
    }
    filter.connect(g);g.connect(p);p.connect(this.master);g.connect(this.verb);
    return {gain:g,filter,volume,pos,panner:p};
  }
  applyVolume(){if(this.ctx)this.master.gain.setTargetAtTime(this.active&&!this.muted?this.volume:0,this.ctx.currentTime,.12);}
  setVolume(v){this.volume=Math.max(0,Math.min(1,v));this.applyVolume();}
  setMuted(v){this.muted=v;this.applyVolume();}
  pause(){this.active=false;this.applyVolume();if(this.ctx){clearTimeout(this.suspendTimer);this.suspendTimer=setTimeout(()=>{if(!this.active)this.ctx.suspend().catch(()=>{});},500);}}
  update(dt,player){
    if(!this.ctx||!this.active)return;const c=this.ctx,now=c.currentTime;this.elapsed+=dt;
    const l=c.listener,fx=-Math.sin(player.yaw),fz=-Math.cos(player.yaw);
    if(l.positionX){l.positionX.setTargetAtTime(player.x,now,.03);l.positionY.value=1.64;l.positionZ.setTargetAtTime(player.z,now,.03);l.forwardX.setTargetAtTime(fx,now,.03);l.forwardY.value=0;l.forwardZ.setTargetAtTime(fz,now,.03);l.upX.value=0;l.upY.value=1;l.upZ.value=0;}
    else{l.setPosition(player.x,1.64,player.z);l.setOrientation(fx,0,fz,0,1,0);}
    const breath=.76+.10*Math.sin(this.elapsed*.19)+.09*Math.sin(this.elapsed*.071+1.4);
    const quiet=(Math.sin(this.elapsed*.049+1.7)>.90)?.28:1;
    this.drone.gain.setTargetAtTime(.065*breath*quiet,now,.6);this.air.gain.setTargetAtTime(.035*quiet,now,.7);
    const current=zoneAt(player.x,player.z)?.id;
    if(this.elapsed>(this.nextSource||0)){
      this.nextSource=this.elapsed+.4;
      const sources=[...(this.sources||LAMP_DATA)].sort((a,b)=>Math.hypot(a.position[0]-player.x,a.position[2]-player.z)-Math.hypot(b.position[0]-player.x,b.position[2]-player.z)).slice(0,2);
      this.hums.forEach((h,i)=>{const src=sources[i];h.pos=src.position;h.zone=src.zone;const p=h.panner;if(p.positionX){p.positionX.setTargetAtTime(h.pos[0],now,.25);p.positionY.value=h.pos[1];p.positionZ.setTargetAtTime(h.pos[2],now,.25);}else p.setPosition(...h.pos);});
    }
    this.air.gain.setTargetAtTime((current==='4'?.051:current==='8'?.023:.035)*quiet,now,.8);
    for(const h of this.hums){
      const same=current===h.zone,occ=same?1:.16;
      h.gain.gain.setTargetAtTime(h.volume*occ*(.96+.04*Math.sin(this.elapsed*1.2)),now,.3);
      h.filter.frequency.setTargetAtTime(same?900:190,now,.3);
    }
    if(this.elapsed>this.nextEvent){this.nextEvent=this.elapsed+12+Math.random()*22;if(Math.random()>.22)this.event(player);}
  }
  event(player){
    // Soft expansions in pipes, usually in the adjacent room, never in the player's face.
    const c=this.ctx,t=c.currentTime,near=[...(this.sources||LAMP_DATA)].sort((a,b)=>Math.hypot(a.position[0]-player.x,a.position[2]-player.z)-Math.hypot(b.position[0]-player.x,b.position[2]-player.z)),src=near[Math.min(near.length-1,1+Math.floor(Math.random()*2))],pos=[src.position[0]+.6,1.7,src.position[2]],p=this.spatial(...pos);
    const g=c.createGain();g.gain.value=.50;p.connect(g);g.connect(this.master);p.connect(this.verb);
    const base=160+Math.random()*150,duration=1.5+Math.random()*1.2;
    for(const [mult,amp] of [[1,.016],[2.31,.008],[4.12,.0035]]){
      const o=c.createOscillator(),e=c.createGain();o.type='sine';o.frequency.value=base*mult;
      e.gain.setValueAtTime(0,t);e.gain.linearRampToValueAtTime(amp,t+.055);e.gain.exponentialRampToValueAtTime(.00001,t+duration);
      o.connect(e);e.connect(p);o.start(t);o.stop(t+duration+.1);o.onended=()=>{o.disconnect();e.disconnect();};
    }
    setTimeout(()=>{p.disconnect();g.disconnect();},(duration+.2)*1000);
  }
  signal(){
    if(!this.ctx||!this.active)return;
    const c=this.ctx,t=c.currentTime,o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=720;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.012,t+.007);g.gain.exponentialRampToValueAtTime(.0001,t+.07);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+.08);o.onended=()=>{o.disconnect();g.disconnect();};
  }
  step(player){
    if(!this.ctx||!this.active)return;const c=this.ctx,t=c.currentTime,metal=zoneAt(player.x,player.z)?.id.startsWith('h');
    const src=c.createBufferSource();src.buffer=this.shortNoise;src.playbackRate.value=.85+Math.random()*.28;
    const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=metal?1150:640;
    const g=c.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(metal?.18:.13,t+.016);g.gain.exponentialRampToValueAtTime(.0001,t+.18);
    const p=c.createStereoPanner();p.pan.value=.10*this.stepSide;this.stepSide*=-1;
    src.connect(f);f.connect(g);g.connect(p);p.connect(this.master);g.connect(this.verb);src.start(t);src.stop(t+.2);
    src.onended=()=>{src.disconnect();f.disconnect();g.disconnect();p.disconnect();};
    const thud=c.createOscillator(),e=c.createGain();thud.frequency.setValueAtTime(metal?108:70,t);thud.frequency.exponentialRampToValueAtTime(40,t+.14);
    e.gain.setValueAtTime(.045,t);e.gain.exponentialRampToValueAtTime(.0001,t+.16);thud.connect(e);e.connect(this.master);thud.start(t);thud.stop(t+.17);thud.onended=()=>{thud.disconnect();e.disconnect();};
  }
}

import {zoneAt} from './layout.js?v=3.0';
// Three shared machine voices: proximity/room occlusion, no extra global drone.
export class MachineryAudio{
 constructor(atmosphere){this.a=atmosphere;this.next=0;this.time=0;this.voices=[];const a=atmosphere,c=a.ctx;
  for(let i=0;i<3;i++){const source=c.createBufferSource();source.buffer=a.noise;source.loop=true;const filter=c.createBiquadFilter();filter.type='bandpass';filter.Q.value=3;const g=c.createGain();g.gain.value=0;const p=a.spatial(0,1.4,0);source.connect(filter);filter.connect(g);g.connect(p);p.connect(a.master);source.start();this.voices.push({source,filter,g,p,id:null,nextClick:0});}
 }
 update(dt,player,state){if(!state||!this.a.machineSources?.length)return;const a=this.a,c=a.ctx,now=c.currentTime,zone=zoneAt(player.x,player.z)?.id;this.time+=dt;
  if(this.time>=this.next){this.next=this.time+.45;const chosen=a.machineSources.map(d=>({d,dist:Math.hypot(player.x-d.x,player.z-d.z),issue:state.director.active.find(e=>e.device===d.id)})).filter(o=>o.dist<11).sort((x,y)=>(x.dist-(x.issue?2:0))-(y.dist-(y.issue?2:0))).slice(0,3),remaining=chosen.filter(x=>!this.voices.some(v=>v.id===x.d.id));
   for(const v of this.voices){let item=chosen.find(x=>x.d.id===v.id);if(!item)item=remaining.shift();v.current=item;if(!item){v.id=null;continue;}v.id=item.d.id;const p=v.p,d=item.d;if(p.positionX){p.positionX.setTargetAtTime(d.x,now,.15);p.positionY.value=d.y;p.positionZ.setTargetAtTime(d.z,now,.15);}else p.setPosition(d.x,d.y,d.z);}
  }
  for(const v of this.voices){const item=v.current;if(!item){v.g.gain.setTargetAtTime(0,now,.25);continue;}const {d,dist}=item,e=state.director.active.find(e=>e.device===d.id),abnormal=e&&!e.benign,occ=d.zone===zone?1:.13;
   let frequency=d.id==='fan'?175:d.id==='pipe'?222:d.id==='comms'?460:d.id==='printer'?710:330;
   const rattle=abnormal&&d.id==='fan'?Math.abs(state.controls.fanTrim-e.target):abnormal&&d.id==='pipe'?Math.abs(state.controls.pipeFlow-.45)*4:0;
   const modulation=rattle?(.5+.5*Math.sin(this.time*(7+rattle))**2):1,volume=(d.id==='printer'?(e?.024:.0015):.010+(e?.012:0))*modulation*occ*Math.min(1,Math.max(0,(11-dist)/3));
   v.filter.frequency.setTargetAtTime(d.zone===zone?frequency:120,now,.2);v.filter.Q.setTargetAtTime(abnormal?7:2,now,.25);v.g.gain.setTargetAtTime(volume,now,.10);
   if(e&&['relay','printer','comms','lamp'].includes(d.id)&&this.time>v.nextClick){v.nextClick=this.time+.6+Math.random()*3.5;if(d.id!=='relay'||state.controls.relayPower)this.contact(d,occ,e.benign?.4:1);}
  }
 }
 contact(d,occ,strength){const a=this.a,c=a.ctx,t=c.currentTime,o=c.createOscillator(),g=c.createGain(),p=a.spatial(d.x,d.y,d.z);o.type='sine';o.frequency.value=d.id==='relay'?380:210;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.013*occ*strength,t+.006);g.gain.exponentialRampToValueAtTime(.00001,t+.085);o.connect(g);g.connect(p);p.connect(a.master);o.start(t);o.stop(t+.11);o.onended=()=>{o.disconnect();g.disconnect();p.disconnect();};}
}

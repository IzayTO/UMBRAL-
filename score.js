// Original small score, composed as sparse cells, not a continuous horror loop.
// Notes are scheduled on the audio clock. Four reusable voices bound CPU/nodes.
export const CELLS=[
 {notes:[40,47,54],at:[0,5.5,13],length:25},
 {notes:[38,45,52,50],at:[0,7,15,20],length:33},
 {notes:[40,52,47],at:[0,9,17],length:30},
 {notes:[42,49,52,47],at:[0,6,14,23],length:35}
];
export const faultPressure=s=>{
 const ages=s.director.active.filter(e=>!e.benign).map(e=>s.time-e.started);
 if(s.fault&&!s.repaired&&s.warningAt!==null)ages.push(s.time-s.warningAt);
 return Math.min(1,ages.reduce((v,a)=>v+Math.max(0,a-60)/160,0));
};
export class UnderIceScore{
 constructor(atmosphere){this.a=atmosphere;this.tension=0;this.next=8;this.lastCell=-1;this.voices=[];const c=atmosphere.ctx;
  this.bus=c.createGain();this.bus.gain.value=.68;
  this.filter=c.createBiquadFilter();this.filter.type='lowpass';this.filter.frequency.value=780;this.filter.Q.value=.52;
  const body=c.createBiquadFilter();body.type='peaking';body.frequency.value=310;body.Q.value=.65;body.gain.value=2.8;
  this.bus.connect(this.filter);this.filter.connect(body);body.connect(atmosphere.master);
  const send=c.createGain();send.gain.value=.24;body.connect(send);send.connect(atmosphere.verb);
  const real=new Float32Array(12),imag=new Float32Array(12);[0,1,.15,.28,.045,.07,.015,.03].forEach((v,i)=>imag[i]=v);const wave=c.createPeriodicWave(real,imag);
  for(let i=0;i<4;i++){const osc=c.createOscillator(),overtone=c.createOscillator(),gain=c.createGain(),partial=c.createGain(),pan=c.createStereoPanner();osc.setPeriodicWave(wave);overtone.type='sine';partial.gain.value=.12;gain.gain.value=0;pan.pan.value=[-.32,.28,-.17,.12][i];osc.connect(gain);overtone.connect(partial);partial.connect(gain);gain.connect(pan);pan.connect(this.bus);osc.start();overtone.start();this.voices.push({osc,overtone,gain,pan,until:0});}
 }
 note(midi,start,duration,level=.045){const v=this.voices.find(v=>v.until<=start);if(!v)return;const hz=440*2**((midi-69)/12),c=this.a.ctx;v.until=start+duration+.08;
  v.osc.frequency.setValueAtTime(hz,start);v.osc.detune.setValueAtTime(-2.5,start);v.osc.detune.linearRampToValueAtTime(2.2,start+duration);
  v.overtone.frequency.setValueAtTime(hz*(2.003+this.tension*.009),start);
  const a=v.gain.gain;a.cancelScheduledValues(start);a.setValueAtTime(.00001,start);a.linearRampToValueAtTime(level,start+1.6);a.setTargetAtTime(level*.60,start+3,2.5);a.setTargetAtTime(.00001,start+duration-4,1.1);a.setValueAtTime(0,start+duration);
 }
 update(dt,s,zone){const c=this.a.ctx,now=c.currentTime,target=faultPressure(s);if(s.time<(this.lastTime||0)){this.next=s.time+8;this.tension=0;for(const v of this.voices){v.gain.gain.cancelScheduledValues(now);v.gain.gain.setTargetAtTime(0,now,.5);v.until=now+.6;}}this.lastTime=s.time;this.tension+=(target-this.tension)*(1-Math.exp(-dt/(target>this.tension?18:30)));
  // The colour is muffled, not inaudible. Local machinery keeps its articulation.
  this.filter.frequency.setTargetAtTime((zone==='8'?620:850)-this.tension*170,now,3);
  this.bus.gain.setTargetAtTime((s.job?.kind==='calibrate'?.45:.68)+this.tension*.10,now,2);
  if(s.time<this.next)return;
  let cell=(this.lastCell+1+Math.floor(Math.random()*3))%CELLS.length;this.lastCell=cell;const phrase=CELLS[cell],level=.035+this.tension*.014;
  for(let i=0;i<phrase.notes.length;i++)this.note(phrase.notes[i],now+phrase.at[i],11+(i===0?7:0),level*(i===0?1:.72));
  if(this.tension>.30)this.note(phrase.notes[0]+13,now+2,16,.017*this.tension);
  this.next=s.time+phrase.length+18+Math.random()*35-this.tension*13;
 }
}

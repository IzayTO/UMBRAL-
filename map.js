import {ZONES,ROOMS,PORTALS} from './layout.js?v=3.0';
export const MAP_TRANSFORM={x:45,y:63,scale:16};
export const mapPoint=(x,z)=>({x:MAP_TRANSFORM.x+x*16,y:MAP_TRANSFORM.y+z*16});
export function drawPlan(c){
 c.fillStyle='#b4a580';c.fillRect(0,0,512,512);let seed=741;for(let i=0;i<5500;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const x=seed%512,y=(seed>>>10)%512;c.fillStyle=i%3?'#afa07c':'#baac87';c.fillRect(x,y,1+(seed%2),1);}
 c.strokeStyle='#686248';c.lineWidth=1;c.strokeRect(13.5,13.5,485,485);c.fillStyle='#343b2b';c.font='14px Courier New,monospace';c.fillText('UMBRAL / NIVEL INSTRUMENTAL',27,34);c.fillRect(27,47,459,1);
 for(const r of ZONES){const p=mapPoint(r.x,r.z);c.fillStyle='#a49c7b';c.fillRect(Math.round(p.x),Math.round(p.y),Math.round(r.w*16),Math.round(r.d*16));}
 c.strokeStyle='#454a34';c.lineWidth=2;for(const r of ZONES){const p=mapPoint(r.x,r.z);c.strokeRect(Math.round(p.x),Math.round(p.y),Math.round(r.w*16),Math.round(r.d*16));}
 for(const p of PORTALS){const a=p.axis==='x'?mapPoint(p.line,p.lo):mapPoint(p.lo,p.line),b=p.axis==='x'?mapPoint(p.line,p.hi):mapPoint(p.hi,p.line);c.strokeStyle='#a49c7b';c.lineWidth=4;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();}
 c.font='19px Courier New,monospace';c.fillStyle='#333d2b';c.textAlign='center';for(const r of ROOMS){const p=mapPoint(r.x+r.w/2,r.z+r.d/2);c.fillText('0'+r.id,p.x,p.y+6);}c.textAlign='left';
 c.font='12px Courier New,monospace';c.fillText('01 ACCESO  02 TALLER  03 CONTROL  04 SERV.',27,463);c.fillText('05 CALIB.  06 ANÁLISIS 07 ARCHIVO 08 OBS.',27,484);
 // Fold lines and tiny missing ink spots are fixed, not an animated overlay.
 c.fillStyle='#c5b48d40';c.fillRect(254,15,2,482);c.fillRect(15,254,482,2);c.fillStyle='#625b3c20';c.fillRect(257,15,1,482);
}
export class PortableMap{
 constructor(missions,callbacks){this.missions=missions;this.callbacks=callbacks;this.active=false;this.sheet=document.querySelector('#map-sheet');this.canvas=document.querySelector('#plan');this.canvas.width=this.canvas.height=512;this.ctx=this.canvas.getContext('2d',{alpha:false});this.base=document.createElement('canvas');this.base.width=this.base.height=512;drawPlan(this.base.getContext('2d'));
  document.querySelector('#map-toggle').addEventListener('click',()=>this.toggle());document.querySelector('#map-close').addEventListener('click',()=>this.close());
  window.addEventListener('keydown',e=>{if(e.repeat||e.defaultPrevented)return;if(this.active&&['Escape','KeyM','KeyE'].includes(e.code)){e.preventDefault();this.close();}else if(e.code==='KeyM'&&callbacks.available()){e.preventDefault();this.open();}});
 }
 toggle(){if(this.active)this.close();else this.open();}
 open(){if(!this.missions.state.mapOwned||!this.callbacks.available())return;this.active=true;this.callbacks.open();this.sheet.hidden=false;document.body.classList.add('reading-map');this.lastPoint='';}
 close(resume=true){if(!this.active)return;this.active=false;this.sheet.hidden=true;document.body.classList.remove('reading-map');this.callbacks.close(resume);}
 tick(player){document.querySelector('#map-toggle').hidden=!this.missions.state.mapOwned;if(!this.active)return;const p=mapPoint(player.x,player.z),x=Math.round(p.x),y=Math.round(p.y),key=x+','+y;if(key===this.lastPoint)return;this.lastPoint=key;this.ctx.drawImage(this.base,0,0);this.ctx.fillStyle='#542f21';this.ctx.fillRect(x-2,y-2,4,4);}
}

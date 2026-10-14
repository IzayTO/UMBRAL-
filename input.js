export class Input {
  constructor(canvas,onPause,onFallback){
    this.canvas=canvas;this.onPause=onPause;this.onFallback=onFallback;
    this.keys=new Set();this.joy={x:0,y:0};this.look={x:0,y:0};this.enabled=false;
    this.touch=matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>1;
    this.moveId=null;this.lookId=null;this.mouseDrag=false;
    this.zone=document.querySelector('#move-zone');this.pad=document.querySelector('#stick');this.knob=document.querySelector('#stick-knob');
    document.body.classList.toggle('touch',this.touch);
    this.zone.addEventListener('pointerdown',e=>this.moveStart(e));
    this.zone.addEventListener('pointermove',e=>this.moveDrag(e));
    for(const type of ['pointerup','pointercancel','lostpointercapture'])this.zone.addEventListener(type,e=>this.moveEnd(e));
    canvas.addEventListener('pointerdown',e=>this.lookStart(e));
    canvas.addEventListener('pointermove',e=>this.lookDrag(e));
    for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,e=>this.lookEnd(e));
    document.addEventListener('mousemove',e=>{
      if(this.enabled&&document.pointerLockElement===canvas){this.look.x+=e.movementX;this.look.y+=e.movementY;}
    });
    window.addEventListener('keydown',e=>{
      if(e.code==='Escape'){if(this.enabled)this.onPause();return;}
      if(!this.enabled)return;
      if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)){e.preventDefault();this.keys.add(e.code);}
      if(e.code==='KeyP'&&!e.repeat)this.onPause();
    });
    window.addEventListener('keyup',e=>this.keys.delete(e.code));
    document.addEventListener('pointerlockchange',()=>{
      const locked=document.pointerLockElement===canvas;
      if(this.hadLock&&!locked&&this.enabled)this.onPause();
      this.hadLock=locked;
    });
    document.addEventListener('pointerlockerror',()=>{if(this.enabled)this.onFallback();});
    canvas.addEventListener('contextmenu',e=>e.preventDefault());
    window.addEventListener('blur',()=>{this.reset();if(this.enabled)this.onPause();});
    document.addEventListener('visibilitychange',()=>{if(document.hidden){this.reset();if(this.enabled)this.onPause();}});
  }
  moveStart(e){
    if(!this.enabled||this.moveId!==null||e.pointerType==='mouse')return;
    e.preventDefault();this.moveId=e.pointerId;this.zone.setPointerCapture(e.pointerId);
    const rect=this.zone.getBoundingClientRect();
    this.origin={x:Math.max(rect.left+56,Math.min(rect.right-56,e.clientX)),y:Math.max(rect.top+56,Math.min(rect.bottom-56,e.clientY))};
    this.pad.style.left=(this.origin.x-rect.left)+'px';this.pad.style.top=(this.origin.y-rect.top)+'px';
    this.pad.classList.add('active');this.moveDrag(e);
  }
  moveDrag(e){
    if(e.pointerId!==this.moveId)return;e.preventDefault();
    let x=(e.clientX-this.origin.x)/44,y=(e.clientY-this.origin.y)/44,l=Math.hypot(x,y);
    if(l>1){x/=l;y/=l;}
    const len=Math.hypot(x,y),factor=len<.12?0:(len-.12)/(.88*len);
    this.joy={x:x*factor,y:y*factor};this.knob.style.transform=`translate(${x*36}px,${y*36}px)`;
  }
  moveEnd(e){if(e.pointerId!==this.moveId)return;this.moveId=null;this.joy={x:0,y:0};this.knob.style.transform='';this.pad.classList.remove('active');}
  lookStart(e){
    if(!this.enabled||this.lookId!==null)return;
    if(e.pointerType==='mouse'){
      this.touch=false;document.body.classList.remove('touch');
      if(document.pointerLockElement===this.canvas)return;
      this.mouseDrag=true;this.lock();
    }else if(e.clientX<innerWidth*.40)return;
    this.lookId=e.pointerId;this.last={x:e.clientX,y:e.clientY};this.canvas.setPointerCapture(e.pointerId);e.preventDefault();
  }
  lookDrag(e){
    if(e.pointerId!==this.lookId||!this.enabled||document.pointerLockElement===this.canvas)return;
    e.preventDefault();this.look.x+=e.clientX-this.last.x;this.look.y+=e.clientY-this.last.y;this.last={x:e.clientX,y:e.clientY};
  }
  lookEnd(e){if(e.pointerId===this.lookId){this.lookId=null;this.mouseDrag=false;}}
  lock(){
    if(this.touch)return;
    try{const p=this.canvas.requestPointerLock?.();p?.catch(()=>this.onFallback());if(!this.canvas.requestPointerLock)this.onFallback();}catch{this.onFallback();}
  }
  vector(){
    let x=this.joy.x+Number(this.keys.has('KeyD')||this.keys.has('ArrowRight'))-Number(this.keys.has('KeyA')||this.keys.has('ArrowLeft'));
    let z=this.joy.y+Number(this.keys.has('KeyS')||this.keys.has('ArrowDown'))-Number(this.keys.has('KeyW')||this.keys.has('ArrowUp'));
    const l=Math.hypot(x,z);if(l>1){x/=l;z/=l;}return {x,z};
  }
  consumeLook(){const d=this.look;this.look={x:0,y:0};return d;}
  reset(){
    this.keys.clear();this.joy={x:0,y:0};this.look={x:0,y:0};this.moveId=null;this.lookId=null;this.mouseDrag=false;
    this.knob.style.transform='';this.pad.classList.remove('active');
  }
  setEnabled(v){this.enabled=v;this.reset();if(!v&&document.pointerLockElement===this.canvas)document.exitPointerLock?.();}
}

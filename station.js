import * as T from './three.module.min.js';
import {buildWorld as buildLegacy,TEX as OLD_TEX,batchWorld} from './world.js?v=3.1';
import {ROOMS,ZONES,PORTALS,LAMP_DATA,START,GLASS,WINDOW,boundsOf,zoneAt,portalPoint} from './layout.js?v=3.1';
import {installEquipment} from './equipment.js?v=3.1';
export {START,LAMP_DATA};
export const TEX=[...OLD_TEX,...['paint','green','concrete'].flatMap(n=>[2,3,4].map(i=>n+i)),'signs','station-map','glass'];

function between(v,a,b){return v>=a-0.002&&v<=b+0.002;}
export function makeWallSegments(){
 const lines=new Map();
 for(const r of ZONES){
  const edges=[['z',r.z,r.x,r.x+r.w],['z',r.z+r.d,r.x,r.x+r.w],['x',r.x,r.z,r.z+r.d],['x',r.x+r.w,r.z,r.z+r.d]];
  for(const [axis,line,lo,hi] of edges){
   const gaps=PORTALS.filter(p=>(p.a===r.id||p.b===r.id)&&p.axis===axis&&Math.abs(p.line-line)<.002).map(p=>[p.lo,p.hi]);
   if(r.id==='8'&&axis==='z'&&Math.abs(line-(r.z+r.d))<.002)gaps.push([WINDOW.cx-WINDOW.width/2,WINDOW.cx+WINDOW.width/2]);
   let spans=[[lo,hi]];
   for(const [a,b] of gaps)spans=spans.flatMap(([u,v])=>b<=u||a>=v?[[u,v]]:[[u,Math.min(a,v)],[Math.max(b,u),v]].filter(([x,y])=>y-x>.001));
   const key=axis+':'+line.toFixed(3);if(!lines.has(key))lines.set(key,{axis,line,items:[]});
   for(const [a,b]of spans)lines.get(key).items.push({lo:a,hi:b,zone:r.id});
  }
 }
 const result=[];
 for(const g of lines.values()){
  const cuts=[...new Set(g.items.flatMap(i=>[i.lo,i.hi]))].sort((a,b)=>a-b);
  for(let i=0;i<cuts.length-1;i++){
   const a=cuts[i],b=cuts[i+1],mid=(a+b)/2,owners=g.items.filter(s=>between(mid,s.lo,s.hi)).map(s=>s.zone);
   if(owners.length)result.push({axis:g.axis,line:g.line,lo:a,hi:b,zones:[...new Set(owners)]});
  }
 }
 return result;
}
export function lineBlocked(a,b,walls){
 for(const w of walls){
  const da=w.axis==='x'?b.x-a.x:b.z-a.z;if(Math.abs(da)<1e-8)continue;
  const t=(w.line-(w.axis==='x'?a.x:a.z))/da;if(t<.00001||t>.99999)continue;
  const v=w.axis==='x'?a.z+(b.z-a.z)*t:a.x+(b.x-a.x)*t;
  if(v>w.lo+.01&&v<w.hi-.01)return true;
 }return false;
}
export function visibleZones(player,walls){
 const current=zoneAt(player.x,player.z,.16)?.id||'1',seen=new Set([current]),queue=[current];
 while(queue.length){const id=queue.shift();for(const p of PORTALS){if(p.a!==id&&p.b!==id)continue;const other=p.a===id?p.b:p.a;if(seen.has(other))continue;
  const clear=[.12,.5,.88].some(f=>{const k=p.lo+(p.hi-p.lo)*f;return !lineBlocked(player,p.axis==='x'?{x:p.line,z:k}:{x:k,z:p.line},walls);});
  if(clear){seen.add(other);queue.push(other);}
 }}return seen;
}

export function buildStation(textures={}){
 const world=buildLegacy(textures),oldParts=[...world.parts],oldColliders=[...world.colliders];
 const {root,parts,materials,specs,colliders,ambient}=world;root.clear();parts.length=0;colliders.length=0;world.lamps.length=0;root.add(ambient);
 const {mesh,box,cyl,torus,beam,solid,group,plate,carton,can,bottle,chair}=world.tools;
 const terminals=[],moving=[],indicators=[],walls=makeWallSegments();
 for(const name of TEX.filter(n=>!specs[n])){
  const base=name.replace(/[234]$/,'');specs[name]={texture:name,color:specs[base]?.color||0xffffff};
  materials[name]=new T.MeshLambertMaterial({map:textures[name]||null,color:specs[name].color});materials[name].name=name;
 }
 for(const [name,color]of [['ledGreen',0x64794a],['ledAmber',0x9e692b],['ledRed',0x7b3020],['phosphor',0x1e3425],['blackIce',0x020609]]){
  specs[name]={color,emissive:true};materials[name]=new T.MeshBasicMaterial({color});materials[name].name=name;
 }
 const glassMaterial=new T.MeshLambertMaterial({map:textures.glass||null,color:0x6a7971,transparent:true,opacity:.65,depthWrite:false,side:T.DoubleSide});glassMaterial.name='glass-surface';
 materials['glass-surface']=glassMaterial;specs['glass-surface']={texture:'glass',color:0x6a7971};
 function tag(start,zone){
  const ids=String(zone).split('|'),b=boundsOf(ids[0]);
  for(const m of parts.slice(start)){m.userData.zone=zone;const a=new Float32Array(m.geometry.attributes.position.count*4);for(let i=0;i<a.length;i+=4)a.set(b,i);m.geometry.setAttribute('roomBounds',new T.BufferAttribute(a,4));}
 }
 function inZone(id,fn){const n=parts.length;fn();tag(n,id);}
 function transform(cx,cz,tx,tz,yaw=0){return new T.Matrix4().makeTranslation(tx,0,tz).multiply(new T.Matrix4().makeRotationY(yaw)).multiply(new T.Matrix4().makeTranslation(-cx,0,-cz));}
 function copy(section,zone,matrix,labels=[]){
  const begin=parts.length;
  for(const src of oldParts.filter(m=>m.userData.section===section)){
   const g=src.geometry.clone().applyMatrix4(matrix.clone().multiply(src.matrixWorld));
   const o=mesh(g,src.material.name,[0,0,0],[0,0,0],root,src.castShadow);o.receiveShadow=src.receiveShadow;
  }
  const angle=Math.atan2(matrix.elements[8],matrix.elements[0]);
  for(const b of oldColliders.filter(b=>labels.includes(b.label))){const p=new T.Vector3(b.x,0,b.z).applyMatrix4(matrix);solid(p.x,p.z,b.w,b.d,b.angle+angle,b.label);}
  tag(begin,zone);
 }
 const A=transform(0,3.12,3,3.05,Math.PI);
 copy('access','1',A,['table','chair','shelf','electrical-cabinet','stool']);copy('door','1|2',A,['open-door']);
 copy('workshop-pipes','2',transform(0,-5.82,5.50,9.47,Math.PI),['return-pipe']);
 copy('workshop-tank','2',transform(1.95,-4.75,11.0,8.80,Math.PI),['tank']);
 copy('workshop-valve','2',transform(-2.81,-5.41,2.8,9.05,Math.PI));
 copy('workshop-pump','2',transform(-.49,-5.10,8.7,8.96,Math.PI),['pump']);
 copy('workshop-pallet','2',transform(-1.94,-4.08,6.15,8.97,Math.PI),['pallet']);
 copy('workshop-bench','2',transform(-2.60,-1.80,1.35,9.17,Math.PI/2),['service-bench']);
 copy('workshop-shelf','2',transform(2.72,-2.06,4.20,9.45,-Math.PI/2),['oil-shelf']);
 // Every retained model keeps its original geometry, texture, proportions and finish.
 for(const src of oldParts)src.geometry.dispose();

 function floor(r){
  if(r.id!=='h4')box('floor',r.w,.16,r.d,r.x+r.w/2,-.08,r.z+r.d/2);
  else{
   box('floor',r.w,.16,GLASS.z-r.z,r.x+r.w/2,-.08,(GLASS.z+r.z)/2);
   const end=GLASS.z+GLASS.d;box('floor',r.w,.16,r.z+r.d-end,r.x+r.w/2,-.08,(end+r.z+r.d)/2);
   for(const x of [r.x+.075,r.x+r.w-.075])box('tread',.15,.16,GLASS.d,x,-.08,GLASS.z+GLASS.d/2);
   // Enclosed service shaft; the reinforced panes remain a solid walking surface.
   box('darkRust',GLASS.w+.08,.08,GLASS.d+.08,GLASS.x+GLASS.w/2,-4.8,GLASS.z+GLASS.d/2);
   for(const x of [GLASS.x-.025,GLASS.x+GLASS.w+.025])box('darkRust',.05,4.8,GLASS.d,x,-2.4,GLASS.z+GLASS.d/2);
   for(const z of [GLASS.z,GLASS.z+GLASS.d])box('darkRust',GLASS.w,4.8,.05,GLASS.x+GLASS.w/2,-2.4,z);
   for(const y of [-.35,-1.6,-3.2])for(const x of [GLASS.x+.08,GLASS.x+GLASS.w-.08])beam('rust',[x,y,GLASS.z],[x,y,GLASS.z+GLASS.d],.045);
   for(let i=0;i<3;i++){
    const z=GLASS.z+(i+.5)*GLASS.d/3;
    mesh(new T.PlaneGeometry(GLASS.w+.006,GLASS.d/3+.006),'glass-surface',[GLASS.x+GLASS.w/2,.008,z],[-Math.PI/2,0,0],root,false);
   }
   for(const y of [-.30,-1.35]){beam('rust',[GLASS.x,y,GLASS.z],[GLASS.x+GLASS.w,y,GLASS.z+GLASS.d],.035);beam('iron',[GLASS.x,y,GLASS.z+GLASS.d],[GLASS.x+GLASS.w,y,GLASS.z],.027);}
   for(const x of [GLASS.x+.018,GLASS.x+GLASS.w-.018])box('glass-surface',.028,.042,GLASS.d,x,-.017,GLASS.z+GLASS.d/2,0,root,false);
   for(let i=0;i<4;i++)box('iron',GLASS.w+.04,.065,.055,GLASS.x+GLASS.w/2,.009,GLASS.z+i*GLASS.d/3);
   for(const x of [GLASS.x,GLASS.x+GLASS.w])box('iron',.055,.065,GLASS.d,x,.009,GLASS.z+GLASS.d/2);
  }
  box('ceiling',r.w+.18,.15,r.d+.18,r.x+r.w/2,2.72,r.z+r.d/2);
  for(let z=r.z+.65;z<r.z+r.d-.2;z+=2.4)box('darkRust',r.w,.11,.15,r.x+r.w/2,2.59,z);
  beam('wire',[r.x+.10,2.42,r.z+.15],[r.x+.10,2.42,r.z+r.d-.15],.025);
 }
 ZONES.forEach(r=>inZone(r.id,()=>floor(r)));
 walls.forEach((w,wi)=>inZone(w.zones.join('|'),()=>{
  const length=w.hi-w.lo,steps=Math.max(1,Math.ceil(length/1.45));
  for(let i=0;i<steps;i++){
   const size=length/steps,c=w.lo+(i+.5)*size,variant=Math.floor(((Math.sin(wi*77.1+i*91.37)*41791.213)%1+1)%1*4);
   const concrete='concrete'+(variant?variant+1:'');const id=w.zones.find(x=>!x.startsWith('h'))||w.zones[0];
   const base=['2','4','5','h4'].includes(id)?'green':'paint',paint=base+(variant?variant+1:'');
   const x=w.axis==='x'?w.line:c,z=w.axis==='z'?w.line:c,ww=w.axis==='x'?.18:size,dd=w.axis==='z'?.18:size;
   box(concrete,ww,2.68,dd,x,1.34,z);
   box(paint,w.axis==='x'?.215:size,1.24,w.axis==='z'?.215:size,x,.63,z);
   box('iron',w.axis==='x'?.24:size,.065,w.axis==='z'?.24:size,x,1.285,z);
   box('darkRust',w.axis==='x'?.25:size,.10,w.axis==='z'?.25:size,x,.065,z);
   if(size>.36){box('darkRust',w.axis==='x'?.24:.035,.94,w.axis==='z'?.24:.035,x,.62,z);}
  }
  solid(w.axis==='x'?w.line:(w.lo+w.hi)/2,w.axis==='z'?w.line:(w.lo+w.hi)/2,w.axis==='x'?.22:length,w.axis==='z'?.22:length,0,'wall');
 }));
 function sign(room,x,y,z,yaw=0,w=.70,h=.26){
  const idx=Number(room)-1,g=new T.PlaneGeometry(w,h),uv=g.attributes.uv,u=idx%4,v=Math.floor(idx/4);
  for(let i=0;i<uv.count;i++)uv.setXY(i,(u+uv.getX(i))/4,1-(v+1-uv.getY(i))/4);
  mesh(g,'signs',[x,y,z],[0,yaw,0],root,false);
 }
 for(const p of PORTALS)inZone(p.a+'|'+p.b,()=>{
  if(p.open)return;const mid=(p.lo+p.hi)/2,len=p.hi-p.lo;
  for(const k of [p.lo,p.hi])box('rust',p.axis==='x'?.38:.09,2.18,p.axis==='z'?.38:.09,p.axis==='x'?p.line:k,1.09,p.axis==='z'?p.line:k);
  box('darkRust',p.axis==='x'?.38:len+.12,.12,p.axis==='z'?.38:len+.12,p.axis==='x'?p.line:mid,2.20,p.axis==='z'?p.line:mid);
  box('paint',p.axis==='x'?.24:len,.43,p.axis==='z'?.24:len,p.axis==='x'?p.line:mid,2.485,p.axis==='z'?p.line:mid);
  box('tread',p.axis==='x'?.38:len-.07,.018,p.axis==='z'?.38:len-.07,p.axis==='x'?p.line:mid,.01,p.axis==='z'?p.line:mid);
  if(p.axis==='z')box('hazard',len-.08,.004,.075,mid,.023,p.line+.22);else box('hazard',.075,.004,len-.08,p.line+.22,.023,mid);
  for(const id of [p.a,p.b])if(!id.startsWith('h')){
   const r=ROOMS.find(r=>r.id===id),cx=r.x+r.w/2,cz=r.z+r.d/2;
   if(p.axis==='z'){const positive=cz>p.line;sign(id,mid,2.41,p.line+(positive?-.14:.14),positive?Math.PI:0);}
   else{const positive=cx>p.line;sign(id,p.line+(positive?-.14:.14),2.41,mid,positive?-Math.PI/2:Math.PI/2);}
  }
 });
 // Original pendant silhouette, bulb colours, falloff and shadow settings.
 for(const L of LAMP_DATA)inZone(L.zone,()=>{
  const [x,y,z]=L.position;cyl('iron',.085,.085,.065,x,2.615,z);beam('wire',[x,2.61,z],[x,2.46,z],.014);
  cyl('iron',.085,.28,.19,x,2.39,z,12,root,[0,0,0],true,false);torus('iron',.27,.022,x,2.295,z,[Math.PI/2,0,0]);
  cyl(L.color===0xffd79d?'bulbA':'bulbB',.105,.105,.046,x,2.297,z,10,root,[0,0,0],false,false);
  for(let k=0;k<4;k++){const a=k*Math.PI/2;beam('iron',[x+Math.cos(a)*.19,2.31,z+Math.sin(a)*.19],[x+Math.cos(a)*.14,2.235,z+Math.sin(a)*.14],.009);}
 });

 function led(parent,x,y,z,state='ledGreen',key=null){const o=cyl(state,.022,.022,.014,x,y,z,8,parent,[Math.PI/2,0,0],false,false);if(key){parts.splice(parts.indexOf(o),1);indicators.push({mesh:o,key});}return o;}
 function dial(parent,x,y,z,size=.19,key=null){
  cyl('iron',size*.58,size*.58,.065,x,y,z,10,parent,[Math.PI/2,0,0]);plate(2,0,size,size,x,y,z+.037,[0,0,0],parent);
  if(key){const pivot=new T.Group();pivot.position.set(x,y,z+.044);parent.add(pivot);const needle=box('red',.009,size*.31,.005,0,size*.11,0,0,pivot,false);parts.splice(parts.indexOf(needle),1);moving.push({mesh:pivot,key,zone:null});}
 }
 function consoleUnit(id,zone,x,z,yaw=0,title=id){
  const n=parts.length,g=group(x,z,yaw);
  box('green',1.30,.70,.67,0,.40,0,0,g);
  for(const x of [-.55,.55])for(const z of [-.26,.26])box('iron',.12,.055,.12,x,.0275,z,0,g);
  box('iron',.56,.105,.29,0,.84,-.10,0,g);box('iron',1.34,.045,.73,0,.77,0,0,g);
  box('green',1.04,.70,.48,0,1.24,-.10,0,g);box('black',.96,.61,.018,0,1.26,.149,0,g);
  for(const sx of [-1,1])box('rust',.047,.60,.035,sx*.468,1.26,.166,0,g);
  for(const y of [.965,1.55])box('rust',.97,.043,.035,0,y,.166,0,g);
  const screenGeom=new T.PlaneGeometry(.86,.56,10,8),pa=screenGeom.attributes.position;
  for(let i=0;i<pa.count;i++)pa.setZ(i,.012*(1-(pa.getX(i)/.43)**2-(pa.getY(i)/.28)**2));screenGeom.computeVertexNormals();
  const screenMat=new T.MeshBasicMaterial({color:0x4a6950});screenMat.name='screen-'+id;
  const screen=new T.Mesh(screenGeom,screenMat);screen.position.set(0,1.26,.175);g.add(screen);screen.userData.terminal=id;
  // Physical keyboard, service switches, vents and heavy plugs.
  box('iron',1.11,.025,.24,0,.80,.25,0,g);
  for(let row=0;row<3;row++)for(let col=0;col<13;col++)box('enamel',.052,.017,.035,-.48+col*.08,.823,.17+row*.055,0,g,false);
  for(const sx of [-.54,.54]){cyl('black',.032,.032,.022,sx,.85,.21,8,g);led(g,sx,1.03,.17,'ledAmber',id);}
  for(let i=0;i<5;i++)box('black',.10,.018,.012,.54,.40+i*.06,.344,0,g);
  beam('rubber',[.45,.18,-.30],[.45,.06,-.39],.024,g);beam('rubber',[.45,.06,-.39],[.65,.06,-.45],.024,g);
  tag(n,zone);solid(x,z,1.43,.84,yaw,'console-'+id);
  g.updateMatrixWorld(true);const target=screen.getWorldPosition(new T.Vector3()),normal=new T.Vector3(0,0,1).applyAxisAngle(new T.Vector3(0,1,0),yaw);
  const term={id,zone,title,group:g,screen,target,normal,yaw,point:target.clone().addScaledVector(normal,.60),size:[.86,.56]};terminals.push(term);return term;
 }
 function rack(zone,x,z,yaw=0,idx=0){inZone(zone,()=>{
  const g=group(x,z,yaw);box('iron',.90,2.08,.56,0,1.04,0,0,g);
  for(const sx of [-1,1])box('rust',.07,2.17,.64,sx*.48,1.09,0,0,g);
  for(let j=0;j<6;j++){
   const y=.24+j*.29;box(j%2?'green':'paint',.86,.25,.03,0,y,.295,0,g);
   plate(3,0,.34,.15,-.21,y,.313,[0,0,0],g);
   for(let k=0;k<3;k++)led(g,.05+k*.10,y+.045,.32,j===3?'ledAmber':'ledGreen',j===3?'sensor':null);
   for(const a of [-.39,.39])cyl('iron',.018,.018,.022,a,y,.328,6,g,[Math.PI/2,0,0]);
   box('black',.22,.025,.014,.18,y-.06,.32,0,g);
  }
  for(let k=0;k<3;k++)beam('wire',[-.20+k*.14,.08,-.31],[-.20+k*.14,2.39,-.31],.016,g);
  solid(x,z,1.08,.68,yaw,'rack');
 });}
 function desk(zone,x,z,yaw=0,w=1.8){inZone(zone,()=>{
  const g=group(x,z,yaw);for(let i=0;i<4;i++)box('wood',w,.05,.19,0,.82,-.30+i*.20,0,g);
  for(const xx of [-w/2+.13,w/2-.13])for(const zz of [-.27,.27])box('iron',.05,.8,.05,xx,.4,zz,0,g);
  box('rust',w+.04,.07,.027,0,.80,.40,0,g);plate(1,1,.26,.35,.12,.85,.02,[-Math.PI/2,0,.16],g);
  can(g,-w*.30,.85,-.08,.09,.22,'paint');bottle(g,w*.32,.85,-.16);solid(x,z,w+.06,.84,yaw,'desk');
 });}
 function storage(zone,x,z,yaw=0,length=1.8){inZone(zone,()=>{
  const g=group(x,z,yaw);for(const xx of [-length/2,length/2])for(const zz of [-.25,.25])box('iron',.045,2.16,.045,xx,1.08,zz,0,g);
  for(const y of [.16,.69,1.22,1.77,2.13])box('rust',length+.07,.035,.56,0,y,0,0,g);
  // Curated shelf contents: media, documents and optical spares have distinct
  // dimensions and rests. Nothing is scattered into doors or collision lanes.
  function binder(x,y,z,width=.065,mat='green',lean=0){const b=new T.Group();b.position.set(x,y,z);b.rotation.z=lean;g.add(b);box(mat,width,.31,.25,0,.155,0,0,b);box('paper',width*.68,.28,.219,.003,.155,.013,0,b);box(mat,width,.31,.023,0,.155,.125,0,b);plate(3,0,width*.74,.10,0,.21,.138,[0,0,0],b);}
  function reel(x,y){box('paint',.26,.28,.055,x,y+.14,0,0,g);cyl('black',.108,.108,.027,x,y+.14,.043,10,g,[Math.PI/2,0,0]);torus('iron',.092,.014,x,y+.14,.062,[0,0,0],g,10);for(let j=0;j<3;j++){const a=j*Math.PI*2/3;beam('iron',[x,y+.14,.063],[x+Math.sin(a)*.09,y+.14+Math.cos(a)*.09,.063],.010,g);}}
  if(zone==='7'){
   const section=Math.round(z);
   for(let i=0;i<(section<16?10:6);i++)binder(-length*.40+i*.09,.708,.03,.063,i%4===0?'red':'green',i===5?.04:0);
   reel(-.55,1.24);reel(-.22,1.24);if(section>16)reel(.12,1.24);
   for(let i=0;i<4;i++)box('paper',.32,.025,.23,.48,1.25+i*.026,.04,i*.024,g);
   carton(g,-.46,1.79,0,.52,.25,.38);for(let i=0;i<4;i++)binder(.03+i*.10,1.79,.01,.075,'paint');
  }else if(zone==='5'){
   for(const x of [-.46,.36]){box('iron',.40,.04,.38,x,.728,0,0,g);cyl('rubber',.10,.10,.05,x,.77,0,10,g);mesh(new T.SphereGeometry(.18,10,7),'green',[x,.97,0],[0,0,0],g);torus('iron',.181,.015,x,.97,0,[Math.PI/2,0,0],g);}
   carton(g,-.45,1.24,0,.48,.28,.36);reel(.30,1.24);for(let i=0;i<3;i++)binder(-.46+i*.09,1.79,.01);box('iron',.52,.15,.32,.36,1.87,0,0,g);
  }else if(zone==='6'){
   for(let i=0;i<4;i++)reel(-.52+i*.31,.71);for(let i=0;i<7;i++)binder(-.6+i*.09,1.24,0,.062,i%3?'paint':'green');box('iron',.38,.21,.34,.5,1.345,0,0,g);carton(g,-.4,1.79,0,.52,.25,.38);reel(.30,1.79);
  }else{carton(g,-.42,.71,0,.51,.30,.38);box('iron',.45,.15,.32,.37,.79,0,0,g);for(let i=0;i<4;i++)binder(-.48+i*.08,1.24,0);reel(.25,1.24);carton(g,.20,1.79,0,.62,.25,.38);}
  box('cloth',length*.42,.13,.40,0,.24,0,0,g);solid(x,z,length+.16,.66,yaw,'storage');
 });}
 function gaugeBoard(zone,x,z,yaw){inZone(zone,()=>{const g=group(x,z,yaw);box('paint',1.12,.65,.12,0,1.70,0,0,g);for(let i=0;i<3;i++)dial(g,-.34+i*.34,1.77,.075,.24,i===0?'voltage':null);for(let i=0;i<5;i++){led(g,-.42+i*.21,1.49,.073,i===2?'ledAmber':'ledGreen');beam('wire',[-.42+i*.21,1.36,0],[-.42+i*.21,.22,0],.014,g);}solid(x,z,1.18,.20,yaw,'gauge-panel');});}

 // Room 1: retain the exact original work table, chairs, radio, shelves and switches.
 inZone('1',()=>{
  const g=new T.PlaneGeometry(1.02,1.02),paper=mesh(g,'station-map',[5.87,1.73,4.95],[0,-Math.PI/2,0],root,false);
  parts.splice(parts.indexOf(paper),1);paper.userData.zone='1';const rb=new Float32Array(g.attributes.position.count*4);for(let i=0;i<rb.length;i+=4)rb.set(boundsOf('1'),i);g.setAttribute('roomBounds',new T.BufferAttribute(rb,4));world.mapPickup={mesh:paper,target:new T.Vector3(5.87,1.73,4.95),normal:new T.Vector3(-1,0,0),id:'map-pickup',zone:'1'};
  box('rust',.06,1.10,1.10,5.91,1.73,4.95);
 });
 // Room 2: the original service equipment, now spread along the long workshop.
 consoleUnit('workshop','2',4.15,8.65,Math.PI,'BANCO DE MANTENIMIENTO');
 inZone('2',()=>{box('iron',.54,.20,.36,7.15,.10,9.02);can(root,7.12,.20,9.01,.11,.24,'red');box('cloth',.37,.026,.24,5.15,.015,8.85,.3);});
 // Control: acquisition console, analogue voltmeters and paper event recorder.
 consoleUnit('control','3',9.02,.69,0,'ADQUISICIÓN / CONTROL');
 gaugeBoard('3',10.90,.16,0);
 inZone('3',()=>{chair(7.97,1.90,.5);const g=group(10.94,.56,0);box('paint',.52,.40,.34,0,1.04,0,0,g);box('black',.41,.07,.015,0,1.10,.179,0,g);plate(0,1,.32,.38,0,.846,.14,[-Math.PI/2,0,0],g);box('iron',.58,.84,.45,0,.42,0,0,g);solid(10.94,.56,.62,.51,0,'recorder');});
 // Servers is a dead-end branch of the T junction. There is no southern shortcut.
 rack('4',10.55,11.25,Math.PI/2,0);rack('4',10.55,12.72,Math.PI/2,1);rack('4',14.41,12.79,-Math.PI/2,2);
 const repair=consoleUnit('servers','4',12.13,13.14,Math.PI,'ENLACE / MÓDULO 17');
 inZone('4',()=>{
  const g=repair.group;box('rust',.40,.24,.11,.75,1.05,.12,0,g);
  const lever=new T.Group();lever.position.set(.75,1.07,.20);g.add(lever);const b=box('red',.06,.15,.035,0,.045,0,0,lever,false);parts.splice(parts.indexOf(b),1);moving.push({mesh:lever,key:'isolator',zone:'4'});
  beam('wire',[10.58,.05,11.0],[14.22,.05,11.0],.022);beam('wire',[12.1,.05,11.0],[12.1,.05,13.1],.022);
 });
 // Calibration: enclosed optical bench, LED pulser and spare DOM modules.
 consoleUnit('calibration','5',16.78,.76,0,'CALIBRACIÓN / PULSOS');
 desk('5',18.25,3.80,0,2.42);storage('5',21.55,2.08,-Math.PI/2,1.85);
 inZone('5',()=>{
  const g=group(18.25,3.57,0);cyl('black',.18,.18,1.50,0,1.10,0,12,g,[0,0,Math.PI/2]);
  for(const xx of [-.75,.75]){cyl('rust',.235,.235,.05,xx,1.10,0,12,g,[0,0,Math.PI/2]);box('iron',.12,.20,.32,xx,.90,0,0,g);}
  const emitter=new T.Mesh(new T.SphereGeometry(.018,6,4),materials.phosphor);emitter.position.set(-.68,1.13,.16);g.add(emitter);indicators.push({mesh:emitter,key:'pulse'});
  const shutter=box('iron',.055,.40,.43,.05,1.10,0,0,g);parts.splice(parts.indexOf(shutter),1);moving.push({mesh:shutter,key:'shutter',zone:'5'});
  cyl('green',.10,.10,.25,.95,.98,-.10,10,g);dial(g,.95,1.02,.06,.20,'response');

  chair(15.35,1.70,-.4);gaugeBoard('5',18.95,.14,0);
 });
 // Analysis: original-type furniture, a plotting console and a mechanical printer.
 consoleUnit('analysis','6',21.62,11.62,-Math.PI/2,'ANÁLISIS / EVENTOS');
 desk('6',17.94,12.50,Math.PI/2,1.85);storage('6',21.90,14.40,-Math.PI/2,1.9);
 inZone('6',()=>{chair(20.80,13.05,-.35);box('paint',.53,.32,.39,18.03,1.025,12.4);plate(0,1,.29,.40,18.27,1.02,12.35,[0,Math.PI/2,0]);torus('rubber',.20,.012,18.66,.02,15.70,[Math.PI/2,0,0]);});
 // Archive has two distinct right-hand connections, exactly as on the sketch.
 for(const z of [14.1,17.15,20.25])storage('7',3.16,z,Math.PI/2,2.0);
 consoleUnit('archive','7',5.23,22.16,Math.PI,'ARCHIVO / REGISTROS');
 desk('7',6.82,17.10,-Math.PI/2,1.75);
 inZone('7',()=>{chair(5.98,20.95,.5);const g=group(6.82,13.20,0);box('green',1.37,1.55,.52,0,.82,0,0,g);for(const x of [-.57,.57])for(const z of [-.19,.19])box('iron',.085,.05,.085,x,.025,z,0,g);for(let j=0;j<4;j++)for(const x of [-.34,.34]){const y=.25+j*.36;box('paint',.63,.32,.025,x,y,.275,0,g);plate(3,0,.23,.07,x,y+.065,.291,[0,0,0],g);beam('iron',[x-.10,y-.04,.30],[x+.10,y-.04,.30],.012,g);}box('paper',.36,.06,.25,-.31,1.625,.07,.06,g);solid(6.82,13.20,1.43,.59,0,'archive-cabinet');});
 inZone('7',()=>{
  const g=group(6.82,17.10,-Math.PI/2);
  for(let i=0;i<5;i++)box('paper',.29,.014,.37,-.66,.86+i*.015,.20,i*.012,g);
  box('green',.25,.028,.36,.67,.87,.11,.12,g);plate(3,0,.15,.09,.67,.887,.11,[-Math.PI/2,0,.12],g);

 });
 inZone('2',()=>{
  // A socket set and open relay carrier sit on the original maintenance bench.
  const g=group(1.35,9.17,Math.PI);box('iron',.27,.028,.21,.37,.962,-.12,0,g);
  for(let i=0;i<4;i++){cyl('iron',.017+i*.003,.017+i*.003,.048,.285+i*.055,1.00,-.12,8,g);}
  beam('iron',[-.04,.96,-.19],[.20,.96,-.19],.012,g);box('rubber',.04,.025,.11,.15,.96,-.19,0,g);
 });
 // Observation uses a restrained instrument bay; the window is the focal point.
 consoleUnit('observation','8',18.12,21.18,Math.PI,'OBSERVACIÓN / REGISTRO');
 desk('8',14.40,22.18,Math.PI,1.60);gaugeBoard('8',25.50,19.75,-Math.PI/2);
 inZone('8',()=>{chair(15.10,20.25,.7);storage('8',24.45,18.62,0,1.70);});

 const iceUniforms={uTime:{value:0},uHollow:{value:0},uFlash:{value:0},uFlashScale:{value:1},uFlashXY:{value:new T.Vector2(.5,.45)}};
 const iceMaterial=new T.ShaderMaterial({uniforms:iceUniforms,side:T.DoubleSide,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:`
 precision highp float;varying vec2 vUv;uniform float uTime;uniform float uFlash;uniform float uHollow;uniform float uFlashScale;uniform vec2 uFlashXY;
 float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 void main(){vec2 px=floor(vUv*vec2(768.0,169.0));
 float patch=h(floor(px/vec2(11.0,7.0)));
 float boundary=.79+.016*sin(vUv.x*12.0)+.014*sin(vUv.x*29.0)+.018*(patch-.5);
 float upper=smoothstep(boundary,1.025,vUv.y+.006*(h(px)-.5));
 vec3 c=mix(vec3(.0007,.0032,.0105),vec3(.0035,.0135,.034),upper);
 c*=.92+.13*patch+.04*h(floor(px/3.0));
 float stratum=pow(max(0.0,sin(vUv.y*75.0+sin(vUv.x*13.0)*.7+patch*.25)),36.0);
 c+=vec3(.00005,.00014,.00024)*stratum;
 float scratch=step(.997,h(vec2(floor(px.x*.3),floor(px.y*.06))));c+=scratch*vec3(.00007,.00014,.00020);
 vec2 d=(vUv-uFlashXY)/(vec2(.0043,.0195)*uFlashScale);float r=length(d);float spark=mix(exp(-r*r*2.8),exp(-pow((r-.62)*4.2,2.0))*.65,uHollow)*uFlash;
 c+=vec3(.065,.14,.235)*spark;gl_FragColor=vec4(c,1.0);}`});
 iceMaterial.name='deep-ice';materials['deep-ice']=iceMaterial;specs['deep-ice']={color:0x030912,emissive:true};
 inZone('8',()=>{
  const radius=WINDOW.width/(2*Math.sin(WINDOW.arc/2)),segments=10,angles=Array.from({length:segments+1},(_,i)=>-WINDOW.arc/2+i*WINDOW.arc/segments);
  const point=(a,y,extra=0)=>[WINDOW.cx+Math.sin(a)*(radius+extra),y,WINDOW.front+(Math.cos(a)-Math.cos(WINDOW.arc/2))*(radius+extra)];
  const pos=[],uv=[],ind=[];
  for(let i=0;i<=segments;i++){const a=angles[i];pos.push(...point(a,WINDOW.bottom),...point(a,WINDOW.bottom+WINDOW.height));uv.push(i/segments,0,i/segments,1);if(i<segments){const b=i*2;ind.push(b,b+1,b+2,b+1,b+3,b+2);}}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(ind);geo.computeVertexNormals();
  const ice=new T.Mesh(geo,iceMaterial);root.add(ice);ice.userData.zone='8';world.ice=ice;
  // Close the shallow curved recess above and below the pane.
  for(const y of [0,2.64]){const p=[],u=[];for(let i=0;i<segments;i++){const a=point(angles[i],y),b=point(angles[i+1],y),c=[a[0],y,WINDOW.front],d=[b[0],y,WINDOW.front];const tri=y>1?[a,b,c,b,d,c]:[a,c,b,b,c,d];for(const v of tri){p.push(...v);u.push(v[0]/1.9,v[2]/1.9);}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(u,2));g.computeVertexNormals();mesh(g,y>1?'ceiling':'floor');}

  for(let i=0;i<segments;i++){
   const a=angles[i],b=angles[i+1],pa=point(a,.53),pb=point(b,.53),mid=new T.Vector3(...pa).add(new T.Vector3(...pb)).multiplyScalar(.5),length=new T.Vector3(...pa).distanceTo(new T.Vector3(...pb)),yaw=(a+b)/2;
   box('rust',length+.03,.12,.14,mid.x,.53,mid.z,yaw);box('iron',length+.03,.12,.14,mid.x,2.37,mid.z,yaw);
   box('darkRust',length+.05,.50,.20,mid.x,.25,mid.z,yaw);box('paint',length+.05,.28,.20,mid.x,2.54,mid.z,yaw);
  }
  for(let i=0;i<segments;i++){
   const a=point(angles[i],2.43),b=point(angles[i+1],2.43),x=(a[0]+b[0])/2,z=(a[2]+b[2])/2;
   box('darkRust',Math.hypot(a[0]-b[0],a[2]-b[2])+.055,.045,.23,x,.60,z-.055,(angles[i]+angles[i+1])/2);
   // Deep head trim makes the connection to the low ceiling unambiguous.
   box('iron',Math.hypot(a[0]-b[0],a[2]-b[2])+.055,.07,.24,x,2.40,z-.045,(angles[i]+angles[i+1])/2);
  }
  for(const a of [angles[0],angles[segments]]){const p=point(a,1.34);box('rust',.18,2.68,.31,p[0],1.34,p[2]-.01,a);for(const y of [.30,.75,1.2,1.65,2.1,2.5])cyl('iron',.022,.022,.02,p[0],y,p[2]-.18,6,root,[Math.PI/2,0,0]);}
  for(let i=0;i<=segments;i+=2){const p=point(angles[i],1.45);box('iron',.055,1.83,.09,p[0],1.45,p[2],angles[i]);}
  const scratchGeo=geo.clone();scratchGeo.translate(0,0,-.018);const glaze=new T.Mesh(scratchGeo,new T.MeshBasicMaterial({map:textures.glass||null,color:0x617c98,fog:false,transparent:true,opacity:.016,depthWrite:false,side:T.DoubleSide}));glaze.material.name='window-glass';specs['window-glass']={texture:'glass',color:0x293a42,emissive:true};root.add(glaze);glaze.userData.zone='8';world.glaze=glaze;
  // A heavy railing keeps the player inside the pressure boundary.
  beam('iron',[WINDOW.cx-WINDOW.width/2,.91,22.40],[WINDOW.cx+WINDOW.width/2,.91,22.40],.032);
  for(let x=WINDOW.cx-WINDOW.width/2;x<=WINDOW.cx+WINDOW.width/2+.01;x+=2)beam('iron',[x,0,22.40],[x,.91,22.40],.026);
  solid(WINDOW.cx,22.40,WINDOW.width+.12,.12,0,'observation-rail');
  // Solid sill collision beyond the railing; there is no accessible exterior.
  solid(WINDOW.cx,23.10,WINDOW.width+.30,1.10,0,'pressure-window');
 });

 const equipment=installEquipment(world,{mesh,box,cyl,torus,beam,solid,group,plate,carton,can,bottle,chair,tag,inZone});
 world.devices=equipment.devices;world.deviceDynamic=equipment.dynamic;
 function fence(x,z,w,d,parent=root){
  const along=w>d,length=Math.max(w,d);box('green',w,.58,d,x,.29,z,0,parent);
  for(const y of [.61,2.08])box('rust',w,.045,d,x,y,z,0,parent);
  const count=Math.ceil(length/.18);for(let i=0;i<=count;i++){const a=-length/2+i*length/count;box('iron',.018,1.44,.018,x+(along?a:0),1.34,z+(along?0:a),0,parent);}
  for(const y of [.90,1.2,1.5,1.8])box('iron',w,.012,d,x,y,z,0,parent);
 }
 inZone('6',()=>{
  fence(20.76,10.9,2.82,.045);solid(20.76,10.9,2.82,.08,0,'analysis-fence');
  fence(19.35,11.975,.045,2.15);solid(19.35,11.975,.08,2.15,0,'analysis-fence');
  fence(19.35,15.45,.045,1.90);solid(19.35,15.45,.08,1.90,0,'analysis-fence');
  for(const z of [10.9,13.05,14.5,16.2])box('rust',.07,2.18,.07,19.35,1.09,z);
  const gate=group(19.35,13.775,0),before=parts.length;fence(0,0,.06,1.40,gate);
  box('hazard',.065,.10,1.22,0,1.03,0,0,gate);beam('iron',[-.06,1.11,-.36],[-.06,1.11,-.16],.018,gate);
  tag(before,'6');for(const o of parts.splice(before))o.castShadow=false;
  solid(19.35,13.775,.10,1.45,0,'analysis-gate');const collider=colliders.at(-1);collider.enabled=true;
  world.analysisGate={mesh:gate,collider,target:new T.Vector3(19.35,1.3,13.775),normal:new T.Vector3(-1,0,0),id:'analysis-gate',zone:'6',open:false};
 });
 // Four reusable shadow lights, independent of total station size.
 for(let i=0;i<4;i++){
  const l=new T.SpotLight(0xffd79d,0,5,1.33,.34,2);l.castShadow=true;l.shadow.mapSize.set(1024,1024);l.shadow.bias=-.00022;l.shadow.normalBias=.017;l.shadow.camera.near=.07;
  l.userData.source=null;root.add(l,l.target);world.lamps.push(l);
 }
 world.terminals=terminals;world.moving=moving;world.indicators=indicators;world.iceUniforms=iceUniforms;world.walls=walls;
 root.updateMatrixWorld(true);
 for(const a of [...moving,...indicators]){a.zone=zoneAt(...[a.mesh.getWorldPosition(new T.Vector3()).x,a.mesh.getWorldPosition(new T.Vector3()).z],.15)?.id||'1';a.mesh.traverse(m=>{if(m.isMesh&&!m.geometry.attributes.roomBounds){const b=boundsOf(a.zone),arr=new Float32Array(m.geometry.attributes.position.count*4);for(let i=0;i<arr.length;i+=4)arr.set(b,i);m.geometry.setAttribute('roomBounds',new T.BufferAttribute(arr,4));}});}
 batchWorld(world);parts.length=0;oldParts.length=0;oldColliders.length=0;delete world.tools;root.updateMatrixWorld(true);
 // Screens and needles are unbatched so they can respond to the real simulation state.
 for(const t of terminals){t.group.visible=true;}
 let visibilityKey='',lightKey='',lastCheck=-1;
 world.updateVisibility=(player,renderer,t,force=false)=>{
  if(!force&&t-lastCheck<.24)return;lastCheck=t;const visible=visibleZones(player,walls),key=[...visible].sort().join(',');
  if(key!==visibilityKey){for(const m of world.parts)m.visible=String(m.userData.zone).split('|').some(id=>visible.has(id));for(const a of terminals)a.screen.visible=visible.has(a.zone);for(const a of [...moving,...indicators])a.mesh.visible=visible.has(a.zone);world.ice.visible=world.glaze.visible=visible.has('8');for(const o of world.deviceDynamic)o.visible=visible.has(o.userData.zone);world.analysisGate.mesh.visible=visible.has('6');world.mapPickup.mesh.visible=visible.has('1')&&!world.mapCollected;visibilityKey=key;}
  const selected=LAMP_DATA.filter(l=>visible.has(l.zone)).map(l=>({l,d:Math.hypot(l.position[0]-player.x,l.position[2]-player.z)-(world.lamps.some(s=>s.userData.source===l.id)?.55:0)})).sort((a,b)=>a.d-b.d).slice(0,4).map(x=>x.l);
  const next=selected.map(x=>x.id).sort().join(',');
  if(next!==lightKey){
   const remaining=selected.filter(l=>!world.lamps.some(s=>s.userData.source===l.id));
   for(const slot of world.lamps){if(selected.some(s=>s.id===slot.userData.source))continue;const L=remaining.shift();slot.userData.source=L?.id||null;slot.userData.spec=L||null;
    if(L){slot.position.set(...L.position);slot.target.position.set(L.position[0],0,L.position[2]);slot.color.setHex(L.color);slot.distance=L.distance;slot.shadow.camera.far=L.distance;slot.shadow.camera.updateProjectionMatrix();slot.intensity=L.intensity;}else slot.intensity=0;
   }
   renderer.shadowMap.needsUpdate=true;lightKey=next;
  }else if(key!==world._visibilityKey)renderer.shadowMap.needsUpdate=true;
  world._visibilityKey=key;
 };
 world.updateLights=(t,flicker)=>{for(const l of world.lamps){const L=l.userData.spec;if(!L){l.intensity=0;continue;}const i=Number(L.id.replace(/\D/g,''))||0;const v=flicker?(1+.009*Math.sin(t*4.7+i)+.008*Math.sin(t*9.3+i*3))*(1-.055*Math.pow(Math.max(0,Math.sin(t*.17+i*2.4)),36)):1;l.intensity=L.intensity*v;}};
 world.updateInstrumentState=(state,t,flickerAllowed=true)=>{
  world.mapCollected=state.mapOwned;world.mapPickup.mesh.visible=!state.mapOwned&&String(world._visibilityKey).split(',').includes('1');
  const gate=world.analysisGate;if(gate.open!==state.analysisUnlocked){gate.open=state.analysisUnlocked;gate.collider.enabled=!gate.open;gate.mesh.position.x=19.35+(gate.open?.075:0);gate.mesh.position.z=13.775+(gate.open?1.45:0);gate.mesh.updateMatrixWorld(true);}
  const lampFault=state.director?.active.find(e=>e.type==='lamp'&&!e.benign);
  if(lampFault)for(const l of world.lamps)if(l.userData.spec?.zone==='7')l.intensity*=flickerAllowed?.65+.15*Math.sin(t*8.9)+.10*Math.sin(t*14.7):.65;

  for(const a of indicators){if(a.key==='pulse'){a.mesh.material=state.job?.kind==='calibrate'&&Math.floor(t*9)%3===0?materials.ledGreen:materials.phosphor;}else if(a.key==='sensor'||a.key==='servers'||a.key==='control'){a.mesh.material=state.power?(state.fault&&!state.repaired?materials.ledAmber:materials.ledGreen):materials.black;}else a.mesh.material=materials.ledGreen;}
  for(const a of moving){if(a.key==='shutter'){a.mesh.position.y=state.controls.shutterClosed?1.10:1.48;continue;}a.mesh.rotation.z=a.key==='isolator'?(state.power?-.45:.45):a.key==='voltage'?(state.power?-.50+(state.controls?.voltageTrim||0)*.12:-1.25):a.key==='response'?(state.calibrated?.45:-.8):-.1;}
  iceUniforms.uTime.value=t;
 };
 return world;
}

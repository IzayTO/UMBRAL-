import * as T from './three.module.min.js';
import {boundsOf} from './layout.js?v=3.0';

// Physical instruments added to the existing station before static batching.
// Screen contents and actions belong to the simulation/controller, not this file.
export function installEquipment(world,h){
 const {box,cyl,torus,beam,solid,group,plate,inZone}=h;
 const devices=[],dynamic=[];
 const touchMaterial=new T.MeshBasicMaterial({transparent:true,opacity:0,colorWrite:false,depthWrite:false,side:T.DoubleSide});
 touchMaterial.name='equipment-touch-proxy';

 function movable(object,zone,role){
  object.userData.zone=zone;object.userData.role=role;
  object.traverse(o=>{
   o.userData.zone=zone;
   if(!o.isMesh)return;
   const at=world.parts.indexOf(o);if(at>=0)world.parts.splice(at,1);
   // Moving controls do not invalidate the station's cached shadow maps.
   o.castShadow=false;
   if(o.material.isMeshLambertMaterial){
    const b=boundsOf(zone),values=new Float32Array(o.geometry.attributes.position.count*4);
    for(let i=0;i<values.length;i+=4)values.set(b,i);
    o.geometry.setAttribute('roomBounds',new T.BufferAttribute(values,4));
   }
  });
  dynamic.push(object);return object;
 }

 function screen(parent,id,zone,w,h,y,z=.112){
  const geo=new T.PlaneGeometry(w,h,8,6),p=geo.attributes.position;
  for(let i=0;i<p.count;i++)p.setZ(i,.005*(1-(p.getX(i)/(w/2))**2-(p.getY(i)/(h/2))**2));
  geo.computeVertexNormals();
  const material=new T.MeshBasicMaterial({color:0xffffff});material.name='device-screen-'+id;
  const m=new T.Mesh(geo,material);m.name=material.name;m.position.set(0,y,z);m.userData.device=id;
  parent.add(m);world.materials[material.name]=material;world.specs[material.name]={color:0xffffff,emissive:true};
  movable(m,zone,'screen');return m;
 }

 function screw(parent,x,y,z=.105){
  cyl('iron',.012,.012,.014,x,y,z,6,parent,[Math.PI/2,0,0]);
  box('black',.012,.002,.002,x,y,z+.008,0,parent,false);
 }

 function control(parent,device,spec,x,y,scale=1){
  const kind=spec.kind||'button',pivot=new T.Group();
  pivot.position.set(x,y,.135);pivot.name=device.id+'-'+spec.id;
  pivot.userData.control=spec.id;pivot.userData.action=spec.action;
  pivot.userData.axis='z';pivot.userData.restZ=pivot.position.z;parent.add(pivot);
  const radius=(kind==='knob'?.058:kind==='switch'?.043:.037)*scale;
  cyl('black',radius*1.22,radius*1.22,.018,x,y,.111,10,parent,[Math.PI/2,0,0]);
  if(kind==='knob'){
   if(spec.valve){
    cyl('iron',.021,.021,.045,0,0,.006,8,pivot,[Math.PI/2,0,0],false,false);
    torus('red',.068,.010,0,0,.031,[0,0,0],pivot,12);
    for(let i=0;i<4;i++){const a=i*Math.PI/2;beam('red',[0,0,.031],[Math.sin(a)*.067,Math.cos(a)*.067,.031],.007,pivot,6);}
    box('enamel',.009,.022,.006,0,.059,.044,0,pivot,false);
   }else{
    cyl('iron',radius,radius,.047,0,0,0,12,pivot,[Math.PI/2,0,0],false,false);
    cyl('black',radius*.85,radius*.85,.012,0,0,.028,12,pivot,[Math.PI/2,0,0],false,false);
    box('enamel',.009*scale,.033*scale,.005,0,radius*.45,.037,0,pivot,false);
    for(let i=0;i<9;i++){
     const a=(i/8*1.5-.75)*Math.PI;
     const tick=box('enamel',.004,.011,.003,x+Math.sin(a)*radius*1.48,y+Math.cos(a)*radius*1.48,.108,0,parent,false);
     tick.rotation.z=-a;
    }
   }
  }else if(kind==='switch'){
   box('iron',.031*scale,.075*scale,.025,0,.018*scale,0,0,pivot,false);
   box('red',.040*scale,.026*scale,.034,0,.061*scale,.009,0,pivot,false);
   pivot.rotation.z=-.48;
   for(const d of [-1,1])box('enamel',.018,.004,.003,x+d*.057*scale,y,.11,0,parent,false);
  }else{
   cyl(spec.red?'red':'enamel',radius*.88,radius*.88,.032,0,0,.012,10,pivot,[Math.PI/2,0,0],false,false);
   cyl('iron',.009,.009,.005,0,0,.031,8,pivot,[Math.PI/2,0,0],false,false);
  }
  movable(pivot,device.zone,'control');
  const hit=new T.Mesh(new T.PlaneGeometry(.15*scale,.15*scale),touchMaterial);
  hit.position.set(x,y,.205);hit.name='hit-'+device.id+'-'+spec.id;hit.userData.device=device.id;hit.userData.control=spec.id;
  parent.add(hit);movable(hit,device.zone,'hit');
  const out={id:spec.id,kind,action:spec.action,mesh:pivot,hit,label:spec.label||spec.id};
  if(kind==='knob'){out.min=spec.min;out.max=spec.max;out.step=spec.step;}
  device.controls.push(out);return out;
 }

 function panel(options,controls){
  const {id,zone,x,z,y=1.45,yaw=0,w=.95,h=.68,title}=options;
  const g=group(x,z,yaw);g.position.y=y;g.name='equipment-'+id;g.userData.zone=zone;
  const d={id,zone,title,group:g,target:new T.Vector3(),normal:new T.Vector3(0,0,1).applyAxisAngle(new T.Vector3(0,1,0),yaw),size:[w+.06,h+.06],screen:null,controls:[],inspectPoint:new T.Vector3()};
  inZone(zone,()=>{
   // Worn cabinet, exposed fasteners and a recessed CRT in the V2 palette.
   box('green',w,h,.16,0,0,0,0,g);
   for(const sx of [-1,1])box('rust',.025,h+.02,.035,sx*(w/2-.008),0,.075,0,g);
   for(const sy of [-1,1])box('iron',w+.025,.018,.025,0,sy*h/2,.082,0,g);
   const sw=Math.min(.62,w-.15),sh=w<.70?.26:.31,sy=.095;
   box('black',sw+.055,sh+.045,.014,0,sy,.094,0,g);
   for(const sx of [-1,1])box('rust',.014,sh+.04,.019,sx*(sw/2+.014),sy,.106,0,g);
   d.screen=screen(g,id,zone,sw,sh,sy);
   for(const sx of [-1,1])for(const sy of [-1,1])screw(g,sx*(w/2-.044),sy*(h/2-.046));
   plate(3,0,Math.min(.17,w*.27),.044,-w*.30,-.103,.094,[0,0,0],g);
   for(let i=0;i<4;i++)box('black',.036,.007,.003,w*.27+i*.020,-.103,.092,0,g,false);
   if(options.desktop){
    // A real stand joins the instrument to its bench; no suspended enclosure.
    box('iron',w*.70,.09,.19,0,-h/2-.025,-.025,0,g);
   }else{
    for(const sx of [-1,1])box('iron',.043,h*.70,.105,sx*w*.35,0,-.109,0,g);
    beam('wire',[-w*.32,-h*.5,-.10],[-w*.32,-y+.18,-.10],.012,g);
    for(const yy of [-.52,-.92])if(y+yy>.20)box('iron',.045,.018,.04,-w*.32,yy,-.105,0,g);
   }
   const spacing=Math.min(.19,(w-.19)/Math.max(1,controls.length-1));
   controls.forEach((s,i)=>control(g,d,s,(i-(controls.length-1)/2)*spacing,-.224,w<.65?.85:1));
  });
  // Wall panels protrude into the player's body space, but never cross a doorway.
  if(!options.desktop)solid(x,z,w+.025,.22,yaw,'device-'+id);
  g.updateMatrixWorld(true);d.target.copy(g.localToWorld(new T.Vector3(0,0,.105)));d.inspectPoint.copy(d.target).addScaledVector(d.normal,.78);
  devices.push(d);return d;
 }
 const B=(id,action,label,red=false)=>({id,action,label,kind:'button',red});
 const S=(id,action,label)=>({id,action,label,kind:'switch'});
 const K=(id,action,min,max,step,label)=>({id,action,min,max,step,label,kind:'knob'});

 // Check-in is 47 cm north of the requested point to keep its approach clear
 // of the original Access chair. Relay is narrower to fit beside the V2 gauges.
 panel({id:'checkin',zone:'1',title:'ESTACIÓN DE ACCESO',x:5.82,z:3.18,yaw:-Math.PI/2},[B('briefing','briefing','REGISTRAR')]);
 panel({id:'supply',zone:'2',title:'SUMINISTRO / SUPERVISIÓN',x:5.8,z:6.28},[
  B('inspect:supply','inspect:supply','INSPECCIÓN'),K('voltageTrim','supplyTrim',-2,2,.1,'TENSIÓN'),S('load','loadToggle','CARGA')]);
 panel({id:'link',zone:'4',title:'ENLACE / MÓDULO 17',x:14.70,z:11.05,y:1.5,yaw:-Math.PI/2},[
  S('isolate','isolate','AISLAR'),B('inspectLink','inspectLink','CONTACTOS'),B('reseat','reseat','REAJUSTAR'),S('restore','restore','RESTABLECER')]);

 panel({id:'scope',zone:'5',title:'OSCILOSCOPIO / SINCRONÍA',x:15.25,z:4.9,y:1.22,yaw:Math.PI/2,desktop:true},[
  K('syncTrim','syncTrim',-30,30,.5,'DESFASE'),B('syncTest','syncTest','COMPARAR')]);
 inZone('5',()=>{
  const bench=group(15.25,4.9,Math.PI/2);
  box('wood',1.12,.06,.72,0,.81,0,0,bench);box('rust',1.15,.055,.026,0,.79,.363,0,bench);
  for(const x of [-.45,.45])for(const z of [-.27,.27])box('iron',.044,.78,.044,x,.39,z,0,bench);
  for(const x of [-.45,.45])beam('iron',[x,.20,-.27],[x,.20,.27],.018,bench);
  beam('wire',[-.33,.88,-.11],[-.33,.10,-.29],.017,bench);
  plate(1,1,.19,.23,-.35,.843,.23,[-Math.PI/2,0,.1],bench);
  solid(15.25,4.9,1.16,.77,Math.PI/2,'scope-bench');
 });
 panel({id:'acquisition',zone:'3',title:'ADQUISICIÓN / DISCRIMINADOR',x:7.48,z:2.8,y:1.5,yaw:Math.PI/2},[
  K('multiplicity','multiplicity',2,8,1,'COINCIDENCIA'),K('windowNs','windowNs',400,2400,100,'VENTANA'),S('notchToggle','notchToggle','FILTRO'),B('acqTest','acqTest','PRUEBA'),B('acqAccept','acqAccept','ACEPTAR')]);

 panel({id:'pulser',zone:'5',title:'GENERADOR / PULSOS LED',x:20.18,z:.19,y:1.50,w:.90},[K('pulseLevel','pulseLevel',1,10,1,'NIVEL LED'),B('calibrate','calibrate','EMITIR')]);
 const fan=panel({id:'fan',zone:'4',title:'VENTILACIÓN / COJINETE',x:11.5,z:10.27,y:1.7},[
  K('fanTrim','fanTrim',0,10,.25,'AJUSTE'),B('inspect:fan','inspect:fan','INSPECCIÓN'),B('verify:fan','verify:fan','VERIFICAR')]);
 inZone('4',()=>{
  const g=fan.group;box('green',.50,.50,.18,0,.56,-.035,0,g);cyl('black',.212,.212,.018,0,.56,.066,12,g,[Math.PI/2,0,0]);
  const rotor=new T.Group();rotor.position.set(0,.56,.083);g.add(rotor);rotor.userData.key='fanSpin';rotor.name='fan-rotor';
  for(let i=0;i<4;i++){
   const a=i*Math.PI/2,m=box('iron',.075,.15,.012,Math.sin(a)*.108,Math.cos(a)*.108,0,0,rotor,false);m.rotation.z=-a;
  }
  cyl('black',.050,.050,.029,0,0,.012,10,rotor,[Math.PI/2,0,0],false,false);movable(rotor,'4','fan-rotor');
  torus('iron',.212,.013,0,.56,.127,[0,0,0],g,12);
  for(let i=-3;i<=3;i++){
   const p=i*.05,e=Math.sqrt(.20*.20-p*p);
   beam('iron',[-e,.56+p,.131],[e,.56+p,.131],.005,g,5);
   beam('iron',[p,.56-e,.132],[p,.56+e,.132],.005,g,5);
  }
  for(const x of [-.22,.22])for(const y of [.34,.78])screw(g,x,y,.068);
 });
 fan.group.updateMatrixWorld(true);fan.target.copy(fan.group.localToWorld(new T.Vector3(0,.23,.11)));fan.size=[1.01,1.21];fan.inspectPoint.copy(fan.target).addScaledVector(fan.normal,.9);

 panel({id:'relay',zone:'3',title:'RELÉ / CONTACTOS',x:11.79,z:.19,y:1.7,w:.58,h:.66},[
  S('relayPower','relayPower','CIRCUITO'),B('inspect:relay','inspect:relay','INSPECCIÓN'),B('relayReplace','relayReplace','SUSTITUIR')]);
 panel({id:'comms',zone:'4',title:'COMUNICACIONES',x:13.53,z:13.51,yaw:Math.PI,w:.70},[
  K('commChannel','commChannel',1,6,1,'CANAL'),B('inspect:comms','inspect:comms','INSPECCIÓN'),B('commReset','commReset','REINICIAR')]);
 const pipeKnob=K('pipeFlow','pipeFlow',0,1,.05,'CAUDAL');pipeKnob.valve=true;
 const pipe=panel({id:'pipe',zone:'h4',title:'RETORNO / VIBRACIÓN',x:14.08,z:8.75,y:1.30,yaw:-Math.PI/2,w:.60},[
  pipeKnob,B('inspect:pipe','inspect:pipe','INSPECCIÓN'),B('verify:pipe','verify:pipe','VERIFICAR')]);
 inZone('h4',()=>{
  const g=pipe.group;beam('rust',[-.18,-.72,-.075],[-.18,.69,-.075],.035,g);
  for(const y of [-.56,.52])cyl('iron',.052,.052,.045,-.18,y,-.075,8,g);
  beam('iron',[-.18,-.224,-.075],[-.18,-.224,.09],.021,g);
 });
 panel({id:'thermal',zone:'5',title:'TERMOMETRÍA / REFERENCIA',x:21.85,z:5.15,y:1.5,yaw:-Math.PI/2},[
  K('tempTrim','tempTrim',-8,8,.25,'CORRECCIÓN'),S('tempReference','tempReference','REFERENCIA'),B('inspect:temperature','inspect:temperature','INSPECCIÓN'),B('verify:temperature','verify:temperature','VERIFICAR')]);
 panel({id:'lamp',zone:'7',title:'ALUMBRADO / REGULADOR',x:7.67,z:21.10,y:1.5,yaw:-Math.PI/2},[
  K('lampTrim','lampTrim',0,10,.25,'BALASTO'),B('inspect:lamp','inspect:lamp','INSPECCIÓN'),B('verify:lamp','verify:lamp','VERIFICAR')]);

 // Attach a paper feed/readout directly to the original recorder. Its existing
 // pedestal and collider remain owned by station.js, so no extra desk appears.
 const pg=group(10.94,.77,0);pg.position.y=1.16;pg.name='equipment-printer';pg.userData.zone='3';
 const printer={id:'printer',zone:'3',title:'REGISTRADOR / PAPEL',group:pg,target:new T.Vector3(10.94,1.16,.82),normal:new T.Vector3(0,0,1),size:[.56,.43],screen:null,controls:[],inspectPoint:new T.Vector3(10.94,1.16,1.60),display:'paper'};
 inZone('3',()=>{
  box('rust',.46,.28,.035,0,-.055,-.025,0,pg);
  for(const x of [-.17,.17])box('iron',.025,.29,.095,x,-.02,-.05,0,pg);
  box('paper',.38,.21,.010,0,.10,.006,0,pg);
  printer.screen=screen(pg,'printer','3',.34,.18,.10,.016);
  for(const x of [-.21,.21])screw(pg,x,-.12,.001);
  const feedControls=new T.Group();feedControls.position.z=-.105;pg.add(feedControls);
  control(feedControls,printer,B('inspect:printer','inspect:printer','LEER'),-.11,-.12,.8);
  control(feedControls,printer,B('printerFeed','printerFeed','AVANCE'),.11,-.12,.8);
 });
 devices.push(printer);
 world.root.updateMatrixWorld(true);
 return {devices,dynamic,gate:null};
}

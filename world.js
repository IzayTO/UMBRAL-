import * as T from './three.module.min.js';

export const TEX = ['paint','rust','green','red','concrete','floor','wood','iron','cardboard','paper','enamel','cloth','rubber','tread','hazard','decals'];
export const START = { x:1.85, z:4.85, yaw:0.43, pitch:-0.055 };
export const LAMPS = [
  {position:[-.65,2.26,2.35], color:0xffd79d, intensity:31, distance:5.0},
  {position:[.60,2.27,-3.05], color:0xd0dec1, intensity:28, distance:4.8}
];

// Original scene. All dimensions are metres. Textures stay local; no external assets.
export function buildWorld(textures = {}) {
  const root = new T.Group(), colliders=[], materials={}, parts=[], lamps=[];
  const ambient = new T.AmbientLight(0xc0bc9d, .23);
  root.add(ambient);
  const specs={};
  for (const name of TEX) specs[name]={texture:name,color:0xffffff};
  Object.assign(specs,{
    black:{texture:'rubber',color:0x64645b},brass:{texture:'rust',color:0xd1b979},
    wire:{texture:'iron',color:0x555650}, ceiling:{texture:'concrete',color:0x8c8b79},
    dust:{texture:'concrete',color:0xaaa385},darkRust:{texture:'rust',color:0x77705e},
    bulbA:{color:0xffe2b2,emissive:true},bulbB:{color:0xcbd8ad,emissive:true}
  });
  for(const [name,s] of Object.entries(specs)) {
    const P=s.emissive?T.MeshBasicMaterial:T.MeshLambertMaterial;
    materials[name]=new P({map:textures[s.texture]||null,color:s.color,side:T.FrontSide});
    materials[name].name=name;
  }
  function mesh(g,m,pos=[0,0,0],rot=[0,0,0],parent=root,shadow=true){
    const o=new T.Mesh(g,materials[m]);o.position.set(...pos);o.rotation.set(...rot);
    o.castShadow=shadow;o.receiveShadow=!specs[m].emissive;parent.add(o);parts.push(o);return o;
  }
  function box(m,w,h,d,x,y,z,rot=0,parent=root,shadow=true){
    const g=new T.BoxGeometry(w,h,d); const uv=g.attributes.uv;
    // Continuous texel density: approximately 96 pixels per metre on most surfaces.
    if(m!=='decals'){
      const tile=m==='floor'?1.4:m==='concrete'||m==='ceiling'?1.9:m==='wood'?1.0:1.25;
      for(let i=0;i<uv.count;i++){
        const face=(i/4)|0; const su=face<2?d:w,sv=face>=2&&face<4?d:h;
        uv.setXY(i,uv.getX(i)*Math.max(.2,su/tile),uv.getY(i)*Math.max(.2,sv/tile));
      }
    }
    return mesh(g,m,[x,y,z],[0,rot,0],parent,shadow);
  }
  function cyl(m,rt,rb,h,x,y,z,n=10,parent=root,rot=[0,0,0],open=false,shadow=true){
    return mesh(new T.CylinderGeometry(rt,rb,h,n,1,open),m,[x,y,z],rot,parent,shadow);
  }
  function torus(m,r,tube,x,y,z,rot=[0,0,0],parent=root,n=12){return mesh(new T.TorusGeometry(r,tube,4,n),m,[x,y,z],rot,parent);}
  function beam(m,a,b,r=.035,parent=root,n=7){
    const va=new T.Vector3(...a),vb=new T.Vector3(...b),mid=va.clone().add(vb).multiplyScalar(.5);
    const o=cyl(m,r,r,va.distanceTo(vb),...mid,n,parent);
    o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),vb.sub(va).normalize());return o;
  }
  function solid(x,z,w,d,angle=0,label='solid'){colliders.push({x,z,w,d,angle,label});}
  function group(x,z,angle=0){const g=new T.Group();g.position.set(x,0,z);g.rotation.y=angle;root.add(g);return g;}
  function plate(u,v,w,h,x,y,z,rot=[0,0,0],parent=root){
    const g=new T.PlaneGeometry(w,h),a=g.attributes.uv;
    for(let i=0;i<a.count;i++)a.setXY(i,(u+a.getX(i))/4,1-(v+1-a.getY(i))/4);
    return mesh(g,'decals',[x,y,z],rot,parent,false);
  }
  function bolt(x,y,z,parent=root,rot=[Math.PI/2,0,0]){cyl('iron',.024,.024,.018,x,y,z,6,parent,rot);}

  // Two sealed 6 × 6 m rooms; shared wall has one unobstructed open doorway.
  for(const cz of [3.12,-3.12]){
    box('floor',6,.16,6,0,-.08,cz);
    box('ceiling',6.3,.15,6.25,0,2.72,cz);
    for(const sx of [-1,1]){
      box('concrete',.18,2.68,6.25,sx*3.09,1.34,cz);
      box(cz>0?'paint':'green',.035,1.24,6,sx*2.985,.63,cz);
      box('iron',.065,.065,6,sx*2.965,1.285,cz);
      box('darkRust',.075,.10,6,sx*2.96,.065,cz);
      for(let z=cz-2.8;z<cz+3;z+=1.16){
        box('darkRust',.08,.94,.035,sx*2.95,.62,z);
        for(const y of [.23,1.05])cyl('iron',.024,.024,.018,sx*2.91,y,z,6,root,[0,0,Math.PI/2]);
      }
    }
    const far=cz>0?6.21:-6.21;
    box('concrete',6.35,2.68,.18,0,1.34,far);
    box(cz>0?'paint':'green',6,1.24,.035,0,.63,far+(cz>0?-.102:.102));
    box('iron',6,.065,.065,0,1.285,far+(cz>0?-.13:.13));
    box('darkRust',6,.10,.075,0,.065,far+(cz>0?-.13:.13));
  }
  // Inner boundary is x ±3, z ±6.12. Wall jambs define a 1.60 m doorway.
  for(const [x,w] of [[-1.85,2.3],[1.95,2.1]]){
    box('paint',w,2.68,.24,x,1.34,0);solid(x,0,w,.24,0,'shared-wall');
  }
  box('rust',1.60,.51,.24,.10,2.425,0);
  for(const x of [-.73,.93])box('rust',.11,2.20,.38,x,1.10,0);
  box('darkRust',1.82,.10,.38,.10,2.22,0);
  box('tread',1.52,.018,.38,.10,.009,0);
  box('hazard',1.48,.004,.09,.10,.021,.23);
  plate(2,1,.38,.38,1.27,1.69,.133);
  plate(1,2,.46,.46,-1.06,1.65,-.133,[0,Math.PI,0]);
  for(const z of [-6.22,6.22])solid(0,z,6.4,.2,0,'outer-wall');
  for(const x of [-3.10,3.10])solid(x,0,.2,12.5,0,'outer-wall');
  // Open door: the steel slab remains fixed at 94 degrees, against the second room.
  const door=group(.91,-.08,-Math.PI/2-.07);
  box('rust',1.51,2.08,.085,-.755,1.05,0,0,door);
  box('green',1.29,1.81,.018,-.755,1.05,.052,0,door);
  for(const y of [.3,1.05,1.79])box('iron',1.37,.055,.033,-.755,y,.075,0,door);
  for(const x of [-1.40,-.1])for(const y of [.20,1.92])bolt(x,y,.082,door);
  plate(0,0,.26,.26,-.76,1.49,.083,[0,0,0],door);
  beam('iron',[-1.29,.92,.10],[-1.29,1.16,.10],.025,door);
  for(const y of [.38,1.65])cyl('iron',.055,.055,.18,-.005,y,.03,8,door);
  // door centre transformed from local coordinates for exact collision.
  const dc=new T.Vector3(-.755,0,0).applyAxisAngle(new T.Vector3(0,1,0),door.rotation.y).add(door.position);
  solid(dc.x,dc.z,1.51,.10,door.rotation.y,'open-door');
  box('wood',.12,.08,.18,1.08,.04,-1.55);

  // Ceiling ribs, restrained conduit and one caged pendant per room.
  for(const cz of [3.12,-3.12]){
    for(const z of [cz-1.7,cz+.65]){
      box('darkRust',6.05,.11,.15,0,2.59,z);
      box('iron',.17,.17,.24,-2.93,2.57,z);box('iron',.17,.17,.24,2.93,2.57,z);
    }
    beam('wire',[-2.93,2.42,cz-2.8],[-2.93,2.42,cz+2.8],.025);
  }
  LAMPS.forEach((s,i)=>{
    const [x,y,z]=s.position;
    cyl('iron',.085,.085,.065,x,2.615,z);
    beam('wire',[x,2.61,z],[x,2.46,z],.014);
    cyl('iron',.085,.28,.19,x,2.39,z,12,root,[0,0,0],true,false);
    torus('iron',.27,.022,x,2.295,z,[Math.PI/2,0,0]);
    cyl(i?'bulbB':'bulbA',.105,.105,.046,x,2.297,z,10,root,[0,0,0],false,false);
    for(let k=0;k<4;k++){
      const a=k*Math.PI/2;
      beam('iron',[x+Math.cos(a)*.19,2.31,z+Math.sin(a)*.19],[x+Math.cos(a)*.14,2.235,z+Math.sin(a)*.14],.009);
    }
    const light=new T.SpotLight(s.color,s.intensity,s.distance,1.33,.34,2);
    light.position.set(x,y,z);light.target.position.set(x,0,z);root.add(light,light.target);
    light.castShadow=true;light.shadow.mapSize.set(1024,1024);light.shadow.bias=-.00022;light.shadow.normalBias=.017;
    light.shadow.camera.near=.07;light.shadow.camera.far=s.distance;lamps.push(light);
  });

  function carton(parent,x,y,z,w=.52,h=.36,d=.42,angle=0){
    box('cardboard',w,h,d,x,y+h/2,z,angle,parent);
    // Tape wraps around each carton.
    box('paper',.08,.003,d+.007,x,y+h+.003,z,angle,parent);
    plate(1,0,w*.48,h*.64,x,y+h*.55,z+d/2+.004,[0,0,0],parent);
  }
  function can(parent,x,y,z,r=.10,h=.27,m='red'){
    cyl(m,r,r,h,x,y+h/2,z,10,parent);cyl('iron',r*1.025,r*1.025,.02,x,y+h,z,10,parent);
    torus('iron',r,.009,x,y+.01,z,[Math.PI/2,0,0],parent);
  }
  function bottle(parent,x,y,z){
    cyl('green',.049,.055,.16,x,y+.08,z,8,parent);cyl('green',.025,.05,.045,x,y+.182,z,8,parent);
    cyl('green',.023,.023,.065,x,y+.232,z,8,parent);cyl('iron',.026,.026,.025,x,y+.272,z,8,parent);
  }
  function chair(x,z,angle){
    const g=group(x,z,angle);
    box('wood',.44,.045,.43,0,.46,0,0,g);box('green',.43,.27,.04,0,.79,.185,-.02,g);
    for(const sx of [-1,1]){
      beam('iron',[sx*.17,.035,-.18],[sx*.19,.47,-.16],.020,g);
      beam('iron',[sx*.19,.035,.23],[sx*.18,.93,.18],.02,g);
      beam('iron',[sx*.18,.23,-.17],[sx*.18,.23,.20],.015,g);
      cyl('rubber',.025,.025,.03,sx*.17,.02,-.18,8,g);
    }
    solid(x,z,.53,.55,angle,'chair');return g;
  }
  // Work table: a shaped steel frame, separate boards and occupied working surface.
  const table=group(-.62,2.50,-.07);
  for(let i=0;i<5;i++)box('wood',1.80,.055,.184,0,.79,-.384+i*.192,0,table);
  for(const z of [-.49,.49])box('rust',1.86,.09,.025,0,.765,z,0,table);
  for(const x of [-.77,.77]){
    for(const z of [-.37,.37])box('iron',.048,.74,.048,x,.37,z,0,table);
    beam('iron',[x,.28,-.38],[x,.28,.38],.024,table);
  }
  beam('iron',[-.78,.18,.38],[.77,.64,.38],.02,table);
  solid(-.62,2.50,1.86,1.02,-.07,'table');
  chair(-.43,3.44,.13);chair(-1.85,2.2,-1.34);
  // Small analogue radio. Speaker and recessed scale, no modern glowing display.
  box('green',.49,.28,.22,-.55,.965,-.29,0,table);
  plate(3,0,.275,.19,-.61,.97,-.172,[0,0,0],table);
  box('black',.12,.055,.008,-.37,1.032,-.172,0,table);
  for(const x of [-.408,-.331])cyl('iron',.025,.025,.025,x,.911,-.153,8,table,[Math.PI/2,0,0]);
  beam('iron',[-.7,1.11,-.33],[-.81,1.47,-.33],.006,table);
  plate(0,1,.34,.45,.17,.824,.13,[-Math.PI/2,0,.13],table);
  plate(1,1,.30,.38,.40,.827,-.03,[-Math.PI/2,0,-.24],table);
  // Open enamel mug, dark interior and a low-poly curved handle.
  cyl('enamel',.066,.059,.13,-.18,.893,.15,10,table,[0,0,0],true);
  cyl('black',.057,.057,.005,-.18,.84,.15,10,table);
  torus('enamel',.064,.009,-.18,.96,.15,[Math.PI/2,0,0],table,10);
  torus('enamel',.04,.010,-.108,.90,.15,[0,0,0],table,8);
  // Tin ashtray, spent pencils and a small unlit inspection instrument.
  cyl('iron',.079,.077,.016,.57,.837,.30,10,table);
  beam('paper',[.52,.854,.29],[.60,.854,.31],.007,table,6);
  beam('red',[.03,.832,-.15],[.27,.832,-.11],.006,table,5);
  box('black',.10,.055,.19,-.02,.85,-.29,.11,table);
  // Under-table tool case.
  box('rust',.54,.20,.32,-.75,.13,2.55);

  // Shelving on the left, with intentionally uneven storage.
  const shelf=group(-2.61,4.57,0);
  for(const x of [-.28,.28])for(const z of [-.89,.89])box('iron',.042,2.18,.042,x,1.09,z,0,shelf);
  for(const y of [.16,.66,1.20,1.76,2.12])box('rust',.62,.038,1.88,0,y,0,0,shelf);
  for(const z of [-.90,.90])beam('iron',[-.29,.15,z],[.29,2.1,z],.017,shelf);
  carton(shelf,0,.68,-.46,.47,.36,.62);carton(shelf,0,.18,.39,.51,.41,.64);
  carton(shelf,0,1.78,.29,.49,.28,.42);carton(shelf,-.04,1.22,-.55,.42,.38,.47);
  can(shelf,.10,1.22,.15,.095,.27,'red');can(shelf,-.12,1.22,.44,.08,.23,'paint');
  bottle(shelf,.11,1.78,-.59);bottle(shelf,-.08,1.78,-.48);
  box('cloth',.47,.12,.45,0,.74,.41,0,shelf);
  solid(-2.61,4.57,.69,1.96,0,'shelf');

  // Weathered electrical box and a disconnected bench area on the right wall.
  const cab=group(2.77,3.83,-Math.PI/2);
  box('green',.70,1.04,.22,0,1.57,0,0,cab);
  plate(3,1,.28,.28,-.13,1.83,.117,[0,0,0],cab);
  plate(0,0,.22,.22,.18,1.47,.117,[0,0,0],cab);
  for(const x of [-.21,0,.21])cyl('black',.047,.047,.035,x,1.27,.137,8,cab,[Math.PI/2,0,0]);
  for(const x of [-.31,.31])for(const y of [1.12,2.02])bolt(x,y,.128,cab);
  solid(2.78,3.83,.30,.74,0,'electrical-cabinet');
  beam('iron',[2.82,1.04,3.8],[2.82,.22,3.8],.028);beam('iron',[2.82,.22,3.8],[2.82,.22,5.73],.028);
  // Rear vent reads as sealed ventilation equipment, never an exterior window.
  box('iron',1.10,.45,.12,.83,2.07,6.05);
  for(let i=0;i<8;i++)box('darkRust',.96,.028,.04,.83,1.90+i*.043,5.975);
  plate(0,2,.56,.56,-1.17,1.96,6.10,[0,Math.PI,0]);
  plate(2,2,.30,.30,1.99,1.93,6.095,[0,Math.PI,0]);
  // A tipped-over stool in a dead corner, well outside the doorway.
  const stool=group(2.03,5.32,.34);box('wood',.38,.055,.38,0,.46,0,0,stool);
  for(const x of [-.13,.13])for(const z of [-.13,.13])beam('iron',[x,.03,z],[x,.44,z],.024,stool);
  solid(2.03,5.32,.43,.43,.34,'stool');

  // Service room: heavy return pipe, tank and a small mechanical pump.
  beam('rust',[-2.81,.49,-5.82],[-2.81,2.10,-5.82],.16);
  beam('rust',[-2.81,2.10,-5.82],[2.72,2.10,-5.82],.16);
  for(const x of [-2.41,-.45,1.86]){
    cyl('iron',.235,.235,.09,x,2.10,-5.82,12,root,[0,0,Math.PI/2]);
    for(let k=0;k<8;k++){let a=k*Math.PI/4;cyl('iron',.026,.026,.11,x,2.10+Math.cos(a)*.19,-5.82+Math.sin(a)*.19,6,root,[0,0,Math.PI/2]);}
  }
  beam('green',[2.70,.34,-5.82],[2.70,2.10,-5.82],.16);
  solid(-2.81,-5.70,.38,.60,0,'return-pipe');
  solid(2.70,-5.82,.34,.34,0,'return-pipe');
  const tank=group(1.95,-4.75,0);
  cyl('green',.49,.49,1.50,0,1.03,0,12,tank);
  cyl('green',.32,.49,.20,0,1.88,0,12,tank);
  cyl('darkRust',.49,.36,.19,0,.185,0,12,tank);
  for(const y of [.35,1.69])torus('iron',.493,.03,0,y,0,[Math.PI/2,0,0],tank);
  for(const x of [-.3,.3])box('iron',.08,.14,.45,x,.07,0,0,tank);
  beam('iron',[0,1.73,0],[0,2.08,0],.07,tank);
  beam('iron',[0,2.08,0],[0,2.08,-1.02],.07,tank);
  plate(3,2,.26,.26,0,1.19,.495,[0,0,0],tank);
  solid(1.95,-4.75,1.02,1.02,0,'tank');
  // Gauge with real silhouette and authored dial face.
  beam('brass',[1.95,1.56,-4.3],[1.95,1.56,-4.07],.038);
  cyl('iron',.115,.115,.07,1.95,1.56,-4.05,12,root,[Math.PI/2,0,0]);
  plate(2,0,.208,.208,1.95,1.56,-4.009);
  // Valve wheel and spokes.
  beam('rust',[-2.81,1.13,-5.82],[-2.81,1.13,-5.49],.065);
  torus('red',.20,.025,-2.81,1.13,-5.41);
  for(let i=0;i<4;i++){let a=i*Math.PI/2;beam('red',[-2.81,1.13,-5.41],[-2.81+Math.sin(a)*.19,1.13+Math.cos(a)*.19,-5.41],.012);}
  box('iron',1.65,.12,.74,-.49,.06,-5.11);
  cyl('green',.26,.26,.66,-.74,.40,-5.10,12,root,[0,0,Math.PI/2]);
  for(let i=0;i<9;i++)cyl('iron',.27,.27,.018,-1.02+i*.066,.40,-5.10,12,root,[0,0,Math.PI/2]);
  cyl('rust',.35,.35,.30,.03,.46,-5.10,10,root,[0,0,Math.PI/2]);
  beam('rust',[.02,.6,-5.10],[.02,1.07,-5.10],.09);
  beam('rust',[.02,1.07,-5.10],[.02,1.07,-5.78],.09);
  solid(-.49,-5.10,1.75,.90,0,'pump');

  // Crates/pallets, service shelf, floor grating and a coherent tool bench.
  const pallet=group(-1.94,-4.08,.08);
  for(const x of [-.4,.4])box('wood',.13,.11,1.1,x,.065,0,0,pallet);
  for(let i=0;i<5;i++)box('wood',1.08,.035,.19,0,.14,-.44+i*.22,0,pallet);
  carton(pallet,0,.16,.03,.88,.64,.82);
  carton(pallet,-.1,.80,.03,.62,.44,.59);
  solid(-1.94,-4.08,1.18,1.20,.08,'pallet');
  const work=group(-2.60,-1.80,Math.PI/2);
  box('wood',1.4,.07,.56,0,.91,0,0,work);
  for(const x of [-.56,.56])for(const z of [-.21,.21])box('iron',.045,.9,.045,x,.45,z,0,work);
  for(const x of [-.56,.56])beam('iron',[x,.25,-.21],[x,.25,.21],.018,work);
  can(work,-.4,.95,.01,.12,.32,'red');can(work,-.17,.95,-.10,.07,.18,'paint');
  // A recognisable wrench: handle, jaw and angular head.
  box('iron',.25,.018,.04,.27,.96,.09,-.2,work);
  box('iron',.065,.019,.10,.41,.96,.06,0,work);box('iron',.04,.019,.04,.46,.96,.10,0,work);box('iron',.04,.019,.04,.46,.96,.02,0,work);
  plate(1,1,.22,.31,.02,.95,.02,[-Math.PI/2,0,.1],work);
  solid(-2.60,-1.80,.65,1.52,0,'service-bench');
  // Short shelf with oil canisters.
  box('rust',.46,.04,1.18,2.72,1.35,-2.06);
  for(const z of [-2.48,-1.66])beam('iron',[2.9,.95,z],[2.52,1.33,z],.025);
  for(const z of [-2.4,-1.8])can(root,2.7,1.37,z,.095,.28,'red');
  solid(2.76,-2.06,.50,1.2,0,'oil-shelf');
  box('iron',.8,.009,.52,.20,.009,-3.62);
  for(let k=0;k<11;k++)box('black',.029,.004,.46,-.15+k*.068,.017,-3.62);
  for(const x of [-.17,.56])for(const z of [-3.85,-3.4])cyl('iron',.018,.018,.012,x,.022,z,6);
  // Capped pipes (no holes to the exterior).
  for(const y of [.40,.58])beam('darkRust',[2.84,y,-.4],[2.84,y,-5.7],.045);
  for(const z of [-1,-2.9,-4.5])box('iron',.025,.34,.06,2.78,.49,z);
  solid(2.84,-3.05,.14,5.38,0,'low-pipes');
  // Quiet clutter: cable coil, rags and a few discarded paper sheets.
  for(let i=0;i<3;i++)torus('rubber',.23+i*.035,.012,1.91,.025+i*.008,-1.20,[Math.PI/2,.02,0]);
  box('cloth',.34,.035,.28,-1.35,.025,5.35,.26);
  plate(0,1,.23,.30,.88,.012,3.7,[-Math.PI/2,0,.2]);
  plate(1,1,.2,.27,1.2,.014,-4.2,[-Math.PI/2,0,-.3]);
  // Rusted wall stitches and exposed fasteners near the lamp pools.
  for(const z of [1.15,2.7,-1.6,-3.8]){
    box('rust',.02,.74,.10,-2.96,1.77,z);
    for(const y of [1.47,2.06])cyl('iron',.024,.024,.014,-2.93,y,z,6,root,[0,0,Math.PI/2]);
  }
  root.updateMatrixWorld(true);
  return {root,materials,specs,parts,colliders,lamps,ambient};
}

// Merge static objects by material and shadow behaviour. The meshes remain low-poly;
// batching removes hundreds of CPU draw submissions on mobile devices.
export function batchWorld(world) {
  world.root.updateMatrixWorld(true);const buckets=new Map();
  for(const m of world.parts){const key=m.material.name+':'+Number(m.castShadow);if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(m);}
  const merged=[];
  for(const items of buckets.values()){
    const pos=[],nor=[],uv=[];
    for(const m of items){
      const g=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();g.applyMatrix4(m.matrixWorld);
      pos.push(g.attributes.position.array);nor.push(g.attributes.normal.array);uv.push(g.attributes.uv.array);g.dispose();
    }
    const concat=a=>{const out=new Float32Array(a.reduce((n,v)=>n+v.length,0));let at=0;for(const v of a){out.set(v,at);at+=v.length;}return out;};
    const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(concat(pos),3));g.setAttribute('normal',new T.BufferAttribute(concat(nor),3));g.setAttribute('uv',new T.BufferAttribute(concat(uv),2));g.computeBoundingSphere();
    const m=new T.Mesh(g,items[0].material);m.castShadow=items[0].castShadow;m.receiveShadow=items[0].receiveShadow;world.root.add(m);merged.push(m);
  }
  for(const m of world.parts){m.removeFromParent();m.geometry.dispose();}world.parts=merged;return world;
}

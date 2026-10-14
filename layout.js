// Dimensions follow the user's white sketch (IMG_0469), not the earlier blue plan.
// X runs right; Z runs down the drawing. Coordinates are metres.
export const ROOMS = [
 {id:'1',name:'ACCESO',x:0,z:0,w:6,d:6.10},
 {id:'2',name:'TALLER',x:0,z:6.10,w:12.20,d:3.65},
 {id:'3',name:'CONTROL',x:7.30,z:0,w:4.90,d:3.55},
 {id:'4',name:'SERVIDORES',x:10,z:10.10,w:4.95,d:3.65},
 {id:'5',name:'CALIBRACIÓN',x:14.55,z:0,w:7.55,d:6.75},
 {id:'6',name:'ANÁLISIS',x:17.30,z:9.35,w:5,d:7.05},
 {id:'7',name:'ARCHIVO',x:2.75,z:12.65,w:5.15,d:10.20},
 {id:'8',name:'OBSERVACIÓN',x:13.10,z:18.20,w:12.65,d:4.65}
];
export const HALLS = [
 {id:'h23',name:'PASO 02 / 03',x:8.05,z:3.55,w:3.25,d:2.55},
 {id:'h35',name:'DISTRIBUIDOR',x:12.20,z:.45,w:2.35,d:2.70},
 {id:'h4',name:'PASARELA TÉCNICA',x:12.55,z:3.15,w:1.70,d:6.95},
 {id:'h56',name:'PASO 05 / 06',x:18.30,z:6.75,w:2.90,d:2.60},
 {id:'h67',name:'PASO 06 / 07',x:7.90,z:14.20,w:9.40,d:1.90},
 {id:'h78',name:'PASO 07 / 08',x:7.90,z:18.80,w:5.20,d:1.90}
];
export const ZONES=[...ROOMS,...HALLS];
export const PORTALS=[
 {a:'1',b:'2',axis:'z',line:6.10,lo:2.10,hi:3.70},
 {a:'2',b:'h23',axis:'z',line:6.10,lo:8.85,hi:10.50},
 {a:'h23',b:'3',axis:'z',line:3.55,lo:8.85,hi:10.50},
 {a:'3',b:'h35',axis:'x',line:12.20,lo:1.00,hi:2.50},
 {a:'h35',b:'5',axis:'x',line:14.55,lo:1.00,hi:2.50},
 {a:'h35',b:'h4',axis:'z',line:3.15,lo:12.55,hi:14.25,open:true},
 {a:'h4',b:'4',axis:'z',line:10.10,lo:12.55,hi:14.25},
 {a:'5',b:'h56',axis:'z',line:6.75,lo:19.05,hi:20.65},
 {a:'h56',b:'6',axis:'z',line:9.35,lo:19.05,hi:20.65},
 {a:'6',b:'h67',axis:'x',line:17.30,lo:14.35,hi:15.95},
 {a:'h67',b:'7',axis:'x',line:7.90,lo:14.35,hi:15.95},
 {a:'7',b:'h78',axis:'x',line:7.90,lo:18.95,hi:20.55},
 {a:'h78',b:'8',axis:'x',line:13.10,lo:18.95,hi:20.55}
];
export const START={x:1.15,z:1.32,yaw:Math.PI+.43,pitch:-.055};
export const GLASS={x:12.70,z:5.65,w:1.40,d:2.00};
export const WINDOW={cx:21.05,front:22.85,width:8.00,height:1.76,bottom:.56,arc:35*Math.PI/180};
export const LAMP_DATA=[
 {id:'L1',zone:'1',position:[3.65,2.26,3.82],color:0xffd79d,intensity:31,distance:5},
 {id:'L2a',zone:'2',position:[2.85,2.27,7.95],color:0xd0dec1,intensity:28,distance:4.8},
 {id:'L2b',zone:'2',position:[8.80,2.27,8.00],color:0xd0dec1,intensity:28,distance:4.8},
 {id:'L3',zone:'3',position:[9.60,2.27,1.70],color:0xffd79d,intensity:29,distance:4.8},
 {id:'L4',zone:'4',position:[12.50,2.27,11.75],color:0xd0dec1,intensity:27,distance:4.7},
 {id:'L5',zone:'5',position:[18.45,2.27,3.00],color:0xd0dec1,intensity:29,distance:5},
 {id:'L6',zone:'6',position:[19.80,2.27,12.65],color:0xffd79d,intensity:30,distance:5},
 {id:'L7a',zone:'7',position:[5.20,2.27,15.20],color:0xffd79d,intensity:27,distance:4.6},
 {id:'L7b',zone:'7',position:[5.20,2.27,20.20],color:0xffd79d,intensity:25,distance:4.7},
 {id:'L8a',zone:'8',position:[15.70,2.27,20.30],color:0xffd79d,intensity:25,distance:4.3},
 {id:'L8b',zone:'8',position:[21.00,2.27,20.20],color:0xd0dec1,intensity:24,distance:4.3},
 {id:'L23',zone:'h23',position:[9.65,2.27,4.85],color:0xffd79d,intensity:18,distance:3.5},
 {id:'L35',zone:'h35',position:[13.35,2.27,1.80],color:0xffd79d,intensity:20,distance:3.9},
 {id:'Lh4',zone:'h4',position:[13.40,2.27,6.50],color:0xd0dec1,intensity:22,distance:4.4},
 {id:'L56',zone:'h56',position:[19.80,2.27,8.05],color:0xd0dec1,intensity:17,distance:3.5},
 {id:'L67',zone:'h67',position:[12.60,2.27,15.15],color:0xffd79d,intensity:24,distance:4.7},
 {id:'L78',zone:'h78',position:[10.50,2.27,19.75],color:0xffd79d,intensity:20,distance:4}
];
export function zoneAt(x,z,pad=0){return ZONES.find(r=>x>=r.x-pad&&x<=r.x+r.w+pad&&z>=r.z-pad&&z<=r.z+r.d+pad);}
export function portalPoint(p){return p.axis==='x'?{x:p.line,z:(p.lo+p.hi)/2}:{x:(p.lo+p.hi)/2,z:p.line};}
export function boundsOf(zone){const r=ZONES.find(z=>z.id===zone)||ROOMS[0];return [r.x,r.z,r.x+r.w,r.z+r.d];}

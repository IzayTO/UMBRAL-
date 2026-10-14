// A persistent, probabilistic maintenance director. It never advances the campaign.
export const FAULTS={
 fan:{zone:'4',device:'fan',title:'Rotor desequilibrado',hint:'Compara vibración. Ajusta BALANCE hasta menos de 0.3 mm/s; verifica.',min:2},
 relay:{zone:'3',device:'relay',title:'Contacto del relé gastado',hint:'Corta el relé. Prueba un repuesto en Taller, sustituye y vuelve a conectar.',min:4},
 lamp:{zone:'7',device:'lamp',title:'Regulador de lámpara inestable',hint:'Ajusta el regulador hasta que el indicador marque 24 V; verifica.',min:8},
 voltage:{zone:'2',device:'supply',title:'Caída en la fuente auxiliar',hint:'Desconecta CARGA de prueba. Ajusta a 24 V y pulsa REVISAR.',min:4},
 comms:{zone:'4',device:'comms',title:'Pérdida de enlace auxiliar',hint:'Sintoniza el canal indicado por la placa de ruta y reinicia el enlace.',min:5},
 pipe:{zone:'h4',device:'pipe',title:'Resonancia del retorno',hint:'Reduce el caudal con la válvula hasta la banda 0.35–0.55; verifica.',min:2},
 printer:{zone:'3',device:'printer',title:'Registro en la impresora',hint:'Inspecciona el papel y acciona AVANCE para liberar el registro.',min:2},
 temperature:{zone:'5',device:'thermal',title:'Desvío del termómetro',hint:'Activa REFERENCIA; compara ambas sondas. Ajusta el cero hasta ±0.3 °C y verifica.',min:6},
 drift:{zone:'5',device:'scope',title:'Deriva del oscilador',hint:'Compara ambos pulsos. Corrige el desfase y ejecuta MEDIR en el osciloscopio.',min:7},
 noise:{zone:'3',device:'acquisition',title:'Interferencia de red',hint:'Activa el filtro de red y ejecuta una prueba de adquisición.',min:8}
};
export const directorState=seed=>({seed:seed>>>0,next:0,enabledAt:null,recent:[],active:[],count:0,resolved:0,quiet:0});
const random=d=>((d.seed=(Math.imul(d.seed,1664525)+1013904223)>>>0)/4294967296);
export function fault(s,type){return s.director.active.find(e=>e.type===type&&!e.benign);}
export function directorTick(s,dt,zone,critical=false){
 const d=s.director;if(!s.mapOwned)return [];
 if(d.enabledAt===null){d.enabledAt=s.time;d.next=s.time+65+random(d)*110;}
 d.active=d.active.filter(e=>!e.benign||s.time<e.until);
 if(s.time<d.next)return [];
 if(critical||s.job||s.armed||s.flash){d.next=s.time+12+random(d)*20;return [];}
 d.next=s.time+70+random(d)*170;
 if(d.active.length>=2||random(d)>.46){d.quiet++;return [];}
 const pool=Object.keys(FAULTS).filter(k=>FAULTS[k].min<=s.mission&&!d.active.some(e=>e.type===k)&&!d.recent.slice(-3).includes(k));
 if(!pool.length)return [];
 // Sound often originates elsewhere, but only from sectors already visited.
 const reachable=pool.filter(k=>s.visited.includes(FAULTS[k].zone)||FAULTS[k].zone==='h4'&&s.visited.includes('4'));
 const other=reachable.filter(k=>FAULTS[k].zone!==zone),choices=other.length&&random(d)<.7?other:reachable;if(!choices.length)return [];
 const type=choices[Math.floor(random(d)*choices.length)],e=spawnFault(s,type,random(d)<.22);return [e];
}
export function spawnFault(s,type,benign=false){
 const d=s.director;if(!s.mapOwned||!FAULTS[type]||d.active.length>=2||d.active.some(e=>e.type===type))return null;
 const e={id:++d.count,type,benign,zone:FAULTS[type].zone,device:FAULTS[type].device,started:s.time,until:s.time+25+random(d)*45,inspected:false,target:2+Math.round(random(d)*24)/4,offset:2+Math.round(random(d)*8)/2,channel:1+Math.floor(random(d)*6),replaced:false};
 if(type==='voltage')e.offset=s.controls.voltageTrim>0?1.2:-1.2;
 if(type==='temperature')e.offset*=s.controls.tempTrim>0?1:-1;
 if(type==='drift')e.offset*=s.controls.syncTrim>0?1:-1;
 d.active.push(e);d.recent.push(type);d.recent=d.recent.slice(-8);return e;
}
export function clearFault(s,type){const d=s.director;const e=d.active.find(e=>e.type===type);if(!e)return false;d.active=d.active.filter(e=>e!==e);if(!e.benign)d.resolved++;return true;}
export function detectorCondition(s){
 const c=s.controls,drift=fault(s,'drift')?.offset||0,sync=Math.abs(s.syncOffset+c.syncTrim+drift),noise=(fault(s,'noise')&&!c.notch?1:0)+(fault(s,'relay')?.replaced?0:fault(s,'relay')?.45:0),voltage=(s.baseVoltage??24)+(fault(s,'voltage')?.offset||0)+c.voltageTrim-(c.load?.35:0);
 return {sync,noise,voltage,jitter:s.calibration?.jitter??8,efficiency:!s.power?0:Math.max(.55,1-Math.abs(voltage-24)*.12-(fault(s,'comms')?.15:0)),temperature:-31.5+(s.tempOffset||0)+c.tempTrim+(fault(s,'temperature')?.offset||0),valid:s.power&&s.repaired&&c.relayPower&&s.sync?.passed&&s.calibration?.passed&&sync<=1.5&&!fault(s,'comms')&&Math.abs(voltage-24)<.7&&noise<.3};
}

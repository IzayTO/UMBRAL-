import {MISSION_NAMES} from './missions.js?v=3.1.1';
export const MISSION_GUIDE=[
 ['01 / ACCESO','Registra tu turno en el equipo de la pared. Recoge el plano cercano; podrás plegarlo y consultarlo durante la exploración.'],
 ['02 · 03 · 05','Revisa la fuente de Taller, visita Control y Calibración. Activa la supervisión desde la terminal de Control.'],
 ['03 / CONTROL','Deja que la supervisión reúna lecturas. Cuando avise de una línea incompleta, consulta su diagnóstico para localizar el receptor.'],
 ['04 / SERVIDORES','Aísla el receptor 17. Abre su registro, revisa el contacto y asienta el módulo con su corredera antes de restablecer corriente.'],
 ['05 / CALIBRACIÓN','Compara las dos señales del osciloscopio. Corrige el desfase con la perilla y mide cuando los pulsos estén superpuestos.'],
 ['05 / BANCO ÓPTICO','Encaja el conector y cierra la cámara de ensayo. Selecciona un nivel LED útil y emite diez pulsos; revisa las respuestas.'],
 ['03 / CONTROL','Ajusta coincidencias y ventana temporal. Ensaya una configuración que conserve candidatos sin saturar el registro, y acéptala.'],
 ['07 / ARCHIVO','Usa el lector de microfilm o la terminal para consultar dos series. Compara estabilidad y sincronía; elige una referencia sin anomalías conocidas.'],
 ['03 / CONTROL','Espera la nueva coincidencia. Comprueba el estado de los instrumentos y examina las lecturas preliminares; atiende los fallos indicados.'],
 ['03 / CONTROL','Adjunta sincronía, calibración, adquisición y validación. Autoriza el expediente cuando todos sean válidos: se abrirá Análisis.'],
 ['08 / OBSERVACIÓN','Prepara la consulta en la terminal y contempla el hielo. La señal óptica es una representación de luz secundaria, no un neutrino visible.'],
 ['06 / ANÁLISIS','Revisa tiempos, sensores y reconstrucción del candidato. Consulta su incertidumbre y registra el informe. Después podrás seguir explorando.']
];
export class NoticeQueue{
 constructor(element){this.element=element;this.queue=[];this.current=null;this.age=0;this.gap=0;}
 push(text){if(!text||text===this.current||this.queue.includes(text))return;this.queue.push(text);}
 clear(){this.queue=[];this.current=null;this.age=0;this.element.classList.remove('visible');}
 tick(dt){if(this.current){this.age+=dt;if(this.age>=5){this.element.classList.remove('visible');this.current=null;this.gap=.35;}}else if(this.gap>0)this.gap-=dt;else if(this.queue.length){this.current=this.queue.shift();this.age=0;this.element.textContent=this.current;this.element.classList.add('visible');}}
}
export class MissionUI{
 constructor(missions,callbacks){this.missions=missions;this.callbacks=callbacks;this.active=false;this.displayed=0;this.pending=0;this.transitionUntil=0;this.revision=-1;
  this.panel=document.querySelector('#mission-panel');this.cards=document.querySelector('#mission-cards');this.sheet=document.querySelector('#mission-sheet');this.list=document.querySelector('#mission-list');
  document.querySelector('#task-note').addEventListener('click',()=>{const open=this.panel.hidden;this.panel.hidden=!open;document.querySelector('#task-note').setAttribute('aria-expanded',String(open));this.tick(performance.now()/1000);});
  document.querySelector('#mission-all').addEventListener('click',()=>this.open());document.querySelector('#mission-close').addEventListener('click',()=>this.close());
  window.addEventListener('keydown',e=>{if(e.defaultPrevented||e.repeat)return;if(this.active&&['Escape','KeyJ'].includes(e.code)){e.preventDefault();this.close();}else if(e.code==='KeyJ'&&callbacks.available()){e.preventDefault();this.open();}});
 }
 open(){if(!this.callbacks.available())return;this.active=true;this.sheet.hidden=false;document.body.classList.add('reading-missions');this.callbacks.open();this.paintList();document.querySelector('#mission-close').focus?.();}
 close(resume=true){if(!this.active)return;this.active=false;this.sheet.hidden=true;document.body.classList.remove('reading-missions');this.callbacks.close(resume);}
 paintCards(n){const done=n>12,next=MISSION_NAMES[n]||'EXPLORACIÓN LIBRE';this.cards.innerHTML=`<article class="mission-current"><span class="mission-kicker">${done?'TURNO REGISTRADO':`EN CURSO / ${String(n).padStart(2,'0')}`}</span><h2>${MISSION_NAMES[n-1]}</h2><p>${this.missions.objective().split(' · ').slice(1).join(' · ')}</p></article><article class="mission-next"><span class="mission-kicker">${done?'LA ESTACIÓN CONTINÚA':'A CONTINUACIÓN'}</span><h3>${next}</h3></article>`;}
 paintList(){const s=this.missions.state;this.list.replaceChildren();for(let i=0;i<12;i++){const row=document.createElement('details'),done=s.mission>i+1,active=s.mission===i+1;row.className='ledger-entry '+(done?'done':active?'current':'pending');row.open=active;
   const summary=document.createElement('summary');summary.innerHTML=`<span class="ledger-number">${String(i+1).padStart(2,'0')}</span><span class="ledger-name">${MISSION_NAMES[i]}</span><span class="ledger-state">${done?'REGISTRADA':active?'EN CURSO':'PENDIENTE'}</span><span class="ledger-chevron" aria-hidden="true">⌄</span>`;const p=document.createElement('p');p.textContent=MISSION_GUIDE[i][1];const location=document.createElement('span');location.className='ledger-location';location.textContent=MISSION_GUIDE[i][0];row.append(summary,location,p);this.list.append(row);}
  document.querySelector('#mission-count').textContent=`${Math.min(12,s.mission-1)} / 12 REGISTROS`;document.querySelector('#mission-progress').style.width=`${Math.min(12,s.mission-1)/12*100}%`;
 }
 tick(t){const n=this.missions.state.mission;
  if(!this.displayed){this.displayed=n;this.paintCards(n);}
  if(n!==this.displayed&&!this.pending){this.pending=n;this.transitionUntil=t+.42;this.cards.classList.add('advancing');}
  if(this.pending&&t>=this.transitionUntil){this.displayed=this.pending;this.pending=0;this.paintCards(this.displayed);this.cards.classList.remove('advancing');this.cards.classList.add('arriving');this.arrived=t+.6;}
  if(this.arrived&&t>=this.arrived){this.cards.classList.remove('arriving');this.arrived=0;}
  if(this.revision!==this.missions.revision){this.revision=this.missions.revision;if(!this.pending)this.paintCards(this.displayed);if(this.active)this.paintList();}
 }
}

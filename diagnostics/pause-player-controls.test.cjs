const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('index.html', 'utf8');
function fn(name) {
 const start = source.indexOf('        function ' + name + '(');
 assert(start >= 0, name + ' missing');
 const end = source.indexOf('\n        function ', start + 10);
 return source.slice(start, end < 0 ? undefined : end);
}
const elements = new Map();
const el = id => {
 if (!elements.has(id)) { const classes = new Set(); elements.set(id, {innerText:'', innerHTML:'', style:{}, dataset:{}, classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),toggle:(x,on)=>on?classes.add(x):classes.delete(x),contains:x=>classes.has(x)},scrollIntoView(){this.scrolled=true;}}); }
 return elements.get(id);
};
let paused = 0, resumed = 0, stopped = 0;
const ctx = vm.createContext({AppState:{pausas:{activeTimerId:2,pausedTimerId:null,remainingSec:37,totalCardSec:60,circuitActive:false}}, document:{getElementById:el}, STRETCH_EXERCISES:[{id:2,name:'Torção',muscle:'Coluna',sides:2,instruction:'Gire suavemente'}],pauseStretchTimer(id){paused++;ctx.AppState.pausas.activeTimerId=null;ctx.AppState.pausas.pausedTimerId=id;}, startStretchTimer(id,circuit,resume){assert(resume);resumed++;ctx.AppState.pausas.activeTimerId=id;ctx.AppState.pausas.pausedTimerId=null;},pauseStretchCircuit(){throw Error('individual routed to circuit');},resumeStretchCircuit(){},cancelSoftResumeCorpo(){},clearInterval(){},hideStretchActiveDisplay(){},speakVoice(){},window:{AndroidBridge:{stopWorkoutSession(){stopped++;}}}});
vm.runInContext(fn('toggleStretchCircuitPause') + '\n' + fn('resolveStretchCue') + '\n' + fn('showStretchActiveDisplay') + '\n' + fn('updateStretchActiveDisplayUI') + '\n' + fn('resetStretchCardToIdle') + '\n' + fn('cancelStretchCircuit'),ctx);
ctx.toggleStretchCircuitPause(); assert.equal(paused,1,'guia individual deve pausar exercício');
ctx.toggleStretchCircuitPause(); assert.equal(resumed,1,'guia individual deve retomar');
el('icon-pause-stretch-ctrl').className='fa-solid fa-play text-xs';
ctx.showStretchActiveDisplay(2,60);
assert.equal(el('icon-pause-stretch-ctrl').className,'fa-solid fa-pause text-xs','novo exercício deve iniciar com ícone Pausar');
assert(el('stretch-active-display').scrolled,'guia deve ficar à vista');
assert.equal(el('stretch-seconds-big').innerText,37,'primeiro frame deve usar tempo atual');
assert.equal(el('stretch-posture-frame').dataset.exercise,'2','postura deve corresponder ao exercício');
assert.equal(el('stretch-posture-image').src,'img/pausas/stretch-sequence-2.png','o exercício deve carregar seu atlas local');
ctx.AppState.pausas.nativeManaged=true;
ctx.cancelStretchCircuit(false);
assert.equal(stopped,1); assert.equal(ctx.AppState.pausas.activeTimerId,null); assert.equal(ctx.AppState.pausas.pausedTimerId,null);
assert.match(source,/id="btn-cancel-stretch-active"[^>]*onclick="cancelStretchCircuit\(\)"/);
assert.match(source,/id="oled-btn-cancel"[^>]*onclick="cancelBreathSession\(\)"/);
assert.match(source,/resolveStretchCue/);
assert.match(source,/stretch-phase-cue/);
assert.doesNotMatch(source,/stretch-direction-motion\s+3s[^;]*infinite/);

// Circuit and Android callbacks must keep the player synchronized.
ctx.triggerHaptic = () => {};
ctx.updateCircuitOverallUI = () => {};
vm.runInContext(fn('pauseStretchCircuit') + '\n' + fn('resetStretchCardToIdle') + '\n' + fn('handleNativeStretchState'), ctx);
ctx.AppState.pausas.circuitActive = true;
ctx.pauseStretchCircuit();
assert.equal(el('stretch-active-display').dataset.paused, 'true');
ctx.AppState.pausas.circuitActive = false;
ctx.handleNativeStretchState({status:'paused',session:{cardId:2},stepTimeLeft:23,steps:[{duration:60}],currentStepIndex:0});
assert.equal(ctx.AppState.pausas.pausedTimerId,2);
assert.equal(ctx.AppState.pausas.activeTimerId,null);
assert.equal(el('label-pause-stretch-ctrl').innerText,'Continuar');
ctx.handleNativeStretchState({status:'running',session:{cardId:2},stepTimeLeft:23,steps:[{duration:60}],currentStepIndex:0});
assert.equal(ctx.AppState.pausas.activeTimerId,2);
assert.equal(el('stretch-active-display').dataset.paused,'false');
assert.equal(el('stretch-seconds-big').innerText,23);
ctx.AppState.pausas.selectedDuration=60;
ctx.AppState.pausas.circuitActive=false;
el('stretch-icon-2').className='fa-solid fa-play';
el('stretch-label-2').innerText='Continuar';
el('stretch-timer-display-2').classList.remove('hidden');
el('stretch-bar-2').style.width='38%';
ctx.handleNativeStretchState({status:'interrupted',session:{type:'stretch',cardId:2},stepTimeLeft:23,steps:[{duration:60}],currentStepIndex:0});
assert.equal(el('stretch-label-2').innerText,'1:00','cancelamento Android deve restaurar rótulo inicial em vez de oferecer retomada fantasma');
assert.equal(el('stretch-icon-2').className,'fa-solid fa-play','cancelamento Android deve restaurar ícone de início');
assert(el('stretch-timer-display-2').classList.contains('hidden'),'timer do card deve voltar ao estado ocioso');
assert.equal(el('stretch-bar-2').style.width,'0%','barra do exercício cancelado deve zerar');
assert.equal(ctx.AppState.pausas.pausedTimerId,null,'cancelamento não pode deixar retomada pendente');
ctx.AppState.pausas.circuitActive=true;
ctx.AppState.pausas.circuitPaused=true;
el('circuit-corpo-label').innerText='Continuar Circuito (2/4)';
el('circuit-corpo-icon').className='fa-solid fa-play';
el('btn-cancel-circuit').classList.remove('hidden');
el('icon-pause-stretch-ctrl').className='fa-solid fa-play text-xs';
for(let id=1;id<=4;id++){
 el('stretch-icon-'+id).className='fa-solid fa-check';
 el('stretch-label-'+id).innerText='Feito!';
 el('stretch-timer-display-'+id).classList.remove('hidden');
 el('stretch-bar-'+id).style.width='100%';
}
ctx.handleNativeStretchState({status:'interrupted',session:{type:'stretch_circuit',cardId:2},stepTimeLeft:23,steps:[{duration:60}],currentStepIndex:0});
assert.equal(ctx.AppState.pausas.circuitActive,false,'cancelamento Android deve desativar o circuito');
assert.equal(ctx.AppState.pausas.circuitPaused,false,'cancelamento Android não pode deixar o circuito pausado');
assert.equal(el('circuit-corpo-label').innerText,'Executar Circuito Completo','cancelamento Android deve restaurar o rótulo inicial do circuito');
assert.equal(el('circuit-corpo-icon').className,'fa-solid fa-circle-play text-base','cancelamento Android deve restaurar o ícone do circuito');
assert(el('btn-cancel-circuit').classList.contains('hidden'),'cancelamento Android deve ocultar o botão Cancelar circuito');
assert.equal(el('icon-pause-stretch-ctrl').className,'fa-solid fa-pause text-xs','cancelamento Android deve restaurar o ícone Pausar');
for(let id=1;id<=4;id++){
 assert.equal(el('stretch-label-'+id).innerText,'1:00','cancelamento de circuito deve restaurar cada card');
 assert.equal(el('stretch-icon-'+id).className,'fa-solid fa-play');
 assert(el('stretch-timer-display-'+id).classList.contains('hidden'));
 assert.equal(el('stretch-bar-'+id).style.width,'0%');
}
const asset='img/pausas/stretch-postures.webp';
assert(fs.readFileSync(asset).equals(fs.readFileSync('app/src/main/assets/'+asset)));
let nativePauses=0, nativeResumes=0, webIntervals=0;
ctx.window.AndroidBridge.pauseWorkoutSession=()=>nativePauses++;
ctx.window.AndroidBridge.resumeWorkoutSession=()=>nativeResumes++;
ctx.setInterval=()=>{webIntervals++;return 1;};
vm.runInContext(fn('executeResumeStretchCircuit'),ctx);
ctx.AppState.pausas.circuitActive=true;
ctx.AppState.pausas.nativeManaged=true;
ctx.pauseStretchCircuit();
assert.equal(nativePauses,1,'pausa de circuito deve chegar ao motor Android');
ctx.executeResumeStretchCircuit();
assert.equal(nativeResumes,1,'retomada deve chegar ao motor Android');
assert.equal(webIntervals,0,'retomar circuito nativo não pode criar segundo timer web');
for (const handler of ['resetKegelRes','resetKegelFast','resetBracingTimer']) {
 const button=source.match(new RegExp('<button[^>]*onclick="'+handler+'\\(\\)"[\\s\\S]*?</button>'))?.[0];
 assert(button?.includes('Cancelar'),handler+' precisa exibir Cancelar');
}

console.log('Pause player visibility, individual/circuit controls and native cancellation: PASS');

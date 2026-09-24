const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const source = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const start = source.indexOf('function startResponsivePause()');
assert(start >= 0, 'startResponsivePause deve existir');
const bodyStart = source.indexOf('{', start);
let depth = 0;
let end = -1;
for (let i = bodyStart; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    if (source[i] === '}' && --depth === 0) { end = i + 1; break; }
}
assert(end > start, 'startResponsivePause deve estar completa');

const classes = new Set();
const element = { classList: { add(name) { classes.add(name); }, remove(name) { classes.delete(name); } } };
let toastCount = 0;
const context = vm.createContext({
    AppState: { mente: { isRunning: false }, pausas: { circuitActive: false, activeTimerId: 2 }, dailyExecution: { isRunning: false } },
    Date: { now: () => 123 },
    performance: { now: () => 1000 },
    document: { getElementById() { return element; } },
    setInterval() { return 1; },
    clearInterval() {},
    updateResponsivePauseUI() {},
    persistResponsivePause() {},
    openResponsivePauseModal() {},
    showInlineToast() { toastCount += 1; }
});
vm.runInContext('var responsivePause = { status: "idle", elapsedMs: 0, startedTick: null, intervalId: null, sessionId: null };', context);
vm.runInContext(source.slice(start, end), context);
context.startResponsivePause();
assert.equal(vm.runInContext('responsivePause.status', context), 'idle', 'Pausa de Resposta não deve sobrepor timer individual de alongamento');
assert.equal(toastCount, 1, 'bloqueio de sessão concorrente deve explicar a ação');

context.AppState.pausas.activeTimerId = null;
context.AppState.pausas.circuitActive = true;
context.startResponsivePause();
assert.equal(vm.runInContext('responsivePause.status', context), 'idle', 'Pausa de Resposta não deve sobrepor circuito pausado ou ativo');
assert.equal(toastCount, 2, 'circuito em andamento deve explicar o bloqueio');

context.AppState.pausas.circuitActive = false;
context.startResponsivePause();
assert.equal(vm.runInContext('responsivePause.status', context), 'running', 'Pausa de Resposta deve iniciar quando não há outra sessão');
assert.equal(toastCount, 2, 'início sem conflito não deve mostrar aviso');

console.log('E10 response-pause session guard: PASS');

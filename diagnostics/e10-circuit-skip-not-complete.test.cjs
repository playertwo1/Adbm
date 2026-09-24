const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
function extractFunction(name) {
    const start = source.search(new RegExp(`function\\s+${name}\\s*\\(`));
    assert(start >= 0, `função ausente: ${name}`);
    const bodyStart = source.indexOf('{', start);
    let depth = 0;
    for (let i = bodyStart; i < source.length; i += 1) {
        if (source[i] === '{') depth += 1;
        if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1);
    }
    throw new Error(`bloco incompleto: ${name}`);
}
const element = { className: '', innerText: '', style: {}, classList: { add() {}, remove() {}, contains() { return false; } } };
const records = [];
let scheduleCompletions = 0;
const context = vm.createContext({
    AppState: { pausas: { circuitActive: true, circuitPaused: false, circuitStep: 4, circuitCompletedSteps: [1, 2, 3], intervalId: null, activeTimerId: 4, pausedTimerId: 2, circuitStepDurations: { 1: 30, 2: 45, 3: 60 }, selectedDuration: 60, selectedIntensity: 'padrao', voiceGuideEnabled: false } },
    document: { getElementById() { return element; } },
    window: {},
    setTimeout() {},
    clearInterval() {},
    speakVoice() {},
    triggerHaptic() {},
    recordCorpoSession(...args) { records.push(args); },
    markScheduleDone() { scheduleCompletions += 1; },
    addMinutesToday() {},
    hideStretchActiveDisplay() {},
    startStretchCircuitStep() {}
});
vm.runInContext([extractFunction('finishStretchCircuit'), extractFunction('skipStretchStep')].join('\n'), context);
context.skipStretchStep();
assert.equal(records.length, 0, 'pular o último exercício não deve registrar o circuito como completo');
assert.equal(scheduleCompletions, 0, 'circuito com etapa pulada não deve marcar o programa como concluído');
assert.equal(context.AppState.pausas.circuitActive, false, 'pular a última etapa deve encerrar o circuito');
assert.equal(context.AppState.pausas.activeTimerId, null, 'encerrar circuito parcial deve limpar o ID do timer para liberar outras sessões');
assert.equal(context.AppState.pausas.pausedTimerId, null, 'encerrar circuito parcial deve limpar o timer individual pausado');
assert.deepEqual({ ...context.AppState.pausas.circuitStepDurations }, {}, 'encerrar circuito parcial deve descartar durações parciais');

console.log('E10 skipped circuit is not complete: PASS');

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const source = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
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
const elements = new Map();
function getElement(id) {
    if (!elements.has(id)) {
        const classes = new Set();
        elements.set(id, { id, className: '', innerText: '', style: {}, classList: {
            add(...names) { names.forEach(name => classes.add(name)); },
            remove(...names) { names.forEach(name => classes.delete(name)); },
            contains(name) { return classes.has(name); }
        } });
    }
    return elements.get(id);
}
const cleared = [];
const context = vm.createContext({
    AppState: { pausas: { intervalId: 99, resumeTimerId: 42, isResuming: true, circuitActive: true, circuitPaused: true, circuitStep: 2, activeTimerId: 2, circuitCompletedSteps: [1], circuitStepDurations: { 1: 30 } } },
    document: { getElementById: getElement },
    clearInterval(id) { cleared.push(id); },
    hideStretchActiveDisplay() {},
    speakVoice() {}
});
vm.runInContext([extractFunction('cancelSoftResumeCorpo'), extractFunction('cancelStretchCircuit')].join('\n'), context);
context.cancelStretchCircuit(false);
assert.equal(context.AppState.pausas.resumeTimerId, null, 'cancelar circuito durante contagem deve cancelar timer de retomada');
assert.equal(context.AppState.pausas.isResuming, false, 'cancelar circuito deve sair do estado de retomada');
assert(cleared.includes(42), 'intervalo de retomada deve ser limpo');
assert(getElement('stretch-resume-overlay').classList.contains('hidden'), 'overlay de retomada deve desaparecer');
assert.equal(context.AppState.pausas.circuitActive, false, 'circuito cancelado deve ficar inativo');
assert.deepEqual(Array.from(context.AppState.pausas.circuitCompletedSteps), [], 'cancelamento deve limpar etapas parciais para não contaminar novo circuito');
assert.deepEqual({ ...context.AppState.pausas.circuitStepDurations }, {}, 'cancelamento deve limpar durações parciais');

console.log('E10 cancel resume countdown: PASS');

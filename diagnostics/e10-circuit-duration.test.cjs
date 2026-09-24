const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.join(__dirname, '..');
const htmlPaths = [
    path.join(root, 'index.html'),
    path.join(root, 'app', 'src', 'main', 'assets', 'index.html')
];
const buffers = htmlPaths.map(file => fs.readFileSync(file));
assert.equal(Buffer.compare(buffers[0], buffers[1]), 0, 'HTML raiz e asset Android devem permanecer idênticos');
const source = buffers[0].toString('utf8');

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
        elements.set(id, {
            id,
            innerText: '',
            className: '',
            classList: {
                add(...names) { names.forEach(name => classes.add(name)); },
                remove(...names) { names.forEach(name => classes.delete(name)); },
                contains(name) { return classes.has(name); }
            }
        });
    }
    return elements.get(id);
}

const records = [];
const minutesAdded = [];
let scheduleCompletions = 0;
const context = vm.createContext({
    AppState: { pausas: { selectedDuration: 'infinite', selectedIntensity: 'padrao', circuitActive: true, circuitPaused: false, circuitStep: 4, circuitCompletedSteps: [1, 2, 3, 4], circuitStepDurations: { 1: 30, 2: 90, 3: 60, 4: 300 }, intervalId: null } },
    document: { getElementById: getElement },
    window: {},
    setTimeout() {},
    clearInterval() {},
    speakVoice() {},
    triggerHaptic() {},
    recordCorpoSession(title, durationMin) { records.push({ title, durationMin }); },
    markScheduleDone() { scheduleCompletions += 1; },
    addMinutesToday(minutes, type) { minutesAdded.push({ minutes, type }); },
    hideStretchActiveDisplay() {}
});

vm.runInContext(extractFunction('finishStretchCircuit'), context);
context.finishStretchCircuit();
assert.equal(records.length, 1, 'circuito concluído deve gerar exatamente um registro');
assert.equal(records[0].durationMin, 8, 'duração registrada deve somar os tempos reais das quatro etapas, mesmo quando variam');
assert.equal(minutesAdded[0].minutes, 8, 'métricas devem usar a mesma soma dos tempos executados');
assert.equal(scheduleCompletions, 1, 'conclusão deve marcar o programa uma única vez');
assert.equal(context.AppState.pausas.circuitActive, false, 'finalizar deve encerrar o estado do circuito');
context.finishStretchCircuit();
assert.equal(records.length, 1, 'repetir finalização não deve duplicar histórico');

console.log('E10 circuit duration/history: PASS');

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

const classes = new Set();
const content = { classList: { contains(name) { return classes.has(name); }, add(name) { classes.add(name); }, remove(name) { classes.delete(name); } } };
let spokenCount = 0;
const records = [];
const context = vm.createContext({
    AppState: { activeTab: 'pausas', voiceEnabled: true, pausas: { voiceGuideEnabled: false, soundEnabled: false, selectedDuration: 60, selectedIntensity: 'padrao', circuitActive: true, circuitPaused: false, circuitStep: 4, circuitCompletedSteps: [1, 2, 3, 4], intervalId: null, history: [] } },
    document: { getElementById(id) { return id === 'corpo-content' ? content : { classList: { add() {}, remove() {}, contains() { return false; } }, style: {} }; } },
    window: {},
    setTimeout() {},
    clearInterval() {},
    switchTab() {},
    setStretchDuration() {},
    toggleStretchTimer() {},
    speakVoice() { spokenCount += 1; },
    triggerHaptic() {},
    recordCorpoSession(...args) { records.push(args); },
    markScheduleDone() {},
    addMinutesToday() {},
    hideStretchActiveDisplay() {}
});

vm.runInContext([
    extractFunction('startSosStretch'),
    extractFunction('finishStretchCircuit'),
    extractFunction('cancelSoftResumeCorpo'),
    extractFunction('cancelStretchCircuit')
].join('\n'), context);

context.startSosStretch();
context.finishStretchCircuit();
context.cancelStretchCircuit(true);
assert.equal(spokenCount, 0, 'Voz Off deve silenciar SOS, conclusão e cancelamento sem remover os sinais visuais/hápticos');
assert.equal(records.length, 1, 'silenciar voz não deve impedir o registro de circuito concluído');

console.log('E10 pause voice-off: PASS');

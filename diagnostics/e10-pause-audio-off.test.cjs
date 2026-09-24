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
        let innerText = '';
        elements.set(id, {
            id,
            get innerText() { return innerText; },
            set innerText(value) { innerText = String(value); },
            className: '',
            style: {},
            classList: {
                add(...names) { names.forEach(name => classes.add(name)); },
                remove(...names) { names.forEach(name => classes.delete(name)); },
                contains(name) { return classes.has(name); }
            }
        });
    }
    return elements.get(id);
}

let oscillatorCount = 0;
const audioContext = {
    currentTime: 0,
    destination: {},
    createOscillator() {
        oscillatorCount += 1;
        return { frequency: { setValueAtTime() {} }, connect() {}, start() {}, stop() {} };
    },
    createGain() {
        return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} };
    }
};
const intervals = [];
const context = vm.createContext({
    AppState: {
        activeTab: 'pausas',
        voiceEnabled: true,
        desk: { silentMode: false },
        pausas: {
            activeTimerId: null,
            pausedTimerId: null,
            remainingSec: 60,
            totalCardSec: 60,
            intervalId: null,
            circuitActive: false,
            circuitPaused: true,
            circuitStep: 1,
            selectedDuration: 60,
            voiceGuideEnabled: false,
            soundEnabled: false,
            resumeCountdownSec: 3,
            isResuming: false,
            resumeTimerId: null
        }
    },
    STRETCH_EXERCISES: [{ id: 1, name: 'Torção de Coluna', voiceIntro: 'Comece', voiceSwitch: '', sides: 1 }],
    document: { getElementById: getElement },
    window: {},
    getAudioContext() { return audioContext; },
    setInterval(callback) { intervals.push(callback); return intervals.length; },
    clearInterval() {},
    triggerHaptic() {},
    showStretchActiveDisplay() {},
    updateStretchActiveDisplayUI() {},
    updateCircuitOverallUI() {},
    speakVoice() {},
    playBeep: null,
    executeResumeStretchCircuit() {}
});

vm.runInContext([
    extractFunction('playBeep'),
    extractFunction('startStretchTimer'),
    extractFunction('startSoftResumeCorpo')
].join('\n'), context);

context.startStretchTimer(1);
assert.equal(oscillatorCount, 0, 'iniciar exercício com Sinos Off não deve emitir áudio');
context.startSoftResumeCorpo();
intervals.at(-1)();
assert.equal(oscillatorCount, 0, 'contagem de retomada com Sinos Off deve permanecer silenciosa');
assert.equal(getElement('stretch-resume-count').innerText, '2', 'contagem visual deve continuar sem áudio');

console.log('E10 pause audio-off: PASS');

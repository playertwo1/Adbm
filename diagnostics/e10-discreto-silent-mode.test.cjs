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
        let innerText = '';
        elements.set(id, {
            id,
            get innerText() { return innerText; },
            set innerText(value) { innerText = String(value); },
            className: '',
            style: {}
        });
    }
    return elements.get(id);
}

let oscillatorCount = 0;
let spokenCount = 0;
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
        activeTab: 'discreto',
        voiceEnabled: true,
        hapticsEnabled: false,
        desk: {
            silentMode: true,
            res: { isRunning: false, isContract: true, timer: 1, series: 1, totalSeries: 10, intervalId: null }
        }
    },
    KEGEL_CIRCUMFERENCE: 100,
    document: { getElementById: getElement },
    window: { speechSynthesis: { cancel() {}, speak() { spokenCount += 1; } } },
    SpeechSynthesisUtterance: function SpeechSynthesisUtterance() {},
    getAudioContext() { return audioContext; },
    setInterval(callback) { intervals.push(callback); return intervals.length; },
    clearInterval() {},
    playRelaxationSignal() {},
    playHeavyPulse() {},
    playSuccessPattern() {},
    triggerHaptic() {},
    markScheduleDone() {},
    addMinutesToday() {},
    speakVoice: null
});

const functions = [
    'playBeep',
    'playTibetanChime',
    'speakVoice',
    'startKegelRes',
    'runKegelResTick',
    'updateKegelResStateUI',
    'setKegelResRing',
    'pauseKegelRes'
];
vm.runInContext(functions.map(extractFunction).join('\n'), context);
context.speakVoice = vm.runInContext('speakVoice', context);

context.playBeep();
context.playTibetanChime();
context.speakVoice('Relaxe');
assert.equal(oscillatorCount, 0, 'Modo Ultra-Silencioso no Discreto deve suprimir bipes e sinos');
assert.equal(spokenCount, 0, 'Modo Ultra-Silencioso no Discreto deve suprimir voz');

context.setKegelResRing(0);
assert.equal(getElement('kegelResRing').style.strokeDashoffset, 100, 'o anel deve iniciar sem trecho preenchido');
assert.equal(getElement('kegelResRing').style.opacity, '0', 'o marcador não deve aparecer antes do início');
context.setKegelResRing(0.5);
assert.equal(getElement('kegelResRing').style.strokeDashoffset, 50, 'a metade do timer deve preencher metade do anel');
assert.equal(getElement('kegelResRing').style.opacity, '1', 'o indicador aparece quando há progresso');

context.startKegelRes();
assert.equal(getElement('kegelResStateText').innerText, 'Contraia', 'orientação visual deve começar mesmo em modo silencioso');
intervals.at(-1)();
assert.equal(getElement('kegelResStateText').innerText, 'Relaxe', 'transição visual deve continuar sem áudio');
assert.equal(getElement('kegelResTimer').innerText, '10', 'contador visual deve continuar no modo silencioso');

context.AppState.activeTab = 'pausas';
context.playBeep();
assert.equal(oscillatorCount, 1, 'Modo Ultra-Silencioso do Discreto não deve silenciar a aba Pausas');

console.log('E10 discrete silent mode: PASS');

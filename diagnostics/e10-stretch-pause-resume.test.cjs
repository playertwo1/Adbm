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

const intervals = [];
const records = [];
let completedScheduleCount = 0;
const context = vm.createContext({
    AppState: {
        pausas: {
            activeTimerId: null,
            pausedTimerId: null,
            remainingSec: 60,
            totalCardSec: 60,
            intervalId: null,
            circuitActive: false,
            circuitPaused: false,
            selectedDuration: 60,
            voiceGuideEnabled: false,
            soundEnabled: false
        }
    },
    STRETCH_EXERCISES: [{ id: 1, name: 'Torção de Coluna', voiceIntro: '', voiceSwitch: '', sides: 1 }],
    document: { getElementById: getElement },
    setInterval(callback) { intervals.push(callback); return intervals.length; },
    clearInterval() {},
    triggerHaptic() {},
    playBeep() {},
    speakVoice() {},
    showStretchActiveDisplay() {},
    updateStretchActiveDisplayUI() {},
    updateCircuitOverallUI() {},
    hideStretchActiveDisplay() {},
    setTimeout() {},
    recordCorpoSession(title, durationMin) { records.push({ title, durationMin }); },
    markScheduleDone() { completedScheduleCount += 1; },
    addMinutesToday() {},
    cancelStretchCircuit() {}
});

vm.runInContext([
    extractFunction('toggleStretchTimer'),
    extractFunction('startStretchTimer'),
    extractFunction('pauseStretchTimer')
].join('\n'), context);

context.toggleStretchTimer(1);
assert.equal(context.AppState.pausas.activeTimerId, 1, 'iniciar deve ativar o exercício escolhido');
assert.equal(context.AppState.pausas.remainingSec, 60, 'iniciar deve usar a duração configurada');

context.AppState.pausas.remainingSec = 37;
context.toggleStretchTimer(1);
assert.equal(context.AppState.pausas.activeTimerId, null, 'pausar deve parar o timer ativo');
assert.equal(context.AppState.pausas.pausedTimerId, 1, 'pausar deve lembrar qual card pode ser retomado');
assert.equal(context.AppState.pausas.remainingSec, 37, 'pausar deve preservar o tempo restante');

context.toggleStretchTimer(1);
assert.equal(context.AppState.pausas.activeTimerId, 1, 'retomar deve reativar o mesmo exercício');
assert.equal(context.AppState.pausas.remainingSec, 37, 'retomar não deve reiniciar a duração do exercício');
assert.equal(context.AppState.pausas.totalCardSec, 60, 'retomar deve preservar a duração total para o progresso visual');
context.AppState.pausas.remainingSec = 1;
intervals.at(-1)();
assert.equal(records.length, 1, 'concluir o exercício retomado deve registrar exatamente uma sessão');
assert.equal(records[0].title, 'Torção de Coluna', 'histórico deve registrar o exercício executado');
assert.equal(records[0].durationMin, 1, 'histórico deve registrar a duração executada');
assert.equal(completedScheduleCount, 1, 'conclusão deve marcar a rotina uma única vez');

console.log('E10 pause/resume individual stretch: PASS');

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
const stageSource = source.match(/const RESPONSIVE_PAUSE_STAGES = ([\s\S]*?\n        \]);/);
const actionSource = source.match(/const RESPONSIVE_NEXT_ACTIONS = ([\s\S]*?\n        \]);/);
assert(stageSource && actionSource, 'etapas e ações da pausa devem estar definidas');

function createHarness(historyEnabled) {
    let now = 1000;
    let idClock = 10;
    let audioCalls = 0;
    const elements = new Map();
    function getElement(id) {
        if (!elements.has(id)) {
            const classes = new Set();
            let innerText = '';
            elements.set(id, {
                id,
                get innerText() { return innerText; },
                set innerText(value) { innerText = String(value); },
                innerHTML: '',
                className: '',
                style: {},
                setAttribute() {},
                classList: {
                    add(...names) { names.forEach(name => classes.add(name)); },
                    remove(...names) { names.forEach(name => classes.delete(name)); },
                    toggle(name, force) {
                        if (force === undefined ? !classes.has(name) : force) classes.add(name);
                        else classes.delete(name);
                    },
                    contains(name) { return classes.has(name); }
                }
            });
        }
        return elements.get(id);
    }
    const context = vm.createContext({
        AppState: { mente: { isRunning: false }, pausas: { isRunning: false, circuitActive: false, activeTimerId: null }, dailyExecution: { isRunning: false } },
        performance: { now: () => now },
        Date: { now: () => idClock++ },
        document: { body: { style: {} }, getElementById: getElement },
        setInterval() { return idClock++; },
        clearInterval() {},
        openResponsivePauseModal() {},
        persistResponsivePause() {},
        closeResponsivePauseModal() {},
        renderResponsivePauseHistory() {},
        showInlineToast() {},
        playBeep() { audioCalls += 1; },
        speakVoice() { audioCalls += 1; },
        clearInterval: () => {},
        setInterval: () => idClock++
    });
    vm.runInContext(`
        var RESPONSIVE_PAUSE_STAGES = ${stageSource[1]};
        var RESPONSIVE_NEXT_ACTIONS = ${actionSource[1]};
        var responsivePause = {
            status: 'idle', elapsedMs: 0, startedTick: null, intervalId: null,
            breathMode: 'natural', anchor: 'abdomen', historyEnabled: ${historyEnabled},
            history: [], sessionId: null, nextAction: null, guideOnly: false
        };
    `, context);
    vm.runInContext([
        extractFunction('getResponsiveElapsedMs'),
        extractFunction('formatResponsiveTime'),
        extractFunction('updateResponsiveBreathGuide'),
        extractFunction('updateResponsivePauseUI'),
        extractFunction('startResponsivePause'),
        extractFunction('endResponsivePause'),
        extractFunction('completeResponsivePause'),
        extractFunction('saveResponsivePauseRecord')
    ].join('\n'), context);
    return {
        context,
        getElement,
        audioCalls: () => audioCalls,
        setNow(value) { now = value; }
    };
}

assert.deepEqual(Array.from(vm.runInNewContext(stageSource[1])).map(stage => stage.name), ['Reconhecer', 'Ancorar', 'Escolher']);

const disabled = createHarness(false);
disabled.context.startResponsivePause();
assert.equal(disabled.getElement('responsive-pause-stage-time').innerText.startsWith('Etapa 1 de 3'), true);
assert.equal(disabled.audioCalls(), 0, 'Pausa de Resposta deve iniciar silenciosamente');
disabled.setNow(61000);
disabled.context.updateResponsivePauseUI();
assert.equal(disabled.getElement('responsive-pause-stage-time').innerText.startsWith('Etapa 2 de 3'), true);
assert.equal(disabled.getElement('responsive-pause-instruction').innerText, 'Observe a respiração natural.');
disabled.setNow(121000);
disabled.context.updateResponsivePauseUI();
assert.equal(disabled.getElement('responsive-pause-stage-time').innerText.startsWith('Etapa 3 de 3'), true);
assert.equal(disabled.getElement('responsive-pause-instruction').innerText, 'Perceba o corpo inteiro.');
disabled.setNow(181000);
disabled.context.updateResponsivePauseUI();
assert.equal(vm.runInContext('responsivePause.status', disabled.context), 'completed');
assert.equal(vm.runInContext('responsivePause.history.length', disabled.context), 0, 'histórico desativado não deve guardar a sessão');
assert.equal(disabled.audioCalls(), 0, 'etapas silenciosas não devem tocar voz ou bipes');

disabled.context.completeResponsivePause();
assert.equal(vm.runInContext('responsivePause.history.length', disabled.context), 0, 'repetir conclusão não deve registrar quando histórico está desativado');

const enabled = createHarness(true);
enabled.context.startResponsivePause();
enabled.setNow(61000);
enabled.context.endResponsivePause(false);
let history = vm.runInContext('responsivePause.history', enabled.context);
assert.equal(history.length, 1, 'histórico ativado deve guardar a interrupção');
assert.equal(history[0].durationSec, 60);
assert.equal(history[0].completed, false, 'interrupção não deve aparecer como sessão completa');

enabled.context.startResponsivePause();
enabled.setNow(241000);
enabled.context.updateResponsivePauseUI();
history = vm.runInContext('responsivePause.history', enabled.context);
assert.equal(vm.runInContext('responsivePause.status', enabled.context), 'completed');
assert.equal(history.length, 2, 'conclusão seguinte deve gerar um registro único');
assert.equal(history[0].durationSec, 180);
assert.equal(history[0].completed, true);
enabled.context.completeResponsivePause();
assert.equal(vm.runInContext('responsivePause.history.length', enabled.context), 2, 'repetir conclusão não deve duplicar o registro');
assert.equal(enabled.audioCalls(), 0, 'Pausa de Resposta deve permanecer silenciosa com histórico ligado');

console.log('E10 response pause: PASS');

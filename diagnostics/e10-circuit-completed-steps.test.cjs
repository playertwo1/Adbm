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
function runOneTick(startFunction) {
    const elements = new Map();
    function getElement(id) {
        if (!elements.has(id)) {
            const classes = new Set();
            elements.set(id, {
                id, innerText: '', className: '', style: {},
                classList: { add(...xs) { xs.forEach(x => classes.add(x)); }, remove(...xs) { xs.forEach(x => classes.delete(x)); }, contains(x) { return classes.has(x); } }
            });
        }
        return elements.get(id);
    }
    let tick;
    const context = vm.createContext({
        AppState: { pausas: { activeTimerId: null, pausedTimerId: null, remainingSec: 1, totalCardSec: 1, intervalId: null, circuitActive: true, circuitPaused: false, circuitStep: 1, circuitCompletedSteps: [], circuitStepDurations: {}, selectedDuration: 1, voiceGuideEnabled: false, soundEnabled: false } },
        STRETCH_EXERCISES: [{ id: 1, name: 'Torção de Coluna', voiceIntro: '', voiceSwitch: '', sides: 1 }],
        document: { getElementById: getElement },
        setInterval(callback) { tick = callback; return 10; },
        clearInterval() {},
        setTimeout() {},
        triggerHaptic() {},
        playBeep() {},
        playTibetanChime() {},
        speakVoice() {},
        showStretchActiveDisplay() {},
        updateStretchActiveDisplayUI() {},
        updateCircuitOverallUI() {},
        finishStretchCircuit() {},
        startStretchCircuitStep() {}
    });
    vm.runInContext(startFunction, context);
    return { context, getElement, tick: () => tick() };
}

const direct = runOneTick(extractFunction('startStretchTimer'));
direct.context.startStretchTimer(1, true);
direct.tick();
assert.deepEqual(Array.from(direct.context.AppState.pausas.circuitCompletedSteps), [1], 'timer individual do circuito deve registrar a etapa concluída');
assert.equal(direct.context.AppState.pausas.circuitStepDurations[1], 1, 'timer individual deve guardar a duração realmente executada');

const resumed = runOneTick(extractFunction('executeResumeStretchCircuit'));
resumed.context.AppState.pausas.activeTimerId = 1;
resumed.context.executeResumeStretchCircuit();
resumed.tick();
assert.deepEqual(Array.from(resumed.context.AppState.pausas.circuitCompletedSteps), [1], 'timer retomado deve registrar a etapa concluída');
assert.equal(resumed.context.AppState.pausas.circuitStepDurations[1], 1, 'timer retomado deve guardar a duração realmente executada');

console.log('E10 circuit completed steps: PASS');

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
    const start = source.indexOf(`function ${name}(`);
    assert(start >= 0, `função ausente: ${name}`);
    const bodyStart = source.indexOf('{', start);
    let depth = 0;
    for (let i = bodyStart; i < source.length; i += 1) {
        if (source[i] === '{') depth += 1;
        if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1);
    }
    throw new Error(`bloco incompleto: ${name}`);
}

function makeElement() {
    const classes = new Set(['hidden']);
    return {
        classList: {
            add(...names) { names.forEach(name => classes.add(name)); },
            remove(...names) { names.forEach(name => classes.delete(name)); },
            contains(name) { return classes.has(name); }
        }
    };
}

// --- Encerrar (X / closeMindfulnessAudioModal) deve cancelar hápticos pendentes ---
{
    let cancelHapticsCalls = 0;
    let speechCancelCalls = 0;
    let navigatorVibrateCalls = [];
    const audio = { pause() {} };
    const modal = makeElement();
    const context = vm.createContext({
        mindfulnessPlayer: { wakeLock: { release() {} } },
        document: {
            getElementById(id) {
                if (id === 'mindfulnessAudio') return audio;
                if (id === 'mindfulnessAudioModal') return modal;
                return null;
            }
        },
        window: { AndroidBridge: {
            setKeepScreenOn() {},
            stopMindfulnessAudioSession() {},
            cancelHaptics() { cancelHapticsCalls += 1; }
        } },
        navigator: { vibrate(v) { navigatorVibrateCalls.push(v); } },
        speechSynthesis: { cancel() { speechCancelCalls += 1; } }
    });
    context.window.speechSynthesis = context.speechSynthesis;
    // simula 'speechSynthesis' in window e 'vibrate' in navigator via globalThis do contexto
    vm.runInContext(`
        if (!('speechSynthesis' in window)) Object.defineProperty(window, 'speechSynthesis', { value: speechSynthesis, enumerable: true });
        if (!('vibrate' in navigator)) Object.defineProperty(navigator, 'vibrate', { value: navigator.vibrate, enumerable: true });
    `, context);
    vm.runInContext([
        extractFunction('cancelPendingSignals'),
        extractFunction('closeMindfulnessAudioModal')
    ].join('\n'), context);

    context.closeMindfulnessAudioModal();
    assert.equal(cancelHapticsCalls, 1, 'encerrar a sessão de mindfulness deve cancelar hápticos pendentes na bridge nativa (AndroidBridge.cancelHaptics)');
    assert.equal(speechCancelCalls, 1, 'encerrar deve cancelar qualquer fala pendente (speechSynthesis)');
    assert.deepEqual(navigatorVibrateCalls, [0], 'encerrar deve zerar vibração web (navigator.vibrate(0)) como fallback');
}

console.log('E11 hápticos cancelados ao encerrar: PASS');

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
        innerText: '',
        classList: {
            add(...names) { names.forEach(name => classes.add(name)); },
            remove(...names) { names.forEach(name => classes.delete(name)); },
            contains(name) { return classes.has(name); }
        }
    };
}
const audioError = makeElement();
const retryButton = makeElement();
let pauseCalls = 0;
let loadCalls = 0;
let releasedWakeLock = 0;
let stoppedSessions = 0;
let keepScreenOn = true;
let toastCount = 0;
const audio = {
    src: 'audio/mindfulness/3track.mp3',
    paused: false,
    duration: NaN,
    currentTime: 0,
    error: null,
    pause() { pauseCalls += 1; this.paused = true; },
    load() { loadCalls += 1; }
};
const context = vm.createContext({
    mindfulnessPlayer: {
        programId: '4', phaseIndex: 2, trackType: 'formal', completed: false,
        sessionId: 'e11-missing-audio', trackPath: 'audio/mindfulness/3track.mp3',
        audioUnavailable: false, audioReady: false,
        wakeLock: { release() { releasedWakeLock += 1; } }
    },
    document: {
        getElementById(id) {
            if (id === 'mindfulnessAudio') return audio;
            if (id === 'mindfulnessAudioError') return audioError;
            if (id === 'mindfulnessAudioRetry') return retryButton;
            return null;
        }
    },
    window: { AndroidBridge: {
        stopMindfulnessAudioSession() { stoppedSessions += 1; },
        setKeepScreenOn(value) { keepScreenOn = value; }
    } },
    showInlineToast() { toastCount += 1; },
    playTibetanChime() {},
    triggerHaptic() {},
    closeMindfulnessAudioModal() {},
    renderProgramsList() {},
    updateMindfulnessAudioUI() {},
    CorePersistence: { completedSessionIds: [] },
    AppState: { programs: [] }
});
vm.runInContext([
    extractFunction('handleMindfulnessAudioError'),
    extractFunction('handleMindfulnessAudioLoaded'),
    extractFunction('retryMindfulnessAudio'),
    extractFunction('completeMindfulnessAudio')
].join('\n'), context);

context.completeMindfulnessAudio();
assert.equal(context.mindfulnessPlayer.completed, false, 'sem metadados/arquivo disponível, concluir não pode registrar a prática');
assert.equal(context.CorePersistence.completedSessionIds.length, 0, 'áudio ainda não carregado não deve gerar ID concluído');
audio.duration = 180;
context.completeMindfulnessAudio();
assert.equal(context.mindfulnessPlayer.completed, false, 'duração antiga ou provisória não deve liberar conclusão antes de loadedmetadata');
assert.equal(context.CorePersistence.completedSessionIds.length, 0, 'faixa sem loadedmetadata não deve avançar progresso');

audio.error = { code: 4 };
context.handleMindfulnessAudioError();
assert.equal(context.mindfulnessPlayer.audioUnavailable, true, 'erro de mídia deve marcar a faixa indisponível');
assert.equal(audio.paused, true, 'falha deve parar o elemento de áudio');
assert.equal(releasedWakeLock, 1, 'falha deve liberar o wake lock');
assert.equal(stoppedSessions, 1, 'falha deve encerrar a sessão nativa de mídia');
assert.equal(keepScreenOn, false, 'falha deve liberar a tela ligada');
assert.equal(audioError.classList.contains('hidden'), false, 'falha deve exibir mensagem acessível');
assert.equal(retryButton.classList.contains('hidden'), false, 'falha deve oferecer nova tentativa');

context.completeMindfulnessAudio();
assert.equal(context.mindfulnessPlayer.completed, false, 'faixa indisponível não pode gerar conclusão');
assert.equal(context.CorePersistence.completedSessionIds.length, 0, 'faixa indisponível não deve contaminar progresso');

context.retryMindfulnessAudio();
assert.equal(context.mindfulnessPlayer.audioUnavailable, false, 'nova tentativa deve limpar o estado de erro');
assert.equal(context.mindfulnessPlayer.audioReady, false, 'nova tentativa deve aguardar metadados da fonte recarregada');
assert.equal(audio.src, 'audio/mindfulness/3track.mp3', 'nova tentativa deve recarregar a faixa selecionada');
assert.equal(loadCalls, 1, 'nova tentativa deve chamar load no elemento de áudio');
assert.equal(audioError.classList.contains('hidden'), true, 'nova tentativa deve ocultar a mensagem anterior');
assert.equal(retryButton.classList.contains('hidden'), true, 'nova tentativa deve ocultar o botão até nova falha');
audio.error = null;
context.handleMindfulnessAudioLoaded();
assert.equal(context.mindfulnessPlayer.audioReady, true, 'loadedmetadata deve habilitar a faixa');
assert(toastCount >= 1, 'falha deve informar o usuário');

console.log('E11 missing audio error/retry: PASS');

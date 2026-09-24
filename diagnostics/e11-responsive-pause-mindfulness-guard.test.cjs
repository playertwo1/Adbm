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

function makeElement(extra = {}) {
    const classes = new Set(['hidden']);
    return Object.assign({
        innerText: '', className: '', style: {},
        classList: {
            add(...names) { names.forEach(n => classes.add(n)); },
            remove(...names) { names.forEach(n => classes.delete(n)); },
            contains(n) { return classes.has(n); }
        },
        setAttribute() {}
    }, extra);
}

let toastMessages = [];

function buildContext(responsivePauseStatus) {
    const els = {};
    const context = vm.createContext({
        mindfulnessPlayer: {},
        responsivePause: { status: responsivePauseStatus, sessionId: responsivePauseStatus === 'paused' ? 123 : null },
        AppState: {
            programs: [{
                id: '4',
                currentPhaseIndex: 0,
                mindfulnessMuteAlerts: false,
                phases: [
                    { formalTrack: 'audio/mindfulness/1track.mp3', formalTrackTitle: 'Faixa 1', details: 'Detalhe' }
                ]
            }],
            mindfulnessMuteAlerts: false
        },
        document: {
            getElementById(id) {
                if (id === 'mindfulnessAudio') return { src: '', load() {}, paused: true };
                return els[id] || (els[id] = makeElement());
            }
        },
        showInlineToast(msg) { toastMessages.push(msg); },
        mindfulnessTrackMeta() { return { path: 'x', title: 'x' }; },
        updateMindfulnessAudioUI() {}
    });
    return context;
}

assert(source.includes('function openMindfulnessAudioModal'), 'openMindfulnessAudioModal deve existir');

// --- abrir Mindfulness enquanto a Pausa de Resposta está em andamento deve ser bloqueado ---
{
    toastMessages = [];
    const context = buildContext('running');
    vm.runInContext(extractFunction('openMindfulnessAudioModal'), context);
    context.openMindfulnessAudioModal('4', 0, 'formal');
    assert.equal(context.mindfulnessPlayer.trackPath, undefined, 'não deve carregar áudio de mindfulness com a Pausa de Resposta em andamento');
    assert.ok(toastMessages.some(m => /outra sessão|Pausa de Resposta/i.test(m)), 'deve avisar o usuário do bloqueio por sessão concorrente');
}

// --- abrir Mindfulness enquanto a Pausa de Resposta está pausada (retomável) também deve ser bloqueado ---
{
    toastMessages = [];
    const context = buildContext('paused');
    vm.runInContext(extractFunction('openMindfulnessAudioModal'), context);
    context.openMindfulnessAudioModal('4', 0, 'formal');
    assert.equal(context.mindfulnessPlayer.trackPath, undefined, 'não deve carregar áudio de mindfulness com a Pausa de Resposta pausada (retomável)');
}

// --- abrir Mindfulness com a Pausa de Resposta ociosa deve funcionar normalmente ---
{
    toastMessages = [];
    const context = buildContext('idle');
    vm.runInContext(extractFunction('openMindfulnessAudioModal'), context);
    context.openMindfulnessAudioModal('4', 0, 'formal');
    assert.equal(context.mindfulnessPlayer.trackPath, 'audio/mindfulness/1track.mp3', 'deve abrir normalmente quando não há sessão concorrente');
}

console.log('E11 Pausa de Resposta / bloqueio de sessão concorrente com Mindfulness: PASS');

// --- iniciar Pausa de Resposta enquanto o Mindfulness está tocando deve ser bloqueado ---
{
    function extractStartResponsivePause() {
        const start = source.indexOf('function startResponsivePause(');
        assert(start >= 0, 'função ausente: startResponsivePause');
        const bodyStart = source.indexOf('{', start);
        let depth = 0;
        for (let i = bodyStart; i < source.length; i += 1) {
            if (source[i] === '{') depth += 1;
            if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1);
        }
        throw new Error('bloco incompleto: startResponsivePause');
    }

    toastMessages = [];
    let modalOpened = false;
    const modalEl = makeElement();
    modalEl.classList.remove('hidden'); // modal do mindfulness aberto (não hidden)
    const audioEl = { paused: false }; // áudio de mindfulness tocando
    const context = vm.createContext({
        mindfulnessPlayer: { trackPath: 'audio/mindfulness/1track.mp3' },
        responsivePause: { status: 'idle', sessionId: null, intervalId: null },
        AppState: { mente: {}, pausas: {}, dailyExecution: {} },
        document: {
            getElementById(id) {
                if (id === 'mindfulnessAudioModal') return modalEl;
                if (id === 'mindfulnessAudio') return audioEl;
                return makeElement();
            }
        },
        showInlineToast(msg) { toastMessages.push(msg); },
        openResponsivePauseModal() { modalOpened = true; },
        updateResponsivePauseUI() {},
        persistResponsivePause() {},
        performance,
        clearInterval() {},
        setInterval() { return 1; }
    });
    vm.runInContext(extractStartResponsivePause(), context);
    context.startResponsivePause();
    assert.equal(modalOpened, false, 'não deve abrir a Pausa de Resposta com o Mindfulness tocando');
    assert.ok(toastMessages.some(m => /Mindfulness/i.test(m)), 'deve avisar sobre a sessão de Mindfulness em andamento');
}

console.log('E11 Pausa de Resposta / bloqueio inverso (Mindfulness tocando): PASS');

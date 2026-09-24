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
function extractAsyncFunction(name) {
    const start = source.indexOf(`async function ${name}(`);
    assert(start >= 0, `função ausente: async ${name}`);
    const bodyStart = source.indexOf('{', start);
    let depth = 0;
    for (let i = bodyStart; i < source.length; i += 1) {
        if (source[i] === '{') depth += 1;
        if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1);
    }
    throw new Error(`bloco incompleto: async ${name}`);
}

function makeElement(extra = {}) {
    const classes = new Set(['hidden']);
    return Object.assign({
        innerText: '',
        max: 0,
        value: 0,
        classList: {
            add(...names) { names.forEach(name => classes.add(name)); },
            remove(...names) { names.forEach(name => classes.delete(name)); },
            toggle(name, force) {
                if (force === undefined) { classes.has(name) ? classes.delete(name) : classes.add(name); }
                else if (force) classes.add(name); else classes.delete(name);
            },
            contains(name) { return classes.has(name); }
        }
    }, extra);
}

let sessionsStarted = 0;
let sessionsStopped = 0;
let keepScreenOnCalls = [];
let wakeLockRequested = 0;
let toastMessages = [];

function buildAudio() {
    return {
        paused: true,
        duration: 180,
        currentTime: 40,
        play() { this.paused = false; return Promise.resolve(); },
        pause() { this.paused = true; }
    };
}

function buildContext(audio) {
    const els = {
        mindfulnessScrubber: makeElement(),
        mindfulnessElapsed: makeElement(),
        mindfulnessRemaining: makeElement(),
        mindfulnessPlayIcon: makeElement(),
        mindfulnessPulse: makeElement(),
        mindfulnessTrackTitle: makeElement({ innerText: 'Meditação' })
    };
    const context = vm.createContext({
        mindfulnessPlayer: {
            programId: '4', phaseIndex: 0, trackType: 'formal', completed: false,
            sessionId: 'e11-controls', trackPath: 'audio/mindfulness/1track.mp3',
            audioUnavailable: false, audioReady: true, wakeLock: null
        },
        document: {
            getElementById(id) {
                if (id === 'mindfulnessAudio') return audio;
                return els[id] || null;
            }
        },
        navigator: { wakeLock: { request: async () => { wakeLockRequested += 1; return { release: async () => {} }; } } },
        window: { AndroidBridge: {
            startMindfulnessAudioSession() { sessionsStarted += 1; },
            stopMindfulnessAudioSession() { sessionsStopped += 1; },
            setKeepScreenOn(value) { keepScreenOnCalls.push(value); },
            updateMindfulnessAudioState() {}
        } },
        showInlineToast(msg) { toastMessages.push(msg); },
        formatMindfulnessTime(s) { return String(Math.max(0, Math.floor(s))); },
        mindfulnessLastNativeSync: 0,
        Date
    });
    return { context, els };
}

// --- skipMindfulnessAudio: clamp aos extremos ---
{
    const audio = buildAudio();
    const { context } = buildContext(audio);
    vm.runInContext(extractFunction('skipMindfulnessAudio'), context);

    audio.currentTime = 5;
    context.skipMindfulnessAudio(-15);
    assert.equal(audio.currentTime, 0, 'retroceder além do início deve travar em 0');

    audio.currentTime = 170;
    context.skipMindfulnessAudio(15);
    assert.equal(audio.currentTime, 180, 'avançar além do fim deve travar na duração total');

    audio.currentTime = 60;
    context.skipMindfulnessAudio(15);
    assert.equal(audio.currentTime, 75, 'avanço dentro dos limites deve somar o delta exato');
}

// --- seekMindfulnessAudio: clamp aos extremos, incluindo valor negativo ---
{
    const audio = buildAudio();
    const { context } = buildContext(audio);
    vm.runInContext(extractFunction('seekMindfulnessAudio'), context);

    context.seekMindfulnessAudio(-30);
    assert.equal(audio.currentTime, 0, 'busca com valor negativo deve travar em 0, nunca ficar negativa');

    context.seekMindfulnessAudio(999);
    assert.equal(audio.currentTime, 180, 'busca além da duração deve travar no fim da faixa');

    context.seekMindfulnessAudio(90);
    assert.equal(audio.currentTime, 90, 'busca dentro dos limites deve posicionar exatamente no valor pedido');

    audio.duration = NaN;
    audio.currentTime = 50;
    context.seekMindfulnessAudio(120);
    assert.equal(audio.currentTime, 50, 'sem duração conhecida (metadados não carregados), busca não deve mover a posição');
}

// --- toggleMindfulnessAudio: play/pause reais, sessão nativa e wake lock ---
{
    const audio = buildAudio();
    const { context } = buildContext(audio);
    vm.runInContext([
        extractAsyncFunction('toggleMindfulnessAudio'),
        extractFunction('updateMindfulnessAudioUI'),
        extractFunction('syncMindfulnessNativeState')
    ].join('\n'), context);

    return context.toggleMindfulnessAudio().then(() => {
        assert.equal(audio.paused, false, 'alternar com áudio pausado deve iniciar a reprodução');
        assert.equal(sessionsStarted, 1, 'iniciar reprodução deve abrir a sessão de mídia nativa');
        assert.equal(keepScreenOnCalls[keepScreenOnCalls.length - 1], true, 'reprodução ativa deve manter a tela ligada');
        assert.equal(wakeLockRequested, 1, 'reprodução ativa deve solicitar wake lock');

        return context.toggleMindfulnessAudio().then(() => {
            assert.equal(audio.paused, true, 'alternar novamente deve pausar a reprodução');
            // Nota: pausar NÃO encerra a sessão nativa hoje (comportamento atual, não alterado
            // nesta tranche); só closeMindfulnessAudioModal()/handleMindfulnessAudioError()
            // chamam stopMindfulnessAudioSession(). Sincronizar sessão/posição em segundo plano
            // é item separado do checklist E11 ("Notificação/tela sincronizam posição em
            // segundo plano"), ainda não implementado — não inventar esse comportamento aqui.
            assert.equal(sessionsStopped, 0, 'pausar não encerra a sessão nativa no comportamento atual (item separado do checklist)');
            assert.equal(keepScreenOnCalls[keepScreenOnCalls.length - 1], false, 'pausar deve liberar a tela ligada');
        });
    }).then(() => {
        console.log('E11 playback controls (play/pause, ±15s, busca, extremos): PASS');
    });
}

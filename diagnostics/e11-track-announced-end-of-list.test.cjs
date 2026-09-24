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
        innerText: '',
        classList: {
            add(...names) { names.forEach(name => classes.add(name)); },
            remove(...names) { names.forEach(name => classes.delete(name)); },
            contains(name) { return classes.has(name); }
        }
    }, extra);
}

// --- Item 1: mindfulnessTrackMeta é a fonte única de verdade para path/título ---
// (usada tanto na abertura do modal quanto na seleção manual de faixa)
{
    const context = vm.createContext({});
    vm.runInContext(extractFunction('mindfulnessTrackMeta'), context);
    const meta3 = context.mindfulnessTrackMeta(3);
    assert.equal(meta3.path, 'audio/mindfulness/3track.mp3', 'faixa 3 deve apontar para o arquivo 3track.mp3');
    assert.equal(meta3.title, 'Movimento Consciente', 'título deve corresponder ao catálogo real, não a rótulo genérico');
    const metaUnknown = context.mindfulnessTrackMeta(99);
    assert.equal(metaUnknown.path, 'audio/mindfulness/99track.mp3', 'faixa desconhecida ainda aponta para um arquivo previsível');
    assert.equal(metaUnknown.title, 'Faixa 99', 'faixa sem título mapeado usa rótulo padrão, não texto vazio/quebrado');
}

// --- Item 2: selecionar faixa alternativa troca src E título juntos (nunca dessincronizados) ---
{
    const audioError = makeElement();
    const retryButton = makeElement();
    const trackTitle = makeElement();
    let loadCalls = 0;
    const audio = { src: '', paused: true, load() { loadCalls += 1; }, play() { return Promise.resolve(); } };
    const context = vm.createContext({
        mindfulnessPlayer: { trackPath: 'audio/mindfulness/3track.mp3', audioUnavailable: false, audioReady: true },
        document: {
            getElementById(id) {
                if (id === 'mindfulnessAudio') return audio;
                if (id === 'mindfulnessAudioError') return audioError;
                if (id === 'mindfulnessAudioRetry') return retryButton;
                if (id === 'mindfulnessTrackTitle') return trackTitle;
                return null;
            }
        }
    });
    vm.runInContext([
        extractFunction('mindfulnessTrackMeta'),
        extractFunction('selectMindfulnessTrack')
    ].join('\n'), context);

    context.selectMindfulnessTrack('1');
    assert.equal(audio.src, 'audio/mindfulness/1track.mp3', 'trocar para a faixa 1 deve carregar exatamente o arquivo 1track.mp3');
    assert.equal(trackTitle.innerText, 'Meditação do Corpo e da Respiração', 'título exibido deve corresponder ao arquivo realmente carregado');
    assert.equal(context.mindfulnessPlayer.trackPath, 'audio/mindfulness/1track.mp3', 'trackPath interno (usado pela retentativa) deve acompanhar a troca');
    assert.equal(loadCalls, 1, 'troca de faixa deve recarregar o elemento de áudio');
}

// --- Item 3: concluir a última semana (fim da lista) não tenta avançar para fase inexistente ---
{
    const audio = { currentTime: 480, error: null, duration: 480 };
    let saveCalls = 0;
    let toastMessages = [];
    let closeCalls = 0;
    const context = vm.createContext({
        mindfulnessPlayer: {
            programId: '4', phaseIndex: 7, trackType: 'formal', completed: false,
            sessionId: 'e11-last-week', audioReady: true, audioUnavailable: false
        },
        document: { getElementById(id) { return id === 'mindfulnessAudio' ? audio : null; } },
        AppState: {
            programs: [{
                id: '4',
                daysCompletedInPhase: 5,
                sessionsToday: 0,
                phases: [
                    { targetSessionsPerDay: 1, weeklyTargetDays: 6, completed: false },
                    { targetSessionsPerDay: 1, weeklyTargetDays: 6, completed: false },
                    { targetSessionsPerDay: 1, weeklyTargetDays: 6, completed: false },
                    { targetSessionsPerDay: 1, weeklyTargetDays: 6, completed: false },
                    { targetSessionsPerDay: 1, weeklyTargetDays: 6, completed: false },
                    { targetSessionsPerDay: 1, weeklyTargetDays: 6, completed: false },
                    { targetSessionsPerDay: 1, weeklyTargetDays: 6, completed: false },
                    // fase 7 = Semana 8, a última da lista (índice 0-based mais alto)
                    { targetSessionsPerDay: 1, weeklyTargetDays: 6, completed: false }
                ]
            }]
        },
        CorePersistence: { completedSessionIds: [] },
        getConfiguredWeeklyTargetDays(phase) { return phase.weeklyTargetDays; },
        addMinutesToday() {},
        saveState() { saveCalls += 1; return true; },
        showInlineToast(msg) { toastMessages.push(msg); },
        playTibetanChime() {},
        triggerHaptic() {},
        closeMindfulnessAudioModal() { closeCalls += 1; },
        renderProgramsList() {}
    });
    vm.runInContext(extractFunction('completeMindfulnessAudio'), context);

    assert.doesNotThrow(() => context.completeMindfulnessAudio(), 'concluir a última semana não pode lançar erro por fase seguinte inexistente');
    const prog = context.AppState.programs[0];
    const lastPhase = prog.phases[7];
    assert.equal(prog.currentPhaseIndex, undefined, 'sem fase seguinte, currentPhaseIndex não deve ser definido para um índice fora da lista');
    assert.equal(lastPhase.completed, true, 'a última semana deve ser marcada concluída mesmo sem próxima fase');
    assert.equal(closeCalls, 1, 'fim da lista deve fechar o modal normalmente, comportamento definido');
    assert.equal(saveCalls, 1, 'fim da lista deve persistir o progresso como qualquer conclusão');
}

console.log('E11 next-track/end-of-list (arquivo anunciado, fim da lista): PASS');

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

assert(source.includes("id=\"mindfulnessMuteAlerts"), 'deve existir um controle de silenciar avisos no player de mindfulness (referência: 08-mindfulness-player.png)');
assert(source.includes('function toggleMindfulnessMuteAlerts'), 'função toggleMindfulnessMuteAlerts ausente');

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
            toggle(name, force) {
                if (force === undefined) { classes.has(name) ? classes.delete(name) : classes.add(name); }
                else if (force) classes.add(name); else classes.delete(name);
            },
            contains(name) { return classes.has(name); }
        },
        setAttribute() {}
    }, extra);
}

// --- toggleMindfulnessMuteAlerts alterna o estado e persiste, sem tocar a narração ---
{
    let chimeCalls = 0;
    let hapticCalls = 0;
    let saveCalls = 0;
    const audio = { currentTime: 300, error: null, duration: 300, paused: false };
    const btn = makeElement();
    const context = vm.createContext({
        mindfulnessPlayer: {
            programId: '4', phaseIndex: 0, trackType: 'formal', completed: false,
            sessionId: 'e11-mute-alerts', audioReady: true, audioUnavailable: false
        },
        AppState: { mindfulnessMuteAlerts: false, programs: [{ id: '4', phases: [{ targetSessionsPerDay: 1, weeklyTargetDays: 6 }] }] },
        document: { getElementById(id) { return id === 'mindfulnessAudio' ? audio : (id === 'mindfulnessMuteAlertsBtn' ? btn : null); } },
        CorePersistence: { completedSessionIds: [] },
        getConfiguredWeeklyTargetDays(phase) { return phase.weeklyTargetDays; },
        addMinutesToday() {},
        saveState() { saveCalls += 1; return true; },
        showInlineToast() {},
        playTibetanChime() { chimeCalls += 1; },
        triggerHaptic() { hapticCalls += 1; },
        closeMindfulnessAudioModal() {},
        renderProgramsList() {},
        localStorage: { setItem() {} }
    });
    vm.runInContext([
        extractFunction('toggleMindfulnessMuteAlerts'),
        extractFunction('completeMindfulnessAudio')
    ].join('\n'), context);

    // estado inicial: avisos ativos (padrão) -> concluir dispara chime/haptic
    context.completeMindfulnessAudio();
    assert.equal(chimeCalls, 1, 'com avisos ativos, concluir deve tocar o sino de conclusão');
    assert.equal(hapticCalls, 1, 'com avisos ativos, concluir deve disparar o háptico de conclusão');
    assert.equal(audio.paused, false, 'silenciar avisos não deve tocar no estado de reprodução da narração/áudio principal');

    context.toggleMindfulnessMuteAlerts();
    assert.equal(context.AppState.mindfulnessMuteAlerts, true, 'alternar deve ativar o silenciamento de avisos');

    // nova sessão para poder concluir de novo
    context.mindfulnessPlayer = {
        programId: '4', phaseIndex: 0, trackType: 'formal', completed: false,
        sessionId: 'e11-mute-alerts-2', audioReady: true, audioUnavailable: false
    };
    context.completeMindfulnessAudio();
    assert.equal(chimeCalls, 1, 'com avisos silenciados, concluir NÃO deve tocar o sino (permanece no valor anterior)');
    assert.equal(hapticCalls, 1, 'com avisos silenciados, concluir NÃO deve disparar háptico (permanece no valor anterior)');
    assert.equal(audio.paused, false, 'silenciar avisos continua sem afetar o áudio/narração principal');
}

console.log('E11 mute alerts (avisos) distinto de narração: PASS');

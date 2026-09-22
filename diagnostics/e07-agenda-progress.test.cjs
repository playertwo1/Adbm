const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.join(__dirname, '..');
const files = [
    path.join(root, 'index.html'),
    path.join(root, 'app', 'src', 'main', 'assets', 'index.html')
];

function extractFunction(source, name) {
    const start = source.indexOf(`        function ${name}(`);
    assert(start >= 0, `Função ausente: ${name}`);
    return extractBlock(source, start, `function ${name}`);
}

function extractBlock(source, start, label) {
    let depth = 0;
    let opened = false;
    for (let index = source.indexOf('{', start); index < source.length; index += 1) {
        if (source[index] === '{') { depth += 1; opened = true; }
        if (source[index] === '}' && opened && --depth === 0) return source.slice(start, index + 1);
    }
    throw new Error(`Bloco incompleto: ${label}`);
}

function extractAssignedFunction(source, name) {
    const start = source.indexOf(`        window.${name} = function(`);
    assert(start >= 0, `Handler ausente: ${name}`);
    const functionStart = source.indexOf('function(', start);
    return extractBlock(source, functionStart, `handler ${name}`).replace(/^function\(/, `function ${name}(`);
}

const sources = files.map(file => fs.readFileSync(file, 'utf8'));
assert.equal(sources[0], sources[1], 'HTML raiz e asset embarcado precisam permanecer idênticos');
const source = sources[0];

// Agenda não pode inventar horários/frequência quando o programa não os possui.
assert.match(source, /function getProgramSchedule\(program, phase = null\)/);
assert.match(source, /const reminderTimes = Array\.isArray\(prog\.reminderTimes\)/);
assert.match(source, /Horário não configurado/);
assert.match(source, /frequência não configurada/);
assert.match(source, /Dia não configurado/);
assert.doesNotMatch(source, /const reminderTimes = prog\.reminderTimes \|\| \['09:00', '16:00'\]/);
assert.doesNotMatch(source, /weeklyTargetDays \|\| 7/);

const schedule = extractFunction(source, 'getProgramSchedule');
const merge = extractFunction(source, 'mergeLoadedPrograms');
const synchronize = extractFunction(source, 'synchronizeProgramProgress');
const collect = extractFunction(source, 'collectProgressData');
const apply = extractFunction(source, 'applyProgressData');
const nativeWorkoutState = extractAssignedFunction(source, 'onNativeWorkoutState');
const completeMindfulness = extractFunction(source, 'completeMindfulnessAudio');
const renderMindfulness = extractFunction(source, 'renderMindfulnessProgramCard');
const context = vm.createContext({
    AppState: {
        programs: [{
            id: '3', currentPhaseIndex: 0, daysCompletedInPhase: 5, currentDayInWeek: 5, sessionsToday: 0,
            dailyTarget: 2, phases: [
                { weeklyTargetDays: 5, completed: false },
                { weeklyTargetDays: 5, completed: false }
            ]
        }, {
            id: '2', currentPhaseIndex: 0, daysCompletedInPhase: 3, currentDayInWeek: 4, sessionsToday: 2,
            dailyTarget: 2, reminderTimes: [], phases: [
                { completed: false },
                { completed: false }
            ]
        }],
        schedule: [], activityLog: {}, unlockedAchievements: [], mente: { history: [], customPresets: [] },
        pausas: { history: [] }, pushNotificationsEnabled: false,
        dailyExecution: { sessionsCompletedToday: 0, isRunning: false, isPaused: false },
        vacuo: { isRunning: false, isPaused: true }, programDetailState: null
    },
    CorePersistence: { completedSessionIds: [], sessionHistory: [] },
    responsivePause: { history: [], historyEnabled: false },
    localDateKey: () => '2026-09-22',
    normalizeSessionHistory: records => Array.isArray(records) ? records : [],
    renderDailyExecutionUI: () => {},
    addMinutesToday: () => {},
    saveState: () => true,
    showInlineToast: () => {},
    renderProgramsList: () => {},
    playTibetanChime: () => {},
    triggerHaptic: () => {},
    closeMindfulnessAudioModal: () => {},
    document: {
        hidden: false,
        getElementById: id => id === 'dailyExecutionSessionTag'
            ? context.nativeSessionTag
            : id === 'mindfulnessAudio'
                ? { currentTime: 0, pause: () => {} }
                : { innerText: '', classList: { add: () => {}, remove: () => {}, toggle: () => {} } }
    },
    nativeCompletionHandled: false,
    nativeSessionTag: { innerText: '' },
    mindfulnessPlayer: { programId: '4', phaseIndex: 0, trackType: 'formal', completed: false, sessionId: 'mindfulness-test' },
    window: {}
});
vm.runInContext(`${schedule}; ${synchronize}; ${merge}; ${collect}; ${apply}; ${nativeWorkoutState}; ${completeMindfulness}; ${renderMindfulness}`, context);

// Renderização derivada: ausência de frequência produz estado explícito, nunca null/undefined ou 7.
assert.equal(vm.runInContext("JSON.stringify(getProgramSchedule({ currentPhaseIndex: 0, daysCompletedInPhase: 3, phases: [{ title: 'Sem frequência' }] }))", context), JSON.stringify({
    targetDays: null,
    currentDay: null,
    daysCompleted: 3,
    targetDaysLabel: 'frequência não configurada',
    currentDayLabel: 'Dia não configurado'
}));

// O card Mindfulness não fabrica uma meta semanal quando a fase não a configura.
const mindfulnessCard = vm.runInContext("renderMindfulnessProgramCard({ id: '4', title: 'Mente', currentPhaseIndex: 0, daysCompletedInPhase: 0, sessionsToday: 0, phases: [{ title: 'Sem frequência', formalTrackTitle: 'Prática', informalTitle: 'Informal', informalDescription: 'Descrição', targetSessionsPerDay: 1, completed: false }] }, 0)", context);
assert.match(mindfulnessCard, /Progresso semanal não configurado/);
assert.doesNotMatch(mindfulnessCard, /0\/6 dias|width:6|undefined|null/);

// Sem weeklyTargetDays, sincronização e conclusão não fabricam uma semana de 7 dias.
vm.runInContext('synchronizeProgramProgress(AppState.programs[1])', context);
assert.equal(vm.runInContext('AppState.programs[1].currentDayInWeek', context), 1);
assert.equal(vm.runInContext('AppState.programs[1].daysCompletedInPhase', context), 3);

// Reidratação nativa sem frequência mantém o estado explícito e não fabrica 7 dias.
vm.runInContext("onNativeWorkoutState({ status: 'running', session: { programId: '2', phaseIndex: 0, currentDay: null, targetDays: null, sessionNumber: 1, targetSessions: 2 } })", context);
assert.equal(vm.runInContext('nativeSessionTag.innerText', context), 'Semana 1 • Dia não configurado/frequência não configurada (Sessão 1/2)');
assert.doesNotMatch(vm.runInContext('nativeSessionTag.innerText', context), /null|undefined|7/);

// Conclusão mindfulness sem weeklyTargetDays registra a sessão, mas não avança fase/dia.
vm.runInContext("AppState.programs.push({ id: '4', currentPhaseIndex: 0, sessionsToday: 0, daysCompletedInPhase: 0, phases: [{ targetSessionsPerDay: 1, completed: false }] }); completeMindfulnessAudio();", context);
assert.equal(vm.runInContext('AppState.programs[2].sessionsToday', context), 1);
assert.equal(vm.runInContext('AppState.programs[2].daysCompletedInPhase', context), 0);
assert.equal(vm.runInContext('AppState.programs[2].phases[0].completed', context), false);

// A revisão pendente e a ausência de frequência sobrevivem a um round-trip real de snapshot.
const snapshot = vm.runInContext('JSON.parse(JSON.stringify(collectProgressData()))', context);
vm.runInContext("AppState.programs[0].progressionReview = null; AppState.programs[0].phases[0].reviewPending = false; AppState.programs[1].daysCompletedInPhase = 0; AppState.programs[1].currentDayInWeek = 7;", context);
snapshot.programs[0].progressionReview = { phaseIndex: 0, status: 'pending', reason: 'weekly-target-reached' };
snapshot.programs[0].phases[0].reviewPending = true;
snapshot.programs[0].phases[0].reviewPendingAt = '2026-09-21';
snapshot.programs[0].phases[0].reviewReason = 'weekly-target-reached';
context.__snapshot = snapshot;
vm.runInContext('applyProgressData(__snapshot)', context, { filename: 'e07-agenda-progress.test.cjs' });
assert.equal(vm.runInContext('AppState.programs[0].progressionReview.status', context), 'pending');
assert.equal(vm.runInContext('AppState.programs[0].phases[0].reviewPending', context), true);
assert.equal(vm.runInContext('AppState.programs[0].currentPhaseIndex', context), 0);
assert.equal(vm.runInContext('AppState.programs[1].daysCompletedInPhase', context), 3);
assert.equal(vm.runInContext('AppState.programs[1].currentDayInWeek', context), 1);

console.log('E07 agenda/progress regressions: real agenda, missing-data honesty, completion guard, and snapshot round-trip verified.');

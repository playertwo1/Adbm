const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

// Exercise either entry point so divergence cannot hide a broken browser build.
const html = fs.readFileSync(path.join(__dirname, '..', process.env.CORE_HTML || 'app/src/main/assets/index.html'), 'utf8');
const service = fs.readFileSync(path.join(__dirname, '..', 'app/src/main/java/com/example/WorkoutForegroundService.kt'), 'utf8');

function extractFunction(name) {
    const start = html.indexOf(`        function ${name}(`);
    assert(start >= 0, `Função ausente: ${name}`);
    let depth = 0, opened = false;
    for (let index = html.indexOf('{', start); index < html.length; index++) {
        if (html[index] === '{') { depth++; opened = true; }
        if (html[index] === '}' && opened && --depth === 0) return html.slice(start, index + 1);
    }
    throw new Error(`Função incompleta: ${name}`);
}

const appState = html.slice(html.indexOf('        const AppState = {'), html.indexOf('        const CORE_DATA_VERSION'));
const persistenceStart = html.indexOf('        const CORE_PROGRESS_SNAPSHOT_KEY');
const persistenceEnd = html.indexOf('        // Initialize on load', persistenceStart);

const source = [
    appState,
    'const CORE_DATA_VERSION = 3;',
    extractFunction('localDateKey'),
    extractFunction('getConfiguredWeeklyTargetDays'),
    extractFunction('isStrictNonNegativeInteger'),
    extractFunction('isValidReminderTime'),
    extractFunction('isReminderScheduleComplete'),
    extractFunction('synchronizeProgramProgress'),
    extractFunction('getProgramSteps'),
    extractFunction('assignKegelLogicalSeries'),
    extractFunction('countWorkoutSeries'),
    extractFunction('countCompletedSeries'),
    extractFunction('deriveDailySessionMetrics'),
    extractFunction('deriveNativeVacuumMetrics'),
    extractFunction('getVacuumSessionMetrics'),
    extractFunction('finalizeVacuumPause'),
    extractFunction('enterVacuumRecoveryPause'),
    extractFunction('cancelPendingSignals'),
    extractFunction('pauseVacuo'),
    extractFunction('completeVacuumSession'),
    extractFunction('startVacuo'),
    extractFunction('transitionVacuoPhase'),
    extractFunction('runVacuoTick'),
    extractFunction('recordVacuumSession'),
    extractFunction('skipVacuoPhase'),
    extractFunction('advanceVacuoSeries'),
    extractFunction('finishDailySession'),
    extractFunction('abortDailySession'),
    html.slice(html.indexOf('        window.onNativeWorkoutState = function('), html.indexOf('        function handleNativeVacuumState(')),
    extractFunction('handleNativeVacuumState'),
    extractFunction('resetVacuo'),
    extractFunction('setPosture'),
    extractFunction('setVacuumDuration'),
    extractFunction('updateVacDurationPills'),
    extractFunction('openTodayShortcut'),
    extractFunction('triggerQuickAction'),
    extractFunction('updateSessionFeedback'),
    html.slice(persistenceStart, persistenceEnd)
].join('\n');

const storage = {};
const context = vm.createContext({
    console: { log(msg) { console.log(msg); }, error(msg, err) { console.error("ERROR:", msg, err); } },
    TextEncoder,
    ACCESSIBILITY_DEFAULTS: { textScale: 'normal', highContrast: false, reducedMotion: false },
    normalizeAccessibilityPreferences: value => ({
        textScale: value?.textScale === 'large' ? 'large' : 'normal',
        highContrast: value?.highContrast === true,
        reducedMotion: value?.reducedMotion === true
    }),
    document: {
        getElementById() {
            return { classList: { remove(){}, add(){}, contains(){return false;} }, className: '', innerText: '', style: {} };
        },
        querySelectorAll() { return []; }
    },
    window: {},
    hasSystemReminderPermission() { return false; },
    navigator: {},
    localStorage: {
        setItem(key, value) { storage[key] = value; },
        getItem(key) { return storage[key] || null; },
        removeItem(key) { delete storage[key]; },
        clear() { for(let k in storage) delete storage[k]; }
    },
    clearInterval() {},
    setInterval() { return 1; },
    addMinutesToday() {},
    triggerHaptic() {},
    speakVoice() {},
    renderProgramsList() {},
    renderDailyExecutionUI() {},
    closeDailyExecutionModal() {},
    celebrateDailyGoal() {},
    showProgramCompletionScreen() {},
    markScheduleDone() {},
    setTimeout(cb) { cb(); },
    getAudioContext() {},
    playTibetanChime() {},
    playInhaleSignal() {},
    playExhaleSignal() {},
    playSuccessPattern() {},
    playRelaxationSignal() {},
    updateCoreAnimation() {},
    updateVacuumPlayerUI() {},
    showVacuumStartError() {},
    hideVacuumStartError() {},
    showVacuumSummary() {},
    saveState() {},
    setVacProgress() {},
    highlightPhaseCard() {},
    switchTab() {},
    setDeskMode() {},
    openMindfulnessAudioModal() {},
    switchDiscreteSubtab() {},
    setKegelMode() {},
    toggleBracingTimer() {},
    toggleKegelTimer() {},
    startFullStretchCircuit() {}
});

vm.runInContext(source, context);

// Test finishDailySession creates completed record and persists
vm.runInContext(`
    CorePersistence.status = 'ready';
    AppState.dailyExecution = {
        sessionId: 'test-session-1',
        programId: '3',
        phaseIndex: 0,
        isRunning: true,
        isPaused: false,
        totalSessionElapsed: 120,
        steps: [
            { isRest: false, duration: 60 },
            { isRest: true, duration: 60 }
        ]
    };
    finishDailySession();
`, context);

const history1 = vm.runInContext('CorePersistence.sessionHistory', context);
assert.equal(history1.length, 1, 'finishDailySession should add a record');
assert.equal(history1[0].status, 'completed', 'record status should be completed');

const snapshot1 = JSON.parse(storage['coreflow_progress_snapshot_v4'] || '{}');
assert.equal(snapshot1.data?.sessionHistory?.length, 1, 'sessionHistory must be saved to localStorage v4');
assert.equal(snapshot1.data?.dailyExecution?.sessionId, 'test-session-1', 'dailyExecution state must be persisted');
assert.equal(history1[0].retentionSeconds, 0, 'daily session retention must not use total elapsed time');
assert.equal(history1[0].totalElapsedSeconds, 120, 'daily session must persist the actual elapsed total separately');

// Daily vacuum steps share one logical series across preparation, breathing,
// retention, return, and recovery phases.
assert.equal(vm.runInContext('countWorkoutSeries(getProgramSteps("3", 0))', context), 3, 'planned series must count logical sets, not phases');
assert.equal(vm.runInContext('countCompletedSeries(getProgramSteps("3", 0), 4)', context), 1, 'completed series must require every work phase in the set');

// Kegel steps must carry explicit logical-set metadata; individual phases or
// repetitions must not become implicit series, and Web/native boundaries must
// agree when the final step is reached or interrupted before it.
const kegelExpectedSeries = [3, 8, 2, 4, 4, 5, 2, 3];
kegelExpectedSeries.forEach((expected, phaseIndex) => {
    const expression = `getProgramSteps("2", ${phaseIndex})`;
    assert.equal(vm.runInContext(`countWorkoutSeries(${expression})`, context), expected, `Kegel phase ${phaseIndex + 1} planned series must use logical sets`);
    assert.equal(vm.runInContext(`(${expression}).filter(step => !step.isRest).every(step => Number.isInteger(step.series) && step.series > 0)`, context), true, `Kegel phase ${phaseIndex + 1} work steps need explicit series metadata`);
    assert.equal(vm.runInContext(`countCompletedSeries(${expression}, (${expression}).length)`, context), expected, `Kegel phase ${phaseIndex + 1} Web completion must include the final logical set`);
    const finalWorkBoundary = `Math.max(...(${expression}).map((step, index) => step.isRest ? -1 : index))`;
    assert.equal(vm.runInContext(`countCompletedSeries(${expression}, ${finalWorkBoundary})`, context), expected - 1, `Kegel phase ${phaseIndex + 1} native interruption must exclude the active final set`);
});

// Active web/native sessions reject silent posture or load changes, including
// the quick-action shortcut.
vm.runInContext(`
    AppState.vacuo = { posture: 'deitado', vacDuration: 15, isRunning: true, nativeManaged: false };
    setPosture('empe', 30);
    setVacuumDuration(30);
    triggerQuickAction('vacuo_rapido');
`, context);
assert.equal(vm.runInContext('AppState.vacuo.posture', context), 'deitado', 'active session must keep posture');
assert.equal(vm.runInContext('AppState.vacuo.vacDuration', context), 15, 'active session must keep vacuum duration');

// Ending a partial session through the real UI path is an interruption.
vm.runInContext(`
    AppState.dailyExecution = {
        sessionId: 'test-session-2',
        programId: '2',
        phaseIndex: 1,
        isRunning: true,
        isPaused: false,
        totalSessionElapsed: 30,
        steps: []
    };
    abortDailySession();
`, context);

const history2 = vm.runInContext('CorePersistence.sessionHistory', context);
assert.equal(history2.length, 2, 'abortDailySession should add a record');
assert.equal(history2[1].status, 'interrupted', 'partial session must use interrupted status');
assert.equal(history2[1].interrupted, true, 'real UI stop must persist interrupted=true');

// Test Vacuum Native Stop (handleNativeVacuumState)
vm.runInContext(`
    AppState.vacuo = {
        sessionId: 'test-vacuum-1',
        isRunning: true,
        nativeManaged: true,
        seriesTotal: 3,
        seriesCurrent: 1,
        totalElapsedSec: 45,
        retentionElapsedSec: 0,
        recoveryElapsedSec: 0,
        pausedSeconds: 0
    };
    handleNativeVacuumState({
        status: 'interrupted',
        currentStepIndex: 2,
        session: { sessionId: 'test-vacuum-1', type: 'vacuum' },
        steps: [
            { series: 1, phase: 'inspira', isRest: false },
            { series: 1, phase: 'expira', isRest: false },
            { series: 1, phase: 'vacuo', isRest: false },
            { series: 1, phase: 'descanso', isRest: true }
        ]
    });
`, context);

const history3 = vm.runInContext('CorePersistence.sessionHistory', context);
assert.equal(history3.length, 3, 'handleNativeVacuumState should add a record');
assert.equal(history3[2].status, 'interrupted', 'native stop must use interrupted status');
assert.equal(history3[2].interrupted, true, 'native stop must persist interrupted=true');
assert.equal(history3[2].completedSeries, 0, 'current retention series must not be counted as completed');

// Test restore partial state
vm.runInContext(`
    applyProgressData({ sessionHistory: CorePersistence.sessionHistory,
        vacuo: { sessionId: 'test-vacuum-2', isRunning: true, totalElapsedSec: 10 }
    });
`, context);

const vacuoState = vm.runInContext('AppState.vacuo', context);
assert.equal(vacuoState.sessionId, 'test-vacuum-2', 'applyProgressData should restore vacuo state');
assert.equal(vacuoState.isRunning, false, 'restored vacuum must use the actual paused-player state');
assert.equal(vacuoState.intervalId, null, 'restored vacuum must not retain a timer handle');

// Test idempotency
vm.runInContext(`
    upsertSessionRecord({
        id: 'test-session-2',
        schemaVersion: 1,
        programId: '2',
        phaseIndex: 1,
        date: localDateKey(),
        status: 'cancelled',
        plannedSeries: 1,
        completedSeries: 0,
        retentionSeconds: 30,
        recoverySeconds: 0,
        pausedSeconds: 0,
        interrupted: false,
        feedback: 'comfortable'
    });
`, context);
const history4 = vm.runInContext('CorePersistence.sessionHistory', context);
assert.equal(history4.length, 3, 'upsertSessionRecord should update existing record, not duplicate');
assert.equal(history4[1].feedback, 'comfortable', 'feedback should be updated');
// Test updateSessionFeedback
vm.runInContext(`
    updateSessionFeedback('test-session-2', 'difficult');
`, context);
const history5 = vm.runInContext('CorePersistence.sessionHistory', context);
assert.equal(history5[1].feedback, 'difficult', 'updateSessionFeedback should explicitly update feedback by ID');

// Explicit interrupted semantic remains supported by the production helper.
vm.runInContext(`
    AppState.dailyExecution = {
        sessionId: 'test-session-3',
        programId: '4',
        phaseIndex: 0,
        isRunning: true,
        isPaused: false,
        totalSessionElapsed: 15,
        steps: []
    };
    abortDailySession(true); // true = interrupted
`, context);
const history6 = vm.runInContext('CorePersistence.sessionHistory', context);
assert.equal(history6.length, 4, 'abortDailySession(true) should add a record');
assert.equal(history6[3].interrupted, true, 'record status should be interrupted');
assert.equal(history6[3].status, 'interrupted', 'interrupted session must use the interrupted status');
assert.equal(history6[3].totalElapsedSeconds, 15, 'interrupted daily session must preserve actual elapsed time');

// Session metrics must keep retention, recovery, and pause time separate.
vm.runInContext(`
    AppState.vacuo = {
        sessionId: 'test-vacuum-metrics',
        currentPhase: 'descanso',
        seriesTotal: 3,
        seriesCurrent: 2,
        totalElapsedSec: 90,
        retentionElapsedSec: 15,
        recoveryElapsedSec: 60,
        pausedSeconds: 15,
        nativeManaged: false,
        isRunning: false
    };
    recordVacuumSession('interrupted', true);
`, context);
const history7 = vm.runInContext('CorePersistence.sessionHistory', context);
const metricsRecord = history7.find(record => record.id === 'test-vacuum-metrics');
assert.equal(metricsRecord.status, 'interrupted', 'vacuum interruption must use interrupted status');
assert.equal(metricsRecord.retentionSeconds, 15, 'retention metric must exclude recovery time');
assert.equal(metricsRecord.recoverySeconds, 60, 'recovery metric must be recorded separately');
assert.equal(metricsRecord.totalElapsedSeconds, 90, 'vacuum total time must preserve its independent runtime counter');
assert.equal(metricsRecord.pausedSeconds, 15, 'pause metric must be recorded separately');

// Pausing during retention must leave the breath hold safely in recovery,
// never freeze the apnea timer, and resume only from that recovery phase.
vm.runInContext(`
    let safeExitCalls = 0;
    let pauseCalls = 0;
    let resumeCalls = 0;
    window.AndroidBridge = {
        setKeepScreenOn() {},
        exitRetentionSafely() { safeExitCalls++; },
        pauseWorkoutSession() { pauseCalls++; },
        resumeWorkoutSession() { resumeCalls++; },
        getWorkoutState() { return '{"status":"paused","session":{"type":"vacuum"}}'; },
        startWorkoutSession() { return true; }
    };
    AppState.vacuo = {
        isRunning: true,
        nativeManaged: true,
        currentPhase: 'vacuo',
        timer: 8,
        restDuration: 60,
        seriesCurrent: 1,
        seriesTotal: 3,
        intervalId: 42,
        sessionId: 'safe-exit-vacuum'
    };
    pauseVacuo();
`, context);
assert.equal(vm.runInContext('AppState.vacuo.currentPhase', context), 'descanso', 'retention pause must enter recovery');
assert.equal(vm.runInContext('AppState.vacuo.timer', context), 60, 'recovery must start with its own timer');
assert.equal(vm.runInContext('safeExitCalls', context), 1, 'native retention pause must request safe exit');
assert.equal(vm.runInContext('pauseCalls', context), 0, 'native retention pause must not freeze apnea with generic pause');

vm.runInContext('startVacuo();', context);
assert.equal(vm.runInContext('resumeCalls', context), 1, 'resume after safe exit may resume only recovery');
assert.equal(vm.runInContext('AppState.vacuo.currentPhase', context), 'descanso', 'resume must not return to retention');

vm.runInContext(`
    window.AndroidBridge = {};
    AppState.vacuo = {
        isRunning: true,
        nativeManaged: false,
        currentPhase: 'vacuo',
        timer: 8,
        restDuration: 60,
        intervalId: 43
    };
    pauseVacuo();
`, context);
assert.equal(vm.runInContext('AppState.vacuo.currentPhase', context), 'descanso', 'Web retention pause must enter recovery');
assert.equal(vm.runInContext('AppState.vacuo.isRunning', context), false, 'Web recovery must remain paused until explicit resume');
assert.equal(vm.runInContext('AppState.vacuo.intervalId', context), null, 'Web retention pause must not leave a timer running');

// Daily step count is not the same thing as planned/completed series.
vm.runInContext(`
    AppState.dailyExecution = {
        sessionId: 'test-series-metrics',
        programId: '2',
        phaseIndex: 1,
        currentStepIndex: 2,
        isRunning: true,
        isPaused: false,
        totalSessionElapsed: 30,
        steps: [
            { isRest: false, duration: 10, series: 1 },
            { isRest: true, duration: 10, series: 1 },
            { isRest: false, duration: 10, series: 2 }
        ]
    };
    abortDailySession(true);
`, context);
const history8 = vm.runInContext('CorePersistence.sessionHistory', context);
const seriesRecord = history8.find(record => record.id === 'test-series-metrics');
assert.equal(seriesRecord.plannedSeries, 2, 'planned series must exclude recovery steps');
assert.equal(seriesRecord.completedSeries, 1, 'completed series must count completed work steps only');

// A completed logical set records its retention only; an interruption in the
// middle of a set does not mark that set completed and records elapsed phases.
vm.runInContext(`
    AppState.dailyExecution = {
        sessionId: 'test-daily-vacuum-complete',
        programId: '3',
        phaseIndex: 0,
        totalSessionElapsed: 999,
        steps: [
            { phase: 'inspira', series: 1, duration: 4 },
            { phase: 'vacuo', series: 1, duration: 15 },
            { phase: 'descanso', series: 1, duration: 20 },
            { phase: 'inspira', series: 2, duration: 4 },
            { phase: 'vacuo', series: 2, duration: 15 }
        ]
    };
    finishDailySession();
`, context);
const completedDailyVacuum = vm.runInContext('CorePersistence.sessionHistory.find(record => record.id === "test-daily-vacuum-complete")', context);
assert.equal(completedDailyVacuum.plannedSeries, 2, 'completed daily vacuum must count logical sets');
assert.equal(completedDailyVacuum.completedSeries, 2, 'completed daily vacuum must complete every logical set');
assert.equal(completedDailyVacuum.retentionSeconds, 30, 'completed daily vacuum retention must exclude breathing and recovery');

// The real Web vacuum player must count the final logical series on completion.
vm.runInContext(`
    AppState.vacuo = {
        sessionId: 'test-web-vacuum-complete',
        isRunning: true,
        nativeManaged: false,
        currentPhase: 'descanso',
        timer: 0,
        seriesCurrent: 5,
        seriesTotal: 5,
        totalElapsedSec: 420,
        retentionElapsedSec: 75,
        recoveryElapsedSec: 300,
        pausedSeconds: 0,
        intervalId: null
    };
    advanceVacuoSeries();
`, context);
const completedWebVacuum = vm.runInContext('CorePersistence.sessionHistory.find(record => record.id === "test-web-vacuum-complete")', context);
assert.equal(completedWebVacuum.status, 'completed', 'Web vacuum completion must persist completed status');
assert.equal(completedWebVacuum.plannedSeries, 5, 'Web vacuum completion must preserve planned logical series');
assert.equal(completedWebVacuum.completedSeries, 5, 'Web vacuum completion must count the final logical series');

vm.runInContext(`
    AppState.dailyExecution = {
        sessionId: 'test-daily-vacuum-interrupted',
        programId: '3',
        phaseIndex: 0,
        currentStepIndex: 1,
        stepTimeLeft: 10,
        totalSessionElapsed: 999,
        steps: [
            { phase: 'inspira', series: 1, duration: 4 },
            { phase: 'vacuo', series: 1, duration: 15 },
            { phase: 'descanso', series: 1, duration: 20 },
            { phase: 'inspira', series: 2, duration: 4 },
            { phase: 'vacuo', series: 2, duration: 15 }
        ]
    };
    abortDailySession(true);
`, context);
const interruptedDailyVacuum = vm.runInContext('CorePersistence.sessionHistory.find(record => record.id === "test-daily-vacuum-interrupted")', context);
assert.equal(interruptedDailyVacuum.plannedSeries, 2, 'interrupted daily vacuum must count logical sets');
assert.equal(interruptedDailyVacuum.completedSeries, 0, 'partial logical set must not be completed');
assert.equal(interruptedDailyVacuum.retentionSeconds, 5, 'interrupted retention must include only elapsed vacuum time');

// Native safe-exit advances past the hold step. The explicit accumulated
// retention value must remain authoritative instead of re-counting the full
// duration of the exited step.
const nativeRetentionExit = vm.runInContext(`deriveNativeVacuumMetrics({
    currentStepIndex: 3,
    stepTimeLeft: 20,
    retentionElapsedSeconds: 7,
    steps: [
        { phase: 'inspira', duration: 4 },
        { phase: 'expira', duration: 6 },
        { phase: 'vacuo', duration: 15 },
        { phase: 'descanso', duration: 20 }
    ]
})`, context);
assert.equal(nativeRetentionExit.retentionSeconds, 7, 'native safe exit must preserve only executed retention seconds');

// A safe exit/skip advances to recovery, but the retention's logical series
// must remain incomplete when the later native stop derives metrics.
assert.equal(vm.runInContext(`countCompletedSeries([
    { phase: 'inspira', duration: 4, series: 1 },
    { phase: 'expira', duration: 6, series: 1 },
    { phase: 'vacuo', duration: 15, series: 1 },
    { phase: 'descanso', duration: 20, series: 1 }
], 3, [1])`, context), 0, 'safe-exited retention series must remain incomplete');

vm.runInContext(`
    AppState.vacuo = {
        sessionId: 'native-safe-exit',
        seriesTotal: 1,
        pausedSeconds: 0,
        nativeManaged: true,
        isRunning: true
    };
    handleNativeVacuumState({
        status: 'interrupted',
        currentStepIndex: 3,
        stepTimeLeft: 20,
        retentionElapsedSeconds: 7,
        retentionInterruptedSeries: [1],
        session: { sessionId: 'native-safe-exit', type: 'vacuum' },
        steps: [
            { phase: 'inspira', duration: 4, series: 1 },
            { phase: 'expira', duration: 6, series: 1 },
            { phase: 'vacuo', duration: 15, series: 1 },
            { phase: 'descanso', duration: 20, series: 1 }
        ]
    });
`, context);
const nativeSafeExitRecord = vm.runInContext('CorePersistence.sessionHistory.find(record => record.id === "native-safe-exit")', context);
assert.equal(nativeSafeExitRecord.completedSeries, 0, 'native safe exit must not complete the abandoned logical series');
assert.equal(nativeSafeExitRecord.retentionSeconds, 7, 'native safe exit must retain only executed hold time');

// Web skip during retention must preserve the abandoned logical series when
// the player advances and is later interrupted.
vm.runInContext(`
    AppState.vacuo = {
        sessionId: 'web-safe-exit',
        seriesTotal: 2,
        seriesCurrent: 1,
        currentPhase: 'vacuo',
        isRunning: true,
        nativeManaged: false,
        timer: 10,
        totalElapsedSec: 20,
        retentionElapsedSec: 5,
        recoveryElapsedSec: 0,
        pausedSeconds: 0,
        intervalId: 99
    };
    skipVacuoPhase();
    advanceVacuoSeries();
    recordVacuumSession('interrupted', true);
`, context);
const webSafeExitRecord = vm.runInContext('CorePersistence.sessionHistory.find(record => record.id === "web-safe-exit")', context);
assert.deepEqual(Array.from(vm.runInContext('AppState.vacuo.retentionInterruptedSeries', context)), [1], 'Web safe exit must mark the abandoned retention series');
assert.equal(webSafeExitRecord.completedSeries, 0, 'Web safe exit must not complete the abandoned logical series');
assert.equal(webSafeExitRecord.retentionSeconds, 5, 'Web safe exit must retain only executed hold time');

// Web pause during retention must persist the abandoned logical series before
// resuming in recovery and completing a later series.
vm.runInContext(`
    AppState.vacuo = {
        sessionId: 'web-paused-retention',
        seriesTotal: 2,
        seriesCurrent: 1,
        currentPhase: 'vacuo',
        isRunning: true,
        nativeManaged: false,
        timer: 8,
        restDuration: 60,
        totalElapsedSec: 20,
        retentionElapsedSec: 5,
        recoveryElapsedSec: 0,
        pausedSeconds: 0,
        intervalId: 100
    };
    pauseVacuo();
    startVacuo();
    AppState.vacuo.currentPhase = 'descanso';
    AppState.vacuo.seriesCurrent = 2;
    AppState.vacuo.isRunning = true;
    advanceVacuoSeries();
`, context);
const webPausedRetention = vm.runInContext('CorePersistence.sessionHistory.find(record => record.id === "web-paused-retention")', context);
assert.deepEqual(Array.from(vm.runInContext('AppState.vacuo.retentionInterruptedSeries', context)), [1], 'Web retention pause must mark the abandoned series');
assert.equal(webPausedRetention.completedSeries, 1, 'Web completion after retention pause must exclude the abandoned series');
assert.equal(webPausedRetention.retentionSeconds, 5, 'Web retention pause must preserve only executed hold time');

// Test applyProgressData timer protection (pauses restored sessions)
vm.runInContext(`
    applyProgressData({
        sessionHistory: CorePersistence.sessionHistory,
        vacuo: { sessionId: 'test-vacuum-3', isRunning: true, isPaused: false, totalElapsedSec: 10, nativeManaged: false },
        dailyExecution: { sessionId: 'test-daily-4', isRunning: true, isPaused: false, totalSessionElapsed: 5 }
    });
`, context);

const vacuoRestored = vm.runInContext('AppState.vacuo', context);
assert.equal(vacuoRestored.sessionId, 'test-vacuum-3', 'applyProgressData should restore vacuo state');
assert.equal(vacuoRestored.isPaused, true, 'applyProgressData should pause vacuo to protect timer');

const dailyRestored = vm.runInContext('AppState.dailyExecution', context);
assert.equal(dailyRestored.sessionId, 'test-daily-4', 'applyProgressData should restore dailyExecution state');
assert.equal(dailyRestored.isPaused, true, 'applyProgressData should pause dailyExecution to protect timer');

// Reopening a browser snapshot must discard obsolete ownership/handles,
// preserve executed time, and never fabricate a completed session.
vm.runInContext(`
    applyProgressData({ sessionHistory: CorePersistence.sessionHistory,
        vacuo: { sessionId: 'reopen-partial', currentPhase: 'descanso',
            isRunning: true, nativeManaged: true, intervalId: 987,
            totalElapsedSec: 17, timer: 8 }
    });
    saveState();
`, context);
const partialSnapshot = JSON.parse(storage['coreflow_progress_snapshot_v4']);
assert.equal(partialSnapshot.data.vacuo.isRunning, false);
assert.equal(partialSnapshot.data.vacuo.nativeManaged, false);
assert.equal(partialSnapshot.data.vacuo.intervalId, null);
assert.equal(partialSnapshot.data.vacuo.totalElapsedSec, 17);
assert.equal(partialSnapshot.data.vacuo.timer, 8);
assert.equal(partialSnapshot.data.sessionHistory.length, 12);
context.savedPartial = partialSnapshot.data;
vm.runInContext('applyProgressData(savedPartial)', context);
assert.equal(vm.runInContext('AppState.vacuo.sessionId', context), 'reopen-partial');
assert.equal(vm.runInContext('AppState.vacuo.isRunning', context), false);

// An idle native bridge does not own the session, so the browser snapshot wins.
vm.runInContext(`
    window.AndroidBridge = { getWorkoutState() { return '{"status":"idle"}'; } };
    AppState.vacuo = { sessionId: 'native-owned', nativeManaged: true, isRunning: true };
    applyProgressData(savedPartial);
`, context);
assert.equal(vm.runInContext('AppState.vacuo.sessionId', context), 'reopen-partial');
assert.equal(vm.runInContext('AppState.vacuo.isRunning', context), false);

// A running/paused native bridge still owns the session and suppresses Web restore.
vm.runInContext(`
    window.AndroidBridge = { getWorkoutState() { return '{"status":"running","session":{"type":"vacuum","sessionId":"native-owned"}}'; } };
    AppState.vacuo = { sessionId: 'native-owned', nativeManaged: true, isRunning: true };
    const nativeData = JSON.parse(JSON.stringify(savedPartial));
    nativeData.vacuo.sessionId = 'native-owned';
    applyProgressData(nativeData);
`, context);
assert.equal(vm.runInContext('AppState.vacuo.sessionId', context), 'native-owned');
assert.equal(vm.runInContext('AppState.vacuo.isRunning', context), true);

// A terminal native interrupted snapshot must not erase a matching partial
// Web snapshot during reopen synchronization.
vm.runInContext(`
    let acknowledgeCalls = 0;
    window.AndroidBridge = { acknowledgeWorkoutState() { acknowledgeCalls++; } };
    AppState.vacuo = {
        sessionId: 'reopen-interrupted',
        currentPhase: 'descanso',
        timer: 8,
        totalElapsedSec: 17,
        retentionElapsedSec: 7,
        recoveryElapsedSec: 0,
        isRunning: false,
        nativeManaged: false,
        intervalId: null
    };
    handleNativeVacuumState({
        status: 'interrupted',
        currentStepIndex: 3,
        stepTimeLeft: 8,
        totalSessionElapsed: 17,
        session: { sessionId: 'reopen-interrupted', type: 'vacuum' },
        steps: [
            { phase: 'inspira', duration: 4, series: 1 },
            { phase: 'expira', duration: 6, series: 1 },
            { phase: 'vacuo', duration: 15, series: 1 },
            { phase: 'descanso', duration: 20, series: 1 }
        ]
    });
`, context);
assert.equal(vm.runInContext('AppState.vacuo.sessionId', context), 'reopen-interrupted', 'reopen must keep partial session id');
assert.equal(vm.runInContext('AppState.vacuo.currentPhase', context), 'descanso', 'terminal native state must not reset restored phase');
assert.equal(vm.runInContext('AppState.vacuo.timer', context), 8, 'terminal native state must not reset restored timer');
assert.equal(vm.runInContext('AppState.vacuo.nativeManaged', context), false, 'terminal native state must release ownership');
assert.equal(vm.runInContext('acknowledgeCalls', context), 1, 'terminal native state must be acknowledged once');

// Exercise the real daily Web completion/interruption paths with program 2,
// not only the metric helpers used by the native callback.
vm.runInContext(`
    AppState.dailyExecution = (() => {
        const steps = getProgramSteps('2', 0);
        return { sessionId: 'test-kegel-web-complete', programId: '2', phaseIndex: 0, currentStepIndex: steps.length, totalSessionElapsed: 1, steps };
    })();
    finishDailySession();
`, context);
const kegelWebComplete = vm.runInContext('CorePersistence.sessionHistory.find(record => record.id === "test-kegel-web-complete")', context);
assert.equal(kegelWebComplete.plannedSeries, 3, 'Kegel Web completion must persist logical planned series');
assert.equal(kegelWebComplete.completedSeries, 3, 'Kegel Web completion must include the final logical series');

vm.runInContext(`
    AppState.dailyExecution = (() => {
        const steps = getProgramSteps('2', 0);
        const finalWorkIndex = Math.max(...steps.map((step, index) => step.isRest ? -1 : index));
        return { sessionId: 'test-kegel-native-interrupted', programId: '2', phaseIndex: 0, currentStepIndex: finalWorkIndex, totalSessionElapsed: 1, steps };
    })();
    abortDailySession(true);
`, context);
const kegelNativeInterrupted = vm.runInContext('CorePersistence.sessionHistory.find(record => record.id === "test-kegel-native-interrupted")', context);
assert.equal(kegelNativeInterrupted.plannedSeries, 3, 'Kegel native interruption must preserve logical planned series');
assert.equal(kegelNativeInterrupted.completedSeries, 2, 'Kegel native interruption must exclude the active final series');
assert.equal(kegelNativeInterrupted.interrupted, true, 'Kegel native interruption must persist interrupted=true');

// The native notification stop path must emit interrupted, not canceled.
assert.match(service, /ACTION_STOP -> stopSession\(interrupted = true\)/);
assert.match(service, /persistAndBroadcast\(if \(interrupted\) "interrupted" else "idle"\)/);
assert.match(service, /ACTION_SAFE_EXIT_RETENTION -> exitRetentionSafely\(\)/);
assert.match(service, /retentionElapsedSeconds/);
assert.match(service, /retentionInterruptedSeries/);
assert.match(service, /currentStepIndex\+\+.*stepTimeLeft = steps\[currentStepIndex\]\.duration/s);
assert.match(service, /exitRetentionSafely[\s\S]*persistAndBroadcast\("paused"\)/);

// Every session boundary must cancel local, speech, and Wear signals so an
// already scheduled pattern cannot survive pause/stop or overlap the next one.
vm.runInContext(`
    let cancelHapticsCalls = 0;
    let speechCancelCalls = 0;
    let browserVibrateCancelCalls = 0;
    window.AndroidBridge = { cancelHaptics() { cancelHapticsCalls++; } };
    window.speechSynthesis = { cancel() { speechCancelCalls++; } };
    navigator.vibrate = value => { if (value === 0) browserVibrateCancelCalls++; };
    cancelPendingSignals();
`, context);
assert.equal(vm.runInContext('cancelHapticsCalls', context), 1, 'Web boundary must cancel native haptics');
assert.equal(vm.runInContext('speechCancelCalls', context), 1, 'Web boundary must cancel speech');
assert.equal(vm.runInContext('browserVibrateCancelCalls', context), 1, 'Web boundary must cancel browser vibration');

const mainActivity = fs.readFileSync(path.join(__dirname, '..', 'app/src/main/java/com/example/MainActivity.kt'), 'utf8');
const relay = fs.readFileSync(path.join(__dirname, '..', 'app/src/main/java/com/example/WearHapticsRelay.kt'), 'utf8');
const wearListener = fs.readFileSync(path.join(__dirname, '..', 'wear/src/main/java/com/example/wear/HapticListenerService.kt'), 'utf8');
assert.match(html, /function cancelPendingSignals\(\)/);
assert.match(html, /pauseVacuo\(\)[\s\S]*cancelPendingSignals\(\)/);
assert.match(html, /resetVacuo\([\s\S]*cancelPendingSignals\(\)/);
assert.match(mainActivity, /fun cancelHaptics\(\)/);
assert.match(mainActivity, /cancelHaptics[\s\S]*AdvancedHapticsManager\.cancel\(context\)/);
assert.match(service, /cancelPendingSignals\(\)/);
assert.match(service, /pauseSession\(\)[\s\S]*cancelPendingSignals\(\)/);
assert.match(service, /stopSession\(interrupted: Boolean\)[\s\S]*cancelPendingSignals\(\)/);
assert.match(relay, /fun cancel\(context: Context\)/);
assert.match(relay, /"cancel"/);
assert.match(wearListener, /message\.optString\("type"\) == "cancel"/);
assert.match(wearListener, /(?:vibrator\(\)|vibrator)\.cancel\(\)/);

// A newer Wear pattern must invalidate an older callback delivered later;
// stale generations must be rejected before they can cancel/replay the wave.
assert.match(wearListener, /generation <= preferences\.getLong\(KEY_ACTIVE_GENERATION, 0L\)/);
const deliveredGenerations = [];
let activeGeneration = 0;
let cancelledGeneration = 0;
const deliverWearPattern = generation => {
    if (generation <= cancelledGeneration || generation <= activeGeneration) return;
    activeGeneration = generation;
    deliveredGenerations.push(generation);
};
deliverWearPattern(3);
deliverWearPattern(1);
assert.deepEqual(deliveredGenerations, [3], 'Wear must reject an older pattern delivered after a newer one');

// Programmed vacuum: safe exit may advance past the interrupted retention.
// Neither the elapsed metric nor the completed-series counter may assume the
// entire earlier step ran. The native stop callback must be idempotent by ID.
const beforeProgramAbort = vm.runInContext('CorePersistence.sessionHistory.length', context);
const beforeCompletedIds = vm.runInContext('CorePersistence.completedSessionIds.length', context);
vm.runInContext(`
    const partialSteps = [
        { phase: 'prepara', series: 1, duration: 8 },
        { phase: 'inspira', series: 1, duration: 4 },
        { phase: 'expira', series: 1, duration: 6 },
        { phase: 'vacuo', series: 1, duration: 10 },
        { phase: 'retorno', series: 1, duration: 5 },
        { phase: 'descanso', series: 1, isRest: true, duration: 60 },
        { phase: 'prepara', series: 2, duration: 8 }
    ];
    const partialNativeState = {
        status: 'paused', session: { type: 'daily', sessionId: 'test-program-partial', programId: '3' },
        steps: partialSteps, currentStepIndex: 5, stepTimeLeft: 60,
        totalSessionElapsed: 24, retentionElapsedSeconds: 1, retentionInterruptedSeries: [1]
    };
    AppState.dailyExecution = {
        sessionId: 'test-program-partial', programId: '3', phaseIndex: 0,
        isRunning: true, isPaused: true, steps: partialSteps, currentStepIndex: 5,
        stepTimeLeft: 60, totalSessionElapsed: 24
    };
    window.AndroidBridge = {
        getWorkoutState() { return JSON.stringify(partialNativeState); },
        stopWorkoutSession() {}, acknowledgeWorkoutState() {}
    };
    abortDailySession();
`, context);
const partialRecord = vm.runInContext('CorePersistence.sessionHistory.find(r => r.id === "test-program-partial")', context);
assert.equal(partialRecord.status, 'interrupted');
assert.equal(partialRecord.retentionSeconds, 1, 'program abort must use native executed retention, not planned 10s');
assert.equal(partialRecord.completedSeries, 0, 'interrupted first series must not be credited after return');
assert.equal(vm.runInContext('CorePersistence.completedSessionIds.length', context), beforeCompletedIds, 'abort must not complete a program');
vm.runInContext('window.onNativeWorkoutState({ ...partialNativeState, status: "interrupted" })', context);
assert.equal(vm.runInContext('CorePersistence.sessionHistory.length', context), beforeProgramAbort + 1, 'native stop callback must upsert the same ID');
const recordAfterNativeStop = vm.runInContext('CorePersistence.sessionHistory.find(r => r.id === "test-program-partial")', context);
assert.equal(recordAfterNativeStop.retentionSeconds, 1, 'native callback must not overwrite actual retention with planned time');
assert.equal(recordAfterNativeStop.completedSeries, 0, 'native callback must not credit the interrupted series');

// An unavailable/corrupt native snapshot must not make an aborted session vanish.
vm.runInContext(`
    AppState.dailyExecution = {
        sessionId: 'test-program-fallback', programId: '3', phaseIndex: 0,
        isRunning: true, isPaused: false, steps: partialSteps,
        currentStepIndex: 3, stepTimeLeft: 9, totalSessionElapsed: 19
    };
    window.AndroidBridge.getWorkoutState = () => 'invalid native snapshot';
    abortDailySession();
`, context);
assert.equal(vm.runInContext('CorePersistence.sessionHistory.find(r => r.id === "test-program-fallback")?.status', context), 'interrupted', 'native snapshot failure must fall back to Web progress');

// Replayed native state must not erase answered feedback or attach it to a
// different interrupted session whose feedback was deliberately left empty.
vm.runInContext(`
    updateSessionFeedback('test-program-partial', 'difficult');
    window.onNativeWorkoutState({ ...partialNativeState, status: 'interrupted' });
`, context);
assert.equal(vm.runInContext('CorePersistence.sessionHistory.find(r => r.id === "test-program-partial")?.feedback', context), 'difficult', 'duplicate native callback must preserve answered feedback by ID');
assert.equal(vm.runInContext('CorePersistence.sessionHistory.find(r => r.id === "test-program-fallback")?.feedback', context), null, 'unanswered second session must remain unanswered');
assert.equal(vm.runInContext('CorePersistence.sessionHistory.find(r => r.id === "test-program-fallback")?.totalElapsedSeconds', context), 19, 'stale callback from another ID must not overwrite the current session');
vm.runInContext(`
    AppState.dailyExecution.sessionId = 'test-program-partial';
    window.onNativeWorkoutState({ ...partialNativeState, status: 'interrupted' });
`, context);
assert.equal(vm.runInContext('CorePersistence.sessionHistory.find(r => r.id === "test-program-partial")?.feedback', context), 'difficult', 'replayed native stop must preserve answered feedback');

console.log("session-engine tests passed!");

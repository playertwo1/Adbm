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
    extractFunction('synchronizeProgramProgress'),
    extractFunction('countWorkoutSeries'),
    extractFunction('countCompletedSeries'),
    extractFunction('deriveNativeVacuumMetrics'),
    extractFunction('getVacuumSessionMetrics'),
    extractFunction('finalizeVacuumPause'),
    extractFunction('recordVacuumSession'),
    extractFunction('finishDailySession'),
    extractFunction('abortDailySession'),
    extractFunction('handleNativeVacuumState'),
    extractFunction('resetVacuo'),
    extractFunction('updateSessionFeedback'),
    html.slice(persistenceStart, persistenceEnd)
].join('\n');

const storage = {};
const context = vm.createContext({
    console: { log(msg) { console.log(msg); }, error(msg, err) { console.error("ERROR:", msg, err); } },
    TextEncoder,
    document: {
        getElementById() {
            return { classList: { remove(){}, add(){}, contains(){return false;} }, className: '', innerText: '' };
        }
    },
    window: {},
    localStorage: {
        setItem(key, value) { storage[key] = value; },
        getItem(key) { return storage[key] || null; },
        removeItem(key) { delete storage[key]; },
        clear() { for(let k in storage) delete storage[k]; }
    },
    clearInterval() {},
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
    playTibetanChime() {},
    updateCoreAnimation() {},
    setVacProgress() {},
    highlightPhaseCard() {}
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
assert.deepEqual(snapshot1.data?.dailyExecution?.sessionId, 'test-session-1', 'dailyExecution state must be persisted');

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
assert.equal(metricsRecord.pausedSeconds, 15, 'pause metric must be recorded separately');

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
            { isRest: false, duration: 10 },
            { isRest: true, duration: 10 },
            { isRest: false, duration: 10 }
        ]
    };
    abortDailySession(true);
`, context);
const history8 = vm.runInContext('CorePersistence.sessionHistory', context);
const seriesRecord = history8.find(record => record.id === 'test-series-metrics');
assert.equal(seriesRecord.plannedSeries, 2, 'planned series must exclude recovery steps');
assert.equal(seriesRecord.completedSeries, 1, 'completed series must count completed work steps only');

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
assert.equal(partialSnapshot.data.sessionHistory.length, 6);
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

// The native notification stop path must emit interrupted, not canceled.
assert.match(service, /ACTION_STOP -> stopSession\(interrupted = true\)/);
assert.match(service, /persistAndBroadcast\(if \(interrupted\) "interrupted" else "idle"\)/);

console.log("session-engine tests passed!");

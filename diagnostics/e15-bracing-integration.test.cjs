const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const androidHtml = fs.readFileSync(path.join(root, 'app/src/main/assets/index.html'), 'utf8');
const service = fs.readFileSync(path.join(root, 'app/src/main/java/com/example/WorkoutForegroundService.kt'), 'utf8');
assert.equal(html, androidHtml, 'Android and browser HTML remain byte-identical');

function extractFunction(name) {
    const start = html.indexOf(`function ${name}(`);
    assert(start >= 0, `Função ausente: ${name}`);
    const bodyStart = html.indexOf(') {', start) + 2;
    let depth = 0;
    for (let i = bodyStart; i < html.length; i++) {
        if (html[i] === '{') depth++;
        else if (html[i] === '}' && --depth === 0) return html.slice(start, i + 1);
    }
    throw new Error(`Função incompleta: ${name}`);
}

const context = vm.createContext({});
vm.runInContext([
    'function triggerHaptic() {}',
    'function localDateKey() { return "2026-10-10"; }',
    'function recordBracingPractice() {}',
    'function deriveDailySessionMetrics() { return { retentionSeconds: 0, recoverySeconds: 0, totalElapsedSeconds: 0, pausedSeconds: 0 }; }',
    'function countWorkoutSeries() { return 10; }',
    'function upsertSessionRecord() {}',
    'function localDateKey() { return "2026-10-10"; }',
    'function saveState() { return true; }',
    'function showInlineToast() {}',
    'function renderProgramsList() {}',
    'function showInlineToast() {}',
    'var AppState = { programs: [{ id: "1" }], dailyExecution: {} };',
    extractFunction('getBracingCompletedStepIndexes'),
    extractFunction('recordBracingPartialPractice'),
    extractFunction('saveBracingResumeCheckpoint'),
    extractFunction('skipWorkoutStep')
].join('\n'), context);

context.execution = {
    sessionStartStepIndex: 0,
    currentStepIndex: 4,
    completedStepIndexes: [0],
    skippedStepIndexes: [2],
    steps: [
        { isRest: false, exerciseId: 'BR-01' },
        { isRest: true },
        { isRest: false, exerciseId: 'BR-01' },
        { isRest: false, exerciseId: 'BR-01' },
        { isRest: false, exerciseId: 'BR-01' }
    ]
};
const completed = JSON.parse(vm.runInContext('JSON.stringify(getBracingCompletedStepIndexes(execution, false))', context));
assert.deepEqual(completed, [0, 3]);

const nativeHandlerStart = html.indexOf('window.onNativeWorkoutState = function(rawState)');
const nativeHandlerEnd = html.indexOf('\n        function handleNativeVacuumState', nativeHandlerStart);
assert(nativeHandlerStart >= 0 && nativeHandlerEnd > nativeHandlerStart);
const nativeHandler = html.slice(nativeHandlerStart, nativeHandlerEnd);
assert(nativeHandler.includes('getBracingSteps('), 'native state recovery must restore JS exercise metadata from the canonical Bracing catalog');
assert(nativeHandler.includes('bracingSplitRequested'), 'expected split stop must not be recorded as a canceled session');
assert(service.includes('ACTION_PAUSE') && service.includes('ACTION_STOP'), 'split reuses existing native pause/stop actions');
assert(!service.includes('bracingResume'), 'Bracing split resume must not add a parallel native protocol');
assert(html.includes('saveBracingSplitAndExit()'), 'paused workout offers one-tap split-session save');
assert(html.includes('program.bracingResume = resume'), 'split-session resume state is additive and versioned');
assert(html.includes('bracingDailyPractice?.[localDateKey()]'), 'a second Bracing volume on the same day is blocked after completion or split cancellation');
assert(html.includes("SESSION_VOLUME_STATUSES = new Set([null, 'complete', 'reduced'])"), 'session history stores an explicit Bracing volume outcome');
assert(html.includes("volumeStatus === 'reduced' ? 'volume reduzido/parcial'"), 'daily history labels reduced Bracing volume honestly');
assert(html.includes('savedResume.skippedStepIndexes'), 'native state recovery restores skipped Bracing repetitions from the saved checkpoint');
assert(extractFunction('abortDailySession').includes('recordBracingPartialPractice'), 'aborting after work records a reduced practice day and occupies today’s Bracing volume');
assert(extractFunction('skipWorkoutStep').includes('saveBracingResumeCheckpoint'), 'skipping a repetition persists enough state for process recovery');

context.AppState.programs[0].bracingResume = null;
context.AppState.programs[0].sessionsToday = 0;
context.AppState.dailyExecution = {
    programId: '1', phaseIndex: 0, sessionId: 'bracing-session', sessionDateKey: '2026-10-10',
    sessionStartStepIndex: 0, currentStepIndex: 4, stepTimeLeft: 3,
    skippedStepIndexes: [2], completedStepIndexes: [],
    steps: [{ isRest: false, exerciseId: 'BR-01' }, { isRest: true }, { isRest: false, exerciseId: 'BR-01' }, { isRest: false, exerciseId: 'BR-01' }, { isRest: false, exerciseId: 'BR-01', duration: 4 }]
};
context.recordedPractices = [];
context.recordBracingPractice = (...args) => context.recordedPractices.push(args);
context.saveState = () => true;
vm.runInContext('saveBracingResumeCheckpoint(5)', context);
assert.deepEqual(Array.from(context.AppState.programs[0].bracingResume.skippedStepIndexes), [2]);
assert.deepEqual(Array.from(context.AppState.programs[0].bracingResume.completedStepIndexes), [0, 3]);
assert.equal(vm.runInContext('recordBracingPartialPractice(AppState.dailyExecution, AppState.programs[0])', context), 2);
assert.equal(context.AppState.programs[0].sessionsToday, 1, 'an aborted/partial practice blocks a second Bracing volume that day');
assert.equal(context.recordedPractices.length, 1);
context.saveState = () => false;
vm.runInContext('skipWorkoutStep()', context);
assert.deepEqual(Array.from(context.AppState.dailyExecution.skippedStepIndexes), [2], 'a failed checkpoint save prevents the native/web player from skipping a repetition');
assert.equal(context.AppState.dailyExecution.currentStepIndex, 4);

console.log('E15 CP2/CP5 split-session and native integration passed');

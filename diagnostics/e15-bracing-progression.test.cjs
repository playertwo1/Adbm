const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
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
    'function localDateKey() { return "2026-10-15"; }',
    extractFunction('migrateBracingProgram'),
    extractFunction('getBracingPracticeDays'),
    extractFunction('recordBracingPractice'),
    extractFunction('recordBracingWeekReviewFailure'),
    extractFunction('canAdvanceBracingWeek'),
    extractFunction('applyBracingWeekReview')
].join('\n'), context);

const legacy = {
    id: '1', currentPhaseIndex: 2, dailyTarget: 2, sessionsToday: 1, daysCompletedInPhase: 3,
    reminderTimes: ['09:00', '15:00'], phases: [{ completed: true }],
    sessionHistory: [{ id: 'keep-me', date: '2026-10-09' }]
};
const migrated = vm.runInContext('migrateBracingProgram(program)', Object.assign(context, { program: legacy }));
assert.equal(migrated.id, '1');
assert.equal(migrated.dailyTarget, 1);
assert.equal(migrated.sessionsToday, 1);
assert.equal(migrated.daysCompletedInPhase, 3);
assert.equal(migrated.bracingLegacyPracticeCountByPhase[2], 3);
assert.deepEqual(JSON.parse(JSON.stringify(migrated.bracingPracticeDateKeys[2])), []);
assert.equal(migrated.sessionHistory[0].id, 'keep-me');
assert.equal(vm.runInContext('migrateBracingProgram(program).daysCompletedInPhase', context), 3, 'migration must be idempotent');
const legacyFive = { id: '1', currentPhaseIndex: 0, dailyTarget: 2, sessionsToday: 0, daysCompletedInPhase: 5, phases: Array.from({ length: 8 }, () => ({})) };
vm.runInContext('migrateBracingProgram(program)', Object.assign(context, { program: legacyFive }));
assert.equal(vm.runInContext('canAdvanceBracingWeek(program, answers)', Object.assign(context, { program: legacyFive, answers: [true, true, true, true, true] })), false, 'legacy day counts without dated complete-volume evidence cannot satisfy the review');

const program = { id: '1', currentPhaseIndex: 0, daysCompletedInPhase: 0, phases: Array.from({ length: 8 }, () => ({ completed: false })) };
const fresh = { id: '1', currentPhaseIndex: 0, daysCompletedInPhase: 0, phases: Array.from({ length: 8 }, () => ({ completed: false })) };
vm.runInContext('migrateBracingProgram(program)', Object.assign(context, { program: fresh }));
for (const date of ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08']) {
    vm.runInContext(`recordBracingPractice(program, 0, '${date}', false)`, Object.assign(context, { program: fresh }));
}
assert.equal(vm.runInContext('getBracingPracticeDays(program, 0)', Object.assign(context, { program: fresh })), 4);
vm.runInContext("recordBracingPractice(program, 0, '2026-10-08', true)", Object.assign(context, { program: fresh }));
assert.equal(vm.runInContext('getBracingPracticeDays(program, 0)', Object.assign(context, { program: fresh })), 4, 'same local date is counted once');
vm.runInContext("recordBracingPractice(program, 0, '2026-10-09', false)", Object.assign(context, { program: fresh }));

const allTrue = [true, true, true, true, true];
assert.equal(vm.runInContext('canAdvanceBracingWeek(program, answers)', Object.assign(context, { program: fresh, answers: allTrue })), false, 'partial volume cannot be overridden by a positive self-review');
for (const date of ['2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14']) {
    vm.runInContext(`recordBracingPractice(program, 0, '${date}', true, 12)`, Object.assign(context, { program: fresh }));
}
assert.equal(vm.runInContext('canAdvanceBracingWeek(program, answers)', Object.assign(context, { program: fresh, answers: allTrue })), true, 'five later complete practice days allow a repeat after reduced-volume days');
assert.equal(vm.runInContext('canAdvanceBracingWeek(program, answers)', Object.assign(context, { program: fresh, answers: [true, true, true, true, false] })), false);
assert.equal(vm.runInContext('applyBracingWeekReview(program, answers, false)', Object.assign(context, { program: fresh, answers: allTrue })), false, 'confirmation is required');
vm.runInContext('recordBracingWeekReviewFailure(program, answers)', Object.assign(context, { program: fresh, answers: [true, true, true, true, false] }));
assert.equal(vm.runInContext('canAdvanceBracingWeek(program, answers)', Object.assign(context, { program: fresh, answers: allTrue })), false, 'a failed review requires another practice day before retry');
vm.runInContext("recordBracingPractice(program, 0, '2026-10-16', true, 12)", Object.assign(context, { program: fresh }));
assert.equal(vm.runInContext('canAdvanceBracingWeek(program, answers)', Object.assign(context, { program: fresh, answers: allTrue })), true);
assert.equal(vm.runInContext('applyBracingWeekReview(program, answers, true)', Object.assign(context, { program: fresh, answers: allTrue })), true);
assert.equal(fresh.currentPhaseIndex, 1);
assert.equal(fresh.phases[0].completed, true);
assert.equal(vm.runInContext('applyBracingWeekReview(program, answers, true)', Object.assign(context, { program: fresh, answers: allTrue })), false, 'same phase and date cannot advance twice');

console.log('E15 CP4 migration, practice dates, and progression passed');

const submitContext = vm.createContext({
    AppState: { programs: [{ id: '1', currentPhaseIndex: 0, daysCompletedInPhase: 5, sessionsToday: 0, phases: [{}, {}, {}, {}, {}, {}, {}, {}], bracingPracticeDateKeys: [['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05'], [], [], [], [], [], [], []], bracingLegacyPracticeCountByPhase: Array(8).fill(0), bracingDailyPractice: { '2026-10-01': { volumeComplete: true }, '2026-10-02': { volumeComplete: true }, '2026-10-03': { volumeComplete: true }, '2026-10-04': { volumeComplete: true }, '2026-10-05': { volumeComplete: true } } }] },
    document: { getElementById(id) { return id === 'bracingWeekReviewModal' ? { remove() { submitContext.modalRemoved = true; } } : { checked: true }; } },
    saveState() { return false; }, renderProgramsList() {}, showInlineToast() {}, modalRemoved: false
});
vm.runInContext([
    'function localDateKey() { return "2026-10-10"; }',
    extractFunction('getBracingPracticeDays'),
    extractFunction('canAdvanceBracingWeek'),
    extractFunction('applyBracingWeekReview'),
    extractFunction('recordBracingWeekReviewFailure'),
    extractFunction('submitBracingWeekReview')
].join('\n'), submitContext);
assert.equal(vm.runInContext('submitBracingWeekReview()', submitContext), false);
assert.equal(submitContext.AppState.programs[0].currentPhaseIndex, 0, 'failed persistence must roll back the in-memory phase advance');
assert.equal(submitContext.AppState.programs[0].phases[0].completed, undefined);
assert.equal(submitContext.modalRemoved, false, 'failed save leaves the review available to retry');
console.log('E15 CP4 failed-save rollback passed');

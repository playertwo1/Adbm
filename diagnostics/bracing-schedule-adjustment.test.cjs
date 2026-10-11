const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(require('node:path').join(__dirname, '../index.html'), 'utf8');
function fn(name) {
    const start = html.indexOf(`function ${name}(`);
    assert(start >= 0);
    const body = html.indexOf(') {', start) + 2;
    let depth = 0;
    for (let i = body; i < html.length; i++) {
        if (html[i] === '{') depth++;
        if (html[i] === '}' && --depth === 0) return html.slice(start, i + 1);
    }
    throw Error(name);
}
const elements = new Map();
const context = vm.createContext({
    document: {
        getElementById: id => elements.get(id),
        createElement: () => ({ remove() {} }),
        body: { appendChild: node => elements.set(node.id, node) }
    },
    showInlineToast: message => { context.toast = message; },
    getProgramSchedule: () => ({ targetDays: 7 }),
    previewProgramProgressAdjustment() {},
    localDateKey: () => '2026-10-11'
});
vm.runInContext(['migrateBracingProgram', 'getBracingPracticeDays', 'getConfiguredWeeklyTargetDays',
    'applyProgramProgressAdjustment', 'synchronizeProgramProgress', 'openProgramProgressAdjustment',
    'recordBracingPractice', 'canAdvanceBracingWeek', 'applyBracingWeekReview', 'confirmProgramProgressAdjustment'].map(fn).join('\n'), context);
context.program = {
    id: '1', title: 'Bracing', dailyTarget: 1, sessionsToday: 1, currentPhaseIndex: 0,
    daysCompletedInPhase: 3, phases: Array.from({length: 8}, () => ({weeklyTargetDays: 5})),
    sessionHistory: [{id: 'preserve'}]
};
context.AppState = {programs: [context.program], dailyExecution: {}};
vm.runInContext("openProgramProgressAdjustment('1')", context);
assert(elements.has('programProgressAdjustment'), 'Bracing must open the manual week/day adjustment');
vm.runInContext('migrateBracingProgram(program)', context);
assert.equal(context.program.dailyTarget, 2);
assert(context.program.phases.every(p => p.weeklyTargetDays === 7));
vm.runInContext("recordBracingPractice(program, 0, '2026-10-10', true, 18)", context);
const evidence = JSON.stringify(context.program.bracingDailyPractice);
vm.runInContext('applyProgramProgressAdjustment(program, 0, 2, 1); migrateBracingProgram(program); synchronizeProgramProgress(program)', context);
assert.equal(context.program.daysCompletedInPhase, 1, 'manual day survives migration and render');
assert.equal(JSON.stringify(context.program.bracingDailyPractice), evidence, 'adjustment preserves actual practice evidence');
vm.runInContext("recordBracingPractice(program, 0, '2026-10-11', true, 18)", context);
assert.equal(context.program.daysCompletedInPhase, 1, 'first daily session must not advance the day');
vm.runInContext("recordBracingPractice(program, 0, '2026-10-11', true, 18, 'second')", context);
assert.equal(context.program.daysCompletedInPhase, 2, 'new practice advances from the manually selected day');
vm.runInContext('applyProgramProgressAdjustment(program, 3, 7, 2); migrateBracingProgram(program); synchronizeProgramProgress(program)', context);
assert.equal(context.program.currentPhaseIndex, 3);
assert.equal(context.program.currentDayInWeek, 7);
assert.equal(context.program.sessionsToday, 2);
assert.equal(context.program.sessionHistory[0].id, 'preserve');
context.program = JSON.parse(JSON.stringify(context.program));
vm.runInContext('migrateBracingProgram(program); synchronizeProgramProgress(program)', context);
assert.equal(context.program.currentDayInWeek, 7, 'serialized adjustment remains stable');
const current = context.AppState.programs[0];
current.bracingResume = {sessionId: 'keep-resume'};
const before = JSON.stringify(current);
elements.set('adjustProgramWeek', {value: 2});
elements.set('adjustProgramDay', {value: 6});
elements.set('adjustProgramSessions', {value: 0});
context.saveState = () => false;
vm.runInContext("confirmProgramProgressAdjustment('1')", context);
assert.equal(JSON.stringify(context.AppState.programs[0]), before, 'failed save must preserve position and resume');
context.program = {id: '1', currentPhaseIndex: 0, daysCompletedInPhase: 0,
    phases: Array.from({length: 8}, () => ({weeklyTargetDays: 7}))};
vm.runInContext("recordBracingPractice(program, 0, '2026-10-08', false, 2, 'split', false)", context);
assert.equal(context.program.daysCompletedInPhase, 0, 'split pause does not finish a daily session');
vm.runInContext("recordBracingPractice(program, 0, '2026-10-08', true, 18, 'split'); recordBracingPractice(program, 0, '2026-10-08', true, 18, 'split')", context);
assert.equal(context.program.daysCompletedInPhase, 0, 'resuming/replaying the same session still counts only once');
assert.equal(context.program.bracingDailyPractice['2026-10-08'].completedRepetitions, 18);
for (let day = 1; day <= 7; day++) {
    context.dateKey = `2026-10-0${day}`;
    vm.runInContext("recordBracingPractice(program, 0, dateKey, true, 18, 'first-' + dateKey)", context);
}
assert.equal(vm.runInContext('canAdvanceBracingWeek(program, [true,true,true,true,true])', context), false,
    'one complete session per day is insufficient for the new daily volume');
for (let day = 1; day <= 7; day++) {
    context.dateKey = `2026-10-0${day}`;
    vm.runInContext("recordBracingPractice(program, 0, dateKey, true, 18, 'second-' + dateKey)", context);
}
assert.equal(vm.runInContext('canAdvanceBracingWeek(program, [true,true,true,true,true])', context), true);
const oldDays = context.program.daysCompletedInPhase;
vm.runInContext("recordBracingPractice(program, 0, dateKey, true, 18, 'second-' + dateKey)", context);
assert.equal(context.program.daysCompletedInPhase, oldDays, 'replayed completion cannot duplicate a day');
context.program.sessionsToday = 2;
assert.equal(vm.runInContext('applyBracingWeekReview(program, [true,true,true,true,true], true)', context), true);
assert.equal(context.program.sessionsToday, 2, 'advancing the week cannot reset the daily limit and permit a third session');
vm.runInContext("applyProgramProgressAdjustment(program, 1, 1, 1); recordBracingPractice(program, 1, dateKey, false, 2, 'reduced-new-phase')", context);
assert.equal(context.program.bracingDailyPractice[context.dateKey].volumeComplete, false, 'another phase cannot inherit full volume');
assert.equal(context.program.bracingDailyPractice[context.dateKey].byPhase[0].volumeComplete, true, 'previous phase evidence remains available');
console.log('Bracing: manual week/day, 2 daily sessions, 7 days, preserved evidence and subsequent progress PASS');

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const assetHtml = fs.readFileSync(path.join(root, 'app/src/main/assets/index.html'), 'utf8');
assert.equal(html, assetHtml, 'browser and Android HTML must remain byte-identical');
assert(!html.includes('const bracingWeeks = ['), 'the Bracing week matrix must not be duplicated in the player');
assert(!html.includes('BRACING_PHASES'), 'the legacy Bracing guide matrix must be removed');

function extractBlock(start, label, openingIndex = html.indexOf('{', start)) {
    assert(start >= 0, `${label} must exist`);
    let depth = 0;
    for (let i = openingIndex; i < html.length; i++) {
        if (html[i] === '{') depth++;
        else if (html[i] === '}' && --depth === 0) return html.slice(start, i + 1);
    }
    throw new Error(`${label} is incomplete`);
}

function extractConst(name) {
    const start = html.indexOf(`const ${name} =`);
    assert(start >= 0, `${name} must exist`);
    const end = html.indexOf(';\r\n', start);
    assert(end > start, `${name} must terminate with a semicolon`);
    return html.slice(start, end + 1);
}

function extractFunction(name) {
    const start = html.indexOf(`function ${name}(`);
    assert(start >= 0, `${name} must exist`);
    const signatureEnd = html.indexOf(') {', start);
    assert(signatureEnd >= 0, `${name} must have a function body`);
    return extractBlock(start, name, signatureEnd + 2);
}

const context = vm.createContext({});
const appStateStart = html.indexOf('        const AppState = {');
const appStateEnd = html.indexOf('        const CORE_DATA_VERSION', appStateStart);
const appStateContext = vm.createContext({});
vm.runInContext('var AppState;\n' + html.slice(appStateStart, appStateEnd).replace('const AppState =', 'AppState ='), appStateContext);
const bracingProgram = JSON.parse(vm.runInContext('JSON.stringify(AppState.programs.find(program => program.id === "1"))', appStateContext));
assert.equal(bracingProgram.dailyTarget, 1, 'Bracing prescribes one daily session');
assert.equal(bracingProgram.phases.length, 8);
assert(bracingProgram.phases.every(phase => phase.weeklyTargetDays === 5));

vm.runInContext([
    extractConst('BRACING_EXERCISES'),
    extractConst('BRACING_WEEKS'),
    extractFunction('getBracingSteps'),
    extractFunction('getProgramSteps')
].join('\n'), context);

const exercises = JSON.parse(vm.runInContext('JSON.stringify(BRACING_EXERCISES)', context));
const weeks = JSON.parse(vm.runInContext('JSON.stringify(BRACING_WEEKS)', context));
assert.deepEqual(Object.keys(exercises).sort(), ['BR-01', 'BR-02', 'BR-03', 'BR-04', 'BR-05', 'BR-06', 'BR-07', 'BR-08']);
assert.equal(weeks.length, 8);

const expected = [
    [['BR-01', 2, 6, 0, 5], ['BR-02', 1, 6, 0, 5]],
    [['BR-01', 2, 6, 0, 8], ['BR-02', 2, 6, 0, 8]],
    [['BR-01', 1, 5, 0, 8], ['BR-03', 2, 6, 1, 3], ['BR-02', 1, 6, 0, 10]],
    [['BR-03', 2, 8, 1, 3], ['BR-04', 2, 10, 0, null], ['BR-02', 1, 8, 0, 10]],
    [['BR-05', 2, 8, 0, null], ['BR-06', 2, 5, 1, 8], ['BR-01', 1, 6, 0, 10]],
    [['BR-07', 2, 6, 1, 5], ['BR-05', 2, 8, 0, null], ['BR-04', 2, 12, 0, null]],
    [['BR-08', 2, 6, 1, 4], ['BR-07', 2, 7, 1, 6], ['BR-06', 2, 6, 1, 10]],
    [['BR-02', 1, 5, 0, 10], ['BR-05', 1, 8, 0, null], ['BR-07', 1, 6, 1, 6], ['BR-08', 1, 6, 1, 5], ['BR-06', 1, 4, 1, 8]]
];

weeks.forEach((week, index) => {
    assert.equal(week.week, index + 1);
    assert.equal(week.weeklyTargetDays, 5);
    assert.equal(week.laps, index === 7 ? 2 : 1);
    assert.deepEqual(week.prescriptions.map(p => [p.exerciseId, p.sets, p.repsPerSide, p.sideMode === 'alternating' ? 1 : 0, p.holdSeconds]), expected[index]);
});

const catalogSteps = vm.runInContext('getBracingSteps(7)', context);
const legacySessionSteps = vm.runInContext("getProgramSteps('1', 7, 2)", context);
assert.deepEqual(JSON.parse(JSON.stringify(legacySessionSteps)), JSON.parse(JSON.stringify(catalogSteps)), 'legacy session number must not rotate or duplicate volume');
assert.equal(catalogSteps.filter(step => !step.isRest && step.exerciseId).length, 90, 'week 8 contains 90 working repetitions across two laps');
assert.equal(catalogSteps.filter(step => step.badge === 'PREPARAÇÃO').length, 1);
assert.equal(catalogSteps.filter(step => step.badge === 'QUALIDADE').length, 1);
assert.equal(vm.runInContext('getBracingSteps(0).filter(step => !step.isRest && step.exerciseId).length', context), 18, 'week 1 is 18 individual contractions');
const week3 = vm.runInContext('getBracingSteps(2)', context);
const week3March = week3.filter(step => step.exerciseId === 'BR-03');
assert.equal(week3March.length, 24, 'week 3 contains 12 BR-03 reps per side');
assert.equal(week3March.filter(step => step.side === 'right').length, 12);
assert.equal(week3March.filter(step => step.side === 'left').length, 12);
for (const movementId of ['BR-04', 'BR-05']) {
    const movementSteps = vm.runInContext(`BRACING_WEEKS.flatMap(week => week.prescriptions.filter(item => item.exerciseId === '${movementId}'))`, context);
    assert(movementSteps.length > 0);
    assert(movementSteps.every(step => step.movementSeconds === 4 && step.holdSeconds === null), `${movementId} uses four-second continuous movements without an isometric hold`);
}
for (const index of [0, 2, 3, 4, 5, 6, 7]) {
    const steps = vm.runInContext(`getBracingSteps(${index})`, context);
    const workSteps = steps.filter(step => !step.isRest && step.exerciseId);
    const finalWorkIndex = steps.lastIndexOf(workSteps[workSteps.length - 1]);
    assert.equal(steps.slice(finalWorkIndex + 1).filter(step => step.isRest).length, 1, `week ${index + 1} has only the final quality check after the last work repetition`);
}
const lapRestIndex = catalogSteps.findIndex(step => step.duration === 50 && step.isRest === true);
assert(lapRestIndex > 0);
assert.equal(catalogSteps.slice(lapRestIndex + 1).find(step => !step.isRest && step.exerciseId).lapIndex, 2);
assert.equal(catalogSteps.slice(0, lapRestIndex).reverse().find(step => !step.isRest && step.exerciseId).lapIndex, 1);
assert.notEqual(catalogSteps[lapRestIndex - 1]?.duration, 30, 'week 8 lap break must not stack an exercise transition before the 50s rest');

for (const invalidWeek of [-1, 8, 1.5, '2', null]) {
    assert.throws(() => vm.runInContext(`getBracingSteps(${JSON.stringify(invalidWeek)})`, context), /Semana de Bracing inválida/);
}

console.log('E15 CP1 catalog and week matrix passed');

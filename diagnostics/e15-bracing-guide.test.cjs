const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert.equal(html, fs.readFileSync(path.join(root, 'app/src/main/assets/index.html'), 'utf8'));
assert(!html.includes('BRACING_PHASES'), 'legacy guide matrix must not be duplicated beside the canonical catalog');

function extractConst(name) {
    const start = html.indexOf(`const ${name} =`);
    assert(start >= 0, `Constante ausente: ${name}`);
    const end = html.indexOf(';\r\n', start);
    assert(end > start, `Constante incompleta: ${name}`);
    return html.slice(start, end + 1);
}

function extractFunction(name) {
    const start = html.indexOf(`function ${name}(`);
    assert(start >= 0, `Função ausente: ${name}`);
    const bodyStart = html.indexOf(') {', start) + 2;
    let depth = 0;
    for (let index = bodyStart; index < html.length; index += 1) {
        if (html[index] === '{') depth += 1;
        else if (html[index] === '}' && --depth === 0) return html.slice(start, index + 1);
    }
    throw new Error(`Função incompleta: ${name}`);
}

const guide = extractFunction('renderBracingProgram');
assert(guide.includes('BRACING_WEEKS.map'), 'guide must render the canonical week matrix');
assert(guide.includes('week.prescriptions.map'), 'guide exercises must come from the canonical prescriptions');
assert(guide.includes('exercise.imageSequence[0]') && guide.includes('alt="${escapeHtml(exercise.name)}"'), 'guide images need a descriptive text alternative');
assert(guide.includes('exercise.stageLabels.map'), 'guide must render all four text stages from the catalog');
assert(guide.includes('current ?'), 'only the active week can offer a start button');

const context = vm.createContext({
    AppState: { programs: [{ id: '1', phases: Array.from({ length: 8 }, (_, index) => ({ title: `Semana ${index + 1}` })) }] }
});
vm.runInContext([
    extractConst('BRACING_EXERCISES'),
    extractConst('BRACING_WEEKS'),
    extractFunction('getBracingSteps'),
    extractFunction('getProgramSteps'),
    extractFunction('getProgramExerciseDetails')
].join('\n'), context);
const details = JSON.parse(vm.runInContext('JSON.stringify(getProgramExerciseDetails("1", 2))', context));
assert(details.some(group => group.steps.some(step => /Marcha sentada com bracing/.test(step.title))), 'week details must use the player sequence for BR-03');
assert.equal(details.reduce((sum, group) => sum + group.durationSeconds, 0), vm.runInContext('getBracingSteps(2).reduce((sum, step) => sum + step.duration, 0)', context));
assert.equal(Object.values(JSON.parse(vm.runInContext('JSON.stringify(BRACING_EXERCISES)', context))).length, 8);

console.log('E15 CP3 canonical guide, details, stage labels, and accessibility text passed; new image sequence remains pending user visual approval.');

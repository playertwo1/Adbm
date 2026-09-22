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
    let depth = 0;
    let opened = false;
    for (let index = source.indexOf('{', start); index < source.length; index += 1) {
        if (source[index] === '{') { depth += 1; opened = true; }
        if (source[index] === '}' && opened && --depth === 0) return source.slice(start, index + 1);
    }
    throw new Error(`Função incompleta: ${name}`);
}

const sources = files.map(file => fs.readFileSync(file, 'utf8'));
assert.equal(sources[0], sources[1], 'HTML raiz e asset embarcado precisam permanecer idênticos');
const source = sources[0];

// Agenda não pode inventar horários/frequência quando o programa não os possui.
assert.match(source, /const reminderTimes = Array\.isArray\(prog\.reminderTimes\)/);
assert.match(source, /Horário não configurado/);
assert.match(source, /const targetDays = Number\.isFinite\(Number\(activePhase\.weeklyTargetDays\)\)/);
assert.match(source, /frequência não configurada/);
assert.doesNotMatch(source, /const reminderTimes = prog\.reminderTimes \|\| \['09:00', '16:00'\]/);
assert.doesNotMatch(source, /const targetDays = activePhase\.weeklyTargetDays \|\| 7/);

// A revisão pendente do Vácuo deve sobreviver ao reload sem avançar fase.
const merge = extractFunction(source, 'mergeLoadedPrograms');
const synchronize = extractFunction(source, 'synchronizeProgramProgress');
const context = vm.createContext({
    AppState: {
        programs: [{
            id: '3', currentPhaseIndex: 0, daysCompletedInPhase: 5, sessionsToday: 0,
            phases: [
                { weeklyTargetDays: 5, completed: false },
                { weeklyTargetDays: 5, completed: false }
            ]
        }]
    }
});
vm.runInContext(`${synchronize}; ${merge}`, context);
vm.runInContext(`mergeLoadedPrograms([{
    id: '3', currentPhaseIndex: 0, daysCompletedInPhase: 5, sessionsToday: 0,
    progressionReview: { phaseIndex: 0, status: 'pending', reason: 'weekly-target-reached' },
    phases: [
        { weeklyTargetDays: 5, completed: false, reviewPending: true, reviewPendingAt: '2026-09-21', reviewReason: 'weekly-target-reached' },
        { weeklyTargetDays: 5, completed: false }
    ]
}], '2026-09-22', false)`, context);
assert.equal(vm.runInContext('AppState.programs[0].progressionReview.status', context), 'pending');
assert.equal(vm.runInContext('AppState.programs[0].phases[0].reviewPending', context), true);
assert.equal(vm.runInContext('AppState.programs[0].currentPhaseIndex', context), 0);

console.log('E07 agenda/progress regressions: real agenda, missing-data honesty, and pending review persistence verified.');

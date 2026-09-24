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

const exercisesMatch = source.match(/const STRETCH_EXERCISES = (\[[\s\S]*?\]);/);
assert(exercisesMatch, 'catálogo de alongamentos deve existir');
const exercises = vm.runInNewContext(exercisesMatch[1]);
assert.equal(exercises.length, 4, 'catálogo deve conter os quatro exercícios documentados');

const visibleInstructions = [
    'Cruze o tornozelo sobre o joelho oposto',
    'Gire o tronco segurando o encosto da cadeira',
    'Entrelace as mãos atrás das costas',
    'Incline a cabeça lateralmente com ajuda suave da mão'
];
for (const exercise of exercises) {
    const cardStart = source.indexOf(`id="stretch-card-${exercise.id}"`);
    assert(cardStart >= 0, `card ${exercise.id} deve existir sem depender de recomendação`);
    const nextCard = source.indexOf(`id="stretch-card-${exercise.id + 1}"`, cardStart + 1);
    const block = source.slice(cardStart, nextCard < 0 ? source.indexOf('<!-- Card informativo', cardStart) : nextCard);
    assert(block.includes(`data-category="${exercise.category}"`), `categoria do card ${exercise.id} deve corresponder ao catálogo`);
    assert(block.includes(`onclick="toggleStretchTimer(${exercise.id})"`), `botão do card ${exercise.id} deve iniciar o exercício exibido`);
    assert(block.includes(exercise.name), `card ${exercise.id} deve exibir o nome canônico`);
    assert(block.includes(visibleInstructions[exercise.id - 1]), `card ${exercise.id} deve exibir instrução do exercício`);
}

let hour = 0;
let startedId = null;
const elements = new Map();
function getElement(id) {
    if (!elements.has(id)) elements.set(id, { innerText: '', className: '' });
    return elements.get(id);
}
const context = vm.createContext({
    Date: class { getHours() { return hour; } },
    document: { getElementById: getElement },
    toggleStretchTimer(id) { startedId = id; }
});
vm.runInContext([
    source.match(/function getRecommendedStretch\(\) \{[\s\S]*?\n        \}/)[0],
    source.match(/function updateTimeOfDayStretchRecommendation\(\) \{[\s\S]*?\n        \}/)[0],
    source.match(/function startRecommendedStretch\(\) \{[\s\S]*?\n        \}/)[0]
].join('\n'), context);

const expectedByHour = [[0, 4], [4, 4], [5, 3], [11, 3], [12, 1], [14, 1], [15, 2], [17, 2], [18, 4], [23, 4]];
for (const [testHour, expectedId] of expectedByHour) {
    hour = testHour;
    const recommendation = context.getRecommendedStretch();
    assert.equal(recommendation.id, expectedId, `regra de recomendação incorreta na hora ${testHour}`);
    const exercise = exercises.find(item => item.id === recommendation.id);
    assert(recommendation.desc.includes(exercise.name.split(' & ')[0].split(' na ')[0]), `prévia deve corresponder ao exercício escolhido na hora ${testHour}`);
    context.updateTimeOfDayStretchRecommendation();
    assert.equal(getElement('stretch-recom-period-label').innerText, recommendation.periodLabel);
    assert.equal(getElement('stretch-recom-desc').innerText, recommendation.desc);
    context.startRecommendedStretch();
    assert.equal(startedId, expectedId, `botão Alongar deve iniciar o exercício recomendado na hora ${testHour}`);
}

console.log('E10 stretch catalog/recommendation: PASS');

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

function extractFunction(name) {
    const start = source.search(new RegExp(`function\\s+${name}\\s*\\(`));
    assert(start >= 0, `função ausente: ${name}`);
    const bodyStart = source.indexOf('{', start);
    let depth = 0;
    for (let i = bodyStart; i < source.length; i += 1) {
        if (source[i] === '{') depth += 1;
        if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1);
    }
    throw new Error(`bloco incompleto: ${name}`);
}

function makeElement(id, category = null) {
    const classes = new Set();
    return {
        id,
        className: '',
        innerText: '',
        getAttribute(name) { return name === 'data-category' ? category : null; },
        classList: {
            add(...names) { names.forEach(name => classes.add(name)); },
            remove(...names) { names.forEach(name => classes.delete(name)); },
            contains(name) { return classes.has(name); }
        }
    };
}

const elements = new Map();
for (const [id, category] of [[1, 'gluteos'], [2, 'coluna'], [3, 'peitoral'], [4, 'cervical']]) {
    elements.set(`stretch-card-${id}`, makeElement(`stretch-card-${id}`, category));
}
for (const tag of ['all', 'coluna', 'gluteos', 'peitoral', 'cervical']) {
    elements.set(`tag-stretch-${tag}`, makeElement(`tag-stretch-${tag}`));
}
elements.set('stretch-filter-status', makeElement('stretch-filter-status'));

const context = vm.createContext({
    AppState: { pausas: {} },
    document: { getElementById(id) { return elements.get(id) ?? null; } },
    triggerHaptic() {}
});
vm.runInContext(extractFunction('setStretchIntentFilter'), context);

for (const [filter, expectedId] of [['gluteos', 1], ['coluna', 2], ['peitoral', 3], ['cervical', 4]]) {
    context.setStretchIntentFilter(filter);
    for (let id = 1; id <= 4; id += 1) {
        const card = elements.get(`stretch-card-${id}`);
        const isSelected = id === expectedId;
        assert.equal(card.classList.contains('hidden'), !isSelected, `filtro ${filter} deve ${isSelected ? 'mostrar' : 'ocultar'} o card ${id}`);
        assert.equal(card.classList.contains('border-emerald-500/60'), isSelected, `destaque visual do card ${id} deve acompanhar o filtro ${filter}`);
    }
    assert.equal(elements.get(`tag-stretch-${filter}`).className.includes('bg-emerald-500/20'), true, `tag ${filter} deve receber o estado visual ativo`);
    assert.equal(elements.get('stretch-filter-status').innerText, `Foco em: ${filter}`, `status deve indicar a região ${filter}`);
}

context.setStretchIntentFilter('all');
for (let id = 1; id <= 4; id += 1) {
    const card = elements.get(`stretch-card-${id}`);
    assert.equal(card.classList.contains('hidden'), false, `Todos deve restaurar o card ${id}`);
    assert.equal(card.classList.contains('border-emerald-500/60'), true, `Todos deve restaurar o destaque do card ${id}`);
}
assert.match(elements.get('tag-stretch-all').className, /bg-emerald-500\/20/, 'tag Todos deve receber o estado visual ativo');
assert.equal(elements.get('stretch-filter-status').innerText, 'Exibindo todos (4)', 'status deve confirmar a lista completa');

console.log('E10 stretch filter: PASS');

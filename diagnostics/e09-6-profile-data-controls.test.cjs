const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

// E09.6–E09.8 — Perfil: ausência de mockup, backup real e exclusão explícita.
const root = path.join(__dirname, '..');
const htmlPaths = [
    path.join(root, 'index.html'),
    path.join(root, 'app', 'src', 'main', 'assets', 'index.html')
];
const buffers = htmlPaths.map(file => fs.readFileSync(file));
assert.equal(Buffer.compare(buffers[0], buffers[1]), 0, 'HTML raiz e asset precisam ser idênticos');
const source = buffers[0].toString('utf8');

assert(fs.existsSync(path.join(root, 'app', 'src', 'main', 'assets', 'scripts', 'encryption.js')), 'o runtime Android precisa embarcar scripts/encryption.js');
assert.match(source, /Dados e segurança/);
assert.match(source, /exportProgressCopy\(\)/);
assert.match(source, /readProgressImportFile\(this\)/);
assert.match(source, /progressImportPreview/);
assert.match(source, /Cancelar/);
assert.match(source, /function deleteProgressData\(\)/);
assert.match(source, /clearProgressSnapshot/);
assert.doesNotMatch(source, /bateria\s*[:=]\s*\d+|battery\s*[:=]\s*\d+|sensor\s*[:=]\s*['\"]connected/i);

function extractFunction(name) {
    const start = source.search(new RegExp(`(?:async\\s+)?function\\s+${name}\\s*\\(`));
    assert(start >= 0, `função ausente: ${name}`);
    const bodyStart = source.indexOf('{', start);
    let depth = 0;
    for (let i = bodyStart; i < source.length; i += 1) {
        if (source[i] === '{') depth += 1;
        if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1);
    }
    throw new Error(`bloco incompleto: ${name}`);
}

const elements = new Map();
const storage = new Map([
    ['coreflow_progress_snapshot_v4', '{"old":true}'],
    ['coreflow_progress_snapshot_v4_backup', '{"backup":true}'],
    ['coreflow_before_import', '{"archive":true}']
]);
const bridgeCalls = [];
const makeElement = id => ({
    id,
    textContent: '',
    innerText: '',
    value: '',
    classList: { add() {}, remove() {}, toggle() {} },
    setAttribute() {},
    getAttribute() { return null; },
    remove() { elements.delete(id); }
});
const context = vm.createContext({
    console: { log() {}, warn() {}, error() {} },
    Date,
    document: {
        body: { appendChild() {} },
        getElementById(id) { if (!elements.has(id)) elements.set(id, makeElement(id)); return elements.get(id); },
        createElement: makeElement
    },
    localStorage: {
        getItem(key) { return storage.get(key) ?? null; },
        setItem(key, value) { storage.set(key, String(value)); },
        removeItem(key) { storage.delete(key); },
        clear() { storage.clear(); }
    },
    window: { AndroidBridge: { clearProgressSnapshot() { bridgeCalls.push('clearProgressSnapshot'); return true; } } },
    AppState: { activeTab: 'perfil', onboardingCompleted: true },
    CorePersistence: { status: 'ready', revision: 4, lastSavedAt: '2026-09-24T12:00:00.000Z', completedSessionIds: ['s1'], sessionHistory: [{ id: 's1' }] },
    closeProgressProtection() {},
    renderAfterProgressLoad() {},
    setPersistenceStatus() {},
    openProgressProtection() {},
    alert() {},
    confirm() { return true; }
});
vm.runInContext([extractFunction('deleteProgressData')].join('\n'), context);
vm.runInContext('deleteProgressData();', context);
assert.equal(storage.has('coreflow_progress_snapshot_v4'), false, 'snapshot atual deve ser removido');
assert.equal(storage.has('coreflow_progress_snapshot_v4_backup'), false, 'backup anterior deve ser removido');
assert.equal(bridgeCalls.length, 1, 'bridge nativa deve ser chamada uma vez');
assert.equal(context.CorePersistence.status, 'ready', 'estado deve voltar a pronto após exclusão');

console.log('E09 profile data controls: PASS');

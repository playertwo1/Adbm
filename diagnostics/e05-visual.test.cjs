const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const embedded = fs.readFileSync(path.join(root, 'app', 'src', 'main', 'assets', 'index.html'), 'utf8');

assert.equal(embedded, source, 'HTML raiz e asset embarcado precisam permanecer idênticos');
assert.match(source, /--cf-color-canvas:\s*#000000/i);
assert.match(source, /--cf-color-surface:\s*#0A0A0B/i);
assert.match(source, /--cf-color-surface-raised:\s*#111214/i);
assert.match(source, /--cf-color-text-primary:/i);
assert.match(source, /--cf-color-menta:/i);
assert.match(source, /--cf-color-cyan:/i);
assert.match(source, /--cf-color-alert:/i);
assert.match(source, /\.cf-btn/);
assert.match(source, /\.cf-icon/);
assert.match(source, /\.cf-card/);
assert.match(source, /\.cf-selector/);
assert.match(source, /\.cf-toggle/);
assert.match(source, /\.cf-modal/);
assert.match(source, /\.cf-notice/);
assert.match(source, /\.cf-empty/);
assert.match(source, /\.cf-error/);
for (const id of ['hoje', 'programas', 'pausas', 'dashboard', 'perfil']) {
    assert.match(source, new RegExp(`id="nav-btn-${id}"`), `navegação ausente: ${id}`);
    assert.match(source, new RegExp(`id="tab-${id}"`), `tela ausente: ${id}`);
}
for (const shortcut of ['Vácuo', 'Discreto', 'Mindfulness']) {
    assert.match(source, new RegExp(shortcut), `atalho ausente: ${shortcut}`);
}
assert.match(source, /min-height:\s*48px/);
assert.match(source, /env\(safe-area-inset-top\)/);
assert.match(source, /env\(safe-area-inset-bottom\)/);
assert.match(source, /prefers-reduced-motion/);
assert.match(source, /function closeTopmostOverlay\(/);
assert.match(source, /function handleBackNavigation\(/);
assert.match(source, /addEventListener\(['"]popstate['"]/);
assert.match(source, /aria-current="page"/);
assert.match(source, /aria-live="polite"/);
assert.doesNotMatch(source, /https?:\/\//, 'interface E05 não deve depender de URL remota');
assert.match(source, /:focus-visible/);
assert.match(source, /aria-checked="true"/);
assert.match(source, /aria-pressed=/);
assert.match(source, /:disabled|disabled/);
assert.match(source, /requestCancelDailySession/);
assert.match(source, /pauseVacuo/);
assert.doesNotMatch(source, /(?:1440px|3120px)/, 'interface não pode ser fixada em pixels físicos de referência');
assert.match(source, /viewport-fit=cover/);
assert.match(source, /overflow-x-auto/);
assert.match(source, /role="status"/);
assert.match(source, /role="switch"/);

assert.equal((source.match(/id="nav-btn-[^"]+"/g) || []).length, 5, 'navegação principal precisa ter exatamente cinco destinos');
assert.equal(fs.existsSync(path.join(root, 'docs', 'roadmap', 'inventario-controles-e05.md')), true, 'inventário E05 ausente');
const inventory = fs.readFileSync(path.join(root, 'docs', 'roadmap', 'inventario-controles-e05.md'), 'utf8');
for (const column of ['Tela', 'ID/controle', 'Evento', 'Estado alterado', 'Persistência', 'Falha/cancelamento', 'Teste/evidência']) {
    assert.ok(inventory.includes(column), `coluna ausente no inventário: ${column}`);
}

console.log('E05 visual regressions: PASS');

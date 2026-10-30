const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

// Regressão 2026-10-30 (critique): Vácuo, Pausas e Dashboard ainda tinham card dentro de card.
// Itens internos agrupam por divisor/filete lateral; a caixa fica só no cartão externo.
const root = path.join(__dirname, '..');
const nested = JSON.parse(fs.readFileSync(path.join(__dirname, 'e24-flat-panels-vacuo-pausas-dashboard.json'), 'utf8'));
for (const file of [path.join(root, 'index.html'), path.join(root, 'app', 'src', 'main', 'assets', 'index.html')]) {
    const html = fs.readFileSync(file, 'utf8');
    const name = path.relative(root, file);
    for (const [boxed, flat, label] of nested) {
        assert.equal(html.includes(boxed), false, `${name}: ${label} ainda é card aninhado (${boxed})`);
        assert.ok(html.includes(flat), `${name}: ${label} deve usar o agrupamento plano (${flat})`);
    }
}
console.log('e24-flat-panels-vacuo-pausas-dashboard: ok');

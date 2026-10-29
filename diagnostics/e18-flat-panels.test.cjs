const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

// Regressão 2026-10-29 (critique): painéis de agrupamento viravam "card dentro de card".
// O segundo nível não pode ter borda+fundo+cantos próprios; o agrupamento fica por espaçamento e divisor.
const root = path.join(__dirname, '..');
const nested = [
    ['bg-slate-900/60 border border-emerald-500/30 rounded-2xl p-3.5 space-y-3.5', 1, 'painel de alongamento (Corpo)'],
    ['bg-slate-900/60 border border-cyan-500/30 rounded-2xl p-3.5 space-y-3.5', 1, 'painel de alongamento (Mente)'],
    ['bg-slate-900/60 border border-slate-700/60 rounded-2xl p-3.5 space-y-2', 2, 'dicas Corpo/Mente'],
    ['bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 space-y-2', 2, 'resumo dentro do painel'],
    ['bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3', 2, 'detalhe expansível'],
    ['bg-slate-900/90 rounded-2xl p-4 border border-slate-800 space-y-3.5', 1, 'Trilha da Semana'],
    ['rounded-xl border border-slate-700/60 bg-slate-900/60 p-2', 4, 'mini-cards do Vácuo'],
    ['bg-slate-800/90 border border-slate-700/80 rounded-2xl md:rounded-3xl shadow-xl overflow-hidden transition-all duration-300', 2, 'blocos colapsáveis Corpo/Mente (contêiner externo)'],
];
for (const file of [path.join(root, 'index.html'), path.join(root, 'app', 'src', 'main', 'assets', 'index.html')]) {
    const html = fs.readFileSync(file, 'utf8');
    const name = path.relative(root, file);
    for (const [cls, , label] of nested) {
        assert.equal(html.includes(`class="${cls}"`) || html.includes(` ${cls}"`) || html.includes(`"${cls} `), false,
            `${name}: ${label} ainda é card aninhado (${cls})`);
    }
    assert.match(html, /border-t border-slate-800 pt-4 space-y-3\.5/, `${name}: Trilha da Semana deve usar divisor`);
}
console.log('e18-flat-panels: ok');

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

// Regressão 2026-10-30 (critique): CTA âmbar→laranja de Programas e gradiente violeta/ciano do atalho
// "Pausa de Resposta" viram cor sólida. O hover do CTA também tinha "to-orange-600" sem prefixo.
const root = path.join(__dirname, '..');
const pairs = [
    ["bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 to-orange-600 text-slate-950", "bg-amber-500 hover:bg-amber-600 text-slate-950"],
    ["bg-gradient-to-br from-violet-950/90 via-slate-900 to-cyan-950/70 border border-violet-500/40 rounded-2xl md:rounded-3xl p-4 shadow-xl shadow-violet-950/20", "bg-slate-900 border border-violet-500/40 rounded-2xl md:rounded-3xl p-4"]
];
for (const file of [path.join(root, 'index.html'), path.join(root, 'app', 'src', 'main', 'assets', 'index.html')]) {
    const html = fs.readFileSync(file, 'utf8');
    const name = path.relative(root, file);
    for (const [old, flat] of pairs) {
        assert.equal(html.includes(old), false, `${name}: gradiente ainda presente (${old})`);
        assert.ok(html.includes(flat), `${name}: falta a versão sólida (${flat})`);
    }
}
console.log('e25-solid-cta-and-pause-card: ok');

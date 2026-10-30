const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

// `ch` (e não rem/em) porque a WebView com textZoom escala a fonte, mas não rem/em nas medidas de layout.
// Regressão 2026-10-29 (aba Vácuo a 200%): sub-rótulos do seletor de postura sobrepostos, tile "4. Descanso"
// vazando e texto do anel minúsculo na expiração/retenção (o bloco de texto era escalado a 0.3/0.35).
const root = path.join(__dirname, '..');
for (const file of [path.join(root, 'index.html'), path.join(root, 'app', 'src', 'main', 'assets', 'index.html')]) {
    const html = fs.readFileSync(file, 'utf8');
    const name = path.relative(root, file);

    const start = html.indexOf('<!-- Posture selector buttons (Chips) -->');
    const posture = html.slice(start, html.indexOf('</div>', html.indexOf('id="posture-empe"')));
    assert.match(posture, /<div class="grid grid-cols-\[repeat\(auto-fit,minmax\(11ch,1fr\)\)\] gap-2">/, `${name}: seletor de postura deve empilhar com texto ampliado`);
    assert.equal((posture.match(/<span class="text-\[10px\] text-slate-400 font-mono \[overflow-wrap:anywhere\]">/g) || []).length, 3, `${name}: sub-rótulos devem poder quebrar`);

    assert.match(html, /<div class="w-full grid grid-cols-\[repeat\(auto-fit,minmax\(7ch,1fr\)\)\] gap-1 mt-4 z-10/, `${name}: tiles de fase devem quebrar linha com texto ampliado`);

    // Expiração fica em 0.65: a 0.75 o texto toca o traço do anel com fonte a 200%.
    for (const [cls, min] of [['breathe-contract', 0.6], ['breathe-vacuum', 0.7]]) {
        const scale = Number(html.match(new RegExp(String.raw`\.${cls} \{\s*transform: scale\(([\d.]+)\)`))[1]);
        assert.ok(scale >= min, `${name}: .${cls} não pode reduzir o texto do anel abaixo de ${min} (atual ${scale})`);
    }
}
console.log('e21-vacuo-large-text: ok');

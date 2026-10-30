const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

// Regressão 2026-10-29 (aba Discreto a 200%): rótulos do seletor de modos colidiam, o texto do anel do Kegel
// Resistência vazava do anel (caixa fixa em rem, texto ampliado) e os botões encostavam na borda.
// Medidas em `ch` porque a WebView com textZoom escala a fonte, mas não rem/em nas medidas de layout.
const root = path.join(__dirname, '..');
for (const file of [path.join(root, 'index.html'), path.join(root, 'app', 'src', 'main', 'assets', 'index.html')]) {
    const html = fs.readFileSync(file, 'utf8');
    const name = path.relative(root, file);

    assert.match(html, /<div class="flex flex-wrap gap-1 bg-slate-800 p-1 rounded-2xl border border-slate-700">/, `${name}: seletor de modos deve quebrar linha`);
    assert.equal((html.match(/desk-sub-btn flex-1 basis-\[11ch\] min-w-0 py-2/g) || []).length, 5, `${name}: 3 botões no HTML e 2 classes no JS precisam da base em ch`);

    assert.match(html, /<div class="relative w-\[26ch\] max-w-full aspect-square mx-auto my-3 flex items-center justify-center">\s*<svg class="w-full h-full transform -rotate-90" viewBox="0 0 200 200">/, `${name}: anel do Kegel Resistência deve crescer com o texto`);

    assert.match(html, /<div class="flex flex-wrap items-center justify-center gap-3 mt-4">\s*<button onclick="resetKegelRes\(\)"/, `${name}: botões do Kegel Resistência devem quebrar linha`);
    assert.match(html, /<div class="flex flex-wrap items-center justify-center gap-2 mt-4">\s*<button onclick="resetKegelFast\(\)"/, `${name}: botões do Kegel Velocidade devem quebrar linha`);

    assert.match(html, /<div class="relative w-\[26ch\] max-w-full aspect-square mx-auto my-3 flex items-center justify-center">\s*<!-- Outer Glow Ring/, `${name}: medidor do Bracing deve crescer com o texto`);
    assert.match(html, /<div id="fastMetronomeOrb" class="w-\[18ch\] max-w-full aspect-square rounded-full/, `${name}: orbe do Kegel Velocidade deve crescer com o texto`);
    assert.match(html, /<div class="flex flex-wrap items-center justify-center gap-3 mt-4">\s*<button onclick="resetBracingTimer\(\)"/, `${name}: botões do Bracing devem quebrar linha`);
    assert.match(html, /<div class="flex flex-wrap justify-between gap-x-2 text-\[10px\] text-slate-400 mb-1">\s*<span>0% \(Solto\)/, `${name}: legenda do slider deve quebrar linha`);
}
console.log('e23-discreto-large-text: ok');

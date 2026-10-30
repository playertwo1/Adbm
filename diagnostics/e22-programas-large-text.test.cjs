const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

// Regressão 2026-10-29 (aba Programas a 200%): os ícones do cabeçalho do card ocupavam a direita e o título
// e a descrição ficavam numa coluna de uma palavra por linha; cabeçalho da aba e hero também espremiam.
// Mínimas em `ch` porque a WebView com textZoom escala a fonte, mas não rem/em nas medidas de layout.
const root = path.join(__dirname, '..');
for (const file of [path.join(root, 'index.html'), path.join(root, 'app', 'src', 'main', 'assets', 'index.html')]) {
    const html = fs.readFileSync(file, 'utf8');
    const name = path.relative(root, file);

    assert.match(html, /<div class="flex flex-wrap items-center justify-between gap-2">\s*<div>\s*<h2 class="text-xl font-heading font-extrabold text-white tracking-tight">Programas de Evolução/, `${name}: cabeçalho da aba deve quebrar linha`);
    assert.match(html, /<span class="text-xs bg-indigo-500\/15 border border-indigo-500\/30 text-indigo-400 font-bold px-2\.5 py-1 rounded-full flex items-center gap-1 whitespace-nowrap">/, `${name}: selo "2x ao dia" não pode quebrar`);

    assert.match(html, /<div class="relative z-10 space-y-3">\s*<div class="flex flex-wrap items-center justify-between gap-2">/, `${name}: linha do hero deve quebrar linha`);
    assert.match(html, /id="heroSessionsTodayBadge" class="[^"]*whitespace-nowrap/, `${name}: selo de sessões do hero não pode quebrar`);

    assert.match(html, /<div class="flex flex-wrap items-start justify-between gap-y-2">\s*<div class="flex-1 basis-\[14ch\] min-w-0 pr-3 cursor-pointer" onclick="openProgramDetail/, `${name}: cabeçalho do card de programa deve quebrar os ícones para baixo`);
    assert.match(html, /<div class="ml-auto flex items-center gap-1\.5 flex-shrink-0">\s*\$\{guideBtnHtml\}/, `${name}: grupo de ícones do card deve alinhar à direita ao quebrar`);
}
console.log('e22-programas-large-text: ok');

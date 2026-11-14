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

    assert.match(html, /<div class="cf-fluxo-page-heading flex flex-wrap items-end justify-between gap-3">\s*<div>\s*<p class="cf-fluxo-kicker">Seu percurso<\/p>\s*<h2 id="programs-heading">Programas<\/h2>/, `${name}: cabeçalho da aba deve quebrar linha`);
    const hero = html.slice(html.indexOf('id="todayWorkoutHeroBanner"'), html.indexOf('id="programsListContainer"'));
    assert.doesNotMatch(hero, /2x ao dia/i, `${name}: a meta não deve ser fixa nem ficar em uma pílula decorativa`);
    assert.match(html, /cf-program-schedule/, `${name}: a tela deve exibir a agenda real do programa`);

    assert.match(html, /<div class="relative z-10 space-y-3">\s*<div class="flex flex-wrap items-center justify-between gap-2">/, `${name}: linha do hero deve quebrar linha`);
    assert.match(html, /id="heroSessionsTodayBadge" class="cf-program-hero-status/, `${name}: sessões do hero devem usar o rótulo tipográfico sem cápsula`);

    assert.match(html, /<div class="flex flex-wrap items-start justify-between gap-y-2">\s*<div class="flex-1 basis-\[22ch\] min-w-0 pr-3 cursor-pointer" onclick="openProgramDetail/, `${name}: cabeçalho do card de programa deve quebrar os ícones para baixo`);
    assert.match(html, /<div class="ml-auto flex items-center gap-1\.5 flex-shrink-0">\s*\$\{guideBtnHtml\}/, `${name}: grupo de ícones do card deve alinhar à direita ao quebrar`);
}
console.log('e22-programas-large-text: ok');

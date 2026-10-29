const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

// Regressão 2026-10-29 (fonte do sistema em 200%): rótulos da navegação sobrepostos, cabeçalho espremido,
// valores quebrados e rótulos de dias cortados. Nada pode depender de largura fixa para texto ampliado.
const root = path.join(__dirname, '..');
for (const file of [path.join(root, 'index.html'), path.join(root, 'app', 'src', 'main', 'assets', 'index.html')]) {
    const html = fs.readFileSync(file, 'utf8');
    const name = path.relative(root, file);

    const navLabel = html.match(/\.cf-nav-label \{[^}]*\}/)[0];
    assert.match(navLabel, /text-overflow: ellipsis/, `${name}: rótulo da navegação deve truncar em vez de sobrepor`);
    assert.match(html, /\.cf-bottom-nav \.nav-item \{[^}]*min-width: 0/, `${name}: botões da navegação precisam poder encolher`);

    const header = html.slice(html.indexOf('<header class="sticky top-0'), html.indexOf('<button id="headerMoreBtn"'));
    assert.match(header, /<div class="flex min-w-0 items-center gap-3">/, `${name}: bloco da marca deve poder encolher`);
    assert.match(header, /<span class="truncate">Saúde, Vácuo & Postura<\/span>/, `${name}: subtítulo deve truncar`);
    assert.match(header, /<header class="[^"]*flex-wrap[^"]*"/, `${name}: cabeçalho deve quebrar linha com texto ampliado`);
    assert.match(header, /<div class="ml-auto flex flex-shrink-0 items-center gap-2">/, `${name}: grupo de ações do cabeçalho não pode encolher`);

    assert.match(html, /whitespace-nowrap">\$\{currentTotal\} min<\/span>/, `${name}: "N min" não pode quebrar`);
    assert.doesNotMatch(html.match(/<p id="profileNameValue"[^>]*>/)[0], /truncate/, `${name}: nome do perfil não pode ser cortado`);
    assert.equal((html.match(/<div class="flex flex-wrap items-center gap-2">\s*<h3 class="text-base font-bold text-white tracking-tight">/g) || []).length, 2,
        `${name}: título e selo de Corpo/Mente devem quebrar linha`);

    assert.match(html, /<div class="flex flex-wrap items-center justify-between gap-3">\s*<div class="min-w-0">\s*<h2[^>]*>Sua evolução/, `${name}: título e seletor de período da Evolução devem quebrar linha`);

    const days = html.slice(html.indexOf('<legend class="text-[11px] font-bold uppercase tracking-wide text-slate-400">Dias</legend>'));
    assert.match(days.slice(0, 400), /<div class="mt-2 flex flex-wrap gap-1">/, `${name}: dias do trabalho devem quebrar linha`);
    assert.equal((days.slice(0, 3000).match(/grow basis-\[2\.4rem\]/g) || []).length, 7, `${name}: cada dia precisa de base em rem`);
}
console.log('e20-large-text: ok');

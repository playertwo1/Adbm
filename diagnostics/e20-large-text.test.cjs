const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

// Regressão 2026-10-29 (fonte do sistema em 200%): rótulos da navegação sobrepostos, cabeçalho espremido,
// valores quebrados e rótulos de dias cortados. Nada pode depender de largura fixa para texto ampliado.
const root = path.join(__dirname, '..');
for (const file of [path.join(root, 'index.html'), path.join(root, 'app', 'src', 'main', 'assets', 'index.html')]) {
    const html = fs.readFileSync(file, 'utf8');
    const name = path.relative(root, file);

    assert.match(html, /\.cf-nav-destination \{[^}]*min-width: 0/, `${name}: destinos da gaveta devem caber com texto ampliado`);

    const header = html.match(/<header class="cf-app-shell-header[^>]*">([\s\S]*?)<\/header>/)?.[1] || '';
    assert.match(header, /<h1>CoreFlow<\/h1>/, `${name}: a marca deve continuar legível no cabeçalho compacto`);
    assert.match(header, /<button id="core-persistence-status"[^>]*aria-label="Status de persistência local"/, `${name}: o status de salvamento deve permanecer acessível`);
    assert.doesNotMatch(header.replace(/<button id="core-persistence-status"[\s\S]*?<\/button>/, ''), /button|headerMore|cf-streak-trigger/, `${name}: o cabeçalho não deve mostrar menu ou ações adicionais`);

    assert.match(html, /whitespace-nowrap">\$\{currentTotal\} min<\/span>/, `${name}: "N min" não pode quebrar`);
    assert.doesNotMatch(html.match(/<p id="profileNameValue"[^>]*>/)[0], /truncate/, `${name}: nome do perfil não pode ser cortado`);
    assert.equal((html.match(/<div class="flex flex-wrap items-center gap-2">\s*<h3 class="text-base font-bold text-white tracking-tight">/g) || []).length, 2,
        `${name}: título e selo de Corpo/Mente devem quebrar linha`);

    assert.match(html, /<div class="cf-fluxo-page-heading flex flex-wrap items-center justify-between gap-3">[\s\S]{0,700}<h2 id="evolution-heading">Evolução<\/h2>[\s\S]{0,700}id="evolutionPeriodSelect"/, `${name}: título e seletor de período da Evolução devem quebrar linha`);

    const days = html.slice(html.indexOf('<legend class="text-[11px] font-bold uppercase tracking-wide text-slate-400">Dias</legend>'));
    assert.match(days.slice(0, 400), /<div class="mt-2 flex flex-wrap gap-1">/, `${name}: dias do trabalho devem quebrar linha`);
    assert.equal((days.slice(0, 3000).match(/grow basis-\[2\.4rem\]/g) || []).length, 7, `${name}: cada dia precisa de base em rem`);
}
console.log('e20-large-text: ok');

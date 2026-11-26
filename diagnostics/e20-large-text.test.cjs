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
    const extraControls = header.replace(/<button id="(?:mainNavigationButton|core-persistence-status)"[\s\S]*?<\/button>/g, '');
    assert.doesNotMatch(extraControls, /button|headerMore|cf-streak-trigger/, `${name}: o cabeçalho deve limitar-se à alça e ao status de salvamento`);

    assert.match(html, /whitespace-nowrap">\$\{currentTotal\} min<\/span>/, `${name}: "N min" não pode quebrar`);
    assert.doesNotMatch(html.match(/<p id="profileNameValue"[^>]*>/)[0], /truncate/, `${name}: nome do perfil não pode ser cortado`);
    for (const category of ['corpo', 'mente']) {
        assert.match(html, new RegExp(`<button id="${category}-section-trigger"[^>]*aria-controls="${category}-content"[^>]*aria-expanded="false"`),
            `${name}: as duas entradas de Pausas devem ser botões recolhidos e rotulados`);
        assert.match(html, new RegExp(`<div id="${category}-content"[^>]*class="hidden `),
            `${name}: a prática só deve aparecer ao abrir sua categoria`);
    }
    assert.match(html, /id="mente-content"[\s\S]*?<details class="cf-pause-response-details"[\s\S]*?cf-response-break/,
        `${name}: a Pausa de Resposta deve ficar dentro de Mente`);
    assert.match(html, /\.cf-pause-sos\s*\{[^}]*flex-wrap:\s*wrap/, `${name}: cartões SOS devem empilhar conteúdo e ação com fonte ampliada`);
    assert.equal((html.match(/<div class="cf-pause-sos /g) || []).length, 2);

    assert.match(html, /<div class="cf-fluxo-page-heading flex flex-wrap items-center justify-between gap-3">[\s\S]{0,700}<h2 id="evolution-heading">Evolução<\/h2>[\s\S]{0,700}id="evolutionPeriodSelect"/, `${name}: título e seletor de período da Evolução devem quebrar linha`);

    const days = html.slice(html.indexOf('<legend class="text-[11px] font-bold uppercase tracking-wide text-slate-400">Dias</legend>'));
    assert.match(days.slice(0, 400), /<div class="mt-2 flex flex-wrap gap-1">/, `${name}: dias do trabalho devem quebrar linha`);
    assert.equal((days.slice(0, 3000).match(/grow basis-\[2\.4rem\]/g) || []).length, 7, `${name}: cada dia precisa de base em rem`);
}
console.log('e20-large-text: ok');

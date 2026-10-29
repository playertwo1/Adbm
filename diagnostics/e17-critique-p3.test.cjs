const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

// Regressão 2026-10-29 (critique P2/P3): ações rápidas sem emoji e sem chip cortado, CTAs sem
// gradiente multicolorido, texto de desenvolvimento removido do modal e selo de volume reduzido curto.
const root = path.join(__dirname, '..');
const between = (html, start, end) => {
    const from = html.indexOf(start);
    assert.notEqual(from, -1, `trecho ausente: ${start}`);
    return html.slice(from, html.indexOf(end, from));
};
for (const file of [path.join(root, 'index.html'), path.join(root, 'app', 'src', 'main', 'assets', 'index.html')]) {
    const html = fs.readFileSync(file, 'utf8');
    const name = path.relative(root, file);

    const quick = between(html, 'Ações Rápidas Imediatas', '<section id="tab-hoje"');
    assert.doesNotMatch(quick, /[\u{1F300}-\u{1FAFF}☀-➿]/u, `${name}: ações rápidas não devem usar emoji como ícone`);
    assert.match(quick, /fa-solid fa-calendar-days/, `${name}: ícone de Meus Programas`);
    assert.doesNotMatch(quick, /overflow-x-auto/, `${name}: chips não devem ficar cortados em rolagem horizontal`);
    assert.match(quick, /flex-wrap/, `${name}: chips devem quebrar linha`);

    const hero = between(html, '<div id="todayWorkoutHeroBanner"', '<div id="programsListContainer"');
    assert.doesNotMatch(hero, /bg-gradient/, `${name}: card de treino recomendado sem gradiente`);

    const secure = html.match(/<button[^>]*exportProgressSecure\(\)[^>]*>/)[0];
    assert.doesNotMatch(secure, /bg-gradient/, `${name}: backup criptografado sem gradiente roxo`);

    assert.doesNotMatch(html, /Em um app de produção/, `${name}: texto de desenvolvimento no modal Editar Programa`);
    assert.doesNotMatch(html, /Meta diária feita com volume reduzido/, `${name}: selo longo`);
    assert.equal((html.match(/Meta feita com volume reduzido/g) || []).length, 2, `${name}: selo curto nos dois botões`);
}
console.log('e17-critique-p3: ok');

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const packagedHtml = fs.readFileSync(path.join(root, 'app/src/main/assets/index.html'), 'utf8');
const readme = fs.readFileSync(path.join(root, 'docs/design/prototipo-fluxo-completo-2026-11-12/README.md'), 'utf8');
const referenceLicense = fs.readFileSync(path.join(root, 'docs/design/prototipo-fluxo-completo-2026-11-12/LICENSE-PulsoIcon'), 'utf8');

assert.equal(html, packagedHtml, 'a interface de produção deve ser idêntica à cópia empacotada');

const today = html.match(/<section id="tab-hoje"[^>]*>([\s\S]*?)<\/section>/)?.[1];
assert.ok(today, 'a tela Hoje deve continuar disponível');
const shortcutButtons = [...today.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)];
const shortcuts = [
    ['vacuo', 'Wind', 'Vácuo abdominal', "openTodayShortcut('vacuo')"],
    ['pausa', 'PersonStanding', 'Pausas', "openTodayShortcut('pausa')"],
    ['kegel', 'Activity', 'Kegel', "openTodayShortcut('kegel')"],
    ['discreto', 'Activity', 'Modo discreto', "openTodayShortcut('discreto')"],
    ['meditar', 'Brain', 'Mindfulness', "openTodayShortcut('meditar')"]
];

for (const [shortcut, icon, label, handler] of shortcuts) {
    const match = shortcutButtons.find(([, attrs]) => attrs.includes(`data-fluxo-shortcut="${shortcut}"`));
    assert.ok(match, `atalho ${label} deve permanecer em Hoje`);
    const [, attrs, body] = match;
    assert.match(attrs, new RegExp(`data-pulso-icon="${icon}"`), `${label} deve usar o ícone aprovado`);
    assert.ok(attrs.includes(handler), `${label} deve preservar seu destino atual`);
    assert.match(body, /<svg\b[^>]*aria-hidden="true"/, `${label} deve usar SVG local decorativo`);
    assert.ok(body.includes(label), `${label} deve manter seu nome visível`);
}
const practiceStyle = html.match(/\.cf-fluxo-practice-row\s*\{([^}]+)\}/)?.[1] || '';
assert.match(practiceStyle, /width:\s*100%/, 'os atalhos devem ocupar a largura disponível');
assert.match(practiceStyle, /grid-template-columns/, 'os atalhos devem separar ícone, texto e indicação de abertura');

const nav = html.match(/<nav id="coreflow-bottom-nav"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
assert.ok(nav, 'a navegação inferior deve continuar disponível');
const navButtons = [...nav.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)];
const navigation = [
    ['House', 'Hoje', "switchTab('hoje')"],
    ['ListChecks', 'Programas', "switchTab('programas')"],
    ['PersonStanding', 'Pausas', "switchTab('pausas')"],
    ['ChartLine', 'Evolução', "switchTab('dashboard')"],
    ['UserRound', 'Perfil', "switchTab('perfil')"]
];

assert.equal(navButtons.length, navigation.length, 'a navegação deve manter cinco destinos');
navigation.forEach(([icon, label, handler], index) => {
    const [, attrs, body] = navButtons[index];
    assert.match(attrs, new RegExp(`data-pulso-icon="${icon}"`), `${label} deve usar o ícone aprovado`);
    assert.ok(attrs.includes(handler), `${label} deve preservar seu destino atual`);
    assert.match(body, /<svg\b[^>]*aria-hidden="true"/, `${label} deve usar SVG local decorativo`);
    assert.ok(body.includes(label), `${label} deve manter seu rótulo`);
});
assert.doesNotMatch(nav, /fa-solid|nav-bounce/, 'os ícones da navegação devem permanecer estáticos e locais');
assert.doesNotMatch(html, /navBounce|nav-bounce|classList\.add\('nav-bounce'\)/, 'a troca de aba não deve animar os ícones');

for (const tab of ['hoje', 'vacuo', 'discreto', 'pausas', 'programas', 'dashboard', 'perfil']) {
    assert.match(html, new RegExp(`<section id="tab-${tab}"[^>]*class="[^"]*cf-fluxo-screen`), `${tab} deve usar o sistema Fluxo`);
}

const viewport = html.match(/<meta name="viewport" content="([^"]+)"/)?.[1] || '';
assert.ok(viewport.includes('width=device-width'), 'a interface deve ocupar a largura do dispositivo');
assert.doesNotMatch(viewport, /user-scalable\s*=\s*no|maximum-scale\s*=\s*1(?:\.0)?/i, 'o zoom deve continuar disponível para acessibilidade');
assert.match(html, /PulsoIcon static SVG paths by CityPulso[\s\S]*LICENSE-PulsoIcon/, 'a atribuição do PulsoIcon deve acompanhar a interface');
assert.doesNotMatch(html, /<(?:script|link)\b[^>]*\b(?:src|href)="https?:\/\//i, 'a tela deve usar apenas recursos locais');

const shippedLicensePath = path.join(root, 'app/src/main/assets/LICENSE-PulsoIcon');
assert.equal(fs.readFileSync(shippedLicensePath, 'utf8'), referenceLicense, 'o APK deve incluir a licença integral do PulsoIcon');
assert.match(readme, /PulsoIcon/, 'o README aprovado deve continuar identificando a origem dos ícones');
const notices = fs.readFileSync(path.join(root, 'app/src/main/assets/vendor/THIRD_PARTY_NOTICES.md'), 'utf8');
assert.match(notices, /PulsoIcon[\s\S]*LICENSE-PulsoIcon/, 'o aviso de terceiros deve apontar para a licença embarcada');

console.log('fluxo-home-navigation: ok');

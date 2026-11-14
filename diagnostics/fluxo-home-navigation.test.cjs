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
assert.doesNotMatch(today, /cf-status-dot/, 'Hoje não deve mostrar um indicador decorativo sem estado real');
assert.ok(today.indexOf('id="todayRecommendationContainer"') < today.indexOf('id="todayGreetingBlock"'), 'o programa deve aparecer antes da saudação e dos atalhos');
const pauses = html.match(/<section id="tab-pausas"[^>]*>([\s\S]*?)<\/section>/)?.[1];
assert.ok(pauses, 'a tela Pausas deve continuar disponível');
assert.doesNotMatch(pauses, /🌟|🪑|🧘|💪|💆/, 'os filtros de prática não devem usar emojis como ícones');
assert.match(html, /#tab-pausas \.cf-work-pause-settings legend[^{}]*\{[^}]*text-transform:\s*none/, 'os controles de pausa devem usar rótulos em caixa de frase');
assert.ok(/#tab-pausas \.cf-work-pause-settings > label\.cf-work-pause-enable[^{}]*\{/.test(html), 'somente a opção de ativar lembretes deve receber estilo de cartão');
assert.ok(/<label class="[^"]*cf-work-pause-interval-label[^"]*">Intervalo entre lembretes/.test(html), 'o intervalo deve permanecer um rótulo simples acima do seletor');
assert.match(html, /#tab-pausas \.cf-work-pause-icon[^{}]*\{[^}]*background:\s*transparent/, 'o ícone de pausa deve ficar sem bloco colorido');
assert.match(html, /#tab-pausas \.cf-pause-category[^{}]*\{[^}]*border-radius:\s*16px[^}]*background:/, 'as categorias Corpo e Mente devem usar cartões do novo sistema');
assert.match(html, /#tab-dashboard \.cf-evolution-comparison[^{}]*\{[^}]*border-radius:\s*0/, 'a comparação de evolução deve ser texto de apoio, não selo em cápsula');
assert.match(html, /#tab-dashboard \.cf-evolution-icon[^{}]*\{[^}]*background:\s*transparent/, 'o resumo de evolução deve dispensar ícone em círculo colorido');
assert.match(html, /#tab-dashboard \.cf-evolution-total[^{}]*\{[^}]*font-size:/, 'o valor de evolução deve usar escala própria');
assert.match(html, /#tab-perfil \.cf-profile-eyebrow[^{}]*\{[^}]*text-transform:\s*none/, 'o resumo do perfil deve evitar caixa alta decorativa');
assert.match(html, /#tab-perfil #profileReminderPrograms \.cf-profile-reminder[^{}]*\{[^}]*background:/, 'os lembretes do perfil devem usar a superfície da identidade');
assert.match(html, /#tab-perfil #profileReminderPrograms \.cf-profile-reminder-action[^{}]*\{[^}]*background:/, 'configurar horários deve seguir a cor de ação CoreFlow');
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
const practiceStyles = [...html.matchAll(/\.cf-fluxo-practice-row\s*\{([^}]+)\}/g)].map(([, style]) => style);
assert.ok(practiceStyles.some(style => /width:\s*100%/.test(style)), 'os atalhos devem ocupar a largura disponível');
assert.ok(practiceStyles.some(style => /grid-template-columns/.test(style)), 'os atalhos devem separar ícone, texto e indicação de abertura');

assert.doesNotMatch(html, /id="coreflow-bottom-nav"/, 'a interface não deve fixar a navegação na parte inferior');
const header = html.match(/<header\b[^>]*>([\s\S]*?)<\/header>/)?.[1] || '';
assert.match(header, /id="core-persistence-status"/, 'o salvamento deve aparecer como status discreto no cabeçalho');
assert.doesNotMatch(header, /id="mainNavigationButton"|>\s*Menu\s*</, 'a navegação não deve aparecer como botão no cabeçalho');
assert.doesNotMatch(header, /headerMoreBtn|headerMoreMenu|cf-streak-trigger/, 'o cabeçalho não deve manter menu de ações ou navegação');
const nav = html.match(/<nav[^>]*aria-label="Destinos principais"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
assert.ok(nav, 'o menu lateral deve manter a navegação principal acessível');
assert.match(html, /id="mainNavigationButton"[^>]*class="[^"]*cf-nav-accessibility-trigger[^"]*"[^>]*aria-expanded="false"/, 'a navegação deve continuar disponível por teclado e leitor de tela');
assert.match(html, /aria-controls="mainNavigationDrawer"/, 'o botão Menu deve apontar para a gaveta');
assert.match(html, /\.cf-nav-accessibility-trigger:focus-visible/, 'a alternativa acessível deve aparecer quando recebe foco');
const navButtons = [...nav.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)];
const navigation = [
    ['House', 'Hoje', "selectMainNavigation('hoje')"],
    ['ListChecks', 'Programas', "selectMainNavigation('programas')"],
    ['PersonStanding', 'Pausas', "selectMainNavigation('pausas')"],
    ['ChartLine', 'Evolução', "selectMainNavigation('dashboard')"],
    ['UserRound', 'Perfil', "selectMainNavigation('perfil')"]
];

assert.equal(navButtons.length, navigation.length, 'a navegação lateral deve manter cinco destinos');
navigation.forEach(([icon, label, handler], index) => {
    const [, attrs, body] = navButtons[index];
    assert.match(attrs, new RegExp(`data-pulso-icon="${icon}"`), `${label} deve usar o ícone aprovado`);
    assert.ok(attrs.includes(handler), `${label} deve preservar seu destino atual`);
    assert.match(body, /<svg\b[^>]*aria-hidden="true"/, `${label} deve usar SVG local decorativo`);
    assert.ok(body.includes(label), `${label} deve manter seu rótulo`);
});
assert.doesNotMatch(nav, /fa-solid|nav-bounce/, 'os ícones da navegação devem permanecer estáticos e locais');
assert.doesNotMatch(html, /navBounce|nav-bounce|classList\.add\('nav-bounce'\)/, 'a troca de aba não deve animar os ícones');
assert.match(html, /function openMainNavigation\(/, 'o menu lateral deve ter uma ação para abrir');
assert.match(html, /function closeMainNavigation\(/, 'o menu lateral deve ter uma ação para fechar e devolver o foco');

const switchTabStart = html.indexOf('function switchTab(tabName, direction = null) {');
const switchTabEnd = html.indexOf('function closeTopmostOverlay()', switchTabStart);
const switchTabFunction = switchTabStart >= 0 && switchTabEnd > switchTabStart
    ? html.slice(switchTabStart, switchTabEnd)
    : '';
assert.match(switchTabFunction, /target\.animate\(/, 'a troca de tela deve animar o conteúdo, não os ícones');
assert.match(switchTabFunction, /cf-reduced-motion/, 'a animação deve respeitar a preferência de movimento reduzido do app');
assert.match(switchTabFunction, /prefers-reduced-motion:\s*reduce/, 'a animação deve respeitar a preferência de movimento reduzido do sistema');
assert.match(switchTabFunction, /isScreenChange/, 'reselecionar a aba ativa não deve repetir a animação');
assert.match(switchTabFunction, /behavior:\s*isScreenChange\s*\|\|\s*prefersReducedMotion\s*\?\s*'auto'\s*:\s*'smooth'/, 'a troca de tela deve iniciar no topo sem animar uma rolagem longa');
assert.match(switchTabFunction, /direction/, 'a troca por gesto deve animar na direção percorrida');
const swipeStart = html.indexOf('function initializeVerticalScreenNavigation() {');
const swipeEnd = html.indexOf('function closeTopmostOverlay()', swipeStart);
const swipeFunction = swipeStart >= 0 && swipeEnd > swipeStart ? html.slice(swipeStart, swipeEnd) : '';
assert.match(swipeFunction, /touchstart[\s\S]*touchend/, 'a navegação vertical deve reconhecer um gesto completo');
assert.match(swipeFunction, /touch\.clientX\s*>=\s*24\s*&&\s*touch\.clientX\s*<=\s*72/, 'a gaveta deve abrir apenas com deslize iniciado na lateral, fora da zona do Voltar do Android');
assert.match(swipeFunction, /deltaX\s*>=\s*64[\s\S]*openMainNavigation\('gesture'\)/, 'deslizar para dentro a partir da lateral deve abrir a navegação oculta');
assert.match(swipeFunction, /scrollY/, 'o gesto deve respeitar a posição da rolagem');
assert.match(swipeFunction, /programas[\s\S]*hoje/, 'o gesto deve alternar entre Hoje e Programas');
assert.match(swipeFunction, /80/, 'o gesto deve exigir deslocamento suficiente para evitar trocas acidentais');
assert.match(swipeFunction, /button|input|textarea|select/, 'o gesto deve ignorar controles interativos');
assert.match(html, /cf-fluxo-program-highlight/, 'o programa recomendado deve receber destaque visual próprio');
assert.match(html, /Ver programas/, 'Hoje deve oferecer uma alternativa por toque para abrir Programas');
assert.match(html, /--cf-color-canvas:\s*#F5F1E7/i, 'as telas claras devem usar o fundo marfim aprovado');
assert.match(html, /--cf-color-action:\s*#2F5B45/i, 'as ações devem usar o verde profundo aprovado');
assert.match(html, /cf-persistence-ready/, 'salvamento confirmado deve ter estilo discreto');
assert.match(html, /#core-persistence-status\.cf-persistence-ready/, 'salvamento confirmado deve ter estilo discreto');
assert.match(html, /#core-persistence-status\.cf-persistence-alert[^{}]*\{[^}]*min-height:\s*44px[^}]*cursor:\s*pointer/, 'falhas de salvamento devem continuar legíveis e acionáveis');
assert.match(html, /#tab-programas\s+\.cf-fluxo-page-heading|#tab-programas\s+#todayWorkoutHeroBanner/, 'Programas deve receber composição visual própria');
assert.match(html, /\.cf-fluxo-screen button\.cf-btn,\s*\.cf-fluxo-primary-action\s*\{[^}]*border-radius:\s*12px/, 'botões das telas Fluxo devem usar cantos suaves');
assert.ok(practiceStyles.some(style => /border-radius:\s*16px/.test(style)), 'atalhos de prática devem manter cantos suaves');
assert.match(html, /theme:\s*'amoled'/, 'AMOLED deve ser o tema inicial sem sobrescrever uma preferência salva');
assert.match(html, /cf-program-mindfulness/, 'o programa de mindfulness deve receber composição própria');
assert.match(html, /cf-program-schedule/, 'as trilhas devem separar visualmente a agenda do restante do programa');

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

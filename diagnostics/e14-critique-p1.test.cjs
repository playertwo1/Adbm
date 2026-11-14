const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

// Regressão dos 4 P1 do critique de 2026-10-29 (.craft/critique): modal isolado, barras legíveis,
// navegação opaca e saudação só na aba Hoje.
const root = path.join(__dirname, '..');
for (const file of [path.join(root, 'index.html'), path.join(root, 'app', 'src', 'main', 'assets', 'index.html')]) {
    const html = fs.readFileSync(file, 'utf8');
    const name = path.relative(root, file);

    const nav = html.match(/\.cf-nav-panel\s*\{[^}]*\}/)?.[0] || '';
    assert.match(nav, /background:\s*var\(--cf-color-surface\)/i, `${name}: gaveta de navegação precisa ser opaca`);

    assert.match(html, /id="todayGreetingBlock"/, `${name}: bloco de saudação precisa de id`);
    const switchTabStart = html.indexOf('function switchTab(');
    const switchTabEnd = html.indexOf('function closeTopmostOverlay()', switchTabStart);
    const switchTab = switchTabStart >= 0 && switchTabEnd > switchTabStart
        ? html.slice(switchTabStart, switchTabEnd)
        : '';
    assert.match(switchTab, /todayGreetingBlock[\s\S]*toggle\('hidden', tabName !== 'hoje'\)/, `${name}: saudação só na aba Hoje`);

    assert.match(html, /function setOnboardingBackgroundInert\(on\)/, `${name}: helper de inert ausente`);
    assert.match(html, /#mainNavigationDrawer/, `${name}: onboarding deve isolar a gaveta de navegação`);
    const open = html.slice(html.indexOf('function openOnboardingIfNeeded('), html.indexOf('function handleBackNavigation('));
    assert.match(open, /setOnboardingBackgroundInert\(true\)/, `${name}: abrir onboarding deve isolar o fundo`);
    const finish = html.slice(html.lastIndexOf('AppState.onboardingCompleted = true;'), html.indexOf('function openOnboardingIfNeeded('));
    assert.match(finish, /setOnboardingBackgroundInert\(false\)/, `${name}: concluir onboarding deve liberar o fundo`);
}

const activity = fs.readFileSync(path.join(root, 'app/src/main/java/com/example/MainActivity.kt'), 'utf8');
assert.match(activity, /SystemBarStyle\.light\(/, 'tema claro deve usar ícones escuros nas barras do sistema');
assert.match(activity, /SystemBarStyle\.dark\(/, 'tema AMOLED deve usar ícones claros nas barras do sistema');
assert.match(activity, /fun setAmoledTheme\(enabled: Boolean\)/, 'a preferência AMOLED da WebView deve atualizar o shell Android');
console.log('e14-critique-p1: ok');

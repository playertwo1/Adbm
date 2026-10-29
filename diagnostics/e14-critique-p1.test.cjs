const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

// Regressão dos 4 P1 do critique de 2026-10-29 (.craft/critique): modal isolado, barras legíveis,
// navegação opaca e saudação só na aba Hoje.
const root = path.join(__dirname, '..');
for (const file of [path.join(root, 'index.html'), path.join(root, 'app', 'src', 'main', 'assets', 'index.html')]) {
    const html = fs.readFileSync(file, 'utf8');
    const name = path.relative(root, file);

    const nav = html.match(/\.cf-bottom-nav \{[^}]*\}/)[0];
    assert.match(nav, /background: rgb\(10, ?10, ?11\)/, `${name}: navegação inferior precisa ser opaca`);

    assert.match(html, /id="todayGreetingBlock"/, `${name}: bloco de saudação precisa de id`);
    const switchTab = html.slice(html.indexOf('function switchTab('), html.indexOf('function switchTab(') + 600);
    assert.match(switchTab, /todayGreetingBlock[\s\S]*toggle\('hidden', tabName !== 'hoje'\)/, `${name}: saudação só na aba Hoje`);

    assert.match(html, /function setOnboardingBackgroundInert\(on\)/, `${name}: helper de inert ausente`);
    const open = html.slice(html.indexOf('function openOnboardingIfNeeded('), html.indexOf('function handleBackNavigation('));
    assert.match(open, /setOnboardingBackgroundInert\(true\)/, `${name}: abrir onboarding deve isolar o fundo`);
    const finish = html.slice(html.lastIndexOf('AppState.onboardingCompleted = true;'), html.indexOf('function openOnboardingIfNeeded('));
    assert.match(finish, /setOnboardingBackgroundInert\(false\)/, `${name}: concluir onboarding deve liberar o fundo`);
}

const activity = fs.readFileSync(path.join(root, 'app/src/main/java/com/example/MainActivity.kt'), 'utf8');
assert.match(activity, /enableEdgeToEdge\(\s*statusBarStyle = SystemBarStyle\.dark\(/, 'ícones da barra de status precisam ser claros sobre o fundo escuro');
console.log('e14-critique-p1: ok');

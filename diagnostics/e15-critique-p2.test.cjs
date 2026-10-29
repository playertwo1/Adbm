const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

// Regressão da segunda rodada do critique (2026-10-29): checkbox nativo gigante em Pausas,
// erro do passo 1 do onboarding invisível e backup acima da evolução.
const root = path.join(__dirname, '..');
for (const file of [path.join(root, 'index.html'), path.join(root, 'app', 'src', 'main', 'assets', 'index.html')]) {
    const html = fs.readFileSync(file, 'utf8');
    const name = path.relative(root, file);

    assert.match(html, /label input\[type="checkbox"\], label input\[type="radio"\] \{\s*min-width: 0;\s*min-height: 0;/,
        `${name}: checkbox dentro de label usa o label como alvo de toque, não cresce para 48px`);
    assert.doesNotMatch(html, /min-h-11 items-center justify-center gap-1 rounded-lg[^>]*><input class="h-3 w-3/,
        `${name}: rótulos de dias precisam de alvo >= 48px`);

    const step2 = html.slice(html.indexOf('id="onboardingStep2"'), html.indexOf('id="onboardingStep3"'));
    assert.doesNotMatch(step2, /id="onboardingStepError"/, `${name}: erro do onboarding não pode ficar preso no passo 2`);
    assert.match(html, /id="onboardingStepError"/, `${name}: erro do onboarding ausente`);

    const dash = html.slice(html.indexOf('<section id="tab-dashboard"'));
    assert(dash.indexOf('id="dashboardBackupCard"') > dash.indexOf('Sua evolução</h2>'), `${name}: backup deve vir depois da evolução`);
}
console.log('e15-critique-p2: ok');

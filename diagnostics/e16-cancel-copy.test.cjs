const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

// Regressão 2026-10-29: o aviso de cancelamento dizia que nada contava, mas o Bracing registra
// prática parcial (regra da v1.1.43, travada em e15-bracing-integration). Textos devem dizer a verdade.
const root = path.join(__dirname, '..');
for (const file of [path.join(root, 'index.html'), path.join(root, 'app', 'src', 'main', 'assets', 'index.html')]) {
    const html = fs.readFileSync(file, 'utf8');
    const name = path.relative(root, file);

    assert.match(html, /<p id="cancelDailyConfirmText"/, `${name}: texto do aviso precisa de id`);
    const request = html.slice(html.indexOf('function requestCancelDailySession('), html.indexOf('function abortDailySession('));
    assert.match(request, /getBracingCompletedStepIndexes\(execution, false\)/, `${name}: aviso deve considerar repetições feitas`);
    assert.match(request, /volume reduzido e contam para a meta de hoje/, `${name}: Bracing com repetições deve avisar que conta`);

    assert.match(html, /function isBracingTodayReduced\(program\)/, `${name}: helper de volume reduzido ausente`);
    assert.equal((html.match(/isBracingTodayReduced\((?:mainProg|prog)\) \? /g) || []).length, 2,
        `${name}: os dois selos de meta diária devem indicar volume reduzido`);
}
console.log('e16-cancel-copy: ok');

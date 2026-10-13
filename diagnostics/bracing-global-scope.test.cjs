const fs = require('node:fs');
const assert = require('node:assert/strict');
const html = fs.readFileSync(require('node:path').join(__dirname, '../index.html'), 'utf8');
// Regressão v1.1.45: funções de Bracing presas dentro de loadState quebraram cancelar/pular/dividir.
// ponytail: contagem de chaves ignora strings; compara profundidade com uma função global conhecida.
function depthAt(name) {
    const pos = html.indexOf(`function ${name}(`);
    assert(pos >= 0, name);
    let depth = 0;
    for (let i = html.lastIndexOf('<script', pos); i < pos; i++) {
        if (html[i] === '{') depth++;
        else if (html[i] === '}') depth--;
    }
    return depth;
}
const globalDepth = depthAt('abortDailySession');
for (const name of ['getBracingCompletedStepIndexes', 'recordBracingPartialPractice', 'saveBracingSplitAndExit', 'saveBracingResumeCheckpoint', 'skipWorkoutStep']) {
    assert.equal(depthAt(name), globalDepth, `${name} precisa estar no escopo global`);
}
console.log('bracing-global-scope: ok');

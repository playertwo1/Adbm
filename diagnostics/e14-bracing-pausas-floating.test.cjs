const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const vm = require('vm');

console.log('--- Teste de Regressão: E14 Bracing McGill Adaptado, Agenda 7 Dias & Aba Pausas Flutuante ---');

const rootDir = path.resolve(__dirname, '..');
const htmlPath = path.join(rootDir, 'index.html');
const assetsHtmlPath = path.join(rootDir, 'app', 'src', 'main', 'assets', 'index.html');

// 1. Paridade estrita byte a byte
assert(fs.existsSync(htmlPath), 'index.html deve existir');
assert(fs.existsSync(assetsHtmlPath), 'assets index.html deve existir');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');
const assetsContent = fs.readFileSync(assetsHtmlPath, 'utf8');
assert.strictEqual(htmlContent, assetsContent, 'index.html e assets/index.html devem ser 100% idênticos');
console.log('✓ Paridade estrita HTML confirmada');

// 2. Extração e validação do AppState.programs
const appStateSlice = htmlContent.slice(htmlContent.indexOf('        const AppState = {'), htmlContent.indexOf('        const CORE_DATA_VERSION'));
const vmContext = vm.createContext({});
vm.runInContext('var AppState;\n' + appStateSlice.replace('const AppState =', 'AppState ='), vmContext);
const programs = vmContext.AppState.programs;
assert(Array.isArray(programs), 'AppState.programs deve ser um array');

// 2.1 Programa 1: Bracing McGill Adaptado (7 dias e 8 fases)
const bracing = programs.find(p => p.id === '1');
assert(bracing, 'Programa 1 (Bracing) deve existir');
assert.strictEqual(bracing.phases.length, 8, 'Bracing deve possuir 8 fases (8 semanas)');
bracing.phases.forEach((phase, idx) => {
    assert.strictEqual(phase.weeklyTargetDays, 7, `Bracing semana ${idx + 1} deve ter weeklyTargetDays: 7`);
});
console.log('✓ Programa 1 (Bracing): 8 semanas com weeklyTargetDays: 7');

// 2.2 Programa 2: Programa Kegel (ID '2', 7 dias)
const kegel = programs.find(p => p.id === '2');
assert(kegel, 'Programa 2 deve existir');
assert.strictEqual(kegel.title, 'Programa Kegel', 'Programa 2 deve ter o título "Programa Kegel"');
kegel.phases.forEach((phase, idx) => {
    assert.strictEqual(phase.weeklyTargetDays, 7, `Kegel semana ${idx + 1} deve ter weeklyTargetDays: 7`);
});
console.log('✓ Programa 2: Renomeado para "Programa Kegel" mantendo ID 2 e weeklyTargetDays: 7');

// 2.3 Programa 3: Vácuo Abdominal (7 dias)
const vacuum = programs.find(p => p.id === '3');
assert(vacuum, 'Programa 3 (Vácuo) deve existir');
assert.strictEqual(vacuum.phases.length, 8, 'Vácuo deve possuir 8 fases');
vacuum.phases.forEach((phase, idx) => {
    assert.strictEqual(phase.weeklyTargetDays, 7, `Vácuo semana ${idx + 1} deve ter weeklyTargetDays: 7`);
});
console.log('✓ Programa 3 (Vácuo): 8 semanas com weeklyTargetDays: 7');

// 3. Teste de Execução da Matriz Clínica de Bracing (McGill Adaptado: Sentado no Banco e Em Pé)
// Proibições estritas: zero chão, zero quatro apoios, zero prancha no chão, zero perdigueiro no chão
const forbiddenFloorTerms = ['no chão', 'deite no chão', 'quatro apoios', 'de quatro', 'deitado de costas', 'de bruços'];

// Extrair getProgramSteps do HTML
function extractFunction(name) {
    const start = htmlContent.search(new RegExp(`function\\s+${name}\\s*\\(`));
    assert(start >= 0, `função ausente: ${name}`);
    const bodyStart = htmlContent.indexOf('{', start);
    let depth = 0;
    for (let i = bodyStart; i < htmlContent.length; i++) {
        if (htmlContent[i] === '{') depth++;
        if (htmlContent[i] === '}' && --depth === 0) return htmlContent.slice(start, i + 1);
    }
    throw new Error(`bloco incompleto: ${name}`);
}

const stepsContext = vm.createContext({
    AppState: { programs },
    console
});
vm.runInContext(extractFunction('getProgramSteps'), stepsContext);

for (let week = 0; week < 8; week++) {
    for (let session = 1; session <= 2; session++) {
        const steps = stepsContext.getProgramSteps('1', week, session);
        assert(Array.isArray(steps) && steps.length > 0, `Semana ${week + 1} Sessão ${session} deve retornar steps`);

        // Deve ter preparação
        assert.strictEqual(steps[0].badge, 'PREPARAÇÃO', `Passo 1 deve ser PREPARAÇÃO`);
        // Deve ter qualidade no final
        assert.strictEqual(steps[steps.length - 1].badge, 'QUALIDADE', `Último passo deve ser QUALIDADE`);

        // Contar exercícios de trabalho
        const exerciseWorkSteps = steps.filter(s => s.badge && s.badge.startsWith('EX ') && !s.isRest);
        // Cada exercício tem 3 séries, totalizando 9 steps de trabalho
        assert.strictEqual(exerciseWorkSteps.length, 9, `Semana ${week + 1} Sessão ${session} deve ter 9 séries de trabalho (3 exercícios x 3 séries)`);

        // Verificar que não há nenhuma posição de chão
        steps.forEach(s => {
            const text = `${s.title} ${s.instruction}`.toLowerCase();
            forbiddenFloorTerms.forEach(term => {
                assert(!text.includes(term), `Exercício não pode conter posição de chão "${term}": ${s.title}`);
            });
        });
    }
}
console.log('✓ Matriz Clínica do Bracing: 8 semanas x 2 sessões x 3 exercícios reais, 100% no banco ou em pé (zero chão)');

// 4. Integração da Aba Pausas ao Modo Treino Flutuante Nativo
// 4.1 Alongamentos / Circuito Ergonômico
assert(htmlContent.includes("isFromCircuit ? 'stretch_circuit' : 'stretch'"), 'startStretchTimer deve definir type stretch ou stretch_circuit');
assert(htmlContent.includes("AppState.pausas.nativeManaged = true;"), 'startStretchTimer deve marcar nativeManaged = true ao iniciar');

// 4.2 Respiração Guiada da Mente
assert(htmlContent.includes("type: 'breath'"), 'startSpecificBreath deve definir type breath');
assert(htmlContent.includes("AppState.mente.nativeManaged = true;"), 'startSpecificBreath deve marcar nativeManaged = true ao iniciar');

// 4.3 Pausa de Resposta de 3 Minutos
assert(htmlContent.includes("type: 'responsive_pause'"), 'startResponsivePause deve definir type responsive_pause');
assert(htmlContent.includes("responsivePause.nativeManaged = true;"), 'startResponsivePause deve marcar nativeManaged = true ao iniciar');

// 4.4 Handlers de Estado Nativo em window.onNativeWorkoutState
assert(htmlContent.includes("handleNativeStretchState(state);"), 'window.onNativeWorkoutState deve rotear stretch/stretch_circuit');
assert(htmlContent.includes("handleNativeBreathState(state);"), 'window.onNativeWorkoutState deve rotear breath');
assert(htmlContent.includes("handleNativeResponsivePauseState(state);"), 'window.onNativeWorkoutState deve rotear responsive_pause');
assert(htmlContent.includes("function handleNativeStretchState(state)"), 'handleNativeStretchState deve estar definida');
assert(htmlContent.includes("function handleNativeBreathState(state)"), 'handleNativeBreathState deve estar definida');
assert(htmlContent.includes("function handleNativeResponsivePauseState(state)"), 'handleNativeResponsivePauseState deve estar definida');
console.log('✓ Aba Pausas conectada ao Modo Treino Flutuante (Alongamentos, Respiração e Pausa de Resposta com handlers nativos)');

console.log('--- TODOS OS TESTES PASSARAM COM SUCESSO! ---');

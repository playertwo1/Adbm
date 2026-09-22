const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

// E08.5 — Hoje: recomendação de programa e desempate.
// A recomendação continua exatamente o programa/etapa já selecionado (E07); sem
// nenhum programa selecionado, Hoje oferece escolha explícita em vez de decidir
// sozinha; com dois ou mais candidatos elegíveis simultâneos, a regra de desempate
// documentada (sessões hoje -> dias concluídos na etapa -> menor ID) é aplicada.

const root = path.join(__dirname, '..');
const files = [
    path.join(root, 'index.html'),
    path.join(root, 'app', 'src', 'main', 'assets', 'index.html')
];

function extractFunction(source, name) {
    const start = source.indexOf(`        function ${name}(`);
    assert(start >= 0, `Função ausente: ${name}`);
    return extractBlock(source, start, `function ${name}`);
}

function extractBlock(source, start, label) {
    let depth = 0;
    let opened = false;
    for (let index = source.indexOf('{', start); index < source.length; index += 1) {
        if (source[index] === '{') { depth += 1; opened = true; }
        if (source[index] === '}' && opened && --depth === 0) return source.slice(start, index + 1);
    }
    throw new Error(`Bloco incompleto: ${label}`);
}

const sources = files.map(file => fs.readFileSync(file, 'utf8'));
assert.equal(sources[0], sources[1], 'HTML raiz e asset embarcado precisam permanecer idênticos');
const source = sources[0];

// Contrato de markup: o container real de recomendação/seleção precisa existir na tela Hoje.
assert.match(source, /<section id="tab-hoje"[\s\S]*?id="todayRecommendationContainer"/, 'tela Hoje deve conter o container real de recomendação/seleção de programa');

const appState = source.slice(source.indexOf('        const AppState = {'), source.indexOf('        const CORE_DATA_VERSION'));

const programHasRealProgress = extractFunction(source, 'programHasRealProgress');
const selectTodayRecommendedProgram = extractFunction(source, 'selectTodayRecommendedProgram');
const selectTodayProgram = extractFunction(source, 'selectTodayProgram');
const renderTodayRecommendation = extractFunction(source, 'renderTodayRecommendation');
const synchronizeProgramProgress = extractFunction(source, 'synchronizeProgramProgress');
const getConfiguredWeeklyTargetDays = extractFunction(source, 'getConfiguredWeeklyTargetDays');

function makeElement(id) {
    const el = {
        id, _classes: new Set(), innerHTML: '', innerText: '',
        classList: {
            add(...names) { names.forEach(n => el._classes.add(n)); },
            remove(...names) { names.forEach(n => el._classes.delete(n)); },
            contains(name) { return el._classes.has(name); }
        }
    };
    return el;
}

function setup() {
    const elements = new Map();
    const getElementById = id => {
        if (!elements.has(id)) elements.set(id, makeElement(id));
        return elements.get(id);
    };
    const toastLog = [];
    const values = new Map();
    const context = vm.createContext({
        console: { log() {} },
        window: {},
        document: { getElementById },
        localStorage: {
            getItem(key) { return values.get(key) ?? null; },
            setItem(key, value) { values.set(key, String(value)); }
        },
        triggerHaptic() {},
        showInlineToast(message) { toastLog.push(message); },
        renderProgramsList() {}
    });
    const src = [
        appState,
        getConfiguredWeeklyTargetDays,
        synchronizeProgramProgress,
        programHasRealProgress,
        selectTodayRecommendedProgram,
        'function saveState() { return true; }',
        selectTodayProgram,
        renderTodayRecommendation
    ].join('\n');
    vm.runInContext(src, context);
    return { context, elements, getElementById, toastLog, values };
}

// 1) Programa já em andamento (E07: programDetailState aponta para um programa visitado)
//    continua sendo a recomendação exibida, mesmo que outro programa tenha mais sessões hoje.
{
    const env = setup();
    vm.runInContext(`AppState.programs.find(p => p.id === '1').sessionsToday = 2`, env.context); // mais sessões, mas não selecionado
    vm.runInContext(`AppState.programDetailState = { programId: '3', phaseIndex: 0, visitedAt: new Date().toISOString() }`, env.context);
    vm.runInContext(`renderTodayRecommendation()`, env.context);
    const html = env.getElementById('todayRecommendationContainer').innerHTML;
    assert.match(html, /Stomach Vacuum: 8 Semanas no Escritório/, 'recomendação deve continuar exatamente o programa já selecionado (E07), não o de mais sessões');
    assert.match(html, /todayRecommendationCard/);
    assert.doesNotMatch(html, /todayProgramSelection/);
}
console.log('E08.5 caso 1: programa já selecionado continua sendo a recomendação, sem decidir por outro critério.');

// 2) Sem nenhum programa selecionado e sem progresso real em nenhum programa: Hoje oferece
//    seleção explícita, nunca escolhe um programa arbitrário como "recomendado".
{
    const env = setup();
    vm.runInContext(`AppState.programDetailState = null`, env.context);
    vm.runInContext(`renderTodayRecommendation()`, env.context);
    const html = env.getElementById('todayRecommendationContainer').innerHTML;
    assert.match(html, /id="todayProgramSelection"/, 'sem seleção prévia e sem progresso real, Hoje deve oferecer escolha explícita');
    assert.doesNotMatch(html, /todayRecommendationCard/, 'não pode fabricar uma recomendação sem base real');
    assert.match(html, /Bracing: Controle e Automação/);
    assert.match(html, /Cronograma Avançado de 8 Semanas/);
    assert.match(html, /Stomach Vacuum: 8 Semanas no Escritório/);
    assert.doesNotMatch(html, /Mindfulness 8 Semanas/, 'Mindfulness não é candidato de seleção neste fluxo (fora do escopo desta fatia)');
}
console.log('E08.5 caso 2: sem programa selecionado, Hoje oferece seleção explícita em vez de escolher sozinha.');

// 3) selectTodayProgram grava a escolha explícita do usuário e ela passa a ser a recomendação.
{
    const env = setup();
    vm.runInContext(`AppState.programDetailState = null`, env.context);
    vm.runInContext(`selectTodayProgram('2')`, env.context);
    assert.equal(vm.runInContext('AppState.programDetailState.programId', env.context), '2');
    const html = env.getElementById('todayRecommendationContainer').innerHTML;
    assert.match(html, /Cronograma Avançado de 8 Semanas/, 'após seleção explícita, a recomendação passa a ser o programa escolhido');
}
console.log('E08.5 caso 3: seleção explícita do usuário é gravada e vira a recomendação exibida.');

// 4) ID inválido em selectTodayProgram não altera a seleção nem trava; mostra erro real.
{
    const env = setup();
    vm.runInContext(`AppState.programDetailState = null`, env.context);
    vm.runInContext(`selectTodayProgram('does-not-exist')`, env.context);
    assert.equal(vm.runInContext('AppState.programDetailState', env.context), null);
    assert.ok(env.toastLog.some(msg => /ID inválido/.test(msg)));
}
console.log('E08.5 caso 4: ID inválido na seleção não fabrica escolha nem mascara o erro.');

// 5) Desempate com dois ou mais candidatos elegíveis (progresso real, sem seleção explícita):
//    prioriza mais sessões hoje primeiro (regra documentada em docs/roadmap/execucao.md).
{
    const env = setup();
    vm.runInContext(`AppState.programDetailState = null`, env.context);
    vm.runInContext(`AppState.programs.find(p => p.id === '1').sessionsToday = 1`, env.context);
    vm.runInContext(`AppState.programs.find(p => p.id === '2').sessionsToday = 2`, env.context);
    vm.runInContext(`AppState.programs.find(p => p.id === '3').daysCompletedInPhase = 3`, env.context); // menos sessões, mais dias
    const result = vm.runInContext(`selectTodayRecommendedProgram()`, env.context);
    assert.equal(result.program.id, '2', 'com dois+ candidatos elegíveis, mais sessões hoje vence primeiro no desempate');
    assert.equal(result.reason, 'tie-break');
    assert.equal(result.candidateCount, 3);
}
console.log('E08.5 caso 5: desempate por mais sessões hoje entre candidatos elegíveis, conforme regra documentada.');

// 6) Desempate: sessões hoje empatadas -> decide por mais dias concluídos na etapa atual.
{
    const env = setup();
    vm.runInContext(`AppState.programDetailState = null`, env.context);
    vm.runInContext(`AppState.programs.find(p => p.id === '1').sessionsToday = 1`, env.context);
    vm.runInContext(`AppState.programs.find(p => p.id === '3').sessionsToday = 1`, env.context);
    vm.runInContext(`AppState.programs.find(p => p.id === '3').daysCompletedInPhase = 4`, env.context);
    const result = vm.runInContext(`selectTodayRecommendedProgram()`, env.context);
    assert.equal(result.program.id, '3', 'sessões hoje empatadas: mais dias concluídos na etapa vence no desempate');
}
console.log('E08.5 caso 6: desempate por dias concluídos na etapa quando sessões hoje empatam.');

// 7) Desempate: sessões e dias totalmente empatados -> critério estável final é o menor ID.
{
    const env = setup();
    vm.runInContext(`AppState.programDetailState = null`, env.context);
    vm.runInContext(`AppState.programs.find(p => p.id === '2').sessionsToday = 1`, env.context);
    vm.runInContext(`AppState.programs.find(p => p.id === '3').sessionsToday = 1`, env.context);
    const result = vm.runInContext(`selectTodayRecommendedProgram()`, env.context);
    assert.equal(result.program.id, '2', 'empate total: menor ID vence como critério estável final, nunca escolha aleatória');
}
console.log('E08.5 caso 7: empate total resolvido pelo menor ID de programa, critério estável e não aleatório.');

// 8) Um único candidato com progresso real (sem empate) é a recomendação, sem passar pelo desempate.
{
    const env = setup();
    vm.runInContext(`AppState.programDetailState = null`, env.context);
    vm.runInContext(`AppState.programs.find(p => p.id === '3').sessionsToday = 1`, env.context);
    const result = vm.runInContext(`selectTodayRecommendedProgram()`, env.context);
    assert.equal(result.program.id, '3');
    assert.equal(result.reason, 'in-progress');
}
console.log('E08.5 caso 8: candidato único com progresso real é a recomendação direta.');

console.log('E08.5 regressões: continuidade do programa selecionado, seleção explícita sem programa e desempate documentado verificados.');

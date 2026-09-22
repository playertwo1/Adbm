const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

// E08.4 — Hoje: editar meta com salvar/cancelar.
// Cobre: salvar meta válida (persiste e atualiza Hoje imediatamente), salvar meta inválida
// (rejeitada com motivo real, editor não fecha, valor salvo anterior preservado) e cancelar
// (nenhum efeito colateral sobre o estado salvo).

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

function extractLastFunction(source, name) {
    const start = source.lastIndexOf(`        function ${name}(`);
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

// Contrato de UI: botão de editar meta na tela Hoje, modal com salvar/cancelar reais.
assert.match(source, /id="editGoalModal"/, 'modal de edição de meta ausente');
assert.match(source, /onclick="openEditGoalModal\(\)"/, 'controle para abrir edição de meta ausente em Hoje');
assert.match(source, /id="editGoalInput"/, 'input de meta do modal ausente');
assert.match(source, /onclick="saveEditGoalModal\(\)"/, 'botão salvar ausente no modal de meta');
assert.match(source, /onclick="closeEditGoalModal\(\)"/, 'botão cancelar/fechar ausente no modal de meta');
assert.match(source, /id="editGoalError"/, 'elemento de erro do modal de meta ausente');

const appState = source.slice(source.indexOf('        const AppState = {'), source.indexOf('        const CORE_DATA_VERSION'));
const persistenceStart = source.indexOf('        const CORE_PROGRESS_SNAPSHOT_KEY');
const persistenceEnd = source.indexOf('        // Initialize on load', persistenceStart);
assert(persistenceStart > 0 && persistenceEnd > persistenceStart);

const localDateKey = extractFunction(source, 'localDateKey');
const weekDateKeys = extractFunction(source, 'weekDateKeys');
const syncDerivedStats = extractFunction(source, 'syncDerivedStats');
const getConfiguredWeeklyTargetDays = extractFunction(source, 'getConfiguredWeeklyTargetDays');
const synchronizeProgramProgress = extractFunction(source, 'synchronizeProgramProgress');
const applyProgramProgressAdjustment = extractFunction(source, 'applyProgramProgressAdjustment');
const loadSavedState = extractLastFunction(source, 'loadSavedState');
const renderGreeting = extractFunction(source, 'renderGreeting');
const updateHeaderStats = extractFunction(source, 'updateHeaderStats');
const renderTodaySummary = extractFunction(source, 'renderTodaySummary');
const onboardingValidateGoal = extractFunction(source, 'onboardingValidateGoal');
const openEditGoalModal = extractFunction(source, 'openEditGoalModal');
const closeEditGoalModal = extractFunction(source, 'closeEditGoalModal');
const saveEditGoalModal = extractFunction(source, 'saveEditGoalModal');
const showInlineToast = extractFunction(source, 'showInlineToast');

const noopNames = [
    'evaluateAchievements', 'renderScheduleList', 'renderProgramsList',
    'renderMonthlyBars', 'renderWeeklyChart', 'renderSmartSuggestionCard', 'renderWeeklyTimeSummary',
    'renderAchievements', 'renderMenteHistory', 'renderCorpoHistory', 'updateTimeOfDayStretchRecommendation',
    'updateWeeklyMobilityMetrics', 'updateStretchDurationUI', 'loadCustomPresets', 'updateBreathDurationUI',
    'updateBreathLevelUI', 'updateTimeOfDayRecommendation', 'updateWeeklyCalmMetrics',
    'updatePushNotificationButton', 'syncAllNativeReminders', 'renderCustomPresetsList', 'triggerHaptic',
    'renderTodayRecommendation', 'applyProfilePreferences'
];

function makeElement(id) {
    const el = {
        id, _classes: new Set(['hidden']), _hidden: true, innerText: '', textContent: '', value: '',
        attributes: {},
        classList: {
            add(...names) { names.forEach(n => el._classes.add(n)); },
            remove(...names) { names.forEach(n => el._classes.delete(n)); },
            toggle(name, force) {
                if (force === undefined) { el._classes.has(name) ? el._classes.delete(name) : el._classes.add(name); }
                else if (force) el._classes.add(name); else el._classes.delete(name);
            },
            contains(name) { return el._classes.has(name); }
        },
        style: {},
        setAttribute(key, value) { el.attributes[key] = value; },
        getAttribute(key) { return el.attributes[key] ?? null; },
        remove() {}
    };
    return el;
}

function setup() {
    const elements = new Map();
    const getElementById = id => {
        if (!elements.has(id)) elements.set(id, makeElement(id));
        return elements.get(id);
    };
    const values = new Map();
    const toastLog = [];
    const bodyChildren = [];
    const context = vm.createContext({
        console: { log() {} },
        window: {},
        ACCESSIBILITY_DEFAULTS: { textScale: 'normal', highContrast: false, reducedMotion: false },
        normalizeAccessibilityPreferences(value) {
            return {
                textScale: value?.textScale === 'large' ? 'large' : 'normal',
                highContrast: value?.highContrast === true,
                reducedMotion: value?.reducedMotion === true
            };
        },
        document: {
            getElementById, activeElement: null, querySelectorAll() { return []; },
            createElement() { return { classList: { add() {} }, remove() {}, appendChild() {} }; },
            body: { appendChild(el) { bodyChildren.push(el); } }
        },
        localStorage: {
            getItem(key) { return values.get(key) ?? null; },
            setItem(key, value) { values.set(key, String(value)); }
        },
        setTimeout() {},
        TextEncoder,
        ...Object.fromEntries(noopNames.map(name => [name, () => {}]))
    });
    const src = [
        appState,
        'const CORE_DATA_VERSION = 3;',
        'let onboardingState = { step: 1, focus: null, dailyGoalInput: "", weeklyDaysInput: "" };',
        localDateKey, weekDateKeys, syncDerivedStats, getConfiguredWeeklyTargetDays,
        synchronizeProgramProgress, applyProgramProgressAdjustment,
        source.slice(persistenceStart, persistenceEnd),
        renderGreeting, renderTodaySummary, updateHeaderStats,
        onboardingValidateGoal, showInlineToast,
        openEditGoalModal, closeEditGoalModal, saveEditGoalModal
    ].join('\n');
    vm.runInContext(src, context);
    return { context, elements, getElementById, values, toastLog };
}

// 1) Salvar meta válida: persiste, Hoje reflete imediatamente, modal fecha.
{
    const env = setup();
    vm.runInContext('loadSavedState();', env.context);
    vm.runInContext('AppState.dailyGoal = 30; saveState();', env.context);
    vm.runInContext('openEditGoalModal();', env.context);
    assert.equal(env.getElementById('editGoalInput').value, '30', 'input pré-carrega a meta atual salva');
    env.getElementById('editGoalInput').value = '45';
    vm.runInContext('saveEditGoalModal();', env.context);
    assert.equal(vm.runInContext('AppState.dailyGoal', env.context), 45, 'meta válida atualiza AppState imediatamente');
    assert.equal(env.getElementById('editGoalModal').classList.contains('hidden'), true, 'modal fecha após salvar com sucesso');
    assert.equal(env.getElementById('todayGoalValue').textContent, '45', 'Hoje reflete a nova meta imediatamente após salvar');
    const persisted = JSON.parse(env.values.get('coreflow_progress_snapshot_v4'));
    assert.equal(persisted.data.dailyGoal, 45, 'meta válida é persistida no snapshot');
}
console.log('E08.4 salvar meta válida: persiste, atualiza Hoje e fecha o editor.');

// 2) Salvar meta inválida: rejeitada com motivo real, editor não fecha, estado salvo preservado.
{
    const env = setup();
    vm.runInContext('loadSavedState();', env.context);
    vm.runInContext('AppState.dailyGoal = 30; saveState();', env.context);
    vm.runInContext('openEditGoalModal();', env.context);
    env.getElementById('editGoalInput').value = '3'; // abaixo do mínimo de 5
    vm.runInContext('saveEditGoalModal();', env.context);
    assert.equal(vm.runInContext('AppState.dailyGoal', env.context), 30, 'meta inválida não altera AppState');
    assert.equal(env.getElementById('editGoalModal').classList.contains('hidden'), false, 'editor permanece aberto ao rejeitar meta inválida');
    assert.equal(env.getElementById('editGoalError').classList.contains('hidden'), false, 'erro real é exibido para meta inválida');
    assert.match(env.getElementById('editGoalError').textContent, /entre 5 e 180/, 'motivo do erro é real, não mensagem genérica');
    const persisted = JSON.parse(env.values.get('coreflow_progress_snapshot_v4'));
    assert.equal(persisted.data.dailyGoal, 30, 'estado salvo permanece com a meta anterior após rejeição');

    // valor vazio também é rejeitado com motivo real (não silenciosamente fechado)
    env.getElementById('editGoalInput').value = '';
    vm.runInContext('saveEditGoalModal();', env.context);
    assert.equal(env.getElementById('editGoalModal').classList.contains('hidden'), false, 'editor permanece aberto para meta vazia');
    assert.match(env.getElementById('editGoalError').textContent, /Informe a meta/, 'meta vazia gera motivo real específico');
}
console.log('E08.4 salvar meta inválida: rejeitada com motivo real, editor permanece aberto, estado salvo preservado.');

// 3b) Falha de persistência ao salvar: AppState.dailyGoal não pode divergir do snapshot salvo.
{
    const env = setup();
    vm.runInContext('loadSavedState();', env.context);
    vm.runInContext('AppState.dailyGoal = 30; saveState();', env.context);
    vm.runInContext('openEditGoalModal();', env.context);
    env.getElementById('editGoalInput').value = '77';
    // Simula falha real de persistência (ex.: recoveryRequired/writeFailed já expostos na UI).
    vm.runInContext("CorePersistence.status = 'writeFailed';", env.context);
    vm.runInContext('saveEditGoalModal();', env.context);
    assert.equal(env.getElementById('editGoalModal').classList.contains('hidden'), false, 'editor permanece aberto quando a persistência falha');
    assert.equal(env.getElementById('editGoalError').classList.contains('hidden'), false, 'erro de falha de persistência é exibido');
    assert.equal(vm.runInContext('AppState.dailyGoal', env.context), 30, 'AppState.dailyGoal reverte ao valor anterior quando saveState() falha (sem contaminação em memória)');
    const persistedAfterFailure = JSON.parse(env.values.get('coreflow_progress_snapshot_v4'));
    assert.equal(persistedAfterFailure.data.dailyGoal, 30, 'snapshot persistido continua com a meta anterior após falha de saveState()');

    // reabrir o modal depois da falha deve mostrar a meta realmente salva (30), não o rascunho rejeitado (77)
    vm.runInContext('closeEditGoalModal(); openEditGoalModal();', env.context);
    assert.equal(env.getElementById('editGoalInput').value, '30', 'reabertura após falha de persistência usa a meta realmente salva, não o rascunho não confirmado');
}
console.log('E08.4 falha de persistência ao salvar: AppState.dailyGoal reverte, sem contaminação em memória.');

// 3) Cancelar: não altera o estado salvo, sem efeito colateral.
{
    const env = setup();
    vm.runInContext('loadSavedState();', env.context);
    vm.runInContext('AppState.dailyGoal = 30; saveState();', env.context);
    vm.runInContext('openEditGoalModal();', env.context);
    env.getElementById('editGoalInput').value = '90';
    vm.runInContext('closeEditGoalModal();', env.context); // Cancelar
    assert.equal(vm.runInContext('AppState.dailyGoal', env.context), 30, 'cancelar preserva a meta anterior em memória');
    assert.equal(env.getElementById('editGoalModal').classList.contains('hidden'), true, 'cancelar fecha o modal');
    const persisted = JSON.parse(env.values.get('coreflow_progress_snapshot_v4'));
    assert.equal(persisted.data.dailyGoal, 30, 'cancelar não persiste a edição descartada');

    // reabrir depois de cancelar mostra a meta salva anterior, não o rascunho descartado
    vm.runInContext('openEditGoalModal();', env.context);
    assert.equal(env.getElementById('editGoalInput').value, '30', 'reabertura após cancelar usa a meta salva, não o rascunho de 90');
}
console.log('E08.4 cancelar: preserva a meta anterior sem efeito colateral no estado salvo.');

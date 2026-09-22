const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

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

// A tela de onboarding precisa existir com as três etapas do contrato.
assert.match(source, /id="onboardingModal"/);
assert.match(source, /id="onboardingStep1"/, 'etapa objetivo ausente');
assert.match(source, /id="onboardingStep2"/, 'etapa meta\/agenda ausente');
assert.match(source, /id="onboardingStep3"/, 'etapa revisão ausente');
assert.match(source, /id="onboardingBackBtn"/);
assert.match(source, /id="onboardingNextBtn"/);

const appState = source.slice(source.indexOf('        const AppState = {'), source.indexOf('        const CORE_DATA_VERSION'));
const onboardingFocusLabels = extractBlockFromConst(source, 'ONBOARDING_FOCUS_LABELS');
const validateGoal = extractFunction(source, 'onboardingValidateGoal');
const validateWeekly = extractFunction(source, 'onboardingValidateWeeklyDays');
const showStepError = extractFunction(source, 'onboardingShowStepError');
const renderStep = extractFunction(source, 'onboardingRenderStep');
const selectFocus = extractFunction(source, 'onboardingSelectFocus');
const updateGoalInput = extractFunction(source, 'onboardingUpdateDailyGoalInput');
const updateWeeklyInput = extractFunction(source, 'onboardingUpdateWeeklyDaysInput');
const goBack = extractFunction(source, 'onboardingGoBack');
const goNext = extractFunction(source, 'onboardingGoNext');
const complete = extractFunction(source, 'onboardingComplete');
const openIfNeeded = extractFunction(source, 'openOnboardingIfNeeded');
const saveState = extractFunction(source, 'saveState');
const collectProgressData = extractFunction(source, 'collectProgressData');
const applyProgressData = extractFunction(source, 'applyProgressData');
const mergeLoadedPrograms = extractFunction(source, 'mergeLoadedPrograms');
const synchronizeProgramProgress = extractFunction(source, 'synchronizeProgramProgress');
const getConfiguredWeeklyTargetDays = extractFunction(source, 'getConfiguredWeeklyTargetDays');
const isStrictNonNegativeInteger = extractFunction(source, 'isStrictNonNegativeInteger');
const isValidReminderTime = extractFunction(source, 'isValidReminderTime');
const isReminderScheduleComplete = extractFunction(source, 'isReminderScheduleComplete');
const localDateKey = extractFunction(source, 'localDateKey');
const readProgressSnapshot = extractFunction(source, 'readProgressSnapshot');
const validateProgressSnapshot = extractFunction(source, 'validateProgressSnapshot');
const normalizeSessionHistory = extractFunction(source, 'normalizeSessionHistory');
const isValidSessionRecord = extractFunction(source, 'isValidSessionRecord');
const loadSavedState = extractLastFunction(source, 'loadSavedState');
const readLegacyProgress = extractFunction(source, 'readLegacyProgress');
const parseStoredJson = extractFunction(source, 'parseStoredJson');

function extractBlockFromConst(src, name) {
    const start = src.indexOf(`        const ${name} = {`);
    assert(start >= 0, `Constante ausente: ${name}`);
    return extractBlock(src, start, `const ${name}`);
}

function makeElement(id) {
    const el = {
        id,
        _classes: new Set(['hidden']),
        _hidden: true,
        innerText: '',
        textContent: '',
        value: '',
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
        setAttribute(key, value) { el.attributes[key] = value; },
        getAttribute(key) { return el.attributes[key] ?? null; }
    };
    return el;
}

function setup() {
    const elements = new Map();
    const getElementById = id => {
        if (!elements.has(id)) elements.set(id, makeElement(id));
        return elements.get(id);
    };
    const focusButtons = ['core', 'postura', 'assoalho', 'respirar', 'mindfulness'].map(focus => {
        const btn = makeElement(`onboarding-focus-${focus}`);
        btn.attributes['data-focus'] = focus;
        btn._classes = new Set(['onboarding-focus-btn', 'border-slate-700', 'bg-slate-800/60']);
        return btn;
    });
    const toastLog = [];
    const switchTabCalls = [];
    const values = new Map();
    const context = vm.createContext({
        console: { log() {} },
        window: {},
        hasSystemReminderPermission() { return false; },
        document: {
            getElementById,
            activeElement: null,
            querySelectorAll(selector) {
                if (selector === '.onboarding-focus-btn') return focusButtons;
                return [];
            }
        },
        localStorage: {
            getItem(key) { return values.get(key) ?? null; },
            setItem(key, value) { values.set(key, String(value)); }
        },
        TextEncoder,
        triggerHaptic() {},
        showInlineToast(message) { toastLog.push(message); },
        syncAllNativeReminders() {},
        evaluateAchievements() {}, updateHeaderStats() {}, renderScheduleList() {},
        renderMonthlyBars() {}, renderWeeklyChart() {}, renderSmartSuggestionCard() {},
        renderWeeklyTimeSummary() {}, renderAchievements() {}, renderMenteHistory() {},
        renderCorpoHistory() {}, updateTimeOfDayStretchRecommendation() {},
        updateWeeklyMobilityMetrics() {}, updateStretchDurationUI() {}, loadCustomPresets() {},
        updateBreathDurationUI() {}, updateBreathLevelUI() {}, updateTimeOfDayRecommendation() {},
        updateWeeklyCalmMetrics() {}, updatePushNotificationButton() {}, renderCustomPresetsList() {},
        renderProgramsList() {}, renderAfterProgressLoad() {},
        switchTab(name) { switchTabCalls.push(name); },
        saveState() { return true; },
        CorePersistence: { completedSessionIds: [], sessionHistory: [] },
        CORE_DATA_VERSION: 3,
        CORE_PROGRESS_SNAPSHOT_KEY: 'coreflow_progress_snapshot_v4',
        CORE_PROGRESS_BACKUP_KEY: 'coreflow_progress_snapshot_v4_backup'
    });
    const src = [
        appState,
        onboardingFocusLabels,
        'let onboardingState = { step: 1, focus: null, dailyGoalInput: "", weeklyDaysInput: "" };',
        validateGoal, validateWeekly, showStepError, renderStep, selectFocus, updateGoalInput,
        updateWeeklyInput, goBack, goNext, complete, openIfNeeded,
        localDateKey, getConfiguredWeeklyTargetDays, isStrictNonNegativeInteger,
        isValidReminderTime, isReminderScheduleComplete, synchronizeProgramProgress, mergeLoadedPrograms,
        isValidSessionRecord, normalizeSessionHistory,
        applyProgressData, collectProgressData
    ].join('\n');
    vm.runInContext(src, context);
    return { context, elements, getElementById, toastLog, switchTabCalls, focusButtons };
}

// 1) Meta inválida bloqueia avanço com motivo real, sem mensagem genérica fabricada.
{
    const env = setup();
    vm.runInContext(`
        onboardingState.focus = 'core';
        onboardingGoNext();
    `, env.context);
    assert.equal(vm.runInContext('onboardingState.step', env.context), 2, 'foco válido avança para meta/agenda');

    vm.runInContext(`onboardingState.dailyGoalInput = ''; onboardingGoNext();`, env.context);
    assert.equal(vm.runInContext('onboardingState.step', env.context), 2, 'meta vazia não avança');
    assert.equal(env.getElementById('onboardingStepError').textContent, 'Informe a meta diária em minutos.');

    vm.runInContext(`onboardingState.dailyGoalInput = '2'; onboardingGoNext();`, env.context);
    assert.equal(vm.runInContext('onboardingState.step', env.context), 2, 'meta abaixo do limite não avança');
    assert.equal(env.getElementById('onboardingStepError').textContent, 'A meta diária deve estar entre 5 e 180 minutos.');

    vm.runInContext(`onboardingState.dailyGoalInput = '300'; onboardingGoNext();`, env.context);
    assert.equal(vm.runInContext('onboardingState.step', env.context), 2, 'meta acima do limite não avança');

    vm.runInContext(`onboardingState.dailyGoalInput = 'abc'; onboardingGoNext();`, env.context);
    assert.equal(vm.runInContext('onboardingState.step', env.context), 2, 'meta não numérica não avança');

    vm.runInContext(`onboardingState.dailyGoalInput = '30'; onboardingState.weeklyDaysInput = '9'; onboardingGoNext();`, env.context);
    assert.equal(vm.runInContext('onboardingState.step', env.context), 2, 'frequência semanal fora do limite não avança');
    assert.equal(env.getElementById('onboardingStepError').textContent, 'Os dias por semana devem estar entre 1 e 7.');

    vm.runInContext(`onboardingState.weeklyDaysInput = '5'; onboardingGoNext();`, env.context);
    assert.equal(vm.runInContext('onboardingState.step', env.context), 3, 'meta e frequência válidas avançam para revisão');
}
console.log('E08 meta inválida: bloqueia avanço com motivo real em cada caso (vazio, abaixo/acima do limite, não numérico, frequência inválida).');

// 2) Preenchimento parcial + Voltar preserva dados já preenchidos.
{
    const env = setup();
    vm.runInContext(`
        onboardingState.focus = 'assoalho';
        onboardingGoNext();
        onboardingState.dailyGoalInput = '45';
        onboardingState.weeklyDaysInput = '4';
        onboardingGoNext();
    `, env.context);
    assert.equal(vm.runInContext('onboardingState.step', env.context), 3);
    vm.runInContext('onboardingGoBack();', env.context);
    assert.equal(vm.runInContext('onboardingState.step', env.context), 2, 'Voltar retorna uma etapa');
    assert.equal(vm.runInContext('onboardingState.dailyGoalInput', env.context), '45', 'meta preenchida preservada após Voltar');
    assert.equal(vm.runInContext('onboardingState.weeklyDaysInput', env.context), '4', 'frequência preenchida preservada após Voltar');
    vm.runInContext('onboardingGoBack();', env.context);
    assert.equal(vm.runInContext('onboardingState.step', env.context), 1, 'segundo Voltar retorna ao objetivo');
    assert.equal(vm.runInContext('onboardingState.focus', env.context), 'assoalho', 'foco escolhido preservado após Voltar');
    vm.runInContext('onboardingGoNext();', env.context);
    assert.equal(vm.runInContext('onboardingState.dailyGoalInput', env.context), '45', 'avançar novamente preserva a meta preenchida antes');
}
console.log('E08 preenchimento parcial + Voltar: foco, meta e frequência preservados em cada etapa.');

// 3) Conclusão salva a meta/agenda no AppState e persiste via saveState/collectProgressData, e navega para Hoje.
{
    const env = setup();
    vm.runInContext(`
        AppState.onboardingCompleted = false;
        onboardingState.focus = 'respirar';
        onboardingGoNext();
        onboardingState.dailyGoalInput = '60';
        onboardingState.weeklyDaysInput = '3';
        onboardingGoNext();
        onboardingComplete();
    `, env.context);
    assert.equal(vm.runInContext('AppState.onboardingCompleted', env.context), true, 'conclusão marca onboarding como completo');
    assert.equal(vm.runInContext('AppState.dailyGoal', env.context), 60, 'meta diária real é gravada no AppState');
    assert.equal(vm.runInContext('AppState.onboardingFocus', env.context), 'respirar', 'foco escolhido é gravado no AppState');
    assert.equal(vm.runInContext('AppState.weeklyGoalDays', env.context), 3, 'frequência semanal é gravada no AppState');
    assert.deepEqual(env.switchTabCalls, ['hoje'], 'conclusão abre a tela Hoje (switchTab)');
    assert.ok(env.getElementById('onboardingModal').classList.contains('hidden'), 'modal de onboarding é escondido ao concluir');

    const collected = vm.runInContext('collectProgressData()', env.context);
    assert.equal(collected.dailyGoal, 60, 'saveState grava a meta real coletada');
    assert.equal(collected.onboardingCompleted, true);
    assert.equal(collected.onboardingFocus, 'respirar');
    assert.equal(collected.weeklyGoalDays, 3);
}
console.log('E08 conclusão: grava meta/agenda no AppState e nos dados persistidos (collectProgressData), abre Hoje.');

// 4) Meta inválida na revisão (chamada direta a onboardingComplete) não conclui nem navega.
{
    const env = setup();
    vm.runInContext(`
        AppState.onboardingCompleted = false;
        onboardingState.focus = 'core';
        onboardingState.dailyGoalInput = '';
        onboardingState.weeklyDaysInput = '';
        onboardingComplete();
    `, env.context);
    assert.equal(vm.runInContext('AppState.onboardingCompleted', env.context), false, 'meta ausente não conclui onboarding');
    assert.deepEqual(env.switchTabCalls, [], 'meta inválida não navega para Hoje');
}
console.log('E08 meta inválida na conclusão: onboardingComplete não grava nem navega sem meta válida.');

// 5) Usuário existente (snapshot v4 sem os novos campos) não é forçado a repetir onboarding.
{
    const env = setup();
    vm.runInContext(`
        AppState.onboardingCompleted = false;
        applyProgressData({
            programs: AppState.programs, schedule: [], activityLog: {}, achievements: [],
            dailyCount: 0, dailyDate: localDateKey()
        });
    `, env.context);
    assert.equal(vm.runInContext('AppState.onboardingCompleted', env.context), true, 'snapshot v4 legado sem o campo novo não força onboarding novamente');
}
console.log('E08 usuário existente: snapshot sem onboardingCompleted não reabre onboarding (evita regressão de instalação anterior).');

// 6) Instalação nova (sem dado local nenhum) exige onboarding.
{
    const env = setup();
    const readLegacySrc = extractFunction(source, 'readLegacyProgress');
    const parseStoredJsonSrc = extractFunction(source, 'parseStoredJson');
    const loadSavedStateSrc = extractLastFunction(source, 'loadSavedState');
    const readSnapshotSrc = extractFunction(source, 'readProgressSnapshot');
    const validateSnapshotSrc = extractFunction(source, 'validateProgressSnapshot');
    const normalizeHistorySrc = extractFunction(source, 'normalizeSessionHistory');
    const isValidRecordSrc = extractFunction(source, 'isValidSessionRecord');
    const setPersistenceStatusSrc = extractFunction(source, 'setPersistenceStatus');
    vm.runInContext([
        readSnapshotSrc, validateSnapshotSrc, normalizeHistorySrc, isValidRecordSrc,
        parseStoredJsonSrc, readLegacySrc, setPersistenceStatusSrc, loadSavedStateSrc
    ].join('\n'), env.context);
    vm.runInContext('loadSavedState();', env.context);
    assert.equal(vm.runInContext('AppState.onboardingCompleted', env.context), false, 'instalação nova exige onboarding');
}
console.log('E08 instalação limpa: loadSavedState() marca onboardingCompleted=false na primeira execução real.');

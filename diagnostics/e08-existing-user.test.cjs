const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

// E08.2 — Usuário existente pula onboarding obrigatório.
// Regressão de ponta a ponta: exercita loadSavedState() + openOnboardingIfNeeded() reais
// (não apenas applyProgressData isolado) nos três cenários do aceite: instalação limpa,
// usuário existente com snapshot real, e dado parcial/corrompido.

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

const appState = source.slice(source.indexOf('        const AppState = {'), source.indexOf('        const CORE_DATA_VERSION'));
const persistenceStart = source.indexOf('        const CORE_PROGRESS_SNAPSHOT_KEY');
const persistenceEnd = source.indexOf('        // Initialize on load', persistenceStart);
assert(persistenceStart > 0 && persistenceEnd > persistenceStart);

const openOnboardingIfNeeded = extractFunction(source, 'openOnboardingIfNeeded');
const onboardingRenderStep = extractFunction(source, 'onboardingRenderStep');
const onboardingShowStepError = extractFunction(source, 'onboardingShowStepError');
const onboardingFocusLabels = extractBlock(source, source.indexOf('        const ONBOARDING_FOCUS_LABELS = {'), 'ONBOARDING_FOCUS_LABELS');
const localDateKey = extractFunction(source, 'localDateKey');
const weekDateKeys = extractFunction(source, 'weekDateKeys');
const syncDerivedStats = extractFunction(source, 'syncDerivedStats');
const getConfiguredWeeklyTargetDays = extractFunction(source, 'getConfiguredWeeklyTargetDays');
const isStrictNonNegativeInteger = extractFunction(source, 'isStrictNonNegativeInteger');
const isValidReminderTime = extractFunction(source, 'isValidReminderTime');
const isReminderScheduleComplete = extractFunction(source, 'isReminderScheduleComplete');
const synchronizeProgramProgress = extractFunction(source, 'synchronizeProgramProgress');
const applyProgramProgressAdjustment = extractFunction(source, 'applyProgramProgressAdjustment');
const loadSavedState = extractLastFunction(source, 'loadSavedState');

const noopNames = [
    'evaluateAchievements', 'applyProfilePreferences', 'updateHeaderStats', 'renderTodaySummary', 'renderScheduleList', 'renderProgramsList',
    'renderMonthlyBars', 'renderWeeklyChart', 'renderSmartSuggestionCard', 'renderWeeklyTimeSummary',
    'renderAchievements', 'renderMenteHistory', 'renderCorpoHistory', 'updateTimeOfDayStretchRecommendation',
    'updateWeeklyMobilityMetrics', 'updateStretchDurationUI', 'loadCustomPresets', 'updateBreathDurationUI',
    'updateBreathLevelUI', 'updateTimeOfDayRecommendation', 'updateWeeklyCalmMetrics',
    'updatePushNotificationButton', 'syncAllNativeReminders', 'renderCustomPresetsList'
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
    const values = new Map();
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
        hasSystemReminderPermission() { return false; },
        document: { getElementById, activeElement: null, querySelectorAll() { return []; } },
        localStorage: {
            getItem(key) { return values.get(key) ?? null; },
            setItem(key, value) { values.set(key, String(value)); }
        },
        TextEncoder,
        ...Object.fromEntries(noopNames.map(name => [name, () => {}]))
    });
    const src = [
        appState,
        'const CORE_DATA_VERSION = 3;',
        'let onboardingState = { step: 1, focus: null, dailyGoalInput: "", weeklyDaysInput: "" };',
        onboardingFocusLabels, onboardingShowStepError, onboardingRenderStep,
        localDateKey, weekDateKeys, syncDerivedStats, getConfiguredWeeklyTargetDays,
        isStrictNonNegativeInteger, isValidReminderTime, isReminderScheduleComplete,
        synchronizeProgramProgress, applyProgramProgressAdjustment,
        source.slice(persistenceStart, persistenceEnd),
        openOnboardingIfNeeded
    ].join('\n');
    vm.runInContext(src, context);
    return { context, elements, getElementById, values };
}

function onboardingVisible(env) {
    const modal = env.getElementById('onboardingModal');
    return !modal._classes.has('hidden') && modal._classes.has('flex');
}

// 1) Instalação limpa (nenhuma chave local nenhuma) sempre mostra onboarding.
{
    const env = setup();
    vm.runInContext('loadSavedState(); openOnboardingIfNeeded();', env.context);
    assert.equal(vm.runInContext('AppState.onboardingCompleted', env.context), false, 'instalação limpa marca onboarding pendente');
    assert.equal(onboardingVisible(env), true, 'instalação limpa exibe o modal de onboarding');
}
console.log('E08.2 instalação limpa: loadSavedState() real + openOnboardingIfNeeded() exibem onboarding.');

// 2) Usuário existente com snapshot real (v4, válido, contendo onboardingCompleted:true e meta/agenda)
//    abre direto em Hoje, sem onboarding.
{
    const env = setup();
    const today = vm.runInContext('localDateKey()', env.context);
    const programs = JSON.parse(vm.runInContext('JSON.stringify(AppState.programs)', env.context));
    const schedule = JSON.parse(vm.runInContext('JSON.stringify(AppState.schedule)', env.context));
    const snapshot = {
        schemaVersion: 4, revision: 3, savedAt: new Date().toISOString(),
        data: {
            programs, schedule, activityLog: {}, achievements: [],
            dailyDate: today, dailyCount: 0, dailyGoal: 45,
            onboardingCompleted: true, onboardingFocus: 'core', weeklyGoalDays: 5,
            sessionHistory: []
        }
    };
    env.values.set('coreflow_progress_snapshot_v4', JSON.stringify(snapshot));
    vm.runInContext('loadSavedState(); openOnboardingIfNeeded();', env.context);
    assert.equal(vm.runInContext('AppState.onboardingCompleted', env.context), true, 'usuário com meta/agenda salvos não tem onboarding reaberto');
    assert.equal(vm.runInContext('AppState.dailyGoal', env.context), 45, 'meta salva é carregada real');
    assert.equal(onboardingVisible(env), false, 'usuário existente não vê o modal de onboarding');
}
console.log('E08.2 usuário existente: snapshot real (meta/agenda salvos) abre direto em Hoje, sem onboarding.');

// 2b) Usuário existente legado (snapshot v4 válido, mas sem o campo onboardingCompleted,
//     de uma instalação anterior à E08) também não é forçado a repetir onboarding.
{
    const env = setup();
    const today = vm.runInContext('localDateKey()', env.context);
    const programs = JSON.parse(vm.runInContext('JSON.stringify(AppState.programs)', env.context));
    const schedule = JSON.parse(vm.runInContext('JSON.stringify(AppState.schedule)', env.context));
    const legacySnapshot = {
        schemaVersion: 4, revision: 1, savedAt: new Date().toISOString(),
        data: { programs, schedule, activityLog: {}, achievements: [], dailyDate: today, dailyCount: 0 }
    };
    env.values.set('coreflow_progress_snapshot_v4', JSON.stringify(legacySnapshot));
    vm.runInContext('loadSavedState(); openOnboardingIfNeeded();', env.context);
    assert.equal(vm.runInContext('AppState.onboardingCompleted', env.context), true, 'snapshot legado sem o campo novo não reabre onboarding');
    assert.equal(onboardingVisible(env), false, 'usuário existente legado não vê o modal de onboarding');
}
console.log('E08.2 usuário existente legado: snapshot v4 sem onboardingCompleted também abre direto em Hoje.');

// 3) Dado parcial/corrompido: snapshot principal corrompido, sem backup válido e sem legado
//    utilizável — comportamento definido (recoveryRequired), sem travar e sem persistir
//    uma meta substituta, e sem forçar reabertura do onboarding (dado existente não é onboarding pendente).
{
    const env = setup();
    env.values.set('coreflow_progress_snapshot_v4', '{ isso não é json válido');
    env.values.set('coreflow_programs', '{ também corrompido');
    let threw = false;
    let result;
    try {
        result = vm.runInContext('loadSavedState()', env.context);
        vm.runInContext('openOnboardingIfNeeded();', env.context);
    } catch (error) { threw = true; }
    assert.equal(threw, false, 'dado corrompido não pode travar loadSavedState/openOnboardingIfNeeded');
    assert.equal(result, false, 'dado corrompido retorna status de recuperação, não sucesso silencioso');
    assert.equal(vm.runInContext('CorePersistence.status', env.context), 'recoveryRequired', 'dado corrompido sinaliza recoveryRequired');
    assert.equal(vm.runInContext('AppState.dailyGoal', env.context), 30, 'a recuperação mantém apenas o default de runtime original; não aplica nem persiste meta de dado inválido');
    assert.equal(env.values.has('coreflow_progress_snapshot_v4_backup'), false, 'recuperação não cria snapshot/backup substituto a partir de dado inválido');
    assert.equal(onboardingVisible(env), false, 'dado corrompido não força reabertura do onboarding obrigatório');
}
console.log('E08.2 dado corrompido: loadSavedState() não trava, sinaliza recoveryRequired e não força onboarding nem persiste meta substituta.');

// 4) Dado parcial: snapshot ausente, mas legado parcial (algumas chaves presentes, outras ausentes)
//    tem comportamento definido — recuperação sinalizada, sem forçar onboarding em cima de dado real existente.
{
    const env = setup();
    env.values.set('coreflow_data_version', '3');
    env.values.set('coreflow_programs', '[]'); // presente mas incompleto/insuficiente para o contrato
    // coreflow_schedule e coreflow_activity_log ausentes: legado parcial, hasAnyProgress=true (versionRaw presente)
    let threw = false;
    try {
        vm.runInContext('loadSavedState(); openOnboardingIfNeeded();', env.context);
    } catch (error) { threw = true; }
    assert.equal(threw, false, 'dado legado parcial não pode travar');
    assert.equal(vm.runInContext('CorePersistence.status', env.context), 'recoveryRequired', 'legado parcial sinaliza recuperação, não sucesso fabricado');
    assert.equal(onboardingVisible(env), false, 'dado parcial existente não é tratado como instalação nova (não força onboarding)');
}
console.log('E08.2 dado parcial (legado incompleto): recoveryRequired definido, sem travar e sem forçar onboarding.');

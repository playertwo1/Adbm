const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

// E08.3 — Hoje: saudação com nome real/neutro e números derivados do diário real.
// Exercita loadSavedState() real (não apenas applyProgressData isolado) para instalação
// limpa, diário vazio, parcial e populado, cobrindo saudação, streak, minutos e o resumo do dia.

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

// Contrato visual: sem placeholder fixo de nome/streak/minutos no markup da tela Hoje ou no relatório imprimível.
assert(!/Olá, Rafael/.test(source), 'saudação não deve mais fixar o nome Rafael no markup');
assert(!/id="headerStreakCount">5</.test(source), 'badge de streak do header não pode ter valor decorativo 5');
assert(!/id="printStreak"[^>]*>5 Dias/.test(source), 'relatório impresso não pode fixar 5 dias de streak');
assert(!/id="printTime"[^>]*>18 Minutos/.test(source), 'relatório impresso não pode fixar 18 minutos');
assert(!/id="printCompleted"[^>]*>4 \/ 5/.test(source), 'relatório impresso não pode fixar 4/5 concluídos');

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
const synchronizeProgramProgress = extractFunction(source, 'synchronizeProgramProgress');
const applyProgramProgressAdjustment = extractFunction(source, 'applyProgramProgressAdjustment');
const loadSavedState = extractLastFunction(source, 'loadSavedState');
const renderGreeting = extractFunction(source, 'renderGreeting');
const updateHeaderStats = extractFunction(source, 'updateHeaderStats');
const renderTodaySummary = extractFunction(source, 'renderTodaySummary');

const noopNames = [
    'evaluateAchievements', 'renderScheduleList', 'renderProgramsList',
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
        style: {},
        setAttribute(key, value) { el.attributes[key] = value; },
        getAttribute(key) { return el.attributes[key] ?? null; }
    };
    return el;
}

function setup(fixedHour) {
    const elements = new Map();
    const getElementById = id => {
        if (!elements.has(id)) elements.set(id, makeElement(id));
        return elements.get(id);
    };
    const values = new Map();
    const RealDate = Date;
    class FixedDate extends RealDate {
        constructor(...args) {
            if (args.length === 0 && fixedHour !== undefined) {
                super();
                this.setHours(fixedHour, 0, 0, 0);
            } else {
                super(...args);
            }
        }
    }
    const context = vm.createContext({
        console: { log() {} },
        window: {},
        document: { getElementById, activeElement: null, querySelectorAll() { return []; } },
        localStorage: {
            getItem(key) { return values.get(key) ?? null; },
            setItem(key, value) { values.set(key, String(value)); }
        },
        Date: fixedHour === undefined ? RealDate : FixedDate,
        TextEncoder,
        ...Object.fromEntries(noopNames.map(name => [name, () => {}]))
    });
    const src = [
        appState,
        'const CORE_DATA_VERSION = 3;',
        'let onboardingState = { step: 1, focus: null, dailyGoalInput: "", weeklyDaysInput: "" };',
        onboardingFocusLabels, onboardingShowStepError, onboardingRenderStep,
        localDateKey, weekDateKeys, syncDerivedStats, getConfiguredWeeklyTargetDays,
        synchronizeProgramProgress, applyProgramProgressAdjustment,
        source.slice(persistenceStart, persistenceEnd),
        renderGreeting, renderTodaySummary, updateHeaderStats,
        openOnboardingIfNeeded
    ].join('\n');
    vm.runInContext(src, context);
    return { context, elements, getElementById, values };
}

// 1) Instalação limpa: sem diário, sem nome salvo. Saudação neutra (sem nome fabricado),
//    streak e minutos zerados — nenhum número decorativo do mockup (5 dias / 18 min / 4-5).
{
    const env = setup(9); // manhã fixa -> "Bom dia"
    vm.runInContext('loadSavedState();', env.context);
    const greeting = env.getElementById('greetingText').textContent;
    assert.equal(greeting, 'Bom dia!', 'sem nome salvo, saudação usa texto neutro por período do dia, sem "Rafael" fabricado');
    assert.equal(env.getElementById('headerStreakCount').innerText, 0, 'instalação limpa não fabrica streak de 5 dias');
    assert.equal(env.getElementById('todayMinutesValue').textContent, '0', 'instalação limpa não fabrica minutos de hoje');
    assert.equal(env.getElementById('todayGoalProgress').style.width, '0%', 'instalação limpa não fabrica progresso de meta');
}
console.log('E08.3 instalação limpa: saudação neutra e números zerados, sem placeholder do mockup.');

// 2) Usuário existente com nome salvo no perfil (snapshot v4 real) e diário real parcial:
//    saudação usa o nome salvo; minutos/streak vêm do activityLog real, não do valor fixo do mockup.
{
    const env = setup(15); // tarde fixa -> "Boa tarde"
    const today = vm.runInContext('localDateKey()', env.context);
    const programs = JSON.parse(vm.runInContext('JSON.stringify(AppState.programs)', env.context));
    const schedule = JSON.parse(vm.runInContext('JSON.stringify(AppState.schedule)', env.context));
    const yesterday = vm.runInContext(`
        (() => { const d = new Date(); d.setHours(12,0,0,0); d.setDate(d.getDate() - 1); return localDateKey(d); })()
    `, env.context);
    const snapshot = {
        schemaVersion: 4, revision: 5, savedAt: new Date().toISOString(),
        data: {
            programs, schedule,
            activityLog: {
                [today]: { minutes: 12, sessions: 1, sources: { vacuo: 1 } },
                [yesterday]: { minutes: 20, sessions: 2, sources: { vacuo: 2 } }
            },
            achievements: [], dailyDate: today, dailyCount: 1, dailyGoal: 40,
            onboardingCompleted: true, onboardingFocus: 'core', weeklyGoalDays: 5,
            sessionHistory: [], userName: 'Marina'
        }
    };
    env.values.set('coreflow_progress_snapshot_v4', JSON.stringify(snapshot));
    vm.runInContext('loadSavedState();', env.context);
    assert.equal(env.getElementById('greetingText').textContent, 'Boa tarde, Marina', 'nome real salvo é usado na saudação, sem "Rafael" do mockup');
    assert.equal(env.getElementById('todayMinutesValue').textContent, '12', 'minutos de hoje vêm do activityLog real, não do valor fixo do mockup (18)');
    assert.equal(env.getElementById('headerStreakCount').innerText, 2, 'streak é calculado a partir de dias consecutivos reais no diário, não fixado em 5');
    const width = env.getElementById('todayGoalProgress').style.width;
    assert.equal(width, `${Math.round(12 / 40 * 100)}%`, 'barra de progresso reflete minutos/meta reais');
}
console.log('E08.3 usuário existente com diário parcial: saudação com nome real e números derivados do diário.');

// 3) Usuário existente sem nome salvo (snapshot legado, sem o campo userName): saudação neutra,
//    não "Olá, Usuário" fabricado — apenas o texto neutro por período do dia.
{
    const env = setup(20); // noite fixa -> "Boa noite"
    const today = vm.runInContext('localDateKey()', env.context);
    const programs = JSON.parse(vm.runInContext('JSON.stringify(AppState.programs)', env.context));
    const schedule = JSON.parse(vm.runInContext('JSON.stringify(AppState.schedule)', env.context));
    const legacySnapshot = {
        schemaVersion: 4, revision: 1, savedAt: new Date().toISOString(),
        data: { programs, schedule, activityLog: {}, achievements: [], dailyDate: today, dailyCount: 0 }
    };
    env.values.set('coreflow_progress_snapshot_v4', JSON.stringify(legacySnapshot));
    vm.runInContext('loadSavedState();', env.context);
    assert.equal(env.getElementById('greetingText').textContent, 'Boa noite!', 'snapshot legado sem nome usa texto neutro por período, sem "Usuário" fabricado');
    assert.equal(env.getElementById('todayMinutesValue').textContent, '0', 'diário vazio real não herda os 18 minutos do mockup');
    assert.equal(env.getElementById('headerStreakCount').innerText, 0, 'diário vazio real não herda os 5 dias de streak do mockup');
}
console.log('E08.3 usuário legado sem nome: saudação neutra por período, sem número decorativo herdado.');

// 4) Diário populado com múltiplos dias consecutivos: streak reflete exatamente a sequência real.
{
    const env = setup(9);
    const today = vm.runInContext('localDateKey()', env.context);
    const programs = JSON.parse(vm.runInContext('JSON.stringify(AppState.programs)', env.context));
    const schedule = JSON.parse(vm.runInContext('JSON.stringify(AppState.schedule)', env.context));
    const dayKeys = vm.runInContext(`
        (() => {
            const keys = [];
            for (let i = 0; i < 4; i++) { const d = new Date(); d.setHours(12,0,0,0); d.setDate(d.getDate() - i); keys.push(localDateKey(d)); }
            return keys;
        })()
    `, env.context);
    const activityLog = {};
    dayKeys.forEach(key => { activityLog[key] = { minutes: 15, sessions: 1, sources: { vacuo: 1 } }; });
    const snapshot = {
        schemaVersion: 4, revision: 2, savedAt: new Date().toISOString(),
        data: {
            programs, schedule, activityLog, achievements: [], dailyDate: today, dailyCount: 1, dailyGoal: 30,
            onboardingCompleted: true, onboardingFocus: 'core', weeklyGoalDays: 5, sessionHistory: [], userName: 'João'
        }
    };
    env.values.set('coreflow_progress_snapshot_v4', JSON.stringify(snapshot));
    vm.runInContext('loadSavedState();', env.context);
    assert.equal(env.getElementById('headerStreakCount').innerText, 4, 'streak de 4 dias consecutivos reais é exibido, não o valor fixo 5 do mockup');
    assert.equal(env.getElementById('todayMinutesValue').textContent, '15', 'minutos de hoje refletem o diário real populado');
    assert.equal(env.getElementById('greetingText').textContent, 'Bom dia, João', 'nome real salvo continua sendo usado com diário populado');
}
console.log('E08.3 diário populado: streak/minutos exatos do diário real, saudação com nome real.');

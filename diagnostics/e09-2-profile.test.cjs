const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

// E09.2 — Perfil: nome/meta, Tema AMOLED e acessibilidade.
// Regressão escrita antes da implementação: exercita os caminhos públicos,
// persistência no snapshot e efeitos observáveis no DOM.

const root = path.join(__dirname, '..');
const htmlPaths = [
    path.join(root, 'index.html'),
    path.join(root, 'app', 'src', 'main', 'assets', 'index.html')
];

function extractFunction(source, name) {
    const start = source.search(new RegExp(`(?:async\\s+)?function\\s+${name}\\s*\\(`));
    assert(start >= 0, `função ausente: ${name}`);
    const parameterStart = source.indexOf('(', start);
    let parameterDepth = 0;
    let parameterEnd = -1;
    for (let index = parameterStart; index < source.length; index += 1) {
        if (source[index] === '(') parameterDepth += 1;
        if (source[index] === ')' && --parameterDepth === 0) {
            parameterEnd = index;
            break;
        }
    }
    assert(parameterEnd >= 0, `parâmetros incompletos: ${name}`);
    const bodyStart = source.indexOf('{', parameterEnd);
    let depth = 0;
    for (let index = bodyStart; index < source.length; index += 1) {
        if (source[index] === '{') depth += 1;
        if (source[index] === '}' && --depth === 0) return source.slice(start, index + 1);
    }
    throw new Error(`bloco incompleto: ${name}`);
}

function extractLastFunction(source, name) {
    const start = source.lastIndexOf(`function ${name}(`);
    assert(start >= 0, `função ausente: ${name}`);
    const parameterStart = source.indexOf('(', start);
    let parameterDepth = 0;
    let parameterEnd = -1;
    for (let index = parameterStart; index < source.length; index += 1) {
        if (source[index] === '(') parameterDepth += 1;
        if (source[index] === ')' && --parameterDepth === 0) {
            parameterEnd = index;
            break;
        }
    }
    assert(parameterEnd >= 0, `parâmetros incompletos: ${name}`);
    const bodyStart = source.indexOf('{', parameterEnd);
    let depth = 0;
    for (let index = bodyStart; index < source.length; index += 1) {
        if (source[index] === '{') depth += 1;
        if (source[index] === '}' && --depth === 0) return source.slice(start, index + 1);
    }
    throw new Error(`bloco incompleto: ${name}`);
}

function makeElement(id) {
    const element = {
        id,
        value: '',
        innerText: '',
        textContent: '',
        attributes: {},
        style: {
            values: {},
            setProperty(name, value) { this.values[name] = String(value); },
            removeProperty(name) { delete this.values[name]; }
        },
        _classes: new Set(['hidden']),
        classList: {
            add(...names) { names.forEach(name => element._classes.add(name)); },
            remove(...names) { names.forEach(name => element._classes.delete(name)); },
            toggle(name, force) {
                if (force === undefined) {
                    if (element._classes.has(name)) element._classes.delete(name);
                    else element._classes.add(name);
                } else if (force) element._classes.add(name);
                else element._classes.delete(name);
            },
            contains(name) { return element._classes.has(name); }
        },
        setAttribute(name, value) { element.attributes[name] = String(value); },
        getAttribute(name) { return element.attributes[name] ?? null; },
        removeAttribute(name) { delete element.attributes[name]; },
        querySelector() { return null; },
        querySelectorAll() { return []; }
    };
    return element;
}

function setup(source) {
    const elements = new Map();
    const getElementById = id => {
        if (!elements.has(id)) elements.set(id, makeElement(id));
        return elements.get(id);
    };
    const values = new Map();
    const toastLog = [];
    const html = makeElement('html');
    const body = makeElement('body');
    const context = vm.createContext({
        console: { log() {} },
        window: { scrollTo() {} },
        document: {
            documentElement: html,
            body,
            activeElement: null,
            getElementById,
            querySelectorAll() { return []; },
            createElement: makeElement
        },
        localStorage: {
            getItem(key) { return values.get(key) ?? null; },
            setItem(key, value) { values.set(key, String(value)); },
            removeItem(key) { values.delete(key); }
        },
        TextEncoder,
        Date,
        setTimeout() {},
        triggerHaptic() {},
        showInlineToast(message) { toastLog.push(message); },
        renderGreeting() {},
        updateHeaderStats() {},
        renderTodaySummary() {},
        renderProfilePreferences() {},
        ensureAccessibleButtonNames() {},
        renderSmartSuggestionCard() {},
        renderProgramsList() {},
        renderWeeklyChart() {},
        renderMonthlyBars() {},
        renderScheduleList() {},
        renderWeeklyTimeSummary() {},
        renderAchievements() {},
        hasSystemReminderPermission() { return true; },
        isReminderScheduleComplete() { return false; },
        mergeLoadedPrograms() {},
        synchronizeProgramProgress() {},
        normalizeSessionHistory() { return []; },
        renderDailyExecutionUI() {},
        syncAllNativeReminders() {},
        responsivePause: { history: [], historyEnabled: false },
        CorePersistence: { status: 'ready', revision: 0, lastSavedAt: null, completedSessionIds: [], sessionHistory: [] },
        CORE_PROGRESS_SNAPSHOT_KEY: 'coreflow_progress_snapshot_v4',
        CORE_PROGRESS_BACKUP_KEY: 'coreflow_progress_snapshot_v4_backup',
        CORE_DATA_VERSION: 3,
        ACCESSIBILITY_DEFAULTS: Object.freeze({ textScale: 'normal', highContrast: false, reducedMotion: false })
    });

    const appStateStart = source.indexOf('        const AppState = {');
    const appStateEnd = source.indexOf('        const CORE_DATA_VERSION', appStateStart);
    assert(appStateStart >= 0 && appStateEnd > appStateStart, 'AppState ausente');
    const appState = source.slice(appStateStart, appStateEnd);

    const functions = [
        'localDateKey',
        'onboardingValidateGoal',
        'collectProgressData',
        'applyProgressData',
        'normalizeAccessibilityPreferences',
        'isValidReminderTime',
        'reminderTimeAt',
        'applyProfilePreferences',
        'applyThemePreference',
        'applyAccessibilityPreferences',
        'renderProfilePreferences',
        'validateProfileName',
        'clearProfileEditorErrors',
        'openProfileEditor',
        'closeProfileEditor',
        'saveProfileEditor',
        'openAccessibilitySettings',
        'closeAccessibilitySettings',
        'setAccessibilityTextScale',
        'toggleAccessibilityHighContrast',
        'toggleAccessibilityReducedMotion',
        'toggleAmoledTheme'
    ].map(name => extractFunction(source, name));

    const readProgressSnapshot = extractFunction(source, 'readProgressSnapshot');
    const setPersistenceStatus = extractFunction(source, 'setPersistenceStatus');
    const saveStateSource = extractLastFunction(source, 'saveState').replace('function saveState(', 'function saveProgressState(');
    const persistenceHarness = `
        function validateProgressSnapshot(value) {
            return Boolean(value && value.schemaVersion === 4 && Number.isFinite(value.revision) && value.data);
        }
        let persistedData = null;
        function saveState() {
            const result = saveProgressState();
            const raw = localStorage.getItem(CORE_PROGRESS_SNAPSHOT_KEY);
            persistedData = raw ? JSON.parse(raw).data : null;
            return result;
        }
    `;
    vm.runInContext([appState, ...functions, readProgressSnapshot, setPersistenceStatus, saveStateSource, persistenceHarness].join('\n'), context);
    return { context, elements, getElementById, values, html, body, toastLog };
}

const sources = htmlPaths.map(file => fs.readFileSync(file, 'utf8'));
assert.equal(sources[0], sources[1], 'HTML raiz e asset embarcado precisam permanecer idênticos');
const source = sources[0];
const profile = source.slice(source.indexOf('<section id="tab-perfil"'), source.indexOf('</section>', source.indexOf('<section id="tab-perfil"')) + '</section>'.length);
assert.match(profile, /profileNameInput/);
assert.match(profile, /profileDailyGoalInput/);
assert.match(profile, /Salvar/);
assert.match(profile, /Cancelar/);
assert.match(profile, /Tema AMOLED/i);
assert.match(profile, /Acessibilidade/i);

for (const htmlSource of sources) {
    const env = setup(htmlSource);
    vm.runInContext(`
        AppState.userName = 'Ana';
        AppState.dailyGoal = 30;
        AppState.theme = 'standard';
        AppState.accessibility = { textScale: 'normal', highContrast: false, reducedMotion: false };
        renderProfilePreferences();
        openProfileEditor();
    `, env.context);

    // Salvar nome/meta válidos é atômico, fecha o editor e persiste o estado real.
    env.getElementById('profileNameInput').value = 'Marina';
    env.getElementById('profileDailyGoalInput').value = '45';
    vm.runInContext('saveProfileEditor();', env.context);
    assert.equal(vm.runInContext('AppState.userName', env.context), 'Marina');
    assert.equal(vm.runInContext('AppState.dailyGoal', env.context), 45);
    assert.equal(env.getElementById('profileEditorModal').classList.contains('hidden'), true);
    assert.equal(vm.runInContext('persistedData.userName', env.context), 'Marina');
    assert.equal(vm.runInContext('persistedData.dailyGoal', env.context), 45);

    // Valores inválidos mantêm estado anterior, deixam o modal aberto e explicam o erro.
    vm.runInContext('openProfileEditor();', env.context);
    env.getElementById('profileNameInput').value = '   ';
    env.getElementById('profileDailyGoalInput').value = '3';
    vm.runInContext('saveProfileEditor();', env.context);
    assert.equal(vm.runInContext('AppState.userName', env.context), 'Marina');
    assert.equal(vm.runInContext('AppState.dailyGoal', env.context), 45);
    assert.equal(env.getElementById('profileEditorModal').classList.contains('hidden'), false);
    assert.match(env.getElementById('profileNameError').textContent, /nome/i);
    assert.match(env.getElementById('profileGoalError').textContent, /5 e 180/i);

    // Falha de persistência também é transacional: estado e modal permanecem utilizáveis.
    vm.runInContext("openProfileEditor(); CorePersistence.status = 'writeFailed';", env.context);
    env.getElementById('profileNameInput').value = 'Falha';
    env.getElementById('profileDailyGoalInput').value = '60';
    vm.runInContext('saveProfileEditor();', env.context);
    assert.equal(vm.runInContext('AppState.userName', env.context), 'Marina');
    assert.equal(vm.runInContext('AppState.dailyGoal', env.context), 45);
    assert.equal(env.getElementById('profileEditorModal').classList.contains('hidden'), false);
    vm.runInContext("CorePersistence.status = 'ready';", env.context);

    // Cancelar descarta o rascunho e a reabertura usa somente o valor confirmado.
    env.getElementById('profileNameInput').value = 'Rascunho';
    env.getElementById('profileDailyGoalInput').value = '90';
    vm.runInContext('closeProfileEditor(); openProfileEditor();', env.context);
    assert.equal(env.getElementById('profileNameInput').value, 'Marina');
    assert.equal(env.getElementById('profileDailyGoalInput').value, '45');
    assert.equal(vm.runInContext('persistedData.userName', env.context), 'Marina');

    // Tema AMOLED troca a aparência global e sobrevive ao snapshot.
    vm.runInContext('toggleAmoledTheme();', env.context);
    assert.equal(vm.runInContext('AppState.theme', env.context), 'amoled');
    assert.equal(env.html.classList.contains('cf-theme-amoled'), true);
    assert.equal(vm.runInContext('persistedData.theme', env.context), 'amoled');
    vm.runInContext("AppState.theme = 'standard'; applyProfilePreferences({ theme: 'amoled' });", env.context);
    assert.equal(env.html.classList.contains('cf-theme-amoled'), true);
    vm.runInContext("AppState.theme = 'standard'; applyProfilePreferences({ theme: true });", env.context);
    assert.equal(vm.runInContext('AppState.theme', env.context), 'standard', 'tema booleano inválido não fabrica preferência');

    vm.runInContext('toggleAmoledTheme();', env.context);
    assert.equal(vm.runInContext('AppState.theme', env.context), 'amoled');
    // Acessibilidade abre uma área real; cada controle altera a classe/DOM e persiste.
    vm.runInContext('openAccessibilitySettings();', env.context);
    assert.equal(env.getElementById('accessibilitySettingsModal').classList.contains('hidden'), false);
    vm.runInContext("setAccessibilityTextScale('large');", env.context);
    vm.runInContext('toggleAccessibilityHighContrast(); toggleAccessibilityReducedMotion();', env.context);
    assert.equal(env.html.classList.contains('cf-text-large'), true);
    assert.equal(env.body.classList.contains('cf-high-contrast'), true);
    assert.equal(env.html.classList.contains('cf-reduced-motion'), true);
    assert.equal(vm.runInContext('persistedData.accessibility.textScale', env.context), 'large');
    assert.equal(vm.runInContext('persistedData.accessibility.highContrast', env.context), true);
    assert.equal(vm.runInContext('persistedData.accessibility.reducedMotion', env.context), true);

    // Restore/restart reaplica somente preferências válidas persistidas.
    vm.runInContext("AppState.theme = 'standard'; AppState.accessibility = { textScale: 'normal', highContrast: false, reducedMotion: false }; applyProgressData(persistedData); applyProfilePreferences();", env.context);
    assert.equal(vm.runInContext('AppState.theme', env.context), 'amoled');
    assert.equal(env.html.classList.contains('cf-theme-amoled'), true);
    assert.equal(env.html.classList.contains('cf-text-large'), true);
    assert.equal(env.body.classList.contains('cf-high-contrast'), true);
    assert.equal(env.html.classList.contains('cf-reduced-motion'), true);

    // Ausência/corrupção restaura defaults neutros; nunca herda uma preferência anterior.
    vm.runInContext("AppState.theme = 'amoled'; AppState.accessibility = { textScale: 'large', highContrast: true, reducedMotion: true }; applyProgressData({ theme: true, accessibility: { textScale: 'giant', highContrast: 'yes', reducedMotion: 1 } }); applyProfilePreferences();", env.context);
    assert.equal(vm.runInContext('AppState.theme', env.context), 'standard');
    assert.equal(vm.runInContext('AppState.accessibility.textScale', env.context), 'normal');
    assert.equal(vm.runInContext('AppState.accessibility.highContrast', env.context), false);
    assert.equal(vm.runInContext('AppState.accessibility.reducedMotion', env.context), false);
    assert.equal(env.html.classList.contains('cf-theme-amoled'), false);
    assert.equal(env.html.classList.contains('cf-text-large'), false);
    assert.equal(env.body.classList.contains('cf-high-contrast'), false);
    assert.equal(env.html.classList.contains('cf-reduced-motion'), false);

    vm.runInContext("AppState.accessibility = { textScale: 'normal', highContrast: false, reducedMotion: false }; applyProfilePreferences({ accessibility: { textScale: 'giant', highContrast: 'yes', reducedMotion: 1 } });", env.context);
    assert.equal(vm.runInContext('AppState.accessibility.textScale', env.context), 'normal');
    assert.equal(vm.runInContext('AppState.accessibility.highContrast', env.context), false);
    assert.equal(vm.runInContext('AppState.accessibility.reducedMotion', env.context), false);
}

console.log('E09.2 Perfil: nome/meta, Tema AMOLED e acessibilidade com salvar/cancelar, efeito observável e persistência verificados.');

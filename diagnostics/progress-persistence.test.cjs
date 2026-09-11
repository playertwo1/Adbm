const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const html = fs.readFileSync(path.join(__dirname, '..', 'app', 'src', 'main', 'assets', 'index.html'), 'utf8');
function extractFunction(name) {
    const start = html.indexOf(`        function ${name}(`);
    assert(start >= 0, `Função ausente: ${name}`);
    let depth = 0, opened = false;
    for (let index = html.indexOf('{', start); index < html.length; index++) {
        if (html[index] === '{') { depth++; opened = true; }
        if (html[index] === '}' && opened && --depth === 0) return html.slice(start, index + 1);
    }
    throw new Error(`Função incompleta: ${name}`);
}
const appState = html.slice(html.indexOf('        const AppState = {'), html.indexOf('        const CORE_DATA_VERSION'));
const persistenceStart = html.indexOf('        const CORE_PROGRESS_SNAPSHOT_KEY');
const persistenceEnd = html.indexOf('        // Initialize on load', persistenceStart);
assert(persistenceStart > 0 && persistenceEnd > persistenceStart);
const source = [
    appState,
    'const CORE_DATA_VERSION = 3;',
    extractFunction('localDateKey'), extractFunction('weekDateKeys'), extractFunction('syncDerivedStats'),
    html.slice(persistenceStart, persistenceEnd)
].join('\n');
const noopNames = [
    'evaluateAchievements', 'updateHeaderStats', 'renderScheduleList', 'renderProgramsList',
    'renderMonthlyBars', 'renderWeeklyChart', 'renderSmartSuggestionCard', 'renderWeeklyTimeSummary',
    'renderAchievements', 'renderMenteHistory', 'renderCorpoHistory', 'updateTimeOfDayStretchRecommendation',
    'updateWeeklyMobilityMetrics', 'updateStretchDurationUI', 'loadCustomPresets', 'updateBreathDurationUI',
    'updateBreathLevelUI', 'updateTimeOfDayRecommendation', 'updateWeeklyCalmMetrics',
    'updatePushNotificationButton', 'syncAllNativeReminders'
];

function setup({ failReadOnce = false, failSnapshotWrite = false, nativeCurrent = null } = {}) {
    const values = new Map();
    let reads = 0;
    const context = vm.createContext({
        console: { log() {} },
        document: { getElementById() { return null; } },
        window: nativeCurrent === null ? {} : { AndroidBridge: { getProgressSnapshot() { return nativeCurrent; } } },
        localStorage: {
            getItem(key) {
                if (failReadOnce && reads++ === 0) throw new Error('falha de leitura simulada');
                return values.get(key) ?? null;
            },
            setItem(key, value) {
                if (failSnapshotWrite && key === 'coreflow_progress_snapshot_v4') throw new Error('quota simulada');
                values.set(key, String(value));
            }
        },
        ...Object.fromEntries(noopNames.map(name => [name, () => {}]))
    });
    vm.runInContext(source, context);
    const today = vm.runInContext('localDateKey()', context);
    const programs = JSON.parse(vm.runInContext('JSON.stringify(AppState.programs)', context));
    programs.forEach(program => { program.currentPhaseIndex = 2; program.daysCompletedInPhase = 3; program.sessionsToday = 1; });
    const schedule = JSON.parse(vm.runInContext('JSON.stringify(AppState.schedule)', context));
    schedule.forEach(item => { item.completed = true; });
    const log = { [today]: { minutes: 30, sessions: 3, sources: { program: 3 } } };
    return { context, values, today, programs, schedule, log };
}
function seedLegacy(env) {
    env.values.set('coreflow_data_version', '3');
    env.values.set('coreflow_daily_date', env.today);
    env.values.set('coreflow_programs', JSON.stringify(env.programs));
    env.values.set('coreflow_schedule', JSON.stringify(env.schedule));
    env.values.set('coreflow_activity_log', JSON.stringify(env.log));
    env.values.set('coreflow_achievements', '[]');
}
function result(env) {
    return vm.runInContext(`({
        status: CorePersistence.status,
        phase: AppState.programs[0].currentPhaseIndex,
        days: AppState.programs[0].daysCompletedInPhase,
        sessions: AppState.programs[0].sessionsToday,
        minutes: AppState.activityLog[localDateKey()]?.minutes || 0
    })`, env.context);
}

{
    const env = setup(); seedLegacy(env);
    assert.equal(vm.runInContext('loadSavedState()', env.context), true);
    assert.deepEqual({ ...result(env) }, { status: 'ready', phase: 2, days: 3, sessions: 1, minutes: 30 });
    assert.ok(env.values.has('coreflow_progress_snapshot_v4'), 'legado válido deve migrar para snapshot');
}
for (const damagedKey of ['coreflow_schedule', 'coreflow_programs', 'coreflow_activity_log']) {
    const env = setup(); seedLegacy(env);
    const originalPrograms = env.values.get('coreflow_programs');
    const originalLog = env.values.get('coreflow_activity_log');
    env.values.set(damagedKey, '{');
    assert.equal(vm.runInContext('loadSavedState()', env.context), false);
    assert.equal(result(env).status, 'recoveryRequired');
    assert.equal(env.values.get('coreflow_programs'), damagedKey === 'coreflow_programs' ? '{' : originalPrograms);
    assert.equal(env.values.get('coreflow_activity_log'), damagedKey === 'coreflow_activity_log' ? '{' : originalLog);
    assert.equal(env.values.has('coreflow_progress_snapshot_v4'), false, 'não deve criar snapshot de estado parcial');
}
{
    const env = setup({ failReadOnce: true }); seedLegacy(env);
    const originalPrograms = env.values.get('coreflow_programs');
    assert.equal(vm.runInContext('loadSavedState()', env.context), false);
    assert.equal(result(env).status, 'recoveryRequired');
    assert.equal(env.values.get('coreflow_programs'), originalPrograms);
}
{
    const env = setup(); seedLegacy(env); env.values.delete('coreflow_data_version');
    assert.equal(vm.runInContext('loadSavedState()', env.context), true);
    assert.deepEqual({ ...result(env) }, { status: 'ready', phase: 2, days: 3, sessions: 1, minutes: 30 });
}
{
    const env = setup(); seedLegacy(env);
    vm.runInContext('loadSavedState()', env.context);
    const valid = env.values.get('coreflow_progress_snapshot_v4');
    env.values.set('coreflow_progress_snapshot_v4_backup', valid);
    env.values.set('coreflow_progress_snapshot_v4', '{');
    vm.runInContext('AppState.programs[0].currentPhaseIndex = 0; AppState.activityLog = {};', env.context);
    assert.equal(vm.runInContext('loadSavedState()', env.context), true);
    assert.equal(result(env).phase, 2);
    assert.equal(result(env).minutes, 30);
    assert.equal(JSON.parse(env.values.get('coreflow_progress_snapshot_v4')).data.programs[0].currentPhaseIndex, 2);
}
{
    const env = setup({ failSnapshotWrite: true }); seedLegacy(env);
    assert.equal(vm.runInContext('loadSavedState()', env.context), true);
    assert.equal(result(env).status, 'writeFailed');
    assert.equal(env.values.get('coreflow_programs'), JSON.stringify(env.programs), 'falha do snapshot não deve sobrescrever legado');
}
{
    const seed = setup(); seedLegacy(seed);
    vm.runInContext('loadSavedState()', seed.context);
    const validLocal = seed.values.get('coreflow_progress_snapshot_v4');
    const env = setup({ nativeCurrent: '{' });
    env.values.set('coreflow_progress_snapshot_v4', validLocal);
    assert.equal(vm.runInContext('loadSavedState()', env.context), true);
    assert.equal(result(env).phase, 2, 'snapshot web íntegro deve recuperar uma cópia nativa inválida');
}

assert.match(html, /addMinutesToday\(trainedMinutes,[\s\S]{0,120}, true\);/);
assert.match(html, /addMinutesToday\(Math\.max\(1, Math\.round[\s\S]{0,180}, \[\], true\);/);
console.log('Persistência segura: 9 cenários passaram.');

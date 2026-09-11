// Reproduz o comportamento real do HTML com armazenamento inteiramente fictício.
// Não inicia o app, não acessa o celular e não modifica os arquivos do projeto.
// Execute: node diagnostics/progress-loss-repro.cjs
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const appState = html.slice(html.indexOf('        const AppState = {'), html.indexOf('        const CORE_DATA_VERSION'));
function extract(name) {
    const start = html.indexOf(`        function ${name}(`);
    assert(start >= 0, `Função ausente: ${name}`);
    const end = html.indexOf('\n        }', start);
    assert(end > start);
    return html.slice(start, end + '\n        }'.length);
}
const code = appState + '\nconst CORE_DATA_VERSION = 3;\n' +
    ['localDateKey', 'weekDateKeys', 'syncDerivedStats', 'loadSavedState', 'saveState'].map(extract).join('\n');
const noopNames = [
    'evaluateAchievements', 'updateHeaderStats', 'renderScheduleList', 'renderProgramsList',
    'renderMonthlyBars', 'renderWeeklyChart', 'renderSmartSuggestionCard', 'renderWeeklyTimeSummary',
    'renderAchievements', 'renderMenteHistory', 'renderCorpoHistory', 'updateTimeOfDayStretchRecommendation',
    'updateWeeklyMobilityMetrics', 'updateStretchDurationUI', 'loadCustomPresets', 'updateBreathDurationUI',
    'updateBreathLevelUI', 'updateTimeOfDayRecommendation', 'updateWeeklyCalmMetrics',
    'updatePushNotificationButton', 'syncAllNativeReminders'
];
function scenario(name, mutate, readFailure) {
    const values = new Map();
    const logs = [];
    let reads = 0;
    const context = vm.createContext({
        console: { log: (...args) => logs.push(String(args[0])) },
        localStorage: {
            getItem(key) {
                if (readFailure && ++reads === 1) throw new Error('Leitura temporariamente indisponível (simulada)');
                return values.get(key) ?? null;
            },
            setItem: (key, value) => values.set(key, String(value))
        },
        ...Object.fromEntries(noopNames.map(key => [key, () => {}]))
    });
    vm.runInContext(code, context);
    const date = vm.runInContext('localDateKey()', context);
    const previousDate = vm.runInContext('localDateKey(new Date(Date.now() - 86400000))', context);
    const programs = JSON.parse(vm.runInContext('JSON.stringify(AppState.programs)', context));
    for (const p of programs) { p.currentPhaseIndex = 2; p.daysCompletedInPhase = 3; p.sessionsToday = 1; }
    const schedule = JSON.parse(vm.runInContext('JSON.stringify(AppState.schedule)', context));
    schedule.forEach(item => { item.completed = true; });
    values.set('coreflow_data_version', '3');
    values.set('coreflow_daily_date', date);
    values.set('coreflow_schedule', JSON.stringify(schedule));
    values.set('coreflow_programs', JSON.stringify(programs));
    values.set('coreflow_activity_log', JSON.stringify({
        [previousDate]: { minutes: 20, sessions: 2 }, [date]: { minutes: 30, sessions: 3 }
    }));
    values.set('coreflow_achievements', '[]');
    mutate(values, previousDate);
    vm.runInContext('loadSavedState()', context);
    const loaded = JSON.parse(values.get('coreflow_programs'));
    const result = {
        scenario: name,
        programPhase: loaded[0].currentPhaseIndex,
        programDays: loaded[0].daysCompletedInPhase,
        sessionsToday: loaded[0].sessionsToday,
        activityDays: Object.keys(JSON.parse(values.get('coreflow_activity_log'))).length,
        completedSchedule: JSON.parse(values.get('coreflow_schedule')).filter(item => item.completed).length,
        logs
    };
    console.log(JSON.stringify(result));
    return result;
}
const healthy = scenario('controle: reabrir no mesmo dia', () => {});
assert.equal(healthy.programPhase, 2);
assert.equal(healthy.activityDays, 2);
assert.equal(healthy.sessionsToday, 1);
const badSchedule = scenario('JSON inválido apenas no cronograma', m => m.set('coreflow_schedule', '{'));
assert.equal(badSchedule.programPhase, 0);
assert.equal(badSchedule.activityDays, 0);
const badLog = scenario('JSON inválido apenas no diário de atividades', m => m.set('coreflow_activity_log', '{'));
assert.equal(badLog.programPhase, 0);
assert.equal(badLog.activityDays, 0);
const failedRead = scenario('falha transitória na primeira leitura; escrita disponível', () => {}, true);
assert.equal(failedRead.programPhase, 0);
assert.equal(failedRead.activityDays, 0);
const badPrograms = scenario('JSON inválido apenas nos programas', m => m.set('coreflow_programs', '{'));
assert.equal(badPrograms.programPhase, 0);
assert.equal(badPrograms.activityDays, 2);
const missingVersion = scenario('versão ausente com diário e programas íntegros', m => m.delete('coreflow_data_version'));
assert.equal(missingVersion.activityDays, 0);
assert.equal(missingVersion.programPhase, 2);
const newDay = scenario('virada normal de dia', (m, yesterday) => m.set('coreflow_daily_date', yesterday));
assert.equal(newDay.programPhase, 2);
assert.equal(newDay.activityDays, 2);
assert.equal(newDay.sessionsToday, 0);
assert.equal(newDay.completedSchedule, 0);
console.log('7 cenários reproduzidos. As asserções documentam defeitos atuais, não critérios de aprovação de uma correção.');

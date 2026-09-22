const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

// E08.6 — Hoje: the displayed recommendation must start the exact displayed
// program/phase/session; shortcuts must only open their real modules; profile
// and reminder controls must route to the implemented destinations.
const root = path.join(__dirname, '..');
const files = [
    path.join(root, 'index.html'),
    path.join(root, 'app', 'src', 'main', 'assets', 'index.html')
];
const sources = files.map(file => fs.readFileSync(file, 'utf8'));
assert.equal(sources[0], sources[1], 'HTML raiz e asset embarcado precisam permanecer idênticos');
const source = sources[0];

function extractFunction(name) {
    const start = source.indexOf(`        function ${name}(`) >= 0
        ? source.indexOf(`        function ${name}(`)
        : source.indexOf(`        async function ${name}(`);
    assert(start >= 0, `Função ausente: ${name}`);
    let depth = 0;
    let opened = false;
    for (let index = source.indexOf('{', start); index < source.length; index += 1) {
        if (source[index] === '{') { depth += 1; opened = true; }
        if (source[index] === '}' && opened && --depth === 0) return source.slice(start, index + 1);
    }
    throw new Error(`Função incompleta: ${name}`);
}

assert.match(source, /onclick="switchTab\('perfil'\)"[^>]*aria-label="Abrir Perfil"/, 'avatar deve abrir Perfil real');
assert.match(source, /onclick="openTodayReminderConfig\(\)"[^>]*aria-label="Configurar lembretes"/, 'sino deve abrir configuração de lembretes');
for (const shortcut of ['vacuo', 'pausa', 'kegel', 'meditar', 'discreto']) {
    assert.match(source, new RegExp(`openTodayShortcut\\('${shortcut}'\\)`), `atalho ${shortcut} deve existir em Hoje`);
}

assert.match(source, /async function saveReminderConfig\(\)[\s\S]*?await requestSystemReminderPermission\(\)[\s\S]*?prog\.remindersEnabled = enabled;/, 'salvar lembrete deve depender da permissão real antes de marcar ativo');
assert.match(source, /const activeCount = hasPermission \? enabledCount : 0;/, 'permissão negada não pode aparecer como lembrete ativo');
assert.match(source, /notificationBanner.*class="hidden/, 'banner de notificação deve iniciar oculto até confirmar estado real');
assert.match(source, /const activePrograms = AppState\.programs\.filter\(program => program\.remindersEnabled === true && isReminderScheduleComplete\(program\)\);/, 'banner deve considerar somente programas com horários completos e válidos');
assert.match(source, /const enabled = hasRealSchedule && prog\.remindersEnabled === true && hasSystemReminderPermission\(\);/, 'sincronismo nativo deve bloquear agendamento sem permissão');
assert.match(source, /const t1 = document\.getElementById\('reminderTimeInput1'\)\.value;[\s\S]*?const t2 = document\.getElementById\('reminderTimeInput2'\)\.value;[\s\S]*?if \(requestedEnabled && \(!isValidReminderTime\(t1\) \|\| \(targetSessions > 1 && !isValidReminderTime\(t2\)\)\)\)/, 'salvar lembrete deve rejeitar horário vazio ou inválido sem fabricar valor');
assert.match(source, /function isValidReminderTime\(value\)[\s\S]*?return typeof value === 'string'/, 'horários devem usar validador HH:mm');
assert.match(source, /function toggleSmartMiddayReminder\(\)[\s\S]*?hasSystemReminderPermission\(\)/, 'smart reminder deve depender da permissão real');
assert.match(source, /function onNativeReminderPermissionChanged\(granted\)[\s\S]*?saveState\(\)[\s\S]*?syncAllNativeReminders\(\)/, 'revogação em foreground deve atualizar estado e cancelar nativo');
assert.doesNotMatch(source, /value \|\| '09:00'/, 'não deve fabricar horário 09:00');
assert.doesNotMatch(source, /value \|\| '16:00'/, 'não deve fabricar horário 16:00');
assert.match(source, /if \(!hasSystemReminderPermission\(\)\) \{[\s\S]*?Notificações do sistema não estão autorizadas/, 'teste de notificação deve refletir permissão negada');
const nativeBridge = fs.readFileSync(path.join(root, 'app', 'src', 'main', 'java', 'com', 'example', 'MainActivity.kt'), 'utf8');
assert.match(nativeBridge, /override fun onResume\(\)[\s\S]*?ReminderScheduler\.rescheduleAll\(this\)[\s\S]*?onNativeReminderPermissionChanged/, 'retorno ao foreground deve revalidar e notificar a UI');
assert.match(nativeBridge, /fun requestReminderPermission\(\): Boolean[\s\S]*?requestNotificationPermission\(activity\)/, 'bridge Android deve solicitar POST_NOTIFICATIONS quando ainda não concedida');
assert.match(nativeBridge, /val effectiveEnabled = enabled && permissionGranted && ReminderScheduler\.isValidTime\(time1\)[\s\S]*?ReminderScheduler\.isValidTime\(time2\)/, 'bridge Android deve rejeitar horários inválidos sem fallback');
const nativeScheduler = fs.readFileSync(path.join(root, 'app', 'src', 'main', 'java', 'com', 'example', 'ReminderScheduler.kt'), 'utf8');
assert.match(nativeScheduler, /val permissionGranted = hasEffectiveNotificationPermission\(context\)/, 'scheduler nativo deve verificar permissão efetiva ao restaurar');
assert.match(nativeScheduler, /fun hasEffectiveNotificationPermission\(context: Context\): Boolean[\s\S]*?areNotificationsEnabled\(\)[\s\S]*?IMPORTANCE_NONE/, 'scheduler deve considerar permissão runtime, app e canal');
assert.match(nativeScheduler, /fun isValidTime\(value: String\)[\s\S]*?Regex\("\^\\\\d\{2\}:\\\\d\{2\}\$"\)/, 'scheduler deve validar HH:mm sem fallback');
assert.match(nativeScheduler, /scheduleMindSmartReminder[\s\S]*?hasEffectiveNotificationPermission\(context\)[\s\S]*?isValidTime\(timeStr\)/, 'smart reminder nativo deve bloquear permissão e horário inválidos');

assert.match(nativeScheduler, /fun scheduleSnooze\([\s\S]*?if \(!hasEffectiveNotificationPermission\(context\)\) return/, 'adiar não pode rearmar alarme sem permissão');
assert.match(nativeScheduler, /fun handleFire\([\s\S]*?if \(!hasEffectiveNotificationPermission\(context\)\) \{[\s\S]*?putBoolean\(key\(programId, "enabled"\), false\)/, 'disparo após revogação deve cancelar e desativar o programa');
assert.match(nativeScheduler, /fun cancelProgram\([\s\S]*?0\.\.720[\s\S]*?action = ACTION_FIRE/, 'revogação deve cancelar sonezas pendentes do programa pelo mesmo tipo de alarme');
assert.match(nativeScheduler, /scheduleAlarm\(context, programId, title, sessionNumber, triggerAt, true, safeMinutes\)/, 'soneza deve carregar sua duração até a identidade do alarme');
assert.match(nativeScheduler, /if \(snooze\) snoozeRequestCode\(programId, session, snoozeMinutes\) else dailyRequestCode\(programId, session\)/, 'cancelamento deve usar a mesma identidade determinística da soneza');
assert.match(nativeScheduler, /val request = if \(snooze\)[\s\S]*?action = ACTION_FIRE/, 'alarme de soneza deve ser cancelável pelo mesmo ACTION_FIRE');
assert.match(nativeScheduler, /val enabled = prefs\.getBoolean\("mind_reminder_enabled", false\)[\s\S]*?shouldPublishMindReminder\(enabled, time, hasEffectiveNotificationPermission\(context\)\)/, 'smart reminder stale deve validar opt-in antes de publicar');
assert.match(nativeScheduler, /fun showMindSmartNotification\(context: Context\)[\s\S]*?cancelMindSmartReminder\(context\)[\s\S]*?return/, 'smart reminder desativado deve cancelar e não publicar');

const sourceForVm = [
    extractFunction('isValidReminderTime'),
    extractFunction('isStrictNonNegativeInteger'),
    extractFunction('isReminderScheduleComplete'),
    extractFunction('toggleSmartMiddayReminder'),
    extractFunction('onNativeReminderPermissionChanged'),
    extractFunction('openTodayRecommendationSession'),
    extractFunction('openTodayShortcut'),
    extractFunction('openTodayReminderConfig')
].join('\n');

const calls = [];
const programs = [
    { id: '1', title: 'Bracing', currentPhaseIndex: 2, dailyTarget: 3, sessionsToday: 1, phases: [{}, {}, {}] },
    { id: '2', title: 'Kegel', currentPhaseIndex: 0, dailyTarget: 2, sessionsToday: 0, phases: [{}] }
];
const context = vm.createContext({
    AppState: { programs, mente: { smartReminderEnabled: false }, pushNotificationsEnabled: false, programDetailState: { programId: '1' } },
    hasSystemReminderPermission() { return false; },
    requestSystemReminderPermission() { return false; },
    updateSmartMiddayReminderUI() {},
    updatePushNotificationButton() {},
    saveState() { calls.push(['save']); },
    syncAllNativeReminders() { calls.push(['sync']); },
    document: { getElementById() { return null; } },
    triggerHaptic() {},
    showInlineToast(message) { calls.push(['toast', message]); },
    switchTab(tab) { calls.push(['tab', tab]); },
    setDeskMode(mode) { calls.push(['desk', mode]); },
    openMindfulnessAudioModal() { calls.push(['mindfulness']); },
    openDailyExecutionModal(...args) { calls.push(['session', ...args]); },
    selectTodayRecommendedProgram() { return { program: programs[0] }; },
    openReminderConfigModal(id) { calls.push(['reminder', id]); }
});
vm.runInContext(sourceForVm, context);

assert.equal(vm.runInContext("isValidReminderTime('09:30')", context), true, 'horário HH:mm válido deve ser aceito');
assert.equal(vm.runInContext("isValidReminderTime('garbage')", context), false, 'horário inválido deve ser rejeitado');
assert.equal(vm.runInContext("isReminderScheduleComplete({ dailyTarget: 2, reminderTimes: ['garbage', '16:00'] })", context), false, 'horário inválido não pode ativar o banner');
assert.equal(vm.runInContext("isReminderScheduleComplete({ dailyTarget: 2, reminderTimes: ['08:00', '16:00'] })", context), true, 'dois horários válidos completam a agenda');
vm.runInContext('toggleSmartMiddayReminder()', context);
assert.equal(context.AppState.mente.smartReminderEnabled, false, 'smart reminder negado não pode aparecer ativo');
context.AppState.programs.forEach(program => { program.remindersEnabled = true; program.reminderTimes = ['08:00', '16:00']; });
context.AppState.pushNotificationsEnabled = true;
calls.length = 0;
vm.runInContext('onNativeReminderPermissionChanged(false)', context);
assert.equal(context.AppState.pushNotificationsEnabled, false, 'revogação deve desativar o estado global de push');
assert.ok(context.AppState.programs.every(program => program.remindersEnabled === false), 'revogação deve desativar programas');
assert.deepEqual(calls.filter(call => call[0] === 'sync'), [['sync']], 'revogação deve sincronizar o cancelamento nativo');

vm.runInContext("openTodayRecommendationSession('1', 2, 2)", context);
assert.deepEqual(calls.pop(), ['session', '1', 2, 2], 'Começar agora deve preservar programa, etapa e sessão exibidos');
vm.runInContext("openTodayRecommendationSession('1', 5, 2)", context);
assert.equal(calls.pop()[0], 'toast', 'etapa exibida inválida não pode abrir outra etapa');
vm.runInContext("openTodayRecommendationSession('1', 2, 4)", context);
assert.equal(calls.pop()[0], 'toast', 'sessão acima da meta diária não pode sofrer clamp silencioso');

const expectedShortcuts = {
    vacuo: [['tab', 'vacuo']],
    pausa: [['tab', 'pausas']],
    kegel: [['tab', 'discreto'], ['desk', 'kegel-velocidade']],
    meditar: [['mindfulness']],
    discreto: [['tab', 'discreto']]
};
for (const [shortcut, expected] of Object.entries(expectedShortcuts)) {
    calls.length = 0;
    vm.runInContext(`openTodayShortcut('${shortcut}')`, context);
    assert.deepEqual(calls, expected, `atalho ${shortcut} deve abrir somente o módulo real correspondente`);
}

calls.length = 0;
vm.runInContext('openTodayReminderConfig()', context);
assert.deepEqual(calls, [['reminder', '1']], 'lembrete deve configurar o programa realmente recomendado');
context.AppState.programDetailState = null;
context.selectTodayRecommendedProgram = () => ({ program: null });
calls.length = 0;
vm.runInContext('openTodayReminderConfig()', context);
assert.deepEqual(calls, [['tab', 'programas'], ['toast', 'Escolha um programa antes de configurar lembretes.']], 'sem programa, lembrete não pode fabricar configuração');

console.log('E08.6 Hoje controls: OK');

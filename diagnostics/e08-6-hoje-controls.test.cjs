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
    const start = source.indexOf(`        function ${name}(`);
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
assert.match(source, /const activePrograms = AppState\.programs\.filter\(program => program\.remindersEnabled === true && Array\.isArray\(program\.reminderTimes\)/, 'banner deve considerar somente programas com horários reais');
assert.match(source, /const enabled = hasRealSchedule && prog\.remindersEnabled === true && hasSystemReminderPermission\(\);/, 'sincronismo nativo deve bloquear agendamento sem permissão');
assert.match(source, /const t1 = document\.getElementById\('reminderTimeInput1'\)\.value;[\s\S]*?const t2 = document\.getElementById\('reminderTimeInput2'\)\.value;[\s\S]*?if \(requestedEnabled && \(!t1 \|\| \(targetSessions > 1 && !t2\)\)\)/, 'salvar lembrete deve rejeitar horário vazio sem fabricar valor');
assert.doesNotMatch(source, /value \|\| '09:00'/, 'não deve fabricar horário 09:00');
assert.doesNotMatch(source, /value \|\| '16:00'/, 'não deve fabricar horário 16:00');
assert.match(source, /if \(!hasSystemReminderPermission\(\)\) \{[\s\S]*?Notificações do sistema não estão autorizadas/, 'teste de notificação deve refletir permissão negada');
const nativeBridge = fs.readFileSync(path.join(root, 'app', 'src', 'main', 'java', 'com', 'example', 'MainActivity.kt'), 'utf8');
assert.match(nativeBridge, /fun requestReminderPermission\(\): Boolean[\s\S]*?requestNotificationPermission\(activity\)/, 'bridge Android deve solicitar POST_NOTIFICATIONS quando ainda não concedida');
assert.match(nativeBridge, /val effectiveEnabled = enabled && permissionGranted && time1\.isNotBlank\(\) && \(targetSessions <= 1 \|\| time2\.isNotBlank\(\)\)/, 'bridge Android não pode persistir lembrete ativo sem permissão ou horários');
const nativeScheduler = fs.readFileSync(path.join(root, 'app', 'src', 'main', 'java', 'com', 'example', 'ReminderScheduler.kt'), 'utf8');
assert.match(nativeScheduler, /val permissionGranted = Build\.VERSION\.SDK_INT < Build\.VERSION_CODES\.TIRAMISU/, 'scheduler nativo deve verificar permissão ao restaurar');
assert.match(nativeScheduler, /if \(!permissionGranted\) \{[\s\S]*?putBoolean\(key\(programId, "enabled"\), false\)/, 'scheduler nativo deve cancelar e desativar quando permissão for negada');

const sourceForVm = [
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
    AppState: { programs, programDetailState: { programId: '1' } },
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

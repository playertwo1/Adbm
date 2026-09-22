const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'app', 'src', 'main', 'assets', 'index.html'), 'utf8');

function extractFunctionFrom(source, name) {
    const start = source.indexOf(`        function ${name}(`);
    assert(start >= 0, `Função ausente: ${name}`);
    let depth = 0, opened = false;
    for (let index = source.indexOf('{', start); index < source.length; index++) {
        if (source[index] === '{') { depth++; opened = true; }
        if (source[index] === '}' && opened && --depth === 0) return source.slice(start, index + 1);
    }
    throw new Error(`Função incompleta: ${name}`);
}

function extractFunction(name) {
    return extractFunctionFrom(html, name);
}

const appState = html.slice(html.indexOf('        const AppState = {'), html.indexOf('        const CORE_DATA_VERSION'));
const persistenceStart = html.indexOf('        const CORE_PROGRESS_SNAPSHOT_KEY');
const persistenceEnd = html.indexOf('        // Initialize on load', persistenceStart);
assert(persistenceStart > 0 && persistenceEnd > persistenceStart);

const source = [
    appState,
    'const CORE_DATA_VERSION = 3;',
    extractFunction('localDateKey'), extractFunction('weekDateKeys'), extractFunction('syncDerivedStats'),
    extractFunction('getConfiguredWeeklyTargetDays'),
    extractFunction('isStrictNonNegativeInteger'),
    extractFunction('isValidReminderTime'),
    extractFunction('synchronizeProgramProgress'),
    extractFunction('selectHeroProgram'),
    extractFunction('renderProgramsListEmptyState'),
    extractFunction('renderProgramsListErrorState'),
    extractFunction('renderProgramsList'),
    extractFunction('toggleProgramExpand'),
    extractFunction('openProgramDetail'),
    extractFunction('startHeroWorkout'),
    extractFunction('repeatProgramPhase'),
    extractFunction('toggleProgramPhase'),
    extractFunction('getProgramExerciseDetails'),
    extractFunction('renderProgramExerciseDetail'),
    extractFunction('openProgramExerciseDetail'),
    extractFunction('applyProgramProgressAdjustment'),
    extractFunction('getProgramSteps'),
    extractFunction('getProgramSchedule'),
    extractFunction('renderProgramWeeklyAgendaLabel'),
    extractFunction('renderMindfulnessProgramCard'),
    extractFunction('openDailyExecutionModal'),
    extractFunction('renderDailyExecutionUI'),
    extractFunction('formatDailyTime'),
    html.slice(persistenceStart, persistenceEnd)
].join('\n');

function extractAssignedFunctionFrom(source, name) {
    const start = source.indexOf(`window.${name} = function(`);
    assert(start >= 0, `Função atribuída ausente: ${name}`);
    const bodyStart = source.indexOf('{', start);
    let depth = 0;
    for (let index = bodyStart; index < source.length; index += 1) {
        if (source[index] === '{') depth += 1;
        if (source[index] === '}' && --depth === 0) return source.slice(start, index + 1);
    }
    throw new Error(`Função atribuída incompleta: ${name}`);
}

function makeElement() {
    return {
        _classes: new Set(),
        innerText: '',
        innerHTML: '',
        className: '',
        style: {},
        classList: {
            add(...names) { names.forEach(n => this._owner._classes.add(n)); },
            remove(...names) { names.forEach(n => this._owner._classes.delete(n)); },
            toggle(name, force) { if (force === undefined) { this._owner._classes.has(name) ? this._owner._classes.delete(name) : this._owner._classes.add(name); } else if (force) this._owner._classes.add(name); else this._owner._classes.delete(name); },
            contains(name) { return this._owner._classes.has(name); }
        }
    };
}

function setup() {
    const elements = new Map();
    const getElementById = id => {
        if (!elements.has(id)) {
            const el = makeElement();
            el.classList._owner = el;
            elements.set(id, el);
        }
        return elements.get(id);
    };
    const toastLog = [];
    const values = new Map();
    const context = vm.createContext({
        console: { log() {} },
        window: {},
        hasSystemReminderPermission() { return false; },
        document: { getElementById },
        localStorage: {
            getItem(key) { return values.get(key) ?? null; },
            setItem(key, value) { values.set(key, String(value)); }
        },
        triggerHaptic() {},
        showInlineToast(message) { toastLog.push(message); },
        syncAllNativeReminders() {},
        evaluateAchievements() {}, updateHeaderStats() {}, renderScheduleList() {},
        renderMonthlyBars() {}, renderWeeklyChart() {}, renderSmartSuggestionCard() {},
        renderWeeklyTimeSummary() {}, renderAchievements() {}, renderMenteHistory() {},
        renderCorpoHistory() {}, updateTimeOfDayStretchRecommendation() {},
        updateWeeklyMobilityMetrics() {}, updateStretchDurationUI() {}, loadCustomPresets() {},
        updateBreathDurationUI() {}, updateBreathLevelUI() {}, updateTimeOfDayRecommendation() {},
        updateWeeklyCalmMetrics() {}, updatePushNotificationButton() {},
        openKegelProgramModal() {}, openBracingProgramModal() {}
    });
    vm.runInContext(source, context);
    vm.runInContext('CorePersistence.status = "ready";', context);
    return { context, elements, getElementById, toastLog, values };
}

// 1. Card abre o programa correto por ID (etapa 3/sessão 2 abre etapa 3/sessão 2).
{
    const env = setup();
    vm.runInContext(`AppState.programs.find(p => p.id === '1').sessionsToday = 1`, env.context);
    vm.runInContext(`openDailyExecutionModal('1', 2)`, env.context);
    assert.equal(vm.runInContext('AppState.dailyExecution.programId', env.context), '1');
    assert.equal(vm.runInContext('AppState.dailyExecution.phaseIndex', env.context), 2);
    assert.equal(vm.runInContext('AppState.dailyExecution.sessionNumber', env.context), 2);
    assert.equal(env.getElementById('dailyExecutionModal').classList.contains('hidden'), false);
}

// 2. ID inválido não abre outro programa nem mascara erro; mostra erro utilizável.
{
    const env = setup();
    const before = vm.runInContext('JSON.stringify(AppState.dailyExecution)', env.context);
    vm.runInContext(`openDailyExecutionModal('does-not-exist')`, env.context);
    assert.equal(vm.runInContext('JSON.stringify(AppState.dailyExecution)', env.context), before, 'estado de execução não pode mudar com ID inválido');
    assert.ok(env.toastLog.some(msg => /ID inválido/.test(msg)), 'usuário precisa de um erro utilizável');
    assert.equal(env.getElementById('dailyExecutionModal').classList.contains('flex'), false, 'modal não pode abrir com ID inválido');
}

// 3. openProgramDetail expande o card correto por ID e expõe data-program-id via renderização.
{
    const env = setup();
    vm.runInContext(`openProgramDetail('3')`, env.context);
    assert.equal(vm.runInContext(`AppState.programs.find(p => p.id === '3').expanded`, env.context), true);
    assert.equal(vm.runInContext('AppState.programDetailState.programId', env.context), '3');
    assert.match(env.getElementById('programsListContainer').innerHTML, /data-program-id="3"/);
}

// 4. ID inexistente em openProgramDetail não abre outro card e mostra erro.
{
    const env = setup();
    const before = vm.runInContext('JSON.stringify(AppState.programDetailState)', env.context);
    vm.runInContext(`openProgramDetail('nope')`, env.context);
    assert.equal(vm.runInContext('JSON.stringify(AppState.programDetailState)', env.context), before);
    assert.ok(env.toastLog.some(msg => /ID inválido/.test(msg)));
}

// 5. Reabertura preserva o programa/fase visitados (programDetailState) via snapshot v4.
{
    const env = setup();
    vm.runInContext(`openProgramDetail('4')`, env.context);
    vm.runInContext(`AppState.programs.find(p => p.id === '4').currentPhaseIndex = 3`, env.context);
    vm.runInContext(`openProgramDetail('4')`, env.context);
    const snapshot = JSON.parse(env.values.get('coreflow_progress_snapshot_v4'));
    assert.equal(snapshot.data.programDetailState.programId, '4');
    // Reload from persisted snapshot in a fresh env and confirm the visited program/phase survive.
    const env2 = setup();
    env2.values.set('coreflow_progress_snapshot_v4', JSON.stringify(snapshot));
    vm.runInContext('applyProgressData(JSON.parse(localStorage.getItem("coreflow_progress_snapshot_v4")).data)', env2.context);
    assert.equal(vm.runInContext('AppState.programDetailState.programId', env2.context), '4');
}

// 6. Hero não fixa mais o programa 2/meta 2: calcula a partir do programa selecionado.
{
    const env = setup();
    vm.runInContext(`AppState.programs.find(p => p.id === '3').dailyTarget = 1`, env.context);
    vm.runInContext(`openProgramDetail('3')`, env.context); // programDetailState now points at Vacuum (dailyTarget 1)
    vm.runInContext('renderProgramsList()', env.context);
    assert.equal(env.getElementById('heroSessionsTodayBadge').innerText, '0/1 Sessões Hoje', 'hero deve refletir a meta real do programa selecionado, não fixar 2');
    assert.equal(env.getElementById('heroWorkoutProgramTitle').innerText, 'Stomach Vacuum: 8 Semanas no Escritório');
}

// 7. Ajuste manual continua sem fabricar minutos/diário/sessão retroativa.
{
    const env = setup();
    const adjusted = vm.runInContext(`applyProgramProgressAdjustment(AppState.programs.find(p => p.id === '1'), 3, 2, 1)`, env.context);
    assert.equal(adjusted.currentPhaseIndex, 3);
    assert.equal(adjusted.daysCompletedInPhase, 1);
    assert.equal(adjusted.sessionsToday, 1);
    assert.ok(adjusted.lastManualAdjustment, 'posição conhecida deve ficar registrada');
}

// 8. repeatProgramPhase reposiciona a fase sem apagar diário/histórico/minutos.
{
    const env = setup();
    vm.runInContext(`
        const p = AppState.programs.find(x => x.id === '2');
        p.phases[0].completed = true;
        p.phases[1].completed = true;
        p.currentPhaseIndex = 2;
        AppState.activityLog['2026-01-01'] = { minutes: 42, sessions: 2, sources: { program: 2 } };
        CorePersistence.sessionHistory.push({ id: 'kept-1', schemaVersion: 1, programId: '2', phaseIndex: 0, date: '2026-01-01', status: 'completed', plannedSeries: 1, completedSeries: 1, retentionSeconds: 1, recoverySeconds: 1, pausedSeconds: 0, interrupted: false, feedback: null });
    `, env.context);
    vm.runInContext(`repeatProgramPhase('2', 0)`, env.context);
    const program = vm.runInContext(`AppState.programs.find(p => p.id === '2')`, env.context);
    assert.equal(program.currentPhaseIndex, 0, 'repetir deve mover a etapa ativa para a etapa escolhida');
    assert.equal(program.sessionsToday, 0);
    assert.equal(vm.runInContext(`AppState.activityLog['2026-01-01'].minutes`, env.context), 42, 'diário não pode ser apagado nem fabricado');
    assert.equal(vm.runInContext('CorePersistence.sessionHistory.length', env.context), 1, 'histórico não pode ser apagado');
    assert.ok(env.toastLog.some(msg => /reiniciada/.test(msg)));
}

// 9. repeatProgramPhase bloqueia durante sessão ativa (não interrompe um treino em curso).
{
    const env = setup();
    vm.runInContext(`AppState.dailyExecution.isRunning = true`, env.context);
    const program = vm.runInContext(`AppState.programs.find(p => p.id === '1')`, env.context);
    const before = program.currentPhaseIndex;
    vm.runInContext(`repeatProgramPhase('1', 5)`, env.context);
    assert.equal(vm.runInContext(`AppState.programs.find(p => p.id === '1').currentPhaseIndex`, env.context), before);
    assert.ok(env.toastLog.some(msg => /Encerre a sessão/.test(msg)));
}

// 10. Estado vazio explícito quando a lista de programas está vazia.
{
    const env = setup();
    vm.runInContext(`AppState.programs = []`, env.context);
    vm.runInContext(`renderProgramsList()`, env.context);
    assert.match(env.getElementById('programsListContainer').innerHTML, /id="programsListEmpty"/);
}

// 11. Estado de erro explícito quando a leitura exige recuperação (CorePersistence.status).
{
    const env = setup();
    vm.runInContext(`CorePersistence.status = 'recoveryRequired'`, env.context);
    vm.runInContext(`renderProgramsList()`, env.context);
    assert.match(env.getElementById('programsListContainer').innerHTML, /id="programsListError"/);
}

// 12. Progressão do Vácuo (E03) permanece visível e sem avanço automático por calendário.
{
    const env = setup();
    vm.runInContext(`AppState.programs.find(p => p.id === '3').progressionReview = { phaseIndex: 0, requestedAt: '2026-01-01', status: 'pending', reason: 'weekly-target-reached' }`, env.context);
    vm.runInContext(`renderProgramsList()`, env.context);
    assert.match(env.getElementById('programsListContainer').innerHTML, /Revisão da etapa necessária/);
}

// 13. Exercícios exibem a sequência real da fase escolhida, sem duração genérica.
{
    const env = setup();
    vm.runInContext(`openProgramExerciseDetail('3', 0)`, env.context);
    const details = vm.runInContext(`getProgramExerciseDetails('3', 0)`, env.context);
    assert.ok(details.length > 0, 'a fase real precisa expor exercícios');
    assert.equal(details[0].durationSeconds, 93, 'a duração deve vir dos passos reais da primeira série');
    assert.match(env.getElementById('programExerciseDetailModal').innerHTML, /Sente-se na ponta da cadeira/);
    assert.match(env.getElementById('programExerciseDetailModal').innerHTML, /Sustente por 10 segundos/);
    assert.match(env.getElementById('programExerciseDetailModal').innerHTML, /01:33/);
}

// 14. Mindfulness não reutiliza a sequência de Bracing nem expõe seus exercícios.
{
    const env = setup();
    const details = vm.runInContext(`getProgramExerciseDetails('4', 0)`, env.context);
    assert.equal(details.length, 0, 'Mindfulness não possui detalhes de exercícios de Bracing');
    assert.equal(vm.runInContext(`getProgramSteps('4', 0).length`, env.context), 0, 'ID Mindfulness não pode cair no fallback de Bracing');
    assert.equal(vm.runInContext(`getProgramSteps('unknown-program', 0).length`, env.context), 0, 'ID desconhecido não pode fabricar uma sequência');
    vm.runInContext(`openProgramExerciseDetail('4', 0)`, env.context);
    assert.match(env.getElementById('programExerciseDetailModal').innerHTML, /Nenhum exercício cadastrado/);
    assert.doesNotMatch(env.getElementById('programExerciseDetailModal').innerHTML, /Sessão A: Preparação|75 segundos/);
}

// 15. Exercício sem sequência cadastrada mostra ausência utilizável, sem fabricar dados.
{
    const env = setup();
    vm.runInContext(`openProgramExerciseDetail('3', 99)`, env.context);
    assert.match(env.getElementById('programExerciseDetailModal').innerHTML, /Nenhum exercício cadastrado/);
    assert.doesNotMatch(env.getElementById('programExerciseDetailModal').innerHTML, /01:00|60 segundos/);
}

const htmlPaths = [
  path.join(root, 'index.html'),
  path.join(root, 'app', 'src', 'main', 'assets', 'index.html')
];

for (const htmlPath of htmlPaths) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  assert.match(html, /function openDailyExecutionModal\(programId, phaseIndex = null, sessionNumber = null\)/, `${path.relative(root, htmlPath)} deve aceitar a sessão exibida explicitamente`);
  assert.match(html, /openDailyExecutionModal\(activeReminderProgId, null, activeReminderSessionNumber\)/, `${path.relative(root, htmlPath)} deve encaminhar o número da sessão do lembrete`);
  const payloadStart = extractFunctionFrom(html, 'buildNativeWorkoutPayload');
  for (const field of ['programId', 'phaseIndex', 'sessionNumber', 'steps']) {
    assert.match(payloadStart, new RegExp(`${field}: execution\\.${field}`), `${path.relative(root, htmlPath)} payload nativo deve preservar ${field} exibido`);
  }
  const nativeStateHandler = extractAssignedFunctionFrom(html, 'onNativeWorkoutState');
  assert.match(nativeStateHandler, /state\.status === ['"]failed['"][\s\S]*isRunning = false[\s\S]*acknowledgeWorkoutState/, `${path.relative(root, htmlPath)} falha de início deve limpar o estado e permitir nova tentativa`);
  const open = extractFunctionFrom(html, 'openDailyExecutionModal');
  assert.match(open, /pIdx < 0|pIdx >= prog\.phases\.length/, `${path.relative(root, htmlPath)} não pode substituir uma fase inválida por outra fase`);
}

console.log('E07 regressões comportamentais: rota por ID, sessão/etapa exatas no payload, falha de início sem timer fantasma, reabertura, hero real, exercícios por sequência e estados vazio/erro/E03 verificados.');

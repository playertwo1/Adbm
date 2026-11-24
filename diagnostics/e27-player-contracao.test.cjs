const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Redesign do player (kit 2026-11-18): sem círculo, trilha vertical, onda por fase; o tempo continua vindo do motor.
for (const relative of ['index.html', 'app/src/main/assets/index.html']) {
  const html = fs.readFileSync(path.join(__dirname, '..', relative), 'utf8');
  const modal = html.slice(html.indexOf('<div id="dailyExecutionModal"'), html.indexOf('<div id="programExerciseDetailModal"'));
  for (const id of ['workoutStepRail', 'workoutWave', 'dailyExecutionProgressBar', 'workoutNextStepTime', 'workoutPostureCard', 'dailyExecutionActionContainer'])
    assert.ok(modal.includes(`id="${id}"`), `${relative}: falta #${id}`);
  assert.doesNotMatch(modal, /workoutCircleBg|workoutRingGlow|rounded-full|setInterval|requestAnimationFrame/, `${relative}: sem círculo nem timer próprio no player`);

  const start = html.indexOf('function renderDailyExecutionUI() {');
  const end = html.indexOf('let nativeCompletionHandled', start);
  const els = new Map();
  const el = id => els.get(id) || els.set(id, {
    innerText: '', innerHTML: '', style: {}, attrs: {}, classList: { add() {}, remove() {} },
    setAttribute(k, v) { this.attrs[k] = v; }, removeAttribute() {}
  }).get(id);
  const exec = {
    programId: '1', isRunning: true, isPaused: false, currentStepIndex: 1, stepTimeLeft: 4,
    steps: [
      { title: 'Preparação', instruction: 'a', duration: 15, isRest: true, badge: 'PREPARAÇÃO' },
      { title: 'Bracing sentado', instruction: 'Mantenha o abdômen firme', duration: 6, isRest: false, badge: 'CONTRAÇÃO' },
      { title: 'Relaxe', instruction: 'c', duration: 8, isRest: true, badge: 'DESCANSO' }
    ]
  };
  const ctx = { AppState: { dailyExecution: exec }, document: { getElementById: el }, formatDailyTime: n => String(n), window: {} };
  vm.createContext(ctx);
  vm.runInContext(html.slice(start, end), ctx);
  const run = () => vm.runInContext('renderDailyExecutionUI()', ctx);

  run();
  assert.equal(el('dailyExecutionModal').attrs['data-phase'], 'contract', `${relative}: contração`);
  assert.equal(el('dailyExecutionTimer').innerText, '4', 'tempo exibido = tempo do motor');
  assert.equal((el('workoutStepRail').innerHTML.match(/<li/g) || []).length, 3, 'ciclo (ação + descanso) + ponto final');
  assert.match(el('workoutWave').attrs.d, /^M0 20 Q40 4 /, 'onda de contração com amplitude 8');
  assert.equal(el('workoutNextStepTitle').innerText, 'Relaxe');
  assert.match(el('dailyExecutionActionContainer').innerHTML, /pauseDailySession/);

  exec.isPaused = true; run();
  assert.equal(el('dailyExecutionModal').attrs['data-paused'], 'true', `${relative}: pausa congela a onda`);
  assert.match(el('dailyExecutionActionContainer').innerHTML, /resumeDailySession/);
  assert.equal(el('workoutStepBadge').innerText, 'PAUSADO');

  exec.isPaused = false; exec.currentStepIndex = 2; run();
  assert.equal(el('dailyExecutionModal').attrs['data-phase'], 'rest', `${relative}: descanso`);
  assert.equal(el('workoutNextStepTitle').innerText, 'Finalização da sessão');

  exec.currentStepIndex = 7; run(); // índice inválido: fallback neutro, sem exceção
  assert.ok(el('dailyExecutionModal').attrs['data-phase']);
}
console.log('e27-player-contracao: ok');

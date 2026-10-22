const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

for (const relative of ['index.html', 'app/src/main/assets/index.html']) {
  const html = fs.readFileSync(path.join(__dirname, '..', relative), 'utf8');
  const renderStart = html.indexOf('function renderDailyExecutionUI() {');
  const renderEnd = html.indexOf('let nativeCompletionHandled', renderStart);
  const exitStart = html.indexOf('function endDailyVacuumRetention() {');
  const exitEnd = html.indexOf('\n        function ', exitStart + 1);
  assert.ok(renderStart >= 0 && renderEnd > renderStart, `${relative}: renderização ausente`);
  assert.ok(exitStart >= 0 && exitEnd > exitStart, `${relative}: saída segura do programa ausente`);

  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, { innerText: '', innerHTML: '', className: '', style: {} });
    return elements.get(id);
  };
  let safeExits = 0;
  let skips = 0;
  const dailyExecution = {
    programId: '3', steps: [
      { title: 'Retenção', instruction: 'Segure', duration: 10, phase: 'vacuo' },
      { title: 'Retorno', instruction: 'Solte', duration: 3, phase: 'retorno' }
    ], currentStepIndex: 0, stepTimeLeft: 5, isRunning: true, isPaused: false
  };
  const context = {
    AppState: { dailyExecution }, document: { getElementById: element },
    formatDailyTime: n => String(n),
    window: { AndroidBridge: { exitRetentionSafely: () => safeExits++, skipWorkoutStep: () => skips++ } }
  };
  vm.createContext(context);
  vm.runInContext(html.slice(renderStart, renderEnd) + html.slice(exitStart, exitEnd), context);
  vm.runInContext('renderDailyExecutionUI()', context);
  assert.match(element('dailyExecutionActionContainer').innerHTML, /endDailyVacuumRetention\(\).*Encerrar retenção/s, `${relative}: botão identificável na retenção do programa`);
  assert.equal(vm.runInContext('endDailyVacuumRetention()', context), true);
  assert.equal(safeExits, 1, `${relative}: serviço recebe saída segura`);
  assert.equal(skips, 0, `${relative}: não usar pular passo genérico`);
  dailyExecution.currentStepIndex = 1;
  vm.runInContext('renderDailyExecutionUI()', context);
  assert.doesNotMatch(element('dailyExecutionActionContainer').innerHTML, /endDailyVacuumRetention\(\)/, `${relative}: sem saída na fase retorno`);
  assert.equal(vm.runInContext('endDailyVacuumRetention()', context), false);
  assert.equal(safeExits, 1, `${relative}: não duplicar saída segura`);
}
console.log('E13 saída segura da retenção programada: PASS');

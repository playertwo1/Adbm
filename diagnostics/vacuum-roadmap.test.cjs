const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const embedded = fs.readFileSync(path.join(root, 'app', 'src', 'main', 'assets', 'index.html'), 'utf8');

assert.equal(embedded, source, 'HTML raiz e asset embarcado precisam permanecer idênticos');
assert.doesNotMatch(source, /AppState\.vacuum\b/, 'atalho não pode usar estado inexistente AppState.vacuum');
assert.doesNotMatch(source, /startVacuumCycle\s*\(/, 'atalho precisa chamar o iniciador existente startVacuo');
assert.match(
  source,
  /if\s*\(!AppState\.vacuo\.isRunning\)\s*\{\s*startVacuo\(\);/s,
  'atalho de vácuo precisa iniciar startVacuo uma única vez'
);
assert.match(
  source,
  /addMinutesToday\(Math\.max\(1,\s*Math\.ceil\(AppState\.vacuo\.totalElapsedSec\s*\/\s*60\)\),\s*['"]vacuum['"]\)/,
  'conclusão web precisa creditar somente o tempo executado com o mesmo arredondamento nativo'
);
assert.doesNotMatch(source, /addMinutesToday\(10,\s*['"]vacuum['"]\)/, 'não pode creditar dez minutos fixos');
assert.match(source, /sessionId:\s*AppState\.vacuo\.sessionId/, 'sessão de vácuo precisa carregar um ID estável para deduplicar callbacks');
assert.match(
  source,
  /CorePersistence\.completedSessionIds\.includes\([^\n]*vacuum|completedSessionIds\.includes\(completionId\)/,
  'conclusão precisa consultar IDs já concluídos antes de creditar progresso'
);

assert.doesNotMatch(source, /getElementById\(['"]vacPhaseInstruction['"]\)/, 'callback nativo não pode escrever em elemento inexistente');

console.log('E01 vacuum regressions: PASS');

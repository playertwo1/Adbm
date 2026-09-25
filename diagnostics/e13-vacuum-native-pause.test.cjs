const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'app/src/main/java/com/example/WorkoutForegroundService.kt'), 'utf8');
const start = source.indexOf('private fun pauseSession() {');
const end = source.indexOf('\n    private fun exitRetentionSafely()', start);
assert.ok(start >= 0 && end > start, 'pauseSession nativa presente');
const pause = source.slice(start, end);
assert.match(pause, /steps\.getOrNull\(currentStepIndex\)\?\.phase\s*==\s*"vacuo"[\s\S]*?safeExitRetention\(\)[\s\S]*?return/, 'pausa durante vacuo sai para retorno antes de congelar; vale para UI, notificação e Watch');
assert.match(pause, /paused\s*=\s*true/, 'pausa genérica de outras fases preservada');
console.log('E13 pausa nativa do vácuo usa saída segura: PASS');

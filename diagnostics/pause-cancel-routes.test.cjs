const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const activity = read('app/src/main/java/com/example/MainActivity.kt');
const service = read('app/src/main/java/com/example/WorkoutForegroundService.kt');
const overlay = read('app/src/main/java/com/example/WorkoutOverlayController.kt');

assert.match(activity, /fun stopWorkoutSession\(\)\s*\{\s*sendWorkoutAction\(WorkoutForegroundService\.ACTION_STOP\)/,
  'Cancelamento pela WebView deve usar a ação existente de parar sessão');
assert.match(service, /ACTION_STOP\s*->\s*stopSession\(interrupted\s*=\s*true\)/,
  'A ação compartilhada deve encerrar como interrupção');
assert.match(service, /addAction\([^\n]*"Parar"[^\n]*ACTION_STOP/,
  'Notificação deve direcionar Parar ao mesmo ACTION_STOP');

const cancelHandler = overlay.match(/private fun confirmCancelSession\(context: Context\)[\s\S]*?\n    \}/)?.[0];
assert(cancelHandler, 'Overlay precisa ter o handler isolado de confirmar cancelamento');
assert.match(cancelHandler, /sendServiceAction\(context, WorkoutForegroundService\.ACTION_STOP\)/,
  'Cancelar no overlay deve usar ACTION_STOP');
assert.doesNotMatch(cancelHandler, /ACTION_SAFE_EXIT_RETENTION/,
  'Cancelar sessão não pode ser confundido com saída segura da retenção');

const safeExitHandler = overlay.match(/expandedSafeExitBtn\s*=\s*TextView[\s\S]*?\n        \}/)?.[0];
assert(safeExitHandler, 'Vácuo precisa manter o botão dedicado de saída segura');
assert.match(safeExitHandler, /sendServiceAction\(context, WorkoutForegroundService\.ACTION_SAFE_EXIT_RETENTION\)/,
  'Saída segura da retenção deve manter sua ação dedicada');

const stopHandler = service.match(/private fun stopSession\(interrupted: Boolean\)[\s\S]*?\n    \}/)?.[0];
assert(stopHandler, 'Serviço precisa manter o handler compartilhado de parada');
assert.match(stopHandler, /cancelActiveSignals\(\)/, 'Parada deve cancelar sinais em andamento');
assert.match(stopHandler, /persistAndBroadcast\(if \(interrupted\) "interrupted" else "idle"\)/,
  'Parada por cancelar não deve ser registrada como conclusão');
assert.match(stopHandler, /stopForeground\(STOP_FOREGROUND_REMOVE\)[\s\S]*?stopSelf\(\)/,
  'Parada deve remover notificação foreground e liberar o serviço');
assert.doesNotMatch(stopHandler, /completeSession\(|speak\(/,
  'Parada não deve executar conclusão nem mensagem de sucesso');

console.log('Pause cancellation routes, interrupted result and safe retention separation: PASS');

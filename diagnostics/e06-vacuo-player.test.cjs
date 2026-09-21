const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const htmlPaths = [
  path.join(root, 'index.html'),
  path.join(root, 'app', 'src', 'main', 'assets', 'index.html')
];

function readHtml(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `Função ausente: ${name}`);
  const bodyStart = source.indexOf('{', start);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}' && --depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`Função incompleta: ${name}`);
}

function extractAssignedFunction(source, name) {
  const start = source.indexOf(`window.${name} = function(`);
  assert.ok(start >= 0, `Função atribuída ausente: ${name}`);
  const bodyStart = source.indexOf('{', start);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}' && --depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`Função atribuída incompleta: ${name}`);
}

function extractKotlinFunction(source, name) {
  const start = source.search(new RegExp(`(?:private\\s+)?fun\\s+${name}\\s*\\(`));
  assert.ok(start >= 0, `Função Kotlin ausente: ${name}`);
  const bodyStart = source.indexOf('{', start);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}' && --depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`Função Kotlin incompleta: ${name}`);
}

for (const htmlPath of htmlPaths) {
  const html = readHtml(htmlPath);
  const relativePath = path.relative(root, htmlPath);

  assert.match(html, /id="vacPostureValue"/, `${relativePath} must expose the real posture value`);
  assert.match(html, /id="vacParametersValue"/, `${relativePath} must expose real session parameters`);
  assert.match(html, /id="vacNextStep"/, `${relativePath} must expose the next step from motor state`);
  assert.match(html, /id="vacEstimate"/, `${relativePath} must expose the real remaining estimate`);
  assert.match(html, /id="vacuumTutorialModal"/, `${relativePath} must expose the vacuum tutorial overlay`);
  assert.match(html, /id="vacuumSummaryModal"/, `${relativePath} must expose the session summary overlay`);
  assert.match(html, /id="vacuumFeedbackForm"/, `${relativePath} must expose optional feedback`);
  assert.match(html, /id="vacuumStartError"/, `${relativePath} must expose start failure and retry UI`);
  assert.match(html, /id="vacuumMoreRestBtn"[^>]*disabled/, `${relativePath} must keep More rest disabled`);
  assert.match(html, /id="vacuumWatchStatus"/, `${relativePath} must communicate real Watch availability`);
  assert.match(html, /id="vacuumTutorialBtn"[^>]*onclick="openVacuumTutorial\(\)"/, `${relativePath} tutorial must be callable from the player`);
  assert.match(html, /id="vacuumEndRetentionBtn"[^>]*onclick="endVacuumRetention\(\)"/, `${relativePath} must expose safe retention exit`);
  const initialization = html.slice(html.lastIndexOf("window.addEventListener('DOMContentLoaded'"));
  assert.doesNotMatch(initialization, /setPosture\(['"]deitado['"],\s*10\)/, `${relativePath} must not overwrite persisted vacuum selectors during initialization`);

  const start = extractFunction(html, 'startVacuo');
  assert.match(start, /startWorkoutSession\(payload\)/, `${relativePath} start must use the native E04 motor when available`);
  assert.match(start, /voiceEnabled:\s*AppState\.voiceEnabled/, `${relativePath} start must pass voice setting to the motor`);
  assert.match(start, /hapticsEnabled:\s*AppState\.hapticsEnabled/, `${relativePath} start must pass haptic setting to the motor`);
  assert.match(start, /watchHapticsEnabled:\s*AppState\.watchHapticsEnabled/, `${relativePath} start must pass Watch setting to the motor`);
  assert.match(start, /catch[\s\S]*(showVacuumStartError|vacuumStartError)/, `${relativePath} start failure must stop the UI and expose retry`);

  const update = extractFunction(html, 'updateVacuumPlayerUI');
  const nextPhase = extractFunction(html, 'vacuumNextPhase');
  const nextPhaseContext = {};
  vm.runInNewContext(`${nextPhase}; this.result = vacuumNextPhase`, nextPhaseContext);
  assert.equal(
    nextPhaseContext.result({ currentPhase: 'vacuo', seriesCurrent: 1, seriesTotal: 2 }),
    'descanso',
    `${relativePath} must report recovery as the next phase after active retention`
  );
  assert.equal(
    nextPhaseContext.result({ currentPhase: 'descanso', seriesCurrent: 1, seriesTotal: 2 }),
    'inspira',
    `${relativePath} must report the next series after recovery`
  );
  assert.equal(
    nextPhaseContext.result({ currentPhase: 'descanso', seriesCurrent: 2, seriesTotal: 2 }),
    'concluida',
    `${relativePath} must report completion after the last recovery phase`
  );
  const nativeVacuumHandler = extractFunction(html, 'handleNativeVacuumState');
  const nativeWorkoutDispatcher = extractAssignedFunction(html, 'onNativeWorkoutState');
  const failureContext = {
    AppState: { vacuo: { isRunning: true, isPaused: false, nativeManaged: true, intervalId: 42, currentPhase: 'inspira', timer: 3, totalElapsedSec: 4, retentionElapsedSec: 2, recoveryElapsedSec: 0, sessionId: 'failed-session' } },
    document: { getElementById: () => ({ className: '', innerText: '' }) },
    window: { AndroidBridge: { acknowledgeWorkoutState: () => { failureContext.acknowledged = true; } } },
    console,
    showVacuumStartError: message => { failureContext.error = message; },
    updateVacuumPlayerUI: () => { failureContext.updated = true; }
  };
  vm.runInNewContext(
    `${nativeVacuumHandler}; ${nativeWorkoutDispatcher}; window.onNativeWorkoutState({ status: 'failed', session: { type: 'vacuum', sessionId: 'failed-session' }, errorMessage: 'retry-me' })`,
    failureContext
  );
  assert.equal(failureContext.AppState.vacuo.isRunning, false, `${relativePath} async start failure must stop the player`);
  assert.equal(failureContext.AppState.vacuo.nativeManaged, false, `${relativePath} async start failure must clear native ownership`);
  assert.equal(failureContext.AppState.vacuo.timer, 0, `${relativePath} async start failure must clear the timer`);
  assert.equal(failureContext.error, 'retry-me', `${relativePath} async start failure must expose the native error`);
  assert.equal(failureContext.acknowledged, true, `${relativePath} async start failure must acknowledge the snapshot`);
  const retry = extractFunction(html, 'retryVacuumStart');
  const retryContext = { AppState: { vacuo: { isPaused: true } }, hideVacuumStartError: () => { retryContext.hidden = true; }, startVacuo: () => { retryContext.started = true; } };
  vm.runInNewContext(`${retry}; retryVacuumStart()`, retryContext);
  assert.equal(retryContext.hidden, true, `${relativePath} retry must clear the failure panel`);
  assert.equal(retryContext.AppState.vacuo.isPaused, false, `${relativePath} retry must clear transient pause state`);
  assert.equal(retryContext.started, true, `${relativePath} retry must attempt a fresh start`);
  for (const token of ['vacPostureValue', 'vacParametersValue', 'vacPhaseTitle', 'vacTimerMain', 'vacCurrentSeries', 'vacNextStep', 'vacEstimate']) {
    assert.match(update, new RegExp(`getElementById\\(['"]${token}['"]\\)`), `${relativePath} UI update must derive ${token} from state`);
  }
  assert.match(update, /vacuumNextPhase\(state\)/, `${relativePath} next-step UI must derive the next phase, not echo the active phase`);

  const pause = extractFunction(html, 'pauseVacuo');
  assert.match(pause, /exitRetentionSafely/, `${relativePath} retention pause must request safe exit in native motor`);
  assert.match(pause, /cancelPendingSignals\(\)/, `${relativePath} pause must cancel pending signals`);

  const complete = extractFunction(html, 'completeVacuumSession');
  assert.match(complete, /recordVacuumSession\(['"]completed['"]/, `${relativePath} completion must persist a completed session`);
  assert.match(complete, /showVacuumSummary/, `${relativePath} completion must show an executed summary`);

  const reset = extractFunction(html, 'resetVacuo');
  assert.match(reset, /recordVacuumSession\((?:['"]interrupted['"]|isInterrupted\s*\?\s*['"]interrupted['"])/, `${relativePath} reset must persist partial sessions as interrupted`);
  assert.match(reset, /cancelPendingSignals\(\)/, `${relativePath} reset must cancel pending signals`);
}

assert.equal(readHtml(htmlPaths[0]), readHtml(htmlPaths[1]), 'root and embedded HTML must remain identical');
const activity = fs.readFileSync(path.join(root, 'app', 'src', 'main', 'java', 'com', 'example', 'MainActivity.kt'), 'utf8');
const service = fs.readFileSync(path.join(root, 'app', 'src', 'main', 'java', 'com', 'example', 'WorkoutForegroundService.kt'), 'utf8');
const wear = fs.readFileSync(path.join(root, 'wear', 'src', 'main', 'java', 'com', 'example', 'wear', 'HapticListenerService.kt'), 'utf8');
assert.match(activity, /fun exitRetentionSafely\(\)/, 'native bridge must expose safe retention exit');
assert.match(activity, /ACTION_SAFE_EXIT_RETENTION/, 'safe retention exit must target the E04 service');
assert.match(service, /ACTION_SAFE_EXIT_RETENTION/, 'service must handle the safe retention action');
assert.match(service, /retentionInterruptedSeries/, 'native partial metrics must exclude an interrupted retention series');
assert.match(service, /currentStep\.phase == "vacuo"[\s\S]*retentionInterruptedSeries/, 'native skip must exclude an abandoned retention series');
const pauseSession = extractKotlinFunction(service, 'pauseSession');
const safeExitRetention = extractKotlinFunction(service, 'safeExitRetention');
const stopSession = extractKotlinFunction(service, 'stopSession');
const advanceStep = extractKotlinFunction(service, 'advanceStep');
for (const [name, body] of [['pauseSession', pauseSession], ['safeExitRetention', safeExitRetention], ['stopSession', stopSession]]) {
  assert.match(body, /cancelActiveSignals\(\)/, `${name} must cancel active native signals before leaving the session state`);
}
assert.ok(
  advanceStep.indexOf('cancelActiveSignals()') < advanceStep.indexOf('announceCurrentStep('),
  'native transitions must cancel previous signals before announcing the next step'
);
assert.match(service, /private fun cancelActiveSignals\(\)[\s\S]*pendingSpeech = null[\s\S]*tts\?\.stop\(\)[\s\S]*AdvancedHapticsManager\.cancel\(this\)[\s\S]*WearHapticsRelay\.cancel\(this\)/, 'native cancellation must clear TTS, phone and Wear signals');
assert.match(activity, /fun cancelHaptics\(\)/, 'Web/native bridge must expose haptic cancellation');
assert.match(wear, /message\.optBoolean\("cancel", false\)[\s\S]*vibrator\(\)\.cancel\(\)/, 'Wear listener must cancel an active waveform');
assert.match(service, /stateJson\(['"]failed['"]\)/, 'service must publish an explicit start-failure state');
assert.match(service, /failureMessage|errorMessage|start failure/i, 'service failure state must include a retryable error message');
const startSession = extractKotlinFunction(service, 'startSession');
assert.match(startSession, /sessionMetadata\s*=\s*payload\?\.let\s*\{\s*sessionMetadataFrom\(it\)\s*\}\s*\?:\s*JSONObject\(\)/, 'failed vacuum starts must preserve payload session metadata before broadcasting failure');
assert.doesNotMatch(extractKotlinFunction(service, 'failStart'), /sessionMetadata\s*=\s*JSONObject\(\)/, 'failed starts must not erase the vacuum type before the failure snapshot');
console.log('E06 vacuum player regressions: state, controls, failure, tutorial, summary, feedback, and offline parity verified.');

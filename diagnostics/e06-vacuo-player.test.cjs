const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

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
  for (const token of ['vacPostureValue', 'vacParametersValue', 'vacPhaseTitle', 'vacTimerMain', 'vacCurrentSeries', 'vacNextStep', 'vacEstimate']) {
    assert.match(update, new RegExp(`getElementById\\(['"]${token}['"]\\)`), `${relativePath} UI update must derive ${token} from state`);
  }

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
assert.match(activity, /fun exitRetentionSafely\(\)/, 'native bridge must expose safe retention exit');
assert.match(activity, /ACTION_SAFE_EXIT_RETENTION/, 'safe retention exit must target the E04 service');
assert.match(service, /ACTION_SAFE_EXIT_RETENTION/, 'service must handle the safe retention action');
assert.match(service, /retentionInterruptedSeries/, 'native partial metrics must exclude an interrupted retention series');
assert.match(service, /currentStep\.phase == "vacuo"[\s\S]*retentionInterruptedSeries/, 'native skip must exclude an abandoned retention series');
console.log('E06 vacuum player regressions: state, controls, failure, tutorial, summary, feedback, and offline parity verified.');

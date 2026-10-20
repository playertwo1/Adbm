const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const androidHtml = fs.readFileSync(path.join(root, 'app/src/main/assets/index.html'), 'utf8');
assert.equal(html, androidHtml, 'HTML raiz e HTML Android devem permanecer byte-idênticos');

function extractFunction(name) {
  const start = html.indexOf(`        function ${name}(`);
  assert(start >= 0, `${name} ausente`);
  const end = html.indexOf('\n        function ', start + 10);
  return html.slice(start, end < 0 ? undefined : end);
}

const elements = new Map();
function getElement(id) {
  if (!elements.has(id)) {
    const classes = new Set();
    elements.set(id, {
      id,
      innerText: '',
      innerHTML: '',
      style: {},
      dataset: {},
      classList: {
        add: name => classes.add(name),
        remove: name => classes.delete(name),
        contains: name => classes.has(name)
      }
    });
  }
  return elements.get(id);
}

let nativePayload = null;
const context = vm.createContext({
  AppState: { pausas: {
    selectedDuration: 60,
    remainingSec: 0,
    totalCardSec: 0,
    activeTimerId: null,
    pausedTimerId: null,
    intervalId: null,
    circuitActive: true,
    nativeManaged: false,
    voiceGuideEnabled: false,
    soundEnabled: false
  } },
  STRETCH_EXERCISES: [{ id: 2, name: 'Torção sentada', instruction: 'Gire suavemente', voiceIntro: '', image: 'img/pausas/stretch-sequence-2.png', sides: 2 }],
  document: { getElementById: getElement },
  triggerHaptic() {},
  playBeep() {},
  showStretchActiveDisplay() {},
  speakVoice() {},
  window: { AndroidBridge: {
    startWorkoutSession(raw) { nativePayload = JSON.parse(raw); return true; },
    resumeWorkoutSession() {}
  } },
  setInterval() { throw new Error('Sessão nativa não deve criar timer web'); },
  clearInterval() {}
});

vm.runInContext(extractFunction('startStretchTimer'), context);
context.startStretchTimer(2, true, false);

const expectedPath = 'img/pausas/stretch-sequence-2.png';
assert.equal(nativePayload?.steps?.[0]?.image, expectedPath,
  'payload nativo do alongamento deve incluir o atlas sequencial do exercício atual');
assert(fs.existsSync(path.join(root, expectedPath)), `asset raiz ausente: ${expectedPath}`);
assert(fs.existsSync(path.join(root, 'app/src/main/assets', expectedPath)), `asset Android ausente: ${expectedPath}`);
for (let cardId = 1; cardId <= 4; cardId++) {
  const sequencePath = `img/pausas/stretch-sequence-${cardId}.png`;
  assert(fs.existsSync(path.join(root, sequencePath)), `atlas raiz ausente: ${sequencePath}`);
  assert(fs.existsSync(path.join(root, 'app/src/main/assets', sequencePath)), `atlas Android ausente: ${sequencePath}`);
  assert.deepEqual(
    fs.readFileSync(path.join(root, sequencePath)),
    fs.readFileSync(path.join(root, 'app/src/main/assets', sequencePath)),
    `atlas ${cardId} raiz e Android devem ser idênticos`
  );
}

console.log('Native stretch image payload and local asset parity: PASS');

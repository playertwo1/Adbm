const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const html = fs.readFileSync('index.html', 'utf8');
const androidHtml = fs.readFileSync('app/src/main/assets/index.html', 'utf8');
assert.equal(html, androidHtml, 'HTML raiz e Android devem permanecer idênticos');
const styles = html.match(/<style>([\s\S]*?)<\/style>/)?.[1] || '';
function assertStyleMatches(pattern, message) {
  assert.ok(pattern.test(styles), message);
}

function extractFunction(name) {
  const start = html.indexOf(`        function ${name}(`);
  assert(start >= 0, `${name} ausente`);
  const end = html.indexOf('\n        function ', start + 10);
  return html.slice(start, end < 0 ? undefined : end);
}

const ctx = vm.createContext({
  STRETCH_EXERCISES: [
    { id: 1, sides: 2, instruction: 'Cruze o tornozelo direito sobre o joelho oposto.' },
    { id: 2, sides: 2 }, { id: 3, sides: 1 }, { id: 4, sides: 2 }
  ]
});
vm.runInContext(extractFunction('resolveStretchCue'), ctx);

function cue(cardId, remaining, total) {
  const value = ctx.resolveStretchCue(cardId, remaining, total);
  return { frame: value.frame, phase: value.phase, side: value.side };
}

assert.deepEqual(cue(1, 60, 60), { frame: 0, phase: 'prepare', side: 'right' });
assert.deepEqual(cue(1, 53, 60), { frame: 0, phase: 'prepare', side: 'right' },
  'a preparação precisa permanecer visível enquanto a sobreposição abre');
assert.deepEqual(cue(1, 30, 60), { frame: 0, phase: 'prepare', side: 'left' },
  'a troca aos 50% deve reiniciar a preparação do lado oposto');
assert.deepEqual(cue(1, 23, 60), { frame: 0, phase: 'prepare', side: 'left' },
  'a preparação do segundo lado deve continuar legível na troca');
assert.deepEqual(cue(1, 52, 60), { frame: 2, phase: 'enter', side: 'right' },
  'o quadro da direita anatômica deve corresponder ao lado direito indicado');
assert.deepEqual(cue(1, 22, 60), { frame: 1, phase: 'enter', side: 'left' },
  'a postura esquerda deve usar o quadro anatômico próprio ao entrar');
assert.deepEqual(cue(1, 18, 60), { frame: 1, phase: 'hold', side: 'left' },
  'a sustentação mantém a postura esquerda, sem repetição contínua');
assert.deepEqual(cue(1, 3, 60), { frame: 3, phase: 'return', side: 'left' });
assert.deepEqual(cue(2, 52, 60), { frame: 2, phase: 'enter', side: 'right' });
assert.deepEqual(cue(2, 22, 60), { frame: 1, phase: 'enter', side: 'left' });
assert.deepEqual(cue(4, 52, 60), { frame: 2, phase: 'enter', side: 'right' });
assert.deepEqual(cue(4, 22, 60), { frame: 1, phase: 'enter', side: 'left' });
assert.deepEqual(cue(3, 48, 60), { frame: 1, phase: 'enter', side: 'continuous' });
assert.deepEqual(cue(3, 30, 60), { frame: 2, phase: 'hold', side: 'continuous' });
assert.deepEqual(cue(3, 3, 60), { frame: 3, phase: 'return', side: 'continuous' });

const halfCueNodes = new Map();
function halfCueNode(id) {
  if (!halfCueNodes.has(id)) {
    halfCueNodes.set(id, {
      innerText: '', alt: '', dataset: {}, style: {},
      classList: { toggle() {}, add() {}, remove() {} }
    });
  }
  return halfCueNodes.get(id);
}
ctx.document = { getElementById: halfCueNode };
ctx.AppState = { pausas: { soundEnabled: false, voiceGuideEnabled: true } };
const spokenCues = [];
ctx.triggerHaptic = () => {};
ctx.playBeep = () => {};
ctx.speakVoice = value => spokenCues.push(value);
vm.runInContext(extractFunction('updateStretchActiveDisplayUI'), ctx);
vm.runInContext(extractFunction('notifyStretchSideSwitch'), ctx);
ctx.updateStretchActiveDisplayUI(1, 30, 60);
assert.equal(halfCueNode('stretch-active-side-badge').innerText, 'Esquerda',
  'a interface deve mostrar o lado anatômico após a troca');
assert.equal((html.match(/^\s+notifyStretchSideSwitch\(ex\);$/gm) || []).length, 2,
  'os fluxos individual e circuito devem compartilhar o aviso da troca');
ctx.notifyStretchSideSwitch({ voiceSwitch: 'Troque o lado suavemente' });
assert.equal(halfCueNode('stretch-active-side-badge').innerText, 'Esquerda',
  'o alerta de metade não pode sobrescrever o lado anatômico no tick da troca');
assert.deepEqual(spokenCues, ['Troque o lado suavemente']);
assert.ok(!/sideBadge\.innerText\s*=\s*ex\.sides\s*>\s*1\s*\?\s*'Lado 2'/.test(html),
  'rótulos numéricos legados não podem sobrescrever a pista derivada do motor');

assert.match(html, /stretch-sequence-1\.png/);
assert.match(html, /stretch-sequence-2\.png/);
assert.match(html, /stretch-sequence-3\.png/);
assert.match(html, /stretch-sequence-4\.png/);
assert.match(html, /stretch-phase-track/);
assert.match(html, /prefers-reduced-motion:\s*reduce/);
assertStyleMatches(/#stretch-posture-frame\[data-frame="0"\]\s+\.stretch-posture-image\s*\{[^}]*left:\s*0;[^}]*top:\s*0;/,
  'o quadro inicial precisa mostrar somente a célula superior esquerda do atlas');
assertStyleMatches(/#stretch-posture-frame\[data-frame="1"\]\s+\.stretch-posture-image\s*\{[^}]*left:\s*-100%;[^}]*top:\s*0;/,
  'o segundo quadro precisa recortar a célula superior direita pelo contêiner');
assertStyleMatches(/#stretch-posture-frame\[data-frame="2"\]\s+\.stretch-posture-image\s*\{[^}]*left:\s*0;[^}]*top:\s*-100%;/,
  'o terceiro quadro precisa recortar a célula inferior esquerda pelo contêiner');
assertStyleMatches(/#stretch-posture-frame\[data-frame="3"\]\s+\.stretch-posture-image\s*\{[^}]*left:\s*-100%;[^}]*top:\s*-100%;/,
  'o quadro final precisa recortar a célula inferior direita pelo contêiner');
assert.ok(!/#stretch-posture-frame\[data-frame="[123]"\]\s+\.stretch-posture-image\s*\{[^}]*transform:\s*translate\(/.test(styles),
  'o recorte não deve depender de translate percentual no Android WebView');
assert.doesNotMatch(html, /stretch-direction-motion\s+3s[^;]*infinite/,
  'a direção não pode repetir em loop durante uma postura sustentada');
assert.doesNotMatch(html, /stretch-posture-motion\s+3s[^;]*infinite/,
  'o indicador de fase deve seguir o estado da sessão, sem loop independente');

console.log('Stretch sequence frames and engine-derived phase cues: PASS');

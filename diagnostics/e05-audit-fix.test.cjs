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
  const start = source.indexOf(`window.${name} = function`);
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
  assert.match(html, /id="nav-btn-hoje"[\s\S]*?aria-current="page"/, `${relativePath} must expose Hoje as the home destination`);
  assert.match(html, /id="voiceToggleBtn"[^>]*aria-label="[^"]+"[^>]*aria-pressed=/, `${relativePath} voice toggle needs an accessible name and state`);
  assert.match(html, /id="hapticToggleBtn"[^>]*aria-label="[^"]+"[^>]*aria-pressed=/, `${relativePath} haptic toggle needs an accessible name and state`);
  assert.match(html, /function ensureAccessibleButtonNames\(\)/, `${relativePath} must guard dynamically rendered buttons`);
  assert.match(html, /ensureAccessibleButtonNames\(\);/, `${relativePath} must run the accessible-name guard after rendering`);
  for (const component of ['cf-icon', 'cf-selector', 'cf-modal', 'cf-error']) {
    assert.match(html, new RegExp(`class="[^"]*\\b${component}\\b`), `${relativePath} must instantiate ${component}`);
  }

  const back = extractFunction(html, 'handleAndroidBack');
  assert.doesNotMatch(back, /switchTab\(['"]rotina['"]\)/, `${relativePath} must not navigate to the removed rotina tab`);
  assert.match(back, /closeTopmostOverlay\(\)/, `${relativePath} Back must close the topmost overlay first`);
  assert.match(back, /switchTab\(['"]hoje['"]\)/, `${relativePath} Back must return to Hoje`);
  assert.ok(back.indexOf('closeTopmostOverlay()') < back.indexOf("AppState.activeTab"), `${relativePath} overlay handling must precede tab navigation`);
  assert.match(html, /mindfulnessAudioModal[^\n]*cf-modal/, `${relativePath} mindfulness modal must use the modal component`);
}

assert.equal(readHtml(htmlPaths[0]), readHtml(htmlPaths[1]), 'root and embedded HTML must remain identical');
console.log('E05 audit-fix regressions: Back, accessibility, and live components verified.');

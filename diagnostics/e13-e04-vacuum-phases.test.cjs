const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
for (const relative of ['index.html', 'app/src/main/assets/index.html']) {
  const html = fs.readFileSync(path.join(root, relative), 'utf8');
  const start = html.indexOf('function getProgramSteps(');
  assert.ok(start >= 0, `${relative}: getProgramSteps ausente`);
  const brace = html.indexOf('{', start);
  let depth = 0;
  let end = -1;
  for (let i = brace; i < html.length; i++) {
    if (html[i] === '{') depth++;
    if (html[i] === '}' && --depth === 0) { end = i + 1; break; }
  }
  assert.ok(end > brace, `${relative}: função incompleta`);
  const context = { AppState: { programs: [{ id: '3', phases: [{ holdMin: 10, minSets: 2, restSeconds: 15 }] }] } };
  const steps = vm.runInNewContext(`${html.slice(start, end)}; getProgramSteps('3', 0)`, context);
  assert.deepEqual(
    Array.from(steps, step => step.phase),
    ['prepara', 'inspira', 'expira', 'vacuo', 'retorno', 'descanso', 'prepara', 'inspira', 'expira', 'vacuo', 'retorno'],
    `${relative}: cada fase deve ter identidade explícita; descanso só entre séries`
  );
}
console.log('E13/E04 fases explícitas em ambas as interfaces: PASS');

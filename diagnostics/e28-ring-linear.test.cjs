const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Anéis de progresso viram barra linear (kit 2026-11-18); a fração vem só do anel que o motor já atualiza.
for (const relative of ['index.html', 'app/src/main/assets/index.html']) {
  const html = fs.readFileSync(path.join(__dirname, '..', relative), 'utf8');
  const start = html.indexOf('function cfRingFraction(ring)');
  assert.ok(start >= 0, `${relative}: adaptador ausente`);
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(html.slice(start, html.indexOf('function cfLinearizeRings', start)), ctx);
  const ring = (dash, off) => ({ style: { strokeDashoffset: off }, getAttribute: k => (k === 'stroke-dasharray' ? dash : null) });
  assert.equal(ctx.cfRingFraction(ring('603', '603')), 0, 'anel vazio');
  assert.equal(ctx.cfRingFraction(ring('100', '25')), 0.75);
  assert.equal(ctx.cfRingFraction(ring('490', '-5')), 1, 'valor fora da faixa fica em 1');
  assert.equal(ctx.cfRingFraction({ style: {}, getAttribute: () => null }), 0, 'sem dados: 0');
}
console.log('e28-ring-linear: ok');

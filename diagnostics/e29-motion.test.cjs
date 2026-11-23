const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Sistema de movimento (2026-11-19): entradas de modal/aba, toque, laços calmos, toast com saída e movimento reduzido.
for (const relative of ['index.html', 'app/src/main/assets/index.html']) {
  const html = fs.readFileSync(path.join(__dirname, '..', relative), 'utf8');
  for (const needle of ['--cf-ease: cubic-bezier(.16, 1, .3, 1)', '@keyframes cf-sheet-up', '@keyframes cf-dialog-in', '.tab-content.active > :nth-child(-n+5)',
    '.animate-bounce { animation: cf-rise', '#coreflowInlineToast.is-leaving', 'html.cf-reduced-motion *'])
    assert.ok(html.includes(needle), `${relative}: falta ${needle}`);
  assert.match(html, /toast\.classList\.add\('is-leaving'\)/, `${relative}: toast sai com animação`);
  assert.match(html, /@media \(prefers-reduced-motion: reduce\) \{\s*\*, \*::before, \*::after \{ animation-duration: \.01ms/, `${relative}: movimento reduzido global`);
  assert.doesNotMatch(html, /\.animate-bounce \{[^}]*infinite/, `${relative}: sem laço de pulo`);
  // só transform/opacity nos keyframes novos
  const kf = html.match(/@keyframes cf-(?:fade|sheet-up|dialog-in|rise|toast-in|count-pop)[^\n]*/g).join('\n');
  assert.doesNotMatch(kf, /\b(width|height|top|left|margin)\s*:/, `${relative}: keyframes sem propriedades de layout`);
}
console.log('e29-motion: ok');

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

// A identidade atual usa uma ação verde e a pausa deixa de carregar um gradiente violeta/ciano.
const root = path.join(__dirname, '..');
const gradients = [
    'bg-gradient-to-r from-amber-500 to-orange-500',
    'bg-gradient-to-r from-violet-500 to-cyan-500',
    'bg-gradient-to-br from-violet-950/90 via-slate-900 to-cyan-950/70'
];
for (const file of [path.join(root, 'index.html'), path.join(root, 'app', 'src', 'main', 'assets', 'index.html')]) {
    const html = fs.readFileSync(file, 'utf8');
    const name = path.relative(root, file);
    for (const gradient of gradients) assert.equal(html.includes(gradient), false, `${name}: gradiente ainda presente (${gradient})`);
    assert.match(html, /onclick="saveReminderConfig\(\)" class="cf-fluxo-primary-action w-full/, `${name}: salvar lembretes deve usar a ação principal verde`);
    assert.match(html, /class="cf-card cf-response-break p-4"/, `${name}: Pausa de Resposta deve usar o cartão da nova identidade`);
    assert.match(html, /onclick="startResponsivePause\(\)" class="cf-fluxo-primary-action/, `${name}: iniciar a pausa deve usar a ação principal verde`);
}
console.log('e25-solid-cta-and-pause-card: ok');

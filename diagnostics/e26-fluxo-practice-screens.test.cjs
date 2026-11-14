const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const packaged = fs.readFileSync(path.join(root, 'app/src/main/assets/index.html'), 'utf8');
assert.equal(html, packaged, 'as telas de prática devem permanecer iguais no pacote Android');

const vacuum = html.match(/<section id="tab-vacuo"[^>]*>([\s\S]*?)<\/section>/)?.[1];
assert.ok(vacuum, 'a tela de Vácuo deve continuar disponível');
assert.equal([...vacuum.matchAll(/class="[^"]*cf-vacuum-posture-art/g)].length, 3, 'cada postura deve ter ilustração vetorial própria');
assert.ok(/btn\.className = 'cf-selector posture-btn cf-vacuum-posture-btn/.test(html), 'a seleção dinâmica de postura deve manter a classe visual');
assert.ok(/#tab-vacuo \.cf-vacuum-posture-btn\[aria-pressed="true"\]/.test(html), 'a postura ativa deve seguir o estado sem depender só do ícone');
assert.ok(/#tab-vacuo \.cf-vacuum-player-card[^{}]*\{[^}]*border-radius:\s*16px[^}]*box-shadow:\s*none/s.test(html), 'o player de Vácuo deve usar um painel plano do sistema CoreFlow');
assert.ok(/#tab-vacuo #ringGlowBg[^{}]*\{[^}]*display:\s*none/s.test(html), 'o brilho decorativo do player deve ficar oculto');
assert.ok(/id="vacProgressRing"[^>]*stroke-dashoffset="603"/.test(vacuum), 'o anel deve começar vazio, sem sugerir progresso antes do treino');
assert.ok(/#tab-vacuo #pulseAuraCircle\s*\{[^}]*display:\s*none/s.test(html), 'o anel auxiliar decorativo deve ficar oculto');
const seriesLabel = vacuum.match(/<span id="vacCurrentSeries"[^>]*>/)?.[0] || '';
assert.doesNotMatch(seriesLabel, /rounded|border|bg-/, 'a série deve aparecer como texto, sem selo em cápsula');

const today = html.match(/<section id="tab-hoje"[^>]*>([\s\S]*?)<\/section>/)?.[1];
assert.ok(today, 'a tela Hoje deve continuar disponível');
assert.ok(/#tab-hoje \.uppercase[^{}]*\{[^}]*text-transform:\s*none/s.test(html), 'os rótulos de Hoje devem usar caixa de frase');
assert.ok(/#tab-hoje \.cf-notice[^{}]*\{(?=[^}]*background:\s*transparent)(?=[^}]*border:\s*0)[^}]*\}/s.test(html), 'a nota de disponibilidade local deve ser discreta');

const discreet = html.match(/<section id="tab-discreto"[^>]*>([\s\S]*?)<\/section>/)?.[1];
assert.ok(discreet, 'a tela Modo discreto deve continuar disponível');
assert.ok(discreet.includes('class="cf-discreet-subnav '), 'as modalidades do Modo discreto devem usar navegação própria');
assert.ok(/#tab-discreto \.desk-sub-btn\[aria-pressed="true"\][^{}]*\{[^}]*border-bottom-color:\s*var\(--cf-color-action\)/s.test(html), 'a modalidade ativa deve ficar clara sem cápsula preenchida');
assert.ok(/#tab-discreto #bracingVisualGlow\s*\{[^}]*display:\s*none/s.test(html), 'o medidor de bracing não deve usar brilho decorativo');
assert.ok(/id="kegelResTrack"[^>]*stroke="var\(--cf-color-line\)"/.test(discreet), 'a trilha do Kegel deve usar a linha do tema');
assert.ok(/id="kegelResRing"[^>]*pathLength="100"[^>]*stroke-dasharray="100"[^>]*stroke-dashoffset="100"[^>]*style="opacity:0"/.test(discreet), 'o anel do Kegel deve iniciar vazio e sem marcador numa escala alinhada ao SVG');
const kegelSeriesLabel = discreet.match(/<span id="kegelResSeriesLabel"[^>]*>/)?.[0] || '';
assert.doesNotMatch(kegelSeriesLabel, /rounded|border|bg-/, 'a série do Kegel deve ficar como texto, sem cápsula');
assert.ok(/#tab-discreto \.cf-discreet-player-card \.uppercase[^{}]*\{[^}]*text-transform:\s*none/s.test(html), 'os rótulos da prática devem usar caixa de frase');
const fastProgressLabel = discreet.match(/<span id="kegelFastProgress"[^>]*>/)?.[0] || '';
assert.doesNotMatch(fastProgressLabel, /rounded|border|bg-/, 'a contagem do Kegel rápido deve ficar como texto, sem cápsula');
assert.ok(/state\.innerText = 'Contraia'/.test(html) && /state\.innerText = 'Relaxe'/.test(html), 'as instruções do Kegel devem usar caixa de frase');
const kegelStateUI = html.match(/function updateKegelResStateUI\(\) \{([\s\S]*?)\n        \}/)?.[1] || '';
assert.doesNotMatch(kegelStateUI, /animate-pulse/, 'a instrução do Kegel não deve pulsar fora de sincronia com o timer');

console.log('e26-fluxo-practice-screens: ok');

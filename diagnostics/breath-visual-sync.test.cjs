const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const androidHtml = fs.readFileSync(path.join(root, 'app', 'src', 'main', 'assets', 'index.html'), 'utf8');
assert.equal(html, androidHtml, 'HTML raiz e asset Android devem permanecer byte-idênticos');

function extractFunction(name) {
    const start = html.search(new RegExp(`function\\s+${name}\\s*\\(`));
    assert(start >= 0, `função ausente: ${name}`);
    const bodyStart = html.indexOf('{', start);
    let depth = 0;
    for (let i = bodyStart; i < html.length; i += 1) {
        if (html[i] === '{') depth += 1;
        if (html[i] === '}' && --depth === 0) return html.slice(start, i + 1);
    }
    throw new Error(`bloco incompleto: ${name}`);
}

const classes = new Set();
const elements = new Map();
const document = {
    documentElement: { classList: { contains: name => classes.has(name), toggle(name, enabled) { if (enabled) classes.add(name); else classes.delete(name); } } },
    body: { classList: { toggle() {} } },
    getElementById(id) {
        if (!elements.has(id)) elements.set(id, {
            id, style: {}, animations: [],
            classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
            getAnimations() { return this.animations; },
            setAttribute() {}
        });
        return elements.get(id);
    }
};
const window = {
    matchMedia: () => ({ matches: false }),
    getComputedStyle: element => ({
        getPropertyValue: property => element.style[property] || (property === 'transform' ? 'scale(0.7)' : '0')
    })
};
const context = vm.createContext({ document, window, Set, Math, normalizeAccessibilityPreferences: value => value });
vm.runInContext([
    extractFunction('applyAccessibilityPreferences'),
    extractFunction('isBreathMotionReduced'),
    extractFunction('setBreathVisualTarget'),
    extractFunction('getBreathVisualElements'),
    extractFunction('pauseBreathVisuals'),
    extractFunction('resumeBreathVisuals'),
    extractFunction('cancelBreathVisuals'),
    extractFunction('renderBreathTickUI'),
    extractFunction('applyBreathPhaseUI'),
    extractFunction('enterOledMode'),
    extractFunction('applyOledPhaseUI')
].join('\n'), context);

const element = document.getElementById('longa-sphere');
const created = [];
element.animate = (frames, options) => {
    const animation = {
        frames,
        options,
        playState: 'running',
        pause() { this.playState = 'paused'; },
        play() { this.playState = 'running'; },
        cancel() { this.playState = 'idle'; }
    };
    element.animations.push(animation);
    created.push(animation);
    return animation;
};

const multiPropertyElement = document.getElementById('longa-multi-property');
multiPropertyElement.animate = (frames, options) => {
    const animation = {
        frames,
        options,
        playState: 'running',
        effect: { getKeyframes: () => frames },
        cancel() { this.playState = 'idle'; }
    };
    multiPropertyElement.animations.push(animation);
    return animation;
};
const transformAnimation = context.setBreathVisualTarget(multiPropertyElement, 'transform', 'scale(1.2)', 7, true);
const opacityAnimation = context.setBreathVisualTarget(multiPropertyElement, 'opacity', '0.75', 7, true);
assert.equal(transformAnimation.playState, 'running', 'opacity não deve cancelar a transformação da mesma fase');
assert.equal(opacityAnimation.playState, 'running', 'opacidade deve animar em paralelo à transformação');
const nextTransformAnimation = context.setBreathVisualTarget(multiPropertyElement, 'transform', 'scale(0.8)', 3, true);
assert.equal(transformAnimation.playState, 'idle', 'uma nova transformação deve substituir a anterior');
assert.equal(opacityAnimation.playState, 'running', 'atualizar transformação deve preservar animação de opacidade');
assert.equal(nextTransformAnimation.playState, 'running');

const reducedMotionCalls = [];
const accessibilityRoot = { classList: { toggle(name, enabled) { classes[name] = enabled; } } };
const accessibilityContext = vm.createContext({
    AppState: { accessibility: { textScale: 'normal', highContrast: false, reducedMotion: true } },
    normalizeAccessibilityPreferences: value => value,
    document: {
        documentElement: accessibilityRoot,
        body: { classList: { toggle() {} } },
        getElementById: () => null
    },
    window: { AndroidBridge: { setAccessibilityReducedMotion: enabled => reducedMotionCalls.push(enabled) } },
    pauseBreathVisuals() {},
    resumeBreathVisuals() {},
    cancelBreathVisuals() {}
});
vm.runInContext(extractFunction('applyAccessibilityPreferences'), accessibilityContext);
accessibilityContext.applyAccessibilityPreferences();
accessibilityContext.AppState.accessibility.reducedMotion = false;
accessibilityContext.applyAccessibilityPreferences();
assert.deepEqual(reducedMotionCalls, [true, false], 'preferência local deve chegar ao overlay nativo ao ativar e desativar');

context.setBreathVisualTarget(element, 'transform', 'scale(1.25)', 2.5, true);
assert.equal(created[0].options.duration, 2500, 'movimento deve usar o restante real da fase, em ms');
assert.equal(created[0].options.easing, 'linear', 'movimento deve acompanhar a cadência da respiração');
assert.equal(created[0].frames.at(-1).transform, 'scale(1.25)');

context.pauseBreathVisuals();
assert.equal(created[0].playState, 'paused', 'pausa do treino deve congelar a animação web');
context.AppState = { mente: { isRunning: true, isPaused: false } };
context.resumeBreathVisuals();
assert.equal(created[0].playState, 'running', 'retomada deve continuar a animação pausada');

classes.add('cf-reduced-motion');
context.setBreathVisualTarget(element, 'transform', 'scale(0.85)', 4, true);
assert.equal(created.length, 1, 'movimento reduzido não deve criar animação');
assert.equal(element.style.transition, 'none');
assert.equal(element.style.transform, 'scale(0.85)', 'movimento reduzido deve mostrar fase estática');

classes.clear();
context.setBreathVisualTarget(element, 'transform', 'scale(0.7)', 0, true);
assert.equal(created.length, 1, 'fase com duração zero não deve iniciar uma animação');
assert.equal(element.style.transform, 'scale(0.7)');

context.cancelBreathVisuals(true);
assert.equal(element.style.transform, '', 'cancelar deve remover transformações residuais');

context.AppState = { mente: { activePattern: 'longa', isRunning: true, isPaused: false, phaseSecLeft: 2, oledMode: false } };
context.updateWatchDisplay = () => {};
for (const [pattern, animatedIds] of [
    ['longa', ['longa-sphere', 'longa-sphere', 'longa-glow', 'longa-glow']],
    ['igual', ['igual-ring-outer', 'igual-ring-mid', 'igual-core']],
    ['custom', ['custom-circle', 'custom-glow']]
]) {
    const applied = [];
    for (const id of animatedIds) {
        const target = document.getElementById(id);
        target.animate = (frames, options) => {
            const animation = {
                frames, options, playState: 'running', effect: { getKeyframes: () => frames },
                pause() { this.playState = 'paused'; }, play() { this.playState = 'running'; },
                cancel() { this.playState = 'idle'; }
            };
            target.animations.push(animation);
            applied.push({ id, options });
            return animation;
        };
    }
    context.AppState.mente.activePattern = pattern;
    context.AppState.mente.phaseSecLeft = 2;
    context.applyBreathPhaseUI({ key: 'inspire', label: 'INSPIRE', text: 'Inspire', sec: 5, scale: 1.2, voice: 'Inspire' }, false, 2);
    assert.equal(applied.length, animatedIds.length, `${pattern} deve animar todas as formas do mesmo padrão`);
    assert(applied.every(item => item.options.duration === 2000), `${pattern} deve usar os 2s ainda informados pelo motor nativo`);
}

context.AppState.mente.isRunning = false;
context.AppState.mente.isPaused = true;
context.applyBreathPhaseUI({ key: 'expire', label: 'EXPIRE', text: 'Expire', sec: 6, scale: 0.85, voice: 'Expire' }, false, 3);
assert.equal(document.getElementById('custom-circle').style.transition, 'none', 'pausa deve manter a forma imóvel até retomar');

const activePhase = { key: 'expire', label: 'EXPIRE', text: 'Expire', sec: 4, scale: 0.85, voice: 'Expire' };
const breathPhases = [
    { key: 'inspire', label: 'INSPIRE', text: 'Inspire', sec: 4, scale: 1.2, voice: 'Inspire' },
    activePhase
];
const activeSphere = document.getElementById('longa-sphere');
context.cancelBreathVisuals(true);
document.getElementById('longa-sphere').animations.length = 0;
context.AppState.mente = { activePattern: 'longa', currentPhaseIdx: 1, phaseSecLeft: 2, isRunning: true, isPaused: false, oledMode: false };
context.AppState.accessibility = { textScale: 'normal', highContrast: false, reducedMotion: false };
context.getActivePatternPhases = () => breathPhases;
context.applyBreathPhaseUI(activePhase, false, 2);
const activeMotion = activeSphere.animations.find(animation => animation.frames.some(frame => frame.transform));
assert(activeMotion, 'fase ativa deve ter animação antes da troca de preferência');
const animationsBeforeReducedMotion = activeSphere.animations.length;
context.AppState.accessibility.reducedMotion = true;
context.applyAccessibilityPreferences();
assert.equal(activeMotion.playState, 'paused', 'ativar movimento reduzido deve congelar a fase atual');
assert.equal(activeSphere.animations.length, animationsBeforeReducedMotion, 'ativar movimento reduzido deve preservar a animação pausada');
context.AppState.accessibility.reducedMotion = false;
context.applyAccessibilityPreferences();
assert.equal(activeMotion.playState, 'running', 'desativar movimento reduzido deve retomar a mesma animação');
assert.equal(activeSphere.animations.length, animationsBeforeReducedMotion, 'retomar movimento deve continuar a animação existente sem recriá-la');
context.applyAccessibilityPreferences();
assert.equal(activeSphere.animations.length, animationsBeforeReducedMotion, 'reaplicar preferências sem trocar movimento não deve reiniciar a fase');

context.AppState.mente.isRunning = false;
context.AppState.mente.isPaused = true;
context.AppState.accessibility.reducedMotion = true;
context.applyAccessibilityPreferences();
assert.equal(activeMotion.playState, 'paused', 'sessão pausada deve manter a animação congelada ao ativar movimento reduzido');
context.AppState.accessibility.reducedMotion = false;
context.applyAccessibilityPreferences();
assert.equal(activeMotion.playState, 'paused', 'desativar movimento reduzido não deve animar enquanto a sessão estiver pausada');

document.getElementById('longa-sphere').animations.length = 0;
context.AppState.mente.isRunning = true;
context.AppState.mente.isPaused = false;
classes.add('cf-reduced-motion');
context.AppState.accessibility.reducedMotion = true;
context.applyBreathPhaseUI(activePhase, false, 2);
const staticScaleBeforeResume = activeSphere.style.transform;
assert.equal(staticScaleBeforeResume, 'scale(1.2)', 'movimento reduzido deve manter a figura no início estático da fase atual');
context.AppState.mente.oledMode = true;
context.applyBreathPhaseUI(activePhase, false, 2);
assert.equal(document.getElementById('oled-longa-sphere').style.transform, 'scale(1.2)', 'OLED deve exibir o mesmo quadro estático de início da fase');
context.AppState.mente.oledMode = false;
context.AppState.accessibility.reducedMotion = false;
context.applyAccessibilityPreferences();
const resumedStaticPhase = activeSphere.animations.find(animation => animation.frames.some(frame => frame.transform));
assert(resumedStaticPhase, 'sessão iniciada em movimento reduzido deve iniciar a fase visual atual ao reativar movimento');
assert.equal(resumedStaticPhase.options.duration, 2000, 'sessão iniciada em movimento reduzido deve respeitar o tempo restante real');
assert.equal(resumedStaticPhase.frames[0].transform, staticScaleBeforeResume, 'retomada deve começar no mesmo quadro que estava visível');
assert.equal(resumedStaticPhase.frames.at(-1).transform, 'scale(0.85)', 'retomada deve terminar na escala da fase atual');
assert.notEqual(resumedStaticPhase.frames[0].transform, resumedStaticPhase.frames.at(-1).transform, 'retomada de uma fase estática deve produzir movimento real');

context.AppState = {
    mente: {
        selectedDuration: 300,
        activePattern: 'caixa',
        currentPhaseIdx: 1,
        phaseSecLeft: 3,
        remainingSessionSec: 250,
        totalSessionSec: 300,
        elapsedSessionSec: 50,
        isRunning: true,
        isPaused: false
    },
    accessibility: { reducedMotion: true }
};
context.getActivePatternPhases = () => [
    { key: 'inspire', label: 'INSPIRE', text: 'Inspire', sec: 4, scale: 1.2 },
    { key: 'hold1', label: 'SEGURE', text: 'Segure', sec: 4, scale: 1.2 },
    { key: 'expire', label: 'EXPIRE', text: 'Expire', sec: 4, scale: 0.7 },
    { key: 'hold2', label: 'VAZIO', text: 'Vazio', sec: 4, scale: 0.7 }
];
classes.add('cf-reduced-motion');
const boxTrack = document.getElementById('box-track-rect');
const oledBoxTrack = document.getElementById('oled-box-track-rect');
context.renderBreathTickUI();
const reducedBoxOffsets = [boxTrack.style.strokeDashoffset, oledBoxTrack.style.strokeDashoffset];
context.AppState.mente.phaseSecLeft = 2;
context.renderBreathTickUI();
assert.deepEqual(
    [boxTrack.style.strokeDashoffset, oledBoxTrack.style.strokeDashoffset],
    reducedBoxOffsets,
    'movimento reduzido deve manter estáticos os trilhos Caixa e OLED entre ticks'
);

const oledEntryPhases = [
    { key: 'inspire', label: 'INSPIRE', text: 'Inspire', sec: 4, scale: 1.2, voice: 'Inspire' },
    { key: 'expire', label: 'EXPIRE', text: 'Expire', sec: 4, scale: 0.85, voice: 'Expire' }
];
context.AppState = {
    mente: { activePattern: 'longa', currentPhaseIdx: 1, phaseSecLeft: 2, isRunning: true, isPaused: false, oledMode: false, cycleCount: 1 },
    accessibility: { textScale: 'normal', highContrast: false, reducedMotion: true }
};
context.BREATH_CONFIGS = { longa: { name: 'Expiração Longa' } };
context.getActivePatternPhases = () => oledEntryPhases;
context.getActivePatternRatioText = () => '4-7-8';
context.updateOledButtonStates = () => {};
context.triggerHaptic = () => {};
classes.add('cf-reduced-motion');
context.enterOledMode();
assert.equal(document.getElementById('longa-sphere').style.transform, 'scale(1.2)', 'entrada no OLED deve preservar o quadro estático web da fase atual');
assert.equal(document.getElementById('oled-longa-sphere').style.transform, 'scale(1.2)', 'entrada no OLED deve iniciar no mesmo quadro estático já visível');

context.AppState.mente.isRunning = false;
context.AppState.mente.isPaused = true;
context.AppState.mente.oledMode = false;
context.enterOledMode();
assert.equal(document.getElementById('longa-sphere').style.transform, 'scale(1.2)', 'sessão pausada em movimento reduzido deve manter o quadro estático web ao entrar em OLED');
assert.equal(document.getElementById('oled-longa-sphere').style.transform, 'scale(1.2)', 'sessão pausada em movimento reduzido deve manter o mesmo quadro ao entrar em OLED');

console.log('Breath visual synchronization and accessibility motion contract: PASS');

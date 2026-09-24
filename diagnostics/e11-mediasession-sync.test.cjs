const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.join(__dirname, '..');
const htmlPaths = [
    path.join(root, 'index.html'),
    path.join(root, 'app', 'src', 'main', 'assets', 'index.html')
];
const buffers = htmlPaths.map(file => fs.readFileSync(file));
assert.equal(Buffer.compare(buffers[0], buffers[1]), 0, 'HTML raiz e asset Android devem permanecer idênticos');
const source = buffers[0].toString('utf8');

function extractFunction(name) {
    const start = source.indexOf(`function ${name}(`);
    assert(start >= 0, `função ausente: ${name}`);
    const bodyStart = source.indexOf('{', start);
    let depth = 0;
    for (let i = bodyStart; i < source.length; i += 1) {
        if (source[i] === '{') depth += 1;
        if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1);
    }
    throw new Error(`bloco incompleto: ${name}`);
}

function extractAssignedFunction(name) {
    const marker = `window.${name} = function`;
    const start = source.indexOf(marker);
    assert(start >= 0, `atribuição ausente: ${name}`);
    const bodyStart = source.indexOf('{', start);
    let depth = 0;
    for (let i = bodyStart; i < source.length; i += 1) {
        if (source[i] === '{') depth += 1;
        if (source[i] === '}' && --depth === 0) {
            return `window.${name} = function${source.slice(source.indexOf('(', start), i + 1)};`;
        }
    }
    throw new Error(`bloco incompleto: ${name}`);
}

assert(source.includes('AndroidBridge?.updateMindfulnessAudioState'), 'JS deve reportar estado (título/tocando/posição/duração) para a bridge nativa sincronizar a notificação/MediaSession');

async function main() {
    // --- notificação (MediaSession) manda "pause": deve pausar o áudio real ---
    let audioPaused = false;
    const audio = {
        get paused() { return audioPaused; },
        pause() { audioPaused = true; },
        play() { audioPaused = false; return Promise.resolve(); }
    };
    const context = vm.createContext({
        mindfulnessPlayer: {},
        AppState: { mindfulnessMuteAlerts: false },
        updateMindfulnessAudioUI() {},
        document: {
            getElementById(id) {
                if (id === 'mindfulnessAudio') return audio;
                if (id === 'mindfulnessTrackTitle') return { innerText: 'Faixa X' };
                return { classList: { add() {}, remove() {}, contains: () => false }, innerText: '' };
            }
        },
        window: { AndroidBridge: {
            setKeepScreenOn() {},
            startMindfulnessAudioSession() {},
            stopMindfulnessAudioSession() {},
            updateMindfulnessAudioState() {}
        } },
        navigator: {},
        console
    });
    context.window.mindfulnessPlayer = context.mindfulnessPlayer;
    vm.runInContext([
        'async ' + extractFunction('toggleMindfulnessAudio'),
        'window.toggleMindfulnessAudio = toggleMindfulnessAudio;',
        extractAssignedFunction('onNativeMindfulnessMediaControl')
    ].join('\n'), context);

    audioPaused = false; // simula áudio tocando
    await context.window.onNativeMindfulnessMediaControl('pause');
    assert.equal(audioPaused, true, 'controle "pause" vindo da notificação/MediaSession deve pausar o áudio real');

    audioPaused = true; // simula áudio pausado
    await context.window.onNativeMindfulnessMediaControl('play');
    assert.equal(audioPaused, false, 'controle "play" vindo da notificação/MediaSession deve retomar o áudio real');

    console.log('E11 sincronização com notificação/MediaSession: PASS');
}

main().catch(err => { console.error(err); process.exit(1); });

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.join(__dirname, '..');
const htmlPaths = [
    path.join(root, 'index.html'),
    path.join(root, 'app', 'src', 'main', 'assets', 'index.html')
];
const buffers = htmlPaths.map(file => fs.readFileSync(file));
assert.equal(Buffer.compare(buffers[0], buffers[1]), 0, 'HTML raiz e asset Android devem permanecer idênticos');
const source = buffers[0].toString('utf8');

// Duração real medida via `ffprobe -show_entries format=duration` em cada arquivo
// (app/src/main/assets/audio/mindfulness/*.mp3), arredondada ao segundo mais próximo.
const REAL_DURATION_SECONDS = {
    1: 574,
    2: 1085,
    3: 579,
    4: 524,
    5: 430,
    6: 662,
    7: 558,
    8: 241
};

function extractPhaseObjects() {
    // Extrai cada literal de objeto de fase (contendo formalTrack) do array de programas.
    const regex = /\{\s*title:[^}]*?formalTrack:\s*'audio\/mindfulness\/(\d)track\.mp3'[^}]*?formalTrackDuration:\s*(\d+)[^}]*?\}/g;
    const matches = [];
    let m;
    while ((m = regex.exec(source)) !== null) {
        matches.push({ raw: m[0], trackNumber: Number(m[1]), declaredDuration: Number(m[2]) });
    }
    return matches;
}

function extractSecondaryDurations() {
    const regex = /secondaryTrack:\s*'audio\/mindfulness\/(\d)track\.mp3'[^}]*?secondaryTrackDuration:\s*(\d+)/g;
    const matches = [];
    let m;
    while ((m = regex.exec(source)) !== null) {
        matches.push({ trackNumber: Number(m[1]), declaredDuration: Number(m[2]) });
    }
    return matches;
}

const TOLERANCE_SECONDS = 5; // tolerância pequena para arredondamento/metadados de encoder

const phases = extractPhaseObjects();
assert.ok(phases.length >= 6, `esperava ao menos 6 fases com formalTrack, encontrou ${phases.length}`);

let mismatches = [];
for (const phase of phases) {
    const real = REAL_DURATION_SECONDS[phase.trackNumber];
    assert.ok(real !== undefined, `faixa desconhecida: ${phase.trackNumber}`);
    const diff = Math.abs(real - phase.declaredDuration);
    if (diff > TOLERANCE_SECONDS) {
        mismatches.push(`faixa ${phase.trackNumber}: declarado ${phase.declaredDuration}s, real ${real}s (diff ${diff}s)`);
    }
}

const secondaries = extractSecondaryDurations();
assert.ok(secondaries.length >= 1, 'esperava ao menos 1 secondaryTrackDuration');
for (const sec of secondaries) {
    const real = REAL_DURATION_SECONDS[sec.trackNumber];
    const diff = Math.abs(real - sec.declaredDuration);
    if (diff > TOLERANCE_SECONDS) {
        mismatches.push(`faixa secundária ${sec.trackNumber}: declarado ${sec.declaredDuration}s, real ${real}s (diff ${diff}s)`);
    }
}

assert.equal(mismatches.length, 0, `formalTrackDuration/secondaryTrackDuration divergem da duração real do arquivo:\n${mismatches.join('\n')}`);

console.log('E11 duração real das faixas de mindfulness (formalTrackDuration/secondaryTrackDuration batem com o arquivo): PASS');

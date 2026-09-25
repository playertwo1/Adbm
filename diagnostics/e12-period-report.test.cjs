const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
function extractFunction(name) {
    const start = html.indexOf(`        function ${name}(`);
    assert(start >= 0, `Função ausente: ${name}`);
    let depth = 0;
    let opened = false;
    for (let index = html.indexOf('{', start); index < html.length; index++) {
        if (html[index] === '{') { depth++; opened = true; }
        if (html[index] === '}' && opened && --depth === 0) return html.slice(start, index + 1);
    }
    throw new Error(`Função incompleta: ${name}`);
}

const elements = new Map();
function element(id) {
    if (!elements.has(id)) elements.set(id, { id, innerHTML: '', innerText: '', textContent: '', value: '' });
    return elements.get(id);
}
let printCalls = 0;
const fixedNow = '2026-09-24T12:00:00';
const context = vm.createContext({
    AppState: {
        evolutionPeriod: 'this_week',
        schedule: [],
        streak: 4,
        activityLog: {
            '2026-09-14': { minutes: 15, sessions: 2, sources: {} },
            '2026-09-15': { minutes: 30, sessions: 3, sources: {} },
            '2026-09-07': { minutes: 15, sessions: 1, sources: {} },
            '2026-09-21': { minutes: 999, sessions: 99, sources: {} }
        }
    },
    Date: class extends Date {
        constructor(...args) { if (args.length === 0) super(fixedNow); else super(...args); }
        static now() { return new Date(fixedNow).getTime(); }
    },
    document: { getElementById: element },
    window: { AndroidBridge: { printPdf() { printCalls++; } } },
    triggerHaptic() {}
});

const source = [
    extractFunction('localDateKey'),
    extractFunction('weekDateKeys'),
    extractFunction('getEvolutionPeriodConfig'),
    extractFunction('exportPerformancePDF')
].join('\n\n');
vm.runInContext(source, context);

element('evolutionPeriodSelect').value = 'last_week';
context.exportPerformancePDF();
assert.match(element('printReportTitle').innerText, /Semana anterior/,
    'relatório deve usar o período atualmente selecionado, não o padrão salvo');
assert.equal(element('printStreak').innerText, '2 / 7 dias ativos',
    'dias ativos devem corresponder ao recorte selecionado');
assert.equal(element('printCompleted').innerText, '5 sessões',
    'sessões devem somar somente os dias do período selecionado');
assert.equal(element('printTime').innerText, '45 min',
    'minutos do PDF devem coincidir com a soma do período');
assert.match(element('printTableBody').innerHTML, /2026-09-14/,
    'tabela deve listar dias do período selecionado');
assert.doesNotMatch(element('printTableBody').innerHTML, /2026-09-21/,
    'tabela não deve incluir dias fora do período selecionado');
assert.match(element('printPeriodNote').innerText, /semana retrasada/,
    'comparação do relatório deve usar a base correspondente ao mesmo período');

context.AppState.activityLog = {};
element('evolutionPeriodSelect').value = 'this_week';
context.exportPerformancePDF();
assert.match(element('printPeriodNote').innerText, /Comparação indisponível/,
    'relatório não deve inventar percentual sem base anterior');
assert.equal(element('printTime').innerText, '0 min', 'período vazio deve exportar zero real');
assert.equal(printCalls, 2, 'cada exportação deve acionar a impressão nativa uma vez');

const profileStart = html.indexOf('<section id="tab-perfil"');
assert(profileStart >= 0, 'aba Perfil precisa existir');
const profileEnd = html.indexOf('</section>', profileStart);
const profileMarkup = html.slice(profileStart, profileEnd);
assert.match(profileMarkup, /onclick="openProgressProtection\(\); exportProgressCopy\(\)"/,
    'backup deve poder ser exportado diretamente pela aba Perfil');
assert.match(profileMarkup, /onclick="openProgressProtection\(\); chooseProgressImport\(\)"/,
    'recuperação de backup deve continuar acessível pela aba Perfil');

console.log('E12 relatório: período/dados selecionados e acesso ao backup no Perfil — PASS');

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

// E12.2 — detalhe diário baseado apenas em registros existentes e totais agregados reais.
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const asset = fs.readFileSync(path.join(root, 'app', 'src', 'main', 'assets', 'index.html'), 'utf8');
assert.ok(source === asset, 'HTML principal e asset Android devem permanecer idênticos');
assert.ok(/data-evolution-day="\$\{d\.key\}"/.test(source), 'cada dia deve ter controle expansível associado à data');
assert.ok(/aria-controls="evolutionDayDetails-\$\{d\.key\}"/.test(source), 'controle diário deve apontar para seu painel acessível');
assert.ok(/function toggleEvolutionDay\(button\)/.test(source), 'handler de abertura/fechamento do dia deve existir');

function extractFunction(code, name) {
    const start = code.indexOf(`        function ${name}(`);
    assert(start >= 0, `Função ausente no código: ${name}`);
    let depth = 0;
    let opened = false;
    for (let i = code.indexOf('{', start); i < code.length; i++) {
        if (code[i] === '{') { depth++; opened = true; }
        if (code[i] === '}' && opened && --depth === 0) return code.slice(start, i + 1);
    }
    throw new Error(`Bloco incompleto para função: ${name}`);
}

function makeElement(id) {
    const el = {
        id, value: '', innerHTML: '', textContent: '', attributes: {}, dataset: {},
        _classes: new Set(),
        classList: {
            add(...names) { names.forEach(name => el._classes.add(name)); },
            remove(...names) { names.forEach(name => el._classes.delete(name)); },
            contains(name) { return el._classes.has(name); },
            toggle(name, force) {
                const shouldAdd = force === undefined ? !el._classes.has(name) : Boolean(force);
                if (shouldAdd) el._classes.add(name); else el._classes.delete(name);
                return shouldAdd;
            }
        },
        setAttribute(name, value) { el.attributes[name] = String(value); },
        getAttribute(name) { return el.attributes[name] ?? null; }
    };
    return el;
}

const elements = new Map();
const getElementById = id => {
    if (!elements.has(id)) elements.set(id, makeElement(id));
    return elements.get(id);
};
const fixedNow = '2026-09-24T12:00:00';
const context = vm.createContext({
    AppState: {
        activityLog: {}, evolutionPeriod: 'this_week',
        pausas: { history: [] }, mente: { history: [] }
    },
    CorePersistence: { sessionHistory: [] },
    document: { getElementById },
    Date: class extends Date {
        constructor(...args) { if (args.length === 0) super(fixedNow); else super(...args); }
        static now() { return new Date(fixedNow).getTime(); }
    }
});
vm.runInContext([
    extractFunction(source, 'localDateKey'),
    extractFunction(source, 'weekDateKeys'),
    extractFunction(source, 'getEvolutionPeriodConfig'),
    extractFunction(source, 'renderEvolutionPeriod'),
    extractFunction(source, 'toggleEvolutionDay')
].join('\n\n'), context);

const mondayTimestamp = new Date(2026, 8, 21, 12).getTime();
const sundayTimestamp = new Date(2026, 8, 20, 12).getTime();
context.AppState.activityLog = {
    '2026-09-21': { minutes: 20, sessions: 4, sources: { program: 2, vacuum: 2, stretch: 2 } },
    '2026-09-22': { minutes: 30, sessions: 4, sources: { kegel: 2, bracing: 1, mindfulness: 1 } },
    '2026-09-23': { minutes: 10, sessions: 1, sources: { bracing: 1 } }
};
context.AppState.pausas.history = [
    { id: `corpo_${mondayTimestamp}`, title: '<img src="x" onerror="alert(1)">', durationMin: 3, dateStr: '21/09 12:00' },
    { id: `corpo_${sundayTimestamp}`, title: 'Antigo alongamento', durationMin: 2, dateStr: '20/09 12:00' }
];
context.AppState.mente.history = [
    { id: mondayTimestamp + 60000, patternName: 'Respiração quadrada', durationMin: 5, durationSec: 300, cycles: 4, dateStr: '21/09 12:01' }
];
context.CorePersistence.sessionHistory = [
    {
        id: 'session-vacuum-1', schemaVersion: 1, programId: '3', phaseIndex: 0,
        date: '2026-09-21', status: 'completed', plannedSeries: 4, completedSeries: 4,
        retentionSeconds: 90, recoverySeconds: 60, totalElapsedSeconds: 255, pausedSeconds: 0, interrupted: false, feedback: null
    },
    {
        id: 'legacy-untrusted-id', schemaVersion: 1, programId: '<script>alert(1)</script>', phaseIndex: 0,
        date: '2026-09-21', status: 'interrupted', plannedSeries: 3, completedSeries: 1,
        retentionSeconds: 30, recoverySeconds: 15, pausedSeconds: 0, interrupted: true, feedback: 'difficult'
    },
    {
        id: 'other-day', schemaVersion: 1, programId: '3', phaseIndex: 0,
        date: '2026-09-20', status: 'completed', plannedSeries: 1, completedSeries: 1,
        retentionSeconds: 20, recoverySeconds: 10, pausedSeconds: 0, interrupted: false, feedback: null
    }
];
context.renderEvolutionPeriod('this_week');

const summary = getElementById('evolutionDailySummaryContainer').innerHTML;
const total = getElementById('weeklyTimeSummaryCardContainer').innerHTML;
assert.match(total, /60\s*min/i, 'total do período deve somar os minutos reais dos dias');
const dailyTotals = [...summary.matchAll(/data-evolution-day-total="(\d+)"/g)].map(match => Number(match[1]));
assert.equal(dailyTotals.length, 7, 'período semanal deve renderizar os sete totais diários');
assert.equal(dailyTotals.reduce((sum, minutes) => sum + minutes, 0), 60, 'soma dos totais diários deve conferir com o total do período');
const insight = getElementById('evolutionTimeInsight').innerHTML;
assert.match(insight, /12h/, 'insight deve usar o horário real dos registros do período');
assert.match(insight, /2 registros com horário/, 'insight deve contar somente registros com timestamp preservado');
assert.match(insight, /frequência observada, não desempenho/i, 'insight deve falar de frequência, não inferir rendimento');
context.AppState.pausas.history = [];
context.AppState.mente.history = [];
context.renderEvolutionPeriod('last_week');
const emptyInsight = getElementById('evolutionTimeInsight').innerHTML;
assert.match(emptyInsight, /Sem horários individuais preservados/, 'período sem timestamps não deve inventar horário de prática');
assert.match(emptyInsight, /frequência observada, não desempenho/i, 'período sem horário também deve negar inferência de rendimento');
assert.doesNotMatch(emptyInsight, /12h/, 'horários de outro período não devem vazar para a seleção atual');
assert.match(summary, /aria-expanded="false"/, 'dias começam fechados');
assert.match(summary, /id="evolutionDayDetails-2026-09-21"[^>]*hidden/, 'painel de detalhes começa oculto');
assert.match(summary, /Vácuo/, 'registro real programId 3 deve receber rótulo conhecido');
assert.match(summary, /Concluída/, 'detalhe deve exibir o estado real da sessão');
assert.match(summary, /Interrompida/, 'sessão interrompida deve ser identificada sem conclusão integral');
assert.match(summary, /1\/3 séries/, 'sessão interrompida deve preservar a contagem parcial real');
assert.match(summary, /4\/4 séries/, 'detalhe deve exibir séries registradas');
assert.match(summary, /Retenção 90s/, 'detalhe deve exibir duração real de retenção');
assert.match(summary, /Recuperação 60s/, 'detalhe deve exibir recuperação separadamente da retenção');
assert.match(summary, /Tempo total: 4m 15s/, 'tempo total deve usar o valor real persistido');
assert.match(summary, /Feedback: Não registrado/, 'feedback ausente deve ser identificado explicitamente');
assert.match(summary, /Tempo total não registrado/, 'histórico legado não deve receber total estimado');
assert.match(summary, /Feedback: Difícil/, 'feedback registrado deve ser traduzido para o histórico');
assert.match(summary, /&lt;img src=&quot;x&quot; onerror=&quot;alert\(1\)&quot;&gt;/, 'título persistido deve escapar HTML e aspas');
assert.doesNotMatch(summary, /<img src="x" onerror="alert\(1\)">/, 'título hostil não deve executar como HTML');
assert.match(summary, /Respiração quadrada/, 'histórico de respiração do mesmo dia deve aparecer');
assert.match(summary, /3 min/, 'detalhe de mobilidade deve exibir duração salva');
assert.match(summary, /5 min/, 'detalhe de respiração deve exibir duração salva');
assert.match(summary, /Registros detalhados preservados: 4/, 'painel deve contar registros individuais de todas as fontes disponíveis');
assert.match(summary, /Kegel — 2 sessões/, 'sessões Kegel sem log individual devem usar a contagem agregada real');
assert.match(summary, /Bracing — 1 sessão/, 'sessão Bracing sem log individual deve usar a contagem agregada real');
assert.match(summary, /Mindfulness — 1 sessão/, 'sessão Mindfulness sem log individual deve usar a contagem agregada real');
assert.match(summary, /Sessões sem detalhe individual: 4/, 'lacuna individual deve ser explicitada sem alterar o total agregado');
assert.match(summary, /Detalhes individuais indisponíveis/, 'dia sem registros detalhados deve declarar a limitação sem inventar sessões');
assert.doesNotMatch(summary, /Antigo alongamento/, 'histórico de outra data não deve aparecer no dia selecionado');
assert.doesNotMatch(summary, /<script>alert\(1\)<\/script>/, 'ID de programa não confiável não deve ser injetado no HTML');

const button = makeElement('day-toggle');
button.dataset.evolutionDay = '2026-09-21';
button.setAttribute('aria-expanded', 'false');
const details = getElementById('evolutionDayDetails-2026-09-21');
details.classList.add('hidden');
context.toggleEvolutionDay(button);
assert.equal(button.getAttribute('aria-expanded'), 'true', 'ativar dia deve atualizar aria-expanded');
assert.equal(details.classList.contains('hidden'), false, 'ativar dia deve abrir o painel relacionado');
context.toggleEvolutionDay(button);
assert.equal(button.getAttribute('aria-expanded'), 'false', 'segundo toque deve fechar o painel');
assert.equal(details.classList.contains('hidden'), true, 'segundo toque deve ocultar o painel');

const invalidButton = makeElement('invalid-day');
invalidButton.dataset.evolutionDay = 'not-a-date';
context.toggleEvolutionDay(invalidButton);
assert.equal(elements.has('evolutionDayDetails-not-a-date'), false, 'data inválida deve ser ignorada sem criar alvo');

console.log('E12.2: sessão diária expansível, agregados consistentes e ausência de detalhes tratada honestamente — PASS');

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

// E12.1 — Tela 09: Evolução (Consistência do Período Selecionado)
//
// Opções de período declaradas para a fatia E12.1:
// 1. 'this_week' ("Esta semana") — Padrão do mockup 09-evolucao.png (Segunda a Domingo da semana corrente).
//    Janela equivalente imediatamente anterior: Semana anterior (7 dias).
// 2. 'last_week' ("Semana anterior") — Segunda a Domingo da semana anterior.
//    Janela equivalente imediatamente anterior: 2 semanas atrás (7 dias).
// 3. 'last_7_days' ("Últimos 7 dias") — Janela deslizante dos últimos 7 dias até hoje.
//    Janela equivalente imediatamente anterior: 7 dias imediatamente anteriores (D-13 a D-7).
//
// Regras obrigatórias:
// - O período selecionado atualiza coerentemente: total, comparação, gráfico diário e resumo por dia.
// - Todos os 4 componentes usam exatamente a mesma seleção e data range.
// - Comparação usa a janela equivalente anterior; sem base anterior real (>0), exibe "Comparação indisponível" (nunca inventar +100%).
// - Usa apenas dados reais de AppState.activityLog sem fabricar sessões ou métricas.

const root = path.join(__dirname, '..');
const htmlPaths = [
    path.join(root, 'index.html'),
    path.join(root, 'app', 'src', 'main', 'assets', 'index.html')
];

const [source, assetSource] = htmlPaths.map(p => fs.readFileSync(p, 'utf8'));

// 1. Contrato de integridade dos arquivos (evita imprimir arquivos inteiros no assert)
assert.ok(source === assetSource, 'index.html e asset embarcado devem ser idênticos');

// 2. Contrato de markup no tab-dashboard (assert.ok para evitar dump do HTML de 800KB)
assert.ok(/id="tab-dashboard"/.test(source), 'tab-dashboard deve existir');
assert.ok(/id="evolutionPeriodSelect"/.test(source), 'seletor de período evolutionPeriodSelect deve existir em tab-dashboard');
assert.ok(/<select id="evolutionPeriodSelect"[^>]*class="[^"]*cf-selector/.test(source), 'seletor deve respeitar alvo de toque mínimo do projeto via cf-selector');
assert.ok(/(value="this_week"[^>]*selected|selected[^>]*value="this_week")/.test(source), 'opção padrão deve ser this_week (Esta semana)');
assert.ok(/value="last_week"/.test(source), 'opção last_week (Semana anterior) deve existir');
assert.ok(/value="last_7_days"/.test(source), 'opção last_7_days (Últimos 7 dias) deve existir');
assert.ok(/id="weeklyTimeSummaryCardContainer"/.test(source), 'container do resumo de tempo deve existir');
assert.ok(/id="weeklyBarsContainer"/.test(source), 'container de barras diárias deve existir');
assert.ok(/id="evolutionDailySummaryContainer"/.test(source), 'container do histórico/resumo por dia deve existir');

function extractFunction(code, name) {
    const start = code.indexOf(`        function ${name}(`);
    assert(start >= 0, `Função ausente no código: ${name}`);
    let depth = 0;
    let opened = false;
    for (let i = code.indexOf('{', start); i < code.length; i++) {
        if (code[i] === '{') { depth++; opened = true; }
        if (code[i] === '}' && opened && --depth === 0) {
            return code.slice(start, i + 1);
        }
    }
    throw new Error(`Bloco incompleto para função: ${name}`);
}

function makeElement(id) {
    const el = {
        id,
        value: '',
        innerText: '',
        innerHTML: '',
        textContent: '',
        attributes: {},
        _classes: new Set(),
        classList: {
            add(...cls) { cls.forEach(c => el._classes.add(c)); },
            remove(...cls) { cls.forEach(c => el._classes.delete(c)); },
            contains(c) { return el._classes.has(c); }
        },
        setAttribute(k, v) { el.attributes[k] = String(v); },
        getAttribute(k) { return el.attributes[k] ?? null; },
        querySelector() { return null; },
        querySelectorAll() { return []; }
    };
    return el;
}

function setupContext(mockDateStr = '2026-09-24T12:00:00') {
    const elements = new Map();
    const getElementById = id => {
        if (!elements.has(id)) elements.set(id, makeElement(id));
        return elements.get(id);
    };

    // Pre-populate select element
    const selectEl = getElementById('evolutionPeriodSelect');
    selectEl.value = 'this_week';

    const appStateStart = source.indexOf('        const AppState = {');
    const appStateEnd = source.indexOf('        const CORE_DATA_VERSION', appStateStart);
    assert(appStateStart >= 0 && appStateEnd > appStateStart, 'AppState ausente');
    const appStateCode = source.slice(appStateStart, appStateEnd);

    const context = vm.createContext({
        console: { log() {} },
        document: {
            getElementById,
            querySelector: () => null,
            querySelectorAll: () => []
        },
        window: {},
        Date: class extends Date {
            constructor(...args) {
                if (args.length === 0) super(mockDateStr);
                else super(...args);
            }
            static now() { return new Date(mockDateStr).getTime(); }
        },
        triggerHaptic() {},
        saveState() { return true; }
    });

    const fnsToLoad = [
        appStateCode,
        'const CORE_DATA_VERSION = 3;',
        extractFunction(source, 'localDateKey'),
        extractFunction(source, 'weekDateKeys'),
        extractFunction(source, 'syncDerivedStats'),
        extractFunction(source, 'getEvolutionPeriodConfig'),
        extractFunction(source, 'setEvolutionPeriod'),
        extractFunction(source, 'renderEvolutionPeriod'),
        extractFunction(source, 'renderWeeklyTimeSummary'),
        extractFunction(source, 'renderWeeklyChart')
    ].join('\n\n');

    vm.runInContext(fnsToLoad, context);
    // Const declarations remain lexical in a VM context; expose state for scenario fixtures.
    vm.runInContext('globalThis.AppState = AppState;', context);

    return { context, elements, getElementById };
}

// =====================================================================
// BATERIA DE TESTES DE REGRESSÃO E12.1
// =====================================================================

// Cenário 1: Instalação limpa / Período Padrão "this_week" sem atividade
{
    const { context, getElementById } = setupContext('2026-09-24T12:00:00'); // Quinta-feira estável
    context.AppState.activityLog = {};
    context.syncDerivedStats();
    context.renderEvolutionPeriod('this_week');

    const totalContainer = getElementById('weeklyTimeSummaryCardContainer');
    const chartContainer = getElementById('weeklyBarsContainer');
    const summaryContainer = getElementById('evolutionDailySummaryContainer');
    const selectEl = getElementById('evolutionPeriodSelect');

    assert.equal(selectEl.value, 'this_week', 'período padrão no seletor deve ser this_week');
    assert.match(totalContainer.innerHTML, /0\s*min/i, 'total zerado deve exibir 0 min');
    assert.match(totalContainer.innerHTML, /indispon[íi]vel/i, 'sem base anterior, comparação deve ser indisponível');
    assert.doesNotMatch(totalContainer.innerHTML, /\+100%/, 'sem base anterior, NUNCA inventar +100%');

    // Resumo diário deve conter os 7 dias da semana (Seg a Dom)
    assert.match(summaryContainer.innerHTML, /Seg/i, 'resumo diário deve conter Seg');
    assert.match(summaryContainer.innerHTML, /Dom/i, 'resumo diário deve conter Dom');
    assert.match(chartContainer.innerHTML, /Seg/i, 'gráfico diário deve conter Seg');
    assert.match(chartContainer.innerHTML, /Dom/i, 'gráfico diário deve conter Dom');

    console.log('✓ Cenário 1: Período padrão "this_week" sem atividade — total 0m, comparação indisponível sem +100%, dias coerentes.');
}

// Cenário 2: Atividade real na semana corrente SEM base anterior (Semana passada = 0)
// 2026-09-24 é Quinta-feira da semana de 2026-09-21 a 2026-09-27.
// Seg (2026-09-21): 20 min, 1 sessão
// Ter (2026-09-22): 30 min, 2 sessões
// Qua (2026-09-23): 10 min, 1 sessão
// Total = 60 min. Semana anterior = 0 min.
{
    const { context, getElementById } = setupContext('2026-09-24T12:00:00');
    context.AppState.activityLog = {
        '2026-09-21': { minutes: 20, sessions: 1, sources: { vacuo: 1 } },
        '2026-09-22': { minutes: 30, sessions: 2, sources: { vacuo: 1, pausa: 1 } },
        '2026-09-23': { minutes: 10, sessions: 1, sources: { mindfulness: 1 } }
    };
    context.syncDerivedStats();
    context.renderEvolutionPeriod('this_week');

    const totalContainer = getElementById('weeklyTimeSummaryCardContainer');
    const chartContainer = getElementById('weeklyBarsContainer');
    const summaryContainer = getElementById('evolutionDailySummaryContainer');

    // Total: 60 min (ou 1h 00m / 60 min)
    assert.match(totalContainer.innerHTML, /60\s*min|1h(\s*00?m)?/i, 'total deve refletir soma real de 60 min');

    // Sem base anterior: DEVE ser indisponível, NUNCA +100%
    assert.match(totalContainer.innerHTML, /indispon[íi]vel/i, 'sem base anterior (0 min semana passada), comparação deve ser indisponível');
    assert.doesNotMatch(totalContainer.innerHTML, /\+100%/, 'não deve fabricar +100%');

    // Gráfico diário deve conter os minutos reais dos dias
    assert.match(chartContainer.innerHTML, /20m|20\s*min/i, 'gráfico deve conter 20m para Seg');
    assert.match(chartContainer.innerHTML, /30m|30\s*min/i, 'gráfico deve conter 30m para Ter');
    assert.match(chartContainer.innerHTML, /10m|10\s*min/i, 'gráfico deve conter 10m para Qua');

    // Resumo diário por dia: soma dos dias deve bater exatamente 60 min
    assert.match(summaryContainer.innerHTML, /20\s*min/i, 'resumo diário deve mostrar 20 min');
    assert.match(summaryContainer.innerHTML, /30\s*min/i, 'resumo diário deve mostrar 30 min');
    assert.match(summaryContainer.innerHTML, /10\s*min/i, 'resumo diário deve mostrar 10 min');

    console.log('✓ Cenário 2: Atividade real sem base anterior — total 60m, comparação indisponível (sem +100%), dados reais.');
}

// Cenário 3: Comparação válida positiva (Semana atual 60m vs Semana anterior 40m -> +50%)
// Semana anterior (2026-09-14 a 2026-09-20): 40 min
// Semana atual (2026-09-21 a 2026-09-27): 60 min
// Variação: (60 - 40) / 40 = +50%
{
    const { context, getElementById } = setupContext('2026-09-24T12:00:00');
    context.AppState.activityLog = {
        '2026-09-15': { minutes: 40, sessions: 2, sources: { vacuo: 2 } },
        '2026-09-21': { minutes: 20, sessions: 1, sources: { vacuo: 1 } },
        '2026-09-22': { minutes: 40, sessions: 2, sources: { vacuo: 2 } }
    };
    context.syncDerivedStats();
    context.renderEvolutionPeriod('this_week');

    const totalContainer = getElementById('weeklyTimeSummaryCardContainer');
    assert.match(totalContainer.innerHTML, /60\s*min|1h(\s*00?m)?/i, 'total da semana atual deve ser 60 min');
    assert.match(totalContainer.innerHTML, /\+50%/, 'comparação com base real de 40m deve ser +50%');
    assert.doesNotMatch(totalContainer.innerHTML, /indispon[íi]vel/i, 'com base real anterior, comparação NÃO deve ser indisponível');

    console.log('✓ Cenário 3: Comparação com base anterior real (+50%) calculada com exatidão.');
}

// Cenário 4: Comparação válida negativa (Semana atual 30m vs Semana anterior 60m -> -50%)
{
    const { context, getElementById } = setupContext('2026-09-24T12:00:00');
    context.AppState.activityLog = {
        '2026-09-15': { minutes: 60, sessions: 2, sources: { vacuo: 2 } },
        '2026-09-21': { minutes: 30, sessions: 1, sources: { vacuo: 1 } }
    };
    context.syncDerivedStats();
    context.renderEvolutionPeriod('this_week');

    const totalContainer = getElementById('weeklyTimeSummaryCardContainer');
    assert.match(totalContainer.innerHTML, /30\s*min/i, 'total da semana atual deve ser 30 min');
    assert.match(totalContainer.innerHTML, /-50%/, 'comparação com base real anterior deve ser -50%');

    console.log('✓ Cenário 4: Comparação negativa (-50%) com base anterior real calculada com exatidão.');
}

// Cenário 5: Troca de período para "last_week" (Semana anterior)
// Ao selecionar 'last_week', todos os 4 componentes devem sincronizar com os dados da semana passada:
// - Total: 60m (da semana passada)
// - Gráfico diário: mostra as barras da semana passada
// - Resumo diário: mostra os dias da semana passada (soma = 60m)
// - Comparação: usa a semana retrasada como janela equivalente imediatamente anterior
{
    const { context, getElementById } = setupContext('2026-09-24T12:00:00');
    context.AppState.activityLog = {
        '2026-09-15': { minutes: 60, sessions: 2, sources: { vacuo: 2 } },
        '2026-09-21': { minutes: 30, sessions: 1, sources: { vacuo: 1 } }
    };
    context.syncDerivedStats();

    // Troca para 'last_week'
    context.setEvolutionPeriod('last_week');

    const selectEl = getElementById('evolutionPeriodSelect');
    const totalContainer = getElementById('weeklyTimeSummaryCardContainer');
    const chartContainer = getElementById('weeklyBarsContainer');
    const summaryContainer = getElementById('evolutionDailySummaryContainer');

    assert.equal(selectEl.value, 'last_week', 'seletor deve refletir last_week');
    assert.match(totalContainer.innerHTML, /60\s*min|1h(\s*00?m)?/i, 'total de last_week deve ser 60 min');
    assert.match(chartContainer.innerHTML, /60m|60\s*min/i, 'gráfico de last_week deve conter os 60m');
    assert.match(summaryContainer.innerHTML, /60\s*min/i, 'resumo de last_week deve conter os 60m');
    assert.doesNotMatch(summaryContainer.innerHTML, /30\s*min/i, 'resumo de last_week NÃO deve misturar dados da semana atual');

    // Semana retrasada não teve atividade (0 min) -> comparação de last_week deve ser indisponível
    assert.match(totalContainer.innerHTML, /indispon[íi]vel/i, 'comparação sem base 2 semanas atrás deve ser indisponível');

    console.log('✓ Cenário 5: Troca para "last_week" atualiza coerentemente total, gráfico, resumo e comparação.');
}

// Cenário 6: Troca de período para "last_7_days" (Últimos 7 dias deslizantes)
// Hoje: 2026-09-24. Últimos 7 dias: 2026-09-18 a 2026-09-24.
// Dias anteriores equivalentes: 2026-09-11 a 2026-09-17.
{
    const { context, getElementById } = setupContext('2026-09-24T12:00:00');
    context.AppState.activityLog = {
        '2026-09-15': { minutes: 50, sessions: 2, sources: { vacuo: 2 } }, // nos 7 dias anteriores
        '2026-09-20': { minutes: 25, sessions: 1, sources: { vacuo: 1 } }, // nos últimos 7 dias
        '2026-09-24': { minutes: 25, sessions: 1, sources: { vacuo: 1 } }  // nos últimos 7 dias
    };
    context.syncDerivedStats();

    context.setEvolutionPeriod('last_7_days');

    const selectEl = getElementById('evolutionPeriodSelect');
    const totalContainer = getElementById('weeklyTimeSummaryCardContainer');
    const chartContainer = getElementById('weeklyBarsContainer');
    const summaryContainer = getElementById('evolutionDailySummaryContainer');

    assert.equal(selectEl.value, 'last_7_days', 'seletor deve refletir last_7_days');
    assert.match(totalContainer.innerHTML, /50\s*min/i, 'total dos últimos 7 dias deve ser 50 min (25+25)');
    assert.match(totalContainer.innerHTML, /0%|igual/i, 'comparação 50m vs 50m deve ser igual / 0%');

    assert.match(summaryContainer.innerHTML, /25\s*min/i, 'resumo dos últimos 7 dias deve conter os 25m');
    assert.match(chartContainer.innerHTML, /25m|25\s*min/i, 'gráfico dos últimos 7 dias deve conter 25m');

    console.log('✓ Cenário 6: Troca para "last_7_days" usa janela deslizante de 7 dias com janela anterior equivalente.');
}

// Cenário 7: Fallback de período desconhecido para default "this_week"
{
    const { context, getElementById } = setupContext('2026-09-24T12:00:00');
    const config = context.getEvolutionPeriodConfig('periodo_desconhecido');
    assert.equal(config.id, 'this_week', 'getEvolutionPeriodConfig deve fazer fallback para this_week');

    context.setEvolutionPeriod('periodo_desconhecido');
    const selectEl = getElementById('evolutionPeriodSelect');
    assert.equal(selectEl.value, 'this_week', 'período inválido deve fazer fallback para this_week');

    context.renderEvolutionPeriod('periodo_desconhecido');
    const totalContainer = getElementById('weeklyTimeSummaryCardContainer');
    assert.match(totalContainer.innerHTML, /0\s*min/i, 'renderEvolutionPeriod com período desconhecido deve fazer fallback para this_week');

    console.log('✓ Cenário 7: Fallback seguro para "this_week" em período desconhecido.');
}

// Cenário 8: Funções legadas renderWeeklyTimeSummary e renderWeeklyChart chamam o render unificado
{
    const { context, getElementById } = setupContext('2026-09-24T12:00:00');
    context.AppState.activityLog = {
        '2026-09-24': { minutes: 15, sessions: 1, sources: { vacuo: 1 } }
    };
    context.syncDerivedStats();
    context.renderWeeklyTimeSummary();
    const totalContainer = getElementById('weeklyTimeSummaryCardContainer');
    assert.match(totalContainer.innerHTML, /15\s*min/i, 'renderWeeklyTimeSummary deve atualizar total com 15 min');

    context.renderWeeklyChart();
    const chartContainer = getElementById('weeklyBarsContainer');
    assert.match(chartContainer.innerHTML, /15m|15\s*min/i, 'renderWeeklyChart deve atualizar gráfico');

    console.log('✓ Cenário 8: Compatibilidade reversa com chamadores de renderWeeklyTimeSummary e renderWeeklyChart mantida.');
}

console.log('\n============================================================');
console.log('E12.1 SUÍTE DE DIAGNÓSTICO: TODOS OS CENÁRIOS PASSARAM COM SUCESSO');
console.log('============================================================');

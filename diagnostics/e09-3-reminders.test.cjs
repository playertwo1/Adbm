const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

// E09.3 — Executa os consumidores reais de lembretes nas duas entradas HTML,
// cobrindo posições de sessão, validação, persistência e bridge.

const root = path.join(__dirname, '..');
const htmlPaths = [
    path.join(root, 'index.html'),
    path.join(root, 'app', 'src', 'main', 'assets', 'index.html')
];

// Comparação de equivalência byte a byte dos dois HTMLs
const buffers = htmlPaths.map(file => fs.readFileSync(file));
assert.equal(
    Buffer.compare(buffers[0], buffers[1]),
    0,
    'HTML raiz e asset embarcado precisam permanecer byte a byte idênticos'
);
const source = buffers[0].toString('utf8');

function extractFunction(sourceCode, name) {
    const start = sourceCode.search(new RegExp(`(?:async\\s+)?function\\s+${name}\\s*\\(`));
    assert(start >= 0, `Função ausente no código-fonte: ${name}`);
    const bodyStart = sourceCode.indexOf('{', start);
    let depth = 0;
    for (let index = bodyStart; index < sourceCode.length; index += 1) {
        if (sourceCode[index] === '{') depth += 1;
        if (sourceCode[index] === '}' && --depth === 0) {
            return sourceCode.slice(start, index + 1);
        }
    }
    throw new Error(`Bloco incompleto para função: ${name}`);
}

function extractIntervalCallback(sourceCode) {
    const marker = 'if (hasNativeReminderScheduler()) return;';
    const markerIndex = sourceCode.indexOf(marker);
    assert(markerIndex >= 0, 'Trecho do fallback de lembretes em browser não encontrado');
    const setIntervalIndex = sourceCode.lastIndexOf('setInterval', markerIndex);
    assert(setIntervalIndex >= 0, 'Início do setInterval não encontrado');
    const bodyStart = sourceCode.indexOf('{', setIntervalIndex);
    let depth = 0;
    let bodyEnd = -1;
    for (let index = bodyStart; index < sourceCode.length; index += 1) {
        if (sourceCode[index] === '{') depth += 1;
        else if (sourceCode[index] === '}') {
            depth -= 1;
            if (depth === 0) {
                bodyEnd = index;
                break;
            }
        }
    }
    assert(bodyEnd > bodyStart, 'Corpo do setInterval incompleto');
    return `function runBrowserReminderIntervalTick() ${sourceCode.slice(bodyStart, bodyEnd + 1)}`;
}

function makeElement(id) {
    const element = {
        id,
        value: '',
        innerText: '',
        textContent: '',
        checked: false,
        attributes: {},
        style: {
            values: {},
            setProperty(name, val) { this.values[name] = String(val); },
            removeProperty(name) { delete this.values[name]; }
        },
        _classes: new Set(['hidden']),
        classList: {
            add(...names) { names.forEach(name => element._classes.add(name)); },
            remove(...names) { names.forEach(name => element._classes.delete(name)); },
            toggle(name, force) {
                if (force === undefined) {
                    if (element._classes.has(name)) element._classes.delete(name);
                    else element._classes.add(name);
                } else if (force) {
                    element._classes.add(name);
                } else {
                    element._classes.delete(name);
                }
            },
            contains(name) { return element._classes.has(name); }
        },
        setAttribute(name, val) { element.attributes[name] = String(val); },
        getAttribute(name) { return element.attributes[name] ?? null; },
        removeAttribute(name) { delete element.attributes[name]; },
        querySelector() { return null; },
        querySelectorAll() { return []; }
    };
    return element;
}

function createFixedDateClass(hours = 16, minutes = 0) {
    return class FixedDate extends Date {
        constructor(...args) {
            if (args.length === 0) {
                super(2026, 8, 22, hours, minutes, 0, 0);
            } else {
                super(...args);
            }
        }
        static now() {
            return new Date(2026, 8, 22, hours, minutes, 0, 0).getTime();
        }
    };
}

function setupEnvironment() {
    const elements = new Map();
    const getElementById = id => {
        if (!elements.has(id)) elements.set(id, makeElement(id));
        return elements.get(id);
    };

    const alertLog = [];
    const bridgeCalls = [];
    const AndroidBridge = {
        scheduleProgramReminders(id, title, time1, time2, dailyTarget, enabled, showConfirmation) {
            bridgeCalls.push({ id, title, time1, time2, dailyTarget, enabled, showConfirmation });
        },
        updateProgramReminderProgress() {}
    };
    const windowObj = {
        AndroidBridge
    };
    windowObj.window = windowObj;

    const appStateStart = source.indexOf('        const AppState = {');
    const appStateEnd = source.indexOf('        const CORE_DATA_VERSION', appStateStart);
    assert(appStateStart >= 0 && appStateEnd > appStateStart, 'AppState ausente');
    const appStateCode = source.slice(appStateStart, appStateEnd);

    const context = vm.createContext({
        console: { log() {}, warn() {}, error() {} },
        Date: createFixedDateClass(16, 0),
        TextEncoder,
        document: {
            getElementById,
            querySelector() { return null; },
            querySelectorAll() { return []; }
        },
        window: windowObj,
        AndroidBridge,
        hasNativeReminderScheduler: () => false,
        hasSystemReminderPermission: () => true,
        triggerHaptic: () => {},
        triggerReminderAlert: (prog, sessionNumber) => {
            alertLog.push({ progId: prog.id, sessionNumber });
        },
        synchronizeProgramProgress: () => {},
        normalizeAccessibilityPreferences: (acc, def) => acc || def,
        normalizeSessionHistory: hist => (Array.isArray(hist) ? hist : []),
        isValidSessionRecord: () => true,
        getConfiguredWeeklyTargetDays: () => null,
        renderDailyExecutionUI: () => {},
        ACCESSIBILITY_DEFAULTS: Object.freeze({ textScale: 'normal', highContrast: false, reducedMotion: false }),
        CorePersistence: { completedSessionIds: [], sessionHistory: [] },
        lastFiredReminderKey: '',
        activeReminderProgId: null
    });

    const code = [
        appStateCode,
        'let lastFiredReminderKey = "";',
        'let activeReminderProgId = null;',
        extractFunction(source, 'isValidReminderTime'),
        extractFunction(source, 'reminderTimeAt'),
        extractFunction(source, 'isStrictNonNegativeInteger'),
        extractFunction(source, 'localDateKey'),
        extractIntervalCallback(source),
        extractFunction(source, 'isReminderScheduleComplete'),
        extractFunction(source, 'syncProgramNativeReminder'),
        extractFunction(source, 'openReminderConfigModal'),
        extractFunction(source, 'closeReminderConfigModal'),
        extractFunction(source, 'saveReminderConfig'),
        extractFunction(source, 'renderProfilePreferences'),
        extractFunction(source, 'mergeLoadedPrograms'),
        extractFunction(source, 'applyProgressData'),
        extractFunction(source, 'collectProgressData'),
        extractFunction(source, 'validateProgressSnapshot'),
        extractFunction(source, 'validateImportedProgress')
    ].join('\n');

    vm.runInContext(code, context);
    context.saveState = () => true;
    context.renderProgramsList = () => {};
    context.updatePushNotificationButton = () => {};
    context.showInlineToast = () => {};

    return { context, elements, getElementById, alertLog, bridgeCalls };
}

// Coleta de resultados de cada cenário sem mascarar os subsequentes
const scenarios = [];
function runScenario(name, testFn) {
    try {
        testFn();
        scenarios.push({ name, status: 'PASS', error: null });
        console.log(`[PASS] ${name}`);
    } catch (error) {
        scenarios.push({ name, status: 'FAIL', error });
        console.log(`[FAIL] ${name}\n  -> Motivo: ${error.message}`);
    }
}

// Cenário 1: Fallback browser setInterval — sessionsToday=0, relógio 16:00
// Programa dailyTarget=2, remindersEnabled=true, reminderTimes=["", "16:00"].
// Slot 1 está vazio (sem horário agendado). Horário 16:00 pertence ao slot 2.
// Com sessionsToday=0, o programa espera a Sessão 1.
// Esperado: NÃO disparar Sessão 1.
// Antes da correção, filter compactava reminderTimes para ["16:00"],
// fazendo times[0] assumir esse horário e disparar erroneamente a Sessão 1.
runScenario(
    'Fallback browser setInterval com dailyTarget=2, sessionsToday=0, reminderTimes=["", "16:00"] às 16:00: NÃO deve disparar Sessão 1',
    () => {
        const env = setupEnvironment();
        vm.runInContext(`
            AppState.programs = [{
                id: 'prog-reminder-test',
                title: 'Bracing Test',
                dailyTarget: 2,
                remindersEnabled: true,
                reminderTimes: ['', '16:00'],
                sessionsToday: 0
            }];
            lastFiredReminderKey = '';
            runBrowserReminderIntervalTick();
        `, env.context);

        const session1Alerts = env.alertLog.filter(a => a.sessionNumber === 1);
        assert.equal(
            session1Alerts.length,
            0,
            `Esperado não disparar Sessão 1 quando slot 1 está vazio, mas a execução disparou ${session1Alerts.length} alerta(s) (alertLog: ${JSON.stringify(env.alertLog)})`
        );
    }
);

// isReminderScheduleComplete real — fronteiras de completude da agenda
runScenario(
    'isReminderScheduleComplete real: dailyTarget=1 + ["09:00", ""] é completo',
    () => {
        const env = setupEnvironment();
        const result = env.context.isReminderScheduleComplete({
            dailyTarget: 1,
            reminderTimes: ['09:00', '']
        });
        assert.equal(result, true, 'dailyTarget=1 com horário no slot 1 deve ser considerado completo');
    }
);

runScenario(
    'isReminderScheduleComplete real: dailyTarget=1 + ["", "16:00"] não é completo (sessão 2 não substitui sessão 1)',
    () => {
        const env = setupEnvironment();
        const result = env.context.isReminderScheduleComplete({
            dailyTarget: 1,
            reminderTimes: ['', '16:00']
        });
        assert.equal(result, false, 'dailyTarget=1 com apenas slot 2 preenchido não é completo (sessão 2 não substitui sessão 1)');
    }
);

runScenario(
    'isReminderScheduleComplete real: dailyTarget=2 + ["09:00", ""] não é completo',
    () => {
        const env = setupEnvironment();
        const result = env.context.isReminderScheduleComplete({
            dailyTarget: 2,
            reminderTimes: ['09:00', '']
        });
        assert.equal(result, false, 'dailyTarget=2 com apenas 1 horário preenchido não deve ser completo');
    }
);

// syncProgramNativeReminder com bridge capturado
runScenario(
    'syncProgramNativeReminder com bridge capturado: target=2 + ["", "16:00"] com opt-in/permissão verdadeiros deve encaminhar time1="", time2="16:00" e enabled=false',
    () => {
        const env = setupEnvironment();
        const prog = {
            id: 'prog-reminder-test',
            title: 'Bracing Test',
            dailyTarget: 2,
            remindersEnabled: true,
            reminderTimes: ['', '16:00'],
            sessionsToday: 0
        };
        env.context.syncProgramNativeReminder(prog);
        assert.equal(env.bridgeCalls.length, 1, 'Bridge scheduleProgramReminders deve ser chamado exatamente 1 vez');
        const call = env.bridgeCalls[0];
        assert.equal(call.time1, '', 'time1 deve ser "" quando slot 1 está vazio (nunca transformar sessão 2 em sessão 1)');
        assert.equal(call.time2, '16:00', 'time2 deve ser "16:00" preservando a posição no slot 2');
        assert.equal(call.enabled, false, 'enabled deve ser false para agenda incompleta de 2 sessões');
    }
);

runScenario(
    'syncProgramNativeReminder com bridge capturado: target=1 + ["09:00", ""] deve encaminhar time1="09:00", time2="" e enabled=true',
    () => {
        const env = setupEnvironment();
        const prog = {
            id: 'prog-reminder-test',
            title: 'Bracing Test',
            dailyTarget: 1,
            remindersEnabled: true,
            reminderTimes: ['09:00', ''],
            sessionsToday: 0
        };
        env.context.syncProgramNativeReminder(prog);
        assert.equal(env.bridgeCalls.length, 1, 'Bridge scheduleProgramReminders deve ser chamado exatamente 1 vez');
        const call = env.bridgeCalls[0];
        assert.equal(call.time1, '09:00', 'time1 deve ser "09:00" para dailyTarget=1');
        assert.equal(call.time2, '', 'time2 deve ser "" para dailyTarget=1');
        assert.equal(call.enabled, true, 'enabled deve ser true preservando a semântica nativa existente');
    }
);

// Cenário 3: openReminderConfigModal com reminderTimes=["", "16:00"]
// Esperado: input1 vazio ("") e input2 com "16:00", preservando a correspondência slot <-> input.
// Antes da correção, filter(time => isValidReminderTime(time)) promovia "16:00" ao input1.
runScenario(
    'openReminderConfigModal com reminderTimes=["", "16:00"]: deve preservar slot 1 vazio e slot 2 com 16:00',
    () => {
        const env = setupEnvironment();
        vm.runInContext(`
            AppState.programs = [{
                id: 'prog-reminder-test',
                title: 'Bracing Test',
                dailyTarget: 2,
                remindersEnabled: true,
                reminderTimes: ['', '16:00'],
                sessionsToday: 0
            }];
            openReminderConfigModal('prog-reminder-test');
        `, env.context);

        const input1 = env.getElementById('reminderTimeInput1').value;
        const input2 = env.getElementById('reminderTimeInput2').value;

        assert.equal(
            input1,
            '',
            `reminderTimeInput1 deveria estar vazio, mas recebeu "${input1}" devido ao deslocamento por filter`
        );
        assert.equal(
            input2,
            '16:00',
            `reminderTimeInput2 deveria ser "16:00", mas recebeu "${input2}" devido ao deslocamento por filter`
        );
    }
);

// Cenário 4: mergeLoadedPrograms com reminderTimes=["", "16:00"]
// Esperado: preservar cardinalidade 2, mantendo slot 1 vazio ("") e slot 2 ("16:00").
// Antes da correção, o merge descartava a string vazia e compactava para ["16:00"] (comprimento 1).
runScenario(
    'mergeLoadedPrograms com reminderTimes=["", "16:00"]: deve preservar índice/cardinalidade e vazio no slot 1',
    () => {
        const env = setupEnvironment();
        vm.runInContext(`
            AppState.programs = [{
                id: 'prog-reminder-test',
                title: 'Bracing Test',
                dailyTarget: 2,
                remindersEnabled: true,
                reminderTimes: ['09:00', '15:00'],
                sessionsToday: 0,
                phases: []
            }];
            mergeLoadedPrograms([{
                id: 'prog-reminder-test',
                dailyTarget: 2,
                reminderTimes: ['', '16:00']
            }], localDateKey(), false);
        `, env.context);

        const resultingTimes = vm.runInContext("AppState.programs.find(p => p.id === 'prog-reminder-test').reminderTimes", env.context);

        assert.equal(
            resultingTimes.length,
            2,
            `mergeLoadedPrograms deveria preservar cardinalidade 2, mas resultou em ${resultingTimes.length} (${JSON.stringify(resultingTimes)})`
        );
        assert.equal(
            resultingTimes[0],
            '',
            `mergeLoadedPrograms deveria preservar slot 1 vazio, mas obteve "${resultingTimes[0]}"`
        );
        assert.equal(
            resultingTimes[1],
            '16:00',
            `mergeLoadedPrograms deveria preservar slot 2 como "16:00", mas obteve "${resultingTimes[1]}"`
        );
    }
);

// Cenário 5: applyProgressData com snapshot contendo reminderTimes=["", "16:00"]
// Esperado: preservar cardinalidade 2, mantendo slot 1 vazio ("") e slot 2 ("16:00").
// A regressão também verifica o caminho público de restauração do snapshot.
runScenario(
    'applyProgressData com snapshot contendo reminderTimes=["", "16:00"]: deve preservar índice/cardinalidade e vazio no slot 1',
    () => {
        const env = setupEnvironment();
        vm.runInContext(`
            AppState.programs = [{
                id: 'prog-reminder-test',
                title: 'Bracing Test',
                dailyTarget: 2,
                remindersEnabled: true,
                reminderTimes: ['09:00', '15:00'],
                sessionsToday: 0,
                phases: []
            }];
            applyProgressData({
                dailyDate: localDateKey(),
                programs: [{
                    id: 'prog-reminder-test',
                    dailyTarget: 2,
                    reminderTimes: ['', '16:00']
                }]
            });
        `, env.context);

        const resultingTimes = vm.runInContext("AppState.programs.find(p => p.id === 'prog-reminder-test').reminderTimes", env.context);

        assert.equal(
            resultingTimes.length,
            2,
            `applyProgressData deveria preservar cardinalidade 2, mas resultou em ${resultingTimes.length} (${JSON.stringify(resultingTimes)})`
        );
        assert.equal(
            resultingTimes[0],
            '',
            `applyProgressData deveria preservar slot 1 vazio, mas obteve "${resultingTimes[0]}"`
        );
        assert.equal(
            resultingTimes[1],
            '16:00',
            `applyProgressData deveria preservar slot 2 como "16:00", mas obteve "${resultingTimes[1]}"`
        );
    }
);

runScenario(
    'Perfil lista horários por sessão e só mostra lembretes ativos com agenda completa e permissão efetiva',
    () => {
        const profileStart = source.indexOf('<section id="tab-perfil"');
        const profileEnd = source.indexOf('</section>', profileStart);
        assert(profileStart >= 0 && profileEnd > profileStart, 'Seção Perfil ausente');
        const profileMarkup = source.slice(profileStart, profileEnd);
        assert.match(profileMarkup, /id="profileReminderPrograms"/, 'Perfil deve renderizar os programas e lembretes reais');

        const env = setupEnvironment();
        vm.runInContext(`
            AppState.programs = [{
                id: 'prog-reminder-test',
                title: 'Bracing Test',
                dailyTarget: 2,
                remindersEnabled: true,
                reminderTimes: ['', '16:00'],
                sessionsToday: 0,
                phases: []
            }];
            renderProfilePreferences();
        `, env.context);

        let rendered = env.getElementById('profileReminderPrograms').innerHTML;
        assert.match(rendered, /Sessão 1/i);
        assert.match(rendered, /Horário não configurado/i, 'slot 1 vazio deve ser mostrado como não configurado');
        assert.match(rendered, /Sessão 2/i);
        assert.match(rendered, /16:00/, 'slot 2 deve continuar associado à Sessão 2');
        assert.match(rendered, /lembretes inativos/i, 'agenda incompleta não pode aparecer ativa no Perfil');
        assert.match(rendered, /openReminderConfigModal\('prog-reminder-test'\)/, 'Perfil deve abrir a configuração real do programa');

        vm.runInContext("AppState.programs[0].reminderTimes = ['09:00', '16:00']; renderProfilePreferences();", env.context);
        rendered = env.getElementById('profileReminderPrograms').innerHTML;
        assert.match(rendered, /lembretes ativos/i, 'agenda completa com permissão efetiva deve aparecer ativa');

        env.context.hasSystemReminderPermission = () => false;
        vm.runInContext('renderProfilePreferences();', env.context);
        rendered = env.getElementById('profileReminderPrograms').innerHTML;
        assert.match(rendered, /lembretes inativos/i, 'permissão negada/revogada deve aparecer inativa');
        assert.doesNotMatch(rendered, /lembretes ativos/i, 'permissão negada/revogada nunca pode mostrar estado ativo');
    }
);

runScenario(
    'Perfil → salvar horário vazio/posicional → serializar/restaurar snapshot preserva os mesmos slots sem default',
    () => {
        const env = setupEnvironment();
        vm.runInContext(`
            const prog = AppState.programs[0];
            prog.remindersEnabled = false;
            prog.reminderTimes = ['08:00', '15:00'];
            openReminderConfigModal(prog.id);
            document.getElementById('reminderTimeInput1').value = '';
            document.getElementById('reminderTimeInput2').value = '16:00';
            document.getElementById('reminderEnabledToggle').checked = false;
            saveReminderConfig();
        `, env.context);

        const savedTimes = Array.from(vm.runInContext('AppState.programs[0].reminderTimes', env.context));
        assert.deepEqual(savedTimes, ['', '16:00'], 'salvar com toggle desligado deve preservar o slot vazio e o horário no slot 2');

        const serialized = JSON.stringify(vm.runInContext('collectProgressData()', env.context));
        const restoredData = JSON.parse(serialized);
        env.context.__restoredReminderData = restoredData;
        vm.runInContext("AppState.programs[0].reminderTimes = ['09:00', '15:00'];", env.context);
        vm.runInContext('applyProgressData(__restoredReminderData);', env.context);
        const restoredTimes = Array.from(vm.runInContext('AppState.programs[0].reminderTimes', env.context));
        assert.deepEqual(restoredTimes, ['', '16:00'], 'restore após serialização deve manter vazio e horário nas mesmas posições');
        vm.runInContext('syncProgramNativeReminder(AppState.programs[0]);', env.context);
        const restoredBridgeCall = env.bridgeCalls.at(-1);
        assert.equal(restoredBridgeCall.time1, '', 'slot 1 deve continuar vazio ao sincronizar após reabertura');
        assert.equal(restoredBridgeCall.time2, '16:00', 'slot 2 deve continuar associado à sessão 2 após reabertura');
        assert.equal(restoredBridgeCall.enabled, false, 'agenda incompleta deve permanecer desativada na bridge após reabertura');
    }
);

runScenario(
    'Validador estrito de horário rejeita ausência, formato parcial e limites fora de HH:mm',
    () => {
        const env = setupEnvironment();
        const cases = [
            ['', false], ['9:00', false], ['24:00', false], ['09:60', false],
            ['00:00', true], ['23:59', true]
        ];
        for (const [value, expected] of cases) {
            assert.equal(env.context.isValidReminderTime(value), expected, `isValidReminderTime(${JSON.stringify(value)})`);
        }
    }
);

runScenario(
    'Importação de snapshot aceita slot vazio posicional e continua rejeitando horário não vazio inválido',
    () => {
        const env = setupEnvironment();
        vm.runInContext("AppState.programs[0].reminderTimes = ['', '16:00']; AppState.mente.customPresets = [];", env.context);
        const data = JSON.parse(JSON.stringify(vm.runInContext('collectProgressData()', env.context)));
        const snapshot = { schemaVersion: 4, revision: 1, savedAt: '2026-09-22T16:00:00.000Z', data };
        env.context.__reminderImportRaw = JSON.stringify(snapshot);
        const accepted = vm.runInContext('validateImportedProgress(__reminderImportRaw)', env.context);
        assert.deepEqual(Array.from(accepted.data.programs[0].reminderTimes), ['', '16:00']);

        snapshot.data.programs[0].reminderTimes = ['invalid', '16:00'];
        env.context.__reminderImportRaw = JSON.stringify(snapshot);
        assert.throws(
            () => vm.runInContext('validateImportedProgress(__reminderImportRaw)', env.context),
            /Horários de lembrete inválidos/,
            'slot não vazio fora de HH:mm continua inválido'
        );
    }
);

// Resumo geral; qualquer falha atual deve tornar o diagnóstico vermelho.
console.log('\n============================================================');
console.log('RESUMO DA SUÍTE DE REGRESSÃO E09.3 (LEMBRETES)');
console.log('============================================================');
const failedScenarios = scenarios.filter(s => s.status === 'FAIL');
console.log(`Total de cenários executados: ${scenarios.length}`);
console.log(`Cenários com falha: ${failedScenarios.length}`);
console.log(`Cenários PASS: ${scenarios.length - failedScenarios.length}`);

if (failedScenarios.length > 0) {
    console.error('\nDetalhamento dos cenários com falha:');
    failedScenarios.forEach((s, idx) => {
        console.error(`  ${idx + 1}. [${s.name}]\n     -> ${s.error.message}`);
    });
    console.log('============================================================\n');

    assert.fail(
        `Diagnóstico E09.3 falhou: ${failedScenarios.length} de ${scenarios.length} cenários não atenderam às expectativas.`
    );
} else {
    console.log('Todos os cenários passaram com sucesso.');
}

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const htmlPaths = [
    path.join(root, 'index.html'),
    path.join(root, 'app', 'src', 'main', 'assets', 'index.html')
];
const mainActivityPath = path.join(root, 'app', 'src', 'main', 'java', 'com', 'example', 'MainActivity.kt');
const reminderSchedulerPath = path.join(root, 'app', 'src', 'main', 'java', 'com', 'example', 'ReminderScheduler.kt');
const wearRelayPath = path.join(root, 'app', 'src', 'main', 'java', 'com', 'example', 'WearHapticsRelay.kt');
const wearListenerPath = path.join(root, 'wear', 'src', 'main', 'java', 'com', 'example', 'wear', 'HapticListenerService.kt');

const findings = [];
let checks = 0;

function check(id, subject, fn) {
    checks += 1;
    try {
        fn();
        console.log(`OK ${id} — ${subject}`);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        findings.push({ id, subject, message });
        console.error(`RED ${id} — ${subject}: ${message}`);
    }
}

function requireMatch(value, pattern, message) {
    if (!pattern.test(value)) throw new Error(message);
}

function requireNotMatch(value, pattern, message) {
    if (pattern.test(value)) throw new Error(message);
}

function extractFunction(source, name) {
    const start = source.search(new RegExp(`(?:async\\s+)?function\\s+${name}\\s*\\(`));
    if (start < 0) throw new Error(`função ausente: ${name}`);
    const bodyStart = source.indexOf('{', start);
    if (bodyStart < 0) throw new Error(`corpo ausente: ${name}`);
    let depth = 0;
    for (let index = bodyStart; index < source.length; index += 1) {
        if (source[index] === '{') depth += 1;
        if (source[index] === '}' && --depth === 0) return source.slice(start, index + 1);
    }
    throw new Error(`bloco incompleto: ${name}`);
}

function profileMarkup(source) {
    const start = source.indexOf('<section id="tab-perfil"');
    if (start < 0) throw new Error('seção #tab-perfil ausente');
    const end = source.indexOf('</section>', start);
    if (end < 0) throw new Error('fechamento de #tab-perfil ausente');
    return source.slice(start, end + '</section>'.length);
}

function runReminderPositionScenario(source) {
    const mergeLoadedPrograms = extractFunction(source, 'mergeLoadedPrograms');
    const context = vm.createContext({
        AppState: {
            programs: [{
                id: '1',
                title: 'Bracing',
                expanded: false,
                currentPhaseIndex: 0,
                daysCompletedInPhase: 0,
                dailyTarget: 2,
                phases: [{ completed: false }, { completed: false }]
            }]
        },
        isStrictNonNegativeInteger: value => typeof value === 'number' && Number.isInteger(value) && value >= 0,
        isValidReminderTime: value => typeof value === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value),
        synchronizeProgramProgress() {}
    });
    context.saved = {
        id: '1',
        title: 'Bracing',
        currentPhaseIndex: 0,
        daysCompletedInPhase: 0,
        sessionsToday: 0,
        reminderTimes: ['not-a-time', '16:00'],
        remindersEnabled: true,
        phases: [{ completed: false }, { completed: false }]
    };
    vm.runInContext(`${mergeLoadedPrograms}; mergeLoadedPrograms([saved], '2026-09-22', false);`, context);
    return context.AppState.programs[0].reminderTimes;
}

const sources = htmlPaths.map(file => fs.readFileSync(file, 'utf8'));
const mainActivity = fs.readFileSync(mainActivityPath, 'utf8');
const reminderScheduler = fs.readFileSync(reminderSchedulerPath, 'utf8');
const wearRelay = fs.readFileSync(wearRelayPath, 'utf8');
const wearListener = fs.readFileSync(wearListenerPath, 'utf8');

check('E09-00', 'os dois HTMLs permanecem byte-equivalentes', () => {
    if (sources[0] !== sources[1]) throw new Error('index.html e asset embarcado divergem');
});

for (let fileIndex = 0; fileIndex < sources.length; fileIndex += 1) {
    const source = sources[fileIndex];
    const relative = path.relative(root, htmlPaths[fileIndex]);
    let profile = '';
    let collect = '';
    let apply = '';

    check(`E09-01/${relative}`, 'Perfil expõe edição de nome/meta com salvar e cancelar', () => {
        profile = profileMarkup(source);
        requireMatch(profile, /nome|name/i, 'não há rótulo/controle de nome em #tab-perfil');
        requireMatch(profile, /meta/i, 'não há rótulo/controle de meta em #tab-perfil');
        requireMatch(profile, /salvar|save/i, 'não há ação Salvar no editor do Perfil');
        requireMatch(profile, /cancelar|cancel/i, 'não há ação Cancelar no editor do Perfil');
    });

    check(`E09-02/${relative}`, 'Perfil possui entrada pública para lembretes reais', () => {
        profile = profile || profileMarkup(source);
        requireMatch(profile, /lembrete|reminder/i, 'o Perfil não encaminha para configuração de lembretes');
        requireMatch(profile, /openReminderConfigModal|openTodayReminderConfig|reminderConfig/i, 'não há ação pública de lembrete no Perfil');
        requireMatch(source, /function isValidReminderTime\(/, 'validador HH:mm ausente');
        requireMatch(source, /async function saveReminderConfig\(/, 'salvamento de lembrete ausente');
        requireMatch(source, /requestSystemReminderPermission\(/, 'pedido/consulta de permissão ausente');
    });

    check(`E09-03/${relative}`, 'Voz, vibração e Watch estão expostos no Perfil e ligados aos motores', () => {
        profile = profile || profileMarkup(source);
        for (const label of ['Condução por voz', 'Vibração', 'Galaxy Watch']) {
            requireMatch(profile, new RegExp(label, 'i'), `controle ausente: ${label}`);
        }
        requireMatch(profile, /toggleVoice\(\)/, 'Perfil não chama toggleVoice');
        requireMatch(profile, /toggleHaptics\(\)/, 'Perfil não chama toggleHaptics');
        requireMatch(profile, /toggleWatchHaptics\(\)/, 'Perfil não chama toggleWatchHaptics');
        requireMatch(source, /function speakVoice\([\s\S]*?AppState\.voiceEnabled/, 'motor de voz não consulta voiceEnabled');
        requireMatch(source, /function triggerHaptic\([\s\S]*?AppState\.hapticsEnabled/, 'motor háptico não consulta hapticsEnabled');
        requireMatch(source, /setWatchHapticsEnabled/, 'toggle do Watch não alcança a ponte nativa');
    });

    check(`E09-03-PERSIST/${relative}`, 'preferências de voz/vibração sobrevivem ao snapshot v4', () => {
        collect = collect || extractFunction(source, 'collectProgressData');
        apply = apply || extractFunction(source, 'applyProgressData');
        requireMatch(collect, /voiceEnabled/, 'collectProgressData não grava voiceEnabled');
        requireMatch(collect, /hapticsEnabled/, 'collectProgressData não grava hapticsEnabled');
        requireMatch(apply, /voiceEnabled/, 'applyProgressData não restaura voiceEnabled');
        requireMatch(apply, /hapticsEnabled/, 'applyProgressData não restaura hapticsEnabled');
    });

    check(`E09-04/${relative}`, 'Tema AMOLED é uma preferência global observável e persistente', () => {
        profile = profile || profileMarkup(source);
        requireMatch(profile, /Tema AMOLED|AMOLED/i, 'não há controle Tema AMOLED no Perfil');
        const stateStart = source.indexOf('const AppState = {');
        const stateEnd = source.indexOf('const CORE_DATA_VERSION', stateStart);
        requireMatch(source.slice(stateStart, stateEnd), /theme|amoled/i, 'AppState não possui estado de tema global');
        collect = collect || extractFunction(source, 'collectProgressData');
        apply = apply || extractFunction(source, 'applyProgressData');
        requireMatch(collect, /theme|amoled/i, 'snapshot não grava o tema');
        requireMatch(apply, /theme|amoled/i, 'restore não aplica o tema');
    });

    check(`E09-05/${relative}`, 'Acessibilidade abre ajustes reais', () => {
        profile = profile || profileMarkup(source);
        requireMatch(profile, /Acessibilidade|accessib/i, 'não há entrada Acessibilidade no Perfil');
        requireMatch(source, /accessib|fontSize|textScale|highContrast|reducedMotion/i, 'não há estado/renderer de ajustes de acessibilidade E09');
    });

    check(`E09-06/${relative}`, 'Watch não afirma conexão sem estado real', () => {
        profile = profile || profileMarkup(source);
        requireMatch(profile, /Galaxy Watch|Estado do Watch/i, 'entrada do Watch ausente no Perfil');
        if (/Sincronizados/i.test(source) && !/(?:hasConnectedWatch|isWatchConnected|watchConnection|watchConnectionStatus|connectedNodes)/i.test(source)) {
            throw new Error('modal contém “Sincronizados” fixo sem consulta/estado de conexão');
        }
        requireMatch(source, /function openSmartwatchCompanionModal\(/, 'modal do Watch ausente');
        requireMatch(source, /function testWristHaptics\(/, 'teste háptico do Watch ausente');
    });

    check(`E09-07/${relative}`, 'backup/exportação/importação têm arquivo, prévia, cancelamento e erro', () => {
        profile = profile || profileMarkup(source);
        requireMatch(profile, /openProgressProtection\(\);\s*exportProgressCopy\(\)/, 'Exportar do Perfil não chama o fluxo real');
        requireMatch(profile, /openProgressProtection\(\);\s*chooseProgressImport\(\)/, 'Importar do Perfil não chama o fluxo real');
        for (const fn of ['exportProgressCopy', 'chooseProgressImport', 'validateImportedProgress', 'receiveProgressImport', 'confirmProgressImport', 'cancelProgressImport']) {
            requireMatch(source, new RegExp(`function (?:async )?${fn}\\(`), `fluxo de backup ausente: ${fn}`);
        }
        requireMatch(source, /progressImportPreview/, 'prévia de importação ausente');
        requireMatch(source, /Arquivo JSON inválido|Backup incompatível|Nenhuma cópia íntegra/, 'mensagem de erro de backup ausente');
    });

    check(`E09-08/${relative}`, 'gerenciamento de dados oferece exclusão explícita e segura', () => {
        profile = profile || profileMarkup(source);
        const hasDeleteAction = /<(?:button|a)\b[^>]*(?:onclick|id|aria-label|data-[^=]+)=["'][^"']*(?:apagar|excluir|delete|clear|wipe)/i.test(profile) ||
            /<(?:button|a)\b[^>]*>[^<]*(?:apagar|excluir|delete|clear|wipe)/i.test(profile);
        if (!hasDeleteAction) throw new Error('não há ação de apagar/excluir dados no Perfil');
        requireMatch(source, /function (?:delete|clear)(?:All|Data|Progress|Account)[A-Za-z]*\([\s\S]*?confirm\(/i, 'exclusão não exige confirmação explícita');
        requireMatch(profile, /export|exportar/i, 'ação de exclusão não fica próxima da oferta de exportação');
    });

    check(`E09-09/${relative}`, 'markup não fabrica os dados do mockup', () => {
        profile = profile || profileMarkup(source);
        requireNotMatch(profile, /Rafael|12[ ]*\/[ ]*30|78[ ]*%/, 'Perfil contém valor demonstrativo do mockup');
        requireMatch(profile, /Nenhum dado de saúde externo está conectado/i, 'estado vazio honesto de saúde externa ausente');
        requireNotMatch(profile, /(?:passos|sono|calorias|frequência cardíaca)[^<]*(?:[0-9]{1,3}|bpm)/i, 'Perfil exibe métrica de saúde sem integração');
    });

    check(`E09-R1/${relative}`, 'horário da Sessão 2 não é promovido para a Sessão 1 após restore', () => {
        const slots = runReminderPositionScenario(source);
        if (!Array.isArray(slots) || slots.length < 2 || slots[1] !== '16:00' || slots[0] === '16:00') {
            throw new Error(`contraexemplo produzido: reminderTimes=${JSON.stringify(slots)}; esperado preservar 16:00 no índice 1`);
        }
    });

    check(`E09-STATE/${relative}`, 'restore separa ausência/inválido de preferências reais já existentes', () => {
        apply = apply || extractFunction(source, 'applyProgressData');
        collect = collect || extractFunction(source, 'collectProgressData');
        requireMatch(apply, /AppState\.userName\s*=\s*typeof data\.userName === 'string'[\s\S]*?\? data\.userName\.trim\(\) : null/, 'restore de userName não distingue ausência/vazio');
        requireMatch(collect, /userName:\s*AppState\.userName \|\| null/, 'snapshot não explicita userName ausente como null');
        requireMatch(collect, /dailyGoal:\s*AppState\.dailyGoal/, 'snapshot não inclui dailyGoal real');
        requireMatch(apply, /Number\.isFinite\(Number\(data\.dailyGoal\)\)[\s\S]*?data\.dailyGoal/, 'restore de dailyGoal não valida limite/forma');
    });
}

check('E09-NATIVE-01', 'bridge Android mantém arquivo real e permissão efetiva', () => {
    requireMatch(mainActivity, /fun importProgressSnapshot\(\)/, 'bridge de importação ausente');
    requireMatch(mainActivity, /fun exportProgressSnapshot\(snapshotJson: String\)/, 'bridge de exportação ausente');
    requireMatch(mainActivity, /fun scheduleProgramReminders\(/, 'bridge de lembretes ausente');
    requireMatch(mainActivity, /notificationsPermissionGranted\(\)/, 'bridge não expõe permissão efetiva');
    requireMatch(reminderScheduler, /hasEffectiveNotificationPermission\(context\)/, 'scheduler não verifica permissão efetiva');
    requireMatch(reminderScheduler, /isValidTime\(time1\)/, 'scheduler não valida o primeiro horário');
    requireMatch(reminderScheduler, /isValidTime\(time2\)/, 'scheduler não valida o segundo horário');
});

check('E09-NATIVE-02', 'hápticos do Watch preservam opt-in e rejeitam gerações stale', () => {
    requireMatch(wearRelay, /SharedPreferences\(PREFS[\s\S]*?KEY_ENABLED/, 'relay não persiste opt-in');
    requireMatch(wearRelay, /connectedNodes/, 'relay não consulta nós Wear conectados');
    requireMatch(wearRelay, /type\", \"cancel|type\", \"pattern/, 'relay não diferencia cancelamento/padrão');
    requireMatch(wearListener, /KEY_CANCELLED_GENERATION[\s\S]*?KEY_ACTIVE_GENERATION/, 'listener não protege gerações stale');
});

if (findings.length > 0) {
    console.error(`E09 RED intencional: ${findings.length} achados em ${checks} verificações. O exit code 1 é esperado antes de E09.2–E09.7.`);
    for (const finding of findings) {
        console.error(`- ${finding.id}: ${finding.message}`);
    }
    process.exitCode = 1;
} else {
    console.log(`E09 RED fechou: ${checks} verificações passaram; nenhuma lacuna observável restante.`);
}

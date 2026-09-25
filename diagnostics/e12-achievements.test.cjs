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
function extractDeclaration(name) {
    const start = html.indexOf(`        const ${name} =`);
    assert(start >= 0, `Declaração ausente: ${name}`);
    const end = html.indexOf(';', start);
    assert(end >= 0, `Declaração incompleta: ${name}`);
    return html.slice(start, end + 1);
}

const elements = new Map();
function element(id) {
    if (!elements.has(id)) {
        const classes = new Set();
        elements.set(id, {
            id,
            innerHTML: '',
            attributes: {},
            classList: {
                add(value) { classes.add(value); },
                remove(value) { classes.delete(value); },
                contains(value) { return classes.has(value); }
            },
            setAttribute(name, value) { this.attributes[name] = String(value); }
        });
    }
    return elements.get(id);
}

const body = {
    appendChild(node) {
        node.parentNode = this;
    }
};
element('achievementDetailsModal').parentNode = { id: 'tab-dashboard' };

const context = vm.createContext({
    AppState: {
        activityLog: { '2026-09-24': { minutes: 45, sessions: 3, sources: { kegel: 2 } } },
        weeklyHistory: [1, 1, 0, 0, 0, 0, 0],
        dailyGoal: 30,
        streak: 2,
        unlockedAchievements: ['first_session']
    },
    document: { getElementById: element, body }
});
element('achievementDetailsModal').classList.add('hidden');

const source = [
    extractDeclaration('ACHIEVEMENTS'),
    extractDeclaration('ACHIEVEMENT_COLOR_CLASSES'),
    extractFunction('activityMetrics'),
    extractFunction('achievementProgress'),
    extractFunction('renderAchievements'),
    extractFunction('showAchievementDetails'),
    extractFunction('hideAchievementDetails')
].join('\n\n');
vm.runInContext(source, context);

context.renderAchievements();
assert.match(element('achievementsContainer').innerHTML, /<button[^>]+aria-haspopup="dialog"/,
    'cada conquista deve poder abrir seus critérios');
assert.match(element('achievementsContainer').innerHTML, /showAchievementDetails\('kegel_10'\)/,
    'cartão deve abrir o detalhe da conquista correspondente');

context.showAchievementDetails('kegel_10');
assert.equal(element('achievementDetailsModal').parentNode, body,
    'diálogo deve sair da aba transformada para ocupar a viewport, sem ficar fora da tela');
assert.equal(element('achievementDetailsModal').classList.contains('hidden'), false,
    'detalhe deve abrir o diálogo');
assert.match(element('achievementDetailsContent').innerHTML, /Concluir 10 treinos de Kegel/,
    'diálogo deve explicar o critério');
assert.match(element('achievementDetailsContent').innerHTML, /2\s*\/\s*10/,
    'progresso deve refletir as sessões reais da origem');
assert.match(element('achievementDetailsContent').innerHTML, /Ainda não desbloqueada/,
    'estado bloqueado deve refletir o registro persistido');

context.showAchievementDetails('first_session');
assert.match(element('achievementDetailsContent').innerHTML, /3\s*\/\s*1/,
    'conquista desbloqueada deve mostrar progresso real, sem limitar o acumulado à meta');
assert.match(element('achievementDetailsContent').innerHTML, /Desbloqueada/,
    'estado desbloqueado deve ser explícito');

context.showAchievementDetails('daily_goal');
assert.match(element('achievementDetailsContent').innerHTML, /45\s*\/\s*30/,
    'critério da meta diária deve usar a meta configurada e o melhor dia real');
assert.match(element('achievementDetailsContent').innerHTML, /Critério atingido/,
    'critério atingido sem estado salvo deve ser exposto sem alterar a persistência');

const previousContent = element('achievementDetailsContent').innerHTML;
context.showAchievementDetails('unknown-achievement');
assert.equal(element('achievementDetailsContent').innerHTML, previousContent,
    'ID desconhecido deve ser ignorado sem alterar o diálogo');
context.hideAchievementDetails();
assert.equal(element('achievementDetailsModal').classList.contains('hidden'), true,
    'fechar deve ocultar o diálogo');

console.log('E12 conquistas: critérios, progresso real e estado persistido — PASS');

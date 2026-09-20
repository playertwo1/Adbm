const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const rulesPath = path.join(root, 'docs', 'roadmap', 'regras-vacuum.md');
assert.ok(fs.existsSync(rulesPath), 'E03 precisa registrar as regras do Vácuo antes da implementação');
const rules = fs.readFileSync(rulesPath, 'utf8');

assert.match(rules, /## Inventário das oito fases/);
assert.equal((rules.match(/^\| Semana [1-8]/gm) || []).length, 8, 'as oito fases atuais precisam estar inventariadas');
assert.match(rules, /Confortável/);
assert.match(rules, /Difícil/);
assert.match(rules, /Interrompi/);
assert.match(rules, /sem feedback não significa sucesso/i);
assert.match(rules, /bracing/i);
assert.match(rules, /hipopressiv/i);
assert.match(rules, /não define dosagem clínica/i);
assert.match(rules, /manter|reduzir|sugerir avanço/i);
assert.match(rules, /repetir etapa/i);
assert.match(rules, /data de vigência/i);
assert.match(rules, /pendente|não resolvid/i);

const source = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert.match(source, /const holdSeconds = phase\.holdMin;/, 'a retenção não pode subir só pelo calendário');
assert.match(source, /const setCount = phase\.minSets \|\| phase\.sets;/, 'a quantidade inicial de séries deve respeitar o mínimo da fase');
const finishDailySession = source.slice(source.indexOf('function finishDailySession'), source.indexOf('function finishDailySession') + 9000);
assert.match(finishDailySession, /reviewPending/, 'atingir a meta semanal deve abrir revisão, não avançar automaticamente');
assert.match(finishDailySession, /completedProgramId === '3'/, 'a regra segura de E03 deve ser específica do programa de Vácuo');
const vacuumProgressionBranch = finishDailySession.slice(finishDailySession.indexOf("if (completedProgramId === '3')"), finishDailySession.indexOf("} else {", finishDailySession.indexOf("if (completedProgramId === '3')")));
assert.doesNotMatch(vacuumProgressionBranch, /prog\.currentPhaseIndex = AppState\.dailyExecution\.phaseIndex \+ 1/, 'E03 não permite avanço automático por calendário');

console.log('E03 vacuum rules: PASS');

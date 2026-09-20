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

console.log('E03 vacuum rules: PASS');

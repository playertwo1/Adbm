const assert = require('node:assert/strict');
const fs = require('node:fs');
const web = fs.readFileSync('index.html', 'utf8');
// Notificação de Pausa Consciente: o exercício ativo precisa reancorar após o scroll restaurado do WebView.
assert.match(web, /window\.onNativeQuickBreath = function[\s\S]*?startSpecificBreath\([\s\S]*?setTimeout\(\(\) => document\.getElementById\('breath-active-display'\)\?\.scrollIntoView/);
console.log('quick-breath-scroll: PASS');

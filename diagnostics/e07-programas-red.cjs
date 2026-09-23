const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const htmlPaths = [
  path.join(root, 'index.html'),
  path.join(root, 'app', 'src', 'main', 'assets', 'index.html')
];
const expectedPrograms = [
  ['1', 'Bracing: Controle e Automação (8 Semanas)'],
  ['2', 'Cronograma Avançado de 8 Semanas'],
  ['3', 'Stomach Vacuum: 8 Semanas no Escritório'],
  ['4', 'Mindfulness 8 Semanas']
];

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `Função ausente: ${name}`);
  const bodyStart = source.indexOf('{', start);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}' && --depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`Função incompleta: ${name}`);
}

const failures = [];
function expectContract(condition, label, detail) {
  if (!condition) failures.push(`${label}: ${detail}`);
}

const sources = htmlPaths.map(filePath => ({
  filePath,
  relativePath: path.relative(root, filePath),
  source: fs.readFileSync(filePath, 'utf8')
}));

for (const { relativePath, source } of sources) {
  const openDailyExecution = extractFunction(source, 'openDailyExecutionModal');
  const adjustment = extractFunction(source, 'applyProgramProgressAdjustment');
  const persistence = extractFunction(source, 'loadSavedState');

  for (const [id, title] of expectedPrograms) {
    expectContract(
      source.includes(`id: '${id}'`) && source.includes(`title: '${title}'`),
      `${relativePath} IDs/fases`,
      `programa ${id} (${title}) não foi encontrado no inventário AppState.programs`
    );
  }
  expectContract(/coreflow_programs/.test(persistence), `${relativePath} reabertura`, 'a fonte persistida coreflow_programs não foi lida');
  expectContract(source.includes("openDailyExecutionModal('${prog.id}')"), `${relativePath} iniciar`, 'o botão de sessão do card não encaminha o ID exibido');
  expectContract(source.includes("openProgramProgressAdjustment('${prog.id}')"), `${relativePath} ajuste manual`, 'o ajuste não recebe o ID do programa exibido');
  expectContract(/lastManualAdjustment/.test(adjustment), `${relativePath} ajuste manual`, 'o ajuste não registra a posição conhecida');
  expectContract(!/addMinutesToday|activityLog|sessionHistory/.test(adjustment), `${relativePath} ajuste manual`, 'o ajuste não pode criar minutos, diário ou sessão retroativa');
  expectContract(source.includes("progressionReview?.status === 'pending'"), `${relativePath} progressão E03`, 'a revisão pendente do Vácuo não está distinguível no card');

  expectContract(/function openProgramDetail\(programId\)/.test(source), `${relativePath} card/detalhe`, 'falta rota de detalhe por ID para o card selecionado');
  expectContract(/data-program-id=/.test(source), `${relativePath} card/detalhe`, 'o card não expõe o ID real no DOM para navegação/auditoria');
  expectContract(!/const mainProg = AppState\.programs\.find\(p => p\.id === '2'\)/.test(source), `${relativePath} progresso/sessão real`, 'hero ainda fixa o programa 2, em vez do programa selecionado/estado explícito');
  expectContract(!/heroBadge\.innerText = `\$\{sToday\}\/2 Sessões Hoje`/.test(source), `${relativePath} progresso/sessão real`, 'hero ainda fixa a meta diária em 2');
  expectContract(!/\|\| AppState\.programs\[1\] \|\| AppState\.programs\[0\]/.test(openDailyExecution), `${relativePath} iniciar`, 'ID inexistente abre programa de fallback e mascara erro de rota');
  expectContract(/id="programsListEmpty"/.test(source), `${relativePath} sem histórico`, 'não há estado vazio explícito para lista/estado sem histórico');
  expectContract(/id="programsListError"/.test(source), `${relativePath} erro`, 'não há estado de erro explícito de leitura para Programas');
  expectContract(/programDetailState/.test(source), `${relativePath} reabertura`, 'não há estado de detalhe reaberto para preservar o programa/fase visitados');
  expectContract(/function repeatProgramPhase\(/.test(source), `${relativePath} repetir`, 'não há ação explícita para repetir etapa sem apagar diário');
}

assert.equal(sources[0].source, sources[1].source, 'root and embedded HTML must remain byte-equivalent');

const matrix = [
  'cards/detalhe por ID',
  'etapa, sessão e duração reais',
  'iniciar sem fallback silencioso',
  'repetir etapa sem apagar diário',
  'ajuste manual sem minutos retroativos',
  'agenda/recuperação/progressão E03',
  'sem histórico, concluído e erro',
  'reabertura e paridade dos HTMLs'
];
console.log(`E07 contract matrix: ${matrix.join(' | ')}`);
if (failures.length) {
  console.error(`E07 RED diagnostic: ${failures.length} gap(s) reproduced.`);
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log('E07 contract diagnostic: PASS');
}

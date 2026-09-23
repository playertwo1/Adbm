# E07 — Contrato e inventário: Programas e detalhe

Data: 2026-09-21
Base examinada: `67849ee6f7949b82c1942bc953be4d2a731f60c7`.
Escopo desta etapa: inventário e diagnóstico RED. Nenhum ID, armazenamento, bridge, protocolo de treino ou histórico foi alterado.

## Fontes de estado confirmadas

| Domínio | Fonte real | Persistência/reabertura | Observação |
| --- | --- | --- | --- |
| Catálogo e posição | `AppState.programs` | snapshot v4 (`collectProgressData`/`applyProgressData`) e espelho `coreflow_programs` | O carregamento correlaciona programas por `id`, não por posição. |
| Fase/dia/sessões | `currentPhaseIndex`, `daysCompletedInPhase`, `currentDayInWeek`, `sessionsToday`, `dailyTarget` | mesmo snapshot | `synchronizeProgramProgress()` recalcula prefixo concluído, dia e estado concluído. |
| Sessão guiada | `AppState.dailyExecution` | snapshot v4 | `openDailyExecutionModal(programId, phaseIndex)` cria `programId`, `phaseIndex`, título e passos. |
| Diário/histórico | `CorePersistence.sessionHistory` e `AppState.activityLog` | snapshot v4 | `finishDailySession()` registra sessão e minutos executados; ajuste manual não deve escrever nesses campos. |
| Agenda | `reminderTimes`, `remindersEnabled` e bridge `ReminderScheduler` | snapshot/espelho | Lembretes são configurados por ID de programa. |
| Progressão Vácuo | `programs[id='3'].progressionReview` | snapshot v4 | Ao atingir a meta semanal, a etapa entra em revisão pendente; o calendário não avança carga automaticamente. |
| Erro de leitura | `CorePersistence.status === 'recoveryRequired'` | preserva snapshot/cópia anterior | O aviso atual é global; Programas não tem estado de erro próprio. |

## IDs e fases atuais (contrato a preservar)

| ID | Programa | Fases | Meta diária inicial | Fluxo atual |
| --- | --- | ---: | ---: | --- |
| `1` | Bracing: Controle e Automação (8 Semanas) | 8 | 2 | `openDailyExecutionModal('1')`; guia legado em modal separado. |
| `2` | Cronograma Avançado de 8 Semanas | 8 | 2 | `openDailyExecutionModal('2')`; hero atual fixa este programa. |
| `3` | Stomach Vacuum: 8 Semanas no Escritório | 8 | 1 | `openDailyExecutionModal('3')`; revisão explícita exigida antes de progressão. |
| `4` | Mindfulness 8 Semanas | 8 | variável por fase | player de áudio próprio, `openMindfulnessAudioModal('4', phaseIndex, trackType)`. |

## Fluxo observado e divergências reproduzidas

1. A lista é renderizada por `renderProgramsList()` dentro de `#tab-programas`. Para IDs 1–3, os botões de sessão encaminham `prog.id`; fases encaminham `prog.id` e o índice selecionado.
2. Não há rota/tela de detalhe identificada por programa. O cabeçalho apenas expande o mesmo card; os guias de Bracing e Kegel usam modais paralelos e Mindfulness abre o player de áudio.
3. O hero usa o programa `id === '2'`, meta diária `2` e dia alvo `7` em trechos de apresentação. Logo, ele não é uma fonte segura para o programa selecionado, para Vácuo (meta 1) ou para estados futuros de seleção.
4. `openDailyExecutionModal()` aceita ID desconhecido e substitui silenciosamente por `AppState.programs[1]` ou `[0]`; isso mascara erro e pode abrir o programa errado.
5. `loadSavedState()` preserva a posição por ID, mas não há estado de detalhe para reabrir o programa/fase visitados.
6. O ajuste manual já tem prévia e `applyProgramProgressAdjustment()` não grava minutos, diário ou sessão. Ele deve continuar assim.
7. A agenda usa os horários reais do programa. O Vácuo já comunica `progressionReview.status === 'pending'`; não deve progredir por calendário.
8. A lista não expõe estados próprios para catálogo vazio/sem histórico ou erro de leitura. O estado concluído existe como cálculo (`programCompleted`), mas ainda não há detalhe explícito/repetição de etapa.

## Matriz E07 (RED)

| Critério | Diagnóstico | Baseline em 2026-09-21 |
| --- | --- | --- |
| Card abre o programa correto | rota de detalhe por ID e `data-program-id` no DOM | RED: inexistentes. |
| Etapa/sessão/duração reais | sem hero fixado em ID/meta | RED: hero fixa ID 2 e meta 2. |
| Iniciar o item exibido | ID inválido não pode abrir fallback | RED: fallback para programas 2/1. |
| Repetir etapa | ação explícita sem apagar diário | RED: inexistente. |
| Ajuste manual | prévia, posição conhecida, sem minutos retroativos | GREEN no código atual; permanece regressão obrigatória. |
| Agenda/recuperação/progressão | lembretes por ID e revisão pendente Vácuo | GREEN parcial; deve permanecer. |
| Sem histórico/concluído/erro | estados distintos e utilizáveis | RED: vazio/erro específicos ausentes; concluído só é cálculo do card. |
| Reabertura | detalhe programa/fase reabre sem alteração | RED: persistência de programa existe, estado de detalhe não existe. |
| Equivalência | `index.html` = asset embarcado | GREEN no baseline; obrigatório em toda etapa. |

## Diagnóstico executável

`node diagnostics/e07-programas-red.cjs` lê os dois HTMLs, confirma o inventário estável e falha intencionalmente enquanto os gaps E07 acima existirem. Ele não é nomeado `*.test.cjs` para não impedir o gate integrado antes de E07.2 transformar os critérios RED em comportamento implementado.

## Próximo passo

E07.2 deve implementar a lista/detalhe por ID, remover fallbacks silenciosos, tornar estados vazio/concluído/erro utilizáveis e fazer o diagnóstico E07 passar, sem alterar IDs, snapshot, bridge, protocolo ou histórico.

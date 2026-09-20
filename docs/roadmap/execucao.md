# Registro de execução

Estado inicial em 19/09/2026:

- Tarefa atual: nenhuma.
- Próxima tarefa: E00 — Baseline.
- Esta revisão alterou apenas o roadmap e a documentação.
- Testes funcionais desta revisão: não executados.

## Modelo

```text
Data:
Tarefa / estado:
Dependências confirmadas:
Arquivos e símbolos verificados:
Alterações:
Validação: comando/cenário → resultado → evidência
Falhas preexistentes:
Bloqueios:
Próximo passo:
```

## 2026-09-20 — E00 / CONCLUÍDA

- Dependências confirmadas: branch `main`; JDK do Android Studio, Android SDK 36, Node, ADB e AVD `Pixel_9` disponíveis. O projeto usa WebView local, módulo `wear/`, Gradle 9.3.1 e AGP 9.1.1.
- Estado e símbolos confirmados: `AppState.vacuo`; programa ID `3`; `triggerQuickAction`; `startVacuo`; `advanceVacuoSeries`; `handleNativeVacuumState`; `finishDailySession`; `WorkoutForegroundService`; `localStorage`; `SharedPreferences`; oito faixas mindfulness embarcadas; relay de hápticos Wear.
- Achado reproduzido para E01: o atalho `vacuo_rapido` usava `AppState.vacuum.isRunning` e `startVacuumCycle()`, inexistentes; a implementação real é `AppState.vacuo` + `startVacuo()`.
- Achado reproduzido para E01: fallback web concluía com `addMinutesToday(10, 'vacuum')`; o caminho nativo já usa `totalSessionElapsed` incrementado apenas enquanto não pausado.
- Alterações anteriores preservadas: hardening WebView, alarmes, assinatura release, contrato de versão, check Gold, CI, backup documentado e screenshot não mutante.
- Validação: `bash scripts/check.sh` → PASS antes desta etapa; AVD `Pixel_9` online; `:app:installDebug` → PASS; CoreFlow abriu no emulador sem `FATAL EXCEPTION`.
- Limitações: acessibilidade, Watch físico, atualização de instalação anterior e validação completa de áudio/periféricos permanecem pendentes para E13.
- Bloqueios: nenhum para E01.
- Próximo passo: finalizar E01 com regressões de tempo executado, pausa, salto, conclusão idempotente e teste funcional do atalho no emulador.

## 2026-09-20 — E01 / EM EXECUÇÃO

- Dependência E00 confirmada.
- Teste RED: `node diagnostics/vacuum-roadmap.test.cjs` falhou porque o atalho usava estado/iniciador inexistentes e a conclusão web creditava dez minutos fixos.
- Implementação inicial: corrigido o atalho para `AppState.vacuo` + `startVacuo()`, bloqueio de reentrada em `startVacuo()` e crédito por `Math.ceil(totalElapsedSec / 60)`, mantendo os dois HTMLs equivalentes.
- Validação GREEN: `node diagnostics/vacuum-roadmap.test.cjs` → PASS.
- Validação integrada: `bash scripts/check.sh` → PASS; `:app:installDebug` → PASS no `Pixel_9`.
- Cenário no emulador: toque em `Vácuo Rápido` abriu o player, iniciou `WorkoutForegroundService` e persistiu `sessionId` (`status=running`); nenhum `FATAL EXCEPTION` apareceu.
- Cenário de pausa: `totalSessionElapsed=83` permaneceu `83` após três segundos pausado.
- Cenário de salto: de `currentStepIndex=5`, `totalSessionElapsed=84` para `currentStepIndex=6`, `totalSessionElapsed=86`; o salto não creditou os seis segundos restantes do passo.
- Reset do cenário: estado final do serviço voltou a `idle`.
- Implementação adicional: ID da sessão de vácuo passou a acompanhar o payload nativo e a conclusão consulta `CorePersistence.completedSessionIds` antes de creditar; serviço preserva `sessionId` nos snapshots.
- Regressão encontrada e corrigida no callback nativo: `handleNativeVacuumState` escrevia em `vacPhaseInstruction`, elemento inexistente, interrompendo a persistência da conclusão antes do `saveState()`.
- Teste RED reproduzido para o callback: `diagnostics/vacuum-roadmap.test.cjs` passou a exigir a ausência do elemento inexistente; após a correção, `node diagnostics/vacuum-roadmap.test.cjs` → PASS.
- Conclusão completa no `Pixel_9`: 20 ações de `Pular` levaram o treino à tela `Concluído!`, o serviço voltou a `idle`, o snapshot nativo avançou para revisão `4` e registrou exatamente um ID (`vacuum-1789922652303`); não houve `ERROR:CONSOLE`, `Uncaught TypeError` ou `FATAL EXCEPTION`.
- Callback repetido: novo toque em `Pular` manteve revisão `4` e o mesmo único `completedSessionId`, sem novo crédito.
- Equivalência: `cmp -s index.html app/src/main/assets/index.html` → PASS; `git diff --check` → PASS.
- E01: CONCLUÍDA.
- Próximo passo: iniciar E02 — persistência e migração, com diagnóstico RED antes das alterações.

## 2026-09-20 — E02 / CONCLUÍDA

- Diagnóstico RED: `diagnostics/progress-persistence.test.cjs` falhou porque snapshots não tinham `sessionHistory`, normalização de registros ou migração automática do novo campo.
- Contrato implementado nos dois HTMLs: `id`, `schemaVersion`, `programId`, `phaseIndex`, `date`, `status` (`completed`/`interrupted`/`cancelled`), séries previstas/feitas, `retentionSeconds`, `recoverySeconds`, `pausedSeconds`, `interrupted` e `feedback` opcional; valores não negativos, limite de 200 registros e fonte de verdade em `CorePersistence.sessionHistory`.
- Idempotência: `upsertSessionRecord()` substitui o mesmo ID sem duplicar e mantém retenção limitada.
- Migração: snapshot v4 antigo sem `sessionHistory` é aceito, inicializa histórico vazio sem fabricar sessões e grava nova revisão; backup/importação anterior continua aceito.
- Validação preservada: importação valida antes de gravar, cancelamento não altera o armazenamento, falha de gravação preserva a última cópia válida, restauração/reabertura e repetição continuam cobertas pela suíte existente.
- Testes: `node diagnostics/progress-persistence.test.cjs` → PASS; `bash scripts/check.sh` → PASS; `cmp -s index.html app/src/main/assets/index.html` → PASS; `git diff --check` → PASS.
- Emulador: após reinstalação no `Pixel_9`, o snapshot nativo migrou da revisão `4` para `5` e passou a conter `sessionHistory:[]`, preservando `completedSessionIds`; sem `FATAL EXCEPTION`, `ERROR:CONSOLE` ou `Uncaught TypeError`.
- Limite deliberado: gravação de registros de sessão durante o motor de treino será conectada na E04; E02 entrega o contrato, migração, validação e armazenamento idempotente.
- E02: CONCLUÍDA.
- Próximo passo: iniciar E03 — regras de treino, começando pelo inventário das oito fases e pelos testes das regras antes de alterar conteúdo.

## 2026-09-20 — E03 / CONCLUÍDA

- Diagnóstico RED: `node diagnostics/vacuum-rules.test.cjs` falhou primeiro pela ausência do contrato e, depois, pela progressão automática existente no código (`holdMax` e avanço por calendário).
- Contrato concluído em `docs/roadmap/regras-vacuum.md`: inventário das oito fases; vocabulário Vácuo/Bracing/hipopressivos; tutorial postura → preparação → execução → saída → recuperação; feedback Confortável/Difícil/Interrompi/sem resposta; regras de manter, reduzir, repetir e sugerir avanço; agenda, frequência, vigência e decisões pendentes.
- Correção de progressão: `getProgramSteps()` inicia pelo `holdMin` e por `minSets || sets`; dias cumpridos não elevam a retenção nem o número de séries.
- Correção de avanço: ao concluir a frequência da fase do programa Vácuo (`id: '3'`), o estado registra `phase.reviewPending` e `program.progressionReview.status = 'pending'`; a fase não é marcada como concluída e `currentPhaseIndex` não avança automaticamente.
- Feedback visual: o card do programa informa que a revisão é necessária e que a etapa será repetida até uma decisão explícita. O fluxo de repetição continua disponível.
- Segurança de escopo: os demais programas preservam o comportamento anterior; dosagem clínica, incremento de recuperação e critérios numéricos de avanço permanecem bloqueados até responsável técnico/clínico e data de vigência serem definidos.
- Diagnóstico GREEN: `node diagnostics/vacuum-rules.test.cjs` → PASS; `cmp -s index.html app/src/main/assets/index.html` → PASS.
- Revisão de consistência: `docs/roadmap/regras-vacuum.md` confrontado com `index.html`, asset embarcado, `ROADMAP.md` e contrato E02; nenhuma aprovação clínica foi inferida.
- E03: CONCLUÍDA com pendência clínica explicitamente registrada; aumento automático de carga não foi implementado.
- Próximo passo: E04 — motor de sessão, começando por registrar sessões parciais/concluídas e feedback associado ao `sessionId`.

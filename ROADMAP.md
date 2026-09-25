# CoreFlow — roadmap de execução
Atualização local 25/09/2026: E12 publicada somente em `origin/work/e12-2-day-session-20260924` (`77bf1e0`), auditoria posterior pendente. E13 em `work/e13-after-e12-20260925` baseada nessa E12: `prepara`/`retorno` explícitas (RED→GREEN, check PASS), APK combinado instalado no Pixel_9; sessão programada observou `prepara` persistida, retenção e descanso, depois cancelamento com serviço `idle`/0 de 1 sessões. `retorno` ao vivo e `Encerrar retenção` na sessão programada ainda pendentes. Oito itens E04 abertos; E13 local sem commit/push, E12 não mesclada à `main`. Registro em `docs/roadmap/execucao.md`; o estado anterior abaixo é histórico, não aceite E13.

Atualizado: 24/09/2026. Status: E00–E03 e E05–E09 implementadas conforme evidências; E04 permanece aberta para verificação em E13. E09 está no commit `8afdd67`, aguardando auditoria independente e validação integrada. E10 segue em execução diretamente por chat e sem Kanban: E10.2–E10.7 foram publicadas no commit `7da1a47`; E10.1 continua diferida até referência revisada, e a validação física permanece pendente. E11 concluída localmente: 8/8 itens do checklist implementados e validados (faixas com duração real, erro/retentativa, controles de reprodução, faixa/fim de lista, silenciar avisos, hápticos ao encerrar, MediaSession/notificação em segundo plano publicada em `a9f1e18`, bloqueio mútuo Pausa de Resposta↔Mindfulness). Próxima ação: revisar, publicar a tranche final de E11 (duração real) e planejar E12.
Objetivo: melhorar Stomach Vacuum e implementar as 10 telas AMOLED com funções reais.
Histórico anterior preservado em [histórico](docs/roadmap/historico-2026-09-19.md).

## 1. Procedimento obrigatório para o agente
1. Ler este plano, verificar Git e ler o último registro de execução.
2. Escolher a primeira tarefa pendente com dependências satisfeitas.
3. Confirmar arquivos, funções e comportamento no código antes de editar.
4. Implementar uma tarefa por vez. Preservar alterações existentes.
5. Executar seu aceite; registrar comando/cenário, resultado e evidência.
6. Marcar checkbox somente após implementação e verificação.
7. Ao encerrar, registrar próximo passo exato, arquivos alterados e bloqueios.

Estados: PENDENTE, EM EXECUÇÃO, BLOQUEADA, CONCLUÍDA. Todas as etapas começam PENDENTES.
Sem teste exigido, não declarar conclusão. Bloqueio de aparelho não equivale a teste aprovado.
Código confirma comportamento; imagens orientam aparência; este plano define escopo.
Não inventar APIs, sensores, histórico, resultados de teste ou protocolo clínico.
Não mudar framework, IDs de programas ou armazenamento sem necessidade documentada.
Não reduzir critérios de aceite para fazer uma tarefa passar.
Se documentação histórica divergir do código, registrar e confirmar antes de mudar comportamento.

## 2. Arquivos confirmados
- Interface: `index.html` e `app/src/main/assets/index.html`; manter equivalentes.
- Bridge/WebView: `app/src/main/java/com/example/MainActivity.kt`.
- Treino: `app/src/main/java/com/example/WorkoutForegroundService.kt` e `WorkoutSessionPlayer.kt` no mesmo diretório.
- Áudio: `app/src/main/java/com/example/MindfulnessAudioService.kt`.
- Lembretes: `app/src/main/java/com/example/ReminderScheduler.kt`.
- Watch: `app/src/main/java/com/example/WearHapticsRelay.kt` e módulo `wear/`.
- Regressão: `diagnostics/progress-persistence.test.cjs`.
- Evidências futuras: criar `docs/roadmap/execucao.md` ao iniciar E00.
- Imagens: `assets/design/coreflow-s25-ultra/`, commit `114366b`.

## 3. Sequência e dependências
| Etapa | Entrega | Dependências |
| --- | --- | --- |
| E00 | Baseline e inventário | Nenhuma |
| E01 | Atalho e tempo real do vácuo | E00 |
| E02 | Dados e migração | E01 |
| E03 | Regras de treino | E00 |
| E04 | Motor e recuperação | E02, E03 — **aberta; verificação diferida para E13.** E06 foi entregue sobre ela sem esta dependência verificada. |
| E05 | Componentes AMOLED e navegação | E00 |
| E06 | Player de vácuo | E04, E05 |
| E07 | Programas e detalhe | E06 |
| E08 | Onboarding e Hoje | E05, E07 |
| E09 | Perfil | E02, E05 |
| E10 | Discreto e Pausas | E03, E05 |
| E11 | Mindfulness | E05 |
| E12 | Evolução | E02, E07 |
| E13 | Validação integrada | E06–E12 |

## 4. Etapas e checklists

### E00 — Baseline
- [x] Conferir Git, versão, instruções locais e alterações pendentes.
- [x] Localizar estado, início, pausa, salto, conclusão, persistência e callbacks web/nativos.
- [x] Confirmar `AppState.vacuo`, programa ID 3, `triggerQuickAction`, `advanceVacuoSeries`, `handleNativeVacuumState` e `finishDailySession`.
- [x] Reproduzir referência incorreta `AppState.vacuum`; verificar existência do iniciador chamado pelo atalho.
- [x] Confirmar registro fixo de 10 minutos no vácuo web.
- [x] Inventariar programas, fases, dados salvos, backup, áudios e recursos Watch realmente disponíveis.
- [x] Executar regressão existente e registrar falhas anteriores.
- [x] Verificar Node, JDK, SDK, navegador, ADB e Watch; registrar disponibilidade real.
Aceite: registro com símbolos, comandos, resultados e limitações; nenhuma suposição apresentada como teste.

### E01 — Correções do vácuo
Arquivos: HTMLs; serviço/bridge se necessário.
- [x] Corrigir chave de estado e chamar o iniciador existente confirmado.
- [x] Impedir duas sessões por duplo toque.
- [x] Trocar 10 minutos fixos por tempo executado; excluir pausa e duração pulada.
- [x] Unificar arredondamento web/nativo e documentar regra.
- [x] Deduplicar conclusão por ID; callback repetido não gera novo treino.
- [x] Criar regressões específicas e sincronizar HTML embarcado.
Aceite: 125 segundos praticados e 30 pausados contabilizam 125 segundos antes do arredondamento; atalho inicia uma sessão; salto não credita tempo não executado.

### E02 — Persistência e migração
- [x] Mapear campos existentes antes de acrescentar novos.
- [x] Definir contrato: ID, versão, programa, etapa, data, estado, séries previstas/feitas, retenção, recuperação, pausa, interrupção e feedback opcional.
- [x] Especificar unidades, limites, campos opcionais e fonte de verdade.
- [x] Separar concluída/interrompida/cancelada; definir efeitos em minutos, metas, sequência e conquistas.
- [x] Preservar histórico e posição; não fabricar métricas ausentes nos dados antigos.
- [x] Criar cópia anterior à migração; aceitar backup antigo com campos opcionais ausentes.
- [x] Validar importação antes de gravar; cancelamento não altera estado.
- [x] Testar migração repetida, gravação falha, restauração, reabertura e callback duplicado.
Aceite: migrar duas vezes não muda resultado; erro mantém última cópia válida; posição e sessões anteriores preservadas.

### E03 — Conteúdo e progressão
Saída: criar `docs/roadmap/regras-vacuum.md`.
- [x] Inventariar as oito fases atuais: postura, séries, retenção, descanso e frequência.
- [x] Revisar diferença entre bracing, vácuo e hipopressivos; alinhar texto, voz e ilustração.
- [x] Definir tutorial: postura → preparação → execução → saída → recuperação.
- [x] Definir feedback Confortável/Difícil/Interrompi, qualidade relatada e resposta ausente.
- [x] Definir critérios revisados de manter/reduzir/sugerir avanço; ausência de feedback não significa sucesso.
- [x] Definir incremento de descanso, limites e parâmetros por postura com justificativa técnica; não inventar dosagem.
- [x] Permitir repetir etapa; aumento não decorre só do calendário ou recorde.
- [x] Definir agenda, recuperação, sequência e data de vigência de alterações.
- [x] Registrar responsável/fonte da revisão e decisões não resolvidas.
Aceite: regras explícitas e revisadas. Dosagem não resolvida bloqueia sua implementação, sem bloquear correções independentes. A implementação segura usa o mínimo da fase, abre revisão pendente ao atingir a frequência e não avança automaticamente.
Evidência contextual: [revisão de hipopressivos](https://pubmed.ncbi.nlm.nih.gov/40565470/); não valida automaticamente o protocolo do app.

### E04 — Motor de sessão
Estado: **ABERTA — verificação diferida para E13** (decisão de Rafael, 22/09/2026). Item "Mais descanso" resolvido por remoção do produto (decisão de Rafael, 21/09/2026) em vez de permanecer bloqueado aguardando aprovação clínica — nenhum incremento ou dosagem foi definido ou inventado. Demais itens seguem conforme evidências em `docs/roadmap/execucao.md`.

E06, E07 e E08 foram entregues e aprovadas sobre esta etapa sem que os oito itens abaixo tivessem evidência própria registrada. A tabela de sequência lista E04 como dependência de E06, então essa dependência **não foi satisfeita de forma verificável** — o que não invalida as etapas seguintes, mas também não autoriza tratar E04 como fechada. Em vez de reabrir E04 agora e refazer o caminho, os itens ficam explicitamente diferidos para a validação integrada de E13, onde o motor é exercitado de ponta a ponta com aparelho.

Regra até lá: nenhum item de E04 pode ser marcado `[x]` por inferência a partir do aceite de E06/E07/E08. Cada um exige evidência própria, registrada em `docs/roadmap/execucao.md` e no registro de auditoria. Item que em E13 não puder ser verificado permanece `[ ]` com a lacuna nomeada — não vira conclusão por esgotamento do roadmap.
- [ ] Identificar preparação, inspiração, expiração, retenção, retorno e recuperação.
- [ ] “Encerrar retenção” registra executado e vai ao retorno/recuperação.
- [x] “Mais descanso” removido do controle e das referências do produto (HTML, diagnóstico e roadmap) por decisão registrada, em vez de manter o botão desabilitado aguardando incremento clínico não aprovado em E03. Evidência: `docs/roadmap/execucao.md`, SHA integrado `706c5dafee3224b6b1de240f44401f5b5f427938`.
- [ ] Pausa na retenção orienta sua saída; retomada não exige continuar apneia congelada.
- [ ] Bloquear alteração silenciosa de carga/postura em série ativa.
- [ ] Encerrar salva parcial; não conclui automaticamente programa.
- [ ] Feedback fica associado ao ID; permitir não responder.
- [ ] Retomar estado do serviço após bloqueio, sem iniciar timer concorrente.
- [ ] Cancelar sinais pendentes ao encerrar; evitar vibração duplicada.
Aceite: sequência, tempo e estado iguais nos caminhos web/nativo; interrupção permanece parcial após reabertura.
Evidência parcial verificada: diagnóstico do motor cobre registros/feedback por ID e restauração do snapshot web de vácuo sem timer/posse nativa obsoletos. Isso não comprova o aceite completo nem substitui validação no aparelho. Marcações anteriores de conclusão foram retiradas por falta de evidência e contradição com o bloqueio de E03.

### E05 — Sistema visual
- [x] Tokens: preto #000000, superfícies #0A0A0B/#111214, texto claro, verde/menta, ciano e alertas.
- [x] Componentes reutilizáveis: botão, ícone, card, seletor, toggle, modal, aviso, vazio e erro.
- [x] Navegação fixa: Hoje, Programas, Pausas, Evolução, Perfil; atalhos para Vácuo/Discreto/Mindfulness.
- [x] Voltar fecha modal antes de sair da tela; tratar sessão ativa.
- [x] Alvos de toque de 48dp equivalentes na WebView, rótulos e seleção compreensível sem cor.
- [x] Insets reais, câmera, teclado, gestos, fonte ampliada, TalkBack e redução de movimento (suporte implementado; validação física pendente).
- [x] Layout responsivo para S25 Ultra e telas menores; não fixar pixels físicos.
- [x] Assets essenciais locais/offline; não usar PNG inteiro como interface.
- [x] Criar inventário de controles: tela, ID, evento, estado alterado, persistência, falha/cancelamento e teste.
Aceite: navegação funcional; sem sobreposição/corte; nenhum controle decorativo aparentando funcionar.
Evidência E05: `docs/roadmap/inventario-controles-e05.md`, `diagnostics/e05-visual.test.cjs`, comparação byte a byte dos HTMLs e validação browser/emulador registrada no `docs/roadmap/execucao.md`.

### E06 — Tela 03: Vácuo
[Referência](assets/design/coreflow-s25-ultra/03-vacuo-player.png)
- [x] Mostrar postura, parâmetros, fase, contador, série, próxima etapa e estimativa reais.
- [x] Seletores configuram a sessão antes do início.
- [x] Ligar iniciar/pausar/retomar/pular/encerrar retenção/encerrar ao motor E04; "Mais descanso" foi removido do player por decisão registrada e não integra mais o escopo do controle.
- [x] Voz/hápticos/Watch refletem configurações reais; sem conexão fictícia.
- [x] Tutorial abre e retorna preservando configuração.
- [x] Falha ao iniciar não deixa timer animando; oferecer nova tentativa.
- [x] Resumo mostra executado e solicita feedback.
Aceite: sessão completa, parcial e pausa durante retenção verificadas; todos os controles do inventário exercitados.
Evidência E06: `diagnostics/e06-vacuo-player.test.cjs`, equivalência byte a byte dos HTMLs, browser local em viewport padrão com configuração persistida, tutorial, iniciar/pausar/retomar, salto, saída segura da retenção, encerramento parcial e feedback opcional. “Mais descanso” foi removido do produto por decisão registrada (Rafael, 21/09/2026), sem incremento clínico inventado; Watch sem ponte informa indisponibilidade.

### E07 — Telas 06/07: Programas e detalhe
[Programas](assets/design/coreflow-s25-ultra/06-programas.png) · [Detalhe](assets/design/coreflow-s25-ultra/07-programa-detalhe.png)
Estado: CONCLUÍDA. SHA integrado: `3326576700a5910f772c9659d060a3a02518884c` (PASS independente do Auditor após 6 rounds de rework, ver `docs/roadmap/execucao.md`).
- [x] Cards abrem programa correto, preservando IDs e fases reais; corrigir divergências do mockup. Evidência: `openDailyExecutionModal`/`openProgramDetail` roteiam por ID real e rejeitam ID inválido sem abrir outro card (`diagnostics/e07-programas.test.cjs`, casos 1–4).
- [x] Progresso, etapa, sessão diária e duração calculados do estado real. Evidência: hero/cards usam `getProgramSchedule`/`renderProgramWeeklyAgendaLabel` sobre dados reais do programa selecionado, sem fixar programa 2/meta 2 (`diagnostics/e07-programas.test.cjs`, caso 6).
- [x] Exercícios abrem instruções e duração da sequência escolhida. Evidência: `getProgramExerciseDetails`/`getProgramSteps` derivam da fase real; Mindfulness e IDs desconhecidos não herdam a sequência de Bracing (`diagnostics/e07-programas.test.cjs`, casos 13–15).
- [x] Iniciar envia exatamente etapa/sessão exibidas. Evidência: payload nativo preserva `programId`/`phaseIndex`/`sessionNumber`/`steps`; falha de início limpa o estado sem timer fantasma (`diagnostics/e07-programas.test.cjs`, verificação de `buildNativeWorkoutPayload`/`onNativeWorkoutState`).
- [x] Repetir etapa altera planejamento futuro sem apagar diário. Evidência: `repeatProgramPhase` reposiciona a etapa preservando `activityLog`/`sessionHistory` e bloqueia durante sessão ativa (`diagnostics/e07-programas.test.cjs`, casos 8–9).
- [x] Ajuste manual mantém prévia e não cria treino retroativo. Evidência: `applyProgramProgressAdjustment` registra posição sem fabricar minutos/diário, inclusive com `weeklyTargetDays` ausente (`diagnostics/e07-programas.test.cjs` caso 7; `diagnostics/e07-agenda-progress.test.cjs`, ajuste sem frequência).
- [x] Agenda, recuperação e sugestão de progressão obedecem E03. Evidência: ausência real de `weeklyTargetDays`/`reminderTimes` (null/undefined/vazio/zero) nunca fabrica agenda (7/6/1 dias) nem lembretes 09:00/16:00; revisão pendente do Vácuo (`progressionReview`/`reviewPending`) não avança por calendário e sobrevive a round-trip de snapshot (`diagnostics/e07-agenda-progress.test.cjs` completo; card "Revisão da etapa necessária" em `index.html:9344`).
- [x] Definir estados sem histórico, concluído e erro. Evidência: lista vazia mostra `programsListEmpty`, `CorePersistence.status = 'recoveryRequired'` mostra `programsListError`, e `programCompleted` mostra "Programa concluído" sem fabricar sessão nova (`diagnostics/e07-programas.test.cjs` casos 10–11; `index.html:9398-9401`).
Aceite: etapa 3/sessão 2 abre etapa 3/sessão 2; reabrir preserva posição; ajuste não fabrica minutos. Verificado nos dois HTMLs (byte-equivalentes, SHA `d5f990ed4bc4f989a4b4d81689936d74e3acaea1bf87b8c2859feefbf4a450d4`).
Limitação conhecida: sem validação física em Android, Galaxy Watch ou TalkBack (consistente com limitação declarada em todas as etapas E07.1–E07.5); `adb` não disponível no PATH desta sessão de consolidação.

### E08 — Telas 01/02: Onboarding e Hoje
[Onboarding](assets/design/coreflow-s25-ultra/01-onboarding.png) · [Hoje](assets/design/coreflow-s25-ultra/02-home.png)
Estado: E08.1–E08.6 CONCLUÍDAS; E08.6-R foi aceita com limitação real documentada; E08.7 IMPLEMENTADA e aguardando auditoria independente. Convenção de SHA: `base_sha=666e24a6f64c84c265fa46644efbaa089847823c` e `behavioral_target_sha=666e24a6f64c84c265fa46644efbaa089847823c`; o commit que registra esta consolidação é identificado no registro de execução e no handoff, pois um commit não pode conter o próprio SHA sem auto-referência.
- [x] Etapas: objetivo → meta/agenda → revisão; Voltar preserva preenchimento. Evidência: `onboardingGoBack`/`onboardingGoNext` preservam `onboardingState.focus`/`dailyGoalInput`/`weeklyDaysInput` entre etapas (`diagnostics/e08-onboarding.test.cjs`, casos 1-2).
- [x] Validar meta conforme contrato; salvar conclusão e abrir Hoje. Evidência: `onboardingValidateGoal`/`onboardingValidateWeeklyDays` bloqueiam meta vazia/fora de 5–180 min e frequência fora de 1–7 dias com motivo real (sem mensagem genérica); `onboardingComplete` grava `AppState.dailyGoal`/`onboardingFocus`/`weeklyGoalDays` e chama `switchTab('hoje')` (`diagnostics/e08-onboarding.test.cjs`, casos 1, 3, 4).
- [x] Usuário existente acessa histórico sem onboarding obrigatório novamente. Evidência: `applyProgressData` trata `onboardingCompleted` ausente em snapshot legado como `true`; a regressão de ponta a ponta `diagnostics/e08-existing-user.test.cjs` exercita `loadSavedState()` + `openOnboardingIfNeeded()` reais para instalação limpa (modal aparece), snapshot v4 existente com meta/agenda (modal não aparece), snapshot legado sem o novo campo (modal não aparece) e dado parcial/corrompido (`recoveryRequired`, sem travar, persistir estado substituto ou forçar onboarding).
- [x] Saudação usa nome real ou neutro; números usam diário. Evidência: `renderGreeting()` usa `AppState.userName` salvo (persistido/lido em `collectProgressData`/`applyProgressData`) quando presente, ou texto neutro por período do dia sem nome fabricado; `renderTodaySummary()`/`updateHeaderStats()` derivam minutos, progresso de meta, streak e relatório impresso de `AppState.totalMinutesToday`/`AppState.streak` calculados por `syncDerivedStats()` a partir do `activityLog` real, chamados no carregamento inicial e após cada sessão (`diagnostics/e08-hoje-greeting-numbers.test.cjs`, 4 cenários: instalação limpa, diário parcial com nome, legado sem nome, diário populado).
- [x] Editar meta permite salvar/cancelar. Evidência: `openEditGoalModal`/`closeEditGoalModal`/`saveEditGoalModal` reutilizam o contrato de `onboardingValidateGoal` (5–180 min inteiros); Cancelar fecha o modal sem alterar `AppState.dailyGoal` nem persistir; Salvar com meta válida atualiza `AppState.dailyGoal`, persiste via `saveState()` e atualiza `renderTodaySummary()`/`updateHeaderStats()` imediatamente; meta inválida exibe motivo real em `editGoalError` sem fechar o editor nem persistir (`diagnostics/e08-4-edit-goal.test.cjs`, 3 cenários: salvar válido, salvar inválido, cancelar).
- [x] Recomendação continua programa selecionado; sem programa oferece seleção; registrar desempate. Evidência: `selectTodayRecommendedProgram()` prioriza `AppState.programDetailState` (o programa/etapa já visitado/selecionado pelo usuário, E07); sem seleção prévia, considera apenas programas com progresso real (sessões hoje, dias concluídos na etapa, fase avançada ou ajuste manual registrado) e, sem nenhum candidato, `renderTodayRecommendation()` renderiza `todayProgramSelection` com botões explícitos por programa (nunca escolhe um arbitrário); a ação `selectTodayProgram(id)` grava a escolha explícita em `programDetailState` e persiste via `saveState()`. Regra de desempate documentada (dois ou mais candidatos elegíveis simultâneos): (1) mais sessões feitas hoje, (2) mais dias concluídos na etapa atual, (3) menor ID de programa como critério estável final — nunca escolha aleatória (`diagnostics/e08-5-hoje-recommendation.test.cjs`, 8 cenários).
- [x] Começar agora abre sessão exibida; atalhos Vácuo/Pausa/Kegel/Meditar/Discreto abrem módulos corretos. Evidência: `openTodayRecommendationSession(programId, phaseIndex, sessionNumber)` encaminha os três valores renderizados a `openDailyExecutionModal`, validando ID/fase/número sem fallback; `openTodayShortcut` encaminha Vácuo → `tab-vacuo`, Pausa → `tab-pausas`, Kegel → `tab-discreto`/`setDeskMode('kegel-velocidade')`, Meditar → `openMindfulnessAudioModal` e Discreto → `tab-discreto` sem iniciar timer ou sessão não solicitada (`diagnostics/e08-6-hoje-controls.test.cjs`).
- [x] Avatar abre Perfil; lembretes abrem configuração/permissão. Evidência: avatar do cabeçalho navega para `tab-perfil`; sino e botão de dashboard usam `openTodayReminderConfig`, que configura apenas o programa realmente recomendado e, sem programa, direciona para Programas sem fabricar configuração. `saveReminderConfig` só grava lembrete ativo após `requestSystemReminderPermission`; Android expõe `requestReminderPermission()` para pedir `POST_NOTIFICATIONS`, e a UI só mostra “Ativos” quando a permissão do sistema está concedida — negação permanece desativada (`diagnostics/e08-6-hoje-controls.test.cjs`). A limitação posicional identificada no Finding 1 de `t_b3ac2abf` foi corrigida em E09.3: slots vazios/inválidos mantêm índice e cardinalidade nos consumidores Web, snapshot e bridge, e uma Sessão 2 não é reatribuída à Sessão 1 (`diagnostics/e09-3-reminders.test.cjs`, `docs/roadmap/execucao.md`).
Aceite: instalação limpa, atualização, meta inválida e nenhum programa têm caminhos utilizáveis sem dados fictícios.
Evidência E08.1–E08.7: os seis diagnósticos E08 (`e08-onboarding`, `e08-existing-user`, `e08-hoje-greeting-numbers`, `e08-4-edit-goal`, `e08-5-hoje-recommendation`, `e08-6-hoje-controls`) passaram nos dois HTMLs byte-equivalentes; E08.6 também verificou `MainActivity.kt`, `ReminderScheduler.kt`, permissão efetiva, horários inválidos, soneza, stale smart reminder e a matriz de colisão nativa. O conjunto completo `for f in diagnostics/*.test.cjs; do node "$f"; done` passou; `bash scripts/check.sh` passou com `BUILD SUCCESSFUL`.

### E09 — Tela 10: Perfil
[Referência](assets/design/coreflow-s25-ultra/10-perfil-preferencias.png)
Estado: E09.2–E09.8 IMPLEMENTADAS; aguardando auditoria independente e validação física na E13.
- [x] Nome/meta com salvar/cancelar e persistência.
- [x] Lembretes configuram horários reais; permissão negada não aparece ativa (implementada em E09.3; auditoria independente pendente).
- [x] Voz/hápticos controlam motor; tema AMOLED altera aparência e persiste.
- [x] Acessibilidade abre ajustes com efeito verificável.
- [x] Watch mostra disponibilidade real e teste de vibração com retorno de falha.
- [x] Remover dados de sensores/bateria do mockup quando integração não existir.
- [x] Backup/exportação/importação usam arquivo real, prévia, cancelamento e erro.
- [x] Exclusão informa escopo, oferece exportação e exige confirmação explícita.
Aceite: preferências sobrevivem à reabertura; importação cancelada preserva dados; desconexão não aparece conectada. Evidência local: diagnósticos E09.2, E09.3, E09.4, E09.5 e E09.6, `scripts/check.sh`, equivalência byte a byte e build Android passaram; validação física permanece pendente.

### E10 — Telas 04/05: Discreto e Pausas
[Discreto](assets/design/coreflow-s25-ultra/04-modo-discreto.png) · [Pausas](assets/design/coreflow-s25-ultra/05-pausas-ativas.png)
- [ ] Posição/intensidade selecionam parâmetros revisados; prévia corresponde à execução. **Diferido por Rafael** até existir referência revisada; nenhum parâmetro foi inventado.
- [x] Sem áudio cumpre regra documentada; orientação visual permanece ativa. Evidência: `diagnostics/e10-discreto-silent-mode.test.cjs`, `e10-pause-audio-off.test.cjs` e `e10-pause-voice-off.test.cjs`.
- [x] Iniciar/pausar/retomar/encerrar funcionam e registram executado; circuito parcial/pulado não vira concluído. Evidência: `e10-stretch-pause-resume.test.cjs`, `e10-circuit-completed-steps.test.cjs`, `e10-circuit-duration.test.cjs`, `e10-circuit-skip-not-complete.test.cjs` e `e10-circuit-cancel-resume.test.cjs`.
- [x] Filtros de região alteram o catálogo; Ver todos restaura lista. Evidência: `diagnostics/e10-stretch-filter.test.cjs` exercita as quatro regiões e restaura os quatro cards.
- [x] Card abre exercício certo com instruções; Começar pausa inicia item exibido. Evidência: `diagnostics/e10-stretch-catalog-recommendation.test.cjs` compara nome, categoria, instrução e handler do card ao catálogo.
- [x] Recomendação tem regra explícita; catálogo permanece disponível sem depender dela. Evidência: `e10-stretch-catalog-recommendation.test.cjs` verifica a regra por horário e mantém os quatro cards.
- [x] Preservar Pausa de Resposta de três estágios, modo silencioso e histórico opcional. Evidência: `e10-responsive-pause.test.cjs` e `e10-responsive-pause-session-guard.test.cjs`.
Aceite local: diagnósticos E10 e `scripts/check.sh` passaram; parcial não é contabilizado como circuito completo, as métricas somam as durações efetivamente concluídas por etapa e todos os filtros/cards foram exercitados nos testes.
Limitações: a auditoria final identificou e corrigiu a divergência de duração do histórico quando a configuração muda entre etapas; os diagnósticos verificam durações individuais e retomadas. A origem da atualização de `ROADMAP.md` foi confirmada por Rafael e o diff local contém a atualização desta tarefa. Interação recente no AVD não foi verificável (captura inconsistente/taps sem efeito confirmado), sem teste físico/TalkBack/Watch. E10.1 (posição/intensidade) segue diferida até referência revisada; `∞ Livre` continua usando 300s por exercício e sua semântica precisa ser confirmada.

### E11 — Tela 08: Mindfulness
[Referência](assets/design/coreflow-s25-ultra/08-mindfulness-player.png)
- [x] Usar faixas existentes e duração real. Evidência: `diagnostics/e11-track-real-duration.test.cjs` compara `formalTrackDuration`/`secondaryTrackDuration` hardcoded contra a duração real medida via `ffprobe` nos 8 arquivos `.mp3` existentes — 7 de 8 fases divergiam (até 245s de diferença); corrigido para os valores reais. Validação AVD Pixel_9: player mostra `-09:34` (574s) na Semana 1, batendo com a duração real do arquivo.
- [x] Play/pausa, ±15s e busca controlam áudio; limitar posição aos extremos. Evidência: `diagnostics/e11-playback-controls.test.cjs` + validação AVD Pixel_9.
- [x] Próxima faixa corresponde ao arquivo anunciado; fim da lista tem comportamento definido. Evidência: `diagnostics/e11-track-announced-end-of-list.test.cjs` (verificação, sem bug encontrado).
- [x] Notificação/tela sincronizam posição em segundo plano; apenas uma reprodução. Evidência: `diagnostics/e11-mediasession-sync.test.cjs` + `MindfulnessAudioService` (MediaSession nativa + notificação com ação Pausar/Reproduzir) + validação AVD Pixel_9 (botão real da notificação pausou o áudio, sincronizado com o player).
- [x] Distinguir silenciar avisos de silenciar narração. Evidência: `diagnostics/e11-mute-alerts.test.cjs` + validação AVD Pixel_9 (toggle "Avisos ativos"/"Avisos silenciados" testado na UI real).
- [x] Hápticos cancelados ao encerrar. Evidência: `diagnostics/e11-cancel-haptics-on-close.test.cjs` + validação AVD Pixel_9 (fechar via X, sem crash).
- [x] Arquivo ausente oferece erro acessível e nova tentativa; falha/metadados ausentes não geram conclusão. Evidência: `diagnostics/e11-audio-error-retry.test.cjs`.
- [x] Pausa de Resposta abre fluxo próprio, sem áudio fictício do mockup; bloqueio mútuo de sessão concorrente com Mindfulness. Evidência: `diagnostics/e11-responsive-pause-mindfulness-guard.test.cjs` (2 cenários: abrir Mindfulness com Pausa de Resposta ativa/pausada é bloqueado com aviso; iniciar Pausa de Resposta com Mindfulness tocando é bloqueado com aviso).
Aceite: controles na tela/notificação, extremos da busca, bloqueio e arquivo ausente verificados.

### E12 — Tela 09: Evolução
[Referência](assets/design/coreflow-s25-ultra/09-evolucao.png)
- [ ] Período altera totais, comparação, gráfico e histórico juntos.
- [ ] Dia abre sessões; soma dos dias confere com total.
- [ ] Separar retenção, recuperação e tempo total; feedback ausente identificado.
- [ ] Mostrar interrupção sem conclusão integral.
- [ ] Conquistas abrem critérios e estado real.
- [ ] Sem base anterior, comparação indisponível; não inventar percentual.
- [ ] Insight de horário descreve frequência, não rendimento não medido.
- [ ] Exportar relatório usa mesmo período/dados; backup permanece acessível em Perfil.
Aceite: períodos vazio/parcial/completo conferem com diário e exportação.

### E13 — Integração e Android
Evidência parcial 25/09/2026: seis fases observadas no Pixel_9; `Encerrar retenção` na sessão programada percorreu `vacuo → retorno` pausado com retenção executada (1s) e série interrompida no estado nativo. Regressão RED→GREEN, `scripts/check.sh` PASS. Itens abaixo permanecem abertos até evidência integral, incluindo diário, retomada e dispositivos reais; ver `docs/roadmap/execucao.md`.
**Inclui a verificação diferida de E04** (oito itens em aberto do motor de sessão, ver E04). Cada um exige evidência própria e não pode ser marcado por inferência a partir de E06/E07/E08.
- [ ] E04 diferido: identificar preparação, inspiração, expiração, retenção, retorno e recuperação.
- [ ] E04 diferido: "Encerrar retenção" registra executado e vai ao retorno/recuperação.
- [ ] E04 diferido: pausa na retenção orienta sua saída; retomada não exige continuar apneia congelada.
- [ ] E04 diferido: bloquear alteração silenciosa de carga/postura em série ativa.
- [ ] E04 diferido: encerrar salva parcial; não conclui automaticamente programa.
- [ ] E04 diferido: feedback fica associado ao ID; permitir não responder.
- [ ] E04 diferido: retomar estado do serviço após bloqueio, sem iniciar timer concorrente.
- [ ] E04 diferido: cancelar sinais pendentes ao encerrar; evitar vibração duplicada.
- [ ] Verificar equivalência dos HTMLs e referências de assets.
- [ ] Executar regressões novas e existentes; registrar saídas.
- [ ] Confirmar sintaxe JavaScript e build Android; comando inicial a validar em E00: `.\gradlew.bat testDebugUnitTest assembleDebug`.
- [ ] Testar dez telas, Voltar, modais, teclado, erros, permissões e offline.
- [ ] Capturar telas e comparar às imagens; registrar desvios intencionais.
- [ ] Validar fonte ampliada, TalkBack, contraste e movimento reduzido.
- [ ] S25 Ultra: gestos, rotação, bloqueio, segundo plano e retomada.
- [ ] Watch: conexão, desconexão, reconexão, sinais e cancelamento.
- [ ] Atualizar instalação anterior e verificar posição, diário, preferências e backups.
- [ ] Gerar release conforme SIGNING.md quando ambiente disponível; registrar versão e limitações.
Aceite: testes exigidos aprovados e evidências registradas. Validação física pendente deve permanecer pendente. Publicação segue autorização vigente.

## 5. Registro para retomada
Criar registro por tarefa em `docs/roadmap/execucao.md`:
- Data, tarefa e estado.
- Referência Git e dependências confirmadas.
- Arquivos/símbolos alterados.
- Subitens concluídos.
- Comando ou cenário → resultado → evidência.
- Falhas anteriores versus novas.
- Decisões e justificativas.
- Bloqueios e dependentes afetados.
- Arquivos ainda não commitados.
- Próximo passo exato.

## 6. Limites
- Preservar arquitetura Android/WebView e Wear.
- Não adicionar login, nuvem, sensores de saúde ou monetização por inferência.
- Não transformar números/fotos/ícones do mockup em informações verdadeiras.
- Não apagar histórico antigo nem considerar incidentes anteriores resolvidos por esta reescrita.
- Não prometer ausência de erros da IA: exigir evidência e retomada documentada.

## 7. Práticas pesquisadas
- [Anthropic: Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents): funcionalidades verificáveis, trabalho incremental e registro de progresso entre sessões.
- [OpenAI: Harness engineering](https://openai.com/index/harness-engineering/): conhecimento e planos versionados no repositório, decisões e progresso documentados.

Aplicação: IDs, dependências, uma tarefa por vez, critérios de aceite, histórico separado e ponto de retomada. Organização adaptada ao CoreFlow; não é garantia de execução sem erros.

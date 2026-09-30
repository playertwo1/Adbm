# CoreFlow — Roadmap de Etapas Concluídas (Arquivo Histórico)

> **Nota de Arquivamento:** Este arquivo preserva os checklists detalhados, critérios de aceite e registros de evidências das etapas **E00 a E12** (e subitens concluídos de E04/E13) concluídas e consolidadas no repositório.
> Para o planejamento ativo e pendências futuras (E04 diferido, pendências de E10/E12 e validação integrada E13), consulte o [`ROADMAP.md`](../../ROADMAP.md) principal.

---

## Índice de Etapas Concluídas
- [E00 — Baseline e Inventário](#e00--baseline)
- [E01 — Correções do Vácuo](#e01--correções-do-vácuo)
- [E02 — Persistência e Migração](#e02--persistência-e-migração)
- [E03 — Conteúdo e Progressão](#e03--conteúdo-e-progressão)
- [E04 (Itens Concluídos) — Motor de Sessão](#e04-itens-concluídos--motor-de-sessão)
- [E05 — Sistema Visual AMOLED e Navegação](#e05--sistema-visual)
- [E06 — Tela 03: Player de Vácuo](#e06--tela-03-vácuo)
- [E07 — Telas 06/07: Programas e Detalhe](#e07--telas-0607-programas-e-detalhe)
- [E08 — Telas 01/02: Onboarding e Hoje](#e08--telas-0102-onboarding-e-hoje)
- [E09 — Tela 10: Perfil](#e09--tela-10-perfil)
- [E10 (Itens Concluídos) — Telas 04/05: Discreto e Pausas](#e10-itens-concluídos--telas-0405-discreto-e-pausas)
- [E11 — Tela 08: Mindfulness](#e11--tela-08-mindfulness)
- [E12 — Tela 09: Evolução](#e12--tela-09-evolução)
- [E13 (Itens Concluídos) — Validação das Seis Fases e Saída Segura](#e13-itens-concluídos--validação-das-seis-fases-e-saída-segura)
- [FUTURA — Modo Treino Flutuante (Overlay)](#futura--modo-treino-flutuante-overlay)

---

### E00 — Baseline
- [x] Conferir Git, versão, instruções locais e alterações pendentes.
- [x] Localizar estado, início, pausa, salto, conclusão, persistência e callbacks web/nativos.
- [x] Confirmar `AppState.vacuo`, programa ID 3, `triggerQuickAction`, `advanceVacuoSeries`, `handleNativeVacuumState` e `finishDailySession`.
- [x] Reproduzir referência incorreta `AppState.vacuum`; verificar existência do iniciador chamado pelo atalho.
- [x] Confirmar registro fixo de 10 minutos no vácuo web.
- [x] Inventariar programas, fases, dados salvos, backup, áudios e recursos Watch realmente disponíveis.
- [x] Executar regressão existente e registrar falhas anteriores.
- [x] Verificar Node, JDK, SDK, navegador, ADB e Watch; registrar disponibilidade real.
**Aceite:** registro com símbolos, comandos, resultados e limitações; nenhuma suposição apresentada como teste.

---

### E01 — Correções do vácuo
Arquivos: HTMLs; serviço/bridge se necessário.
- [x] Corrigir chave de estado e chamar o iniciador existente confirmado.
- [x] Impedir duas sessões por duplo toque.
- [x] Trocar 10 minutos fixos por tempo executado; excluir pausa e duração pulada.
- [x] Unificar arredondamento web/nativo e documentar regra.
- [x] Deduplicar conclusão por ID; callback repetido não gera novo treino.
- [x] Criar regressões específicas e sincronizar HTML embarcado.
**Aceite:** 125 segundos praticados e 30 pausados contabilizam 125 segundos antes do arredondamento; atalho inicia uma sessão; salto não credita tempo não executado.

---

### E02 — Persistência e migração
- [x] Mapear campos existentes antes de acrescentar novos.
- [x] Definir contrato: ID, versão, programa, etapa, data, estado, séries previstas/feitas, retenção, recuperação, pausa, interrupção e feedback opcional.
- [x] Especificar unidades, limites, campos opcionais e fonte de verdade.
- [x] Separar concluída/interrompida/cancelada; definir efeitos em minutos, metas, sequência e conquistas.
- [x] Preservar histórico e posição; não fabricar métricas ausentes nos dados antigos.
- [x] Criar cópia anterior à migração; aceitar backup antigo com campos opcionais ausentes.
- [x] Validar importação antes de gravar; cancelamento não altera estado.
- [x] Testar migração repetida, gravação falha, restauração, reabertura e callback duplicado.
**Aceite:** migrar duas vezes não muda resultado; erro mantém última cópia válida; posição e sessões anteriores preservadas.

---

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
**Aceite:** regras explícitas e revisadas. Dosagem não resolvida bloqueia sua implementação, sem bloquear correções independentes. A implementação segura usa o mínimo da fase, abre revisão pendente ao atingir a frequência e não avança automaticamente.
**Evidência contextual:** [revisão de hipopressivos](https://pubmed.ncbi.nlm.nih.gov/40565470/); não valida automaticamente o protocolo do app.

---

### E04 (Itens Concluídos) — Motor de sessão
Itens do motor concluídos e validados (demais itens abertos diferidos para E13):
- [x] Identificar preparação, inspiração, expiração, retenção, retorno e recuperação. Evidência E13: `diagnostics/e13-e04-vacuum-phases.test.cjs` + transições observadas no Pixel_9, registradas em `docs/roadmap/execucao.md`; auditoria independente PASS em `docs/roadmap/auditorias.md` (target `b2a69a6`).
- [x] “Encerrar retenção” registra executado e vai ao retorno/recuperação. Pixel_9/API 37: botão real → serviço `paused/retorno`, `retentionElapsedSeconds=1`, `retentionInterruptedSeries=[1]`; cancelamento persistiu um único registro parcial. Evidência em `docs/roadmap/execucao.md`.
- [x] “Mais descanso” removido do controle e das referências do produto (HTML, diagnóstico e roadmap) por decisão registrada, em vez de manter o botão desabilitado aguardando incremento clínico não aprovado em E03. Evidência: `docs/roadmap/execucao.md`, SHA integrado `706c5dafee3224b6b1de240f44401f5b5f427938`.

---

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
**Aceite:** navegação funcional; sem sobreposição/corte; nenhum controle decorativo aparentando funcionar.
**Evidência E05:** `docs/roadmap/inventario-controles-e05.md`, `diagnostics/e05-visual.test.cjs`, comparação byte a byte dos HTMLs e validação browser/emulador registrada em `docs/roadmap/execucao.md`.

---

### E06 — Tela 03: Vácuo
[Referência](../../assets/design/coreflow-s25-ultra/03-vacuo-player.png)
- [x] Mostrar postura, parâmetros, fase, contador, série, próxima etapa e estimativa reais.
- [x] Seletores configuram a sessão antes do início.
- [x] Ligar iniciar/pausar/retomar/pular/encerrar retenção/encerrar ao motor E04; "Mais descanso" foi removido do player por decisão registrada e não integra mais o escopo do controle.
- [x] Voz/hápticos/Watch refletem configurações reais; sem conexão fictícia.
- [x] Tutorial abre e retorna preservando configuração.
- [x] Falha ao iniciar não deixa timer animando; oferecer nova tentativa.
- [x] Resumo mostra executado e solicita feedback.
**Aceite:** sessão completa, parcial e pausa durante retenção verificadas; todos os controles do inventário exercitados.
**Evidência E06:** `diagnostics/e06-vacuo-player.test.cjs`, equivalência byte a byte dos HTMLs, browser local em viewport padrão com configuração persistida, tutorial, iniciar/pausar/retomar, salto, saída segura da retenção, encerramento parcial e feedback opcional. “Mais descanso” foi removido do produto por decisão registrada (Rafael, 21/09/2026), sem incremento clínico inventado; Watch sem ponte informa indisponibilidade.

---

### E07 — Telas 06/07: Programas e detalhe
[Programas](../../assets/design/coreflow-s25-ultra/06-programas.png) · [Detalhe](../../assets/design/coreflow-s25-ultra/07-programa-detalhe.png)
**Estado:** CONCLUÍDA. SHA integrado: `3326576700a5910f772c9659d060a3a02518884c` (PASS independente do Auditor após 6 rounds de rework, ver `docs/roadmap/execucao.md`).
- [x] Cards abrem programa correto, preservando IDs e fases reais; corrigir divergências do mockup. Evidência: `openDailyExecutionModal`/`openProgramDetail` roteiam por ID real e rejeitam ID inválido sem abrir outro card (`diagnostics/e07-programas.test.cjs`, casos 1–4).
- [x] Progresso, etapa, sessão diária e duração calculados do estado real. Evidência: hero/cards usam `getProgramSchedule`/`renderProgramWeeklyAgendaLabel` sobre dados reais do programa selecionado, sem fixar programa 2/meta 2 (`diagnostics/e07-programas.test.cjs`, caso 6).
- [x] Exercícios abrem instruções e duração da sequência escolhida. Evidência: `getProgramExerciseDetails`/`getProgramSteps` derivam da fase real; Mindfulness e IDs desconhecidos não herdam a sequência de Bracing (`diagnostics/e07-programas.test.cjs`, casos 13–15).
- [x] Iniciar envia exatamente etapa/sessão exibidas. Evidência: payload nativo preserva `programId`/`phaseIndex`/`sessionNumber`/`steps`; falha de início limpa o estado sem timer fantasma (`diagnostics/e07-programas.test.cjs`, verificação de `buildNativeWorkoutPayload`/`onNativeWorkoutState`).
- [x] Repetir etapa altera planejamento futuro sem apagar diário. Evidência: `repeatProgramPhase` reposiciona a etapa preservando `activityLog`/`sessionHistory` e bloqueia durante sessão ativa (`diagnostics/e07-programas.test.cjs`, casos 8–9).
- [x] Ajuste manual mantém prévia e não cria treino retroativo. Evidência: `applyProgramProgressAdjustment` registra posição sem fabricar minutos/diário, inclusive com `weeklyTargetDays` ausente (`diagnostics/e07-programas.test.cjs` caso 7; `diagnostics/e07-agenda-progress.test.cjs`, ajuste sem frequência).
- [x] Agenda, recuperação e sugestão de progressão obedecem E03. Evidência: ausência real de `weeklyTargetDays`/`reminderTimes` (null/undefined/vazio/zero) nunca fabrica agenda (7/6/1 dias) nem lembretes 09:00/16:00; revisão pendente do Vácuo (`progressionReview`/`reviewPending`) não avança por calendário e sobrevive a round-trip de snapshot (`diagnostics/e07-agenda-progress.test.cjs` completo; card "Revisão da etapa necessária" em `index.html:9344`).
- [x] Definir estados sem histórico, concluído e erro. Evidência: lista vazia mostra `programsListEmpty`, `CorePersistence.status = 'recoveryRequired'` mostra `programsListError`, e `programCompleted` mostra "Programa concluído" sem fabricar sessão nova (`diagnostics/e07-programas.test.cjs` casos 10–11; `index.html:9398-9401`).
**Aceite:** etapa 3/sessão 2 abre etapa 3/sessão 2; reabrir preserva posição; ajuste não fabrica minutos. Verificado nos dois HTMLs (byte-equivalentes, SHA `d5f990ed4bc4f989a4b4d81689936d74e3acaea1bf87b8c2859feefbf4a450d4`).
**Limitação conhecida:** sem validação física em Android, Galaxy Watch ou TalkBack; `adb` não disponível no PATH da sessão de consolidação original.

---

### E08 — Telas 01/02: Onboarding e Hoje
[Onboarding](../../assets/design/coreflow-s25-ultra/01-onboarding.png) · [Hoje](../../assets/design/coreflow-s25-ultra/02-home.png)
**Estado:** E08.1–E08.6 CONCLUÍDAS; E08.6-R foi aceita com limitação real documentada; E08.7 IMPLEMENTADA e consolidada.
Convenção de SHA: `base_sha=666e24a6f64c84c265fa46644efbaa089847823c`, `behavioral_target_sha=666e24a6f64c84c265fa46644efbaa089847823c`, `documentation_parent_sha=51041a9c95cd329a9b67dfbfb13f74ed07e573f5`.
- [x] Etapas: objetivo → meta/agenda → revisão; Voltar preserva preenchimento. Evidência: `onboardingGoBack`/`onboardingGoNext` preservam `onboardingState.focus`/`dailyGoalInput`/`weeklyDaysInput` entre etapas (`diagnostics/e08-onboarding.test.cjs`, casos 1-2).
- [x] Validar meta conforme contrato; salvar conclusão e abrir Hoje. Evidência: `onboardingValidateGoal`/`onboardingValidateWeeklyDays` bloqueiam meta vazia/fora de 5–180 min e frequência fora de 1–7 dias com motivo real (sem mensagem genérica); `onboardingComplete` grava `AppState.dailyGoal`/`onboardingFocus`/`weeklyGoalDays` e chama `switchTab('hoje')` (`diagnostics/e08-onboarding.test.cjs`, casos 1, 3, 4).
- [x] Usuário existente acessa histórico sem onboarding obrigatório novamente. Evidência: `applyProgressData` trata `onboardingCompleted` ausente em snapshot legado como `true`; a regressão de ponta a ponta `diagnostics/e08-existing-user.test.cjs` exercita `loadSavedState()` + `openOnboardingIfNeeded()` reais para instalação limpa (modal aparece), snapshot v4 existente com meta/agenda (modal não aparece), snapshot legado sem o novo campo (modal não aparece) e dado parcial/corrompido (`recoveryRequired`, sem travar, persistir estado substituto ou forçar onboarding).
- [x] Saudação usa nome real ou neutro; números usam diário. Evidência: `renderGreeting()` usa `AppState.userName` salvo (persistido/lido em `collectProgressData`/`applyProgressData`) quando presente, ou texto neutro por período do dia sem nome fabricado; `renderTodaySummary()`/`updateHeaderStats()` derivam minutos, progresso de meta, streak e relatório impresso de `AppState.totalMinutesToday`/`AppState.streak` calculados por `syncDerivedStats()` a partir do `activityLog` real, chamados no carregamento inicial e após cada sessão (`diagnostics/e08-hoje-greeting-numbers.test.cjs`, 4 cenários: instalação limpa, diário parcial com nome, legado sem nome, diário populado).
- [x] Editar meta permite salvar/cancelar. Evidência: `openEditGoalModal`/`closeEditGoalModal`/`saveEditGoalModal` reutilizam o contrato de `onboardingValidateGoal` (5–180 min inteiros); Cancelar fecha o modal sem alterar `AppState.dailyGoal` nem persistir; Salvar com meta válida atualiza `AppState.dailyGoal`, persiste via `saveState()` e atualiza `renderTodaySummary()`/`updateHeaderStats()` imediatamente; meta inválida exibe motivo real em `editGoalError` sem fechar o editor nem persistir (`diagnostics/e08-4-edit-goal.test.cjs`, 3 cenários: salvar válido, salvar inválido, cancelar).
- [x] Recomendação continua programa selecionado; sem programa oferece seleção; registrar desempate. Evidência: `selectTodayRecommendedProgram()` prioriza `AppState.programDetailState` (o programa/etapa já visitado/selecionado pelo usuário, E07); sem seleção prévia, considera apenas programas com progresso real (sessões hoje, dias concluídos na etapa, fase avançada ou ajuste manual registrado) e, sem nenhum candidato, `renderTodayRecommendation()` renderiza `todayProgramSelection` com botões explícitos por programa (nunca escolhe um arbitrário); a ação `selectTodayProgram(id)` grava a escolha explícita em `programDetailState` e persiste via `saveState()`. Regra de desempate documentada (dois ou mais candidatos elegíveis simultâneos): (1) mais sessões feitas hoje, (2) mais dias concluídos na etapa atual, (3) menor ID de programa como critério estável final — nunca escolha aleatória (`diagnostics/e08-5-hoje-recommendation.test.cjs`, 8 cenários).
- [x] Começar agora abre sessão exibida; atalhos Vácuo/Pausa/Kegel/Meditar/Discreto abrem módulos corretos. Evidência: `openTodayRecommendationSession(programId, phaseIndex, sessionNumber)` encaminha os três valores renderizados a `openDailyExecutionModal`, validando ID/fase/número sem fallback; `openTodayShortcut` encaminha Vácuo → `tab-vacuo`, Pausa → `tab-pausas`, Kegel → `tab-discreto`/`setDeskMode('kegel-velocidade')`, Meditar → `openMindfulnessAudioModal` e Discreto → `tab-discreto` sem iniciar timer ou sessão não solicitada (`diagnostics/e08-6-hoje-controls.test.cjs`).
- [x] Avatar abre Perfil; lembretes abrem configuração/permissão. Evidência: avatar do cabeçalho navega para `tab-perfil`; sino e botão de dashboard usam `openTodayReminderConfig`, que configura apenas o programa realmente recomendado e, sem programa, direciona para Programas sem fabricar configuração. `saveReminderConfig` só grava lembrete ativo após `requestSystemReminderPermission`; Android expõe `requestReminderPermission()` para pedir `POST_NOTIFICATIONS`, e a UI só mostra “Ativos” quando a permissão do sistema está concedida — negação permanece desativada (`diagnostics/e08-6-hoje-controls.test.cjs`). A limitação posicional identificada no Finding 1 de `t_b3ac2abf` foi corrigida em E09.3: slots vazios/inválidos mantêm índice e cardinalidade nos consumidores Web, snapshot e bridge, e uma Sessão 2 não é reatribuída à Sessão 1 (`diagnostics/e09-3-reminders.test.cjs`, `docs/roadmap/execucao.md`).
**Aceite:** instalação limpa, atualização, meta inválida e nenhum programa têm caminhos utilizáveis sem dados fictícios.
**Evidência E08.1–E08.7:** os seis diagnósticos E08 passaram nos dois HTMLs byte-equivalentes; `bash scripts/check.sh` passou com `BUILD SUCCESSFUL`.

---

### E09 — Tela 10: Perfil
[Referência](../../assets/design/coreflow-s25-ultra/10-perfil-preferencias.png)
**Estado:** E09.2–E09.8 IMPLEMENTADAS no código.
- [x] Nome/meta com salvar/cancelar e persistência.
- [x] Lembretes configuram horários reais; permissão negada não aparece ativa (implementada em E09.3).
- [x] Voz/hápticos controlam motor; tema AMOLED altera aparência e persiste.
- [x] Acessibilidade abre ajustes com efeito verificável.
- [x] Watch mostra disponibilidade real e teste de vibração com retorno de falha.
- [x] Remover dados de sensores/bateria do mockup quando integração não existir.
- [x] Backup/exportação/importação usam arquivo real, prévia, cancelamento e erro.
- [x] Exclusão informa escopo, oferece exportação e exige confirmação explícita.
**Aceite:** preferências sobrevivem à reabertura; importação cancelada preserva dados; desconexão não aparece conectada.
**Evidência local:** diagnósticos E09.2, E09.3, E09.4, E09.5 e E09.6, `scripts/check.sh`, equivalência byte a byte e build Android passaram.

---

### E10 (Itens Concluídos) — Telas 04/05: Discreto e Pausas
[Discreto](../../assets/design/coreflow-s25-ultra/04-modo-discreto.png) · [Pausas](../../assets/design/coreflow-s25-ultra/05-pausas-ativas.png)
- [x] Sem áudio cumpre regra documentada; orientação visual permanece ativa. Evidência: `diagnostics/e10-discreto-silent-mode.test.cjs`, `e10-pause-audio-off.test.cjs` e `e10-pause-voice-off.test.cjs`.
- [x] Iniciar/pausar/retomar/encerrar funcionam e registram executado; circuito parcial/pulado não vira concluído. Evidência: `e10-stretch-pause-resume.test.cjs`, `e10-circuit-completed-steps.test.cjs`, `e10-circuit-duration.test.cjs`, `e10-circuit-skip-not-complete.test.cjs` e `e10-circuit-cancel-resume.test.cjs`.
- [x] Filtros de região alteram o catálogo; Ver todos restaura lista. Evidência: `diagnostics/e10-stretch-filter.test.cjs` exercita as quatro regiões e restaura os quatro cards.
- [x] Card abre exercício certo com instruções; Começar pausa inicia item exibido. Evidência: `diagnostics/e10-stretch-catalog-recommendation.test.cjs` compara nome, categoria, instrução e handler do card ao catálogo.
- [x] Recomendação tem regra explícita; catálogo permanece disponível sem depender dela. Evidência: `e10-stretch-catalog-recommendation.test.cjs` verifica a regra por horário e mantém os quatro cards.
- [x] Preservar Pausa de Resposta de três estágios, modo silencioso e histórico opcional. Evidência: `e10-responsive-pause.test.cjs` e `e10-responsive-pause-session-guard.test.cjs`.
**Aceite local:** diagnósticos E10 e `scripts/check.sh` passaram; parcial não é contabilizado como circuito completo, as métricas somam as durações efetivamente concluídas por etapa e todos os filtros/cards foram exercitados nos testes.
*(Nota: O item de parâmetros revisados de posição/intensidade permanece diferido no roadmap ativo até aprovação clínica).*

---

### E11 — Tela 08: Mindfulness
[Referência](../../assets/design/coreflow-s25-ultra/08-mindfulness-player.png)
**Estado:** CONCLUÍDA (8/8 itens).
- [x] Usar faixas existentes e duração real. Evidência: `diagnostics/e11-track-real-duration.test.cjs` compara `formalTrackDuration`/`secondaryTrackDuration` hardcoded contra a duração real medida via `ffprobe` nos 8 arquivos `.mp3` existentes — corrigido para os valores reais. Validação AVD Pixel_9: player mostra `-09:34` (574s) na Semana 1, batendo com a duração real do arquivo.
- [x] Play/pausa, ±15s e busca controlam áudio; limitar posição aos extremos. Evidência: `diagnostics/e11-playback-controls.test.cjs` + validação AVD Pixel_9.
- [x] Próxima faixa corresponde ao arquivo anunciado; fim da lista tem comportamento definido. Evidência: `diagnostics/e11-track-announced-end-of-list.test.cjs`.
- [x] Notificação/tela sincronizam posição em segundo plano; apenas uma reprodução. Evidência: `diagnostics/e11-mediasession-sync.test.cjs` + `MindfulnessAudioService` (MediaSession nativa + notificação com ação Pausar/Reproduzir) + validação AVD Pixel_9 (botão real da notificação pausou o áudio, sincronizado com o player).
- [x] Distinguir silenciar avisos de silenciar narração. Evidência: `diagnostics/e11-mute-alerts.test.cjs` + validação AVD Pixel_9 (toggle "Avisos ativos"/"Avisos silenciados" testado na UI real).
- [x] Hápticos cancelados ao encerrar. Evidência: `diagnostics/e11-cancel-haptics-on-close.test.cjs` + validação AVD Pixel_9 (fechar via X, sem crash).
- [x] Arquivo ausente oferece erro acessível e nova tentativa; falha/metadados ausentes não geram conclusão. Evidência: `diagnostics/e11-audio-error-retry.test.cjs`.
- [x] Pausa de Resposta abre fluxo próprio, sem áudio fictício do mockup; bloqueio mútuo de sessão concorrente com Mindfulness. Evidência: `diagnostics/e11-responsive-pause-mindfulness-guard.test.cjs` (2 cenários: abrir Mindfulness com Pausa de Resposta ativa/pausada é bloqueado com aviso; iniciar Pausa de Resposta com Mindfulness tocando é bloqueado com aviso).
**Aceite:** controles na tela/notificação, extremos da busca, bloqueio e arquivo ausente verificados.

---

### E12 — Tela 09: Evolução
[Referência](../../assets/design/coreflow-s25-ultra/09-evolucao.png)
**Estado:** Integrada à `origin/main` no merge `716c297bd051686650914d38684d54967ee90743`.
- [x] Período altera totais, comparação, gráfico e histórico juntos. Evidência E12.1: `diagnostics/e12-period-consistency.test.cjs` cobre semana atual, semana anterior e últimos 7 dias, atualizando os componentes pela mesma janela.
- [x] Dia abre sessões; soma dos dias confere com total. Evidência local: `diagnostics/e12-day-session-details.test.cjs`.
- [x] Separar retenção, recuperação e tempo total; feedback ausente identificado. Evidência local: `diagnostics/e12-day-session-details.test.cjs` e `diagnostics/session-engine.test.cjs`.
- [x] Mostrar interrupção sem conclusão integral. Evidência local: `diagnostics/e12-day-session-details.test.cjs`.
- [x] Conquistas abrem critérios e estado real. Evidência local: `diagnostics/e12-achievements.test.cjs`.
- [x] Sem base anterior, comparação indisponível; não inventar percentual. Evidência E12.1: o diagnóstico verifica períodos sem base real e impede percentual fabricado.
- [x] Insight de horário descreve frequência, não rendimento não medido. Evidência local: `diagnostics/e12-day-session-details.test.cjs`.
- [x] Exportar relatório usa mesmo período/dados; backup permanece acessível em Perfil. Evidência local: `diagnostics/e12-period-report.test.cjs`.
**Aceite:** períodos vazio/parcial/completo conferem com diário e exportação.

---

### E13 (Itens Concluídos) — Validação das Seis Fases e Saída Segura
- [x] E04 diferido: identificar preparação, inspiração, expiração, retenção, retorno e recuperação. Auditoria restrita PASS em `docs/roadmap/auditorias.md` (target `b2a69a6`).
- [x] E04 diferido: “Encerrar retenção” registra executado e vai ao retorno/recuperação. AVD + diário parcial persistido (1s); ver `docs/roadmap/execucao.md`.

---

### FUTURA — Modo Treino Flutuante (Overlay)
[Referência Visual](../../assets/design/coreflow-s25-ultra/11-treino-flutuante-material3.png)  
**Estado:** CONCLUÍDA (28/09/2026) — Auditada e aprovada em [`docs/roadmap/auditoria-treino-flutuante.md`](../roadmap/auditoria-treino-flutuante.md).

#### Objetivo e Arquitetura
Exibir a sessão cronometrada ativa sobre outros aplicativos Android através de uma janela flutuante nativa (`SYSTEM_ALERT_WINDOW`). O overlay é estritamente passivo e consome o estado de `WorkoutForegroundService.kt`:
`WorkoutForegroundService` → timer → voz → hápticos → Galaxy Watch → notificação → `WorkoutOverlayController`.

#### Regras Proibitivas Auditadas
- [x] Proibido criar outro cronômetro (zero timers concorrentes).
- [x] Proibido criar outro `ForegroundService`.
- [x] Proibido disparar vibração própria.
- [x] Proibido duplicar voz.
- [x] Proibido duplicar sinais do Galaxy Watch.
- [x] Proibido alterar regras dos exercícios.

#### Checkpoints Concluídos
- [x] **CP1 — Permissão e Estrutura:** `SYSTEM_ALERT_WINDOW` no manifesto; `WorkoutOverlayController.kt` criado; verificação de `canDrawOverlays` e abertura de configurações Android; degradação segura se permissão for negada.
- [x] **CP2 — Sincronização:** Sincronizado via `WorkoutForegroundService.persistAndBroadcast()`; remoção imediata em conclusão/interrupção/destruição.
- [x] **CP3 — Três Estados Visuais:** Mini (36dp, pílula AMOLED), Compacta (44dp, ação/timer/série) e Expandida (card M3 com controles, progresso circular e prévia do próximo passo); suporte a arrasto, encaixe lateral (`snap to edge`) e auto-recolhimento de 5s.
- [x] **CP4 — Controles Nativos:** Botões chamam apenas `ACTION_PAUSE`, `ACTION_RESUME`, `ACTION_SKIP`, `ACTION_SAFE_EXIT_RETENTION` (saída segura de retenção do vácuo) e retorno à `MainActivity`.
- [x] **CP5 — Preferências do Usuário:** Botão e modal `#floatingWorkoutSettingsModal` na aba Perfil; seleção de tamanho padrão (mini/compacto/expandido), auto-recolhimento e próximo passo; persistência em `SharedPreferences` e snapshot v4.
- [x] **CP6 — Compatibilidade:** Vácuo, Kegel e Bracing com suporte a paletas dinâmicas por exercício (`resolveThemeColor`).
- [x] **CP7 — Regressão e Verificações:** `diagnostics/floating-workout-overlay.test.cjs` e `WorkoutOverlayTest.kt` aprovados; equivalência de HTML e builds Android/Wear debug 100% funcionais.


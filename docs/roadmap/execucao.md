# Registro de execução

## 2026-09-22 — E08.6r / fechamento dos 3 achados de auditoria (t_dc4dfd04)

- Base: cadeia E08.6 completa (`caa02db..8255644`) reaplicada por cherry-pick sobre o base E08.5 aprovado (`5c43fea19fd70094534d760281d36c7f0b087dcf`), conforme requisito de redesign da task `t_b3ac2abf`.
- F1 (colisão de identidade de soneza): `snoozeRequestCode` deixou de somar `minutes` diretamente ao código base (que podia transbordar/colidir com outro programa/sessão) e passou a compor a identidade por blocos disjuntos (`SNOOZE_REQUEST_BASE + programBase*10_000 + sessionNumber*1_000 + minutos`), injetiva para toda a matriz real de programas/sessões/minutos 1..720 e sem sobreposição com os códigos diários/notificação.
- F2 (fallback fabricado de 15:30): `ReminderRescheduleReceiver` (reagendamento no boot) não usa mais `"15:30"` como valor padrão quando `mind_reminder_time` está ausente; lê o horário persistido tal como está (vazio se ausente) e delega a `scheduleMindSmartReminder`, que já valida formato/opt-in/permissão antes de publicar — ausência ou valor inválido apenas cancela o alarme, nunca fabrica um horário.
- F3 (divergência UI/nativo do smart reminder): `syncAllNativeReminders()` agora também chama `syncSmartMiddayReminderNative()`, que reconcilia o alarme nativo com o estado persistido `AppState.mente.smartReminderEnabled` + permissão efetiva a cada carregamento/restore. O snapshot de progresso passou a persistir `smartReminderEnabled` e a restauração (`applyProgressData`) só reativa o opt-in com valor booleano explícito e permissão efetiva — nunca por omissão.
- Regressões: `app/src/test/java/com/example/ReminderSchedulerTest.kt` ganhou uma matriz adversarial cobrindo todos os programas reais (`1`..`4`) × sessões (1,2) × minutos de soneza (1..720) sem colisão, e nenhuma coincidência com os códigos diários/notificação; `diagnostics/e08-6-hoje-controls.test.cjs` ampliado com asserções estáticas dos 3 fechamentos e um cenário comportamental de `syncAllNativeReminders`/`syncSmartMiddayReminderNative` cobrindo opt-in ativo, opt-in desativado e permissão revogada.
- Verificação: `node diagnostics/*.test.cjs` (21 arquivos) — todos OK; `index.html` e `app/src/main/assets/index.html` mantidos byte-idênticos (verificado por `cmp`).
- Limitação conhecida: build Gradle/JVM (`app/src/test/.../ReminderSchedulerTest.kt`) não pôde ser executado nesta sessão por ausência de JDK/Android SDK no ambiente do worker — os novos testes foram revisados manualmente contra a implementação e cobrem a matriz declarada, mas não têm confirmação de compilação/execução real do Gradle. Recomenda-se rodar `bash scripts/check.sh` com JDK/Android SDK configurados antes de aprovar.

## 2026-09-22 — E08.6 / correção de identidade de soneza e smart reminder stale

- Base: `f4ffc61daa846dd3caa73202ae7696f170e96016`.
- Correção: sonezas nativas agora incluem a duração na identidade do `PendingIntent` e o cancelamento usa a mesma ação/identidade, evitando colisões e alarmes pendentes após revogação. `showMindSmartNotification()` exige opt-in persistido, horário `HH:mm` válido e permissão efetiva antes de publicar; estado stale é cancelado sem notificação nem rearmamento.
- Regressões: `app/src/test/java/com/example/ReminderSchedulerTest.kt` executa os contratos de identidade e publicação; `diagnostics/e08-6-hoje-controls.test.cjs` trava os caminhos nativos correspondentes.

## 2026-09-22 — E08.6 / correção de restauração e cancelamento completo de lembretes

- Base: `c269ef71e70dfcbf9ba890ca43a2d8a16fffa0cc`.
- Correção: restauração v4 agora aceita somente horários `HH:mm` e inteiros estritos para `sessionsToday`, marca progresso inválido para impedir início fabricado e deriva `pushNotificationsEnabled` exclusivamente de permissão efetiva e agenda válida. O retorno ao foreground após carregamento revalida a ponte; cancelamento remove alarmes diários e sonezas pendentes; smart reminder não usa default ativo ao rearmar.
- Regressões comportamentais: `diagnostics/e07-programas.test.cjs` e `diagnostics/e07-agenda-progress.test.cjs` exercitam restauração inválida, limpeza de horário e permissão negada; `diagnostics/e08-6-hoje-controls.test.cjs` cobre os guardas nativos adicionais.

## 2026-09-22 — E08.6 / correção de divergências de estado e regressões comportamentais

- Base: `bfb7da5adb71e81f460e61513b6b90c77d843e33`.
- Correção: horários inválidos são removidos da persistência/UI e não contam como agenda completa; revogação zera `pushNotificationsEnabled`; `Começar agora` exibe erro para `sessionsToday` inválido sem alterar o payload; disparo/adiamento nativos não rearmam alarmes sem permissão e desativam o programa revogado.
- Regressão `diagnostics/e08-6-hoje-controls.test.cjs` agora executa validação de `HH:mm`, completude da agenda, smart reminder negado e revogação em foreground, além dos testes de roteamento E08.6 e dos guardas nativos.

## 2026-09-22 — E08.6 / correção de fonte única de lembretes após auditoria

- Base: `d11a998b697a1d1e09b021f7561d4dd1efef679e`.
- Correção: permissão efetiva agora combina runtime `POST_NOTIFICATIONS`, estado global do app e canal `coreflow_reminders`; scheduler, bridge, UI, restauração e smart reminder usam essa mesma decisão. Horários são aceitos somente em `HH:mm` válido em JS e Kotlin, sem fallback para 09:00/15:30/16:00.
- Retorno ao foreground revalida permissão, cancela/desativa lembretes negados e atualiza a UI; smart reminder não aparece ativo nem agenda quando a permissão está negada. ROADMAP corrigido para não contradizer E08.6.
- Regressão `diagnostics/e08-6-hoje-controls.test.cjs` ampliada para os contratos de smart reminder, revogação em foreground, app/canal desativado e validação HH:mm.

## 2026-09-22 — E08.6 / Hoje: começar agora, atalhos, avatar e lembretes

- Base: `5c43fea19fd70094534d760281d36c7f0b087dcf` (E08.5 com PASS independente confirmado pelo card pai); worktree `adbm/t_281c2916-adbm-e08.6-hoje-come-ar-agora-atalhos-av` confirmado limpo antes da alteração.
- Implementação:
  - O card `todayRecommendationCard` captura no markup o `programId`, `currentPhaseIndex` e número de sessão que exibiu. `openTodayRecommendationSession()` valida exatamente esse trio e o encaminha a `openDailyExecutionModal(programId, phaseIndex, sessionNumber)`, sem recalcular/fazer fallback para outra etapa ou sessão.
  - Os controles de Hoje agora são Vácuo, Pausa, Kegel, Meditar e Discreto. `openTodayShortcut()` somente abre o módulo real correspondente: Vácuo → `tab-vacuo`; Pausa → `tab-pausas`; Kegel → `tab-discreto` com `setDeskMode('kegel-velocidade')`; Meditar → player existente `openMindfulnessAudioModal`; Discreto → `tab-discreto`. Nenhum atalho inicia timer/sessão de forma implícita. O encaminhamento legado `triggerQuickAction()` foi ajustado para não chamar os símbolos inexistentes `switchDiscreteSubtab`, `setKegelMode` e `toggleKegelTimer`.
  - Foram adicionados no cabeçalho o sino que abre `openTodayReminderConfig()` e o avatar que navega a `tab-perfil`; sem programa recomendado, lembretes não fabricam um alvo e levam o usuário a Programas com mensagem utilizável.
  - A configuração de lembrete agora confere a permissão real antes de marcar o programa como ativo. `requestSystemReminderPermission()` consulta/sinaliza o bridge; `saveReminderConfig()` persiste `remindersEnabled:false` quando a permissão não está concedida e a UI não mostra "Ativos" nesse estado. `AndroidBridge.requestReminderPermission()` solicita `POST_NOTIFICATIONS` no Android quando necessário; após conceder a permissão, o usuário salva novamente a configuração, evitando marcar ativa uma autorização ainda pendente ou negada.
- Regressão nova: `diagnostics/e08-6-hoje-controls.test.cjs`, com execução VM dos caminhos públicos para programa/fase/sessão exatos; as cinco rotas de atalho; avatar; lembrete com e sem programa; e contratos de permissão WebView/bridge. `diagnostics/session-engine.test.cjs` foi adaptado para incluir o novo roteador real de atalhos e continua cobrindo sessão ativa de Vácuo sem alteração de postura/duração.
- Limitações conhecidas: Perfil completo permanece escopo E09; qualidade funcional integral de Pausas/Discreto e Mindfulness permanece dependente das etapas E10/E11. Não foi possível validar a caixa de permissão nem a alteração de status em dispositivo Android físico nesta execução; a lógica é coberta pelo bridge e testes locais, mas a auditoria deve manter essa limitação explícita.

## 2026-09-22 — E08.5 / Hoje: recomendação de programa e desempate

- Base: `0ef3c996a5bf25d1a07e5cf61db0f6d96d3d7f1c` (E08.4 com PASS independente confirmado no card pai `t_ab568790`, auditoria round 2); worktree alinhado por fast-forward limpo de `67849ee` para esse SHA antes de iniciar.
- Escopo: na tela Hoje, a recomendação de sessão/programa continua exatamente o programa/etapa já selecionado pelo usuário (E07); sem programa selecionado, oferece seleção explícita em vez de escolher sozinha; regra de desempate documentada para dois ou mais candidatos elegíveis.
- Implementação:
  - Novo container `todayRecommendationContainer` na tela Hoje (`index.html`/asset, logo abaixo dos atalhos rápidos, antes do resumo do dia), preenchido por `renderTodayRecommendation()`.
  - `selectTodayRecommendedProgram()`: se `AppState.programDetailState.programId` aponta para um programa real não-Mindfulness (o mesmo estado já usado por E07 para "hero"/reabertura de detalhe), esse programa é sempre a recomendação — nenhum outro critério o substitui, mesmo que outro programa tenha mais sessões hoje ou mais progresso. Sem seleção prévia, considera candidatos apenas os programas com **progresso real** (`programHasRealProgress`: sessões feitas hoje, dias concluídos na etapa atual, fase avançada além da inicial, ou um `lastManualAdjustment` registrado) — nunca fabrica "personalização" a partir de horário do dia ou qualquer sinal não suportado por dado real.
  - Sem nenhum candidato com progresso real e sem seleção prévia: `renderTodayRecommendation()` renderiza `todayProgramSelection`, um card com um botão por programa real (Bracing, Kegel/Cronograma Avançado, Vácuo — Mindfulness fica fora deste fluxo de seleção de "programa" por ter modelo de sessão informal/formal próprio, inalterado nesta fatia). A tela nunca escolhe um desses programas sozinha nesse estado.
  - `selectTodayProgram(programId)`: nova ação explícita que grava a escolha do usuário em `AppState.programDetailState` (mesmo campo já persistido por E07 em `collectProgressData`/`applyProgressData`, sem novo campo de armazenamento) e persiste via `saveState()`; ID inválido não altera a seleção e mostra erro real (`showInlineToast`), sem fabricar escolha.
  - **Regra de desempate documentada** (dois ou mais candidatos elegíveis simultâneos, sem seleção explícita prévia): (1) mais sessões concluídas hoje (`sessionsToday`) vence primeiro; (2) empate em sessões hoje → mais dias concluídos na etapa atual (`daysCompletedInPhase`) vence; (3) empate total → menor ID de programa como critério estável e determinístico final, nunca uma escolha aleatória ou por horário. Esta é a mesma regra registrada no comentário do card da tarefa.
  - Card de recomendação exibido (`todayRecommendationCard`) reutiliza dados 100% reais do programa (`title`, fase ativa, `sessionsToday`/`dailyTarget`) e o botão "Continuar"/"Iniciar" chama `openDailyExecutionModal(program.id)`, que já resolve a fase pela `currentPhaseIndex` real do programa (contrato de E07 preservado) — a sessão iniciada é exatamente a etapa/sessão exibida no card, sem duplicar a lógica do hero de Programas.
  - `renderTodayRecommendation()` é chamada por `renderTodaySummary()` (já disparada por `switchTab('hoje')`, `renderAfterProgressLoad()` no carregamento inicial e após `saveEditGoalModal()`/`addMinutesToday()`), garantindo que a recomendação reflita o estado real assim que a tela Hoje é exibida ou atualizada, sem lógica de renderização duplicada.
- Nenhum ID de programa, chave de armazenamento, bridge nativo ou protocolo de treino foi alterado; `programDetailState` é o mesmo campo já usado por E07.2-R para reabertura de detalhe, reaproveitado aqui sem novo esquema.
- Regressão nova: `diagnostics/e08-5-hoje-recommendation.test.cjs`, 8 cenários — (1) programa já selecionado continua sendo a recomendação mesmo quando outro programa tem mais sessões hoje; (2) sem seleção e sem progresso real em nenhum programa, Hoje oferece seleção explícita (nunca escolhe sozinha); (3) seleção explícita via `selectTodayProgram` é gravada e passa a ser a recomendação; (4) ID inválido na seleção não fabrica escolha nem mascara o erro; (5) desempate por mais sessões hoje entre 3 candidatos elegíveis; (6) desempate por dias concluídos na etapa quando sessões hoje empatam; (7) empate total resolvido pelo menor ID; (8) candidato único com progresso real é a recomendação direta, sem passar pelo desempate.
- Regressões existentes ajustadas: `diagnostics/e08-4-edit-goal.test.cjs` e `diagnostics/e08-hoje-greeting-numbers.test.cjs` tiveram seus harnesses de `noopNames` atualizados para stubar também `renderTodayRecommendation` (nova função chamada por `renderTodaySummary`), evitando `ReferenceError` na simulação isolada.
- Verificações executadas:
  - `node diagnostics/e08-5-hoje-recommendation.test.cjs` → exit 0; 8 cenários passaram.
  - `for f in diagnostics/*.test.cjs; do node "$f" || exit 1; done` → exit 0 nos 21 arquivos (20 preexistentes + o novo), sem regressão introduzida.
  - `bash scripts/check.sh` com `JAVA_HOME='C:/Program Files/Android/Android Studio/jbr'` e `ANDROID_HOME=$LOCALAPPDATA/Android/Sdk` → `BUILD SUCCESSFUL`; diagnósticos, `:app:testDebugUnitTest`, `:app:assembleDebug` e `:wear:assembleDebug` passaram.
  - `cmp -s index.html app/src/main/assets/index.html` → exit 0; SHA-256 idêntico em ambos: `3749cdf13129239d8883f9c1482f2c4b85b9627433de4c693abb443d8a5f34db`.
  - `git diff --check` → exit 0 (sem espaço em branco/whitespace inválido introduzido).
- Limitação conhecida: sem validação física em Android, Galaxy Watch ou TalkBack. O card de recomendação/seleção foi adicionado apenas na tela Hoje (escopo deste card); demais itens do checklist E08 ("Começar agora" e atalhos Vácuo/Pausa/Kegel/Meditar/Discreto abrindo módulos corretos, avatar/lembretes) continuam pendentes para E08.6+. A escolha explícita de programa criada aqui (`selectTodayProgram`) não substitui nem altera a navegação existente de `openProgramDetail`/`renderProgramsList` na aba Programas — ambas convivem sobre o mesmo `programDetailState`.

## 2026-09-22 — E08.4 / Hoje: editar meta com salvar/cancelar

- Base: `2bfd1ea407243f26fb7818b1fd685f2aa8d7db3e` (E08.3 com PASS independente confirmado no card pai, auditor `t_075a49be`/run 113); worktree alinhado por fast-forward limpo de `67849ee` para esse SHA antes de iniciar.
- Escopo: permitir editar a meta diária (`AppState.dailyGoal`) diretamente pela tela Hoje, reutilizando o contrato de validação já definido em E08.1 (`onboardingValidateGoal`: inteiro entre 5 e 180 minutos), com Cancelar sem efeito colateral e Salvar validando/persistindo/atualizando a tela imediatamente.
- Implementação:
  - Novo botão de edição (ícone de lápis) no card "Resumo do dia" da tela Hoje (`onclick="openEditGoalModal()"`), ao lado do valor de minutos/meta agora exibido como `X min / Y min` (`todayGoalValue` adicionado ao markup e a `renderTodaySummary()`).
  - Novo modal `editGoalModal` com input numérico (`editGoalInput`), área de erro real (`editGoalError`, `role="alert"`) e botões Cancelar/Salvar explícitos — sem reaproveitar o modal genérico `editProgramModal` (escopo e contrato de dados diferentes).
  - `openEditGoalModal()`: pré-carrega o input com o `AppState.dailyGoal` salvo (não um rascunho anterior) e limpa qualquer erro exibido.
  - `closeEditGoalModal()` (Cancelar/fechar): apenas esconde o modal e limpa o erro; não toca em `AppState.dailyGoal` nem chama `saveState()` — reabrir depois de cancelar volta a mostrar a meta salva, não o rascunho descartado.
  - `saveEditGoalModal()`: reutiliza `onboardingValidateGoal(rawGoal)` (mesmo contrato de E08.1); em caso de meta inválida, exibe o motivo real retornado pela validação em `editGoalError` e **não fecha o modal nem persiste**; em caso de meta válida, atualiza `AppState.dailyGoal`, chama `saveState()` (aborta com mensagem de erro real se a persistência falhar, sem fechar o modal), e só então fecha o modal, chama `renderTodaySummary()`/`updateHeaderStats()` para refletir a tela imediatamente e mostra um toast de confirmação.
  - `editGoalModal` registrado nos dois pontos de fechamento por overlay existentes (`closeTopmostOverlay()` e o array `overlayIds` do handler de "Voltar" do Android) para que o botão físico/gesto de voltar feche o editor como os demais modais, sem sair da tela Hoje.
  - Editar a meta não cria treino nem sessão retroativa: nenhuma chamada a `addMinutesToday`/`saveState` do motor de sessão é feita neste fluxo; apenas `AppState.dailyGoal` é alterado e persistido via o mesmo `saveState()` central do snapshot v4 (`collectProgressData().dailyGoal`).
- Regressão adicionada: `diagnostics/e08-4-edit-goal.test.cjs`, exercitando `loadSavedState()` + `openEditGoalModal`/`saveEditGoalModal`/`closeEditGoalModal` reais (não apenas string/regex de markup) em 3 cenários: (1) salvar meta válida — persiste no snapshot, atualiza `AppState.dailyGoal` e o markup de Hoje (`todayGoalValue`) imediatamente, fecha o modal; (2) salvar meta inválida — abaixo do mínimo (`3`) e vazia (`''`) são ambas rejeitadas com o motivo real de `onboardingValidateGoal` exibido em `editGoalError`, o modal permanece aberto e o `AppState.dailyGoal`/snapshot persistido continuam com o valor anterior (30); (3) cancelar — editar o input para `90` e cancelar não altera `AppState.dailyGoal` nem o snapshot persistido, e reabrir o editor depois mostra a meta salva (30), não o rascunho descartado. O arquivo também trava por regex a presença dos elementos/handlers de contrato (`editGoalModal`, `openEditGoalModal()`, `saveEditGoalModal()`, `closeEditGoalModal()`, `editGoalInput`, `editGoalError`) no HTML.
- Verificações executadas:
  - `node diagnostics/e08-4-edit-goal.test.cjs` → exit 0; 3 cenários (salvar válido, salvar inválido, cancelar) passaram.
  - `node` em todos os 20 `diagnostics/*.test.cjs` → exit 0 (nenhuma regressão anterior quebrada por esta mudança; nenhum harness precisou de ajuste, pois as novas funções não são chamadas pelos testes existentes).
  - `bash scripts/check.sh` com `JAVA_HOME='C:/Program Files/Android/Android Studio/jbr'` e `ANDROID_HOME=$LOCALAPPDATA/Android/Sdk` → `BUILD SUCCESSFUL`; diagnostics, `:app:testDebugUnitTest`, `:app:assembleDebug` e `:wear:assembleDebug` passaram.
  - `cmp -s index.html app/src/main/assets/index.html` → exit 0; SHA-256 idêntico em ambos: `23e8bbdef2eb180ef7cfc5139e5f8738a91244c4268299b1b461eaf5d4978c3c`.
  - `git diff --check` → exit 0 (sem espaço em branco/whitespace inválido introduzido).
- Limitação conhecida: sem validação física em Android, Galaxy Watch ou TalkBack. O botão de editar meta foi adicionado apenas na tela Hoje (escopo deste card); a mesma edição em Perfil (E09, "Nome/meta com salvar/cancelar e persistência") não foi tocada e permanece pendente naquela etapa — pode futuramente reutilizar o mesmo `onboardingValidateGoal`/modal ou um equivalente, mas isso é decisão de E09, não desta fatia. Demais itens do checklist E08 (recomendação/desempate de programa, atalhos "Começar agora", avatar/lembretes) continuam pendentes para E08.5+.

## 2026-09-22 — E08.3 / Hoje: saudação e números reais do diário

- Base: `fb423e89bfcc2dac823eaaac53ea2edc12263a0a` (E08.2 com PASS independente confirmado no card pai); worktree alinhado por fast-forward limpo de `67849ee` para esse SHA antes de iniciar.
- Mapeamento mockup → fonte real (tela Hoje, `assets/design/coreflow-s25-ultra/02-home.png`):
  - Saudação "Bom dia, Rafael": nome "Rafael" era texto fixo no markup. Substituído por `renderGreeting()`, que usa `AppState.userName` (persistido em `userName` no snapshot v4, carregado por `applyProgressData`) quando presente e não vazio; caso contrário usa apenas o texto neutro por período do dia ("Bom dia!"/"Boa tarde!"/"Boa noite!"), sem "Olá, Usuário" fabricado.
  - Badge de streak do header (`headerStreakCount`) e relatório impresso (`printStreak`): placeholder fixo "5"/"5 Dias" removido; ambos já eram atualizados em runtime por `updateHeaderStats()`/`exportPerformancePDF()` a partir de `AppState.streak` (calculado em `syncDerivedStats()` por dias consecutivos reais no `activityLog`); apenas o valor inicial decorativo do markup foi zerado.
  - "Resumo do dia" (`todayMinutesValue`, `todayGoalProgress`): já derivado de `AppState.totalMinutesToday`/`AppState.dailyGoal`, mas só era atualizado ao trocar de aba (`switchTab('hoje')`), deixando "0 min" fixo do markup visível até a primeira navegação. Extraído para `renderTodaySummary()`, agora chamado também em `renderAfterProgressLoad()` (carregamento inicial) e em `addMinutesToday()` (após cada sessão registrada).
  - `printCompleted`/`printTime` (relatório PDF): placeholders fixos "4 / 5"/"18 Minutos" removidos; ambos já eram recalculados por `exportPerformancePDF()` a partir de `AppState.schedule`/`AppState.totalMinutesToday` reais.
  - Chips de "Ações Rápidas" (Vácuo 2-5min, Bracing 2min etc.) e o card "Treino Recomendado de Hoje" (`renderSmartSuggestionCard`) permanecem fora do escopo desta fatia: já eram texto/duração de configuração dos módulos reais (não números decorativos de diário), e o card de recomendação já é renderizado dinamicamente por regra de horário/sessões reais existente antes desta etapa.
- Persistência: `AppState.userName` adicionado ao estado, com leitura em `applyProgressData()` (string não vazia; ausência/legado vira `null`, nunca nome fabricado) e escrita em `collectProgressData()` para round-trip no snapshot v4. Nenhuma UI de edição de nome foi criada nesta fatia (fica para E09/Perfil, fora deste escopo); o valor é populado quando outra fase gravar `userName` no estado.
- Regressão adicionada: `diagnostics/e08-hoje-greeting-numbers.test.cjs` cobre, via `loadSavedState()` real: (1) instalação limpa — saudação neutra por período, streak/minutos/progresso zerados, sem herdar os valores decorativos do mockup; (2) usuário existente com nome salvo e diário parcial — saudação com nome real, minutos/streak/progresso derivados do `activityLog` real (não os valores fixos do mockup); (3) snapshot legado sem `userName` — saudação neutra por período, sem "Rafael"/"Usuário" fabricado, números do diário vazio real; (4) diário populado com múltiplos dias consecutivos — streak exato da sequência real. O arquivo também trava por regex que o markup não contém mais os placeholders decorativos originais ("Olá, Rafael", "5" no badge de streak, "5 Dias"/"18 Minutos"/"4 / 5" no relatório impresso).
- Regressões existentes ajustadas: `diagnostics/e08-existing-user.test.cjs` e `diagnostics/progress-persistence.test.cjs` têm seus harnesses de `noopNames` atualizados para stubar também `renderTodaySummary` (nova função chamada por `renderAfterProgressLoad`), evitando `ReferenceError` na simulação isolada de `loadSavedState()`.
- Limitação conhecida: sem validação física em Android, Galaxy Watch ou TalkBack. Edição de nome do usuário (tela Perfil) não foi implementada nesta fatia — é escopo de E09; até lá, `AppState.userName` permanece `null` em instalações reais e a saudação usa o texto neutro. Demais itens do checklist E08 (editar meta em Perfil, recomendação/desempate de programa, atalhos "Começar agora", avatar/lembretes) continuam pendentes para E08.4+.

## 2026-09-22 — E08.2 / Onboarding: usuário existente pula fluxo obrigatório

- Base: `13b539a0a228a85cf9c0503c649a4a2165a3758c` (E08.1 com PASS independente confirmado no card pai); worktree alinhado por fast-forward limpo de `67849ee` para esse SHA antes de iniciar.
- Implementação preservada e verificada: `applyProgressData()` reconhece snapshot v4 legado sem `onboardingCompleted` como usuário já existente (`true`), enquanto `loadSavedState()` marca somente primeira instalação real sem nenhum dado como `onboardingCompleted:false`. Não foi criada flag, chave, ID, migração, bridge ou protocolo novo.
- Regressão adicionada: `diagnostics/e08-existing-user.test.cjs` cobre a cadeia real `loadSavedState()` → `openOnboardingIfNeeded()` em cinco cenários: (1) instalação limpa abre o modal; (2) snapshot v4 válido com meta/agenda e `onboardingCompleted:true` abre sem onboarding; (3) snapshot v4 legado sem esse campo também abre sem onboarding; (4) snapshot/local legado corrompido não trava, fica em `recoveryRequired`, não persiste estado substituto e não força onboarding; (5) legado parcial fica em `recoveryRequired` sem ser confundido com instalação nova.
- Limitação conhecida: não houve validação física Android/Galaxy Watch/TalkBack; os itens E08 restantes (saudação, edição de meta, recomendação, atalhos, avatar/lembretes) continuam fora deste escopo e pendentes para E08.3+.

## 2026-09-22 — E08.1 / Onboarding: objetivo → meta/agenda → revisão

- Base: `eda1705055e093a67a65df62a69b0e4999039ff0` (PASS independente E07.6, fechamento formal da E07, confirmado por `t_a1e68a4e`). Worktree do card `t_7a01c2a4` já estava alinhado a esse SHA (HEAD == merge-base) antes de iniciar; o bloqueio anterior registrado nos eventos do card (worktree divergente em `67849ee`) já havia sido resolvido pelo Diretor antes desta execução.
- Escopo implementado: modal `id="onboardingModal"` com três etapas — objetivo (`onboardingStep1`, escolha de foco entre 5 opções do mockup `01-onboarding.png`), meta/agenda (`onboardingStep2`, meta diária em minutos + frequência semanal opcional) e revisão (`onboardingStep3`, resumo antes de concluir). Navegação via `onboardingGoNext()`/`onboardingGoBack()`; `onboardingState` mantém `focus`/`dailyGoalInput`/`weeklyDaysInput` durante toda a sessão, preservando o preenchimento parcial ao voltar em qualquer etapa.
- Validação de meta conforme contrato existente (E02/E07): `onboardingValidateGoal` exige inteiro entre 5–180 minutos (mesmos limites de negócio já usados por `AppState.dailyGoal`); `onboardingValidateWeeklyDays` aceita vazio (opcional) ou inteiro entre 1–7 dias (mesmo intervalo de `weeklyTargetDays`/`getConfiguredWeeklyTargetDays`). Mensagens de erro são específicas por caso (vazia, fora do limite inferior/superior, não numérica) e exibidas em `#onboardingStepError`, sem mensagem genérica fabricada.
- Conclusão: `onboardingComplete()` só grava e navega se meta e frequência forem válidas; grava `AppState.dailyGoal`, `AppState.onboardingFocus`, `AppState.weeklyGoalDays`, marca `AppState.onboardingCompleted = true`, chama `saveState()` e `switchTab('hoje')`, reabrindo a tela Hoje com o estado recém-criado.
- Persistência: `collectProgressData()`/`applyProgressData()` passam a incluir `dailyGoal`/`onboardingCompleted`/`onboardingFocus`/`weeklyGoalDays` no snapshot v4; nenhum campo, ID, chave de armazenamento (`coreflow_progress_snapshot_v4`), bridge ou protocolo de treino existente foi alterado ou removido.
- Usuário existente / instalação nova: snapshot legado sem o campo novo (`onboardingCompleted` ausente) é tratado como `true` em `applyProgressData` — usuário já instalado não é forçado a repetir onboarding. Instalação realmente nova (sem nenhuma chave local, `readLegacyProgress().firstUse === true`) grava `onboardingCompleted:false` em `loadSavedState()`, exigindo o fluxo na primeira abertura real.
- Regressão nova: `diagnostics/e08-onboarding.test.cjs`, 6 cenários — (1) meta inválida bloqueia avanço com motivo real (vazia/abaixo/acima do limite/não numérica/frequência fora do limite); (2) preenchimento parcial + Voltar preserva foco, meta e frequência em cada etapa; (3) conclusão grava meta/agenda no `AppState` e no snapshot coletado, e navega para Hoje; (4) meta inválida chamada diretamente em `onboardingComplete` não conclui nem navega; (5) snapshot legado sem `onboardingCompleted` não força onboarding em usuário existente; (6) instalação nova exige onboarding via `loadSavedState()` real.
- Verificações executadas: `for f in diagnostics/*.test.cjs; do node "$f" || exit 1; done` → PASS nos 16 arquivos (15 preexistentes + `e08-onboarding.test.cjs` novo); `cmp -s index.html app/src/main/assets/index.html` → PASS, SHA-256 `02355d334f68f28e8345f8ef65b1e5ba71cb6ab657b035f2e79e3c447f4989f1` idêntico nos dois; `git diff --check` → PASS; `JAVA_HOME='C:/Program Files/Android/Android Studio/jbr' ANDROID_HOME=$LOCALAPPDATA/Android/Sdk bash scripts/check.sh` → BUILD SUCCESSFUL, CHECK PASS (diagnósticos, equivalência HTML, `:app:testDebugUnitTest`, `:app:assembleDebug`, `:wear:assembleDebug`).
- Limitações conhecidas: sem validação física em Android/Watch/TalkBack (consistente com limitação declarada em todas as etapas anteriores); demais itens do checklist E08 (saudação com nome real, editar meta em Perfil, recomendação de programa/desempate, atalhos "Começar agora", avatar/lembretes) não fazem parte do escopo de E08.1 e permanecem pendentes para E08.2+ — não marcados como concluídos no ROADMAP.
- E08.1: IMPLEMENTED (Builder). Aguarda auditoria independente conforme `nexus-review-workflow` antes de liberar E08.2.
- Próximo passo: auditoria independente do target desta etapa; após PASS, iniciar E08.2 com o próximo item do checklist E08 ainda pendente (saudação/nome real ou neutro).

## 2026-09-22 — E07.6 / CONSOLIDAÇÃO — fechamento formal da E07

- Dependência: PASS independente da E07.5 confirmado pelo Auditor (task `t_600dfe21`, run 100) no target `3326576700a5910f772c9659d060a3a02518884c`, após 6 rounds de rework (fallbacks `weeklyTargetDays || 7/6/1` e `reminderTimes || ['09:00','16:00']` eliminados e substituídos por estado explícito real).
- Ação desta etapa: fast-forward do branch de trabalho (`67849ee` → `3326576700a5910f772c9659d060a3a02518884c`); nenhuma alteração de código adicional foi necessária. Apenas `ROADMAP.md` e este arquivo foram atualizados para refletir o fechamento.
- Cobertura confirmada da matriz de aceite E07 (todas com evidência real, ver `diagnostics/e07-programas.test.cjs` e `diagnostics/e07-agenda-progress.test.cjs`):
  1. Cards abrem programa correto por ID; ID inválido não abre outro card e mostra erro utilizável (casos 1–4).
  2. Progresso/etapa/sessão diária calculados do estado real; hero não fixa mais programa 2/meta 2 (caso 6).
  3. Exercícios abrem instruções/duração da sequência real; Mindfulness e IDs desconhecidos não herdam Bracing (casos 13–15).
  4. Iniciar envia exatamente etapa/sessão exibidas via payload nativo preservado; falha de início não deixa timer fantasma.
  5. Repetir etapa reposiciona sem apagar diário/histórico; bloqueado durante sessão ativa (casos 8–9).
  6. Ajuste manual não fabrica minutos/diário retroativo, inclusive sem `weeklyTargetDays` configurado (caso 7; e07-agenda-progress).
  7. Agenda/recuperação/progressão conforme E03: ausência real de `weeklyTargetDays`/`reminderTimes` (null/undefined/vazio/zero) nunca fabrica agenda nem lembretes; revisão pendente do Vácuo (`progressionReview`/`reviewPending`) não avança por calendário e sobrevive a round-trip de snapshot (suite completa de e07-agenda-progress.test.cjs, 6 rounds de auditoria).
  8. Estados sem histórico/concluído/erro: `programsListEmpty`, `programsListError` (via `CorePersistence.status = 'recoveryRequired'`) e `programCompleted` (Programa concluído, sem sessão fabricada) (casos 10–11).
- Verificações executadas nesta consolidação (target `3326576700a5910f772c9659d060a3a02518884c`):
  - `for f in diagnostics/*.test.cjs; do node "$f" || exit 1; done` → PASS em todos (16 arquivos, incluindo E01–E07, persistência, backup, contrato E02, sessão, política CI/release/webview/version).
  - `cmp -s index.html app/src/main/assets/index.html` → PASS; SHA `d5f990ed4bc4f989a4b4d81689936d74e3acaea1bf87b8c2859feefbf4a450d4` em ambos.
  - `git diff --check` → PASS; `git status --short` → worktree limpo.
  - `bash scripts/check.sh` (com `JAVA_HOME`/`ANDROID_HOME` configurados) → CHECK PASS; builds debug phone/Wear e testes unitários passaram.
- Não fabricado: nenhum item da checklist E07 foi marcado sem evidência de execução direta (node/vm) documentada acima; nenhuma alteração de IDs, armazenamento, bridge, protocolo de treino ou histórico foi feita nesta etapa.
- Limitações conhecidas (herdadas de E07.1–E07.5, não resolvidas nesta etapa): sem validação física em Android, Galaxy Watch ou TalkBack; `adb` não disponível no PATH desta sessão.
- Próximo passo: E08 (Onboarding e Hoje) permanece bloqueada aguardando retrospectiva do Diretor antes de ser proposta, conforme processo registrado no card E07.6.

## 2026-09-21 — E07.4 / IMPLEMENTED — iniciar etapa e sessão exibidas

- Base de implementação: `bb8c80b603afb04be7b0d5d553ddd34b8a435d79` (E07.3 aprovado), integrado nesta worktree antes da alteração.
- Regressão adicionada em `diagnostics/e07-programas.test.cjs`: o detalhe abre a fase selecionada; o payload nativo preserva `programId`, `phaseIndex`, `sessionNumber` e `steps`; falha assíncrona de início limpa o estado sem timer fantasma e mantém a tentativa disponível.
- Implementação nos dois HTMLs: `openDailyExecutionModal` aceita o número de sessão exibido pelo lembrete; rejeita fase/etapa sem sequência em vez de cair para outra fase; `startSessionFromReminder` encaminha `activeReminderSessionNumber`; o handler nativo trata `failed` sem deixar sessão rodando fictícia; exceção síncrona do bridge também limpa o estado.
- Preservação: payload/bridge E04, armazenamento, histórico, IDs de programa e fluxo de Vácuo não foram alterados; os HTMLs permanecem idênticos.
- Validação desta etapa: `node diagnostics/e07-programas.test.cjs` → PASS; regressões completas, equivalência/hash, `git diff --check` e `bash scripts/check.sh` executados no handoff.
- Limitações: sem aparelho físico/Watch/TalkBack; Builder não declara PASS. Auditoria independente do target SHA permanece necessária.


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
- Disponibilidade registrada: Node, JDK, Android SDK, navegador local e ADB foram confirmados; Watch físico não estava conectado, portanto a validação Wear física permanece pendente; o módulo Wear e o relay foram apenas auditados no código.
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

## 2026-09-20 — Auditoria E00–E03

- Baseline auditado: `78efe3e`; commits locais desta execução incluem `02b11d4`; `origin/main` permanece em `327b7d6`. As alterações locais de E03/auditoria não foram enviadas ao remoto porque não foi feito novo push após a orientação de não usar GitHub Actions.
- Validação local: `bash scripts/check.sh` → PASS; diagnósticos E00–E03, teste unitário Android, builds debug de `app` e `wear` e equivalência dos HTMLs passaram.
- Integridade dos HTMLs: SHA-256 idêntico (`256ab5ec...`) em `index.html` e `app/src/main/assets/index.html`; `git diff --check` → PASS.
- Emulador: `Pixel_9`/`emulator-5554` online; APK debug reinstalado com sucesso; `MainActivity` ficou como atividade retomada; não foram encontrados `ERROR:CONSOLE`, `Uncaught TypeError` ou `FATAL EXCEPTION` no smoke test.
- Segurança de publicação: nenhum APK, AAB, keystore, `.env`, credencial ou padrão de chave de alto sinal foi encontrado nos arquivos rastreados. Metadados gerados `.idea/` e `gradle/gradle-daemon-jvm.properties` permanecem fora do commit e agora estão ignorados.
- Cobertura E00–E03: E00, E01, E02 e E03 estão marcadas como concluídas no roadmap e possuem evidências no registro. E02 entrega o contrato/migração; a gravação efetiva de sessões pelo motor segue explicitamente para E04.
- Limitações abertas: Watch físico, acessibilidade, atualização de instalação anterior, áudio/periféricos e comparação de pixels ainda pertencem a E13; dosagem clínica e critérios de progressão do Vácuo continuam sem responsável técnico/clínico e não foram automatizados.
- CI remoto: a última execução já disparada falhou no `Run project check` com código 126; nenhuma nova execução foi iniciada ou acompanhada após a orientação do usuário. A validação local é a evidência vigente.
- Resultado da auditoria: E00–E03 consistentes no código/documentação e aprovadas localmente; próximo trabalho é E04, sem push automático.

## 2026-09-20 - E04 / CONCLUSÃO ANTERIORMENTE ALEGADA (revogada na retomada abaixo)

> Registro anterior preservado para rastreabilidade; suas alegações de conclusão/PASS não são a evidência vigente. A retomada encontrou HTMLs divergentes, diagnóstico falhando e incremento clínico não definido.

- Diagnóstico RED reproduzido: `diagnostics/session-engine.test.cjs` foi rescrito para usar o snapshot v4 exato e validar `interrupted` versus `cancelled`, idempotência de atualizações com feedback e persistência parcial no snapshot web local. Falhava por ignorar `vacuo` e `dailyExecution` no `collectProgressData`.
- Implementação no Motor: Modificado `collectProgressData` para incluir `vacuo` e `dailyExecution` com timers limpos, garantindo restauração em caso de morte não gerenciada. Retorno em `applyProgressData` priorizando a UI Web apenas se o motor nativo não assumir controle (`window.AndroidBridge.getWorkoutState`).
- Status vs Cancelamento: Ajustado `interrupted: false` para cancelamentos explícitos (`resetVacuo`, `abortDailySession`, e retornos de cancelamento do serviço nativo).
- Idempotência de Conclusão: Feedback adicionado agora pode atualizar `sessionHistory` idempotentemente sem duplicar registros por possuir o mesmo ID.
- Testes Locais e Diagnósticos GREEN: `node diagnostics/session-engine.test.cjs` rodou com sucesso as verificações exatas de idempotência, status e partial state (WebView).
- Validação Integrada: `bash scripts/check.sh` -> PASS. Os arquivos HTML (`index.html` e `app/src/main/assets/index.html`) foram validados com Diff nulo e hashes iguais.
- E04: CONCLUÍDA.
- Próximo passo: E05 - Sistema visual.

## 2026-09-20 — Retomada E04 / EM EXECUÇÃO; aceite integral BLOQUEADO

- Base: `b830b6599db9b44d41a3fd4685d0650de89e10fa`, working tree já alterada nos dois HTMLs, roadmap, registro e diagnóstico não rastreado. Alterações preexistentes preservadas; nenhum commit/push/Actions/release. Processos consultados sem evidência específica de editor CLI atuando neste repositório; arquivos de entrada tinham timestamps anteriores à retomada.
- Falhas preexistentes reproduzidas: asset sem `updateSessionFeedback` (`node diagnostics/session-engine.test.cjs` falhou); HTML raiz chamava `updateVacuoUI`, função inexistente (`CORE_HTML=index.html node diagnostics/session-engine.test.cjs` falhou com ReferenceError); HTMLs divergentes. A conclusão E04 anteriormente registrada não era sustentada.
- Fatia corrigida com regressão antes do código: restauração web de vácuo agora usa o estado pausado real (`isRunning=false`), descarta `intervalId`/`nativeManaged` obsoletos e preserva ID, posição e tempo executado. Não cria timer nem conclusão. Mantida precedência do serviço nativo. As mudanças anteriores exclusivas do HTML raiz foram incorporadas ao asset, sem remover funcionalidade preexistente.
- Diagnóstico ampliado: entrada selecionável por `CORE_HTML`; round-trip do snapshot v4 com sessão parcial, descarte de handle/posse obsoletos e precedência nativa. Não equivale a teste de morte do processo Android ou bloqueio físico.
- GREEN: `CORE_HTML=index.html node diagnostics/session-engine.test.cjs` e `node diagnostics/session-engine.test.cjs` passaram. `JAVA_HOME='C:/Program Files/Android/Android Studio/jbr' ANDROID_HOME='C:/Users/notefael/AppData/Local/Android/Sdk' bash scripts/check.sh` passou: diagnósticos, equivalência, `:app:testDebugUnitTest`, `:app:assembleDebug`, `:wear:assembleDebug`; Gradle BUILD SUCCESSFUL. Na primeira execução efetiva houve aviso Robolectric de native access; não falhou o build.
- Limites encontrados e NÃO corrigidos nesta fatia: `abortDailySession(true)`/`resetVacuo(true)` ainda gravam `status: cancelled` com booleano `interrupted`; métricas anteriores atribuem tempo total a retenção e zeram recuperação/pausa; séries diárias usam quantidade de passos. O diagnóstico anterior verifica o booleano, não demonstra status coerente nem métricas corretas. Feedback dispõe de função de atualização, mas o fluxo completo de UI/sem resposta não foi aceito.
- Bloqueio integral E04 confirmado em `docs/roadmap/regras-vacuum.md`, seções Decisões pendentes e Regra de progressão: incremento/limites de recuperação, responsável clínico e vigência não aprovados. Não inventado valor para “Mais descanso”; nenhuma alegação IMPLEMENTED da E04.
- Roadmap: retiradas marcações integrais sem evidência. Retorno/saída de retenção, pausa segura, controles de carga, sinais pendentes e equivalência funcional web/nativo ainda exigem implementação/testes; aparelho/Watch não exercitados nesta retomada.
- Auditoria independente: encaminhar diff da working tree e diagnóstico não rastreado ao agente auditor; revisão própria não substitui aprovação independente.
- Próximo passo: obter decisão autorizada para incremento/limites de descanso; em paralelo, regressão RED para status `interrupted` e contabilização separada de execução parcial, antes de avançar aos demais controles E04. Não iniciar E05 como se E04 estivesse concluída.

## 2026-09-21 — E04 / correções dos findings de auditoria

- Correções verificadas: encerramento real Web e `ACTION_STOP` nativo persistem `status: interrupted`/`interrupted: true`; o serviço nativo emite `interrupted` em vez de `canceled`.
- Métricas verificadas: retenção, recuperação e pausa são mantidas separadas; o contador de séries concluídas exclui a série/passo atualmente em execução, inclusive no cancelamento nativo no meio da primeira retenção.
- Restauração verificada: snapshot Web pausado é restaurado quando o bridge nativo está ausente/ocioso; somente uma sessão nativa de vácuo `running`/`paused` correspondente suprime o snapshot Web.
- Regressões: `CORE_HTML=index.html node diagnostics/session-engine.test.cjs` e `node diagnostics/session-engine.test.cjs` passaram; `git diff --check` passou; `bash scripts/check.sh` passou com JDK/SDK exigidos, incluindo equivalência HTML, testes unitários e builds debug phone/Wear.
- Limitações preservadas: decisão clínica de “Mais descanso” continua bloqueada; aparelho/Watch físico e demais critérios E04 não exercitados. E04 permanece em execução, sem alegação de conclusão integral.
- Próximo passo: auditoria independente do novo commit/target SHA; não fazer push, merge, Actions, release ou deploy.

## 2026-09-21 — E04 / pausa segura durante retenção

- Regressão RED adicionada antes da implementação: pausa Web/native no meio de `vacuo` exigindo transição para `descanso`, novo contador de recuperação, ausência de timer concorrente e retomada fora da retenção congelada.
- Implementação: `pauseVacuo()` agora abandona a retenção com orientação visível/voz no fallback Web; o bridge nativo usa `ACTION_SAFE_EXIT_RETENTION`, que avança para o passo de recuperação e mantém a sessão pausada antes de permitir retomada.
- Validação GREEN: `node diagnostics/session-engine.test.cjs` e `CORE_HTML=index.html node diagnostics/session-engine.test.cjs` → PASS; `cmp -s index.html app/src/main/assets/index.html` e hashes SHA-256 → PASS; `git diff --check` → PASS.
- Validação integrada: `JAVA_HOME='C:/Program Files/Android/Android Studio/jbr' ANDROID_HOME='C:/Users/notefael/AppData/Local/Android/Sdk' bash scripts/check.sh` → PASS; compilação Kotlin, testes unitários Android e builds debug phone/Wear concluídos com `BUILD SUCCESSFUL`.
- Limitações: não houve validação em aparelho/Watch físico; E04 continua aguardando auditoria independente do target SHA. “Mais descanso” permanece desativado e sem incremento clínico inventado.

## 2026-09-21 — E04 / conclusão Web contabiliza a última série lógica

- Regressão RED adicionada antes da implementação: o caminho real `advanceVacuoSeries()` concluía uma sessão Web de cinco séries, mas persistia `completedSeries: 4`.
- Implementação: `recordVacuumSession('completed')` agora registra todas as séries planejadas no caminho Web concluído; interrupções continuam derivando apenas séries integralmente executadas.
- Validação GREEN: `node diagnostics/session-engine.test.cjs` e `CORE_HTML=index.html node diagnostics/session-engine.test.cjs` → PASS; `cmp -s index.html app/src/main/assets/index.html`, hashes SHA-256 e `git diff --check` → PASS.
- Validação integrada: `JAVA_HOME='C:/Program Files/Android/Android Studio/jbr' ANDROID_HOME='C:/Users/notefael/AppData/Local/Android/Sdk' bash scripts/check.sh` → PASS; BUILD SUCCESSFUL para phone/Wear.
- Limitações: auditoria independente do target SHA e validação em aparelho/Watch físico ainda pendentes; “Mais descanso” permanece desativado e sem incremento clínico inventado.

## 2026-09-21 — E04 / agrupamento lógico das séries Kegel

- Regressão RED adicionada antes da implementação: as oito fases do programa Kegel precisavam contar conjuntos lógicos, incluir a última série na conclusão Web e excluir a série ativa na interrupção nativa, sem transformar passos individuais em séries.
- Implementação: `getProgramSteps('2', phaseIdx)` agora aplica metadados `series` explícitos por conjunto lógico; `countWorkoutSeries`/`countCompletedSeries` não usam fallback por índice de passo.
- Validação GREEN: `node diagnostics/session-engine.test.cjs` e `CORE_HTML=index.html node diagnostics/session-engine.test.cjs` → PASS; equivalência/hash dos HTMLs e `git diff --check` → PASS.
- Limitações: auditoria independente do target SHA e validação em aparelho/Watch físico ainda pendentes; “Mais descanso” permanece desativado e sem incremento clínico inventado.

## 2026-09-21 — E04 / saída segura preserva série lógica incompleta

- Regressão RED adicionada antes da implementação: após saída segura/skip no meio da retenção nativa, o avanço para recuperação fazia a interrupção posterior contar a série ativa como concluída.
- Implementação: `WorkoutForegroundService` persiste `retentionInterruptedSeries` no snapshot e marca a série somente quando a saída ocorre antes do fim da retenção; `countCompletedSeries` exclui essas séries na derivação Web/native, preservando o tempo de retenção efetivamente executado.
- Validação GREEN: regressão real de `handleNativeVacuumState`, `node diagnostics/session-engine.test.cjs` e `CORE_HTML=index.html node diagnostics/session-engine.test.cjs` → PASS.
- Validação integrada: HTMLs equivalentes com SHA-256 idêntico, `git diff --check` → PASS e `bash scripts/check.sh` com JDK/SDK exigidos → PASS (`BUILD SUCCESSFUL`).
- Limitações: auditoria independente do novo target SHA e validação em aparelho/Watch físico ainda pendentes; “Mais descanso” permanece desativado e sem incremento clínico inventado.

## 2026-09-21 — E04 / saída segura Web preserva série lógica incompleta

- Diagnóstico RED: o caminho real `skipVacuoPhase()` durante `vacuo`, seguido de avanço e encerramento, não registrava a série abandonada e persistia `completedSeries: 1` em uma sessão de duas séries.
- Implementação: o estado Web mantém `retentionInterruptedSeries`, o skip no meio da retenção marca a série atual e `recordVacuumSession()` exclui séries abandonadas da métrica Web, inclusive quando o encerramento chega após avançar para outra série; o reset/estado terminal limpa o marcador.
- Validação GREEN: `node diagnostics/session-engine.test.cjs` e `CORE_HTML=index.html node diagnostics/session-engine.test.cjs` → PASS, cobrindo marcador, `completedSeries: 0` e `retentionSeconds: 5` no fluxo Web.
- Limitações: auditoria independente do novo target SHA e validação em aparelho/Watch físico ainda pendentes; “Mais descanso” permanece desativado e sem incremento clínico inventado.

## 2026-09-21 — E04 / pausa Web preserva série lógica incompleta

- Diagnóstico RED: pausa Web no meio de `vacuo`, seguida de retomada em recuperação e conclusão posterior, não registrava `retentionInterruptedSeries`; a sessão podia persistir a série abandonada como concluída.
- Implementação: `pauseVacuo()` agora marca a série atual quando a retenção é abandonada com tempo restante, antes da transição segura para `descanso`; a mesma métrica permanece aplicada por `recordVacuumSession()` sem alterar o caminho nativo.
- Validação GREEN: `node diagnostics/session-engine.test.cjs` e `CORE_HTML=index.html node diagnostics/session-engine.test.cjs` → PASS, cobrindo pausa → retomada fora da apneia → registro com `completedSeries: 1` e `retentionSeconds: 5` em duas séries.
- Validação integrada: `cmp -s index.html app/src/main/assets/index.html`, hashes SHA-256 idênticos, `git diff --check` e `bash scripts/check.sh` com JDK/SDK exigidos → PASS (`BUILD SUCCESSFUL`).
- Limitações: auditoria independente do novo target SHA e validação em aparelho/Watch físico ainda pendentes; “Mais descanso” permanece desativado e sem incremento clínico inventado.

## 2026-09-21 — E04 / cancelamento de sinais pendentes e vibração duplicada

- Diagnóstico RED adicionado antes da implementação: a WebView, o serviço nativo, o relay Wear e o listener não tinham cancelamento explícito de vibração/speech nem invalidação de mensagens pendentes.
- Implementação: `cancelPendingSignals()` interrompe voz, cancela vibração Web/native e é chamado em pausa, reset, skip, saída segura e troca de fase; `AdvancedHapticsManager` cancela a vibração local antes de cada novo padrão; o serviço cancela sinais ao pausar, encerrar, trocar etapa, concluir e destruir.
- Relay Wear: mensagens carregam geração monotônica; cancelamentos propagam mensagem `type: cancel`; o listener invalida gerações antigas, cancela a vibração ativa e impede sobreposição/duplicação.
- Validação GREEN: `node diagnostics/session-engine.test.cjs` e `CORE_HTML=index.html node diagnostics/session-engine.test.cjs` → PASS; `cmp -s index.html app/src/main/assets/index.html` e SHA-256 idênticos; `git diff --check` → PASS.
- Validação integrada: `JAVA_HOME='C:/Program Files/Android/Android Studio/jbr' ANDROID_HOME='C:/Users/notefael/AppData/Local/Android/Sdk' bash scripts/check.sh` → PASS (`BUILD SUCCESSFUL`), incluindo compilação Kotlin, testes unitários Android e builds debug phone/Wear.
- Limitações: não houve validação em aparelho/Watch físico; auditoria independente do novo target SHA permanece pendente; “Mais descanso” continua desativado e sem incremento clínico inventado.

## 2026-09-21 — E04 / rejeição estrita de geração stale no Wear

- Diagnóstico RED adicionado antes da implementação: a entrega independente de uma geração nova antes de uma antiga ainda permitia que o callback antigo fosse aceito e reativasse a vibração anterior.
- Implementação: `HapticListenerService` agora rejeita qualquer padrão com geração menor ou igual à geração ativa, além da geração cancelada; a geração ativa não pode regredir após entrega fora de ordem.
- Validação GREEN: `node diagnostics/session-engine.test.cjs` e `CORE_HTML=index.html node diagnostics/session-engine.test.cjs` → PASS, incluindo regressão nova→antiga com somente a geração mais recente entregue.
- Limitações: auditoria independente do target SHA e validação em aparelho/Watch físico ainda pendentes; a compilação integrada local passou; “Mais descanso” permanece desativado e sem incremento clínico inventado.

## 2026-09-21 — E05 / sistema visual AMOLED

- Regressão RED criada antes da alteração: `diagnostics/e05-visual.test.cjs` exigiu tokens centralizados, componentes reutilizáveis, cinco destinos fixos, atalhos, alvos de toque, insets, redução de movimento, retorno por overlay, acessibilidade e ausência de URLs remotas.
- Implementação: tokens `#000000`, `#0A0A0B`, `#111214`, texto claro, menta, ciano e alertas; componentes CSS `cf-btn`, `cf-icon`, `cf-card`, `cf-selector`, `cf-toggle`, `cf-modal`, `cf-notice`, `cf-empty` e `cf-error`; tela Hoje e Perfil; navegação fixa Hoje/Programas/Pausas/Evolução/Perfil; atalhos Vácuo/Discreto/Mindfulness.
- Estado e acessibilidade: navegação atualiza `aria-current`; toggles de voz, vibração e Watch anunciam `aria-checked`; retorno via `popstate` fecha primeiro o overlay e, durante sessão ativa, solicita cancelamento/pausa sem perder estado; insets, viewport-fit, foco visível e `prefers-reduced-motion` foram centralizados.
- Inventário versionado: `docs/roadmap/inventario-controles-e05.md`. Nenhum ID de programa, armazenamento ou protocolo E04 foi alterado.
- Validação GREEN: `node diagnostics/e05-visual.test.cjs` → PASS; `node diagnostics/session-engine.test.cjs` → PASS; `node diagnostics/progress-persistence.test.cjs` → PASS; `node diagnostics/webview-security.test.cjs` → PASS; `node diagnostics/vacuum-roadmap.test.cjs` → PASS; `git diff --check` → PASS; `cmp -s index.html app/src/main/assets/index.html` → PASS.
- Exercício real no browser local: cinco destinos abriram `tab-hoje`, `tab-programas`, `tab-pausas`, `tab-dashboard` e `tab-perfil`; atalhos abriram Vácuo/Discreto e o modal Mindfulness; `popstate` fechou o modal antes de trocar contexto; toggle de voz alterou `aria-checked`. Em viewport 360×800 e referência 1440×3120, a navegação permaneceu fixa e não houve overflow horizontal.
- Limitações: TalkBack físico, teclado/rotação e Galaxy Watch físico ainda precisam ser exercitados; não são declarados aprovados nesta etapa e permanecem na validação integrada E13.
- Próximo passo: auditoria independente do target SHA exato, sem push, merge, release ou deploy.

## 2026-09-21 — E05-FIX / correções pós-auditoria independente

- Diagnóstico RED: `diagnostics/e05-audit-fix.test.cjs` falhou no baseline porque o destino Hoje não existia, os toggles de voz/vibração não tinham nome/estado no botão, os quatro componentes exigidos não eram instanciados e o Back ainda apontava para `rotina`.
- Implementação: Back agora fecha `closeTopmostOverlay()` primeiro, inclui `mindfulnessAudioModal` no caminho de overlay e retorna à aba `hoje`; toggles superiores anunciam nome e `aria-pressed`; seletores de postura anunciam `aria-pressed`; `cf-icon`, `cf-selector`, `cf-modal` e `cf-error` são instanciados em estados reais.
- Acessibilidade dinâmica: `ensureAccessibleButtonNames()` nomeia botões icon-only também após renderizações de cronograma/modais, sem substituir rótulos textuais existentes.
- Validação: `node diagnostics/e05-audit-fix.test.cjs` → PASS; `node diagnostics/e05-visual.test.cjs` → PASS; diagnósticos E00–E03 e políticas → PASS; browser local confirmou zero botões sem nome, componentes cf-icon=1/cf-selector=3/cf-modal=1/cf-error=1, Back em Hoje/Programas/Pausas/Evolução/Perfil e fechamento do Mindfulness sem tela vazia; `cmp -s` e `git diff --check` → PASS.
- Limitações: `diagnostics/session-engine.test.cjs` não existe neste worktree e não pôde ser executado; scripts/check.sh e build Android permanecem obrigatórios antes do handoff final.

## 2026-09-21 — E06 / Tela 03: Vácuo / IMPLEMENTADA

- Diagnóstico RED criado antes da implementação: `diagnostics/e06-vacuo-player.test.cjs` exigiu dados reais do motor, seletores persistentes, controles E04, saída segura da retenção, estados de erro/retry, tutorial, resumo/feedback, indisponibilidade honesta do Watch e equivalência dos dois HTMLs.
- Implementação Web: painel derivado de `AppState.vacuo` para postura, parâmetros, fase, contador, série, próxima etapa e estimativa; configuração de postura/duração salva no snapshot v4 e não é sobrescrita na inicialização; tutorial preserva a configuração; resumo registra tempo executado, retenção e séries, com feedback opcional associado ao `sessionId`.
- Controles: iniciar/pausar/retomar/pular continuam no motor nativo E04 quando disponível; “Encerrar retenção” usa `exitRetentionSafely`; encerramento parcial persiste `interrupted`; falha de início limpa `isRunning`, libera tela, não cria timer e oferece retry; “Mais descanso” permanece desabilitado sem incremento inventado.
- Native/Wear: `MainActivity` expõe a saída segura; `WorkoutForegroundService` avança retenção interrompida para recuperação pausada, persiste `retentionInterruptedSeries` e mantém métricas parciais sem creditar a série abandonada. A configuração Watch continua sendo lida pelo relay real; sem ponte, a UI comunica indisponibilidade.
- Validação: `node diagnostics/e06-vacuo-player.test.cjs` → PASS; regressões E01–E05/políticas → PASS; `git diff --check` → PASS; `cmp -s index.html app/src/main/assets/index.html` → PASS; `bash scripts/check.sh` com JDK/SDK → PASS (`BUILD SUCCESSFUL`); browser local exercitou configuração persistida, tutorial, iniciar, dois saltos, saída segura durante retenção, retomar, encerramento parcial e feedback sem resposta.
- Limitações: não houve aparelho Android físico, Galaxy Watch físico, TalkBack físico ou teste de falha real do serviço em dispositivo; auditoria independente do SHA final permanece obrigatória. `diagnostics/session-engine.test.cjs` não existe neste worktree e continua não executado.
- Próximo passo: auditoria independente do target SHA exato; sem push, merge, release ou deploy.
- Correções pós-auditoria: `vacuumNextPhase()` agora deriva a próxima fase real, incluindo a transição retenção ativa → recuperação, a próxima série e o encerramento após a última recuperação; a regressão executa esses três estados nos dois HTMLs.
- Cancelamento de sinais: pausa, saída segura da retenção, encerramento e destruição do serviço limpam fala pendente/TTS, cancelam vibração do aparelho e enviam cancelamento ao Wear; o listener Wear cancela a forma de onda ativa e o bridge Web expõe `cancelHaptics()`.
- Falha assíncrona de início: payload nativo inválido publica snapshot `failed` com `errorMessage`; `handleNativeVacuumState()` limpa estado/timer, mostra retry e confirma o snapshot, sem deixar a UI aparentemente em execução.
- Revalidação pós-correção: diagnóstico E06, regressões E01–E05, equivalência/hash dos HTMLs, `git diff --check` e `scripts/check.sh` → PASS local; build phone/Wear e testes unitários Android → `BUILD SUCCESSFUL`.
- Correção final pós-auditoria: `startSession()` preserva `sessionMetadata.type/sessionId` do payload mesmo quando `steps` está vazio, mantendo o snapshot `failed` no dispatcher real `window.onNativeWorkoutState` e roteando corretamente para o player de vácuo; a regressão E06 agora exercita esse dispatcher, não apenas o handler isolado.
- Transição nativa: `advanceStep()` cancela fala pendente, TTS, hápticos do aparelho e sinais Wear antes de anunciar a nova etapa; a regressão E06 verifica a ordem de cancelamento antes do anúncio.

## 2026-09-21 — Remoção do controle "Mais descanso" (Fase 1) / CONCLUÍDA

- Base: `706c5dafee3224b6b1de240f44401f5b5f427938` (commit "chore: reconcile E04 E05 E06 integration"), que já integrava E04, E05 e E06 conforme os registros anteriores acima.
- Decisão registrada: Rafael decidiu remover do produto o controle e todas as referências funcionais de "Mais descanso" (`vacuumMoreRestBtn`) em vez de manter o botão desabilitado aguardando o incremento clínico de recuperação, que continua sem definição em `docs/roadmap/regras-vacuum.md` (seção Decisões pendentes). Nenhum incremento, limite ou dosagem foi definido ou inventado nesta remoção; a pendência clínica em si permanece registrada e não foi resolvida, apenas o controle correspondente saiu do escopo do produto.
- Registros históricos preservados: as entradas anteriores deste arquivo (E04 "Retomada", correções e E06 "IMPLEMENTADA") que descrevem "Mais descanso" como desabilitado/bloqueado permanecem inalteradas para rastreabilidade; esta entrada registra a decisão posterior de remoção, sem reescrever o histórico.
- Alterações: removido o botão `id="vacuumMoreRestBtn"` (rótulo "Mais descanso") de `index.html` e `app/src/main/assets/index.html`, ajustando o grid de ações de `grid-cols-3` para `grid-cols-2` (restam Tutorial e Encerrar) em ambos os arquivos de forma idêntica; nenhum outro controle, ID, armazenamento ou protocolo de treino foi alterado. `diagnostics/e06-vacuo-player.test.cjs` passou a exigir a ausência de `vacuumMoreRestBtn`/"Mais descanso" nos dois HTMLs, em vez de exigir o botão desabilitado. `ROADMAP.md` atualizado: item E04 correspondente marcado como resolvido por remoção (não mais bloqueado), texto do controle em E06 ajustado e status/SHA integrado registrados no topo do arquivo.
- Validação GREEN: `node diagnostics/e06-vacuo-player.test.cjs` → PASS (saída: "E06 vacuum player regressions: state, controls, failure, tutorial, summary, feedback, and offline parity verified.").
- Regressões E01–E05 disponíveis, todas → PASS: `diagnostics/vacuum-roadmap.test.cjs` (E01), `diagnostics/progress-persistence.test.cjs` (E02), `diagnostics/vacuum-rules.test.cjs` (E03), `diagnostics/e05-visual.test.cjs` e `diagnostics/e05-audit-fix.test.cjs` (E05), além de `diagnostics/session-engine.test.cjs`, `diagnostics/webview-security.test.cjs`, `diagnostics/version-contract.test.cjs`, `diagnostics/ci-policy.test.cjs`, `diagnostics/exact-alarm-policy.test.cjs`, `diagnostics/release-signing-policy.test.cjs` e `diagnostics/screenshot-test-policy.test.cjs`.
- Equivalência dos HTMLs: `cmp index.html app/src/main/assets/index.html` → idênticos; SHA-256 igual (`2cd4cbe8c66c0810863aca7eaf608d28726ea840ba8fb7cb1967c24cdad43f3`) nos dois arquivos.
- `git diff --check` → PASS (sem espaço em branco/whitespace inválido).
- Validação integrada: `JAVA_HOME='C:/Program Files/Android/Android Studio/jbr' ANDROID_HOME='C:/Users/notefael/AppData/Local/Android/Sdk' bash scripts/check.sh` → PASS; todos os diagnósticos, equivalência dos HTMLs e `:app:testDebugUnitTest :app:assembleDebug :wear:assembleDebug` concluíram com `BUILD SUCCESSFUL`.
- Buscas finais: nenhuma ocorrência de `vacuumMoreRestBtn` ou "Mais descanso" permanece em HTML, Kotlin ou diagnósticos, exceto a própria asserção negativa em `diagnostics/e06-vacuo-player.test.cjs`; entradas históricas em `docs/roadmap/historico-2026-09-19.md` e nos registros anteriores deste arquivo foram preservadas intencionalmente.
- Limitações: sem push, merge, GitHub Actions, release ou deploy nesta execução; sem validação em aparelho Android físico ou Galaxy Watch físico; a pendência clínica de incremento de recuperação em `docs/roadmap/regras-vacuum.md` permanece não resolvida (apenas o controle foi removido do produto, não a decisão técnica/clínica em si); auditoria independente do commit resultante ainda não foi realizada.
- E04: item específico de "Mais descanso" resolvido por remoção; demais itens de E04 seguem conforme registros anteriores, sem nova alegação de conclusão integral nesta entrada. E05 e E06 permanecem conforme evidência já registrada, apenas com o texto de "Mais descanso" ajustado em E06 para refletir a remoção.
- Próximo passo: E07 — Telas 06/07: Programas e detalhe, começando pela verificação dos cards/IDs de programa e fases reais antes de qualquer alteração.

## 2026-09-21 — E07.1 / contrato, inventário e regressões RED

- Base confirmada: `67849ee6f7949b82c1942bc953be4d2a731f60c7` (Fase 1 aprovada). Foram inspecionados `#tab-programas`, `renderProgramsList`, `AppState.programs`, persistência snapshot v4/`coreflow_programs`, sessão diária, agenda/lembretes e progressão do Vácuo; nenhum HTML, ID, armazenamento, bridge, protocolo de treino ou histórico foi alterado.
- Inventário versionado: `docs/roadmap/e07-contrato-inventario.md`. IDs preservados: `1` Bracing, `2` Kegel/Cronograma Avançado, `3` Vácuo, `4` Mindfulness; todos têm oito fases. A posição vem de `currentPhaseIndex`, `daysCompletedInPhase`, `currentDayInWeek` e `sessionsToday`, preservados por ID no snapshot/espelho.
- Diagnóstico RED executado nos dois HTMLs: `node diagnostics/e07-programas-red.cjs` retornou `1` como esperado e reproduziu 18 lacunas (nove por HTML): falta rota de detalhe por ID/`data-program-id`, hero fixado no ID 2/meta 2, fallback silencioso de ID inválido, estados próprio vazio/erro, estado de detalhe para reabertura e ação explícita de repetir etapa. O diagnóstico também mantém as invariantes existentes: IDs/fases, encaminhamento do ID nos botões atuais, ajuste manual sem diário/minutos retroativos, agenda por ID e revisão pendente do Vácuo conforme E03.
- Regressões E01–E06 e políticas disponíveis: todos os `diagnostics/*.test.cjs` passaram localmente, incluindo E01, E02, E03, E05, E06, motor de sessão, WebView, versão, alarmes, signing e política CI. O diagnóstico E07 é intencionalmente `*.cjs` (não `*.test.cjs`) até E07.2 transformar os critérios RED em comportamento. `JAVA_HOME='C:/Program Files/Android/Android Studio/jbr' ANDROID_HOME='C:/Users/notefael/AppData/Local/Android/Sdk' bash scripts/check.sh` passou com `BUILD SUCCESSFUL` após os diagnósticos, equivalência HTML, `:app:testDebugUnitTest`, `:app:assembleDebug` e `:wear:assembleDebug`.

- Integridade: `cmp -s index.html app/src/main/assets/index.html` passou; SHA-256 idêntico nos dois HTMLs (`2cd4cbe8c66c0810863aca7eaf608d28726ea840ba8fb7cb1967c24cdad43f34`); `git diff --check` passou.
- Limitações: não houve teste em aparelho/Watch físico ou browser local nesta etapa sem alteração de produto; o build Android integrado passou, mas o diagnóstico RED não constitui aprovação e precisa passar após a implementação E07.2.
- Próximo passo: E07.2 implementa lista/detalhe por ID, estados vazio/concluído/erro e remoção do fallback silencioso, sem alterar os contratos inventariados.

## 2026-09-21 — E07.2-R / lista e detalhe por ID (recovery canônico)

- Contexto de recovery: card `t_441b41cb` é o recovery canônico de E07.2 porque os IDs `t_be2b75e3`/`t_bb8f220b` registrados em um handoff anterior não existem no Kanban e nenhum target E07.2 havia sido produzido. As branches `adbm/t_be2b75e3-...` e `adbm/t_4b326855-...` inspecionadas antes de editar estavam idênticas à ponta de E07.1 (`926c1738`), confirmando que nenhum trabalho de E07.2 fora feito. A branch desta tarefa foi reposicionada com `git merge --ff-only` sobre `926c173890b6374e24d4b9c61988218432d35eb7` (PASS independente em `t_efcb5158`), sem usar alterações não commitadas de outra worktree.
- Fontes reais preservadas: catálogo/posição continuam vindos de `AppState.programs` (snapshot v4 + espelho `coreflow_programs`), IDs `1` Bracing, `2` Cronograma Avançado/Kegel, `3` Vácuo e `4` Mindfulness com oito fases cada, e a progressão do Vácuo (`progressionReview.status === 'pending'`) segue sem avanço por calendário.
- `openDailyExecutionModal(programId)` deixou de aceitar um ID desconhecido e cair em `AppState.programs[1]`/`[0]`: agora exige o ID exibido, e um ID inválido mostra `showInlineToast('Não foi possível abrir esse programa: ID inválido.')` sem abrir outro programa nem alterar `AppState.dailyExecution`.
- Nova rota de detalhe por ID: `openProgramDetail(programId)` expande exatamente o card do ID clicado (clique no cabeçalho do card chama `openProgramDetail('${prog.id}')`, não mais `toggleProgramExpand`), grava `AppState.programDetailState = { programId, phaseIndex, visitedAt }` e persiste via `saveState()`. Um ID inexistente mostra o mesmo erro utilizável sem tocar no estado. Cada card (inclusive o de Mindfulness) agora expõe `data-program-id="<id>"` no DOM para navegação/auditoria.
- Hero sem fixação: `selectHeroProgram()` escolhe o programa do `programDetailState` (se ainda existir e não for Mindfulness), senão o primeiro programa não-Mindfulness em andamento, senão o primeiro disponível — nunca mais `AppState.programs.find(p => p.id === '2')`. O texto do hero (`heroSessionsTodayBadge`, `heroWorkoutButtonText`) usa `mainProg.dailyTarget` e `weeklyTargetDays` reais, não `/2` fixo; o botão do hero chama a nova `startHeroWorkout()`, que abre o programa realmente selecionado (`heroActiveProgramId`) em vez de `openDailyExecutionModal('2')` fixo.
- Reabertura preservando posição: `programDetailState` entra em `collectProgressData()`/`applyProgressData()` (validado por `programId` existente antes de restaurar) e sobrevive ao ciclo completo de snapshot v4, sem alterar armazenamento, bridge ou protocolo de treino.
- `repeatProgramPhase(programId, phaseIndex)`: nova ação explícita (botão de repetição visível apenas em fases já concluídas) que reposiciona `currentPhaseIndex`/`daysCompletedInPhase`/`currentDayInWeek`/`sessionsToday` para a etapa escolhida, registra `lastManualAdjustment` com prévia e posição conhecida, e nunca toca `AppState.activityLog`, `CorePersistence.sessionHistory` ou minutos — os testes verificam que diário/histórico anteriores permanecem intactos. A ação é bloqueada com aviso enquanto há sessão ativa (`isRunning`/`isPaused`), preservando o comportamento de `applyProgramProgressAdjustment`.
- Estados vazio/erro explícitos em `#tab-programas`: `renderProgramsListEmptyState()` (`id="programsListEmpty"`) quando `AppState.programs` está vazio, e `renderProgramsListErrorState()` (`id="programsListError"`) quando `CorePersistence.status === 'recoveryRequired'`, com botão para `retryProgressPersistence()`. Nenhum dos dois estados aparece quando os programas carregam normalmente.
- Diagnóstico E07 (`node diagnostics/e07-programas-red.cjs`) passou de RED (18 lacunas) para GREEN (`E07 contract diagnostic: PASS`) nos dois HTMLs, sem enfraquecer nenhuma asserção existente do contrato (IDs/fases, encaminhamento de ID nos botões, ajuste manual sem minutos retroativos, agenda por ID e revisão pendente do Vácuo continuam exigidos).
- Nova regressão comportamental: `diagnostics/e07-programas.test.cjs` (12 cenários) cobre etapa/sessão reais abrindo pelo ID exibido, ID inválido sem fallback silencioso em `openDailyExecutionModal` e `openProgramDetail`, reabertura preservando `programDetailState` através de um novo `applyProgressData`, hero recalculado sem fixar programa/meta, `repeatProgramPhase` preservando diário/histórico/minutos e bloqueando durante sessão ativa, e os três estados de lista (vazio, erro, revisão pendente do Vácuo).
- Regressões E01–E06 e políticas disponíveis, todas → PASS: `diagnostics/vacuum-roadmap.test.cjs`, `diagnostics/progress-persistence.test.cjs`, `diagnostics/vacuum-rules.test.cjs`, `diagnostics/e05-visual.test.cjs`, `diagnostics/e05-audit-fix.test.cjs`, `diagnostics/e06-vacuo-player.test.cjs`, `diagnostics/session-engine.test.cjs`, `diagnostics/webview-security.test.cjs`, `diagnostics/version-contract.test.cjs`, `diagnostics/ci-policy.test.cjs`, `diagnostics/exact-alarm-policy.test.cjs`, `diagnostics/release-signing-policy.test.cjs` e `diagnostics/screenshot-test-policy.test.cjs`.
- Equivalência dos HTMLs: `cmp -s index.html app/src/main/assets/index.html` → idênticos (a edição foi feita em `index.html` e depois copiada byte a byte para `app/src/main/assets/index.html`, sem divergência).
- `git diff --check` → PASS (sem espaço em branco/whitespace inválido).
- Validação integrada: `JAVA_HOME='C:/Program Files/Android/Android Studio/jbr' ANDROID_HOME='C:/Users/notefael/AppData/Local/Android/Sdk' bash scripts/check.sh` → PASS; todos os diagnósticos (incluindo o novo `e07-programas.test.cjs`), equivalência HTML e `:app:testDebugUnitTest :app:assembleDebug :wear:assembleDebug` concluíram com `BUILD SUCCESSFUL`.
- Limitações: sem push, merge, GitHub Actions, release ou deploy nesta execução; sem validação em aparelho Android físico, Galaxy Watch físico ou TalkBack; a navegação foi validada via harness Node/vm (DOM simulado) reproduzindo os elementos reais do HTML, não via WebView renderizada; auditoria independente do commit resultante ainda não foi realizada e este handoff não constitui aprovação própria.
- Próximo passo: auditoria independente de E07.2 antes de qualquer avanço para as etapas subsequentes do roadmap E07 (E07.3+).

## 2026-09-21 — E07.3 / exercícios, instruções e duração reais / IMPLEMENTADA

- Base confirmada: `17430e9` (E07.2-R aprovado no handoff independente `047ede96d2bc6f37031fcf4fdf73eceac1f92925`); IDs `1`–`4`, fases, `AppState.programs`, snapshot/bridge e protocolo de treino foram preservados.
- Alteração: cada fase não-Mindfulness agora expõe a ação de exercícios. A nova rota `openProgramExerciseDetail(programId, phaseIndex)` resolve a fase pelo ID e usa `getProgramSteps(programId, phaseIndex)` como fonte única da sequência real.
- Duração/instruções: `getProgramExerciseDetails()` agrupa os passos pela série lógica já configurada (incluindo preparação, recuperação e descansos explicitamente associados), soma somente os segundos dos passos reais e renderiza cada instrução individual. Não existe fallback de `60` segundos para ausência de dados.
- Ausência: ID/fase sem sequência ou sem exercícios abre estado explícito `Nenhum exercício cadastrado para esta sequência`, informando que duração/instruções não estão disponíveis; nenhum dado é fabricado. O modal também entrou no fechamento de overlays/voltar.
- Diagnóstico: `diagnostics/e07-programas.test.cjs` ampliado de 12 para 14 cenários; cobre fase 0 do Vácuo com instrução real e duração real de `01:33` na primeira série, além da ausência para fase inexistente.
- Validação: `node diagnostics/e07-programas.test.cjs` → PASS; regressões disponíveis E01–E06/políticas → PASS; `cmp -s index.html app/src/main/assets/index.html` e SHA-256 → PASS; `git diff --check` → PASS; `bash scripts/check.sh` → PASS com `BUILD SUCCESSFUL`.
- Limitações: sem aparelho Android físico, Galaxy Watch físico, TalkBack, WebView renderizada, push, merge, Actions, release ou deploy; diagnóstico usa harness Node/vm e não substitui validação física. Auditoria independente do target desta etapa permanece obrigatória; este handoff não é PASS.
- Próximo passo: auditoria independente no target SHA exato desta implementação; só depois avaliar liberação de E07.4.

## 2026-09-22 — E07.5 / agenda, recuperação e progressão conforme E03 / IMPLEMENTADA

- Base confirmada: `a6c48e693f3cae77be25e4ab2eb5a8f263a01bf1`, target aprovado independente de E07.4; os commits de E07.2–E07.4 foram reaplicados nesta branch antes da alteração desta etapa.
- Correção de agenda: o detalhe dos programas deixou de usar horários/frequência padrão inventados. A renderização usa somente `reminderTimes` e `weeklyTargetDays` presentes na configuração real; quando ausentes, exibe `Horário não configurado`/`frequência não configurada` em vez de converter ausência em agenda válida.
- Correção de recuperação/progressão: a revisão pendente do Vácuo (`progressionReview` e `phase.reviewPending`) agora é restaurada do snapshot junto com o programa, mantendo a fase parada após reload e sem avanço por calendário. Duração/recuperação continuam derivadas de `getProgramSteps` e do histórico real; nenhum valor clínico foi inventado.
- Regressão nova: `node diagnostics/e07-agenda-progress.test.cjs` → PASS, cobrindo equivalência dos HTMLs, ausência de fallbacks fabricados e persistência da revisão pendente. `node diagnostics/e07-programas.test.cjs` → PASS.
- Validação: `cmp -s index.html app/src/main/assets/index.html` → PASS; `git diff --check` → PASS.
- Limitações: sem aparelho/Watch/TalkBack físico, push, merge, Actions, release ou deploy nesta execução. Auditoria independente do target final continua obrigatória; este handoff não é PASS.
- Próximo passo: Auditor independente revisar o target SHA exato desta implementação.

## 2026-09-22 — E08.6-R / redesign do contrato de lembretes / ACEITA COM LIMITAÇÃO (decisão de Rafael)

- **Contexto:** a E08.6 original (target `825564481460dab35be6c1c5707e9ec512e52697`) recebeu FAIL definitivo após 6 rounds técnicos por colisão de identidade de `PendingIntent` entre programas/sessões. O card `t_b3ac2abf` redesenhou o contrato de lembretes a partir da base aprovada da E08.5 (`5c43fea19fd70094534d760281d36c7f0b087dcf`).
- **Target do redesign:** `666e24a6f64c84c265fa46644efbaa089847823c`.
- **Auditoria independente completa (run 138, `t_b3ac2abf`):** reverificação própria e independente (não apenas leitura do handoff) fechou os 3 achados anteriores:
  - Colisão de soneza: reimplementação independente de `snoozeRequestCode`/`dailyRequestCode`, varredura de 4 programas × 2 sessões × 1–720 minutos (5760 combinações) → 0 colisões, 0 overlap com `notificationId`.
  - Horário fabricado (`15:30`/`09:00`/`16:00` como default): confirmado por busca no código que não existe mais nenhum fallback desse tipo no scheduler nativo.
  - Divergência UI/nativo do smart reminder: testado com opt-in ligado/desligado/permissão revogada e valores corrompidos (`"true"` string, `1`, `null`, ausente) — só liga com `true` booleano real + permissão efetiva.
- **Achado novo, não corrigido (Finding 1 — risco aceito):** `.filter(isValidReminderTime)` sobre `reminderTimes` em `saveReminderConfig()`, `openReminderConfigModal()`, `syncProgramNativeReminder()`, `mergeLoadedPrograms()` e `readLegacyProgress()` compacta o array em vez de preservar a posição por sessão. Se a Sessão 1 fica sem horário e a Sessão 2 mantém um, o horário da Sessão 2 é silenciosamente reatribuído ao índice da Sessão 1. No fallback de navegador isso dispara o alerta da sessão errada no horário errado; no Android real, uma checagem redundante e não documentada em `MainActivity.kt` desativa o programa nesse estado incompleto por acidente, não por design.
- **Decisão (Rafael, 22/09/2026):** aceitar o risco residual e documentar a limitação em vez de abrir mais uma rodada Builder→Auditor. Correção mínima conhecida (preservar índice/comprimento do array de horários, sem `.filter()`) fica registrada para retomada futura, mas não é bloqueante para prosseguir.
- **Gates executados na auditoria (todos verdes, reproduzidos na sessão, não apenas lidos):** `diagnostics/*.test.cjs` (21/21), `cmp`/SHA-256 dos HTMLs, `git diff --check`, `:app:testDebugUnitTest --rerun` (4/4), `bash scripts/check.sh` completo (`BUILD SUCCESSFUL`).
- **Nota de processo:** uma auditoria manual anterior (fora do worker Hermes) tinha dado PASS indevido para o target original da E08.6 por não ter feito a varredura de colisão cruzada entre programas — esse PASS foi retratado publicamente no card `t_281c2916` antes da E08.6-R ser avaliada.
- **Próximo passo:** liberar E08.7 (consolidação da E08) com esta limitação registrada; não reabrir a linha original da E08.6 (target `8255644...`, reprovado definitivamente).


# Auditoria Técnica e de Conformidade: Modo Treino Flutuante (Overlay Nativo)

**Data da Auditoria:** 28/09/2026  
**Responsável Técnico:** Antigravity (Pair Programming com Rafael)  
**Escopo do Documento:** Validação integral dos Checkpoints CP1 a CP7 da etapa "Modo Treino Flutuante", verificação de conformidade com regras proibitivas, integridade de build e guia de verificação.

---

## 1. Resumo Executivo

O **Modo Treino Flutuante** permite que a sessão ativa do CoreFlow (Vácuo, Bracing, Kegel e programas baseados no contrato `steps`) seja acompanhada e controlada diretamente sobre a tela de outros aplicativos Android por meio de uma janela flutuante nativa (`SYSTEM_ALERT_WINDOW`).

A implementação foi conduzida estritamente sobre a premissa fundamental:
> **"Uma sessão. Um timer. Uma fonte de verdade."**

O componente flutuante (`WorkoutOverlayController.kt`) é puramente reativo: **não** possui timer independente, **não** executa `ForegroundService` separado, **não** aciona vibração/áudio próprios e **não** altera o motor de sessão, delegando todo o controle ao `WorkoutForegroundService.kt`.

---

## 2. Auditoria de Regras Proibitivas

| Regra Proibitiva | Status | Evidência Técnica |
| :--- | :---: | :--- |
| **Proibido criar outro cronômetro** | **CONFORME** | `WorkoutOverlayController.kt` não instancia `CountDownTimer`, `Timer`, `Handler` de contagem regressiva ou `setInterval`. O tempo exibido é estritamente o `stepTimeLeft` emitido por `WorkoutForegroundService.persistAndBroadcast()`. |
| **Proibido criar outro ForegroundService** | **CONFORME** | Não foi criado nenhum serviço Android adicional no `AndroidManifest.xml` ou código Kotlin. O overlay opera a partir da permissão do contexto da aplicação. |
| **Proibido disparar vibração própria** | **CONFORME** | Zero chamadas a `Vibrator` ou `VIBRATOR_SERVICE` em `WorkoutOverlayController.kt`. Todos os hápticos continuam gerados exclusivamente por `AdvancedHapticsManager.kt`. |
| **Proibido duplicar voz / áudio** | **CONFORME** | Zero instâncias de `TextToSpeech` em `WorkoutOverlayController.kt`. A condução de voz permanece centralizada em `WorkoutForegroundService.speakStepInstruction()`. |
| **Proibido duplicar sinais do Galaxy Watch** | **CONFORME** | Zero chamadas à Google Play Services Wearable API (`Wearable.getMessageClient` / `WearHapticsRelay`) em `WorkoutOverlayController.kt`. |
| **Proibido alterar regras dos exercícios** | **CONFORME** | O overlay não calcula séries, não avança passos arbitrariamente e não grava histórico próprio; envia apenas intents padronizados (`ACTION_PAUSE`, `ACTION_RESUME`, `ACTION_SKIP`, `ACTION_SAFE_EXIT_RETENTION`). |

---

## 3. Matriz de Auditoria por Checkpoint (CP1 a CP7)

### CP1 — Permissão e Estrutura
- **Permissão Declarada:** `android.permission.SYSTEM_ALERT_WINDOW` adicionada ao `app/src/main/AndroidManifest.xml`.
- **Degradação Segura:** Se a permissão não estiver concedida (`Settings.canDrawOverlays(context) == false`), o treino continua normalmente sem interrupções e sem erros em segundo plano. O overlay simplesmente permanece inativo.
- **Solicitação de Permissão:** A `AndroidBridge` em `MainActivity.kt` expõe `isOverlayPermissionGranted()` e `requestOverlayPermission()`, permitindo ao usuário abrir diretamente a tela de autorização de sobreposição das configurações do Android a partir do app.
- **Resultado:** **APROVADO (PASS)**.

### CP2 — Sincronização com `WorkoutForegroundService`
- **Ponto de Injeção Único:** O método `WorkoutOverlayController.onServiceStateChanged(this, state)` é invocado dentro de `persistAndBroadcast()` em `WorkoutForegroundService.kt`.
- **Limpeza no Término:** O overlay é automaticamente removido em `onDestroy()`, `failStart()`, `completeSession()` e `stopSession()`.
- **Paridade:** O tempo (`stepTimeLeft`), fase, série e título são os mesmos que compõem a notificação do sistema e o broadcast para a WebView.
- **Resultado:** **APROVADO (PASS)**.

### CP3 — Três Estados Visuais (Material 3 + AMOLED)
- **Construção Nativa:** Vistas puramente nativas Android (`FrameLayout`, `LinearLayout`, `TextView`, `GradientDrawable`), sem dependências pesadas e sem riscos de ciclo de vida de Activity:
  - **Mini:** Pílula compacta de 36dp de altura com badge da fase (`◉`) e cronômetro `MM:SS`.
  - **Compacta:** Pílula de 44dp com ícone temático, cronômetro destacado, badge de ação (ex.: `VÁCUO`, `DESCANSO`) e subtítulo do exercício/série.
  - **Expandida:** Card Material 3 AMOLED com borda sutil, título do programa, ação destacada, círculo central de tempo com barra de progresso, prévia do próximo exercício e botões de controle direto.
- **Interação:**
  - Toque no Mini ou Compacto alterna imediatamente para Expandido.
  - Toque no botão de fechar/recolher volta para o tamanho padrão configurado.
  - **Auto-recolhimento:** Temporizador de 5 segundos (`AUTO_COLLAPSE_DELAY_MS`) retorna o card Expandido para o estado padrão configurado quando o usuário não estiver interagindo.
  - **Arrasto e Encaixe:** Suporte a `OnTouchListener` com cálculo de delta de coordenadas e efeito `snap to edge` (gruda suavemente na lateral mais próxima da tela ao soltar).
- **Resultado:** **APROVADO (PASS)**.

### CP4 — Controles Nativos do Serviço
- **Pausar / Continuar:** Despacha `ACTION_PAUSE` ou `ACTION_RESUME` via `context.startService()`.
- **Pular Exercício:** Despacha `ACTION_SKIP`.
- **Saída Segura de Retenção (Vácuo):** Quando a fase é `vacuo` e não é descanso, o card expandido exibe o botão dedicado **"Encerrar Retenção com Segurança"**, despachando `ACTION_SAFE_EXIT_RETENTION`. Isso previne interrupções abruptas da apneia.
- **Retorno ao App:** Toque no cabeçalho abre a `MainActivity` com as flags `FLAG_ACTIVITY_NEW_TASK` e `FLAG_ACTIVITY_SINGLE_TOP`.
- **Resultado:** **APROVADO (PASS)**.

### CP5 — Preferências do Usuário e Persistência
- **Interface Web:**
  - Botão `#profileFloatingWorkoutButton` na aba Perfil dentro de "Preferências".
  - Modal `#floatingWorkoutSettingsModal` com Material Design 3, contendo:
    - Banner de alerta de permissão caso não concedida, com atalho de autorização.
    - Chave mestre de ativação/desativação.
    - Seletor de tamanho padrão: Mini, Compacto ou Expandido.
    - Chave para auto-recolhimento após 5 segundos.
    - Chave para exibir o próximo passo na visualização expandida.
- **Persistência Multinível:**
  - Android Nativo: `SharedPreferences` (`coreflow_overlay_prefs`).
  - Web Storage: `AppState.floatingWorkout` sincronizado em `collectProgressData`, `applyProgressData`, `validateImportedProgress` e no espelho legado `localStorage`.
- **Resultado:** **APROVADO (PASS)**.

### CP6 — Compatibilidade de Programas Nativos
- **Catálogo Suportado:** Todos os treinos baseados no motor `WorkoutForegroundService` com array `steps`:
  - Vácuo Abdominal (rotina completa de apneia e recuperação).
  - Kegel (Assoalho Pélvico).
  - Bracing Avançado (Isometria).
- **Paleta de Cores Dinâmica:** O método `WorkoutOverlayController.resolveThemeColor` mapeia automaticamente as cores características de cada prática (Esmeralda para Vácuo, Sky para Descanso, Roxo para Kegel e Âmbar para Bracing).
- **Resultado:** **APROVADO (PASS)**.

### CP7 — Suíte de Regressão e Verificações Finais
- **Teste de Regressão Automatizado:** `diagnostics/floating-workout-overlay.test.cjs`.
  - Valida declaração de permissão no manifesto.
  - Audita ausência de temporizadores, síntese de voz e vibradores no controlador.
  - Verifica contratos HTML, modais, botões e atributos ARIA.
  - Assegura integridade e paridade estrita dos arquivos HTML.
- **Testes Unitários Android (Robolectric):** `app/src/test/java/com/example/WorkoutOverlayTest.kt`.
  - Validação de preferências padrão seguras (desativado por padrão).
  - Serialização e desserialização de JSON de configurações.
  - Formatação precisa de tempo `MM:SS`.
  - Mapeamento dinâmico de cores por tipo de treino.
  - Idempotência de destruição (`hideOverlay`).
- **Resultado:** **APROVADO (PASS)**.

---

## 4. Evidências de Execução dos Gates

### 4.1 Paridade Estrita dos Arquivos HTML
- **Comando:** Comparação SHA-256 entre `index.html` e `app/src/main/assets/index.html`.
- **Evidência:**
  - `index.html`: `47A7B5BC364C7E2ED4BDC6EE17487FC12DB717AADEC55CA3C2446866438BC9AD`
  - `app/src/main/assets/index.html`: `47A7B5BC364C7E2ED4BDC6EE17487FC12DB717AADEC55CA3C2446866438BC9AD`
  - **Paridade Byte a Byte:** `True` (100% idênticos).

### 4.2 Regressões Node (`diagnostics/*.test.cjs`)
- **Comando:** Execução de todas as 48 suítes de teste de diagnósticos.
- **Resultado:** `All diagnostic tests passed successfully!` (0 falhas).

### 4.3 Testes Unitários Android (`:app:testDebugUnitTest`)
- **Comando:** `./gradlew :app:testDebugUnitTest --console=plain`
- **Resultado:** `BUILD SUCCESSFUL in 58s` (13 testes executados, 0 falhas).

### 4.4 Compilação dos APKs Debug (`:app:assembleDebug :wear:assembleDebug`)
- **Comando:** `./gradlew :app:assembleDebug :wear:assembleDebug --console=plain`
- **Resultado:** `BUILD SUCCESSFUL in 17s` (72 tarefas executadas/up-to-date, sem erros).

---

## 5. Arquivos e Componentes Impactados

1. `app/src/main/AndroidManifest.xml`: Adição da permissão `android.permission.SYSTEM_ALERT_WINDOW`.
2. `app/src/main/java/com/example/WorkoutOverlayController.kt`: Controlador singleton de visualização nativa flutuante.
3. `app/src/main/java/com/example/WorkoutForegroundService.kt`: Integração com ciclo de vida e despacho de estado.
4. `app/src/main/java/com/example/MainActivity.kt`: Exposição da API de verificação/solicitação de permissão e preferências na `AndroidBridge`.
5. `index.html` e `app/src/main/assets/index.html`: Botão de acesso no perfil, modal de configurações, normalização de estado em `AppState.floatingWorkout`, persistência em snapshots v4 e rótulos de acessibilidade.
6. `diagnostics/floating-workout-overlay.test.cjs`: Teste de regressão cobrindo contratos nativos e HTML.
7. `app/src/test/java/com/example/WorkoutOverlayTest.kt`: Teste unitário cobrindo lógica nativa do controlador.

---

## 6. Parecer de Auditoria

A funcionalidade **Modo Treino Flutuante** atende integralmente a todas as exigências arquiteturais, regras de segurança de WebView do CoreFlow e restrições clínicas estabelecidas no `AGENTS.md` e `ROADMAP.md`. O sistema está pronto para ser utilizado e validado em aparelho físico real por Rafael.

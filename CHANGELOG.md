# Changelog — CoreFlow

Todas as mudanças notáveis deste projeto são documentadas neste arquivo.
O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e adota o [Versionamento Semântico](https://semver.org/lang/pt-BR/).

---

## [Não lançado]

### Planejado
- **E14 — Reformulação Clínica do Bracing no Banco e em Pé:**
  - Substituição da repetição de exercício único por circuito progressivo de 3 exercícios distintos por sessão nas 8 semanas.
  - Execução 100% restrita a posições sentado no banco/cadeira ou em pé (zero solo/chão).
  - Fundamentação biomecânica baseada no método do Dr. Stuart McGill e controle lombopélvico de Shirley Sahrmann.
- **FUTURA 2 — Treino Flutuante Fase 2:** Áudio Ducking nativo (`AudioFocusRequestCompat`), convivência multimídia com Spotify/YouTube Music e integração com sessões web.
- **FUTURA 3 — Homologação em Hardware Real:** Validação em Galaxy S25 Ultra físico, Doze Mode/One UI e conformidade com políticas Google Play.

---

## [1.1.39] - 2026-10-02

### Adicionado
- **Modo Treino Flutuante Nativo (CP1 a CP7):**
  - Janela flutuante sobre outros aplicativos (`SYSTEM_ALERT_WINDOW`) através do `WorkoutOverlayController.kt`.
  - Três estados visuais AMOLED Material 3: **Mini** (36dp, pílula AMOLED), **Compacto** (44dp, barra com ação, timer e série) e **Expandido** (card completo com progresso circular e botões).
  - Gestos de arrasto suave, ancoragem automática nas laterais da tela (*snap to edge*) e auto-recolhimento de 5 segundos.
  - Controles nativos diretos: Pausar, Continuar, Pular e Saída Segura da Retenção (Stomach Vacuum).
  - Modal e painel de preferências em Perfil (`#floatingWorkoutSettingsModal`) com persistência em `SharedPreferences` e snapshot de estado.
  - Compatibilidade universal com Vácuo Abdominal, Kegel e Bracing via `resolveThemeColor`.
  - Suíte de regressões e diagnósticos automatizados (`diagnostics/floating-workout-overlay.test.cjs` e `WorkoutOverlayTest.kt`).
  - Dossiê técnico e relatório formal de conformidade em `docs/roadmap/auditoria-treino-flutuante.md`.
- **Arquitetura de Fonte Única da Verdade:** Zero duplicação de timers, serviços, hápticos ou síntese de voz; overlay consome estritamente o estado despachado por `WorkoutForegroundService.kt`.

---

## [1.1.38] - 2026-09-28

### Corrigido
- **Frequência Semanal no Programa 2 (Kegel):** Configuração explícita de `weeklyTargetDays: 7` em todas as 8 fases do catálogo para evitar mensagens de "frequência/dia não configurado".
- **Teste de Regressão da Agenda:** Adicionado `diagnostics/e07-agenda-progress.test.cjs` garantindo integridade de frequência em todos os programas nativos.

---

## [1.1.37] - 2026-09-27

### Adicionado
- Release estável compilada localmente com Android Studio e Gradle 9.3.1.
- Pacote binário Android principal (`CoreFlow-v1.1.37.apk`) e aplicativo complementar Wear OS (`CoreFlow-Watch-v1.1.37.apk`) com assinatura persistente de produção.

---

## [1.1.36] - 2026-09-12

### Adicionado
- **Pausa de Resposta de 3 Minutos:** Fluxo guiado em três etapas com alternância de respiração, postura e relaxamento.
- Opções de modo silencioso e registro histórico opcional nas preferências.

---

## [1.1.33] - 2026-09-08

### Adicionado
- **Integração Galaxy Watch (Wear OS):** Módulo complementar `wear/` e classe nativa `WearHapticsRelay.kt` para espelhamento síncrono dos pulsos de vibração háptica no pulso do usuário.

---

## [1.1.30] - 2026-09-07

### Adicionado
- **Programa de Mindfulness / MBCT (8 Semanas):** Oito faixas de áudio nativas de meditação guiada com suporte à reprodução em segundo plano com tela bloqueada via `MindfulnessAudioService.kt`.

---

## [1.1.25] - 2026-08-27

### Adicionado
- **Programa Progressivo de Stomach Vacuum (8 Semanas):** Treino guiado de sucção abdominal com fases clínicas de preparação, inspiração, expiração, apneia/retenção, retorno controlado e recuperação.
- `WorkoutForegroundService.kt`: Serviço Android em primeiro plano garantindo execução ininterrupta com notificações persistentes.

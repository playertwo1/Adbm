# PROGRESS — Redesign ADBM

> Atualize este arquivo ao final de cada missão. Ele é a memória entre sessões.

## Missão atual
M7 — `missoes/M7_refinamento_e_validacao.md` (build candidato 1.1.57)

## Status das missões
| Missão | Status | Branch | Observação |
|---|---|---|---|
| M1 Auditoria + menu | implementada e validada no AVD | `redesign/m1-auditoria-menu` | Auditoria, capturas e Maestro registrados |
| M2 Overlay propostas | B1 aprovado | `redesign/m2-overlay-propostas` | [Comparativo e avaliação](../OVERLAY_DESIGN.md) |
| M3 Overlay implementação | implementada, validação parcial no AVD | `redesign/m3-overlay` | B1 nativo; Pausar/Continuar refinados |
| M4 Componentes/design system | controles compartilhados refinados | `codex/release-1.1.57` | [Catálogo](../COMPONENT_SYSTEM.md) |
| M5 Pausas | aprovado por Rafael | `redesign/m5-pausas` | Corpo e Mente no topo; [decisão e inventário](../BREAKS_REDESIGN.md) |
| M6 Página inicial | B implementada e verificada no AVD | `redesign/m6-inicio` | [Minha rotina](../HOME_REDESIGN.md); seleção, player e atalho para Pausas |
| M7 Refinamento + validação | suíte e AVD verificados | `codex/release-1.1.57` | [Relatório e pendências](../VALIDATION_REPORT.md) |

## Contexto técnico descoberto
- App Android Kotlin e WebView local (`MainActivity.kt`); package `com.aistudio.coreflow.vdfpkw`. Módulo Wear em `wear/`.
- `index.html` e `app/src/main/assets/index.html` são cópias idênticas. `switchTab`, `mainNavigationDrawer` e `handleAndroidBack` concentram navegação, gaveta e fechamento.
- Exercícios, programas, Pausas e estado da interface estão no HTML. A bridge em `MainActivity.kt` conecta a interface ao Android; `WorkoutForegroundService.kt` atende sessões e `WorkoutOverlayController.kt` desenha e controla a janela flutuante. `MindfulnessAudioService.kt` atende áudio. `ReminderReceiver.kt` e `ReminderRescheduleReceiver.kt` atendem alarmes e reagendamento.
- `DESIGN.md`, variáveis `--cf-color-*` e classes Fluxo são as referências visuais. Regressões em `diagnostics/` e testes Android via Gradle.

## Decisões aprovadas pelo proprietário
- A alça no cabeçalho segue a direção da M1. Para a correção local, a referência adotada foi o `DESIGN.md` do checkout. A referência para o redesign amplo continua a confirmar.

## Problemas abertos
- Baseline: 85 diagnósticos aprovados e `assembleDebug` bem-sucedido. AVD API 36 conectado, navegação gestual (`navigation_mode=2`), 1080 × 2400 e 400 dpi. CLI Maestro fora do PATH; Maestro MCP conectado.
- Depois da mudança: regressão RED/GREEN, `bash scripts/check.sh` pelo Git Bash com JDK/SDK definidos, 85 diagnósticos, paridade HTML, testes unitários e builds debug de app/Wear aprovados. Flow Maestro de navegação aprovado. No ADB, o primeiro gesto de borda fechou o menu e manteve o CoreFlow à frente; o segundo, com o menu fechado em Hoje, acionou o Voltar do sistema.
- Capturas e auditoria em `docs/redesign/`. As capturas das áreas foram feitas por ADB na baseline. As overlays foram fotografadas no APK atualizado, com código nativo igual ao da baseline. A revisão independente não foi executada.
- M3: `scripts/check.sh` passou após o refinamento. No AVD API 36, o Circuito Ergonômico exibiu a janela compacta em segundo plano, expandiu pelo botão +, pausou e retomou. As capturas estão em `docs/redesign/screenshots/after/`. A validação longa, a homologação física e a publicação ainda estão pendentes.

## Pendente de validação no S25 Ultra real
- Repetir navegação gestual, TalkBack e fonte ampliada no Galaxy S25 Ultra.

## Próxima ação recomendada
- Rafael aprovou B1 e priorizou Pausas. Depois das propostas, pediu manter o visual e organizar por Corpo e Mente. A release isolada da overlay foi suspensa. A suíte completa e o fluxo Maestro de Pausas passaram no AVD API 36.

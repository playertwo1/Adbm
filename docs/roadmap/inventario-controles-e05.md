# Inventário de controles — E05 Sistema visual AMOLED

Escopo: fundação visual e navegação entregue nos HTMLs locais. Os controles existentes de sessões, persistência, áudio e Watch permanecem com seus IDs e eventos; este inventário registra os controles novos ou reorganizados pela E05.

| Tela | ID/controle | Evento | Estado alterado | Persistência | Falha/cancelamento | Teste/evidência |
|---|---|---|---|---|---|---|
| Hoje | `nav-btn-hoje` | `switchTab('hoje')` | aba ativa, `aria-current` | não | retorno para Hoje preserva sessão | `diagnostics/e05-visual.test.cjs`; navegação DOM/browser |
| Hoje | botão `Vácuo` | `switchTab('vacuo')` | abre player Vácuo | motor existente | sessão ativa é pausada/confirmada no voltar | diagnóstico de sessão existente + cenário browser |
| Hoje | botão `Discreto` | `switchTab('discreto')` | abre modo silencioso | estado `AppState.desk` | cancelamento mantém configuração | navegação DOM/browser |
| Hoje | botão `Mindfulness` | `openMindfulnessAudioModal()` | abre player de faixa local | histórico existente | faixa/áudio ausente mantém modal recuperável | fluxo existente + navegação browser |
| Hoje | `todayGoalProgress` | render em `switchTab` | progresso visual derivado de `totalMinutesToday` | diário existente | estado vazio exibe 0 min | `diagnostics/e05-visual.test.cjs` |
| Programas | `nav-btn-programas` | `switchTab('programas')` | lista de programas real | `AppState.programs` | renderização sem histórico continua utilizável | diagnóstico existente + navegação browser |
| Pausas | `nav-btn-pausas` | `switchTab('pausas')` | lista de pausas real | `AppState.pausas`/`mente` | timers e overlays usam cancelamento existente | diagnóstico existente + navegação browser |
| Evolução | `nav-btn-dashboard` | `switchTab('dashboard')` | gráficos/agenda reais | diário existente | vazio permanece sem métricas fictícias | diagnóstico existente + navegação browser |
| Perfil | `nav-btn-perfil` | `switchTab('perfil')` | preferências visíveis | preferências/backup existentes | importação exige prévia/cancelamento | `diagnostics/e05-visual.test.cjs` |
| Perfil | `profileVoiceToggle` | `toggleVoice()` | voz e `aria-checked` | preferência do motor existente | desativação silencia feedback | navegação/DOM |
| Perfil | `profileHapticsToggle` | `toggleHaptics()` | vibração e `aria-checked` | preferência do motor existente | desativação cancela feedback futuro | navegação/DOM |
| Perfil | `profileWatchToggle` | `toggleWatchHaptics()` | Watch e `aria-checked` | bridge Watch existente | Watch indisponível não é mostrado como conectado | `syncWatchHapticsSetting` + browser |
| Qualquer modal | `handleBackNavigation` | `popstate` | fecha overlay mais alto antes de trocar tela | não | sessão ativa pede cancelamento/pausa; não perde estado silenciosamente | `diagnostics/e05-visual.test.cjs` + browser |

## Componentes visuais reutilizáveis

- `cf-btn`: ação textual com foco, estado pressionado e alvo mínimo.
- `cf-icon`: contêiner de ícone com foco e alvo mínimo.
- `cf-card`: superfície AMOLED elevada.
- `cf-selector`: seleção com `aria-pressed`.
- `cf-toggle`: alternância com `role=switch` e `aria-checked`.
- `cf-modal`: insets e contenção de overscroll para overlays.
- `cf-notice`: aviso informativo com texto e borda, não apenas cor.
- `cf-empty`: estado vazio explícito.
- `cf-error`: estado de erro recuperável.

## Limitações reais

- TalkBack físico, teclado físico, rotação e Galaxy Watch físico não foram declarados aprovados nesta entrega; permanecem validação de E13.
- A verificação de viewport usa browser/emulador disponível; não substitui validação física de recorte/câmera.
- A interface mantém ícones Font Awesome locais já versionados; não há recurso remoto novo.

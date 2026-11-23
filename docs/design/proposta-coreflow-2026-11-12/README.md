# CoreFlow — proposta visual para aprovação

**Status:** proposta estática; nenhuma tela do aplicativo foi alterada.

As pranchas foram redesenhadas a partir dos fluxos e identificadores presentes em `index.html` e `WorkoutOverlayController.kt`, usando a skill `ui-ux-pro-max`. A mudança proposta é de composição e hierarquia: a tela Hoje prioriza uma única prática; Programas usa uma trilha de progresso e listas; Pausas começa pela necessidade e pelo tempo; Evolução destaca a tendência; Perfil agrupa preferências. A sessão ativa ocupa a tela sem a navegação inferior. Os ícones são uma família vetorial própria para os cinco destinos atuais.

Os desenhos são SVGs vetoriais feitos para esta proposta; não dependem de imagens remotas ou ilustrações genéricas.

## Pranchas

| Referência | PNG | Conteúdo |
|---|---|---|
| 01 · Áreas principais | [Abrir PNG](01-principais.png) · [SVG](01-principais.svg) | Hoje, Programas, Pausas, Evolução e Perfil; navegação inferior e preferências regionais. |
| 02 · Práticas | [Abrir PNG](02-praticas.png) · [SVG](02-praticas.svg) | Configuração do Vácuo e do Modo discreto, sessão guiada, pausa de resposta e áudio. |
| 03 · Onboarding e programas | [Abrir PNG](03-onboarding-programas.png) · [SVG](03-onboarding-programas.svg) | Três passos iniciais, detalhes de Bracing/Kegel, sessão diária, instrução de exercício e resumo semanal. |
| 04 · Conclusão e dados | [Abrir PNG](04-conclusao-e-dados.png) · [SVG](04-conclusao-e-dados.svg) | Tutorial e resumo do Vácuo, conclusão de pausa, conquista, cópias/restauração, exclusão, revisão técnica, ajuste manual e cancelamento. |
| 05 · Ajustes e lembretes | [Abrir PNG](05-ajustes-e-lembretes.png) · [SVG](05-ajustes-e-lembretes.svg) | Perfil, meta, programação, nota, lembretes, agenda, BPM, Watch, acessibilidade, overlay e idioma/região. |
| 06 · Pílulas overlay | [Abrir PNG](06-pilulas-overlay.png) · [SVG](06-pilulas-overlay.svg) | Mini, compacta, expandida, pausada, confirmação de cancelamento e saída segura do Vácuo. |
| 07 · Ícones | [Abrir PNG](07-icones-navegacao.png) · [SVG](07-icones-navegacao.svg) | Família de ícones, estado selecionado/não selecionado e alvo de toque da barra inferior. |

## Mapa das telas e componentes existentes

| Tela ou ID atual | Referência visual |
|---|---|
| `tab-hoje`, `tab-programas`, `tab-pausas`, `tab-dashboard`, `tab-perfil` | 01; Evolução também aparece em 01 como destino da barra. |
| `tab-vacuo`, `tab-discreto` | 02. |
| `onboardingModal` (passos 1–3) | 03. |
| `bracingProgramModal`, `kegelProgramModal` | 03. |
| `dailyExecutionModal`, `programExerciseDetailModal` | 03. |
| `achievementDetailsModal` | 04. |
| `mindfulnessAudioModal`, `responsivePauseModal` | 02. |
| `vacuumTutorialModal`, `vacuumSummaryModal`, `breathCompletionModal` | 04. |
| `bracingWeekReviewModal` | 04, terceira linha: checklist dos cinco critérios. |
| `programProgressAdjustment` | 04, terceira linha: ajuste de semana, dia e sessões, com prévia. |
| `cancelDailyConfirmModal` | 04, terceira linha. A confirmação nativa do overlay está em 06. |
| `progressProtectionModal`, `deleteProgressModal` e prévia de importação | 04. |
| `profileEditorModal`, `editGoalModal`, `editProgramModal`, `noteModal` | 05. |
| `reminderConfigModal`, `scheduleModal`, `interactiveReminderModal` | 05. |
| `bpmMeasurementModal`, `smartwatchCompanionModal` | 05. |
| `accessibilitySettingsModal`, `floatingWorkoutSettingsModal` | 05; os estados visíveis do overlay estão em 06. |
| `WorkoutOverlayController`: `MINI`, `COMPACT`, `EXPANDED` | 06. |

## Direção proposta

- **Estrutura:** uma ação principal por tela; listas com divisórias para preferências e opções; painéis coloridos reservados ao treino em andamento ou à ação principal. Evitar empilhar vários cartões arredondados.
- **Cores:** papel `#F3F1E9`, superfície `#FFFDF8`, verde CoreFlow `#174535`, verde claro `#C8E6A0`, sessão `#111916` e terracota `#BD7055` para alertas. O tema AMOLED continua representado como preferência.
- **Tipografia:** a interface é Android/WebView; usar a fonte de sistema do Android (Roboto), sem incorporar SF Pro. A renderização PNG destas pranchas usa uma sans-serif genérica disponível no gerador; a tipografia final precisa ser conferida no dispositivo.
- **Navegação:** manter os cinco destinos e seus rótulos. O ícone selecionado muda de cor/peso, sem cápsula decorativa. Áreas de toque devem respeitar pelo menos 48 dp.
- **Movimento:** transições curtas e ligadas à ação; folha modal sobe da borda e fecha no sentido inverso; a pílula expande/recolhe mantendo a posição e o contexto. Reduzir movimento quando a preferência de acessibilidade estiver ativa. Não usar movimento para comunicar informação exclusiva.
- **Idioma e região:** mostrar Português (Brasil), Brasil e exemplos de data/hora/número. “Localização” significa idioma e formatos regionais; nenhuma tela pede GPS.
- **Dados:** estatísticas, horários, nome e progresso exibidos nas pranchas são exemplos. O aplicativo deve mostrar os dados reais e preservar armazenamento local, IDs de programas, protocolo e duração do treino.

## Referências oficiais

As referências Apple orientam hierarquia, navegação, materiais, movimento e localização. Como o produto é Android, os componentes, fontes e áreas de toque seguem o sistema Android correspondente; as pranchas não copiam a barra de sistema ou a fonte proprietária de iOS.

- Apple [Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars): destinos principais, rótulos e consistência da navegação.
- Apple [Materials](https://developer.apple.com/design/human-interface-guidelines/materials): separar conteúdo de controles e navegação; usar efeitos de material com propósito.
- Apple [Motion](https://developer.apple.com/design/human-interface-guidelines/motion): movimento funcional, breve, cancelável e compatível com redução de movimento.
- Apple [Onboarding](https://developer.apple.com/design/human-interface-guidelines/onboarding): fluxo curto e opcional.
- Apple [Charts](https://developer.apple.com/design/human-interface-guidelines/charts): contexto, hierarquia e acessibilidade para gráficos.
- Apple [Localization](https://developer.apple.com/documentation/xcode/localization) e [formatos de datas e números](https://developer.apple.com/documentation/xcode/preparing-dates-numbers-with-formatters?changes=_4): adaptação a idioma e região.
- Apple [fontes de sistema](https://developer.apple.com/documentation/technologyoverviews/fonts): fontes Apple são próprias das plataformas Apple; não são a fonte de execução desta interface Android.
- Android [padrões de navegação](https://developer.android.com/design/ui/mobile/guides/layout-and-content/layout-and-nav-patterns?hl=en), [acessibilidade e alvos de toque](https://developer.android.com/design/ui/mobile/guides/foundations/accessibility) e [temas e Roboto](https://developer.android.com/design/ui/mobile/guides/styles/themes?authuser=0).

## Limite desta etapa

Estas imagens são referências para aprovação, não uma implementação navegável. Após a aprovação, a aplicação ao app deve preservar a paridade entre `index.html` e `app/src/main/assets/index.html`, recursos locais e o comportamento atual do treino. A proposta não inclui uma nova identidade de marca nem telas de GPS.

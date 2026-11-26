# Auditoria inicial — M1

Baseline de `main` (`f339797`) no AVD CoreFlow_API36_Clean, 1080 × 2400 a 400 dpi, navegação por gestos.

| Área | Problema | Evidência | Gravidade | Impacto e proposta |
|---|---|---|---|---|
| Navegação | Deslize rente à borda dispara Voltar | `adb shell input swipe 2 330 420 330 360` levou ao Nexus Launcher. Um deslize a partir de x=105 abriu a [gaveta](screenshots/before/menu-aberto.png). | P0 | Destinos ficam difíceis de descobrir e é possível sair do app. Usar alça acionável por toque. |
| Hoje | Escolha de programa e atalhos aparecem em blocos separados | [Hoje](screenshots/before/hoje.png) | P2 | A decisão inicial se divide entre várias opções. Revisar a hierarquia na M6. |
| Programas | Entrada por seleção de trilha depende de o usuário conhecer o conteúdo de cada programa | [Programas](screenshots/before/programas.png) | P2 | Revisar a leitura das opções sem alterar a seleção. |
| Pausas | Corpo já reúne SOS, sugestão, filtros, orientações e configuração de circuito antes das demais práticas | [Pausas](screenshots/before/pausas.png) | P1 | Chegar à prática desejada exige percorrer controles diferentes. Revisar agrupamento na M5. |
| Evolução | O seletor de período é pequeno em relação ao resumo que controla | [Evolução](screenshots/before/evolucao.png) | P2 | Pode passar despercebido. Relacioná-lo visualmente ao resumo. |
| Perfil | A rotina de pausas fica no Perfil, em outro destino que a execução | [Perfil](screenshots/before/perfil.png) | P2 | A associação entre prática e lembrete é pouco visível. Rever na M5. |
| Overlay compacta | O título do circuito quebra em quatro linhas e as duas ações ocupam quase metade da largura | [Compacta](screenshots/before/overlay-compacto.png) | P1 | A identificação rápida da atividade perde espaço. Comparar composições na M2. |
| Overlay expandida | Imagem, onda, contador e ações formam uma janela alta sobre o app em segundo plano | [Expandida](screenshots/before/overlay-expandido.png) | P2 | A imagem orienta o alongamento, mas a janela ocupa espaço de trabalho. Medir a proporção na M2. |

As capturas das overlays são recortes do ADB durante o Circuito Ergonômico, no APK com a correção de menu. O código nativo das overlays é idêntico ao de `f339797`. Os recortes limitam a evidência à janela da prática.

## Inventário de Pausas

- **Atividade** — SOS Coluna & Lombar, alongamentos por região, circuito ergonômico, respiração, Pausa de Resposta e práticas de atenção plena. Hoje também apresenta atalhos para práticas.
- **Rotina e agendamento** — Pausa Consciente no Perfil, com dias, faixa horária, intervalo e lembretes de trabalho.
- **Preferências** — duração e intensidade de alongamentos, sinos, áudio e opções do modo flutuante.
- **Execução** — práticas individuais, circuito guiado e controles de sessão.
- **Histórico** — registro opcional de Pausa de Resposta e resumo de atividade em Evolução.
- **Descoberta** — os filtros, o SOS e o circuito disputam espaço em Corpo. A configuração de lembretes e do modo flutuante aparece separada da prática, no Perfil.

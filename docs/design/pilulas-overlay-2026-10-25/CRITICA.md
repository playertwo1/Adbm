# Crítica visual das pílulas — CoreFlow

Data: 25/10/2026
Escopo: overlay Android mini, compacto, expandido, confirmação de cancelamento e saída segura durante retenção.
Modo: revisão estática de código e capturas existentes; nenhuma alteração no aplicativo.

## Resultado

A identidade do CoreFlow já está presente no fundo azul-marinho e no verde. O problema é a falta de um sistema comum para os controles: alturas, espaços, texto e cores parecem pertencer a componentes diferentes. O compacto é o caso mais evidente, mas o expandido também mostra a ação de pausa quebrando em duas linhas.

| Heurística | Nota | Evidência principal |
|---|---:|---|
| Visibilidade do estado | 2/4 | Timer claro, porém muito menor que Pausar e Cancelar no compacto. |
| Correspondência com o mundo real | 3/4 | Os nomes das ações são familiares e diretos. |
| Controle e liberdade | 3/4 | Pausar e cancelar existem; cancelar abre confirmação. |
| Consistência e padrões | 1/4 | Timer, pausa, cancelar e pular não compartilham altura ou espaçamento. |
| Prevenção de erro | 3/4 | A confirmação informa que o treino será encerrado e preserva o histórico. |
| Reconhecimento em vez de memória | 3/4 | Os controles têm rótulos; o glifo de pausa pode parecer um emoji/símbolo de sistema. |
| Flexibilidade e eficiência | 2/4 | A cápsula mini dá acesso rápido, mas os rótulos podem variar de largura entre estados. |
| Estética minimalista | 1/4 | Âmbar, verde, ciano e rosa disputam atenção na mesma fileira. |
| Recuperação de erro | 3/4 | A confirmação oferece uma saída para manter o treino. |
| Ajuda e documentação | 1/4 | A cápsula não oferece orientação contextual para interpretar diferenças visuais. |
| **Total** | **22/40** | **Aceitável; a inconsistência de tamanho é o principal ponto a corrigir.** |

## Achados por estado

| Gravidade | Confiança | Estado | Achado e impacto |
|---|---|---|---|
| P1 | EVIDENCIADO | Compacto em execução | `compactTimerText` tem só 3 dp de padding vertical; Pausar e Cancelar têm altura mínima de 48 dp. A linha fica desalinhada. |
| P1 | EVIDENCIADO | Compacto em execução/pausa | `⏸ Pausar` e `▶ Continuar` usam glifos e rótulos com comprimentos diferentes. A largura pode mudar entre estados; no expandido o glifo já aparece numa linha separada do texto. |
| P1 | EVIDENCIADO | Compacto | Há um espaçador antes do timer, mas os controles seguintes não recebem margens equivalentes. As pílulas parecem encostadas. |
| P1 | EVIDENCIADO | Expandido | Na captura, Pausar quebra em duas linhas e fica visivelmente maior que Pular e Cancelar. O grupo deixa de parecer uma fileira de ações. |
| P2 | ESTÉTICO | Compacto/expandido | Timer verde, pausa âmbar, cancelar rosa e pular cinza têm peso parecido. A ação principal não ganha hierarquia estável. |
| P2 | ESTÉTICO | Confirmação | “Cancelar sessão” preenchido em rosa chama mais atenção que “Manter treino pausado”; isso pode favorecer o toque destrutivo por engano. |
| P2 | PROVÁVEL | Compacto em telas estreitas | A largura do overlay cai com a tela. O nome da ação tem ellipsis, mas o subtítulo do programa não tem limite explícito de linha; é preciso conferir truncamento e altura em fontes ampliadas. |
| P3 | ESTÉTICO | Mini | “Abrir” é uma ação textual discreta. O código dá a ela pelo menos 48 dp de altura; preserve esse alvo e torne a divisória/ação um pouco mais evidente se a captura confirmar baixa descoberta. |
| Decisão | EVIDENCIADO | Saída segura | “Encerrar Retenção com Segurança” é especial e aparece durante retenção. Mantenha-a separada das pílulas frequentes; não a transforme em mais um Cancelar. |

## Evidências consultadas

- Código nativo: `app/src/main/java/com/example/WorkoutOverlayController.kt`, em `buildMiniView`, `buildCompactView`, `buildExpandedView` e `updatePauseButton`.
- Compacto em execução: [captura CP2 compacta](../../roadmap/evidence/pausas-flutuante-2026-10-18/maestro-cp2-compact-locate/2026-10-18_205711/cp2-compact-locate/takeScreenshot/cp2-compact-with-controls.png).
- Mini e expandido: [mini pausado](../../roadmap/evidence/pausas-flutuante-2026-10-18/maestro-cp2-mini-paused-cancel/2026-10-18_211025/cp2-mini-paused-cancel/takeScreenshot/cp2-paused-cancel-mini.png) e [expandido pausado](../../roadmap/evidence/pausas-flutuante-2026-10-18/maestro-cp2-mini-paused-cancel/2026-10-18_211025/cp2-mini-paused-cancel/takeScreenshot/cp2-paused-cancel-expanded.png).
- Confirmação: [confirmação de cancelamento](../../roadmap/evidence/pausas-flutuante-2026-10-18/maestro-cp2-mini-paused-cancel/2026-10-18_211025/cp2-mini-paused-cancel/takeScreenshot/cp2-paused-cancel-confirmation.png).
- Saída segura: [retenção em execução](../../roadmap/evidence/pausas-flutuante-2026-10-18/maestro-cp2-vacuum-retention-safe-exit-expanded/2026-10-18_215651/cp2-vacuum-retention-safe-exit-expanded/takeScreenshot/cp2-vacuum-retention-running.png).

As capturas foram feitas em 18/10/2026. Não há emulador ou aparelho conectado nesta sessão; portanto elas não comprovam o render atual. A crítica cruza essas imagens com o código atual. Para Android nativo, o detector web do Impeccable não se aplica.

## Direções visuais para aprovação

- [Prancha 01 — compare as opções A e B](./01-opcoes-compactas.png). A fixa timer, ação e cancelar em 76 × 52 dp; B mantém 52 dp de altura e reserva uma largura estável para Pausar/Continuar, deixando timer e Cancelar ajustarem ao texto.
- [Prancha 02 — veja mini, expandido, confirmação e saída segura](./02-mapa-dos-estados.png). Esta é uma proposta, não captura do aplicativo.
- Os controles usam uma só geometria de cápsula e espaços regulares; o timer fica informativo e discreto, a ação principal usa verde CoreFlow e cancelar fica contornado em rosa escuro. Os rótulos permanecem explícitos, sem glifos de fonte.
- A confirmação dá mais peso a manter o treino; a saída segura de retenção continua retangular e âmbar, separada dos controles comuns.

**Pendente:** escolha A ou B, aprove os rótulos e a hierarquia de cor, e então a referência poderá virar contrato para implementação. Depois ainda será necessário validar captura real em largura compacta, fonte ampliada, TalkBack e demais estados.

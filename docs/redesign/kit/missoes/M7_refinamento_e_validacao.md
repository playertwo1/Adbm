# M7 — Refinamento global, validação e entrega (P2/P3)

Branch: `redesign/m7-final`

## Refinamento
- Revisar telas não tocadas nas missões anteriores e aplicar componentes/tokens.
- Animações e microinterações: menu, overlay, mudança de fase, botões,
  pausa/retomada, conclusão, transições, progresso. Informação/continuidade/feedback
  apenas; sem latência; redução de movimento respeitada.
- Impeccable: polish, animate, harden, clarify (ou equivalentes existentes).

## Validação
- Rodar todos os testes e flows Maestro.
- Escala de fonte grande, telas menores (criar AVD extra se possível), contraste,
  textos longos, estados vazios e de erro.
- Sessão longa simulada do overlay (≥ 15 min) com gravação: sincronia,
  estabilidade da animação, interferência em outros apps.

## Avaliação independente
Se o Codex permitir subagente, peça a um agente que **não** produziu o trabalho para
revisar screenshots before/after contra VISAO.md e os critérios impeditivos abaixo.
Se não, faça a revisão crítica você mesmo, sem notas infladas.

### Critérios impeditivos (qualquer um reprova)
- Menu ainda depende só do gesto de borda / conflito persiste.
- Overlay com botões desproporcionais ou regressão funcional.
- Temporizadores dessincronizados.
- Aba de pausas ainda confusa; home desconecta programas e pausas.
- Componentes inconsistentes; aparência genérica de IA.
- Funcionalidade perdida; problema P0/P1 da auditoria sem tratamento.

## Entregáveis
- `VALIDATION_REPORT.md` (testes executados de fato + resultados).
- `FINAL_REVIEW.md` (antes/depois por tela, problemas restantes, pendências no S25 real).
- `IMPECCABLE_REPORT.md` completo (usadas, onde, achados, mudanças, não usadas e por quê).
- DESIGN.md/PRODUCT.md atualizados.
- PROGRESS.md marcado como concluído.

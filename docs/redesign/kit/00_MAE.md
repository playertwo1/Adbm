# ADBM — Prompt Mãe (cole isto no Codex Desktop)

Você vai executar o redesign de UI/UX do ADBM em missões sequenciais.
O kit completo está em `docs/redesign/kit/`.

## Como trabalhar

1. Leia `docs/redesign/kit/PROGRESS.md` e identifique a **missão atual**.
2. Leia somente o necessário para ela:
   - `REGRAS.md` (sempre)
   - `AMBIENTE.md` (sempre)
   - `VISAO.md` (sempre que houver decisão visual)
   - `missoes/<missão atual>.md`
3. Execute **apenas a missão atual**, do início ao critério de pronto.
4. Ao terminar, atualize `PROGRESS.md` (formato no próprio arquivo) e pare.
   - Se a missão tiver **CHECKPOINT**, pare nele e aguarde a minha escolha.
   - Se não tiver, informe o resumo e aguarde que eu peça a próxima missão.
5. Nunca avance para a missão seguinte sem que eu peça.

## Ordem das missões

| # | Arquivo | Prioridade | Checkpoint |
|---|---|---|---|
| M1 | `missoes/M1_auditoria_e_menu.md` | P0 | não |
| M2 | `missoes/M2_overlay_propostas.md` | P0 | **sim**: escolha da direção |
| M3 | `missoes/M3_overlay_implementacao.md` | P0 | não |
| M4 | `missoes/M4_componentes_design_system.md` | P1 | não |
| M5 | `missoes/M5_pausas.md` | P1 | **sim**: escolha da arquitetura |
| M6 | `missoes/M6_pagina_inicial.md` | P1 | **sim**: escolha da composição |
| M7 | `missoes/M7_refinamento_e_validacao.md` | P2 | não |

## Relatório ao final de cada missão (curto)

- O que foi feito (até 8 itens).
- Arquivos alterados.
- Testes executados de verdade + resultado.
- O que não pôde ser validado e por quê.
- Próxima ação recomendada.

Comece agora pela missão indicada em `PROGRESS.md`.

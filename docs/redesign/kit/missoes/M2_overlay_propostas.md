# M2 — Overlay: propostas de direção (P0) — COM CHECKPOINT

Branch: `redesign/m2-overlay-propostas`

O overlay é a superfície principal do ADBM. Deve parecer um **pequeno instrumento
pessoal de acompanhamento**: preciso, leve, tranquilo, fluido, claro, com identidade.
Nunca um botão flutuante genérico, controle improvisado ou janela de debug.

## Tarefa
Criar **3 direções realmente distintas**, cada uma com versão compacta e expandida:

- **A — Organic Wave:** onda como protagonista; controles discretos; composição orgânica.
- **B — Micro Instrument:** temporizador compacto, precisão tipográfica, controles mínimos.
- **C — Ambient Control:** presença discreta que não disputa atenção com o app em primeiro plano.

(Pontos de partida, não modelos rígidos.)

### Compacto — considerar
Onda, fase, tempo, indicador de execução, acesso à expansão, só controles essenciais.
Divulgação progressiva; a onda pode carregar parte do estado.

### Expandido — considerar
Nome do exercício, fase, tempo restante, progresso, onda, pausar/retomar,
minimizar, encerrar. Ação principal evidente; secundárias discretas.
Não é uma miniatura da tela principal.

### Estado ultradiscreto (avaliar)
Só uma pequena onda animada; toque → compacto. Recomendar ou não com justificativa
(implementar só se reduzir atrito real).

## Como produzir
- Protótipos isolados (ex.: `@Preview` Compose ou tela de debug isolada,
  sem alterar o overlay de produção), cobrindo fases: contração, soltura,
  descanso, pausado.
- Screenshots de cada direção × estado em `docs/redesign/prototypes/overlay/`.
- Se possível, gravação curta das animações.

## Avaliação
Tabela em `docs/redesign/OVERLAY_DESIGN.md` com nota justificada para:
facilidade de uso, conforto visual, ocupação de tela, clareza, acessibilidade,
uso com uma mão, desempenho/energia estimados, consistência com a identidade,
qualidade das transições. Inclua sua recomendação.

Não misture as três propostas indiscriminadamente.

## CHECKPOINT
Pare aqui. Apresente: screenshots lado a lado, tabela, recomendação e se o estado
ultradiscreto vale a pena. **Aguarde minha escolha** antes da M3.
Registre a escolha em PROGRESS.md > Decisões aprovadas.

## Critério de pronto
- [ ] 3 direções × (compacto + expandido) prototipadas e capturadas.
- [ ] OVERLAY_DESIGN.md com avaliação e recomendação.
- [ ] Overlay de produção intocado.
- [ ] PROGRESS.md atualizado (aguardando escolha).

# M5 — Reconstrução da aba de pausas (P1) — COM CHECKPOINT

Branch: `redesign/m5-pausas`

Problema central: **arquitetura da informação**. O usuário não sabe onde estão as
funções e não sente vontade de explorar.

## Parte A — Inventário
Use o inventário da AUDIT_INITIAL.md (M1) e complete-o. Não crie categorias sem
entender os recursos existentes. Não invente atividades.

## Parte B — Propostas
Hipótese inicial (não obrigatória):
- **Hoje:** próxima pausa, concluídas, pendentes, ação rápida.
- **Explorar:** biblioteca das atividades reais, agrupadas por finalidade
  (ex.: respiração, descanso, relaxamento, alongamento — só se existirem).
- **Minhas rotinas:** horários, frequência, duração, ativação, edição.
- **Histórico:** realizadas, frequência, duração, consistência.
- **Configurações:** preferências operacionais.

Não transforme cada seção em aba obrigatoriamente; use seções, filtros, detalhes
progressivos ou navegação contextual.

Criar **2 alternativas** de organização (wireframe/preview + screenshots) em
`docs/redesign/BREAKS_REDESIGN.md`, com contagem de toques para:
achar uma pausa, entender finalidade e duração, iniciar, adicionar à rotina,
editar agendamento, ver histórico.

Separar claramente: descobrir / executar / agendar / editar rotina /
histórico / preferências. Nunca exigir passar por configurações para descobrir
ou iniciar. Apresentação editorial, compacta, sem cartões grandes repetitivos;
convidativa, não parecer tela de configurações.

## CHECKPOINT
Pare e apresente as 2 alternativas + recomendação. **Aguarde minha escolha.**

## Parte C — Implementação (após escolha)
- Implementar com os componentes da M4.
- Estados vazios úteis.
- Flow Maestro: explorar, selecionar, iniciar, agendar, editar, desativar, histórico.

## Critério de pronto
- [ ] Nenhuma funcionalidade de pausas perdida (checar contra o inventário).
- [ ] Agendamentos e notificações funcionando.
- [ ] Flows Maestro passando.
- [ ] Screenshots before/after.
- [ ] PROGRESS.md → missão atual: M6.

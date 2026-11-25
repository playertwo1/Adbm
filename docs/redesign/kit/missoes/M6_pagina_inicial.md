# M6 — Página inicial "Minha Rotina" (P1) — COM CHECKPOINT

Branch: `redesign/m6-inicio`

Não é um dashboard genérico. Ao abrir, o usuário entende em segundos:
o que fazer hoje, programa ativo, próxima sessão, progresso, próxima pausa,
o que já fez, o que está pendente e como continuar.

## Conteúdo (conforme dados reais disponíveis)
- **Programa:** ativo, etapa, sessões concluídas, próxima sessão, frequência,
  duração estimada, progresso, ação de continuar. Detalhes sob demanda.
- **Pausas:** próxima, tempo até ela, concluídas, restantes, duração, iniciar rápido.
- **Linha do tempo do dia:** sessões + pausas agendadas + realizadas + pendentes,
  diferenciadas por estado. **Não inventar horários** para itens sem agendamento;
  se a linha do tempo não servir aos dados, proponha alternativa.
- **Progresso:** sessões, frequência, tempo de prática, adesão, histórico recente.
  Sem métricas fictícias, sem indicadores de saúde sem base, sem gamificação artificial.

Programas e pausas: compreensíveis individualmente, conectados na experiência.
Revisar terminologia inconsistente e fontes de dados compartilhadas.

## Direção
Hierarquia clara, boa densidade, poucos elementos competindo, não transformar
cada informação em cartão, estados vazios úteis, continuidade com o resto do app.

## Propostas
**2 composições** (preview + screenshots) em `docs/redesign/HOME_REDESIGN.md`,
cada uma mostrada nos estados: com/sem programa, com/sem pausas, histórico vazio/cheio.

## CHECKPOINT
Pare, apresente as 2 composições + recomendação. **Aguarde minha escolha.**

## Implementação (após escolha)
- Componentes da M4; dados reais.
- Flow Maestro cobrindo os estados acima (usar dados de teste só no emulador,
  nunca para esconder problemas).

## Critério de pronto
- [ ] Todos os estados renderizam corretamente.
- [ ] Ações de continuar programa e iniciar pausa funcionam a partir da home.
- [ ] Screenshots before/after.
- [ ] PROGRESS.md → missão atual: M7.

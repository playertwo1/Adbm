# M6 — Hoje

[Comparativo das duas composições](prototypes/hoje/hoje-comparativo.png)

- **A — Próxima ação.** A sessão do programa ativo tem o botão principal. Pausas e a prática registrada ficam logo depois. Indicado para retomar uma sequência de treino com frequência.
- **B — Minha rotina.** Programa, Pausas e prática do dia ficam em três linhas com o mesmo ritmo visual. Indicado para usar Hoje tanto em dias de treino quanto em dias de pausa. É a recomendação por continuidade com a organização aprovada de Pausas.

| Dado | Fonte e tratamento |
|---|---|
| Programa e sessão | Seleção e progresso reais de `selectTodayRecommendedProgram` e `renderTodayRecommendation`. Preservar a etapa, o início de sessão e o tratamento de progresso inválido ou meta concluída. Sem programa, oferecer o catálogo. |
| Rotina de pausas | Configuração e permissão atuais da Pausa Consciente. Agenda desativada ou indisponível mantém acesso a Corpo e Mente. Exibir um horário apenas quando a ocorrência efetivamente agendada estiver disponível. |
| Prática de hoje | Minutos de prática, sessões concluídas e registros existentes. Apresentar vazio de forma explícita e manter acesso a Evolução. |

As duas pranchas mostram exemplos ilustrativos com programa, rotina e histórico preenchidos e vazios. Na implementação, os três estados devem ser independentes. Confirmar combinações mistas no emulador e preservar os destinos e atalhos disponíveis.

Rafael aprovou **B — Minha rotina**. A implementação mantém a escolha explícita de programa dentro de um controle recolhível, expõe Pausas e o atalho do circuito na mesma linha de tarefa e usa a meta existente no resumo de prática. O status da Pausa Consciente acompanha a configuração e a permissão de avisos. A composição ainda não lista ocorrências futuras.

### Verificação

- `scripts/check.sh` passou após a correção dos nomes acessíveis do seletor de programas.
- No AVD API 36, a seleção de Bracing em Hoje tornou a sessão disponível. Após encerrar o circuito de teste anterior, o CTA abriu o player de Bracing e o atalho Pausas mostrou Corpo e Mente.
- Capturas de Hoje [sem programa](screenshots/after/hoje-minha-rotina.png) e [com Bracing selecionado](screenshots/after/hoje-minha-rotina-programa.png). A abertura do player foi verificada sem iniciar a sessão de Bracing.

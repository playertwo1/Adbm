# M5 — Reformulação de Pausas

O conteúdo de Corpo pode ocupar várias telas antes de chegar à Pausa de Resposta e a Mente. A ajuda ergonômica, as preferências, os controles ativos e o histórico disputam espaço com a seleção de práticas. A agenda de Pausa Consciente fica no Perfil. O problema principal é a ordem de descoberta.

[Comparativo das duas organizações](prototypes/pausas/comparativo-pausas.png)

## A — Biblioteca e rotina

`Explorar` é a entrada, com três destinos visíveis: Alongar, Respirar e Pausa de Resposta. Cada destino abre sua lista em detalhe. `Rotina` mostra o estado da Pausa Consciente e abre o editor existente. `Histórico` agrupa os registros existentes e deixa a opção de habilitar o registro da Pausa de Resposta em contexto.

## B — Escolha pela necessidade

Mostra ações agrupadas pelo objetivo, com SOS em destaque e acesso à biblioteca de alongamentos e respiração. Agenda e histórico ficam juntos em **Sua rotina**, com dois destinos ao abrir. Funciona para quem chega com uma necessidade imediata; exige uma etapa a mais para chegar aos registros.

## Caminhos previstos

Contagem a partir da entrada em Pausas. Os valores são de projeto e serão confirmados no AVD após a implementação.

| Tarefa | A | B |
|---|---:|---:|
| Identificar as três famílias de prática | 0 | 0 |
| Iniciar SOS Coluna pelo atalho | 1 | 2 |
| Encontrar uma respiração individual e ler sua duração | 1 | 1 |
| Iniciar uma respiração individual | 2 | 2 |
| Encontrar e iniciar um alongamento pelo catálogo | 2 | 2 |
| Abrir configuração da Pausa Consciente | 2 | 2 |
| Abrir histórico por tipo | 1 | 2 |

## Inventário a preservar

| Área | Recursos |
|---|---|
| Alongar | SOS Coluna, sugestão contextual, quatro alongamentos, filtro por região, circuito guiado, duração, intensidade, sinos, orientações ergonômicas, histórico e consistência. |
| Respirar | Em Caixa, Expiração Longa, Igual e Personalizado, prática sequencial, preferências, registros e indicadores de consistência. |
| Pausa de Resposta | Prática de três etapas, pausa/retomada/encerramento, histórico opcional e limpeza já suportada. |
| Rotina | Abrir o editor existente de Pausa Consciente, com os mesmos dias, horários, intervalo, ativação e permissões. Verificar se o agendamento atual suporta a atividade solicitada antes de oferecer qualquer nova ligação à rotina. |

**Recomendação — A.** A biblioteca é curta e cada tipo de informação tem um destino direto. Dentro de uma prática, duração e instruções aparecem antes do início, enquanto preferências ficam em detalhes. Uma prática em execução tem acesso persistente a seus controles, mesmo que o usuário mude de seção.

**Aceite:** rodar Maestro para descoberta, início, retorno à sessão ativa, agenda e histórico. Incluir estado sem rotina, sem histórico, fonte ampliada e tema claro/AMOLED. Usar as rotas e IDs existentes, preservar a paridade dos HTMLs e rodar `scripts/check.sh`.

## Revisão visual

Após o retorno sobre o visual das propostas, [esta composição](prototypes/pausas/pausas-editorial.png) reúne a biblioteca em uma lista com divisórias. O SOS Coluna tem a ação primária. Alongamentos, Respiração e Pausa de Resposta ficam à vista, com ligações para Pausa Consciente e Histórico ao final. A simulação usa a paleta clara existente para julgar a hierarquia. A implementação e a verificação da versão AMOLED aguardam a escolha desta direção.

### Direção atual · Peça de prática e lista agrupada

[Claro e AMOLED](prototypes/pausas/pausas-hig-claro-amoled.png) · [Prévia navegável](prototypes/pausas/pausas-hig.html)

Um único destaque usa a ilustração da torção na cadeira já embarcada no app. Abaixo, três práticas ficam no primeiro grupo, e os acessos de rotina e histórico compõem o segundo. A folha de detalhes entra com deslocamento de 20 px e opacidade em 230 ms. A preferência por movimento reduzido desliga a transição. O diálogo nativo do navegador restaura o foco ao voltar.

A revisão usou UI/UX Pro Max para alvo de toque, legibilidade e conteúdo em camadas, e a Apple HIG para ordem de leitura, agrupamento e divulgação progressiva. A prévia usa dados descritivos e não executa sessões, grava dados ou agenda lembretes.

### Alternativa de formato · Índice de práticas

[Lista inicial e prática aberta](prototypes/pausas/pausas-indice-praticas.png)

Após o retorno de Rafael, a opção usa as práticas como itens principais da lista. Os filtros Todas, Alongar, Respirar e Resposta mudam o conjunto de itens. A linha aberta mantém o contexto e revela duração, instrução e ação de início. Rotina tem acesso no cabeçalho e Histórico fica abaixo da lista. Os filtros e detalhes serão validados como controles na implementação.

Referências: filtragem por atividade no Apple Fitness+ e acesso às opções de cada prática no Mindfulness do Apple Watch. A aplicação de Unslop concentrou a cor na seleção e no início da sessão. A prancha é estática.

## Decisão de implementação

Rafael manteve o visual existente e pediu organização por dois focos. **Corpo** reúne alongamentos, circuito ergonômico e seus controles e registros. **Mente** reúne respiração e Pausa de Resposta. Ambas as entradas estão na parte superior, inicialmente recolhidas, e a abertura de uma recolhe a outra. Pausa de Resposta abre sob demanda dentro de Mente. Os atalhos existentes continuam chamando as ações originais e abrem a seção correspondente quando necessário.

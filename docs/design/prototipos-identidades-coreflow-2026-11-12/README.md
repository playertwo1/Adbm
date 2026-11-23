# CoreFlow — três identidades visuais

Protótipo navegável, isolado do aplicativo de produção. Abra `index.html` e alterne entre as três identidades e as telas Hoje, Programas e Treino.

## Direções

| Identidade | Linguagem | O que muda na composição |
|---|---|---|
| **Linha Editorial** | Tipografia editorial, verde sálvia e divisórias finas | A prática recomendada abre a tela; programas aparecem como trilha vertical; o treino usa tipografia e espaço livre. |
| **Instrumento** | Grafite, azul mineral e números tabulares | Séries, etapas e frequência ficam em leituras alinhadas; o treino destaca estado, tempo e próxima etapa. |
| **Fluxo** | Verde profundo e formas circulares funcionais | A consistência vira um anel; os programas seguem uma linha de percurso; a respiração conduz visualmente a sessão. |

As três propostas são escuras, sem gradientes, brilho decorativo, emojis ou pilhas de cartões repetidos. Os controles da prévia são apenas visuais. As demais áreas da navegação mostram uma mensagem de recorte, não simulação funcional.

## Análise do app atual

A tela Hoje repete ações rápidas na saudação e no bloco principal antes de apresentar a recomendação do programa. Os cards usam o mesmo peso visual; isso faz a primeira ação parecer uma entre várias e empurra a sessão recomendada para baixo. A navegação inferior usa ícones sólidos e um ressalto que não acrescenta informação ao estado selecionado.

Os protótipos exploram três respostas diferentes para esses problemas: ordem de leitura editorial, leitura técnica por etapa e ritmo visual associado à respiração. Não são uma troca de paleta do app existente.

## Critérios da skill UI/UX Pro Max

- Pesquisa local: `minimalism-and-swiss-style`, `dark-mode-oled`, `biomimetic-organic-2-0` e `organic-biophilic`.
- UX mobile: alvos de 48 dp para Android e pelo menos 8 dp de separação; foco visível; texto legível em tema escuro; redução de animação quando o sistema solicitar.
- Adaptação ao produto: HTML/CSS/JS local, sem dependências remotas. A família de ícones é SVG inline; a tipografia usa o sistema Android.

## Preservação

Os exemplos usam conteúdo ilustrativo do CoreFlow. O protótipo não altera identificadores, progresso local, exercícios, protocolo de treino, controles mini/compacto/expandido, pausas, lembretes, acessibilidade nem integração com Galaxy Watch. Essas integrações devem permanecer no produto durante a futura aplicação de uma identidade aprovada.

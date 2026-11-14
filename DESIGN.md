---
name: CoreFlow
description: "Caderno de prática Android: marfim, verde profundo, cartões suaves e instruções diretas."
colors:
  action: "#2F5B45"
  action-pressed: "#254736"
  action-tint: "#E6EEE7"
  canvas: "#F5F1E7"
  surface: "#FFFEFA"
  surface-interactive: "#ECEAE1"
  line: "#D8D2C7"
  ink: "#212821"
  secondary-ink: "#56615A"
  positive: "#28613F"
  positive-tint: "#E8F1E7"
  warning: "#705018"
  warning-tint: "#F2E9D3"
  danger: "#9D3F44"
  danger-tint: "#F6E7E6"
  amoled-canvas: "#000000"
  amoled-surface: "#0B100D"
  amoled-raised: "#151B17"
  amoled-action: "#9FC7A6"
  amoled-ink: "#F2F4F2"
  amoled-secondary-ink: "#B8C4BA"
  amoled-on-action: "#16271B"
  amoled-positive: "#82C79B"
  amoled-positive-tint: "#10251A"
  amoled-warning: "#E1BC78"
  amoled-warning-tint: "#2B2315"
  amoled-danger: "#EA969B"
  amoled-danger-tint: "#2B1517"
typography:
  display:
    fontFamily: "Roboto, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.2
  headline:
    fontFamily: "Roboto, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
  title:
    fontFamily: "Roboto, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: "Roboto, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Roboto, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  small: "8px"
  control: "12px"
  surface: "16px"
  sheet: "20px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  section: "28px"
components:
  button-primary:
    backgroundColor: "{colors.action}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    height: "44px"
    touchTarget: "48px"
    padding: "10px 16px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "44px"
    touchTarget: "48px"
    padding: "10px 16px"
---

# CoreFlow — Direção visual

## Direção escolhida

**Caderno de prática**: uma interface humana e tranquila que acompanha o corpo sem falar como uma clínica nem como um painel de métricas. A referência visual é o iOS, principalmente nas superfícies suaves, controles bem acabados e hierarquia cuidada. A implementação mantém convenções Android, recursos locais e os fluxos atuais.

O conteúdo visual nasce de uma prática real: instrução, respiração, postura, fase e tempo. O verde profundo é a cor de ação; o marfim dá calor ao fundo; a sálvia serve de apoio para seleção. Cartões aparecem na maioria das áreas, como pedido, mas mudam de tamanho e densidade conforme o conteúdo. Cada área não recebe uma cópia do mesmo cartão.

## Princípios Apple aplicados ao CoreFlow

A Apple HIG orienta propósito, familiaridade, agência, simplicidade, flexibilidade, responsabilidade e craft. Para este app:

- O próximo passo fica evidente sem uma saudação de marketing nem slogans.
- A pessoa continua no controle: pode iniciar, pausar, voltar e encerrar usando as ações existentes.
- A hierarquia vem da ordem, do alinhamento e do contraste; cartões agrupam conteúdo que realmente pertence junto.
- Cor mantém um significado estável em claro e escuro; texto, forma ou ícone também comunicam o estado.
- Movimento explica uma mudança útil. A respiração anima no ritmo real da fase; a navegação fica discreta.
- Progresso salvo é informação passiva. Uma faixa ou alerta forte aparece quando a pessoa precisa agir.
- O texto é curto, direto e compatível com instruções de prática.

## Relação com iOS e Android

A HIG atual define Liquid Glass como camada funcional de controles e navegação nas plataformas Apple, recomenda seu uso com parcimônia e desaconselha aplicá-lo no conteúdo. O CoreFlow vai adotar a sensação de superfícies suaves e flutuantes sem simular blur de vidro em todos os cartões. Conteúdo usa superfícies opacas; a barra inferior pode se destacar levemente do conteúdo, e a overlay mantém seu painel carvão.

Usamos Roboto/fonte do sistema Android, não SF Pro ou SF Symbols. Mantemos as cinco abas nomeadas, Voltar do Android, áreas de toque Android, WebView local e integração Wear OS. Os pontos tipográficos e tamanhos em pontos da HIG do iOS não são copiados literalmente para dp.

## Paleta

Os valores abaixo traduzem a escolha verbal — verde profundo, sálvia e marfim — em tokens testáveis. O contraste de texto comum foi conferido em claro e AMOLED; cada estado mantém um ícone ou rótulo além da cor.

| Papel | Claro | Uso |
|---|---|---|
| Fundo marfim | `#F5F1E7` | Fundo principal |
| Superfície | `#FFFEFA` | Cartões e folhas |
| Verde profundo | `#2F5B45` | Ação principal e aba ativa |
| Verde pressionado | `#254736` | Feedback de pressão |
| Sálvia | `#E6EEE7` | Seleção discreta |
| Texto | `#212821` | Títulos, instruções e valores |
| Texto secundário | `#56615A` | Apoio e metadados |
| Positivo | `#28613F` sobre `#E8F1E7` | Prática concluída, com rótulo ou check |
| Atenção | `#705018` sobre `#F2E9D3` | Aviso que não é destrutivo |
| Erro | `#9D3F44` sobre `#F6E7E6` | Erro e ação destrutiva |

AMOLED começa em preto `#000000`, com superfícies `#0B100D` e `#151B17`. Ação usa `#9FC7A6`, com texto escuro `#16271B`; positivo, atenção e erro usam seus pares próprios no front matter. AMOLED é o tema padrão; o tema claro permanece disponível.

## Composição

### Hoje

O programa recomendado para hoje aparece primeiro, com nome, fase atual, número da sessão e ação para continuar. “Ver programas” abre a lista completa; se nenhum estiver escolhido, a tela oferece os programas já existentes para seleção. A saudação, as práticas rápidas e o resumo do dia vêm depois, ligados aos dados locais reais. Não inventar progresso ou resultados.

### Prática em andamento

A instrução atual e o timer são os elementos principais. A sequência de fases continua visível como orientação secundária, com a fase atual marcada por texto/forma e verde. A animação de respiração acompanha o tempo real; não substitui a instrução.

As posturas recebem ilustrações próprias de linha, simples e precisas, desenhadas para ensinar o movimento. Uma espessura de traço e uma paleta consistente ajudam a distinguir posições; cada imagem mostra somente o necessário para executar a postura. As imagens não são decoração, textura ou substituto de instrução escrita.

### Cartões e controles

Cartões suaves aparecem na maioria das seções. A hierarquia varia por função: o cartão para começar uma prática tem mais destaque; opções e resumos têm menos. Evitar cartões aninhados, grades repetidas de caixas iguais, quadrados coloridos atrás de ícones e sombra forte em cada superfície.

- Raio de 14–16 px nos cartões; 10–12 px nos controles; 20 px nas folhas modais.
- Botões são retângulos suaves e compactos. A área de toque chega a 48 dp sem obrigar o desenho visível a ser alto.
- Pílulas ficam restritas a estados compactos que realmente pedem essa forma; nenhuma ação principal vira uma pílula grande.
- Elevação discreta cria a sensação de superfície flutuante. Conteúdo permanece opaco; blur não se espalha pela tela.
- Uma ação principal por contexto; ações secundárias não competem com ela.

### Navegação

Preservar os cinco destinos e seus nomes, sem barra fixa inferior ou botão de menu no cabeçalho. Deslizar da borda esquerda para dentro abre a gaveta com Hoje, Programas, Pausas, Evolução e Perfil; fora do gesto, ela não fica visível. O destino atual usa ícone e rótulo verdes, sem cápsula atrás. Um acionador invisível até receber foco mantém a navegação disponível por teclado e leitor de tela. No fim da rolagem de Hoje, deslizar para cima abre Programas; no topo de Programas, deslizar para baixo retorna a Hoje. A rolagem normal continua funcionando, controles e modais não iniciam a troca, e o conteúdo novo aparece no topo com transição vertical curta. Movimento reduzido remove a animação.

### Programas

O programa escolhido recebe primeiro plano com a próxima ação, fase ativa e sessões do dia em texto simples. Cada cartão organiza descrição, agenda semanal, sessões, lembretes, progresso total e etapas em uma leitura contínua; seleções usam verde e sálvia sem fundos em gradiente, ícones em quadrados coloridos ou estados em cápsulas decorativas. O programa Mindfulness segue a mesma linguagem e conserva suas práticas breve e formal, estado diário e etapas de áudio.

### Pausas, evolução e perfil

Pausas e práticas mantêm seus temporizadores, instruções e controles existentes em superfícies claras e calmas, com instrução atual antes dos detalhes secundários. Evolução mantém períodos, histórico e gráficos reais, usando o verde somente para progresso e dados da série. Perfil reúne identificação, metas, lembretes, áudio, vibração, tema, acessibilidade e segurança local; não recebe atalhos duplicados no cabeçalho.

### Overlay do treino

Painel carvão compacto e retangular, separado do app em que flutua. Timer e ações ficam alinhados e legíveis em mini, compacta, expandida, pausada e confirmação. Pause, continue e cancelar permanecem distintos; cancelar mantém sua confirmação.

## Tipografia e voz

Roboto/fonte do sistema Android, sem fonte de display ou fonte externa. Hierarquia de referência: título de tela 24 sp, título principal 20 sp, seção 17 sp, corpo 16 sp e rótulos 13 sp. Pesos regulares ou médios no texto comum, sem caixa alta espaçada. Contadores usam numerais tabulares. A escala de texto do Android precisa continuar funcionando sem cortar instruções.

A voz é direta e concreta: “Inspirar”, “Manter por 4 s”, “Continuar treino”. Incentivo pode aparecer quando combina com a situação, sem frases motivacionais genéricas nem promessas de resultado.

## Movimento e feedback

- Respiração: expansão/contração claramente sincronizada com inspiração, expiração e pausas existentes; o timer e a instrução permanecem legíveis.
- Navegação: transição curta e discreta quando muda de aba; não animar a aba que já está aberta.
- Botões e seletores: resposta de pressão curta, sem mover os elementos ao redor.
- Movimento reduzido do app ou Android remove a animação repetitiva e deixa o mesmo estado final disponível.
- Progresso salvo é um status pequeno perto do conteúdo. Erro usa mensagem explícita e ação de recuperação quando necessária.

## Acessibilidade e limites

Manter contraste mínimo de 4,5:1 para texto comum, informação não depende apenas de cor, controles nomeados para TalkBack e escala de fonte do Android. A animação nunca é o único modo de explicar uma fase.

Não alterar práticas, timers, armazenamento, IDs, dados, protocolo de treino, integração Wear OS, permissões, recursos locais nem comportamento de Voltar. `index.html` e `app/src/main/assets/index.html` permanecem idênticos.

## Base oficial consultada

- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Design principles](https://developer.apple.com/design/human-interface-guidelines/design-principles/)
- [Designing for iOS](https://developer.apple.com/design/human-interface-guidelines/designing-for-ios/)
- [Materials](https://developer.apple.com/design/human-interface-guidelines/materials/)
- [Color](https://developer.apple.com/design/human-interface-guidelines/color/)
- [Layout](https://developer.apple.com/design/human-interface-guidelines/layout/)
- [Typography](https://developer.apple.com/design/human-interface-guidelines/typography/)
- [Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars/)
- [Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets/)
- [Motion](https://developer.apple.com/design/human-interface-guidelines/motion/)
- [Feedback](https://developer.apple.com/design/human-interface-guidelines/feedback/)
- [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility/)
- [Writing](https://developer.apple.com/design/human-interface-guidelines/writing/)

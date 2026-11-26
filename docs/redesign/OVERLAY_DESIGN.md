# M2 — Direções para a overlay

[Comparativo com os seis protótipos](prototypes/overlay/comparativo.png). As pranchas são estáticas, usam valores ilustrativos e aplicam os tokens AMOLED do `DESIGN.md` como referência de trabalho.

| Critério | A — Organic Wave | B — Micro Instrument | C — Ambient Control |
|---|---|---|---|
| Leitura da fase e do tempo | A onda domina; o tempo fica em área secundária no compacto | Tempo em primeiro plano e fase em texto ao lado | Fase e tempo ficam próximos, mas em tamanho menor |
| Espaço e conforto | A composição pede mais largura e altura para a onda | Equilíbrio entre leitura e espaço, com ação direta | Menor cobertura do app em primeiro plano |
| Uso com uma mão | Expandir tem rótulo, mas pausar exige expansão | Pausa direta no compacto; expansão precisa de nome acessível | Toque na própria superfície expande; pausar requer segundo toque |
| Acessibilidade | Rótulo explícito de fase, com maior separação visual | Dígitos grandes e rótulo explícito de fase; validar escala de fonte | Menos espaço para fontes ampliadas e rótulos longos |
| Identidade e transições | A onda conduz a transição entre fases | Contador estável e onda varia sem deslocar os controles | Onda discreta, com a maior mudança visual na expansão |
| Energia estimada | Maior área animada das três | Área da onda contida | Menor área animada; custo real depende de frequência e visibilidade |

**Recomendação — B.** O usuário vê em um relance quanto falta e pode pausar sem expandir. Na implementação, a expansão precisa de descrição acessível e cada controle deve ter alvo efetivo de 48 × 48 dp. As dimensões e a energia continuam a validar no AVD e no S25 Ultra.

O estado mini existente continua coberto nas regressões por ser uma preferência disponível. A proposta não inclui um novo estado ultradiscreto: ocultar fase e tempo exigiria expansão para interpretar a sessão, função já atendida pelo estado mini.

**Checkpoint** — escolher A, B ou C e confirmar a referência visual antes de modificar a overlay de produção.

## Segunda rodada

Rafael descartou A, B e C. A [nova prancha](prototypes/overlay/comparativo-rodada-2.png) compara três propostas de interação, cada uma em compacto e expandido.

- **D — Faixa de etapas.** Mostra a fase em andamento dentro da sequência. É a opção mais informativa para práticas com várias fases e a que exige mais largura.
- **E — Controle lateral.** Empilha contador, pausa e expansão junto a uma borda. Deixa mais largura para o aplicativo de fundo. Precisa de validação de alcance, arraste e gestos em ambas as bordas.
- **F — Agora e a seguir.** Expõe a fase atual e a próxima já no compacto. É a opção mais direta para antecipar a transição, com pausa no expandido.

A referência visual provisória segue sendo o AMOLED do `DESIGN.md`. A prancha avalia composição e interação. A onda funcional, os alvos de toque e as transições ainda precisam ser prototipados para a direção escolhida.

## Terceira rodada

Rafael pediu para retomar os conceitos de A, B e C com maior diferença visual entre eles. A [prancha revisada](prototypes/overlay/comparativo-rodada-3.png) preserva a onda nas três propostas.

- **A2 — Pulso.** Superfície verde orgânica e onda longa atravessando o painel. A janela expandida reserva o centro para a onda.
- **B2 — Mostrador.** Caixa retangular com visor dedicado, contador monoespaçado em destaque e pausa no compacto. A onda fica junto aos dados de fase.
- **C2 — Ponto de presença.** Cápsula curta, com onda, fase e tempo. Um toque na cápsula abre os controles; expandida, a mesma cápsula passa a mostrar o estado dentro do painel.

## Escolha de implementação

Rafael confirmou **B1**, o Micro Instrument da primeira prancha, para a janela flutuante nativa. No compacto, contador, fase e onda dividem a leitura com Pausar/Continuar e o acesso explícito ao expandido. O cancelamento continua disponível no expandido, com confirmação. Em fonte ampliada, os controles ganham uma segunda linha. O expandido dá mais destaque ao contador e mantém as orientações específicas de cada prática.

Após o retorno sobre o Pausar, o compacto passou a usar uma cápsula escura com rótulo e feedback de toque. A área interativa continua com 48 dp de altura. Quando a sessão pausa, o rótulo muda para Continuar e recebe a cor de ação.

O contador ocupa a largura dos dígitos, deixando a onda começar a 6 dp do relógio. O rótulo da fase fica centralizado sobre a onda, que recebeu 21 dp de altura.

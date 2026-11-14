# Product

<!-- impeccable:product-schema 1 -->

## Platform

android

## Users

Pessoas que usam o CoreFlow para acompanhar práticas e treinos. Não há público demográfico mais específico confirmado.

## Product Purpose

O CoreFlow oferece práticas guiadas para desenvolver força física, postura, respiração e atenção plena. O sucesso do produto deve ser avaliado pelos fluxos e dados reais já existentes no aplicativo, sem presumir métricas de resultado.

## Positioning

O projeto documenta programas de treino, práticas de mobilidade e respiração, Mindfulness, progresso local, uma overlay de sessão Android e integração com Wear OS. Um diferencial comercial além desse conjunto não está confirmado e não deve ser inventado.

## Operating Context

Aplicativo Android para telefone, com interface principal em WebView carregada de `app/src/main/assets/index.html` e cópia de desenvolvimento em `index.html`. Serviços Android dão suporte à sessão, áudio e overlay flutuante. Há um módulo Wear OS complementar.

## Capabilities and Constraints

- Preservar destinos, fluxos, conteúdo, dados, identificadores, armazenamento e protocolo de treino existentes.
- Manter `index.html` e `app/src/main/assets/index.html` idênticos.
- A WebView usa recursos locais, mantém navegação e permissões restritivas e não usa conteúdo misto.
- O projeto usa HTML, CSS e JavaScript existentes; não introduzir Tailwind.
- Preferências e progresso são locais ao dispositivo; a interface não deve inventar treinos, resultados ou métricas.
- A marca e o produto continuam chamados CoreFlow.

## Brand Commitments

O usuário pediu uma nova identidade visual porque considera a atual genérica e com aparência de interface gerada por IA. A direção solicitada é moderna, com qualidade de acabamento inspirada nos produtos Apple/iOS. Como o produto é Android, essa referência informa clareza, hierarquia, espaçamento e refinamento, preservando comportamento e affordances adequados ao Android. Não há pedido confirmado para mudar o nome do produto.

## Evidence on Hand

- Interface e identidade atualmente em uso: `index.html` e `app/src/main/assets/index.html`.
- Descrição de capacidades do produto: `README.md`.
- Brief de redesign fornecido pelo usuário na conversa: CoreFlow é usado para acompanhar atividades e treinos; a ação central é iniciar e acompanhar uma prática.
- Não há depoimentos, clientes, métricas de eficácia ou outra prova comercial confirmada neste registro.

## Product Principles

- Sessões e progresso devem permanecer claros durante o uso.
- Usuários mantêm controle explícito sobre iniciar, pausar e encerrar práticas.
- A interface deve ser legível e útil durante uma atividade, não só na tela inicial.
- Dados, resultados e capacidades devem refletir o aplicativo real.
- As mudanças visuais não podem quebrar navegação, acessibilidade ou integração Android/Wear OS.

## Accessibility & Inclusion

O aplicativo já oferece preferências de acessibilidade para escala de texto, alto contraste e movimento reduzido. A interface e as animações devem continuar respeitando essas opções e as configurações do sistema.

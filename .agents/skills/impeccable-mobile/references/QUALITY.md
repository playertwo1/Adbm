# Mobile Quality Floor

## Critérios e gatilhos

1. **Funcionalidade:** impedir ações inacessíveis, travamentos, regressões de fluxo.
2. **Acessibilidade:** alvos de toque Android normalmente >=48dp quando possível,
   foco e leitura de tela, contraste mínimo WCAG AA (4.5:1 texto normal, 3:1 grande)
   como referência quando aplicável, escala de fontes, labels sem ambiguidade.
3. **Hierarquia:** conteúdo principal deve ser reconhecível em 3 segundos,
   ação primária bem posicionada, sem três CTAs concorrentes.
4. **Layout:** respeitar edge-to-edge, window insets, recortes, teclado, orientação,
   expandido/compacto, listas longas e traduções maiores.
5. **Design:** identidade já aprovada vence preferência genérica do modelo;
   componentes reutilizáveis, espaços consistentes, cor com propósito, sem bento
   compulsório, ícones decorativos, excesso de blur ou cards aninhados.
6. **Motion:** reduzir movimentos quando sistema solicitar; feedback <sensível>,
   evitar animações obrigatórias, jank e flashes.
7. **Wear OS:** área segura circular, legibilidade rápida, direção de leitura,
   navegação própria de relógio, energia e toque com dedo.

## Etiquetas de confiabilidade

- `EVIDENCIADO`: screenshot identificável, XML, stack trace, teste ou linha de código.
- `PROVAVEL`: indício sem confirmação de execução.
- `ESTETICO`: preferência de design; não tratar como defeito técnico.

Severidade: P0 impede usar; P1 compromete tarefa; P2 degrada; P3 refinamento.
Não use pontuação composta como substituto de critérios bloqueantes.

## Política de ouro

- Compare screenshots exige dimensões iguais. Tratar diferenças dinâmicas
  (relógio, dados, efeitos) com regiões ignoradas declaradas; não mascarar tudo.
- Nunca atualizar referência aprovada sem autorização; capturas novas são propostas.
- No máximo 2 ciclos de correção sem novo pedido.
- Foco na tela modificada no modo standard; fluxo completo apenas no modo complete.
- Nunca interpretar diff de pixels como prova de qualidade UX.

# Visão de produto e identidade visual do ADBM

## Objetivo
Fazer o ADBM deixar de parecer um app funcional com design improvisado e transmitir
qualidade de produto premium, que o proprietário tenha prazer em usar todos os dias.
Evolução real de UI e UX — não maquiagem — preservando identidade e funcionalidades.

## Problemas observados em uso real
- **Menu lateral:** abre só por gesto de borda, que conflita com a navegação por
  gestos do Android (frequentemente volta/fecha o app). Sem alternativa visual.
- **Overlay:** superfície mais usada no dia a dia. Botões grandes, desproporcionais,
  composição sem qualidade, tanto compacto quanto expandido.
- **Aba de pausas:** arquitetura da informação confusa; difícil achar funções;
  não convida a explorar.
- **Página inicial:** composição fraca; programas e pausas desconectados;
  sem visão clara da rotina, progresso e próximas atividades.
- **Geral:** botões exagerados, proporções ruins, inconsistência, baixa densidade.

## Identidade
- **Preserve a direção visual já aprovada.** Fonte de referência:
  `<PREENCHER: caminho do DESIGN.md / screenshots / commit de referência>`.
  Em conflito entre referências, use a mais recente aprovada e registre.
- Qualidade de apps premium iOS, respeitando padrões de interação Android.
- Orgânico, minimalismo funcional, tipografia sofisticada, formas suaves,
  movimento fluido, contraste equilibrado, cor com intenção, tranquilidade,
  precisão, boa densidade, personalidade própria.

## Assinatura: a onda animada
- Elemento central da identidade. Coerente entre tela de exercício, overlay
  compacto/expandido, indicadores de atividade e transições de exercício.
- **Não** espalhar ondas decorativas pelas telas; só com significado funcional.
- A animação **representa** o estado, nunca o controla.
- Fases devem ser identificáveis sem depender só de cor, movimento ou da onda
  (sempre com rótulo/indicador textual acessível).

| Fase | Direção visual |
|---|---|
| Contração | concentrada, tensionada, controlada |
| Soltura | relaxamento progressivo da amplitude |
| Descanso | movimento suave e reduzido |
| Inspiração | expansão progressiva |
| Expiração | contração gradual |
| Pausado | movimento interrompido/suavizado + estado explícito |
| Concluído | transição breve de encerramento |

## Proibições estéticas
Aparência genérica de app feito por IA; dashboard de template; excesso de cartões
arredondados e cápsulas; cartão dentro de cartão; gradientes e glassmorphism
gratuitos; sombras pesadas; botões enormes; ícones inconsistentes; badges
desnecessários; elementos infantis; cabeçalhos gigantes; vazios excessivos;
animação sem finalidade; vermelho fora de perigo/encerramento.

- Minimalismo ≠ ausência de informação.
- Sofisticação ≠ efeitos visuais.
- Acessibilidade ≠ elementos gigantes.

## Escala de controles (ponto de partida, validar visualmente)
| Componente | Altura visual |
|---|---|
| Ultracompacto | 28–32 dp |
| Compacto | 32–36 dp |
| Regular | 40–44 dp |
| Primário | 44–48 dp |
| Ação especial | maior só se justificado |

Área de toque ≥ 48×48 dp sem sobreposição. Tamanho visual ≠ área de toque.
Hierarquia por tipografia, contraste, posição e contexto — não por tamanho.

## Movimento
Animação transmite informação, continuidade ou feedback. Sem latência nas ações
principais. Respeitar "reduzir movimento". Considerar bateria em animações contínuas.

# Questionário — direção visual do CoreFlow

As escolhas abaixo foram respondidas em conversa e já estão refletidas em `DESIGN.md`. Registro para referência: `1A, 2B, 3B, 4B, 5A, 6C, 7A, 8A, 9A, 10A, 11A, 12C (estilo A), 13A, 14A, 15B, 16A, 17C, 18A`.

## Decisões de produto e plataforma já fixas

Estas escolhas não precisam ser votadas: CoreFlow continua Android/WebView com Wear OS; as cinco áreas e os fluxos atuais permanecem; `index.html` e o asset Android continuam idênticos; o conteúdo e o protocolo de treino não mudam; a interface mantém suporte a escala de texto, contraste, movimento reduzido e retorno acessível; botões e ações não voltam a ser pílulas grandes. A HIG é referência, mas SF Pro, SF Symbols e Liquid Glass não serão copiados como se fossem recursos nativos do Android.

## Escolhas visuais

1. **Personalidade do produto.** Qual deve ser a sensação principal?
   - A. Caderno de prática: humano, calmo e ligado ao corpo. **Recomendação**
   - B. Instrumento de treino: técnico, claro e orientado a tempo/fase.
   - C. Saúde cotidiana: acolhedor e leve, sem tom clínico.
   - D. Outra: descreva em poucas palavras.

2. **O que significa “qualidade Apple” para o CoreFlow?**
   - A. Hierarquia clara, alinhamento preciso e poucos elementos competindo. **Recomendação**
   - B. Superfícies flutuantes e camadas visuais semelhantes ao iOS atual.
   - C. Tipografia e transições mais expressivas, mantendo controles Android.
   - D. Outra prioridade: descreva.

3. **Cor de ação.** O que acontece com o azul atual `#315D91`?
   - A. Manter o azul e deixar sua aplicação mais disciplinada. **Recomendação**
   - B. Trocar por outro azul; indique frio, petróleo ou outro matiz.
   - C. Escolher uma nova cor juntos; o símbolo de pulmões também será revisto.
   - D. Quase monocromático; cor só para estados e ação essencial.

4. **Fundo claro.**
   - A. Branco frio e cinza claro, parecido com o app atual.
   - B. Fundo mineral quente, com superfícies claras. **Recomendação se escolher 1A**
   - C. Branco quase puro e separação por linhas.
   - D. Outra referência/cor.

5. **Uso das cores secundárias.**
   - A. Azul nas ações; verde/âmbar/vermelho apenas para estados reais. **Recomendação**
   - B. Cada família de prática recebe uma cor própria.
   - C. Interface quase toda grafite; estados continuam coloridos.

6. **Superfícies e profundidade.**
   - A. Listas abertas, divisórias finas e poucos painéis. **Recomendação**
   - B. Alguns cartões brancos para agrupar práticas e resumos.
   - C. Camada translúcida só em navegação ou overlay, nunca no conteúdo comum.

7. **Cantos dos componentes.** Sem voltar aos botões em forma de pílula.
   - A. Mais retos: 6–10 px nos controles e até 14 px em painéis.
   - B. Suaves: 10–14 px nos controles e 18 px em painéis. **Recomendação**
   - C. Mistos: controles retos, folhas modais mais arredondadas.

8. **Tamanho visual dos botões.** A área de toque pode ser maior que o desenho visível.
   - A. Botões compactos, com área tocável acessível. **Recomendação**
   - B. Ação principal mais alta; secundários compactos.
   - C. Todos os botões com a mesma altura visual.

9. **Tipografia.**
   - A. Roboto/fonte do sistema Android, com pesos e tamanhos bem ajustados. **Recomendação**
   - B. Uma sans-serif licenciada e local para dar identidade própria.
   - C. Ainda não sei; primeiro comparar amostras no aparelho.
   - Nota: SF Pro é a fonte de sistema indicada pela HIG para iOS; não é a fonte de sistema do Android.

10. **Prioridade da tela Hoje.** O primeiro bloco deve ajudar a pessoa a:
    - A. Iniciar a prática adequada para agora. **Recomendação**
    - B. Continuar o programa que já acompanha.
    - C. Ver o resumo do dia antes de escolher.
    - D. Escolher outra prioridade existente no app.

11. **Foco da tela durante a prática.** O que deve dominar a primeira leitura?
    - A. Instrução da fase e contador. **Recomendação**
    - B. Imagem local de postura, com fase e contador junto.
    - C. Sequência de fases completa, destacando a atual.
    - D. Combinação: indique a ordem.

12. **Ícones e imagens.**
    - A. Ícones de uma só família; imagens reais do guia apenas quando ensinam o movimento. **Recomendação**
    - B. Ícones monocromáticos sem imagem de exercício.
    - C. Ilustrações próprias de postura além das imagens já existentes.

13. **Navegação inferior.** As cinco abas nomeadas permanecem. Como marcar a selecionada?
    - A. Ícone e rótulo em azul, sem cápsula atrás. **Recomendação**
    - B. Azul com um fundo suave só no ícone.
    - C. Indicador em linha e rótulo neutro.

14. **Overlay de treino.** Como deve parecer quando fica sobre outros apps?
    - A. Painel carvão compacto, retangular, com timer e controles alinhados. **Recomendação**
    - B. Painel claro igual à tela do app, com borda forte.
    - C. Painel escuro com um pouco mais de presença visual, sem formato de pílula.

15. **Movimento.**
    - A. Transições discretas entre telas; animação de fase só quando acompanha a prática real. **Recomendação**
    - B. Mais movimento no ciclo de respiração, mantendo telas estáveis.
    - C. Feedback visual e háptico em quase todas as ações, sem animação de entrada.

16. **Feedback de salvamento e erro.**
    - A. Salvamento discreto junto ao contexto; faixa/alerta só para falha que exige ação. **Recomendação**
    - B. Confirmação breve após salvar; erro permanece até resolver.
    - C. Não mostrar sucesso; mostrar apenas falhas.

17. **Tema escuro.** O app já tem modo AMOLED.
    - A. Claro como padrão; AMOLED opcional.
    - B. Seguir automaticamente o tema do Android. **Recomendação**
    - C. AMOLED como padrão.

18. **Tom das instruções.**
    - A. Direto e concreto: “Inspirar”, “Manter por 4 s”, “Continuar”. **Recomendação**
    - B. Acolhedor, com frases curtas de incentivo.
    - C. Técnico, com termos anatômicos quando necessários.

## Ordem para decidir rápido

Se quiser começar com menos escolhas, responda primeiro **1, 2, 3, 6, 10, 11, 14 e 15**. Os padrões de acessibilidade, adaptação do Android, segurança dos dados e contraste continuam obrigatórios em qualquer combinação.

---
name: impeccable-mobile
version: 1.0.0
license: MIT
description: >
  Extensao mobile complementar ao Impeccable oficial. Use para revisar, criticar,
  auditar, polir, animar, adaptar e testar UI Android (Compose, Flutter, React Native),
  incluindo Wear OS. Use quando houver pedido de melhoria visual de app,
  screenshots, emulador, Maestro, QA de interface ou comandos mobile.
---

# Impeccable Mobile Studio

Extensão **independente**: exige a skill oficial `impeccable` instalada para seus
24 comandos. **Não substitui, não incorpora e não faz fork** do Impeccable.

## Primeiro passo

1. Inspecione `PRODUCT.md`, `DESIGN.md`, estrutura do app e capturas aprovadas.
2. Identifique plataforma (`build.gradle*` com Compose, `pubspec.yaml`,
   `package.json` e Expo/React Native, Wear OS). Em projeto híbrido, identifique
   a tela-alvo antes de selecionar o adaptador.
3. Carregue somente uma referência da pasta `references/` correspondente à
   plataforma, mais `references/QUALITY.md`.
4. Se `impeccable` oficial estiver disponível, invoque **o comando oficial**
   equivalente conforme `references/COMMANDS.md`, usando seu próprio contexto
   e referências; não simule execução do motor. Se ausente, explique que os
   comandos oficiais dependem da instalação, ofereça revisão manual desta skill.
5. Para exame do resultado real, prefira Maestro para jornadas reproduzíveis;
   ADB para captura/inspeção pontual; `scripts/mobile.py compare` para diff. Para espelhamento ao vivo, use `preview` com scrcpy opcional.
6. Aplique critérios de gravidade e documente evidências sem inventar resultado
   de ferramenta ausente.

## Sintaxe conversacional

- `mobile critique [tela]` -> Impeccable `critique` + screenshot nativo se disponível.
- `mobile audit [tela]` -> Impeccable `audit` nativo + checks do mobile.
- `mobile polish [tela]` -> Impeccable `polish` + ciclo antes/depois.
- `mobile <qualquer comando oficial> [tela]` -> preserve os 24 comandos oficiais.
- `mobile capture [nome]` -> captura local (Maestro flow ou ADB).
- `mobile inspect [nome]` -> screenshot; XML via ADB somente com `--include-xml` explícito.
- `mobile compare [antes.png] [depois.png]` -> métricas objetivas e diff.
- `mobile test [flow.yaml]` -> Maestro CLI, se instalado.
- `mobile wear [tela]` -> referência Wear OS + comando oficial apropriado.
- `mobile preview` -> espelhamento ao vivo via scrcpy (opcional).
- `mobile full-review [tela]` -> revisão orientada por evidências, limitada.

**Importante:** a sintaxe acima é acionada pelo agente, não um executável
`mobile` instalado no sistema; as ações de terminal são `python scripts/mobile.py ...`
(veja README). Comandos oficiais continuam `/impeccable ...` ou `$impeccable`.

## Modos

- **quick:** 1 tela, 1 captura, até 3 problemas, sem correção automática.
- **standard (padrão):** telas modificadas, análise, até 2 ciclos de correção,
  captura antes/depois e um teste de navegação representativo.
- **complete:** jornadas principais, pelo menos 2 tamanhos de janela quando
  disponíveis, diferentes escalas de fonte e situações de erro/estado vazio.

## Processo de mudança

1. Capturar linha de base **antes** de modificar.
2. Distinguir comprovado (screenshot, teste, código), suspeita e opinião estética.
3. Classificar P0 (bloqueante), P1 (alto), P2 (médio), P3 (refinamento).
4. Desenhar solução nativa conservando identidade, fluxo, comportamento e dados.
5. Implementar somente o escopo pedido. Não apagar lógica de negócio.
6. Rodar capturas e teste relevante; usar diffs para detectar regressões,
   nunca para afirmar que um design é esteticamente superior.
7. Documentar em `templates/QA-REPORT.md`. Reportar ferramentas não executadas.

## Restrições

- Sem bibliotecas comerciais, assinatura, APIs pagas ou uploads para nuvem.
- Não executar Maestro Cloud, `maestro chat`, funções AI Insights pagas, nem
  enviar capturas a fornecedores sem autorização explícita.
- Preferir emulador com dados fictícios. Não registrar dados pessoais de clientes.
- Antes de captura do aparelho real, verificar se não há informações privadas.
- Armazenar saídas em `.impeccable-mobile/`. Confirmar regra no `.gitignore`
  do diretório de trabalho; o instalador não altera o ignore da raiz do app.
- Preservar PNG, JSON, XML e diffs anteriores; escolher outro nome/destino
  em vez de aplicar `--overwrite` automaticamente.
- Executar Maestro na raiz do app ou informar `test --workdir CAMINHO`.
- Não sobrescrever imagens de referência aprovadas automaticamente.
- Não alterar configurações de dispositivo nem limpar estado de app sem pedido.
- **`live` e `generate` oficiais são específicos do browser:** no nativo, produzir
  variantes em arquivos/branches e oferecer capturas estáticas comparativas;
  nunca afirmar equivalência HMR/edição em tempo real.
- Usar ferramentas reais para afirmar teste; não inventar captura, acesso ao
  emulador, instalação, resultados de Maestro ou pontuações.

## Referências sob demanda

- `references/COMMANDS.md`: catálogo e mapeamento de 24 comandos originais.
- `references/QUALITY.md`: critérios e políticas de qualidade.
- `references/ANDROID.md`, `FLUTTER.md`, `REACT-NATIVE.md`, `WEAR-OS.md`.
- `workflows/REVIEW.md`, `IMPROVE.md`, `FULL-REVIEW.md`.

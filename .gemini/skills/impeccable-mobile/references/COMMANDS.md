# Comandos oficiais + extensão native

**Fonte oficial:** `https://github.com/pbakaus/impeccable` (README e
`skill/scripts/command-metadata.json`). Os nomes são os originais. Os agentes
**devem invocar** a skill Impeccable instalada, com essas referências;
não existe implementação Python equivalente do motor Impeccable aqui.

| Comando | Foco no app mobile |
|---|---|
| `craft` | Alias legado para criação; prefira `shape` ou pedido direto |
| `init` | Contexto de produto em `PRODUCT.md` |
| `document` | Extrair identidade existente em `DESIGN.md` |
| `extract` | Componentes/tokens reutilizáveis |
| `shape` | Descoberta e desenho de fluxo antes do código |
| `critique` | Crítica UX/UI da tela renderizada e da jornada |
| `audit` | Acessibilidade, desempenho e limites nativos |
| `polish` | Acabamento sem mudar identidade/funcionalidade |
| `bolder` | Mais personalidade visual, quando apropriado |
| `quieter` | Reduzir estímulo e ruído visual |
| `distill` | Retirar excesso mantendo tarefas fundamentais |
| `harden` | Erros, estados vazios, truncamentos, internacionalização |
| `onboard` | Primeira experiência, tutoriais e estados vazios |
| `animate` | Microinterações com respeito à redução de movimento |
| `colorize` | Cor estratégica, mantendo contraste |
| `typeset` | Hierarquia tipográfica responsiva à escala do Android |
| `layout` | Ritmo, espaços e margens nativas |
| `delight` | Pequenas interações de alto valor |
| `overdrive` | Efeitos avançados sob orçamento de desempenho |
| `clarify` | Labels, mensagens e textos mais compreensíveis |
| `adapt` | Telas pequenas/grandes, retrato/paisagem |
| `optimize` | Fluidez, custo de render e startup |
| `live` | **Browser only oficial**; equivalente mobile requer fluxo próprio |
| `generate` | **Browser only oficial**; variantes mobile são arquivos/capturas separadas |

## Seis ações adicionais da nossa extensão

- `mobile capture`: ADB captura PNG da tela atual. Maestro `takeScreenshot` também.
- `mobile inspect`: ADB captura PNG; dump UI Automation XML exige `--include-xml`.
- `mobile compare`: diff pixel-a-pixel em arquivo sem avaliação estética.
- `mobile test`: Maestro CLI executa YAML local (sem usar Cloud).
- `mobile wear`: ativa checklist Wear OS e direciona comando de design adequado.
- `mobile preview`: espelha Android localmente com scrcpy para visualização ao vivo.

## Roteamento por objetivo

- `critique`, `audit` -> executar Impeccable oficial, complementar por evidência.
- `polish`, `animate`, `typeset`, ... -> fazer mudanças, depois testes nativos.
- `live`, `generate` -> nunca fingir HMR mobile; propor alternativas de screenshot.
- `mobile full-review` -> compor captura, critique, audit, correção autorizada,
  nova captura, compare e test (se Maestro disponível).

**Observação:** chamar `mobile critique` em linguagem natural não cria automaticamente
um comando de slash `/mobile critique` em todas as IDEs. O agente lê a skill e
executa o procedimento; para abreviações, configurar atalhos específicos do IDE.

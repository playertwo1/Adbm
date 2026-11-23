# Da v1.2 à v2.0: diagnóstico e melhorias

## 1. O que a v1.2 é (o que entendi)

Uma skill local para melhorar UI Android nativa com foco em **honestidade de evidências**: inspecionar antes de opinar, não forçar upgrades, PASS/FAIL/NOT RUN por checagem, proibir FPS inventado e "nota premium". Tinha 16 modos, 10 referências curtas (~400 linhas no total), 5 scripts sem dependências (probe de AGP, scan heurístico com 6 dicas, contraste, gate de evidências, captura de frames de vídeo) e 3 arquivos de teste.

**Pontos fortes que mantive:** a disciplina de evidência, a cautela com versões (screenshot test experimental no AGP 9.5), o "não migrar toolkit para ficar bonito", os scripts sem dependências e testados, e a instalação multiagente.

## 2. Onde a v1.2 falhava

| # | Problema | Consequência |
|---|---|---|
| 1 | Dizia muito "o que não fazer" e pouco **como fazer bonito**: sem direções visuais, sem tokens, sem escala tipográfica, sem receitas | O agente caía no Material 3 padrão, exatamente o visual "genérico de IA" |
| 2 | **Dark-only embutido nos não-negociáveis** | Um único estilo para todo app; ruim para editorial, infantil, marca forte |
| 3 | **O agente nunca via o que fazia**: sem loop de renderização/captura | "Ficou ótimo" sem olhar pixels |
| 4 | Regras de plataforma desatualizadas ou ausentes: edge-to-edge obrigatório (SDK 35/36), predictive back padrão e `onBackPressed` ignorado (SDK 36), orientação/redimensionamento ignorados em telas grandes (SDK 36/37), M3 Expressive, Navigation 3, NavigationEvent, Styles API, MediaQuery/Grid/FlexBox | Código que parece certo e quebra no Android 16/17 |
| 5 | Scanner fraco (6 dicas) e contraste **sem alpha**, embora a própria skill mandasse verificar cores compostas | Ferramenta contradizia a regra |
| 6 | 16 modos planos e sobrepostos (touch/space/harden/accessibility), sem roteador | Agente carregava contexto demais ou o errado |
| 7 | Gemini CLI tratado como atual (foi substituído pelo Antigravity CLI em 18/06/2026 para vários planos); sem manifestos de plugin | Instalação desatualizada; difícil de distribuir pelo GitHub |
| 8 | **Nenhuma avaliação (eval)** - contra a recomendação oficial da Anthropic de criar ao menos 3 antes | Impossível provar que a skill ajuda |
| 9 | Sem formulários, estados, microcopy, i18n/RTL, dados/gráficos, ícones/app icon, haptics, Wear/TV/Auto/XR/widgets, Flutter/RN | Lacunas exatamente onde apps parecem amadores |
| 10 | A skill pode simplesmente **não ser acionada** (Vercel mediu 56% de casos sem invocação) | Regras críticas não aplicadas |

## 3. O que pesquisei (fontes principais)

- **Formato e boas práticas de skills:** especificação Agent Skills (agentskills.io), documentação do Claude Code e guia de autoria da Anthropic (SKILL.md < 500 linhas, descrição em 3ª pessoa com gatilhos, referências a um nível, sumário em arquivos > 100 linhas, loops de validação, ≥ 3 evals, testar em vários modelos), Codex (`.agents/skills`, `agents/openai.yaml`, orçamento de 2% do contexto para a lista de skills), OpenAI sobre simplificar skills (raiz como roteador mínimo), Antigravity/Gemini CLI.
- **Android oficial:** mudanças de comportamento do Android 16 e 17, edge-to-edge, adaptive, acessibilidade e testes (Compose 1.8), haptics, contraste do usuário (`UiModeManager.getContrast`), MotionScheme, Macrobenchmark, e o repositório oficial **android/skills** (que de propósito não cobre o básico e foca onde LLMs erram - por isso a v2 delega a ele em vez de duplicar).
- **GitHub:** Impeccable (vocabulário de comandos + detector determinístico de 62 regras, ~93k estrelas), compose-skill/compose-expert (referências ancoradas em código-fonte), yschimke/skills (renderizar previews para o agente ver), ui-design-skills (âncoras nomeadas, lista de proibições, checklist de verificação).
- **Reddit e comunidade:** "All vibecoded apps look the same" (padrões genéricos e como fugir), erros comuns de agentes em Compose no r/androiddev, transições bonitas que parecem lentas no r/UX_Design, reação mista ao M3 Expressive.

Lista completa e datada: `skills/android-premium-craft/research/sources.md`; o que é prova vs. opinião: `research/evidence.md`.

## 4. O que a v2 entrega

| Área | v1.2 | v2.0 |
|---|---|---|
| Estrutura | SKILL.md + 10 referências | SKILL.md roteador (167 linhas) + **30 módulos em 11 grupos** + pesquisa |
| Direção visual | "dark premium" fixo | **10 âncoras estéticas** com receita completa + catálogo anti-slop com teste do "olho semicerrado" |
| Design system | template curto | Cor (papéis, contraste, dark, semânticas, gráficos), tipografia (escala M3, numerais tabulares, 200%), forma/espaço/elevação, ícones/imagem, tokens em código, `CraftTheme.kt` pronto que passa no próprio teste de contraste |
| Componentes | checklist genérico | Navegação + predictive back, catálogo de componentes, formulários/IME/autofill, estados e haptics, microcopy/i18n/RTL, dashboards e gráficos |
| Plataforma | AGP/screenshot | Obrigações por targetSdk 35/36/37, travas de versão para APIs Expressive/Styles/MediaQuery, Wear/TV/Auto/XR/widgets, mapa para Views/Flutter/RN/CMP |
| Ver o próprio trabalho | não havia | Loop visual (previews → PNG, adb, Maestro MCP) + `device_matrix.py` com 14 perfis que **restaura o aparelho** |
| Lint | 6 dicas | **39 regras** com ids, severidade, correção e link do módulo; supressão por comentário; saída Markdown/JSON/**SARIF** (GitHub code scanning) |
| Contraste | só cores opacas | composição `#AARRGGBB` + checagem de **todos os pares de papéis** do tema |
| Probe | AGP | SDKs, BOM, Material 3, Kotlin, bibliotecas, Compose/Views/híbrido, flags do manifest, obrigações da plataforma |
| Gate de release | 7 checagens | v2 com `states`, `adaptive`, `not_applicable`, issues P0-P3, decisões `blocked`/`incomplete`/`ready_for_visual_review`/`verified_for_scope`; aceita relatórios v1 |
| Crítica | "≤ 5 problemas" | Rubrica de 10 dimensões com âncoras 0-4 (perfil, nunca média), severidade, formato de relatório |
| Distribuição | instalador por projeto | + manifestos de plugin Claude/Codex, Antigravity, snippet sempre ativo para `AGENTS.md` |
| Prova | 3 arquivos de teste | **42 testes**, 9 cenários de eval (incluindo um negativo), app-fixture "desleixado", validador da especificação |

## 5. Sobre o "300% melhor"

Em volume e capacidade a v2 é muito maior (≈ 6x o conteúdo de referência, 39 regras contra 6 dicas, 4 ferramentas novas). Mas **qualidade de skill só se prova com eval**: rode os cenários de `evals/evals.json` com e sem a skill no mesmo modelo (protocolo em `evals/README.md`) e registre em `RESULTS.md`. É esse número, não a contagem de linhas, que pode sustentar o título de referência nº 1.

## 6. Próximos passos

1. Rodar os evals e publicar o `RESULTS.md` (é o que sustenta o título de referência).
2. Adicionar screenshots antes/depois de um app real no README; as imagens atuais são mockups ilustrativos.
3. Confirmar a licença Apache-2.0 (a mesma das skills oficiais do Android) ou trocar.

# CoreFlow — Roadmap ativo

## Redesign visual premium solicitado em 03/11/2026

- [x] Pesquisar referências atuais de apps conhecidos no iOS e traduzir os padrões para as telas reais do CoreFlow, sem importar imagens alheias ao produto.
- [x] Aplicar uma direção visual coerente a Hoje, Programas, Pausas, Evolução, Perfil, Vácuo, Discreto, onboarding, Wear, player e overlays, preservando a navegação e a ordem de conteúdo existentes.
- [x] Corrigir o modal de edição do Perfil, que ficava invisível dentro da aba transformada; regressão RED/GREEN registrada em `diagnostics/e09-2-profile.test.cjs`.
- [x] Verificar telas e sobreposições no emulador Android API 36 e executar `bash scripts/check.sh`.
- [ ] Revisar em aparelho físico, TalkBack e relógio Wear OS; esta entrega não foi homologada nesses dispositivos.

Evidências, referências iOS e limites desta rodada: registro de execução de 03/11/2026 em `docs/roadmap/execucao.md`.

## Continuação do Fluxo aprovada em 12/11/2026

- [x] Estender a direção visual aprovada às práticas, cards dinâmicos, diálogos, sessões e overlay nativa, preservando callbacks, dados, protocolos e integração com o Galaxy Watch.
- [x] Conferir paridade dos HTMLs, regressões/verificações do projeto e apresentação visual em dispositivo disponível.

## Redesign integral Fluxo e release 1.1.52 — 12/11/2026

- [x] Consolidar o protótipo aprovado como referência para Hoje, Programas, Pausas, Evolução, Perfil, práticas, sessões, diálogos e pílulas.
- [x] Aplicar a identidade Fluxo às telas WebView e à overlay Android, mantendo recursos locais, atribuição/licença PulsoIcon, callbacks, dados, IDs, armazenamento, protocolos e integração com Wear OS.
- [x] Conferir o inventário de telas e o diff de produção; documentar limites do QA e preservar alterações locais que não fazem parte do release.
- [x] Atualizar regressões, versão e notas para `1.1.52` (`versionCode 52`); executar `bash scripts/check.sh` e inspeção visual no emulador.
- [x] Produzir APKs assinados de app e Wear pelo workflow oficial, conferir versão/assinatura contra `v1.1.51` e publicar a release `v1.1.52` no GitHub.
- [x] Confirmar assets e URLs da release; devolver o workflow ao estado desativado anterior.

## Ajuste incremental de animações e controles — 13/11/2026

- [x] Animar a troca real entre telas em 180 ms e respeitar movimento reduzido no app e no Android; não repetir a animação ao selecionar a tela atual.
- [x] Animar mudanças de estado da overlay nativa em 180 ms, respeitando a preferência de movimento reduzido e a escala de animação do sistema.
- [x] Refinar botões secundários, ação principal e atalhos para melhorar proporção, hierarquia e feedback ao toque, preservando destinos e ações existentes.
- [x] Atualizar regressões; todos os 80 diagnósticos, testes unitários Android, builds debug de app/Wear, paridade HTML e `git diff --check` passaram.
- [x] Instalar e conferir via ADB no AVD `Pixel_10a` (API 37): onboarding, Hoje, Programas, Evolução e navegação com toques rápidos; nenhum treino iniciado.
- [ ] Conferir a overlay durante um treino ativo, aparelho físico, TalkBack e Wear OS.

Esta rodada não altera versão nem publica release. `bash scripts/check.sh` não pôde iniciar neste ambiente; diagnósticos, tarefas Gradle e verificações de paridade foram executados diretamente. Detalhes em `docs/roadmap/execucao.md`.

## Identidade CoreFlow e onboarding — 13/11/2026

- [x] Registrar o contexto do produto em `PRODUCT.md` e a identidade visual em `DESIGN.md`, reconhecidos pelo contexto Impeccable; manter o launcher da skill como entrada no Windows.
- [x] Corrigir contraste das opções do onboarding, alinhar estado selecionado, progresso e marca do cabeçalho ao azul de ação e preservar `index.html` idêntico ao asset Android.
- [x] Gerar APK debug, instalar por ADB no AVD API 36 limpo e conferir onboarding, seleção, avanço de etapas e tela Hoje.
- [ ] Homologar em aparelho físico, TalkBack, Wear OS e overlay durante uma atividade.

O Pixel_10a API 37 mantém dados e app instalados. O Package Manager desse AVD reteve a sessão 1196442191; os logs registraram ausência do serviço `persistent_data_block`, timeout do verificador e falha ao renomear `install_sessions.xml`. A validação prosseguiu no AVD API 36, sem apagar dados do Pixel_10a. O APK debug não foi publicado nem teve versão alterada.

---

## Redireção do DESIGN.md — 13/11/2026

- [x] Reescrever a direção visual com base nas práticas, fases, controles e recursos locais reais do CoreFlow; remover slogans e padrões genéricos de cartão, ícones coloridos e telas de marketing.
- [ ] Aplicar a direção revisada na WebView e na overlay, preservando os fluxos atuais; este pedido alterou apenas a especificação.

## Direção do CoreFlow baseada na Apple HIG — 13/11/2026

- [x] Consultar as páginas oficiais Apple sobre princípios, iOS, cor, layout, materiais, tipografia, movimento, feedback, acessibilidade, escrita, abas e folhas.
- [x] Refazer `DESIGN.md` a partir dos princípios Apple HIG e consolidar os tokens após o questionário.
- [x] Conduzir o questionário de 18 escolhas e registrar as respostas do usuário.
- [x] Finalizar `DESIGN.md` conforme respostas: caderno de prática, verde profundo e marfim, cartões suaves, ilustrações instrucionais, AMOLED padrão e respiração sincronizada.
  - [ ] Escolher uma das três composições da tela Hoje em docs/design/mockups-coreflow-opcoes-2026-11-13/.
  - [ ] Aplicar a direção na WebView/overlay e conferir no AVD, preservando Android e fluxos atuais.

## Nova frente solicitada em 21/10/2026 — Pílulas e pausas de trabalho

- [x] Preparar diagnóstico e plano de execução das dimensões das pílulas e da rotina opcional de pausas no trabalho.
- [x] A0-parcial — Aprovar a opção A apenas para a fileira compacta: timer, Pausar/Continuar e Cancelar em 76 × 52 dp.
- [x] A1-parcial — Aplicar medidas iguais, intervalos de 4 dp e rótulos simples no compacto; regressão focada aprovada.
- [ ] A1–A2 — Conferir larguras menores e fonte ampliada, validar runtime/acessibilidade e aceite visual; auditoria A1 passou, enquanto os demais estados aguardam aprovação.
- [x] B0–B1 — Implementar a rotina configurável no app e integrá-la ao agendador Android existente; diagnósticos e builds passaram.
- [x] B2 — Ligar os lembretes às orientações e à mobilidade existentes, com início deliberado.
- [ ] B3 — Testes, diagnósticos, builds e auditoria passaram; falta validar notificações e permissões em runtime, reinício/fuso e aparelho real.

Detalhamento, critérios e fontes: [roadmap de pílulas e pausas de trabalho](docs/roadmap/pilulas-e-pausas-trabalho-2026-10-21.md). A [opção A compacta aprovada](docs/design/pilulas-overlay-2026-10-25/01-opcoes-compactas.png) define somente essa fileira; os demais estados aguardam aprovação. Rotina de trabalho implementada; verificação de runtime em dispositivo `NOT_RUN`.

---

## Prioridade solicitada em 18/10/2026 — Corpo, Respiração e modo flutuante

Base remota verificada: `main`/`origin/main` em `cbb9be0` (1.1.46/46). Cabeçalho abaixo preservado como contexto anterior.

- [x] Preparar diagnóstico estático, roadmap e três pranchas de referência; planejamento apenas, sem correção do produto.
- [x] CP0 — Referências aprovadas/corrigidas e matriz reproduzida no emulador Pixel 9 com APK 1.1.46/46; homologação física pendente.
- [ ] CP1 — Regressões RED e rastreamento dos assets/payload nativos.
- [ ] CP2 — Cancelar explícito e confirmação no overlay; limpeza consistente da sessão.
- [ ] CP3 — Guias e sequências dos quatro alongamentos, web e Android.
- [ ] CP4 — Respiração em caixa/igual/longa/personalizada com movimento sincronizado e acessível.
- [ ] CP5 — Gate integrado, auditoria independente e homologação física.

Plano, dependências, critérios e limites: [Pausas e flutuante — 18/10](docs/roadmap/pausas-flutuante-2026-10-18.md). Referências: [pranchas revisadas](docs/design/pausas-2026-10-18/). Direção visual aprovada; reprodução de exercícios/overlay no emulador concluída em 18/10. Homologação física `NOT_RUN` e revisão visual final `PENDING_HUMAN`.

---

**Atualizado:** 13/11/2026.
**Release atual:** 1.1.52 — redesign integral Fluxo para WebView e overlay Android.
**Foco:** homologação da overlay durante sessão ativa, TalkBack, aparelho físico e Wear OS.
**Estado:** release 1.1.52 publicada; ajustes locais de identidade e onboarding validados em AVD API 36, sem release; homologação física/acessibilidade pendentes.

## 1. Procedimento obrigatório para qualquer IA

1. Trabalhar em `C:\Users\notefael\projetos\Adbm`; ler `AGENTS.md`, este documento e o último registro de [execução](docs/roadmap/execucao.md).
2. Inspecionar `git status --short`; preservar trabalho concorrente.
3. Ler [especificação e plano E15](docs/roadmap/bracing-8-semanas-v2.md) e a [fonte fornecida](docs/roadmap/fontes/TREINO_BRACING_8_SEMANAS.md).
4. Selecionar a primeira tarefa pendente com dependências cumpridas. Escrever e executar regressão falhando antes de mudar comportamento.
5. Implementar uma tarefa por vez. Manter `index.html` e `app/src/main/assets/index.html` idênticos.
6. Executar testes focados e `bash scripts/check.sh` com JDK e Android SDK; revisar diff e pedir auditoria independente para mudança material.
7. Marcar `[x]` somente com evidência da tarefa. Registrar comando, resultado, arquivos, lacunas e próximo passo em `docs/roadmap/execucao.md`.
8. Não confundir imagem gerada com aprovação visual, teste Node com aparelho físico ou declaração histórica com verificação atual.

Estados: PENDENTE, EM EXECUÇÃO, BLOQUEADA, CONCLUÍDA. Gates não executados: NOT_TESTED.

## 2. Histórico preservado

As seções concluídas saíram do backlog ativo. Nenhum código, imagem antiga ou registro de execução foi apagado.

- [Snapshot integral do roadmap anterior](docs/arquivados/2026-10-10/ROADMAP-antes-bracing-v2.md): preserva inclusive declarações de conclusão e itens mistos, sem validar novamente essas declarações.
- [Índice do arquivamento de 10/10](docs/arquivados/2026-10-10/README.md): AJUSTES, PAUSAS-FLUT, E14, FUTURA 2 e partes concluídas de E13/FUTURA 3.
- [Etapas antigas E00–E12](docs/arquivados/roadmap-etapas-concluidas.md).
- [Execução completa](docs/roadmap/execucao.md) e [histórico anterior](docs/roadmap/historico-2026-09-19.md).

E14 fica SUPERSEDIDA como especificação do Bracing. A tentativa registrada em 09/10 está no código, mas não representa aceite de E15. Este plano prevalece em conflitos de conteúdo; não apaga histórico.

## 3. E15 — Bracing de 8 semanas

**Decisão de Rafael, 11/10:** 2 treinos diários em 7 dias por semana, com ajuste manual de semana/dia restaurado. Esta configuração substitui a frequência anterior; repetições e descansos individuais permanecem. Evidência diária passa a distinguir cada sessão/fase sem apagar registros antigos.

- [x] E15-AJUSTE — Frequência 2×7 e ajuste manual persistente: regressões, gate técnico e reauditoria PASS em 11/10; execução física pendente; release 1.1.44 publicada com APKs assinados, README e certificados compatíveis. Evidência: `docs/roadmap/execucao.md` e `docs/roadmap/bracing-ajuste-2026-10-11-check.log`.

Contrato detalhado, matriz semanal, arquivos, APIs propostas, regressões e critérios: [bracing-8-semanas-v2.md](docs/roadmap/bracing-8-semanas-v2.md).

- [x] CP0 — Inspecionar fonte, implementação atual e divergências; preservar snapshot e atualizar planejamento. Evidência: registro de 10/10.
- [x] CP1 — Catálogo único BR-01 a BR-08 e matriz exata das 8 semanas.
- [x] CP2 — Player por repetição/lado, descansos e duas voltas; uma sessão diária, com divisão opcional sem duplicar volume.
- [ ] CP3 — Guia, detalhes e player usam o mesmo catálogo; sequência de imagens legível e acessível.
- [x] CP4 — Progresso e avaliação técnica de cinco itens; preservação dos dados antigos.
- [ ] CP5 — Integração WebView/overlay/Wear, regressões e gate completo.
- [ ] CP6 — Auditoria independente, revisão visual e homologação física.

As imagens de CP3 podem ser preparadas antes de CP1/CP2; isso não conclui integração nem aprovação visual.

## 4. E13 — Validação integrada Android (pendências)

Estado: EM VALIDAÇÃO FÍSICA. Itens antes marcados concluídos preservados no snapshot.

- [ ] Testar no Galaxy S25 Ultra físico: gestos, rotação, bloqueio de tela, segundo plano e One Hand Operation+.
- [ ] Validar Galaxy Watch físico: reconexão Bluetooth e vibração háptica.
- [ ] Consolidar evidência física e auditoria final em `docs/roadmap/execucao.md`.

## 5. FUTURA 3 — Homologação de hardware

Estado: EM VALIDAÇÃO FÍSICA. Declarações anteriores de TalkBack e Google Play preservadas no snapshot.

- [ ] S25 Ultra: recorte da câmera frontal e fluidez sob 120 Hz dinâmicos.
- [ ] Samsung/Doze: resiliência à suspensão de bateria da One UI.
- [ ] Registrar resultados físicos; sem aparelho, manter NOT_TESTED.

## 6. Limites e arquivos de referência

- Android/WebView e Wear OS permanecem na arquitetura atual.
- IDs `'1'` Bracing, `'2'` Kegel, `'3'` Vacuum e histórico existentes preservados.
- Não alterar protocolo, armazenamento ou migração sem decisão documentada e teste.
- WebView somente com recursos locais; sem permissões web, conteúdo misto ou navegação externa.
- Versão pelo par `CORE_FLOW_VERSION_CODE`/`CORE_FLOW_VERSION_NAME`. Nenhum bump nesta entrega documental.
- Releases somente com as quatro variáveis de assinatura release; sem debug.
- Bridge: `app/src/main/java/com/example/MainActivity.kt`.
- Timer: `WorkoutForegroundService.kt` e `WorkoutSessionPlayer.kt` no mesmo diretório.
- Overlay: `WorkoutOverlayController.kt`; Wear: `WearHapticsRelay.kt` e `wear/`.
- Validação: `scripts/check.sh`.

## 7. Rastreabilidade documental
<!-- Convenção de SHA verificada por scripts/check-doc-sha.sh -->
- `base_sha=666e24a6f64c84c265fa46644efbaa089847823c`
- `behavioral_target_sha=666e24a6f64c84c265fa46644efbaa089847823c`
- `documentation_parent_sha=51041a9c95cd329a9b67dfbfb13f74ed07e573f5`

Snapshot desta reconciliação: HEAD `f08ff31bc8c30acdc3832636f075ea748a18118e`. Os SHAs acima são históricos preservados; não são evidência de testes atuais.

## 8. Correção solicitada em 17/10 — players de Pausas

- [x] Guia dos quatro alongamentos trazido à vista, referências ilustradas locais, estado inicial e troca de lado corretos; Pausar/Continuar individual e Cancelar no guia. Regressões em `diagnostics/pause-player-controls.test.cjs`.
- [x] Cancelar explícito no player diário, na respiração e no modo OLED; pausa/retomada do circuito encaminhadas ao motor nativo sem segundo timer web.
- [ ] Revisão visual/homologação física e aprovação das imagens: PENDING_HUMAN. Imagens estáticas com indicador animado; demonstração anatômica animada não implementada.
- [ ] Gate completo: bloqueado por divergência preexistente README/versão (`version-contract.test.cjs`). Evidência em `docs/roadmap/pausas-player-check.log`.

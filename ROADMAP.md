# CoreFlow — Roadmap ativo

**Atualizado:** 10/10/2026.
**Foco:** E15 — Correção do Bracing de 8 semanas, conforme o documento fornecido por Rafael.
**Estado:** implementação funcional verificada; aprovação visual das imagens novas e homologação física PENDENTES.

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

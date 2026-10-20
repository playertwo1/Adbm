# Pausas e atividades flutuantes — correção e referências

Data: 18/10/2026. Direção das referências aprovada por Rafael com correções aplicadas em 18/10. Reprodução de CP0 concluída no APK 1.1.46/46 instalado no emulador Pixel 9; achados reproduzidos registrados em `docs/roadmap/execucao.md`. Validação física e visual final continuam pendentes.

## Base verificada

- `git fetch origin --tags` executado. `main` e `origin/main`: `cbb9be0`, versão local 1.1.46/46. Não havia atualização de main para integrar; nenhum reset/stash/overwrite.
- Existem alterações locais de 17/10 em HTML, imagens, testes e documentação. Elas não estão no commit publicado e foram preservadas. O APK instalado no aparelho não foi inspecionado: versão efetivamente testada pelo usuário ainda desconhecida.
- `WorkoutOverlayController.kt` constrói o overlay Android separado do guia HTML. Seus controles expandidos oferecem Pausar/Continuar e Pular; falta Cancelar textual.
- O overlay abre `currentStep.image` pelos assets; caminho vazio, erro ou bitmap inválido ocultam a imagem silenciosamente. Investigar o payload de cada entrada antes de atribuir causa definitiva à ausência de imagens.
- O atlas CSS local de Pausas não é automaticamente consumido pelo ImageView nativo. A correção web anterior não prova correção do overlay.
- `BreathVisualView` desenha quadrado/círculo nativos; o visual web tem implementação separada. O relato de baixa qualidade e falhas no aparelho exige reprodução.
- Gate no snapshot inicial de 18/10: `scripts/check.sh` interrompido no contrato README versus 1.1.46/46. Log histórico: `pausas-flutuante-2026-10-18-check.log`. Esse resultado foi supersedido em 20/10 pelo gate completo attempt11, registrado no Estado de entrega e em `docs/roadmap/execucao.md`.

## Direção proposta para aprovação

Preservar identidade escura, cores por atividade, arquitetura WebView/Android/Wear, IDs, armazenamento e dosagens. Ilustrações de corpo inteiro com cadeira/pés visíveis; fase, lado, tempo e instrução curta sempre legíveis. Movimento serve para orientar, sem partículas decorativas.

Referências em `../design/pausas-2026-10-18/`:

1. `01-flutuante-controles.png`: expandido corporal e respiratório, compacto, mini e confirmação de cancelamento; “Recolher” e “Cancelar” separados e histórico anterior explicitamente preservado.
2. `02-corpo-storyboard.png`: os quatro alongamentos existentes em preparar → movimento suave → retornar; lados direito/esquerdo visíveis para posições assimétricas, sem espelhamento contraditório.
3. `03-respiracao-storyboard.png`: em caixa, igual, expiração longa, personalizado, pausa e movimento reduzido; ícone Pausar coerente com o rótulo.

São imagens conceituais geradas, não screenshots nem animações prontas. O documento prevalece sobre inconsistências da imagem: compacto em andamento usa **Pausar**; **Continuar** somente pausado. O X nunca tem significado ambíguo: recolher e cancelar são ações distintas. Cancelar não apaga histórico anterior nem registra conclusão; não prometer perda de todo progresso. Na abertura peitoral manter cabeça neutra, sem reproduzir a extensão cervical exagerada da referência. Rever postura e anatomia antes de produzir assets finais; a aprovação estética não equivale à validação clínica.

## Contrato de comportamento proposto

- Expandido: guia visível, Pausar/Continuar, Pular quando aplicável e Cancelar textual. Compacto: miniatura/estado, tempo, Pausar/Continuar e Cancelar. Mini: tempo/atividade e Abrir; um toque leva aos controles sem perder estado.
- Cancelar abre confirmação dentro do overlay, sem exigir voltar ao app. Enquanto confirma, pausar a sessão e a animação; desistir retoma apenas se estava rodando. Confirmar envia a ação de cancelamento existente, limpa overlay/notificação/som/vibração e permite iniciar de novo. Não registrar conclusão ou duplicar histórico parcial; preservar regras atuais de registros.
- Negar permissão de sobreposição mantém treino normal funcionando. Arrastar e alternar tamanho não podem disparar controles acidentalmente. Sem recolhimento automático enquanto confirmação aberta ou controle em uso.
- Uma fonte de tempo: motor nativo quando a sessão é nativa; renderer observa estado, não cria timer concorrente. Pausa congela animação e relógio; retomada continua do ponto correto.
- Respiração em caixa percorre quatro arestas; igual/longa usam expansão/contração suave; personalizado omite retenção/pausa de duração zero. Reutilizar durações atuais sem inventar protocolo. Movimento reduzido usa figura estática, fase e contador.
- Asset ausente mostra orientação textual explícita e fallback local, nunca área silenciosamente vazia. Imagens empacotadas e disponíveis offline.
- Demais atividades (Bracing, Kegel, Vácuo e pausa responsiva) entram na matriz de controles e não regressão; novos catálogos anatômicos desses programas ficam fora desta rodada de imagens de Corpo/Respiração.

## Roadmap executável — uma tarefa por vez

### CP0 — Aprovação e reprodução (sem dependência)
- [x] Aprovar/corrigir as três pranchas e o contrato acima; Rafael aprovou o restante da direção e pediu as correções registradas em 18/10; aplicadas às referências.
- [x] Identificar versão do APK e reproduzir Corpo individual/circuito, quatro modos de respiração e pausa responsiva em primeiro plano e sobre outro app no emulador Pixel 9; detalhes em `docs/roadmap/execucao.md`.
- [x] Registrar aparelho/Android, passos, tamanho do overlay, resultado esperado/observado e screenshots sem dados pessoais em `docs/roadmap/execucao.md`.
CHECKPOINT: matriz reproduzível; falhas não observadas ficam NOT_RUN, nunca presumidas corrigidas.

### CP1 — Regressões e contrato de assets (depende CP0)
- [x] Antes de alterar comportamento, criar regressão RED para Cancelar no overlay e asset ausente na etapa de alongamento; RED registrado em `docs/roadmap/execucao.md`.
- [x] Inspecionar construção do payload e `WorkoutForegroundService.kt`; `image` já existe no passo nativo, mas `startStretchTimer` não o serializa. O atlas local existe em raiz/Android; nenhum campo/protocolo novo necessário.
- [x] Cobrir caminho vazio/inválido, decode inválido, imagem da etapa anterior e transição entre corpo/respiração em `WorkoutOverlayTest`; validar GREEN junto da integração CP3.
CHECKPOINT: teste falha pela causa reproduzida, com log salvo; não usar só busca textual como prova de funcionamento.

### CP2 — Cancelamento em todas as superfícies (depende CP1)
- [x] Implementar confirmação e Cancelar textual no overlay expandido/compacto usando comando existente do serviço.
- [x] Unificar resultado de cancelar pelo app, overlay e notificação; verificar estado pausado, em andamento e confirmação abandonada.
- [x] Preservar no Vácuo o botão existente Encerrar Retenção com Segurança e `ACTION_SAFE_EXIT_RETENTION` (recuperação pausada), distinto de cancelar/encerrar serviço. Testar abrir/desistir/confirmar cancelamento durante retenção; não substituir saída segura por `ACTION_STOP` nem retomar retenção automaticamente ao fechar confirmação. Reutilizar semântica segura existente e registrar qualquer conflito antes de implementar.
- [x] Regressão GREEN: cancelamento idempotente, sem conclusão falsa, sessão pode reiniciar, notificação/overlay/haptics encerrados.
CHECKPOINT: testes focados e demonstração Android dos três tamanhos; auditoria independente dos comandos/estado.

### CP3 — Guias corporais (depende CP2 e aprovação visual CP0)
- [ ] Produzir assets finais separados por exercício/lado e sequência aprovada; revisar alinhamento, amplitude e instruções existentes.
- [ ] Integrar nos quatro alongamentos web e nativos; escolher formato compatível com Android mínimo e cache com memória limitada. Não fazer decode de bitmap a cada atualização do timer.
- [ ] Animar preparar/entrar/manter/sair como orientação sincronizada; não sugerir repetição contínua durante alongamento sustentado. Pausar congela quadro; movimento reduzido conserva figura estática.
- [ ] Conferir recorte em miniatura e expandido, ambos os lados e fallback offline; copiar assets para raiz/Android com hashes iguais.
CHECKPOINT: nenhum dos quatro exercícios sem guia; corpo inteiro legível; revisão humana de postura pendente até aceite explícito.

### CP4 — Respiração (depende CP3)
- [ ] Implementar direção aprovada em HTML e `BreathVisualView`, com fases/durações reais e continuidade ao mudar tamanho ou voltar ao app.
- [ ] Cobrir caixa, igual, longa, personalizado, durações zero, pausa, retomada, cancelamento, segundo plano e movimento reduzido.
- [ ] Labels não dependem somente de cor; alvos de toque >=48dp no Android, contraste de texto >=4.5:1 e TalkBack descreve ação/estado sem anunciar cada frame.
CHECKPOINT: animação acompanha motor e fica imóvel na pausa; vídeo curto real em Android, sem alegar fluidez por imagens estáticas.

### CP5 — Gate integrado e homologação (depende CP4)
- [x] Resolver separadamente divergência documental README/versão sem bump indevido; repetir `bash scripts/check.sh` com JDK/SDK definidos e salvar exit code real. README/Gradle/APK concordam em 1.1.46/46; attempt11, após esta atualização documental, registrou exit 0 e `CHECK PASS` em `docs/roadmap/evidence/cp5-full-check-2026-10-20-attempt11.log`.
- [x] Verificar HTML byte-idêntico, hashes de assets, `git diff --check`, testes app e builds debug app/Wear. Evidência/hash atual em `docs/roadmap/execucao.md` (20/10).
- [ ] Testar Galaxy S25 Ultra: sobre outro app, arrastar, limites da tela, fonte ampliada, rotação, bloqueio/desbloqueio, Doze, permissão negada/revogada e retorno à WebView.
- [x] Emulador: smoke de Bracing quick action → timer ativo → Cancelar restaura `02:00`/“Manter Postura 2min”; flow 78, JUnit 1/1 e capturas em `docs/roadmap/evidence/maestro-cp5/76-bracing-cancel/`. Inspeção humana das capturas e aceitação visual do produto continuam pendentes.
- [x] Emulador: Kegel Velocidade e Resistência — início, pausa sem avanço, retomada e cancelamento com estado inicial restaurado; flows 80–87 e capturas em `docs/roadmap/evidence/maestro-cp5/80-kegel-speed-cycle/` e `83-kegel-resistance-open/`.
- [x] Emulador: Vácuo — Cancelar no overlay expandido durante recuperação, sem concluir a sessão; configuração preservada e serviço encerrado (flows 91, 93–96). A saída segura da retenção não foi acionada neste smoke; ela permanece uma ação separada, coberta pela evidência CP2.
- [ ] Emulador: regressão atual de Wear; o AVD de telefone não substitui validação em relógio físico.
- [ ] Auditoria independente final e aceite humano com screenshots/vídeos da versão candidata; sem aparelho manter NOT_RUN/PENDING_HUMAN.
CHECKPOINT: só fechar com evidências técnicas e visuais distintas. Release/assinatura/instalação/publicação em etapa autorizada própria.

## Estado de entrega

CP0–CP2 concluídos tecnicamente. CP3 tem regressões GREEN, assets locais iguais e matriz Maestro nativa registrada; revisão visual/postural final continua `PENDING_HUMAN`. CP4 tem cobertura técnica e fluxos Maestro para os quatro modos de respiração, mas o aceite visual integral/fluidez permanece pendente. No CP5, as tarefas técnicas do gate estão concluídas: `scripts/check.sh` attempt11 terminou com exit 0/`CHECK PASS`, HTML raiz/Android e cinco pares de assets estão iguais, e `git diff --check` passou. A matriz de aparelho/emulador ainda é parcial: fonte ampliada, paisagem, retorno após tela apagada, Chrome, negação AppOps, Doze forçado por 12 s e os dois limites do overlay foram examinados; o gesto no emulador usou `adb input` com verificação visual/cancelamento por Maestro, pois os swipes Maestro passaram sem alterar a posição. Bracing tem smoke limitado no emulador para início/cancelamento (flow 78); Kegel Velocidade e Resistência têm smoke de pausa, retomada e cancelamento (flows 80–87); Vácuo tem Cancelar confirmado no overlay durante recuperação (flows 91, 93–96), sem chamar a saída segura de retenção, já coberta separadamente em CP2. Wear continua pendente. CP5 não está fechado. Revisão humana/postural `PENDING_HUMAN`; Galaxy S25 Ultra físico `NOT_RUN`. Versão permanece 1.1.46/46; sem instalação física, bump ou publicação. As pendências anteriores de E15/E13 permanecem.

Auditoria independente do plano: achado P2 sobre saída segura de retenção incorporado em CP2. Não é auditoria de implementação nem aceite humano.

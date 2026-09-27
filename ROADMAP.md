# CoreFlow — Roadmap de Execução (Ativo e Enxuto)

**Atualizado:** 27/09/2026.
**Status Geral:** Etapas E00–E03, E05–E09, E11 e E12 foram implementadas e consolidadas na `main`. O checklist detalhado e os critérios de aceite das etapas concluídas estão arquivados em [`docs/arquivados/roadmap-etapas-concluidas.md`](docs/arquivados/roadmap-etapas-concluidas.md). Histórico anterior a 19/09 preservado em [`docs/roadmap/historico-2026-09-19.md`](docs/roadmap/historico-2026-09-19.md).
**Foco Atual:** E13 (Validação integrada e Android), reconciliada com a `main`, englobando os itens pendentes diferidos de E04, validações de acessibilidade/hardware real e pendências técnicas de E10 e E12. Rafael conduzirá testes em aparelho físico real. Ver registros em [`docs/roadmap/execucao.md`](docs/roadmap/execucao.md) e auditorias em [`docs/roadmap/auditorias.md`](docs/roadmap/auditorias.md).
**Planejamento Futuro:** Adicionada especificação da etapa futura "Modo Treino Flutuante" (overlay nativo sobre outros apps).

---

## 1. Procedimento obrigatório para o agente
1. Ler este plano, verificar Git e ler o último registro de execução em [`docs/roadmap/execucao.md`](docs/roadmap/execucao.md).
2. Escolher a primeira tarefa pendente com dependências satisfeitas.
3. Confirmar arquivos, funções e comportamento no código antes de editar.
4. Implementar uma tarefa por vez. Preservar alterações existentes.
5. Executar seu aceite; registrar comando/cenário, resultado e evidência.
6. Marcar checkbox somente após implementação e verificação.
7. Ao encerrar, registrar próximo passo exato, arquivos alterados e bloqueios.

**Estados:** PENDENTE, EM EXECUÇÃO, BLOQUEADA, CONCLUÍDA.
Sem teste exigido, não declarar conclusão. Bloqueio de aparelho não equivale a teste aprovado.
Código confirma comportamento; imagens orientam aparência; este plano define escopo.
Não inventar APIs, sensores, histórico, resultados de teste ou protocolo clínico.
Não mudar framework, IDs de programas ou armazenamento sem necessidade documentada.
Não reduzir critérios de aceite para fazer uma tarefa passar.
Se documentação histórica divergir do código, registrar e confirmar antes de mudar comportamento.

---

## 2. Arquivos confirmados
- **Interface:** `index.html` e `app/src/main/assets/index.html` (devem permanecer byte a byte idênticos).
- **Bridge/WebView:** `app/src/main/java/com/example/MainActivity.kt`.
- **Treino e Motor:** `app/src/main/java/com/example/WorkoutForegroundService.kt` e `WorkoutSessionPlayer.kt`.
- **Áudio:** `app/src/main/java/com/example/MindfulnessAudioService.kt`.
- **Lembretes:** `app/src/main/java/com/example/ReminderScheduler.kt`.
- **Watch:** `app/src/main/java/com/example/WearHapticsRelay.kt` e módulo `wear/`.
- **Regressão de progresso:** `diagnostics/progress-persistence.test.cjs`.
- **Check do projeto:** `scripts/check.sh` (executa diagnósticos, equivalência HTML e builds debug).
- **Registro de execução:** `docs/roadmap/execucao.md`.
- **Imagens de design:** `assets/design/coreflow-s25-ultra/` (inclui `11-treino-flutuante-material3.png`).

---

## 3. Resumo de Etapas e Status

| Etapa | Escopo | Status | Referência |
| :--- | :--- | :--- | :--- |
| **E00** | Baseline e inventário | **CONCLUÍDA** | [Arquivo Histórico](docs/arquivados/roadmap-etapas-concluidas.md#e00--baseline) |
| **E01** | Atalho e tempo real do vácuo | **CONCLUÍDA** | [Arquivo Histórico](docs/arquivados/roadmap-etapas-concluidas.md#e01--correções-do-vácuo) |
| **E02** | Persistência e migração | **CONCLUÍDA** | [Arquivo Histórico](docs/arquivados/roadmap-etapas-concluidas.md#e02--persistência-e-migração) |
| **E03** | Conteúdo e progressão clínica | **CONCLUÍDA** | [Arquivo Histórico](docs/arquivados/roadmap-etapas-concluidas.md#e03--conteúdo-e-progressão) |
| **E04** | Motor de sessão e recuperação | **ABERTA (Diferida para E13)** | Ver Seção 4.1 abaixo |
| **E05** | Componentes AMOLED e navegação | **CONCLUÍDA** | [Arquivo Histórico](docs/arquivados/roadmap-etapas-concluidas.md#e05--sistema-visual) |
| **E06** | Tela 03: Player de vácuo | **CONCLUÍDA** | [Arquivo Histórico](docs/arquivados/roadmap-etapas-concluidas.md#e06--tela-03-vácuo) |
| **E07** | Telas 06/07: Programas e detalhe | **CONCLUÍDA** | [Arquivo Histórico](docs/arquivados/roadmap-etapas-concluidas.md#e07--telas-0607-programas-e-detalhe) |
| **E08** | Telas 01/02: Onboarding e Hoje | **CONCLUÍDA** | [Arquivo Histórico](docs/arquivados/roadmap-etapas-concluidas.md#e08--telas-0102-onboarding-e-hoje) |
| **E09** | Tela 10: Perfil e preferências | **CONCLUÍDA** | [Arquivo Histórico](docs/arquivados/roadmap-etapas-concluidas.md#e09--tela-10-perfil) |
| **E10** | Telas 04/05: Discreto e Pausas | **CONCLUÍDA (com diferidos)** | [Arquivo Histórico](docs/arquivados/roadmap-etapas-concluidas.md#e10-itens-concluídos--telas-0405-discreto-e-pausas) e Seção 4.1 |
| **E11** | Tela 08: Mindfulness | **CONCLUÍDA** | [Arquivo Histórico](docs/arquivados/roadmap-etapas-concluidas.md#e11--tela-08-mindfulness) |
| **E12** | Tela 09: Evolução | **CONCLUÍDA (Integrada)** | [Arquivo Histórico](docs/arquivados/roadmap-etapas-concluidas.md#e12--tela-09-evolução) e Seção 4.1 |
| **E13** | Validação integrada e Android | **EM ANDAMENTO / ABERTA** | Ver Seção 4.1 abaixo |
| **FUTURA** | Modo Treino Flutuante (Overlay) | **NÃO INICIADO** | Ver Seção 4.2 abaixo |

---

## 4. Backlog Ativo e Etapas Futuras

### 4.1 Pendências Ativas

#### E04 / E13 — Motor de Sessão (Itens Pendentes Diferidos)
*Contexto:* Seis fases e “Encerrar retenção” já foram validadas no Pixel_9 (detalhes no arquivo histórico e em `docs/roadmap/execucao.md`). Os seguintes itens permanecem abertos para validação integrada:
- [ ] Pausa na retenção orienta sua saída; retomada não exige continuar apneia congelada.
- [ ] Bloquear alteração silenciosa de carga/postura em série ativa (validado em JS; pendente verificação integrada/aparelho físico).
- [ ] Encerrar salva parcial; não conclui automaticamente programa (validado registro parcial de 1s; pendente verificação de fluxo completo).
- [ ] Feedback fica associado ao ID; permitir não responder (validado em JS; pendente teste de UI integrada).
- [ ] Retomar estado do serviço após bloqueio, sem iniciar timer concorrente (validar ciclo de vida e recriação de processo).
- [ ] Cancelar sinais pendentes ao encerrar; evitar vibração duplicada.
*Critério de Aceite:* Sequência, tempo e estado idênticos nos fluxos Web e nativo; interrupção permanece parcial após reabertura.

#### E10 — Telas 04/05: Discreto e Pausas (Itens Pendentes/Diferidos)
- [ ] Posição/intensidade selecionam parâmetros revisados; prévia corresponde à execução. *(Diferido por Rafael até existir referência clínica revisada; nenhum parâmetro inventado).*
- [ ] Confirmar semântica e limites do modo `∞ Livre` (atualmente fixado em 300s por exercício).

#### E12 — Tela 09: Evolução (Pós-Integração e Qualidade)
- [ ] Investigar e solucionar artefatos visuais pretos observados no AVD Pixel_9 (qualidade visual bloqueada na validação smoke anterior).
- [ ] Realizar auditoria independente das alterações posteriores à E12.1.

#### E13 — Validação Integrada e Conclusão Android (Foco Ativo)
- [ ] Verificar equivalência byte a byte dos HTMLs e integridade dos assets locais.
- [ ] Executar regressões automatizadas novas e existentes (`for f in diagnostics/*.test.cjs; do node "$f"; done`).
- [ ] Confirmar sintaxe JavaScript e integridade do build Android (`.\gradlew.bat testDebugUnitTest assembleDebug`).
- [ ] Testar dez telas, navegação Voltar, fechamento de modais, teclado virtual, telas de erro, permissões em tempo de execução e operação offline.
- [ ] Capturar telas e comparar visualmente às referências AMOLED em `assets/design/coreflow-s25-ultra/`, registrando desvios intencionais.
- [ ] Validar acessibilidade: fonte ampliada do sistema, TalkBack, contraste AMOLED e redução de movimento.
- [ ] Testar comportamento no perfil S25 Ultra: gestos, rotação, bloqueio de tela, execução em segundo plano e retomada.
- [ ] Validar integração com Galaxy Watch: conexão, desconexão, reconexão, padrões de vibração e cancelamento.
- [ ] Testar atualização sobre instalação anterior e verificar preservação de posição, diário, preferências e backups.
- [ ] Compilação e validação em aparelho físico real (conduzida por Rafael).
- [ ] Gerar release assinada conforme [`SIGNING.md`](SIGNING.md) quando ambiente de chaves estiver disponível; registrar versão e limitações.

---

### 4.2 FUTURA — Modo Treino Flutuante

**Status:** NÃO INICIADO
**Referência visual:** `assets/design/coreflow-s25-ultra/11-treino-flutuante-material3.png`

#### Objetivo
Mostrar a sessão cronometrada atual sobre outros aplicativos Android usando um overlay flutuante. O overlay deve apenas exibir e controlar o estado existente.

#### Regras Proibitivas
- Proibido criar outro cronômetro;
- Proibido criar outro `ForegroundService`;
- Proibido disparar vibração própria;
- Proibido duplicar voz;
- Proibido duplicar sinais do Galaxy Watch;
- Proibido alterar regras dos exercícios.
`WorkoutForegroundService` continua sendo a fonte única da verdade do treino.

#### CP1 — Permissão e estrutura
- Alterar: `app/src/main/AndroidManifest.xml` (adicionar `android.permission.SYSTEM_ALERT_WINDOW`).
- Criar: `app/src/main/java/com/example/WorkoutOverlayController.kt`.
- Implementar:
  - verificar se permissão de overlay foi concedida;
  - abrir tela Android de autorização quando necessário;
  - nunca impedir o treino se a permissão for negada;
  - permitir criar, atualizar e remover o overlay.
- Checklist:
  - [ ] `SYSTEM_ALERT_WINDOW` declarado.
  - [ ] `WorkoutOverlayController.kt` criado.
  - [ ] Overlay pode ser exibido.
  - [ ] Overlay pode ser removido.
  - [ ] Negar permissão não impede treino normal.
  - [ ] Nenhum novo serviço ou timer criado.
- **Gate CP1:** PASS somente se treino funciona normalmente com overlay permitido e também com overlay negado.

#### CP2 — Sincronizar com WorkoutForegroundService
- Fonte obrigatória: Usar somente o estado de `WorkoutForegroundService.kt`.
- Consumir: `status`, `currentStepIndex`, `stepTimeLeft`, `steps`, `session`.
- Usar do passo atual: `title`, `instruction`, `badge`, `phase`, `series`, `isRest`.
- Alterar `WorkoutForegroundService.kt`: após cada atualização de estado, atualizar notificação, atualizar overlay e continuar enviando broadcast existente.
- Checklist:
  - [ ] Overlay mostra `stepTimeLeft` real.
  - [ ] Overlay mostra o passo real.
  - [ ] Mudança de etapa atualiza overlay.
  - [ ] Pausa atualiza overlay.
  - [ ] Retomada atualiza overlay.
  - [ ] Conclusão remove overlay.
  - [ ] Interrupção remove overlay.
  - [ ] Nenhum `setInterval`, `CountDownTimer` ou timer próprio no overlay.
- **Gate CP2:** PASS somente se WebView, notificação e overlay mostram exatamente o mesmo passo e tempo.

#### CP3 — Três estados visuais
Seguir Material Design 3 + AMOLED do CoreFlow.
- **Mini:** Mostrar somente ícone e `MM:SS` (exemplo: `◉ 00:14`).
- **Compacta:** Mostrar fase/ação atual, programa, série ou repetição quando houver e `MM:SS` (exemplo: `RETENÇÃO 00:14`, `Vácuo · Série 2/4`).
- **Expandida:** Mostrar programa, fase, série/repetição, ação atual, cronômetro, próximo passo e controles (Pausar/Continuar, Pular/Próximo, abrir CoreFlow; para retenção de Vácuo, usar ação segura existente).
- Checklist:
  - [ ] Mini implementada.
  - [ ] Compacta implementada.
  - [ ] Expandida implementada.
  - [ ] Toque expande.
  - [ ] Recolhimento funciona.
  - [ ] Overlay pode ser arrastado.
  - [ ] Overlay encaixa nas laterais.
  - [ ] Texto continua legível em fundo claro e escuro.
- **Gate CP3:** PASS somente se os três estados representam a mesma sessão sem alterar o estado do treino.

#### CP4 — Controles
Os botões do overlay devem chamar apenas ações existentes do serviço:
- Usar: `ACTION_PAUSE`, `ACTION_RESUME`, `ACTION_SKIP`, `ACTION_SAFE_EXIT_RETENTION` e `ACTION_STOP` (somente se houver ação explícita de encerrar).
- Regras: Overlay nunca altera diretamente `currentStepIndex`, `stepTimeLeft`, `steps`, histórico, minutos ou progresso.
- Checklist:
  - [ ] Pausar controla o serviço.
  - [ ] Continuar controla o serviço.
  - [ ] Pular controla o serviço.
  - [ ] Retenção usa saída segura.
  - [ ] Abrir app volta para `MainActivity`.
  - [ ] Não existe lógica duplicada de exercício no overlay.
- **Gate CP4:** PASS somente se controlar pelo overlay e controlar pelo CoreFlow produz o mesmo resultado.

#### CP5 — Preferência do usuário
Adicionar em Perfil / Preferências: "Modo Treino Flutuante".
- Opções: Ativar/desativar, tamanho padrão (Mini ou Compacta), recolher automaticamente e mostrar próximo passo.
- Persistir configuração existente junto ao restante das preferências do CoreFlow.
- Checklist:
  - [ ] Toggle persistente.
  - [ ] Tamanho persistente.
  - [ ] Auto-recolhimento persistente.
  - [ ] Próximo passo persistente.
  - [ ] Overlay não aparece quando desativado.
- **Gate CP5:** PASS somente se fechar e reabrir o app preserva todas as opções.

#### CP6 — Compatibilidade inicial
Primeira versão suporta somente sessões executadas por `WorkoutForegroundService`:
- Obrigatório validar:
  - [ ] Vácuo.
  - [ ] Kegel.
  - [ ] Bracing.
  - [ ] Demais programas que usam o mesmo contrato `steps`.
- Não incluir nesta etapa: Respiração Guiada baseada em timer JS, Pausas Ativas baseadas em timer JS, Pausa de Resposta e Mindfulness (esses fluxos ficam para fase futura).
- **Gate CP6:** PASS somente se todos os programas nativos suportados usam o mesmo overlay sem implementação específica de timer.

#### CP7 — Regressão e Gate final
Criar diagnóstico específico para overlay.
- Verificar:
  - [ ] não existe segundo timer;
  - [ ] vibração continua vindo de `AdvancedHapticsManager`;
  - [ ] Watch continua usando `WearHapticsRelay`;
  - [ ] voz continua vindo do serviço;
  - [ ] overlay não gera háptico;
  - [ ] negar permissão não gera crash;
  - [ ] pausar em uma interface pausa todas;
  - [ ] concluir sessão remove overlay;
  - [ ] reabrir app restaura o mesmo estado;
  - [ ] nenhuma sessão é registrada duas vezes.
- **Gate final:** PASS somente se:
  1. iniciar treino;
  2. minimizar CoreFlow;
  3. abrir outro aplicativo;
  4. overlay permanecer visível;
  5. passo e cronômetro continuarem corretos;
  6. vibração continuar funcionando;
  7. Galaxy Watch continuar funcionando quando habilitado;
  8. pausar pelo overlay pausar o mesmo treino;
  9. voltar ao CoreFlow mostrar o mesmo estado;
  10. finalizar treino remover imediatamente o overlay.

#### Resultado esperado
Arquitetura final:
`WorkoutForegroundService` → timer → voz → hápticos → Galaxy Watch → notificação → `WorkoutOverlayController`.
*Uma sessão. Um timer. Uma fonte de verdade.*

---

## 5. Registro para Retomada
Para cada tarefa executada, registrar detalhadamente em [`docs/roadmap/execucao.md`](docs/roadmap/execucao.md):
- Data, tarefa e estado.
- Referência Git e dependências confirmadas.
- Arquivos e símbolos alterados.
- Subitens concluídos.
- Comando ou cenário → resultado → evidência.
- Falhas anteriores versus novas.
- Decisões e justificativas técnicas.
- Bloqueios e dependentes afetados.
- Arquivos pendentes de commit.
- Próximo passo exato.

---

## 6. Limites Inegociáveis
- Preservar a arquitetura Android/WebView e módulo Wear OS.
- Não adicionar login, nuvem, sensores fictícios ou monetização sem especificação explícita.
- Não transformar números, fotos ou ícones ilustrativos dos mockups em informações falsas.
- Não apagar histórico anterior nem assumir itens como resolvidos sem teste executado.
- Manter paridade estrita entre `index.html` e `app/src/main/assets/index.html`.

---

## 7. Convenção de Rastreabilidade Documental
<!-- Convenção de SHA verificada por scripts/check-doc-sha.sh -->
- `base_sha=666e24a6f64c84c265fa46644efbaa089847823c`
- `behavioral_target_sha=666e24a6f64c84c265fa46644efbaa089847823c`
- `documentation_parent_sha=51041a9c95cd329a9b67dfbfb13f74ed07e573f5`

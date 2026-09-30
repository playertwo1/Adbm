# CoreFlow — Roadmap de Execução (Ativo e Enxuto)

**Atualizado:** 30/09/2026.
**Status Geral:** Etapas E00–E03, E05–E09, E11, E12 e FUTURA 1 (Modo Treino Flutuante CP1–CP7) foram implementadas e consolidadas na `main`. O checklist detalhado e os critérios de aceite das etapas concluídas estão arquivados em [`docs/arquivados/roadmap-etapas-concluidas.md`](docs/arquivados/roadmap-etapas-concluidas.md). Histórico anterior a 19/09 preservado em [`docs/roadmap/historico-2026-09-19.md`](docs/roadmap/historico-2026-09-19.md).
**Foco Atual:** E13 (Validação integrada e Android), reconciliada com a `main`, englobando os itens pendentes diferidos de E04, validações de acessibilidade/hardware real e pendências técnicas de E10 e E12. Rafael conduzirá testes em aparelho físico real. Ver registros em [`docs/roadmap/execucao.md`](docs/roadmap/execucao.md) e auditorias em [`docs/roadmap/auditorias.md`](docs/roadmap/auditorias.md) e [`docs/roadmap/auditoria-treino-flutuante.md`](docs/roadmap/auditoria-treino-flutuante.md).
**Planejamento Futuro:** Modo Treino Flutuante Fase 2 (Áudio Ducking, Convivência Multimídia e Sessões JS) e Homologação em Hardware Real S25 Ultra + Requisitos Google Play.

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
- **Overlay Flutuante:** `app/src/main/java/com/example/WorkoutOverlayController.kt`.
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
| **FUTURA 1** | Modo Treino Flutuante (Overlay CP1–CP7) | **CONCLUÍDA** | [Arquivo Histórico](docs/arquivados/roadmap-etapas-concluidas.md#futura--modo-treino-flutuante-overlay) e [Auditoria](docs/roadmap/auditoria-treino-flutuante.md) |
| **FUTURA 2** | Treino Flutuante Fase 2 (Áudio Ducking e Sessões JS) | **PLANEJADO** | Ver Seção 4.3 abaixo |
| **FUTURA 3** | Homologação Hardware Real (S25 Ultra / Google Play) | **PLANEJADO** | Ver Seção 4.4 abaixo |

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

### 4.2 FUTURA 1 — Modo Treino Flutuante (Overlay Nativo CP1 a CP7) — CONCLUÍDO

**Status:** CONCLUÍDO (28/09/2026) — Detalhamento arquivado em [`docs/arquivados/roadmap-etapas-concluidas.md`](docs/arquivados/roadmap-etapas-concluidas.md#futura--modo-treino-flutuante-overlay) e auditado formalmente em [`docs/roadmap/auditoria-treino-flutuante.md`](docs/roadmap/auditoria-treino-flutuante.md).  
**Referência visual:** `assets/design/coreflow-s25-ultra/11-treino-flutuante-material3.png`

**Resumo da Implementação:**
- Permissão `SYSTEM_ALERT_WINDOW` e controlador `WorkoutOverlayController.kt` com degradação graciosa caso negada.
- Sincronização passiva 100% atrelada ao `WorkoutForegroundService` (zero timers adicionais, sem concorrência).
- Três estados visuais AMOLED Material 3: Mini (pílula 36dp), Compacta (barra 44dp com fase/ação e timer) e Expandida (card com controles e saída segura).
- Controles nativos (`ACTION_PAUSE`, `ACTION_RESUME`, `ACTION_SKIP`, `ACTION_SAFE_EXIT_RETENTION`) e retorno direto à `MainActivity`.
- Painel de preferências integrado em Perfil (toggle, tamanho padrão, auto-recolhimento e próximo passo).
- Compatibilidade universal com os programas nativos: Vácuo Abdominal, Kegel e Bracing.

---

### 4.3 FUTURA 2 — Modo Treino Flutuante Fase 2: Sessões JS, Áudio Ducking e Convivência Multimídia

**Status:** PLANEJADO  
**Objetivo:** Expandir a convivência do overlay flutuante com aplicações de entretenimento/mídia em segundo plano e incorporar os fluxos de treino baseados em timers web sem quebrar a unicidade do cronômetro.

#### Escopo e Itens:
1. **Áudio Ducking e Foco de Áudio Nativos:**
   - [ ] Implementar gestão de foco de áudio via `AudioFocusRequestCompat` no `WorkoutForegroundService`.
   - [ ] Ao disparar avisos de voz do TTS nativo, solicitar `AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK` para reduzir o volume de reprodutores de mídia externos (Spotify, YouTube Music, podcasts).
   - [ ] Restaurar o volume da mídia de terceiros imediatamente após a conclusão da fala.
   - [ ] Respeitar a preferência de silenciamento de áudio do usuário (Modo Discreto / avisos desligados).
2. **Compatibilidade com Sessões Web (JS Timers):**
   - [ ] Estender suporte do overlay para Respiração Guiada, Pausas Ativas e Mindfulness.
   - [ ] Integrar os ciclos de respiração e tempos de descanso ao `WorkoutForegroundService` através da bridge existente, garantindo que o overlay continue estritamente passivo e que nunca surja um segundo timer em segundo plano.
3. **Persistência de Posição do Overlay:**
   - [ ] Salvar a última posição (X, Y) ancorada na tela nas `SharedPreferences` para restaurar o overlay exatamente onde o usuário o posicionou na sessão anterior.

---

### 4.4 FUTURA 3 — Homologação em Hardware Real (S25 Ultra), Doze Mode e Requisitos Google Play

**Status:** PLANEJADO  
**Objetivo:** Homologação completa em dispositivo físico topo de linha (Galaxy S25 Ultra), validação sob restrições estritas de energia da One UI e atendimento a diretrizes da Google Play.

#### Escopo e Itens:
1. **Homologação em Hardware Físico (Galaxy S25 Ultra — Conduzida por Rafael):**
   - [ ] Teste de encaixe e posicionamento em relação à câmera frontal (Infinity-O Punch Hole) e bordas da tela.
   - [ ] Teste de fluidez a 120Hz dinâmicos (LTPO) durante o arrasto do overlay flutuante.
   - [ ] Resposta háptica real no motor linear do S25 Ultra em conjunto com o Galaxy Watch.
2. **Resiliência contra Doze Mode e Otimização de Bateria Samsung:**
   - [ ] Validar permanência do serviço e do overlay quando o aparelho entra em Doze Mode profundo ou quando o CoreFlow é colocado em "Aplicativos suspensos" pela One UI.
   - [ ] Garantir que o `WorkoutForegroundService` permaneça ininterrupto com o tipo de serviço apropriado.
3. **Acessibilidade e Usabilidade:**
   - [ ] Mapeamento e auditoria via TalkBack sobre a janela do overlay (`AccessibilityNodeInfo`, rótulos para leitores de tela em cada botão do card expandido).
   - [ ] Suporte refinado para One Hand Operation+ (gestos de voltar da Samsung sobre o overlay).
4. **Conformidade Google Play Store:**
   - [ ] Declaração e justificativa de uso de `SYSTEM_ALERT_WINDOW` conforme políticas de experiência do usuário.
   - [ ] Declaração de `FOREGROUND_SERVICE` com tipo compatível (`health` / `specialUse`).

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

# CoreFlow — Roadmap de Execução (Ativo e Enxuto)

**Atualizado:** 08/10/2026.  
**Estado Geral:** Todas as etapas fundacionais do aplicativo (E00–E03, E05–E09, E10 concluído, E11, E12) e a etapa **FUTURA 1 (Modo Treino Flutuante CP1 a CP7)** foram totalmente implementadas, auditadas e integradas na `main`. O checklist detalhado e os critérios de aceite dessas etapas estão arquivados em [`docs/arquivados/roadmap-etapas-concluidas.md`](docs/arquivados/roadmap-etapas-concluidas.md). Histórico anterior a 19/09 preservado em [`docs/roadmap/historico-2026-09-19.md`](docs/roadmap/historico-2026-09-19.md).  
**Foco Imediato:** **E14 — Reformulação Clínica do Bracing no Banco e em Pé (McGill Adaptado)**.

---

## 1. Procedimento Obrigatório para o Agente (ou Desenvolvedor)

1. Ler este roadmap, verificar o status do Git e consultar o último registro em [`docs/roadmap/execucao.md`](docs/roadmap/execucao.md).
2. Selecionar a primeira tarefa pendente cujas dependências estejam satisfeitas.
3. Confirmar arquivos, funções e regras no código antes de editar.
4. Implementar uma tarefa por vez, preservando as funcionalidades existentes.
5. Executar os testes automatizados e o gate de qualidade (`bash scripts/check.sh`).
6. Marcar o item como concluído `[x]` somente após comprovação mecânica de teste.
7. Ao concluir, registrar arquivos alterados, evidências e próximo passo exato em `docs/roadmap/execucao.md`.

**Estados:** PENDENTE, EM EXECUÇÃO, BLOQUEADA, CONCLUÍDA.  
*Regra de Ouro:* Sem teste executado, não declarar conclusão. Nunca inventar APIs, sensores, históricos ou protocolos clínicos.

---

## 2. Arquivos Confirmados e Fontes de Verdade

- **Interface Principal (WebView):** `index.html` e `app/src/main/assets/index.html` *(devem permanecer estritamente idênticos byte a byte)*.
- **Bridge e Ciclo de Vida Android:** `app/src/main/java/com/example/MainActivity.kt`.
- **Motor de Treino e Timer Central:** `app/src/main/java/com/example/WorkoutForegroundService.kt` e `WorkoutSessionPlayer.kt`.
- **Overlay Flutuante Nativo:** `app/src/main/java/com/example/WorkoutOverlayController.kt`.
- **Áudio em Segundo Plano:** `app/src/main/java/com/example/MindfulnessAudioService.kt`.
- **Lembretes Nativos:** `app/src/main/java/com/example/ReminderScheduler.kt`.
- **Módulo Wear OS (Galaxy Watch):** `app/src/main/java/com/example/WearHapticsRelay.kt` e módulo `wear/`.
- **Script de Validação Completa:** `scripts/check.sh` (executa diagnósticos Node, paridade HTML e builds debug).
- **Registro Contínuo de Execução:** `docs/roadmap/execucao.md`.

---

## 3. Resumo Geral de Status do Projeto

| Etapa | Escopo | Status | Referência |
| :--- | :--- | :--- | :--- |
| **E00 a E12** | Fundação, Telas 01 a 10, Vácuo, Kegel, Mindfulness e Evolução | **CONCLUÍDA** | [Arquivo Histórico](docs/arquivados/roadmap-etapas-concluidas.md) |
| **FUTURA 1** | Modo Treino Flutuante Nativo (Overlay AMOLED CP1 a CP7) | **CONCLUÍDA** | [Auditoria Técnica](docs/roadmap/auditoria-treino-flutuante.md) |
| **E14** | Reformulação Clínica do Bracing no Banco e em Pé (McGill) | **PLANEJADO (Foco Imediato)** | Ver Seção 4.1 |
| **E13** | Validação Integrada e Conclusão Android (Físico / TalkBack) | **ABERTA** | Ver Seção 4.2 |
| **FUTURA 2** | Treino Flutuante Fase 2 (Áudio Ducking e Convivência Multimídia) | **PLANEJADO** | Ver Seção 4.3 |
| **FUTURA 3** | Homologação em Hardware Real (S25 Ultra / Google Play) | **PLANEJADO** | Ver Seção 4.4 |

---

## 4. Backlog Ativo (O que temos para fazer para frente)

### 4.1 E14 — Reformulação Clínica do Bracing no Banco e em Pé (Foco Imediato)

**Status:** PLANEJADO (Foco Imediato)  
**Objetivo:** Substituir a repetição de exercício único por circuitos clínicos estruturados de 3 exercícios progressivos por sessão ao longo das 8 semanas do programa de Bracing (ID `1`), executáveis **estritamente em banco/cadeira ou em pé** (zero posições deitadas ou no chão), fundamentados nas diretrizes biomecânicas de rigidez espinhal do Dr. Stuart McGill e controle lombopélvico de Shirley Sahrmann.

#### Restrições Clínicas e Posturais:
- **Exclusividade Postural:** 100% dos exercícios devem ser executados em posição sentada (em banco/cadeira estável) ou em pé. Nenhuma variação pode exigir deitar no chão, quatro apoios no chão ou decúbito lateral.
- **Estrutura por Sessão (Sessão A e Sessão B):** Cada sessão é composta por 1 etapa de preparação (15s), seguida por um circuito de 3 exercícios distintos (Ativação Base $\to$ Desafio Antimovimento $\to$ Integração Postural/Funcional), com 3 séries por exercício e intervalos de recuperação (20s), finalizando com checagem de qualidade (20s).
- **Preservação de Dados e IDs:** Manter ID do programa (`1`), título (`Bracing: Controle e Automação (8 Semanas)`), 8 fases e persistência de histórico intactos.

#### Matriz Clínica das 8 Semanas:
- **Semana 1 (Consciência 360° e Ativação no Banco):**
  - *Sessão A (Sentado):* Respiração 360° no banco (40s) $\to$ Pressão isométrica mão-coxa (35s) $\to$ Coluna neutra com bracing sustentado (35s).
  - *Sessão B (Sentado/Em Pé):* Palpação lateral dos oblíquos de McGill (40s) $\to$ Extensão unilateral de perna no banco (35s) $\to$ Bracing em pé com apoio na mesa (40s).
- **Semana 2 (Dissociação de Membros e Pelve Neutra):**
  - *Sessão A (Sentado):* Marcha sentada de Sahrmann (40s) $\to$ Alcance alternado de braços sentado (40s) $\to$ Inclinação de tronco reto no banco (Torso Hinge) (45s).
  - *Sessão B (Em Pé):* Bracing em pé alinhado (40s) $\to$ Marcha estacionária lenta com apoio (45s) $\to$ Sentar e levantar controlado (Sit-to-Stand) (45s).
- **Semana 3 (Anti-Rotação e Resistência Isométrica):**
  - *Sessão A (Sentado):* Pallof press isométrico no banco (45s) $\to$ Marcha com pressão cruzada mão-joelho (45s) $\to$ Dobradiça de tronco sustentada a 30° (45s).
  - *Sessão B (Em Pé):* Bird Dog em pé com apoio no banco/mesa (45s) $\to$ Postura unipodal com pelve nivelada (40s) $\to$ Auto-perturbação tátil nas costelas (45s).
- **Semana 4 (Anti-Extensão e Cadeia Lateral):**
  - *Sessão A (Sentado):* Elevação bimanual acima da cabeça no banco (45s) $\to$ Inclinação lateral isométrica no banco (45s) $\to$ Pressão cruzada submáxima diagonal (50s).
  - *Sessão B (Em Pé):* Prancha inclinada no banco (Incline plank) (45s) $\to$ Bird Dog em pé com braço e perna opostos (50s) $\to$ Sentar e levantar com pausa isométrica (50s).
- **Semana 5 (Cargas Assimétricas e Antimovimento Bípede):**
  - *Sessão A (Sentado):* Chop & Lift isométrico diagonal no banco (50s) $\to$ Extensão de perna com alcance de braço oposto (50s) $\to$ Carga assimétrica sentada (Suitcase hold no banco) (50s).
  - *Sessão B (Em Pé):* Pallof press em pé sem apoio (50s) $\to$ Marcha do fazendeiro simulada (Suitcase carry no lugar) (55s) $\to$ Dobradiça de quadril em pé (Hip Hinge vertical) (50s).
- **Semana 6 (Coordenação e Controle Reativo):**
  - *Sessão A (Sentado):* Transição ativa de postura no banco (relaxa/ativa) (50s) $\to$ Pressão unilateral mão-joelho com fala/respiração livre (55s) $\to$ Equilíbrio isquiático sem encosto (55s).
  - *Sessão B (Em Pé):* Equilíbrio unipodal com alcance funcional (50s) $\to$ Prancha inclinada no banco com toque no ombro (55s) $\to$ Passo à frente com parada brusca e core travado (55s).
- **Semana 7 (Automação Cotidiana e Tarefas de Trabalho):**
  - *Sessão A (Sentado):* Bracing submáximo durante tarefas/digitação (55s) $\to$ Torção resistida isométrica no banco (55s) $\to$ Transição sentar-levantar com pausa intermediária (60s).
  - *Sessão B (Em Pé):* Agachamento com alcance simulando pegar objeto do chão (55s) $\to$ Empurrar isométrico contra a parede (60s) $\to$ Marcha com mudança rápida de direção (60s).
- **Semana 8 (Consolidação e Protocolo Vitalício):**
  - *Sessão A (Sentado/Em Pé):* Tríade McGill adaptada (Banco + Bird Dog em pé + Pallof em pé) (60s) $\to$ Bracing sob esforço respiratório e fala (60s) $\to$ Checagem postural expressa de 15s (60s).
  - *Sessão B (Em Pé):* Teste de resistência do core em pé (60s) $\to$ Circuito integrado de trabalho (sentar, erguer peso, transportar e sentar) (60s) $\to$ Protocolo de manutenção diária vitalícia (60s).

#### Checklist de Implementação:
- [ ] Atualizar catálogo de fases do Programa `1` em `index.html` e `app/src/main/assets/index.html` com os novos detalhes e títulos clínicos.
- [ ] Implementar novo gerador multi-exercício em `buildWorkoutSteps(progId, phaseIdx)` gerando os 3 exercícios reais em sequência por sessão A/B.
- [ ] Criar suíte de teste de regressão `diagnostics/bracing-clinical-progression.test.cjs` validando as 48 variações, paridade HTML e ausência de regressão.
- [ ] Garantir paridade byte a byte estrita entre `index.html` e `app/src/main/assets/index.html`.
- [ ] Validar compatibilidade contínua com `WorkoutForegroundService` e `WorkoutOverlayController` nativo.

---

### 4.2 E13 — Validação Integrada e Conclusão Android

**Status:** ABERTA  
**Objetivo:** Validação integrada de ciclo de vida, restauração de estado e testes em aparelho físico real conduzidos por Rafael.

#### Checklist de Itens:
- [ ] Pausa na retenção orienta sua saída; retomada não exige continuar apneia congelada (itens diferidos E04).
- [ ] Bloquear alteração silenciosa de carga/postura em série ativa.
- [ ] Encerrar salva parcial sem concluir automaticamente o programa.
- [ ] Feedback fica associado ao ID da sessão; permitir não responder.
- [ ] Retomar estado do serviço após bloqueio do sistema operacional sem iniciar timer concorrente.
- [ ] Cancelar sinais pendentes ao encerrar; evitar vibração duplicada.
- [ ] Validar acessibilidade: fonte ampliada do sistema, TalkBack, contraste AMOLED e redução de movimento.
- [ ] Testar no Galaxy S25 Ultra físico: gestos, rotação, bloqueio de tela, execução em segundo plano e One Hand Operation+.
- [ ] Validar integração com Galaxy Watch: reconexão Bluetooth e padrões de vibração háptica.

---

### 4.3 FUTURA 2 — Modo Treino Flutuante Fase 2: Sessões JS, Áudio Ducking e Convivência Multimídia

**Status:** PLANEJADO  
**Objetivo:** Expandir a convivência do overlay flutuante com reprodutores de mídia externos e incorporar sessões web sem timers duplicados.

#### Checklist de Itens:
- [ ] **Áudio Ducking Nativo:** Implementar `AudioFocusRequestCompat` no `WorkoutForegroundService` para atenuar músicas (Spotify, YouTube Music) durante a fala do TTS e restaurar o volume ao término.
- [ ] **Compatibilidade com Sessões Web:** Integrar Respiração Guiada, Pausas Ativas e Mindfulness ao overlay flutuante via bridge de eventos.
- [ ] **Persistência de Coordenadas:** Salvar última posição $(X, Y)$ do overlay nas `SharedPreferences`.

---

### 4.4 FUTURA 3 — Homologação em Hardware Real (S25 Ultra), Doze Mode e Requisitos Google Play

**Status:** PLANEJADO  
**Objetivo:** Homologação completa em hardware físico topo de linha sob restrições da One UI e atendimento a diretrizes da Google Play.

#### Checklist de Itens:
- [ ] **Hardware Físico:** Encaixe visual em relação à câmera frontal (Punch Hole) e fluidez a 120Hz dinâmicos (LTPO).
- [ ] **Doze Mode / Samsung:** Resiliência contra suspensão agressiva da bateria pela One UI.
- [ ] **Acessibilidade TalkBack no Overlay:** `AccessibilityNodeInfo` em todos os controles do card expandido.
- [ ] **Conformidade Google Play:** Declaração de `SYSTEM_ALERT_WINDOW` e `FOREGROUND_SERVICE` (`health` / `specialUse`).

---

## 5. Limites Inegociáveis

- Preservar a arquitetura Android/WebView e módulo Wear OS.
- Não alterar IDs de programas, armazenamento ou esquemas sem necessidade documentada.
- Manter paridade estrita byte a byte entre `index.html` e `app/src/main/assets/index.html`.
- Nunca utilizar assinatura debug para builds de release.

---

## 6. Convenção de Rastreabilidade Documental
<!-- Convenção de SHA verificada por scripts/check-doc-sha.sh -->
- `base_sha=666e24a6f64c84c265fa46644efbaa089847823c`
- `behavioral_target_sha=666e24a6f64c84c265fa46644efbaa089847823c`
- `documentation_parent_sha=51041a9c95cd329a9b67dfbfb13f74ed07e573f5`

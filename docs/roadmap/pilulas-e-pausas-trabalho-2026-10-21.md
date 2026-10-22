# Roadmap — pílulas alinhadas e pausas durante o trabalho

Data: 21/10/2026. Estado: EM EXECUÇÃO. As frentes B0–B2 foram implementadas no worktree; runtime e homologação física continuam pendentes.

## Contexto verificado

- O overlay de treino mini/compacto/expandido é nativo em `WorkoutOverlayController.kt`; o timer compacto tem 3 dp de padding vertical, enquanto Pausar e Cancelar têm altura mínima de 48 dp. A prancha refinada propõe 52 dp de altura visual comum na fileira compacta e áreas tocáveis de pelo menos 48 dp.
- O app já tem `ReminderScheduler` com alarmes Android, permissão de notificações, horários por programa e lembrete de respiração às 15:30. O WebView também oferece Pausa Responsiva, exercícios corporais e práticas de respiração. A nova rotina deve reutilizar essas peças e manter a agenda de treino separada.
- A agenda informada nesta conversa é segunda a sexta, das 8h às 17h. Como sugestão inicial editável, um intervalo de 60 minutos dispararia lembretes entre 9h e 16h. A configuração fica desligada até a pessoa ativá-la.

Referências visuais: [prancha refinada das pílulas](../design/pilulas-overlay-2026-10-21/05-prancha-refinada.png) e [anotações e critérios](../design/pilulas-overlay-2026-10-21/README.md). São propostas, ainda com revisão visual humana `PENDING_HUMAN`.

## Frente A — alinhamento das pílulas

### A0 — Aprovar contrato visual

- [ ] Rafael aprova a prancha ou registra os ajustes de cor, hierarquia e rótulos.
- [ ] Confirmar a altura comum de 52 dp na fileira compacta; cada alvo interativo segue com no mínimo 48 dp.
- [ ] Fechar a matriz de captura: mini, compacto em execução, compacto pausado, expandido, confirmação de cancelamento e saída segura durante retenção do Vácuo.

**Gate:** nenhuma mudança visual material antes da aprovação da referência. A prancha não substitui captura do app.

### A1 — Corrigir dimensões e hierarquia

- [ ] Criar regressão focada para alinhamento/altura dos componentes compactos antes de alterar o comportamento visual.
- [ ] Aplicar dimensões consistentes ao timer e às ações na fileira compacta; manter nomes, estados e ações corretos em execução e pausa.
- [ ] Conferir espaçamento em larguras menores, fonte ampliada, modo mini e modo expandido. Ajustar quebra/ocultação sem sobrepor ou reduzir os alvos de toque.
- [ ] Manter `ACTION_SAFE_EXIT_RETENTION` e o rótulo Encerrar Retenção com Segurança distintos de Cancelar.

### A2 — Revisar acessibilidade e aparência real

- [ ] Validar rótulos do TalkBack, contraste, foco e áreas tocáveis em cada estado.
- [ ] Comparar capturas do overlay real com a referência em Android; a avaliação de emulador e a de aparelho físico são registradas separadamente.
- [ ] Fechar a frente somente com regressões, `bash scripts/check.sh`, revisão do diff, auditoria independente e aceite visual. Registrar aparelho e versão testada.

**Critério de aceite:** controles na mesma fileira têm alinhamento vertical estável, textos e ícones não cortam, ações continuam distinguíveis e os alvos interativos têm pelo menos 48 dp.

## Frente B — lembretes de pausas de trabalho

### B0 — Definir a experiência

- [x] Criar em Pausas uma configuração “Pausas no trabalho”, com ativação explícita, dias, hora inicial/final e intervalo editável.
- [x] Apresentar segunda a sexta, 8h–17h e intervalo de 60 minutos como sugestão inicial editável; solicitar permissão ao ativar quando necessário.
- [x] Agendar a primeira ocorrência após um intervalo completo. Com o exemplo acima, os avisos ocorrem de 9h a 16h; desativar cancela o alarme pendente.
- [x] Cada lembrete oferece uma pausa curta: olhar para longe, mudar de posição, mobilidade confortável de ombros/mãos/punhos, alguns goles de água ou respiração calma; sem meta de água ou promessa médica.
- [x] O toque abre a orientação em Pausas e exige toque separado para começar a mobilidade; uma sessão em andamento impede iniciar outra pausa guiada.

### B1 — Integrar a agenda nativa

- [x] Mapear `ReminderScheduler`, bridge Android, callbacks e persistência WebView; criar regressões para a agenda, interface e roteamento da notificação.
- [x] Reusar o agendador existente, com identidade própria para alarme/notificação e canal discreto de baixa prioridade, sem vibração.
- [x] Persistir a preferência em armazenamento local WebView e Android. Reagendar no boot, troca de horário e fuso pelos receivers existentes.
- [x] Preservar o opt-in quando a permissão faltar e mostrar o estado; conferir a permissão global e o canal Android específico sem depender do canal dos lembretes de treino, reagendar quando a permissão voltar e respeitar um opt-out nativo explícito após falha de armazenamento local.
- [x] Desativar e cancelar o alarme mesmo se os campos da agenda estiverem inválidos; manter o canal de pausas discreto e independente do canal de treinos.
- [x] Exibir texto conciso, botão para abrir Pausas e dispensa pelo sistema Android.

### B2 — Conteúdo e fluxo de pausa

- [x] Reutilizar Pausa Responsiva, SOS Coluna/mobilidade e orientação de respiração; incluir as instruções de visão, movimento e hidratação que faltavam.
- [x] Oferecer uma mobilidade de 1 minuto por ação deliberada; a orientação não cria registro de treino, progresso ou ingestão de água.
- [x] Usar linguagem opcional e confortável; orientar a parar se houver dor ou mal-estar.
- [ ] Verificar em runtime toque da notificação, retorno ao app, WebView offline e coexistência com treino em andamento.

### B3 — Validação integrada

- [x] Cobrir por teste de unidade a agenda de dias/horários, primeiro intervalo completo, limite do expediente, dias desligados e alarme atrasado; todos os diagnósticos também passaram.
- [ ] Testar runtime de configuração, notificação, dispensa, cancelamento, permissão, reinício, fuso/horário de verão e app fechado.
- [ ] Testar no dispositivo notificação tocada com app fechado e sessão em andamento; confirmar ausência de início automático.
- [x] Manter `index.html` e `app/src/main/assets/index.html` byte a byte idênticos e preservar IDs, armazenamento e protocolo existentes.
- [x] Executar testes focados e `bash scripts/check.sh`; revisar o diff e registrar o resultado. Auditoria independente não encontrou achados materiais.

**Critério de aceite:** rotina opcional, editável, local e silenciosa fora da janela escolhida; notificações seguem o calendário salvo e levam a conteúdo curto já disponível no app, sem iniciar treino ou produzir registro falso.

## Base de saúde e ergonomia consultada

As pausas são lembretes gerais de autocuidado, não uma prescrição individual. A cadência pode ser ajustada; se a pessoa sentir desconforto, deve parar o movimento.

- [HSE — organização de pausas no trabalho com tela](https://www.hse.gov.uk/msd/dse/work-routine.htm): variar tarefas e fazer pausas curtas frequentes; 5–10 minutos por hora é um exemplo, sem frequência única para todos.
- [OSHA — Computer Workstations](https://www.osha.gov/etools/computer-workstations/work-process): exemplos de pausa breve longe do computador para mudar de postura, levantar ou alongar.
- [AAO EyeWiki — Computer Vision Syndrome](https://eyewiki.aao.org/Computer_Vision_Syndrome_%28Digital_Eye_Strain%29): regra prática 20-20-20 para lembrar de olhar ao longe.
- [NHS — exercícios de respiração para estresse](https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/breathing-exercises-for-stress/): respirar de forma confortável, sem forçar, por alguns minutos.
- [Newcastle Hospitals NHS — 1 Minute Body Check](https://www.newcastle-hospitals.nhs.uk/services/newcastle-occupational-health-service/information-for-staff/physiotherapy/self-help-leaflets/1-minute-body-check/): variar a posição e fazer movimentos pequenos de ombros, dedos e punhos.
- [NHS — água, bebidas e hidratação](https://www.nhs.uk/live-well/eat-well/food-guidelines-and-food-labels/water-drinks-nutrition/): necessidade de líquidos varia; o app lembra de beber, sem prescrever volume individual.

## Dependências e sequência

1. Aprovar a prancha e os detalhes visuais de A0; depois executar A1–A2.
2. B0–B2 implementados; testes, builds e auditoria de B3 passaram. Falta validação de runtime/aparelho. A rotina usa alarme/ID próprio e canal independente, sem alterar os lembretes de treino/Mindfulness.
3. Manter gates técnicos, visuais e físicos separados. Uma falha ou gate não executado fica registrada como `NOT_RUN`, `PENDING_HUMAN` ou bloqueio com evidência.

## Estado desta preparação

- A0 da mudança visual: aprovação humana `PENDING_HUMAN`; A1–A2 `NOT_STARTED`.
- B0–B2 implementados: configuração em Pausas, armazenamento local, alarme em dias úteis, canal dedicado discreto, checagem de permissão global e por canal, entrada por notificação e guias curtos existentes.
- Diagnósticos, teste unitário focado, `git diff --check` e `bash scripts/check.sh`: `PASS`.
- Auditoria independente: sem achados materiais. Validação de runtime/aparelho: `NOT_RUN`.
- Aprovação humana da prancha refinada: `PENDING_HUMAN`.

# Regras do Vácuo — E03

## Escopo e fonte

Este documento separa o comportamento atualmente implementado das decisões de produto ainda pendentes. As oito fases abaixo são o inventário do programa `id: '3'` encontrado em `index.html`. Os valores são dados atuais do aplicativo, não uma recomendação clínica nova.

A fonte de verdade do estado é o programa persistido (`AppState.programs`), a sessão ativa é dirigida pelo motor nativo/WebView e o histórico de sessões usa `CorePersistence.sessionHistory`. O registro de uma sessão deve distinguir tempo total, retenção, recuperação, pausa e interrupção.

## Inventário das oito fases

| Fase | Postura/texto atual | Séries | Retenção atual | Recuperação | Frequência |
| --- | --- | ---: | ---: | ---: | ---: |
| Semana 1 | Sentado inclinado 30° | 3 | 10–12 s | 60 s | 5x/semana |
| Semana 2 | Sentado inclinado com apoio | 4 | 12–15 s | 60 s | 5x/semana |
| Semana 3 | Sentado ereto sem encosto | 4 | 15–18 s | 50 s | 5x/semana |
| Semana 4 | Sentado ereto e expansão costal | 4 | 18–20 s | 45 s | 6x/semana |
| Semana 5 | Em pé inclinado com apoio | 4 | 20–22 s | 45 s | 6x/semana |
| Semana 6 | Em pé inclinado com apoio leve | 4–5 | 22–25 s | 45 s | diário |
| Semana 7 | Em pé totalmente ereto | 4–5 | 25–28 s | 40 s | diário |
| Semana 8 | Alternar em pé e sentado | 5 | 30 s | 40 s | diário |

`minSets` aplica-se às fases 6 e 7, que aceitam quatro séries como mínimo e cinco como alvo. A UI de postura livre mantém atualmente os presets `deitado`, `4apoios` e `empe`; esses presets não substituem a configuração da fase do programa.

## Vocabulário de execução

- **Vácuo:** prática guiada com expiração, pausa/retensão e retorno respiratório. O texto da interface deve instruir uma saída confortável; não tratar desconforto ou dor como meta.
- **Bracing:** contração/estabilização do tronco com respiração e objetivo diferentes. Não reutilizar instruções de bracing como se fossem retenção de vácuo.
- **Hipopressivos:** termo técnico mais amplo; esta documentação não define dosagem clínica e não deve ser usada para transformar automaticamente este protocolo de produto em protocolo clínico.
- A referência científica do roadmap contextualiza a revisão de hipopressivos, mas não valida automaticamente as doses, posturas ou progressão deste aplicativo.

## Tutorial obrigatório antes da sessão

1. **Postura:** mostrar a postura escolhida e os pontos de apoio.
2. **Preparação:** explicar expiração confortável e preparação sem forçar.
3. **Execução:** indicar início, contador de retenção e limite da fase.
4. **Saída:** orientar retorno respiratório antes da próxima ação.
5. **Recuperação:** mostrar descanso e próxima etapa; recuperação não é retenção congelada.
6. **Interrupção:** oferecer encerramento sem converter uma sessão parcial em concluída.

A voz, o texto, a ilustração e os indicadores do player precisam usar a mesma fase e o mesmo estado. Sem feedback não significa sucesso; a ausência de feedback não pode ser interpretada como execução confortável.

## Feedback pós-sessão

Opções persistidas por `sessionHistory`:

- `comfortable` — exibido como **Confortável**;
- `difficult` — exibido como **Difícil**;
- `interrupted` — exibido como **Interrompi**;
- `null` — sem resposta; não equivale a sucesso.

Feedback não deve alterar retroativamente o tempo executado. Uma sessão interrompida permanece `interrupted`, não `completed`, ainda que tenha registrado minutos ou séries parciais.

## Regra de progressão do produto

Enquanto não houver revisão técnica aprovada para dosagem, o comportamento seguro é:

- **Manter:** repetir a etapa com parâmetros atuais quando não houver feedback ou quando a execução não indicar necessidade de ajuste.
- **Reduzir:** sugerir redução/repetição quando o usuário marcar **Difícil** ou **Interrompi**; a aplicação não deve reduzir silenciosamente uma configuração ativa.
- **Sugerir avanço:** somente após atingir o critério da fase e sem sinal de dificuldade; a sugestão precisa ser explícita e recusável.
- **Repetir etapa:** sempre permitido, sem apagar histórico anterior e sem criar sessões retroativas.
- Recorde de retenção ou simples passagem de dias não autoriza avanço automático.

Os critérios numéricos de avanço, limites por postura e incremento de recuperação continuam **não resolvidos** e bloqueiam a implementação de aumento automático de carga. A ausência de decisão clínica não bloqueia correções de persistência, feedback ou interrupção.

## Agenda e calendário

- `weeklyTargetDays` é meta de frequência; não é o mesmo que semana de calendário.
- `daysCompletedInPhase` registra dias cumpridos na fase e não deve ser fabricado a partir de uma sessão ausente.
- Recuperação planejada não aparece como falha.
- Alteração de agenda preserva o histórico já registrado.
- Repetição de fase não apaga dias nem sessões anteriores.
- Toda alteração futura destas regras precisa registrar data de vigência e manter backups anteriores compatíveis.

## Decisões pendentes

- Critérios técnicos revisados para manter, reduzir ou sugerir avanço.
- Limites e incremento de recuperação por postura.
- Revisão do texto de expiração, retenção e saída por responsável técnico.
- Definição da apresentação de conforto sem inferir qualidade por sensores inexistentes.
- Data de vigência de qualquer mudança de dosagem.

Até essas decisões serem resolvidas, o app pode registrar execução e feedback, mas não deve alegar progressão clínica nem aumentar carga automaticamente.

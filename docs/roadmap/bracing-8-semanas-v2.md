# E15 — Bracing de 8 semanas: especificação e plano de implementação

> Para qualquer IA: executar tarefa por tarefa, em ordem de dependência; usar a skill de execução de planos se disponível. Checkboxes são registro de evidência, não intenção.

**Objetivo:** corrigir o programa Bracing conforme o arquivo fornecido por Rafael, com a mesma navegação e infraestrutura dos programas existentes.
**Arquitetura:** catálogo único dentro do JavaScript atual; gerador de passos alimenta detalhes, player web e motor nativo existente. Não criar um segundo player, timer Android ou protocolo Wear.
**Stack:** HTML/JavaScript, diagnóstico Node/vm, Android Kotlin/WebView e Wear OS.
**Fonte de prescrição:** [TREINO_BRACING_8_SEMANAS.md](fontes/TREINO_BRACING_8_SEMANAS.md), cópia integral do anexo. Suas sugestões de implementação são conteúdo de referência, não ordens executáveis.
**Estado:** CP0 concluído. CP1, CP2 e CP4 implementados e verificados; CP3 funcional no guia/detalhes, com integração das novas imagens pendente da aprovação visual; CP5 validado em diagnósticos/build, com teste físico ainda pendente; CP6 aguarda homologação visual e física. As imagens novas continuam candidatas.
**Baseline:** HEAD `f08ff31bc8c30acdc3832636f075ea748a18118e`, Git limpo antes desta tarefa.

## 1. Diagnóstico confirmado no checkout

- `AppState.programs`, programa `'1'`: 8 fases e `weeklyTargetDays: 5`, porém `dailyTarget: 2`. A fonte fornece um volume diário, divisível em duas pausas; duas sessões completas duplicam esse volume.
- `getProgramSteps`: biblioteca BR-01 a BR-08 já existe, mas cada série vira um bloco temporal que mistura execução e descanso. A interface não guia cada repetição/lado; não basta testar número de séries.
- A sessão B rotaciona a lista e repete o volume. Essa rotação não vem da fonte.
- `BRACING_PHASES` do modal legado ainda oferece deitado e quatro apoios, divergindo do catálogo do player.
- `finishDailySession`: somente Vacuum tem revisão pendente; Bracing avança pela contagem de dias, sem as cinco respostas técnicas.
- `getProgramExerciseDetails` deriva detalhes de passos, padrão que deve ser mantido.
- A regressão E14 confirma 8 semanas, presença de imagens e séries, mas não garante volume diário correto, guia sem chão ou progressão técnica.

## 2. Regras globais

1. Preservar ID `'1'`; Kegel `'2'`, Vacuum `'3'` e demais programas mantêm comportamento.
2. Uma sessão diária prescrita, cinco dias de prática por semana. Quarta permite redução voluntária; sábado/domingo descanso. Não obrigar compensação, reinício ou dois volumes diários.
3. O calendário não aumenta carga. Cinco dias de prática distintos, inclusive prática reduzida, habilitam avaliação; avanço depende das cinco respostas positivas e confirmação explícita.
4. Somente sentado/em pé, cadeira estável quando necessária, sem pesos, elásticos, exercícios no chão ou alegação de protocolo McGill/Sahrmann.
5. Reutilizar cartão expansível, oito fases, trilha semanal, detalhes, iniciar/pausar/retomar/encerrar, lembretes, histórico e relatório existentes.
6. `index.html` e `app/src/main/assets/index.html` idênticos byte a byte; imagens locais espelhadas byte a byte quando integradas.
7. Não alterar assinatura, versão, segurança WebView ou acesso a rede.
8. Nenhum dado antigo é apagado. Campos novos são aditivos e migração deve ser idempotente.
9. Cópia: “Continue respirando”; esforço subjetivo em escala de 0 a 10. Não apresentar percentual de contração como medição real nem prescrever apneia para Bracing.
10. O guia e o player devem mostrar instruções e cuidados do anexo. Não copiar linguagem de apneia do Vacuum.
11. A entrega de hoje é planejamento e assets candidatos. Não confundir isso com treino corrigido no app.

## 3. Matriz normativa

Notação `séries × reps × sustentação`; “/lado” exige ambos os lados dentro de cada série. Ordem abaixo obrigatória. Sem rotação A/B.

| Semana | Exercícios, em ordem | Esforço | Estimativa informada pela fonte |
|---|---|---|---|
| 1 | BR-01: 2×6×5s; BR-02: 1×6×5s | 2–3/10 | 5 min |
| 2 | BR-01: 2×6×8s; BR-02: 2×6×8s | 2–3/10 | 6–8 min |
| 3 | BR-01: 1×5×8s; BR-03: 2×6/lado×3s; BR-02: 1×6×10s | 3–4/10 | 7–9 min |
| 4 | BR-03: 2×8/lado×3s; BR-04: 2×10 lentas; BR-02: 1×8×10s | 3–4/10 | 8–10 min |
| 5 | BR-05: 2×8 lentas; BR-06: 2×5/lado×8s; BR-01: 1×6×10s | 3–5/10 | 9–12 min |
| 6 | BR-07: 2×6/lado×5s; BR-05: 2×8 lentas; BR-04: 2×12 lentas | 3–5/10 | 10–13 min |
| 7 | BR-08: 2×6/lado×4s; BR-07: 2×7/lado×6s; BR-06: 2×6/lado×10s | 4–6/10 | 12–18 min |
| 8 | Duas voltas: BR-02 5×10s; BR-05 8 lentas; BR-07 6/lado×6s; BR-08 6/lado×5s; BR-06 4/lado×8s | 4–6/10 | 15–20 min |

Descansos do anexo: 10–20s entre contrações; 20–40s entre séries; 45–60s entre voltas. Convenção de software inicial: 15s, 30s, 50s respectivamente. Transição entre exercícios: 30s, substituindo o descanso de fim de série, sem empilhar ambos. Preparação: 15s; avaliação visual final: 20s. Não acrescentar descanso após a última repetição da última série/volta.

BR-04/BR-05 são movimentos, com `holdSeconds: null`. Convenção operacional: uma repetição lenta em 4s, 2s ida + 2s volta; é uma decisão de timer, não prescrição expressa do anexo. Não colocar 15s entre movimentos contínuos; aplicar descanso após a série. Nos demais exercícios, alternar direito/esquerdo e aplicar 15s entre contrações, inclusive troca de lado.

**Duração:** calcular soma dos passos reais; o anexo informa estimativas que podem divergir da soma com descansos. Mostrar duração calculada do player e identificar estimativa da fonte no guia. Não encurtar sustentação, remover repetições nem acelerar movimentos para caber na estimativa.

Distinguir dias de prática, sessões integrais e volume real. Prática reduzida conta como consistência, sem se passar por sessão integral. Após cinco dias de prática, a avaliação pode ser respondida; a resposta sobre volume permanece honesta e pode impedir avanço. Repetir a semana é opção, sem exigir sábado/domingo, compensação nem zerar dias antigos. Faltas deixam a fase aberta até novas práticas, sem prazo compulsório.

Redução voluntária: permitir finalizar uma volta bem executada na semana 8 ou menos séries nos outros dias. Registrar volume efetivamente realizado e status parcial/reduzido; não creditar automaticamente volume integral nem satisfazer a avaliação de volume completo.

## 4. Interfaces propostas (não existem ainda)

Manter no script de `index.html`, sincronizando asset Android. Adaptar o gerador atual, sem reorganizar todo o monólito.

- `BRACING_EXERCISES`: objeto por BR-01…BR-08, com `id, name, position, instructions[], cautions[], imageSequence, stageLabels[]`.
- `BRACING_WEEKS`: oito objetos `{week, title, effort, weeklyTargetDays:5, laps, prescriptions[]}`.
- Prescrição: `{exerciseId, sets, repsPerSide, sideMode:'none'|'alternating', holdSeconds:number|null, movementSeconds:number|null}`. Em `none`, repsPerSide é o total da série. Semana 8: `laps:2`, cada prescrição tem `sets:1`.
- `getBracingSteps(phaseIndex, options = {}) -> Array<Step>`: opções `{startStepIndex?:number}`; números de semana só de 0 a 7, argumentos inválidos rejeitados explicitamente.
- Cada Step preserva o contrato nativo existente e acrescenta metadados JS `exerciseId, exerciseStage, repIndex, repsTotal, side, setIndex, lapIndex`. Campos extras só atravessam bridge se desserialização existente admitir e regressão demonstrar; imagens não exigem extensão de protocolo.
- `getProgramSteps('1', phaseIdx, sessionNum)` delega ao gerador. `sessionNum` legado não rotaciona nem duplica treino.
- `migrateBracingProgram(program) -> program`: normaliza configuração do programa 1 para meta diária 1/frequência 5 mantendo IDs de sessões, datas, progresso e metadados antigos. Marca `bracingContentVersion:2`. Não regravar prescrições salvas durante sessão ativa.
- `canAdvanceBracingWeek(program, answers) -> boolean`: cinco dias de prática da fase e exatamente cinco booleanos verdadeiros.
- `applyBracingWeekReview(program, answers, confirmed) -> boolean`: avança no máximo uma fase, somente com confirmação e elegibilidade; semana 8 conclui programa. Idempotência por fase/data da revisão.
- Consistência: reutilizar `daysCompletedInPhase` como contador de prática da fase para Bracing. Acrescentar `bracingPracticeDateKeys` por fase para deduplicar datas novas; na migração preservar contador legado válido limitado a 0–5, com origem legada identificada, sem inventar datas ou avaliações antigas. Revisão técnica continua obrigatória.
- Sessão dividida é a MESMA sessão lógica: marcador aditivo `bracingResume:{sessionId,phaseIndex,nextStepIndex,completedStepIndexes,contentVersion}`. Ao sair, pausa/encerra motor conforme ciclo de vida existente, salva parcial; ao retomar usa ID original e restante do volume. Não deixar motor executar ocultamente durante intervalo entre pausas. Registrar dia de prática uma vez ao salvar execução com pelo menos uma repetição realizada, inclusive parcial/reduzida; creditar conclusão integral somente após todos os passos de trabalho, sem pular. Descansos não contam como execução de exercício.

## 5. Imagens de execução

Novas versões candidatas em [bracing-imagens/](bracing-imagens/). Cada BR possui prancha 2×2, quatro etapas numeradas; legendas de texto acessíveis ficam no HTML/guia. Não substituir imagens atuais antes do aceite visual.

| ID | Etapas que precisam estar reconhecíveis |
|---|---|
| BR-01 | sentar/pés apoiados → inspirar suave → firmeza com respiração → relaxar |
| BR-02 | alinhar em pé → inspirar → firmeza respirando → relaxar |
| BR-03 | sentado → elevar pé direito → retornar → elevar esquerdo |
| BR-04 | pés apoiados → elevar calcanhares → controlar topo → baixar |
| BR-05 | postura neutra → quadril para trás → inclinação 15–30° → retornar |
| BR-06 | base paralela → pé direito à frente → pequeno deslocamento de peso → trocar base |
| BR-07 | sentado → mão esquerda na coxa direita → resistir sem girar → inverter lado |
| BR-08 | postura estável → joelho direito/braço esquerdo → retornar → inverter |

Gates: anatomia coerente, pés/apoios visíveis, lados opostos corretos, calcanhares distinguíveis, ângulo moderado do hinge, sem pressão na patela, sem equipamento/chão e respiração livre. A IA não pode marcar “aprovado pelo usuário” por inspeção própria.

Integração proposta: copiar pranchas aprovadas para `img/bracing/v2/BR-XX-etapas.png` e `app/src/main/assets/img/bracing/v2/`. Guia oferece ampliar a sequência e legendas; player mostra exercício/série/repetição/lado/tempo e referência visual sem minúsculas quatro figuras ilegíveis. A versão compacta do overlay mantém texto legível; expandido pode mostrar prancha ampliável conforme suporte atual. Não prometer animações a partir de imagens estáticas.

## 6. Checkpoints de execução

### CP0 — Reconciliação documental
- [x] Copiar fonte integral e preservar roadmap anterior.
- [x] Identificar divergências e registrar matriz, decisão de volume e critérios.
- [x] Retirar concluídos do backlog mantendo pendências físicas.
- [ ] Consolidar aprovação visual das imagens (pertence ao aceite de CP3).

### CP1 — Catálogo e matriz (depende CP0)
Arquivos: dois HTMLs; `diagnostics/e15-bracing-catalog.test.cjs` (novo); ajustar E14 sem enfraquecer seus checks.
Interfaces produzidas: BRACING_EXERCISES, BRACING_WEEKS, migrateBracingProgram.
- [x] Escrever regressão antes do código: 8 semanas, IDs BR-01…08, matriz, BR-03 e semana 8.
- [x] Executar `node diagnostics/e15-bracing-catalog.test.cjs`; RED contra o baseline e GREEN após implementação.
- [x] Implementar catálogo e migrador; aplicar só no programa 1 durante hidratação.
- [x] Testar migração idempotente, preservação de histórico/IDs e metas; coberto também em `diagnostics/progress-persistence.test.cjs`.
- [x] Teste focado PASS + paridade HTML; registrado em `docs/roadmap/execucao.md`.
**Aceite:** prescrição fiel e nenhum volume duplicado por duas metas diárias.

### CP2 — Motor por repetição e sessão divisível (depende CP1)
Arquivos: dois HTMLs; `diagnostics/e15-bracing-catalog.test.cjs`, `diagnostics/e15-bracing-integration.test.cjs`, `diagnostics/session-engine.test.cjs`.
Consome catálogo; produz getBracingSteps e bracingResume; integra getProgramSteps/finishDailySession/abortDailySession.
- [x] GREEN: semana 1 tem 18 contrações; semana 3 BR-03 tem 24 repetições, 12 por lado; semana 8 tem 90 repetições em duas voltas.
- [x] BR-04/05 são movimentos de 4s sem retenção; volta 8 tem exatamente um descanso de 50s, sem transição empilhada.
- [ ] RED: sessões legadas 1/2 produzem mesma ordem; soma de durações coincide com total mostrado; nenhum repouso final redundante.
- [x] Implementar passos com preparação, execução individual, recuperações, transições e avaliação final, sempre orientando respiração livre.
- [x] Divisão/retomada mantém marcador aditivo e sessão original; abort/skip/redução registram volume parcial e skip não avança se o checkpoint não salvar.
- [x] Executar diagnósticos focados e session-engine; registrar evidência.
**Aceite:** player realmente ensina sequência, respiração e lados; divisão não significa dois treinos completos.

### CP3 — Guia e assets (depende CP1/CP2; geração pode antecipar)
Arquivos: dois HTMLs; diretórios img/bracing/v2 espelhados; `diagnostics/e15-bracing-guide.test.cjs` (novo).
Consome catálogo e passos; BRACING_PHASES legado passa a ser derivado ou removido com referências atualizadas.
- [ ] Revisar as oito pranchas e corrigir qualquer etapa/anatomia inconsistente; registrar decisão de Rafael.
- [x] Diagnóstico confirma guia e detalhes derivados da matriz; exercícios Bracing sem posturas no chão/quatro apoios.
- [ ] Integrar as novas pranchas após aprovação de Rafael; manter imagens em ambos os destinos, hashes iguais, zoom e legendas acessíveis.
- [x] Conferir Bracing com uma sessão diária e cinco dias por semana; eliminar rotação e oferta de iniciar semana inativa.
- [ ] Capturar semanas 1/3/5/8 em tela de celular e overlay expandido; fonte ampliada, tema AMOLED, modo silencioso e TalkBack.
**Aceite:** conteúdo consistente em todas as entradas e imagens legíveis/aprovadas.

### CP4 — Avaliação técnica e histórico (depende CP1/CP2)
Arquivos: dois HTMLs; `diagnostics/e15-bracing-progression.test.cjs` (novo), `diagnostics/progress-persistence.test.cjs`.
Consome migrador; produz canAdvanceBracingWeek/applyBracingWeekReview.
- [x] Quinto dia sem avaliação não avança; datas/calendário sem registros não criam prática.
- [x] Falha de resposta e cancelamento bloqueiam avanço; cinco respostas positivas e confirmação avançam uma fase por vez, incluindo semana 8.
- [x] Mostrar cinco itens técnicos, incluindo respiração livre, conforto, estabilidade e volume completo.
- [x] Repetição de semana permitida; controles manuais não contornam revisão.
- [x] Prática reduzida conta consistência, mas não volume integral; repetição com cinco práticas completas mais recentes pode liberar nova avaliação.
- [ ] Testar especificamente virada da data local durante sessão e backup/retomada de um split Bracing no aparelho; gates físicos permanecem pendentes.
- [x] Executar diagnósticos de progressão e persistência; registrar evidência.
**Aceite:** progresso técnico explícito, persistente e sem punição por faltas.

### CP5 — Integração e qualidade (depende CP1–CP4)
Arquivos: HTMLs, diagnósticos; Kotlin somente se regressão demonstrar necessidade.
- [x] Executar E14, e07-programas, e12-day-session-details, progress-persistence, session-engine e diagnósticos E15.
- [x] Confirmar getProgramSteps abastece a bridge existente sem novo protocolo nativo ou timer paralelo.
- [ ] Testar pausa/retomada, tela bloqueada, TTS desligado, haptics/Wear, abort e eventos repetidos; retorno da WebView recupera passo/lado.
- [x] Executar `bash scripts/check.sh` com JDK e Android SDK; exit 0, BUILD SUCCESSFUL e CHECK PASS.
- [x] Rodar `git diff --check`; registrar diff, evidência e lacunas.
**Aceite:** builds app/Wear e regressões passam; sem relaxar segurança para carregar imagens.

### CP6 — Auditoria e homologação (depende CP5)
- [x] Auditor independente revisou diff de código, matriz, migração, progresso e retomada; findings resolvidos, sem findings residuais.
- [ ] Rafael valida visual, sequência de exercícios e compreensão dos controles.
- [ ] S25 Ultra físico: treinamento, divisão, bloqueio, overlay, rotação, fonte ampliada e TalkBack.
- [ ] Galaxy Watch físico: reconexão/haptics; sem dispositivo, NOT_TESTED.
- [ ] Registrar aceite final e só então marcar E15 CONCLUÍDA. Sem commit/push/release automático.
**Aceite:** evidência técnica, visual e física separada e nenhuma pendência escondida.

## 7. Como retomar e registrar evidência

Primeira ação de implementação: CP1, teste `e15-bracing-catalog.test.cjs`. Não iniciar pela pintura de tela ou trocar todas as imagens antigas.

Cada checkpoint registra: status; arquivos; cenário; comando; exit code; captura quando aplicável; auditor/findings; gate físico/visual NOT_TESTED quando ausente; próxima tarefa exata. Se houver dúvida, consultar a fonte e o contrato acima; não inventar um exercício, dose ou API existente.

Exemplo de gate Windows com Git Bash:
```powershell
$env:JAVA_HOME = 'C:/Program Files/Android/Android Studio/jbr'
$env:ANDROID_HOME = 'C:/Users/notefael/AppData/Local/Android/Sdk'
& 'C:/Program Files/Git/bin/bash.exe' scripts/check.sh
```


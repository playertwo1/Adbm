# CoreFlow — roadmap de execução
Atualizado: 20/09/2026. Status: E00–E03 concluídas; E04 em execução, com aceite integral bloqueado por decisão clínica pendente.
Objetivo: melhorar Stomach Vacuum e implementar as 10 telas AMOLED com funções reais.
Histórico anterior preservado em [histórico](docs/roadmap/historico-2026-09-19.md).

## 1. Procedimento obrigatório para o agente
1. Ler este plano, verificar Git e ler o último registro de execução.
2. Escolher a primeira tarefa pendente com dependências satisfeitas.
3. Confirmar arquivos, funções e comportamento no código antes de editar.
4. Implementar uma tarefa por vez. Preservar alterações existentes.
5. Executar seu aceite; registrar comando/cenário, resultado e evidência.
6. Marcar checkbox somente após implementação e verificação.
7. Ao encerrar, registrar próximo passo exato, arquivos alterados e bloqueios.

Estados: PENDENTE, EM EXECUÇÃO, BLOQUEADA, CONCLUÍDA. Todas as etapas começam PENDENTES.
Sem teste exigido, não declarar conclusão. Bloqueio de aparelho não equivale a teste aprovado.
Código confirma comportamento; imagens orientam aparência; este plano define escopo.
Não inventar APIs, sensores, histórico, resultados de teste ou protocolo clínico.
Não mudar framework, IDs de programas ou armazenamento sem necessidade documentada.
Não reduzir critérios de aceite para fazer uma tarefa passar.
Se documentação histórica divergir do código, registrar e confirmar antes de mudar comportamento.

## 2. Arquivos confirmados
- Interface: `index.html` e `app/src/main/assets/index.html`; manter equivalentes.
- Bridge/WebView: `app/src/main/java/com/example/MainActivity.kt`.
- Treino: `app/src/main/java/com/example/WorkoutForegroundService.kt` e `WorkoutSessionPlayer.kt` no mesmo diretório.
- Áudio: `app/src/main/java/com/example/MindfulnessAudioService.kt`.
- Lembretes: `app/src/main/java/com/example/ReminderScheduler.kt`.
- Watch: `app/src/main/java/com/example/WearHapticsRelay.kt` e módulo `wear/`.
- Regressão: `diagnostics/progress-persistence.test.cjs`.
- Evidências futuras: criar `docs/roadmap/execucao.md` ao iniciar E00.
- Imagens: `assets/design/coreflow-s25-ultra/`, commit `114366b`.

## 3. Sequência e dependências
| Etapa | Entrega | Dependências |
| --- | --- | --- |
| E00 | Baseline e inventário | Nenhuma |
| E01 | Atalho e tempo real do vácuo | E00 |
| E02 | Dados e migração | E01 |
| E03 | Regras de treino | E00 |
| E04 | Motor e recuperação | E02, E03 |
| E05 | Componentes AMOLED e navegação | E00 |
| E06 | Player de vácuo | E04, E05 |
| E07 | Programas e detalhe | E06 |
| E08 | Onboarding e Hoje | E05, E07 |
| E09 | Perfil | E02, E05 |
| E10 | Discreto e Pausas | E03, E05 |
| E11 | Mindfulness | E05 |
| E12 | Evolução | E02, E07 |
| E13 | Validação integrada | E06–E12 |

## 4. Etapas e checklists

### E00 — Baseline
- [x] Conferir Git, versão, instruções locais e alterações pendentes.
- [x] Localizar estado, início, pausa, salto, conclusão, persistência e callbacks web/nativos.
- [x] Confirmar `AppState.vacuo`, programa ID 3, `triggerQuickAction`, `advanceVacuoSeries`, `handleNativeVacuumState` e `finishDailySession`.
- [x] Reproduzir referência incorreta `AppState.vacuum`; verificar existência do iniciador chamado pelo atalho.
- [x] Confirmar registro fixo de 10 minutos no vácuo web.
- [x] Inventariar programas, fases, dados salvos, backup, áudios e recursos Watch realmente disponíveis.
- [x] Executar regressão existente e registrar falhas anteriores.
- [x] Verificar Node, JDK, SDK, navegador, ADB e Watch; registrar disponibilidade real.
Aceite: registro com símbolos, comandos, resultados e limitações; nenhuma suposição apresentada como teste.

### E01 — Correções do vácuo
Arquivos: HTMLs; serviço/bridge se necessário.
- [x] Corrigir chave de estado e chamar o iniciador existente confirmado.
- [x] Impedir duas sessões por duplo toque.
- [x] Trocar 10 minutos fixos por tempo executado; excluir pausa e duração pulada.
- [x] Unificar arredondamento web/nativo e documentar regra.
- [x] Deduplicar conclusão por ID; callback repetido não gera novo treino.
- [x] Criar regressões específicas e sincronizar HTML embarcado.
Aceite: 125 segundos praticados e 30 pausados contabilizam 125 segundos antes do arredondamento; atalho inicia uma sessão; salto não credita tempo não executado.

### E02 — Persistência e migração
- [x] Mapear campos existentes antes de acrescentar novos.
- [x] Definir contrato: ID, versão, programa, etapa, data, estado, séries previstas/feitas, retenção, recuperação, pausa, interrupção e feedback opcional.
- [x] Especificar unidades, limites, campos opcionais e fonte de verdade.
- [x] Separar concluída/interrompida/cancelada; definir efeitos em minutos, metas, sequência e conquistas.
- [x] Preservar histórico e posição; não fabricar métricas ausentes nos dados antigos.
- [x] Criar cópia anterior à migração; aceitar backup antigo com campos opcionais ausentes.
- [x] Validar importação antes de gravar; cancelamento não altera estado.
- [x] Testar migração repetida, gravação falha, restauração, reabertura e callback duplicado.
Aceite: migrar duas vezes não muda resultado; erro mantém última cópia válida; posição e sessões anteriores preservadas.

### E03 — Conteúdo e progressão
Saída: criar `docs/roadmap/regras-vacuum.md`.
- [x] Inventariar as oito fases atuais: postura, séries, retenção, descanso e frequência.
- [x] Revisar diferença entre bracing, vácuo e hipopressivos; alinhar texto, voz e ilustração.
- [x] Definir tutorial: postura → preparação → execução → saída → recuperação.
- [x] Definir feedback Confortável/Difícil/Interrompi, qualidade relatada e resposta ausente.
- [x] Definir critérios revisados de manter/reduzir/sugerir avanço; ausência de feedback não significa sucesso.
- [x] Definir incremento de descanso, limites e parâmetros por postura com justificativa técnica; não inventar dosagem.
- [x] Permitir repetir etapa; aumento não decorre só do calendário ou recorde.
- [x] Definir agenda, recuperação, sequência e data de vigência de alterações.
- [x] Registrar responsável/fonte da revisão e decisões não resolvidas.
Aceite: regras explícitas e revisadas. Dosagem não resolvida bloqueia sua implementação, sem bloquear correções independentes. A implementação segura usa o mínimo da fase, abre revisão pendente ao atingir a frequência e não avança automaticamente.
Evidência contextual: [revisão de hipopressivos](https://pubmed.ncbi.nlm.nih.gov/40565470/); não valida automaticamente o protocolo do app.

### E04 — Motor de sessão
Estado: EM EXECUÇÃO; aceite integral BLOQUEADO pelo incremento de recuperação não aprovado em E03.
- [ ] Identificar preparação, inspiração, expiração, retenção, retorno e recuperação.
- [ ] “Encerrar retenção” registra executado e vai ao retorno/recuperação.
- [ ] “Mais descanso” aplica incremento de E03 e atualiza tempo/estimativa. **BLOQUEADO:** E03 não define incremento aprovado.
- [ ] Pausa na retenção orienta sua saída; retomada não exige continuar apneia congelada.
- [ ] Bloquear alteração silenciosa de carga/postura em série ativa.
- [ ] Encerrar salva parcial; não conclui automaticamente programa.
- [ ] Feedback fica associado ao ID; permitir não responder.
- [ ] Retomar estado do serviço após bloqueio, sem iniciar timer concorrente.
- [ ] Cancelar sinais pendentes ao encerrar; evitar vibração duplicada.
Aceite: sequência, tempo e estado iguais nos caminhos web/nativo; interrupção permanece parcial após reabertura.
Evidência parcial verificada: diagnóstico do motor cobre registros/feedback por ID e restauração do snapshot web de vácuo sem timer/posse nativa obsoletos. Isso não comprova o aceite completo nem substitui validação no aparelho. Marcações anteriores de conclusão foram retiradas por falta de evidência e contradição com o bloqueio de E03.

### E05 — Sistema visual
- [x] Tokens: preto #000000, superfícies #0A0A0B/#111214, texto claro, verde/menta, ciano e alertas.
- [x] Componentes reutilizáveis: botão, ícone, card, seletor, toggle, modal, aviso, vazio e erro.
- [x] Navegação fixa: Hoje, Programas, Pausas, Evolução, Perfil; atalhos para Vácuo/Discreto/Mindfulness.
- [x] Voltar fecha modal antes de sair da tela; tratar sessão ativa.
- [x] Alvos de toque de 48dp equivalentes na WebView, rótulos e seleção compreensível sem cor.
- [x] Insets reais, câmera, teclado, gestos, fonte ampliada, TalkBack e redução de movimento (suporte implementado; validação física pendente).
- [x] Layout responsivo para S25 Ultra e telas menores; não fixar pixels físicos.
- [x] Assets essenciais locais/offline; não usar PNG inteiro como interface.
- [x] Criar inventário de controles: tela, ID, evento, estado alterado, persistência, falha/cancelamento e teste.
Aceite: navegação funcional; sem sobreposição/corte; nenhum controle decorativo aparentando funcionar.
Evidência E05: `docs/roadmap/inventario-controles-e05.md`, `diagnostics/e05-visual.test.cjs`, comparação byte a byte dos HTMLs e validação browser/emulador registrada no `docs/roadmap/execucao.md`.

### E06 — Tela 03: Vácuo
[Referência](assets/design/coreflow-s25-ultra/03-vacuo-player.png)
- [x] Mostrar postura, parâmetros, fase, contador, série, próxima etapa e estimativa reais.
- [x] Seletores configuram a sessão antes do início.
- [x] Ligar iniciar/pausar/retomar/pular/encerrar retenção/mais descanso/encerrar ao motor E04.
- [x] Voz/hápticos/Watch refletem configurações reais; sem conexão fictícia.
- [x] Tutorial abre e retorna preservando configuração.
- [x] Falha ao iniciar não deixa timer animando; oferecer nova tentativa.
- [x] Resumo mostra executado e solicita feedback.
Aceite: sessão completa, parcial e pausa durante retenção verificadas; todos os controles do inventário exercitados.
Evidência E06: `diagnostics/e06-vacuo-player.test.cjs`, equivalência byte a byte dos HTMLs, browser local em viewport padrão com configuração persistida, tutorial, iniciar/pausar/retomar, salto, saída segura da retenção, encerramento parcial e feedback opcional. “Mais descanso” permanece desativado por decisão registrada; Watch sem ponte informa indisponibilidade.

### E07 — Telas 06/07: Programas e detalhe
[Programas](assets/design/coreflow-s25-ultra/06-programas.png) · [Detalhe](assets/design/coreflow-s25-ultra/07-programa-detalhe.png)
- [ ] Cards abrem programa correto, preservando IDs e fases reais; corrigir divergências do mockup.
- [ ] Progresso, etapa, sessão diária e duração calculados do estado real.
- [ ] Exercícios abrem instruções e duração da sequência escolhida.
- [ ] Iniciar envia exatamente etapa/sessão exibidas.
- [ ] Repetir etapa altera planejamento futuro sem apagar diário.
- [ ] Ajuste manual mantém prévia e não cria treino retroativo.
- [ ] Agenda, recuperação e sugestão de progressão obedecem E03.
- [ ] Definir estados sem histórico, concluído e erro.
Aceite: etapa 3/sessão 2 abre etapa 3/sessão 2; reabrir preserva posição; ajuste não fabrica minutos.

### E08 — Telas 01/02: Onboarding e Hoje
[Onboarding](assets/design/coreflow-s25-ultra/01-onboarding.png) · [Hoje](assets/design/coreflow-s25-ultra/02-home.png)
- [ ] Etapas: objetivo → meta/agenda → revisão; Voltar preserva preenchimento.
- [ ] Validar meta conforme contrato; salvar conclusão e abrir Hoje.
- [ ] Usuário existente acessa histórico sem onboarding obrigatório novamente.
- [ ] Saudação usa nome real ou neutro; números usam diário.
- [ ] Editar meta permite salvar/cancelar.
- [ ] Recomendação continua programa selecionado; sem programa oferece seleção; registrar desempate.
- [ ] Começar agora abre sessão exibida; atalhos Vácuo/Pausa/Kegel/Meditar/Discreto abrem módulos corretos.
- [ ] Avatar abre Perfil; lembretes abrem configuração/permissão.
Aceite: instalação limpa, atualização, meta inválida e nenhum programa têm caminhos utilizáveis sem dados fictícios.

### E09 — Tela 10: Perfil
[Referência](assets/design/coreflow-s25-ultra/10-perfil-preferencias.png)
- [ ] Nome/meta com salvar/cancelar e persistência.
- [ ] Lembretes configuram horários reais; permissão negada não aparece ativa.
- [ ] Voz/hápticos controlam motor; tema AMOLED altera aparência e persiste.
- [ ] Acessibilidade abre ajustes com efeito verificável.
- [ ] Watch mostra disponibilidade real e teste de vibração com retorno de falha.
- [ ] Remover dados de sensores/bateria do mockup quando integração não existir.
- [ ] Backup/exportação/importação usam arquivo real, prévia, cancelamento e erro.
- [ ] Exclusão informa escopo, oferece exportação e exige confirmação explícita.
Aceite: preferências sobrevivem à reabertura; importação cancelada preserva dados; desconexão não aparece conectada.

### E10 — Telas 04/05: Discreto e Pausas
[Discreto](assets/design/coreflow-s25-ultra/04-modo-discreto.png) · [Pausas](assets/design/coreflow-s25-ultra/05-pausas-ativas.png)
- [ ] Posição/intensidade selecionam parâmetros revisados; prévia corresponde à execução.
- [ ] Sem áudio cumpre regra documentada; manter orientação visual.
- [ ] Iniciar/pausar/retomar/encerrar funcionam e registram executado.
- [ ] Filtros de região alteram catálogo; Ver todos restaura lista.
- [ ] Card abre exercício certo com instruções; Começar pausa inicia item exibido.
- [ ] Recomendação tem regra explícita; sem contexto permite escolher.
- [ ] Preservar Pausa de Resposta de três estágios, modo silencioso e histórico opcional.
Aceite: testar todos os filtros/cards; parcial não vira sequência completa; catálogo disponível sem recomendação.

### E11 — Tela 08: Mindfulness
[Referência](assets/design/coreflow-s25-ultra/08-mindfulness-player.png)
- [ ] Usar faixas existentes e duração real.
- [ ] Play/pausa, ±15s e busca controlam áudio; limitar posição aos extremos.
- [ ] Próxima faixa corresponde ao arquivo anunciado; fim da lista tem comportamento definido.
- [ ] Notificação/tela sincronizam posição em segundo plano; apenas uma reprodução.
- [ ] Distinguir silenciar avisos de silenciar narração.
- [ ] Hápticos cancelados ao encerrar.
- [ ] Arquivo ausente oferece erro/nova tentativa; não gera conclusão.
- [ ] Pausa de Resposta abre seu fluxo próprio, sem áudio fictício do mockup.
Aceite: controles na tela/notificação, extremos da busca, bloqueio e arquivo ausente verificados.

### E12 — Tela 09: Evolução
[Referência](assets/design/coreflow-s25-ultra/09-evolucao.png)
- [ ] Período altera totais, comparação, gráfico e histórico juntos.
- [ ] Dia abre sessões; soma dos dias confere com total.
- [ ] Separar retenção, recuperação e tempo total; feedback ausente identificado.
- [ ] Mostrar interrupção sem conclusão integral.
- [ ] Conquistas abrem critérios e estado real.
- [ ] Sem base anterior, comparação indisponível; não inventar percentual.
- [ ] Insight de horário descreve frequência, não rendimento não medido.
- [ ] Exportar relatório usa mesmo período/dados; backup permanece acessível em Perfil.
Aceite: períodos vazio/parcial/completo conferem com diário e exportação.

### E13 — Integração e Android
- [ ] Verificar equivalência dos HTMLs e referências de assets.
- [ ] Executar regressões novas e existentes; registrar saídas.
- [ ] Confirmar sintaxe JavaScript e build Android; comando inicial a validar em E00: `.\gradlew.bat testDebugUnitTest assembleDebug`.
- [ ] Testar dez telas, Voltar, modais, teclado, erros, permissões e offline.
- [ ] Capturar telas e comparar às imagens; registrar desvios intencionais.
- [ ] Validar fonte ampliada, TalkBack, contraste e movimento reduzido.
- [ ] S25 Ultra: gestos, rotação, bloqueio, segundo plano e retomada.
- [ ] Watch: conexão, desconexão, reconexão, sinais e cancelamento.
- [ ] Atualizar instalação anterior e verificar posição, diário, preferências e backups.
- [ ] Gerar release conforme SIGNING.md quando ambiente disponível; registrar versão e limitações.
Aceite: testes exigidos aprovados e evidências registradas. Validação física pendente deve permanecer pendente. Publicação segue autorização vigente.

## 5. Registro para retomada
Criar registro por tarefa em `docs/roadmap/execucao.md`:
- Data, tarefa e estado.
- Referência Git e dependências confirmadas.
- Arquivos/símbolos alterados.
- Subitens concluídos.
- Comando ou cenário → resultado → evidência.
- Falhas anteriores versus novas.
- Decisões e justificativas.
- Bloqueios e dependentes afetados.
- Arquivos ainda não commitados.
- Próximo passo exato.

## 6. Limites
- Preservar arquitetura Android/WebView e Wear.
- Não adicionar login, nuvem, sensores de saúde ou monetização por inferência.
- Não transformar números/fotos/ícones do mockup em informações verdadeiras.
- Não apagar histórico antigo nem considerar incidentes anteriores resolvidos por esta reescrita.
- Não prometer ausência de erros da IA: exigir evidência e retomada documentada.

## 7. Práticas pesquisadas
- [Anthropic: Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents): funcionalidades verificáveis, trabalho incremental e registro de progresso entre sessões.
- [OpenAI: Harness engineering](https://openai.com/index/harness-engineering/): conhecimento e planos versionados no repositório, decisões e progresso documentados.

Aplicação: IDs, dependências, uma tarefa por vez, critérios de aceite, histórico separado e ponto de retomada. Organização adaptada ao CoreFlow; não é garantia de execução sem erros.

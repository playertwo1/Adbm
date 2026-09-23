# Registro de auditorias — CoreFlow

Preenchido pelo **Auditor**, uma entrada por veredito emitido (PASS, FAIL ou ESCALATE),
em ordem cronológica, ao final de cada rodada de revisão. Uma rodada sem entrada aqui é
uma rodada perdida: não dá para melhorar o processo sobre dados que não foram registrados.

O objetivo não é vigiar o Builder. É responder, com dados e não com impressão, a três
perguntas: o número de rodadas até o aceite está caindo, a cobertura se manteve, e os
defeitos que escapam depois do PASS estão diminuindo.

## Como preencher

- **Uma entrada por veredito**, não por card. Um card com 5 rodadas gera 5 entradas.
- **Dado ausente é `desconhecido`, nunca `0`.** Zero é uma medição; desconhecido é a falta dela.
- **Não reescrever entradas antigas.** Se um achado foi retirado depois, isso vira uma
  entrada nova ou uma linha de correção na entrada original, com data — nunca um apagamento.
- Preencher logo após o veredito, enquanto a evidência está à mão.

### Campos

| Campo | O que registrar |
|---|---|
| `card` / `rodada` | ID do card e o número desta rodada (`n/3` conforme a política). |
| `veredito` | PASS, FAIL ou ESCALATE. |
| `target_sha` | O SHA exato auditado. |
| `classe` | `ENUMERÁVEL` (casos restantes finitos e listáveis) ou `ABERTA` (mesma classe reaparecendo em camadas novas). Dois FAILs seguidos com classe ABERTA são motivo de redesenho, não de outro patch. |
| `achados_confirmados` | Quantos bloqueadores confirmados, com os IDs. |
| `achados_retirados` | Hipóteses levantadas e depois refutadas pela própria investigação. **Este número deve ser maior que zero em auditorias saudáveis** — auditoria que nunca retira nada não está tentando refutar as próprias suspeitas. |
| `achados_tardios` | Achados que já existiam em rodadas anteriores e passaram. Indicar se foram perdidos antes, introduzidos pela correção, ou vieram de requisito novo. |
| `causa_raiz` | A causa comum dos achados desta rodada, se houver. Repetição da mesma causa entre rodadas é o sinal mais importante deste registro. |
| `gates_mecanicos` | Quais verificações automáticas rodaram e o resultado (`scripts/check.sh`, `scripts/check-doc-sha.sh`, diagnósticos `diagnostics/*.test.cjs`). |
| `familia_builder` / `familia_auditor` | Família de modelo de cada lado. Mesma família nos dois = ponto cego compartilhado; registrar como limitação. |
| `cobertura` | O que foi efetivamente exercitado, e o que **não** foi (aparelho físico, TalkBack, Watch). Lacuna obrigatória impede PASS. |
| `tempo_espera` | Tempo perdido com quota, crash ou indisponibilidade de ambiente. **Separado do tempo técnico** — falha operacional não é FAIL do Builder e não conta na política de rodadas. |
| `regressao_pos_pass` | Preenchido depois: um defeito encontrado numa etapa seguinte que deveria ter sido pego aqui. É a única métrica que mostra se menos FAIL significou mais qualidade ou só menos rigor. |

---

## Linha de base (antes da v4 das instruções)

Registrada retroativamente a partir do histórico do Kanban, para haver com o que comparar.
Não foi preenchida pelo Auditor na época; é reconstrução, e está marcada como tal.

| card | etapa | rodadas até o desfecho | desfecho | causa raiz predominante |
|---|---|---|---|---|
| `t_600dfe21` | E07.5 | 6 | PASS | agenda/progresso fabricados em caminhos diferentes |
| `t_281c2916` | E08.6 | 6 | FAIL definitivo | lógica de permissão/validade duplicada entre camadas; `snoozeRequestCode` não injetiva |
| `t_b3ac2abf` | E08.6-R | 1 | aceito com limitação | redesenho; Finding 1 aceito por decisão de Rafael |
| `t_53330354` | E08.7 | 5 | PASS | **4 dos 5 FAILs foram documentais** — SHA declarado divergindo do HEAD real |

Leitura: nenhum desses FAILs foi ruído. Dois padrões aparecem — uma classe de bug aberta
que reaparecia em camadas novas (E08.6), e uma classe inteiramente mecânica que nunca
deveria ter consumido rodada de auditoria (E08.7). O gate `scripts/check-doc-sha.sh`
existe por causa do segundo; a classificação ENUMERÁVEL/ABERTA, por causa do primeiro.

---

## Entradas

<!-- Copiar o bloco abaixo para cada veredito. Mais recente no topo. -->

<!--
### AAAA-MM-DD HH:MM — <card> — <etapa> — rodada n/3 — <VEREDITO>

- target_sha: `<sha>`
- classe: ENUMERÁVEL | ABERTA | n/a (PASS sem achados)
- achados_confirmados: <n> (<IDs>)
- achados_retirados: <n> (<IDs e por que foram refutados>)
- achados_tardios: <n> (<já existia | introduzido pela correção | requisito novo>)
- causa_raiz: <frase curta, ou "sem causa comum">
- gates_mecanicos: <comando → resultado>
- familia_builder: <ex. claude> / familia_auditor: <ex. gpt>
- cobertura: <o que foi exercitado> | NÃO coberto: <lacunas>
- tempo_espera: <min de quota/crash/ambiente, ou desconhecido>
- regressao_pos_pass: <preencher depois, ou "nenhuma até <data>">
-->

_Nenhuma entrada ainda. A primeira auditoria após a integração da E08 abre esta seção._

### 2026-09-23 — t_47ab1fd4 — E09.4 — rodada 1/3 — FAIL

- target_sha: `a1e405d2c8c51937ec73ac5892f2a22f31873831`
- classe: ENUMERÁVEL (par saveState/loadSavedState duplicado, causa única e localizada)
- achados_confirmados: 1 (F1 — AC-1 violado: persistência de voz/hápticos/Watch escrita em função `saveState`/`loadSavedState` morta, nunca executada)
- achados_retirados: 1 (hipótese de que a UI condicional expunha dados mock — refutada: `available` deriva de `Boolean(window.AndroidBridge?.isWatchHapticsEnabled)`, fonte real; AC-2/AC-3/AC-4 sustentados por leitura + diagnóstico)
- achados_tardios: 0
- causa_raiz: `index.html` tem dois `<script>` no mesmo escopo global; cada um declara `function saveState()`/`function loadSavedState()`. Por hoisting de function declaration, a segunda declaração (linha ~13188/13507, parte do pipeline real `CorePersistence`/`collectProgressData`) sobrescreve a primeira (linha ~3876/3610). O Builder implementou AC-1 na primeira definição, que nunca é chamada em runtime — confirmado por execução real em `vm` (Node), não apenas leitura estática.
- gates_mecanicos: `bash scripts/check.sh` → PASS (build+equivalência); `node diagnostics/e09-4-voice-haptics-watch.test.cjs` → PASS, mas o teste só faz regex/string-match no código-fonte, não executa — não detecta shadowing; `cmp -s index.html app/src/main/assets/index.html` → idêntico; `sha256sum` idênticos; `git diff --check` limpo.
- familia_builder: gemini-3.8-flash-high (antigravity) / familia_auditor: claude sonnet 5 (anthropic) — famílias diferentes, sem ponto cego compartilhado declarado.
- cobertura: leitura completa do diff `d9af749..a1e405d` em `index.html`; execução real via Node `vm` do bloco `<script>` de produção (`saveState`, `loadSavedState`, `toggleVoice`) contra `localStorage` simulado, provando que `coreflow_voice_enabled`/`coreflow_haptics_enabled`/`coreflow_watch_haptics_enabled` nunca são escritos nem lidos pelo runtime real; leitura de `syncWatchHapticsSetting`/`toggleWatchHaptics` e da condição `available` (AC-2/AC-3/AC-4). NÃO coberto: Android físico, Galaxy Watch físico, TalkBack (limitação já declarada pelo Builder, sem cobertura obrigatória automatizável nesta rodada).
- tempo_espera: desconhecido (rodada iniciada já com handoff pronto; sem quota/crash observado nesta sessão).
- regressao_pos_pass: n/a (FAIL, não chegou a PASS).

**Achado bloqueador F1:**
`F1 | BLOQUEADOR | alta confiança (execução real via vm.runInContext reproduz o defeito) | viola AC "Desligar voz/hápticos altera execução real, não só UI, e sobrevive à reabertura" | index.html:3876 (saveState morta) e index.html:3610 (loadSavedState morta) vs. index.html:13188/13507 (definições reais que sobrescrevem as anteriores) | condição alcançável: qualquer toggle de voz/hápticos/Watch em uso normal do app | esperado: coreflow_voice_enabled/coreflow_haptics_enabled/coreflow_watch_haptics_enabled persistidos e restaurados | observado: saveState() real (a que executa) nunca grava essas chaves; loadSavedState() real nunca as lê — reproduzido em script Node com vm simulando localStorage | resultado mínimo para fechar: mover a lógica de persistência/restauração de voz-hápticos-Watch para dentro do saveState()/loadSavedState() que efetivamente executam (linhas ~13188 e ~13507, dentro do pipeline collectProgressData/applyProgressData), remover ou consolidar a duplicata morta, e atualizar/reforçar o diagnóstico e09-4 para executar o script real (não apenas checar strings) de modo a detectar shadowing futuro.`


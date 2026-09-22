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

# Consolidação histórica dos targets aprovados divergentes

Data da execução: 2026-09-23
Card: `t_ce21c966`
Base obrigatória: `d9af749ee64b0d155629574ee43c81b405e5d0a3` (`main` no início da integração)
Target da consolidação: commit filho desta base; o SHA exato está no handoff do card para evitar auto-referência dentro deste próprio registro.
Escopo: reconciliar proveniência e artefatos históricos localmente, sem push, release, deploy, Actions ou fast-forward de `main`.

## Critérios observáveis

| AC-ID | Comportamento esperado | Entrada/estado | Caminho público/consumidores | Evidência/resultados |
| --- | --- | --- | --- | --- |
| AC-1 | Cada target tem decisão explícita: já representado, integrado ou excluído com motivo técnico. | Oito SHAs aprovados listados pelo Diretor. | Histórico Git, arquivos de produto, diagnósticos e registros de roadmap. | Inventário abaixo; nenhuma mudança equivalente reaplicada cegamente. |
| AC-2 | Comportamento material ausente é integrado uma única vez, preservando os contratos existentes. | Artefatos E07.1 ausentes na ponta de `main`. | `diagnostics/e07-programas-red.cjs` e `docs/roadmap/e07-contrato-inventario.md`. | Os dois artefatos foram adicionados sem alterar HTML, IDs, armazenamento, bridge ou protocolo. |
| AC-3 | Registros aprovados de decisão e auditoria permanecem na linha histórica. | E08.6-R já consolidada em descendentes; registro E09.2 ausente em `auditorias.md`. | `ROADMAP.md`, `docs/roadmap/execucao.md`, `docs/roadmap/auditorias.md`. | E08.6-R confirmada nos descendentes; entrada PASS E09.2 integrada em `auditorias.md`. |
| AC-4 | Integração não reintroduz regressões nem diverge os HTMLs. | Worktree baseada em `main`; dois HTMLs são fontes de verdade. | Diagnósticos, `scripts/check.sh`, `cmp`, `git diff --check`. | Gates executados no handoff; nenhum código funcional foi alterado nesta consolidação. |
| AC-5 | A auditoria futura recebe SHA imutável e mapa de proveniência. | Novo commit de consolidação. | Handoff Nexus e este registro. | `base_sha`/`target_sha` no handoff; este arquivo evita SHA auto-referente. |

## Inventário e decisão por target

| Ordem | Target aprovado | Etapa | Decisão | Proveniência e evidência |
| ---: | --- | --- | --- | --- |
| 1 | `f40a1bd505563cad4ff3045a73563d10a49f6cb9` | E04 | Já representado | Patch-id `8f2c5b66069c6e757c2c63b63c317344bb28fe5f` coincide exatamente com o checkpoint posterior `f1068c38f1886cda4b1339dc3a94228abba2b1b9`; os arquivos de comportamento e regressão já estão na linha atual. Não reaplicado. |
| 2 | `8351d801784c0cacf0f12f69a7388f1eff55224b` | E05-FIX | Já representado | Patch-id `85435c7a19936d1a3f42a057756b1bab693d747e` coincide exatamente com `03b1946caaa9e4488643cd64edf8cbb76450f2ab6`; `index.html`, asset, `diagnostics/e05-audit-fix.test.cjs` e o registro de execução já estão presentes. Não reaplicado. |
| 3 | `926c173890b6374e24d4b9c61988218432d35eb7` | E07.1 | Integrado | O código de produto não estava no target e não foi refeito. Os artefatos históricos ausentes `diagnostics/e07-programas-red.cjs` e `docs/roadmap/e07-contrato-inventario.md` foram adicionados; a entrada E07.1 já existente em `docs/roadmap/execucao.md` passa a referenciar arquivos presentes. |
| 4 | `047ede96d2bc6f37031fcf4fdf73eceac1f92925` | E07.2-R | Já representado | A árvore de comportamento/teste do target é idêntica à do checkpoint posterior `6d5f2f74a4cf569fbbf93c0e311af4e9c769bb03`; a documentação E07.2 e o checklist atual já estão nos descendentes de `main`. Não reaplicado. |
| 5 | `bb8c80b603afb04be7b0d5d553ddd34b8a435d79` | E07.3-FIX | Já representado | Patch-id `b88160bd866ef84edb70871cbd27240eed9684f1` coincide exatamente com `6548f9bf61ca7e4541cbac2d6f2e6baa893a178e`; fallback de exercícios e regressão já presentes. Não reaplicado. |
| 6 | `a6c48e693f3cae77be25e4ab2eb5a8f263a01bf1` | E07.4 | Já representado | Patch-id `595f17fe5e97d7a1db436d312f8b24f56346838b` coincide exatamente com `ca2e5b8ee140fe80b4247814567f313dfb70d05c`; preservação de fase/sessão, falha de início e regressão já presentes. Não reaplicado. |
| 7 | `64e45b61a1995498579a08e45f1e771f176a9d70` | E08.6-R | Já representado | A decisão e a limitação foram incorporadas na cadeia `666e24a6` → `291c068e` → `51041a9c` → `fd8ab4e`; `ROADMAP.md` e `docs/roadmap/execucao.md` registram a aceitação do risco e, depois, E09.3 registra a correção posicional. Não reaplicado. |
| 8 | `e354ddfc2304eff015f541b71dc6000a63c032eb` | Registro de auditoria E09.2 | Integrado | O target documental adiciona o veredito PASS cross-family para `61dec44716e139e3a006840b1d6302ea80784b91`; a mesma entrada foi integrada em `docs/roadmap/auditorias.md`, que estava sem entradas. Nenhum código foi alterado. |

## Conflitos, exclusões e limitações

- Não houve merge cego de branches divergentes e não houve conflito de implementação: os quatro patches materialmente repetidos foram comprovados por patch-id; E07.2 foi comparado contra o checkpoint posterior; E08.6-R foi rastreada pela cadeia documental posterior.
- Nenhum target foi descartado por perda de comportamento. "Já representado" significa que a aplicação literal seria duplicação equivalente, não que o target foi ignorado.
- O target da consolidação é novo e ainda precisa de auditoria independente integral; este registro não é PASS.
- Não houve teste em aparelho Android físico, Galaxy Watch físico ou TalkBack. A auditoria deve manter essas limitações explícitas.
- A autorização cobre integração local somente; push, release, deploy e GitHub Actions permanecem fora do escopo.

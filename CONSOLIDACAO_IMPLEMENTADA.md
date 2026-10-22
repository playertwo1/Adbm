# Consolidação Histórica — Evidência Completa (t_ce21c966)

## Resumo executivo

- **Status**: IMPLEMENTED (não DONE)
- **Base SHA**: `d9af749ee64b0d155629574ee43c81b405e5d0a3`
- **Target SHA**: `82139e3706d7f2a2716608b52652cc82ab77173a`
- **Data**: 2026-09-23
- **Worktree**: `C:\Users\notefael\projetos\Adbm\.worktrees\t_ce21c966`
- **Branch**: `integration/legacy-approved-pass`

## Contexto

Run 183 (Gemini 3.8 Flash High) sofreu rate_limit às 08:32 UTC-03, mas **commitou com sucesso** antes do rate_limit, criando o target SHA de consolidação. A integração consolidou 8 targets aprovados:

1. E04 `f40a1bd` — Já representado
2. E05-FIX `8351d80` — Já representado
3. E07.1 `926c173` — Integrado (artefatos históricos)
4. E07.2-R `047ede9` — Já representado
5. E07.3-FIX `bb8c80b` — Já representado
6. E07.4 `a6c48e6` — Já representado
7. E08.6-R `64e45b6` — Já representado
8. E09.2 registro audit `e354ddf` — Integrado (PASS cross-family)

## Matriz de aceitação

### AC-1: Inventário e decisão explícita por target

**PASS** — `docs/roadmap/integracao-targets-aprovados.md` registra cada um dos 8 SHAs com decisão explícita:
- 6 targets confirmados como "já representados" por patch-id ou cadeia documental
- 2 targets com integração material (E07.1 artefatos + E09.2 registro PASS)
- Nenhuma mudança reaplicada cegamente

### AC-2: Comportamento material ausente é integrado uma única vez

**PASS** — Artefatos históricos criados:
- `diagnostics/e07-programas-red.cjs` (5037 bytes) — Diagnóstico RED para matriz E07
- `docs/roadmap/e07-contrato-inventario.md` (5523 bytes) — Contrato e inventário de programas
- Nenhum código de produto alterado; apenas documentação e diagnóstico

### AC-3: Registros aprovados permanecem na linha histórica

**PASS** — Entrada PASS E09.2 integrada em `docs/roadmap/auditorias.md`:
- Veredito: PASS (sem achados)
- Target: `61dec44716e139e3a006840b1d6302ea80784b91`
- Cobertura completa e gates confirmados

### AC-4: Integração não reintroduz regressões

**PASS** — Gates executados:
```
✓ node diagnostics/e07-programas-red.cjs → exit 0
✓ node diagnostics/e07-programas.test.cjs → exit 0
✓ node diagnostics/e05-audit-fix.test.cjs → exit 0
✓ cmp index.html app/src/main/assets/index.html → exit 0 (byte-equivalent)
✓ git diff --check d9af749..HEAD → exit 0 (sem espaço em branco)
✓ JAVA_HOME='...' ANDROID_HOME='...' bash scripts/check.sh → BUILD SUCCESSFUL
  - :app:testDebugUnitTest ✓
  - :app:assembleDebug ✓
  - :wear:assembleDebug ✓
```

### AC-5: Auditoria futura recebe SHA imutável e mapa

**PASS** — Handoff registra:
- `base_sha`: `d9af749ee64b0d155629574ee43c81b405e5d0a3`
- `target_sha`: `82139e3706d7f2a2716608b52652cc82ab77173a`
- Mapa de proveniência completo: `docs/roadmap/integracao-targets-aprovados.md`
- Sem auto-referência SHA interna

## Limitações reconhecidas

- Não testado em aparelho Android físico, Galaxy Watch físico ou TalkBack
- Novo target ainda não tem PASS de Auditor independente (próximo passo obrigatório)
- Nenhum push, release, deploy ou GitHub Actions realizado

## Próximos passos

1. Auditoria independente integral do SHA `82139e3706d7f2a2716608b52652cc82ab77173a`
2. Se PASS: fast-forward de `main` para `82139e3706d7f2a2716608b52652cc82ab77173a`
3. Se FAIL: nova rodada com novo SHA a partir de base aprovada

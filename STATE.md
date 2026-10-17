# STATE — ponto de retomada

Qualquer agente deve conseguir retomar só com este arquivo + a seção ativa do `ROADMAP.md`, sem a conversa anterior. Curto: o que não for estado atual sai daqui. Registro detalhado de cada tarefa: `docs/roadmap/execucao.md`.

**Atualizado:** 2026-10-17 · **Marco ativo:** E15 — Bracing de 8 semanas · **Estado:** IN_PROGRESS

## O que funciona hoje (confirmado no código)
- Versão `1.1.46` (`versionCode 46`) em `gradle.properties`; release `v1.1.46` publicada em 2026-10-13 com APKs de celular e Wear.
- Programas Bracing (E15: catálogo BR-01..BR-08, 2 treinos/dia em 7 dias, ajuste manual de semana/dia), Stomach Vacuum, Kegel e Mindfulness; Modo Treino Flutuante; relay de vibração para o Wear.
- Gate local: `bash scripts/check.sh`; CI: `.github/workflows/build-apk.yml`.

## Última atividade
- ID / commit: `904ed4e` + `cbb9be0` (2026-10-13) — release 1.1.46: Cancelar, Pular e Dividir pausa do Bracing restaurados.
- Resultado real: segundo `docs/roadmap/execucao.md`, `bash scripts/check.sh` → CHECK PASS e verificação no emulador Pixel_9.
- Testes executados: nesta sessão de padronização (2026-10-17, só documentação) rodou apenas `node diagnostics/version-contract.test.cjs` → passa (falhava antes porque o README ainda dizia 1.1.45). `scripts/check.sh` NOT_RUN (sem JDK/Android SDK aqui).
- Evidência: `docs/releases/v1.1.46.md`, `docs/roadmap/execucao.md` (13/10).

## Próxima ação
- E15 CP3 — guia, detalhes e player usando o mesmo catálogo, com sequência de imagens legível e acessível (`docs/roadmap/bracing-8-semanas-v2.md`).

## Bloqueios e aprovações humanas
- CP6, E13 e FUTURA 3 dependem de aparelho físico (S25 Ultra, Galaxy Watch) e de aprovação visual das pranchas pelo Rafael; sem isso, NOT_TESTED.
- Limpeza manual pendente dos arquivos temporários de assinatura da release 1.1.44, fora do repositório (registro de 11/10 em `docs/roadmap/execucao.md`).

## Divergências entre roadmap e implementação
- `ROADMAP.md` §7 registra SHAs de rastreabilidade antigos (`666e24a…`); o próprio arquivo diz que são históricos.
- `CHANGELOG.md` não tem entradas para várias tags (v1.1.14, v1.1.21, v1.1.23, v1.1.26–v1.1.29, v1.1.31, v1.1.32, v1.1.34, v1.1.35).
- E15 CP2 diz "uma sessão diária", mas a decisão de 11/10 (E15-AJUSTE) passou para 2 treinos diários.

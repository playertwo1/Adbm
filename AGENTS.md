# AGENTS.md — CoreFlow

## Escopo

CoreFlow é um app Android/WebView com módulo Wear OS. Preserve a arquitetura atual; não altere IDs de programas, armazenamento ou protocolo de treino sem registrar a decisão e a evidência.

## Fontes de verdade

- Interface: `index.html` e `app/src/main/assets/index.html` devem permanecer idênticos.
- Estado e próxima ação: `STATE.md` (comece por aqui). Visão e escopo: `PROJECT.md`.
- Roadmap: `ROADMAP.md`; registre cada tarefa concluída em `docs/roadmap/execucao.md`.
- Versão: `CORE_FLOW_VERSION_CODE` e `CORE_FLOW_VERSION_NAME` em `gradle.properties`; CI pode sobrescrevê-las somente como par por `BUILD_VERSION_*`.
- Releases exigem `KEYSTORE_PATH`, `KEYSTORE_PASSWORD`, `KEY_ALIAS` e `KEY_PASSWORD`; nunca use assinatura debug para release.

## Antes de alterar

1. Leia o pedido e o trecho mínimo do código afetado.
2. Preserve alterações existentes e implemente uma tarefa do roadmap por vez.
3. Escreva ou atualize uma regressão antes de mudar comportamento.
4. Execute `bash scripts/check.sh` com JDK e Android SDK configurados.
5. Revise o diff e peça auditoria independente para mudança material.

## Segurança

A WebView deve carregar somente recursos locais e não pode conceder permissões web, conteúdo misto, navegação externa ou acesso local sem uma justificativa testada.

## Documentação e Git

- `CLAUDE.md` só importa este arquivo (`@AGENTS.md`); regras novas entram aqui.
- Ao publicar uma versão: atualize `gradle.properties`, `README.md` (o teste `diagnostics/version-contract.test.cjs` confere a versão), `CHANGELOG.md` (`## X.Y.Z — AAAA-MM-DD`) e `docs/releases/vX.Y.Z.md`.
- Ao encerrar sessão relevante, atualize `STATE.md`. Nunca force push nem reescreva histórico.

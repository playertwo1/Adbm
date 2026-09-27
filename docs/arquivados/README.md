# Arquivados — CoreFlow

Este diretório contém artefatos históricos, especificações de etapas já concluídas do roadmap e arquivos obsoletos retirados da raiz e de diretórios ativos do projeto para manter a base de código enxuta e focada nas entregas futuras.

## Conteúdo Arquivado

### 1. Roadmap e Especificações
- [`roadmap-etapas-concluidas.md`](roadmap-etapas-concluidas.md): Registro integral dos checklists, critérios de aceite e evidências das etapas E00 a E12 já concluídas e consolidadas no repositório. O roadmap ativo permanece em [`ROADMAP.md`](../../ROADMAP.md).
- [`E09.5_IMPLEMENTACAO.md`](E09.5_IMPLEMENTACAO.md): Documento de entrega e matriz de aceitação da feature E09.5 (Backup Seguro e Exportação Criptografada com AES-256 + SHA-256), anteriormente localizado na raiz do repositório.
- [`e09-4-IMPLEMENTATION.md`](e09-4-IMPLEMENTATION.md): Documento de implementação da etapa E09.4 (Voz, Hápticos e Galaxy Watch com Disponibilidade Real), anteriormente localizado em `docs/`.

### 2. Scripts Obsoletos / Pontuais
- [`patch_main.py`](patch_main.py): Script Python de automação utilizado pontualmente em 23/08/2026 para aplicar o overlay de animação Lottie/Confetti em `MainActivity.kt`. Obsoleto após aplicação das alterações no código nativo.
- [`e095-tests.js`](e095-tests.js): Script de testes ad-hoc e validação em navegador desenvolvido durante a etapa E09.5, não integrado ao pipeline de testes automatizados (`diagnostics/*.test.cjs`).

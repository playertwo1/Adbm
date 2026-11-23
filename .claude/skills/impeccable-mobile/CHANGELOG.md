# Histórico de mudanças

## Em desenvolvimento — revisão pré-instalação

- Instalador valida o pedido completo antes de copiar, aceita `-WhatIf`,
  verifica a cópia, preserva backup e tenta restaurar após falha de ativação.
- Proteção contra junctions no destino e substituição do próprio instalador.
- `.gitignore`, manifesto, testes e arquivos de integridade acompanham a skill.
- Capturas protegem metadados anteriores e validam o PNG recebido.
- XML temporário único e limpeza com diagnóstico sem ocultar a falha original.
- Comparações preservam saídas existentes e imagens de entrada, contam corretamente
  áreas ignoradas sobrepostas e recusam ignorar a imagem inteira.
- Maestro usa a pasta atual ou `--workdir`, com timeout positivo.
- Launchers Windows são resolvidos pelo PATH e recusam metacaracteres batch.
- Testes de regressão e integração PowerShell em projetos descartáveis.

Esta revisão ainda não é uma release publicada nem prova de funcionamento em Android.

## 1.0.0 — Pacote inicial

- Skill, referências de plataformas, CLI local, exemplos Maestro e instalador.
- Publicação inicial com manual ilustrado em português.

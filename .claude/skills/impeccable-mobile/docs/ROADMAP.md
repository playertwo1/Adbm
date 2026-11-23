# Roadmap orientado por resultados

## V1.0 — Entregue neste pacote

- [x] Skill principal com catálogo de 24 comandos delegados + 6 ações mobile.
- [x] Adaptadores de orientação: Compose, Flutter, React Native, Wear OS.
- [x] CLI local: doctor, devices, capture, inspect, compare, test.
- [x] Maestro flows seguros e parametrizados.
- [x] Instalador PowerShell, testes unitários e QA report.
- [ ] Validação em app Android real (depende do PC e do app do usuário).

## Revisão pré-instalação

- [x] Instalação com cópia verificada, backup, restauração e `-WhatIf`.
- [x] Proteção contra junctions e sobrescrita do próprio kit.
- [x] Preservação de PNG/JSON/XML e resultados de comparação.
- [x] Contagem de regiões ignoradas sem duplicidade; rejeição de máscara total.
- [x] Diretório Maestro explícito e launchers Windows resolvidos pelo PATH.
- [x] Testes do instalador em projetos temporários, PowerShell 7 e Windows PowerShell 5.1.
- [x] Documentação alinhada aos parâmetros reais e estado da validação.
- [ ] Smoke test em emulador com app de dados fictícios.
- [ ] Reconhecimento da skill no agente escolhido.
- [ ] Publicar uma release versionada após a validação combinada.

## V1.1 — Após smoke test em aplicativo real

- [ ] Seletores Maestro sob medida para Orbit ou app de teste.
- [ ] Testes dark mode, escala fonte 1.3x, teclado, estado vazio.
- [ ] Checklist verificável de regressões por tela e hash de artefatos.
- [ ] Confirmar diretórios reconhecidos por cada agente, inclusive Antigravity.
- [ ] CI Windows/Linux com versões suportadas de Python e PowerShell.
- [ ] Seleção de dispositivo Maestro e encerramento de processos filhos após timeout.

## V1.2 — Opcional, não bloquear V1

- [ ] Mobile MCP para agentes que precisem tocar e inspecionar UI por semântica.
- [ ] Screenshot testing em Compose/Flutter quando fizer sentido.
- [ ] Profundidade Wear OS em emuladores validados.
- [ ] Variantes visuais de `generate` sem alegar HMR nativo.

## Limites assumidos

- Python não avalia estética; IA faz análise depois de screenshots.
- Falta integração automática IDE / emulador se o host não fornecer ferramentas.
- Os comandos de design originais só funcionam com Impeccable instalado.
- A compatibilidade de Maestro com Wear OS varia com o dispositivo.

# Revisão técnica antes da instalação

Data: 2026-10-25. Escopo: scripts, instalador, testes e coerência documental.
Os resultados abaixo descrevem a revisão pré-instalação. Publicação e instalação nos
agentes são checkpoints posteriores; os testes aqui não comprovam execução no Android.

## Problemas corrigidos

| Prioridade | Problema original | Correção |
|---|---|---|
| P1 | `-Force` apagava a instalação antes de copiar; falha perdia alterações | Preparar e verificar a cópia antes da troca, preservar backup e restaurar após falha de ativação |
| P1 | Pedido com provedor inválido podia deixar instalação parcial antes da validação | Validar o pedido e os arquivos obrigatórios antes de qualquer escrita |
| P1 | Junctions podiam redirecionar a instalação e o instalador podia substituir sua própria origem | Validar limites e links do caminho e recusar origem dentro do destino |
| P1 | Captura podia sobrescrever JSON/XML existentes mesmo protegendo o PNG | Proteger o conjunto de evidências antes de capturar |
| P1 | Comparador podia sobrescrever arquivos anteriores e até a própria entrada | Exigir destino novo ou substituição explícita, bloquear colisões inclusive por hard link |
| P1 | Launcher batch detectado no PATH podia falhar sem extensão ou interpretar metacaracteres | Resolver o caminho completo e rejeitar sintaxe de shell para `.bat`/`.cmd` |
| P2 | Cabeçalho PNG era aceito mesmo com imagem truncada | Verificar a estrutura do PNG antes de salvar |
| P2 | Arquivo XML fixo no dispositivo e limpeza fora do tratamento da falha de dump | Nome único, tentativa de limpeza em `finally` e aviso sem esconder o erro original |
| P2 | Área ignorada sobreposta e máscara total tornavam métricas ambíguas | Contar a união das regiões, informar área comparada e recusar máscara total |
| P2 | Maestro inferia pasta de execução pelo local do YAML | Usar pasta atual ou `--workdir`; validar timeout positivo |
| P2 | Skill instalada perdia ignore, manifesto e recursos de verificação | Copiar o pacote explicitamente e orientar ignore da raiz do aplicativo |
| P3 | Guias prometiam XML implícito e descreviam regras antigas | Alinhar README, skill, referências e workflows ao comportamento real |

## Evidências e alcance

- Suíte com 29 testes, incluindo testes de integração do instalador em pastas descartáveis.
- Instalador exercitado com PowerShell 7 e Windows PowerShell 5.1 no Windows.
- Os quatro destinos de provedores são verificados no filesystem; isso não prova descoberta dentro dos agentes.
- Cobertura de atualização com backup, restauração após falha simulada de ativação,
  `-WhatIf`, origem incompleta, provedor inválido e junction para fora do projeto.
- Testes de PNG e diff usam imagens sintéticas. ADB e Maestro são simulados nos testes de comandos.
- Teste de launcher `.cmd` executa um script descartável real com caminho contendo espaços.

## Limites que continuam abertos

1. **Android real: NOT_RUN.** Nenhuma captura de aparelho ou execução de jornada foi realizada.
2. **Descoberta pelos agentes: NOT_RUN.** Nenhuma skill foi instalada em um projeto real nesta revisão.
3. **Wear OS: NOT_RUN.** As referências são orientação, não evidência de execução.
4. **Ambiente do terminal:** Python/Pillow e Maestro foram encontrados; ADB, Java e scrcpy não estavam no PATH deste processo. Isso não prova ausência de instalação em outros diretórios.
5. **Timeout:** o wrapper define limite para o processo chamado, mas ainda não tem validação de encerramento de toda a árvore de processos Java/Maestro.
6. **Batch Windows:** argumentos/caminhos com metacaracteres são recusados deliberadamente; usar seletores simples ou launcher nativo.
7. **Multi-provedor:** cada destino é atualizado separadamente. Uma falha não reverte destinos já concluídos.
8. **Backups:** ficam em `.impeccable-mobile/install-backups/`, fora da descoberta de skills. A limpeza é manual e deve preservar alterações pessoais.
9. **Concorrência:** as verificações evitam colisões existentes; não há lock entre duas execuções simultâneas para o mesmo destino. Evite atualizar/capturar no mesmo destino em paralelo.

## Próximo checkpoint

Preparar o PATH apenas para a sessão de teste, escolher um emulador com dados fictícios,
validar captura PNG/XML e uma jornada Maestro. Depois instalar no agente escolhido e
confirmar a descoberta da skill. Registrar screenshots e resultados em `templates/QA-REPORT.md`.

Critério para instalação cotidiana: testes locais aprovados, smoke test Android aprovado
e reconhecimento da skill confirmado. Não confundir a publicação inicial no GitHub com essas validações.

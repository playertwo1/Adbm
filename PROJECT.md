# PROJECT — CoreFlow

Contrato de visão. Atualize quando o projeto nasce e quando a visão muda; o resto (marcos, estado) fica em `ROADMAP.md` e `STATE.md`. Resumo do `README.md`, `AGENTS.md`, `PRIVACY.md` e `ROADMAP.md`.

## Problema
Treinos de core, respiração, assoalho pélvico e atenção plena exigem tempo, repetições e pausas precisos; fazer de cabeça ou com cronômetro genérico atrapalha a execução e o acompanhamento da progressão.

## Para quem
Uso pessoal no Android (Galaxy S25 Ultra), com Galaxy Watch (Wear OS) como complemento tátil.

## MVP — até três fluxos que entregam valor
1. Executar um programa guiado de 8 semanas (Bracing, Stomach Vacuum, Kegel, Mindfulness/MBCT) com timer, narração e vibração.
2. Acompanhar a sessão ativa sobre outros apps pelo Modo Treino Flutuante (overlay nativo) e pelas vibrações espelhadas no relógio.
3. Registrar progresso e histórico localmente e consultar a evolução.

## Fora do MVP (escrito para não voltar escondido)
- Login obrigatório, telemetria externa ou sincronização em nuvem (`PRIVACY.md`).
- Carregar conteúdo remoto na WebView, permissões web, conteúdo misto ou navegação externa.
- Trocar a arquitetura Android/WebView + Wear OS ou os IDs de programa (`'1'` Bracing, `'2'` Kegel, `'3'` Vacuum).

## Restrições
- Plataforma/ambiente: Android (minSdk 24, target/compile 36), WebView local (`index.html` idêntico a `app/src/main/assets/index.html`), Kotlin nativo para timer/overlay/áudio, módulo `wear/` (API 30+). JDK 17, Gradle 9.3.1, Node 18+ para os diagnósticos.
- Dados sensíveis e privacidade: dados e histórico só no dispositivo; chaves de assinatura fora do repositório (`SIGNING.md`).
- Custos, licenças, integrações obrigatórias: releases só com as quatro variáveis de assinatura release; nunca assinatura debug. Todos os direitos reservados.

## Como saberemos que funcionou
`bash scripts/check.sh` passa (diagnósticos Node, paridade HTML, testes Android e builds debug) e o fluxo é homologado em aparelho físico (S25 Ultra e Galaxy Watch), com aprovação visual das pranchas.

## Autoridade de produto
Rafael. Mudança de protocolo de treino, armazenamento ou IDs exige decisão dele registrada com evidência.

## Alternativas consideradas
a definir (não registrado nos documentos do repositório).

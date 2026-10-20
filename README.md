# CoreFlow

Aplicativo Android de práticas guiadas para fortalecimento do core, estabilização espinhal, postura, respiração, assoalho pélvico e atenção plena. A interface principal é executada em uma WebView local integrada aos recursos nativos do Android e com suporte complementar a relógios inteligentes Wear OS (Galaxy Watch).

---

## Recursos Principais

- **Modo Treino Flutuante (Overlay Nativo):** Acompanhe e controle sua sessão ativa sobre qualquer outro aplicativo Android com janela flutuante Material 3 AMOLED (estados Mini, Compacto e Expandido, arrasto e recolhimento automático).
- **Programa de Bracing e Automação Postural (8 Semanas):** Progressão funcional do core baseada no método McGill, executável sentado em banco ou em pé.
- **Programa de Stomach Vacuum (8 Semanas):** Treino guiado de sucção abdominal com fases clínicas de preparação, inspiração, expiração, apneia/retenção, retorno controlado e recuperação.
- **Programa de Kegel e Assoalho Pélvico (8 Semanas):** Foco em resistência, agilidade reflexa e suporte pélvico com agenda diária calibrada.
- **Programa de Mindfulness / MBCT (8 Semanas):** Oito meditações guiadas em áudio nativo com reprodução contínua em segundo plano e tela bloqueada.
- **Pausa de Resposta e Micro-Pausas Ativas:** Sessões rápidas para descompressão e alívio postural no trabalho (Alongamentos, Respiração e Pausa de Resposta), 100% integradas ao Modo Treino Flutuante nativo.
- **Sincronização com Galaxy Watch (Wear OS):** Vibrações táteis espelhadas no relógio em tempo real via Bluetooth.
- **Privacidade e Operação 100% Offline:** Sem login obrigatório, sem telemetria externa; dados e histórico salvos localmente no dispositivo.

---

## Versão Atual

- **Versão base local:** `1.1.46` (`versionCode 46`)
- **Release:** `1.1.45` — Bracing com pausas entre repetições reduzidas para 5 segundos na primeira semana.
- **Validação desta versão:** regressões e build técnico passaram. Aprovação visual das pranchas e validação em celular e Galaxy Watch físicos continuam pendentes; consulte o [registro de execução](docs/roadmap/execucao.md).
- **Downloads:** O APK assinado para celular e relógio está disponível na aba de [Releases](https://github.com/playertwo1/Adbm/releases).
- **Histórico de Mudanças:** Consulte o [CHANGELOG.md](CHANGELOG.md) para detalhes de todas as versões.

---

## O que mudou na 1.1.45

- Na semana 1, cada pausa entre repetições do Bracing foi reduzida de 15 para 5 segundos. A preparação inicial e as semanas seguintes mantêm seus tempos.

## Mudanças da 1.1.44

- Bracing disponível duas vezes por dia nos sete dias da semana, conforme a configuração solicitada.
- Ajuste manual de semana (1–8), dia (1–7) e sessões de hoje (0–2) restaurado. A posição escolhida permanece ao fechar e reabrir o app.
- Cada repetição continua com seu contador de exercício e descanso, sem agregar a série inteira em um único timer.
- O dia avança após as duas sessões. A revisão técnica exige o volume das duas sessões completas e preserva o limite diário ao avançar de semana.
- Pausar e retomar a mesma sessão não duplica o progresso. Mudar de semana manualmente preserva o histórico; falha ao salvar o ajuste mantém a posição e a continuação anteriores.
- IDs, dados anteriores e integração Android/Wear preservados. Homologação física e aprovação das novas pranchas seguem pendentes.

## Requisitos de Desenvolvimento

- **Android Studio** com JDK 17 integrado (JBR).
- **Android SDK:** Compile SDK 36, Target SDK 36, Min SDK 24 (Android 7.0+).
- **Gradle:** 9.3.1.
- **Wear OS:** Android 11+ (API 30+) para o módulo complementar `wear/` (Galaxy Watch4 ou mais recente).
- **Node.js:** v18+ para execução das suítes de diagnóstico e testes de regressão.

---

## Compilação e Validação

Antes de validar ou compilar, configure `JAVA_HOME` para o JDK do Android Studio e `ANDROID_HOME` para o Android SDK:

```bash
# Executa regressões Node, confirmação de integridade HTML e compilação debug
bash scripts/check.sh
```

### Compilar APK de Desenvolvimento (Debug):
```powershell
.\gradlew.bat :app:assembleDebug :wear:assembleDebug
```

### Compilar APK de Produção (Release Assinado):
Configure as credenciais de assinatura persistente e execute:

```powershell
$env:KEYSTORE_PATH = "caminho/para/coreflow-upload.jks"
$env:KEYSTORE_PASSWORD = "sua_senha_keystore"
$env:KEY_ALIAS = "seu_alias"
$env:KEY_PASSWORD = "sua_senha_chave"
$env:BUILD_VERSION_CODE = "46"
$env:BUILD_VERSION_NAME = "1.1.46"

.\gradlew.bat :app:assembleRelease :wear:assembleRelease
```

Os pacotes gerados ficam localizados em:
- Celular: `app/build/outputs/apk/release/app-release.apk`
- Relógio: `wear/build/outputs/apk/release/wear-release.apk`

---

## Arquitetura do Projeto

- `index.html`: Interface web principal e lógica de estado (fonte de verdade).
- `app/src/main/assets/index.html`: Cópia idêntica byte a byte embarcada no build Android.
- `app/src/main/java/com/example/WorkoutOverlayController.kt`: Controlador da janela flutuante nativa (`SYSTEM_ALERT_WINDOW`).
- `app/src/main/java/com/example/WorkoutForegroundService.kt`: Motor de sessão e timer nativo (fonte única da verdade).
- `app/src/main/java/com/example/MindfulnessAudioService.kt`: Serviço de reprodução de áudio em primeiro plano com `MediaSession`.
- `app/src/main/java/com/example/WearHapticsRelay.kt`: Comunicação Bluetooth e retransmissão de vibrações para o Wear OS.
- `wear/`: Módulo independente do aplicativo para Wear OS (Galaxy Watch).
- `ROADMAP.md`: Planejamento ativo e backlog de desenvolvimento do projeto.
- `docs/arquivados/roadmap-etapas-concluidas.md`: Histórico e critérios de aceite das etapas concluídas.

---

## Licença e Privacidade

- Consulte [PRIVACY.md](PRIVACY.md) para a política de retenção local de dados.
- Consulte [SIGNING.md](SIGNING.md) para diretrizes de assinatura criptográfica contínua.
- Todos os direitos reservados.

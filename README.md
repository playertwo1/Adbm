# CoreFlow

Aplicativo Android de práticas guiadas para fortalecimento do core, postura, respiração, assoalho pélvico e atenção plena. A interface principal é executada em uma WebView local e integrada aos recursos nativos do Android.

## Recursos

- Programa de bracing e automação postural em 6 semanas.
- Programa de Kegel e assoalho pélvico em 8 semanas.
- Programa progressivo de stomach vacuum em 8 semanas.
- Programa de mindfulness/MBCT em 8 semanas com oito meditações em áudio.
- Player de mindfulness com play/pausa, avanço e retrocesso de 15 segundos e seleção de faixas.
- Reprodução durante o bloqueio da tela com serviço Android em primeiro plano.
- Lembretes, acompanhamento diário, metas semanais, streak e histórico local.
- Exercícios respiratórios, pausas ativas, hápticos e relatório de desempenho.
- Vibração sincronizada dos exercícios em Galaxy Watch com Wear OS.

## Versão atual

`1.1.36` (`versionCode 36`) — adiciona a Pausa de Resposta de 3 Minutos, com três etapas visuais, modo silencioso, retomada segura, escolha do próximo passo e histórico local opcional.

O APK assinado está disponível na página de [Releases](https://github.com/playertwo1/Adbm/releases).

## Requisitos

- Android Studio com JDK integrado.
- Android SDK 36.
- Gradle 9.3.1.
- Android 7.0/API 24 ou superior.
- Para vibração no relógio: Galaxy Watch4 ou mais recente com Wear OS e o APK `CoreFlow-Watch` instalado.

## Compilação

Antes de validar ou compilar, configure `JAVA_HOME` para o JDK do Android Studio e `ANDROID_HOME` para o Android SDK. O check reproduzível do projeto é:

```bash
bash scripts/check.sh
```

Ele executa os diagnósticos Node, confirma a equivalência entre os dois HTMLs e gera os APKs debug do celular e do relógio.

Para gerar apenas o APK de desenvolvimento:

```powershell
.\gradlew.bat :app:assembleDebug :wear:assembleDebug
```

Para gerar uma release assinada, configure `KEYSTORE_PATH`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`, `BUILD_VERSION_CODE` e `BUILD_VERSION_NAME`, e execute:

```powershell
.\gradlew.bat :app:assembleRelease :wear:assembleRelease
```

A release falha intencionalmente se qualquer credencial de assinatura persistente estiver ausente.

Os arquivos serão criados em `app/build/outputs/apk/release/app-release.apk` e `wear/build/outputs/apk/release/wear-release.apk`.

## Galaxy Watch

Instale o APK principal no celular e o APK `CoreFlow-Watch` no relógio. Ambos usam o mesmo identificador e certificado, como exigido pelo Wear OS. No CoreFlow, o botão com ícone de relógio ativa ou desativa o envio das vibrações. O relógio precisa estar pareado e conectado; a ausência dele não interrompe o exercício no celular.

## Estrutura principal

- `index.html`: interface e lógica do CoreFlow.
- `app/src/main/assets/index.html`: interface embarcada no APK.
- `app/src/main/assets/audio/mindfulness/`: oito faixas do programa de atenção plena.
- `app/src/main/java/com/example/`: integração WebView, hápticos, notificações e serviço de áudio.
- `wear/`: aplicativo complementar Wear OS que recebe e reproduz os padrões de vibração.
- `ROADMAP.md`: especificação do programa de Mindfulness.

## Assinatura e segurança

Arquivos `.env`, keystores e senhas não devem ser enviados ao repositório. Consulte `SIGNING.md` para configurar uma chave persistente. Para atualizar uma instalação existente, todas as versões precisam ser assinadas com o mesmo certificado.

Os dados de progresso usam armazenamento local e podem participar do backup automático do Android; consulte [PRIVACY.md](PRIVACY.md) para o escopo, a retenção e o controle do usuário.

## Licença

Este repositório não declara uma licença de código aberto. Todos os direitos permanecem com o proprietário do projeto.

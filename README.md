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

## Versão atual

`1.1.30` (`versionCode 30`) — adiciona o programa completo de Mindfulness em 8 Semanas, player dedicado e reprodução em segundo plano.

O APK assinado está disponível na página de [Releases](https://github.com/playertwo1/Adbm/releases).

## Requisitos

- Android Studio com JDK integrado.
- Android SDK 36.
- Gradle 9.3.1.
- Android 7.0/API 24 ou superior.

## Compilação

Para gerar um APK de desenvolvimento:

```powershell
.\gradlew.bat assembleDebug
```

Para gerar uma release assinada, configure as variáveis `KEYSTORE_PATH`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`, `BUILD_VERSION_CODE` e `BUILD_VERSION_NAME`, e execute:

```powershell
.\gradlew.bat testDebugUnitTest assembleRelease
```

O arquivo será criado em `app/build/outputs/apk/release/app-release.apk`.

## Estrutura principal

- `index.html`: interface e lógica do CoreFlow.
- `app/src/main/assets/index.html`: interface embarcada no APK.
- `app/src/main/assets/audio/mindfulness/`: oito faixas do programa de atenção plena.
- `app/src/main/java/com/example/`: integração WebView, hápticos, notificações e serviço de áudio.
- `ROADMAP.md`: especificação do programa de Mindfulness.

## Assinatura e segurança

Arquivos `.env`, keystores e senhas não devem ser enviados ao repositório. Consulte `SIGNING.md` para configurar uma chave persistente. Para atualizar uma instalação existente, todas as versões precisam ser assinadas com o mesmo certificado.

## Licença

Este repositório não declara uma licença de código aberto. Todos os direitos permanecem com o proprietário do projeto.

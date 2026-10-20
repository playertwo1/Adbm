# Instalar o CoreFlow no Samsung Galaxy Watch

Manual para Windows/PowerShell. Atualizado em 20/10/2026.

Modelo de referência: **Galaxy Watch6 SM-R945F** (44 mm LTE), compatível com o módulo Wear OS. A conexão LTE não substitui o Wi-Fi necessário para este procedimento ADB. Identificação: [Samsung — Watch6 44 mm LTE SM-R945F](https://www.samsung.com/in/watches/galaxy-watch/galaxy-watch6-44mm-silver-lte-sm-r945fzsains/buy).

## O que será instalado

São dois APKs: `app-release.apk` no celular e **`wear-release.apk` no relógio**. Instalar o primeiro não instala automaticamente o segundo. Este projeto tem módulo Wear OS (Android API 30+), indicado para Galaxy Watch4 e posteriores com Wear OS; Galaxy Watch antigos com Tizen, como Watch3 e Active2, não executam este APK.

O aplicativo aparece no relógio como **CoreFlow Watch**. Atualmente ele recebe os sinais de vibração enviados pelo celular. Sua tela mostra “Vibração do relógio pronta. Inicie um exercício no celular.” Essa frase é fixa: não confirma conexão nem entrega de mensagens. O módulo não contém o player completo, imagens ou cronômetro do celular.

## 1. Preparar os arquivos e a rede

1. No PC, abra as [Releases do Adbm](https://github.com/playertwo1/Adbm/releases/latest), expanda **Assets** e baixe `wear-release.apk`. Em 20/10/2026, a página latest aponta para [v1.1.47](https://github.com/playertwo1/Adbm/releases/tag/v1.1.47).
2. Salve o arquivo na pasta **Downloads** com esse nome. Não use `app-release.apk` no relógio.
3. No celular, use o `app-release.apk` da mesma release para evitar misturar compilações. Não misture APK debug com release: a comunicação Wear exige mesmo identificador de pacote e mesma assinatura nos dois dispositivos. Neste projeto, ambos usam `com.aistudio.coreflow.vdfpkw`.
4. Deixe o relógio pareado ao celular pelo **Galaxy Wearable**, com Bluetooth conectado. Esse é o pareamento para uso do app; o pareamento ADB abaixo serve para instalação pelo computador.
5. Conecte PC e relógio à mesma rede Wi-Fi doméstica. Evite rede de convidados que isola dispositivos. Deixe o relógio carregado, perto do roteador e com a tela acordada durante a configuração.

## 2. Preparar o ADB no Windows

ADB é a ferramenta oficial do Android para enviar o APK ao relógio. Não precisa compilar o projeto nem instalar Android Studio se usar apenas as [SDK Platform-Tools para Windows](https://developer.android.com/tools/releases/platform-tools).

**Neste computador**, foi encontrada a instalação do Android SDK no local padrão. Abra PowerShell e execute:

```powershell
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
Test-Path $adb
& $adb version
```

`Test-Path` deve mostrar `True`, seguido da versão do ADB. Se mostrar `False`, baixe e extraia as Platform-Tools pelo link acima e ajuste a variável para o caminho real, por exemplo:

```powershell
$adb = "$env:USERPROFILE\Downloads\platform-tools\adb.exe"
& $adb version
```

Mantenha o mesmo PowerShell aberto: os próximos comandos usam `$adb`.

## 3. Liberar instalação no relógio

No próprio relógio:

1. Abra **Configurações → Sobre o relógio → Informações do software** (ou **Software**).
2. Toque **cinco vezes em Versão do software**, até aparecer a confirmação de modo de desenvolvedor.
3. Volte às Configurações e abra **Opções do desenvolvedor**.
4. Ative **Depuração ADB** e **Depuração sem fio**; permita a rede Wi-Fi quando solicitado.

Os nomes variam conforme a versão da One UI Watch. Em sistemas antigos sem “Parear novo dispositivo”, consulte a seção de versões antigas abaixo; não invente uma porta de pareamento.

## 4. Parear o PC — primeira porta

Dentro de **Depuração sem fio**, toque **Parear novo dispositivo**. Deixe essa tela aberta. Ela mostra um código temporário e um endereço com porta.

Exemplo fictício: endereço `192.168.1.50:37123`, código de seis dígitos. Use os valores do seu relógio:

```powershell
& $adb pair 192.168.1.50:37123
```

Quando pedir `Enter pairing code`, digite o código exibido no relógio. A resposta esperada contém **Successfully paired**. O código expira; se falhar, abra novamente “Parear novo dispositivo” e use os novos valores. Não publique o código.

## 5. Conectar — segunda porta

Volte uma tela, para a página principal de **Depuração sem fio**. Veja **Endereço IP e porta** dessa página. A porta normalmente é diferente da anterior.

Exemplo fictício: `192.168.1.50:39567`:

```powershell
$watch = "192.168.1.50:39567"
& $adb connect $watch
& $adb devices -l
```

Troque o exemplo pelo endereço real. A resposta esperada contém `connected to` ou `already connected to`; na lista, o endereço do relógio precisa aparecer com estado **device**. Só “Successfully paired” não basta para prosseguir. Se houver solicitação no relógio, autorize este computador.

**Resumo:** `adb pair` usa a porta da tela com código; `adb connect` usa a porta da página principal. Elas podem mudar ao reativar a depuração ou trocar de rede. O [procedimento oficial do Android](https://developer.android.com/training/wearables/get-started/debug-wifi) distingue essas duas portas.

## 6. Instalar o APK no relógio

Ainda no mesmo PowerShell:

```powershell
$apk = "$env:USERPROFILE\Downloads\wear-release.apk"
Test-Path $apk
& $adb -s $watch install -r $apk
```

`Test-Path` deve mostrar `True`. Espere **Success** no final da instalação. Se o navegador salvou com outro nome, ajuste `$apk`. O parâmetro `-s $watch` direciona a instalação ao relógio, mesmo com celular/emulador conectado; `-r` solicita atualização preservando os dados do app, desde que a versão e a assinatura permitam.

Para conferir se o pacote foi instalado no relógio:

```powershell
& $adb -s $watch shell pm path com.aistudio.coreflow.vdfpkw
```

Deve retornar um caminho iniciado por `package:`. Depois abra **CoreFlow Watch** na lista de aplicativos do relógio. Se precisar abrir pelo PC, este é o componente conferido no projeto:

```powershell
& $adb -s $watch shell am start -n com.aistudio.coreflow.vdfpkw/com.example.wear.MainActivity
```

## 7. Testar a comunicação com o celular

1. Confirme que o Galaxy Wearable mostra o relógio conectado ao celular por Bluetooth.
2. Abra **CoreFlow Watch** uma vez e volte ao CoreFlow instalado no celular.
3. No perfil/configurações do CoreFlow, ative **Galaxy Watch**. Há também um botão de relógio no cabeçalho. O estado ligado significa que o envio está habilitado; não comprova conexão.
4. Com nenhuma sessão em andamento, desligue e ligue essa opção: o código atual solicita um pulso curto ao ativá-la. Se não sentir, teste uma sessão habitual com sinais hápticos habilitados e observe uma troca de fase.
5. Confirme a vibração **no relógio**, não apenas no celular. A tela fixa “pronta” não vale como teste de entrega.

Para esse teste, mantenha data/hora automáticas nos dois aparelhos: o receptor descarta mensagens antigas ou com horário futuro. Não é necessário manter ADB conectado para o uso diário.

## Se algo der errado

| Sintoma | O que conferir |
|---|---|
| `adb` não reconhecido | Use `$adb` com caminho completo e `& $adb`, como acima. |
| `pair` não existe | Atualize as Platform-Tools oficiais. |
| Falha no código de pareamento | Deixe a tela com código aberta; gere outro código e confira a porta dessa tela. |
| Pareou, mas não conecta | Use a porta da página principal de Depuração sem fio, não a porta do código. |
| `Connection refused` ou timeout | Confira IP/porta atuais, tela acordada, Wi-Fi do relógio e mesma rede sem isolamento. Desative temporariamente VPN se ela impedir acesso à rede local; não desligue todo o firewall. |
| `unauthorized` | Aceite a autorização no relógio; se necessário, esqueça este PC na tela de depuração e refaça o pareamento. |
| `offline` | Desconecte o alvo (`& $adb disconnect $watch`), confira a porta atual e conecte novamente. |
| `more than one device/emulator` | Use `-s $watch` nos comandos de instalação e shell. |
| `INSTALL_FAILED_UPDATE_INCOMPATIBLE` | O app instalado tem outra assinatura. Obtenha APK compatível com a instalação existente; não desinstale nem limpe dados automaticamente. |
| `INSTALL_FAILED_VERSION_DOWNGRADE` | O relógio já tem versão mais nova. Use a versão correta ou superior; não force downgrade. |
| `INSTALL_FAILED_OLDER_SDK` | Confira sistema/API do relógio e se baixou o APK correto. O módulo exige API 30+. |
| `INSTALL_FAILED_MISSING_SHARED_LIBRARY` | Confira se o alvo é mesmo Wear OS e se usou `wear-release.apk`. |
| Instalou, mas não vibra | Confira Galaxy Wearable/Bluetooth, opção Galaxy Watch no app, sinais hápticos da sessão, ajustes de vibração do relógio, hora automática e APKs assinados de forma compatível. |
| Mensagem “Disponível” no celular, mas nada chega | A indicação atual não é confirmação de entrega. Faça o teste físico acima; se falhar, registrar como falha de comunicação. |

Se persistir timeout, tente outra rede doméstica/hotspot que permita comunicação entre os dispositivos. Em alguns modelos há a opção de desenvolvedor **Desativar Wi-Fi automático**, que evita o Wi-Fi adormecer durante a instalação; anote o estado anterior para restaurá-lo depois. Consulte o [guia da Samsung](https://developer.samsung.com/health/sensor/guide/connect-watch.html).

### Wear OS antigo, sem código de pareamento

Se as opções mostram somente **Depurar por Wi-Fi** e endereço com porta, use o endpoint exibido com `adb connect` e aceite a autorização no relógio. Não execute `adb pair` sem a tela de código. Atualize o sistema quando houver atualização compatível; se não existir endpoint, confirme o modelo e a versão antes de tentar outro método. Tizen não instala APK Android.

## Depois de funcionar

Desconecte apenas o relógio do ADB:

```powershell
& $adb disconnect $watch
```

No relógio, desative **Depuração sem fio** e **Depuração ADB**; restaure eventual ajuste temporário de Wi-Fi. Mantenha Bluetooth e o pareamento normal no Galaxy Wearable. Para atualizar futuramente, reative depuração, confira IP/porta, reconecte e repita `install -r` com o novo APK compatível.

## Critério de conclusão e fontes

- [ ] A instalação retornou Success.
- [ ] CoreFlow Watch aparece e abre no relógio.
- [ ] O relógio vibra após um sinal enviado pelo celular.
- [ ] Depuração foi desligada ao terminar.

Este manual foi conferido contra o código do projeto e as fontes oficiais; instalação e comunicação no Galaxy Watch físico ainda **NOT_RUN / PENDING_HUMAN** nesta entrega. Se falhar, informe modelo, versão do sistema, etapa e mensagem exata; não envie código de pareamento nem logs com dados pessoais.

Fontes: [depuração Wi-Fi Wear OS](https://developer.android.com/training/wearables/get-started/debug-wifi), [configuração Galaxy Watch](https://developer.samsung.com/health/sensor/guide/connect-watch.html), [ADB](https://developer.android.com/tools/adb), [Platform-Tools](https://developer.android.com/tools/releases/platform-tools), [requisitos de pacote e assinatura da Data Layer](https://developer.android.com/training/wearables/data/overview).

Código conferido: `wear/build.gradle.kts`, `wear/src/main/AndroidManifest.xml`, `wear/src/main/java/com/example/wear/MainActivity.kt`, `wear/src/main/java/com/example/wear/HapticListenerService.kt`, `app/src/main/java/com/example/WearHapticsRelay.kt` e `index.html`.

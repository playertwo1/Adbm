# Instalação Windows — Codex, Claude e Antigravity

## 1. Pré-requisitos

PowerShell, Python 3.10+, pip, Node para o instalador Impeccable,
Android SDK Platform Tools (`adb`). Para Maestro: Java compatível com a versão instalada e Maestro CLI.

```powershell
py --version
node --version
adb version
java -version
maestro --help
scrcpy --version  # opcional para acompanhar o dispositivo ao vivo
```

Se faltar `adb`, instale as Platform Tools oficiais e adicione ao PATH.
Se faltar Maestro, use o pacote Windows em
https://docs.maestro.dev/maestro-cli/how-to-install-maestro-cli
(não precisa comprar Maestro Studio nem Cloud).

## 2. Instale Impeccable oficial separadamente

Dentro da pasta do seu aplicativo:

```powershell
npx impeccable install
```

Confirme no agente que `$impeccable` ou `/impeccable` está disponível.
Consulte opções da versão do CLI, não instale cópias duplicadas.

## 3. Instale a extensão

```powershell
& "C:\CAMINHO\Impeccable-Mobile-Studio\scripts\install.ps1" -ProjectPath "C:\CAMINHO\MeuApp" -Providers codex,claude,antigravity
```

Use `-WhatIf` para conferir destinos sem criar arquivos. A instalação existente
é ignorada sem `-Force`. Com `-Force`, a nova cópia é verificada antes da troca,
e a anterior é preservada em `.impeccable-mobile/install-backups/` no projeto.
Reinicie/recarregue o agente depois. Backups não são mesclados automaticamente.
Instalação da extensão não instala Java, Android Studio, Maestro nem Impeccable.

## 4. Usando a extensão

No prompt do seu agente:

`Use impeccable-mobile: mobile critique na tela inicial e capture screenshot real`

No terminal da pasta instalada da skill:

```powershell
py -m pip install -r requirements.txt
py scripts/mobile.py doctor
py scripts/mobile.py capture --name tela-inicial
py scripts/mobile.py inspect --name tela-inicial --include-xml
py scripts/mobile.py test --flow maestro/capture-home.yaml --app-id com.exemplo.meuapp
```

## 5. Limites reais

- O app precisa estar instalado/aberto no emulador ou aparelho autorizado.
- O nome `mobile critique` é linguagem de roteamento da skill, não shell command.
- Antigravity usa `.agent/skills` em configurações comuns; confirme o caminho
  no agente instalado se sua versão divergir.
- O wrapper Maestro usa a pasta atual; `--workdir` permite escolher outra.
- Launchers batch no Windows recusam argumentos/caminhos com metacaracteres de shell.
- O `.gitignore` copiado fica na skill. Para evidências e backups na raiz do app,
  adicione `.impeccable-mobile/` ao `.gitignore` dessa raiz.
- Nunca rode Maestro Cloud ou envie capturas reais de clientes.

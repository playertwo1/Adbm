# Ambiente de execução e validação

- Codex Desktop no Windows, executando localmente (PowerShell).
- Emulador Android (AVD) no mesmo PC + ADB + Maestro.
- Sem dispositivo físico nesta etapa. Dispositivo de referência final: Galaxy S25 Ultra.

## Verificação inicial (M1)
Execute e registre o resultado:
```powershell
adb devices
maestro --version
.\gradlew.bat assembleDebug
```
Se algo faltar, reporte e não simule a etapa dependente.
Se nenhum emulador estiver ativo: `emulator -list-avds` e `emulator -avd <nome>`.

## Configuração do emulador
- Perfil próximo ao S25 Ultra: ~1440x3120, ~500 dpi, API 34/35.
- **Ativar navegação por gestos** (obrigatório para reproduzir o bug do menu):
  ```powershell
  adb shell cmd overlay enable com.android.internal.systemui.navbar.gestural
  ```
- Permissão de overlay:
  ```powershell
  adb shell appops set <package> SYSTEM_ALERT_WINDOW allow
  ```
- Descubra o `<package>` no `build.gradle(.kts)` (applicationId).

## Evidências
- Screenshots: `takeScreenshot` no Maestro ou
  `adb exec-out screencap -p > arquivo.png`
- Gravações: `adb shell screenrecord /sdcard/x.mp4` + `adb pull`
- Salvar em `docs/redesign/screenshots/before/` e `/after/`.
- Flows Maestro em `.maestro/` para reuso entre missões.

## Limitações conhecidas
- O Maestro pode não enxergar janelas de overlay na hierarquia. Se o elemento não
  for encontrado, use `tapOn: point` por coordenadas e valide por screenshot/gravação.
- Emulador **não** valida: consumo de bateria, desempenho real da One UI,
  conforto em uso prolongado. Marcar como pendente no aparelho real.

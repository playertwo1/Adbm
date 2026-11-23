Continue o trabalho de UI do CoreFlow (C:\Users\notefael\projetos\Adbm) usando a skill android-premium-craft.

Regras do projeto: siga AGENTS.md (index.html e app/src/main/assets/index.html idênticos; arquivos HTML usam CRLF, não use `sed -i` neles, edite com Python em modo binário/newline=''; regressão antes de mudar comportamento; `bash scripts/check.sh` com JAVA_HOME=%LOCALAPPDATA%\Programs\jdk-17 e ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk; registrar cada tarefa em docs/roadmap/execucao.md). Não mexa em IDs, armazenamento ou protocolo de treino sem decisão registrada. NUNCA use `tailscale serve`/`reset` (pertence ao projeto Orbit). Não use GitHub Actions. Não faça push sem pedido.

Estado em 2026-10-29 (tudo commitado no main, sem push, árvore limpa nos arquivos do app):
- 494c14e e 4b03b6c: rodadas anteriores do critique.
- 51e6651: aviso de cancelamento do Bracing + selo de volume reduzido (e16).
- 4fcc8ca: overlay nativo (oculto com o app visível via WorkoutOverlayController.setAppForeground, Pausar verde, gaps 4dp, rótulos sem glifos, Abrir/Recolher centralizados).
- cf3774a: CTAs sem gradiente, ícones nas ações rápidas, textos (e17).
- 9752812 e a49a479: cards aninhados achatados em Pausas, Programas, Vácuo, Dashboard, Discreto (e18, e19). Detector Impeccable `nested-cards` 61 → 17. Comando: `~/.claude/skills/impeccable/scripts/bin/windows-x64/impeccable.exe detect index.html --json`.
- d5f2e07: layout com fonte do sistema a 200% (e20).
- Evidências e capturas em .craft/critique/ (não versionado). Craft Score ainda não recalculado desde 58C: `python ~/.claude/skills/android-premium-craft/scripts/critique_score.py <json> --save .craft/critique`.

Emulador: AVD `agente` (API 36), serial emulator-5580. Na última checagem ele estava offline ("device not found"); suba com `%LOCALAPPDATA%\Android\Sdk\emulator\emulator.exe -avd agente -port 5580 -no-window -no-audio -no-boot-anim -gpu swiftshader_indirect`. Maestro MCP perde o driver após `adb root`; use `adb shell input tap/swipe` e `adb exec-out screencap -p`. A WebView leva ~20s para montar após reinstalar; toque antes disso é ignorado. Coordenadas da barra inferior (1080x2400): Hoje 113, Programas 326, Pausas 541, Evolução 755, Perfil 970, y=2256. Fonte: `adb shell settings put system font_scale 2.0` (voltar a 1.0 ao terminar). Hoje o Bracing já tem 2/2 sessões no dia; para novas sessões avance a data (`adb root` + `date -s`) e restaure depois, ou use Vácuo/Kegel/Pausa.

Próximos passos, em ordem:
1. Aba Vácuo em execução e em retenção, a 100% e a 200%: botão Iniciar, "Encerrar retenção", Pular, Reset, Encerrar, círculo e passos. Corrigir o que quebrar, com regressão antes.
2. Programas, Vácuo e Discreto a 200% (só Hoje, Evolução, Perfil e Pausas foram vistos).
3. Cards aninhados restantes (17): Vácuo 5, Pausas 7, Dashboard 4, Discreto 1, na maioria selos de ícone e banners dentro de cartões. O modo arquivo do detector não dá linha; use a contagem por seção (remover a seção e recontar).
4. CTA âmbar→laranja do botão de sessão em Programas (`sessionBtnBg`) e gradiente roxo da "Pausa de Resposta" ainda existem; decidir com o usuário.
5. Não verificado: TalkBack real, Wear OS, overlay compacto no aparelho (alinhamento de Abrir/Recolher só testado por unidade), blocos do modal Bracing e erros inline do Dashboard na tela.

Mostre o resultado de cada passo antes de seguir para o próximo.

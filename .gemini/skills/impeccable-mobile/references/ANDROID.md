# Android / Jetpack Compose

- Inspecione tema Material 3 existente antes de propor outra linguagem visual.
- Use dp para layout, sp para texto e suporte fontScale/Display size.
- Use `WindowInsets` e layouts edge-to-edge; cuide do teclado/IME e system bars.
- `LazyColumn` e virtualização para listas; estados carregando, vazio, erro,
  offline, permissões negadas, keyboard focus.
- Evite fixar tamanho ao S25 Ultra: testar janela compacta e expandida.
- Targets tocáveis >=48dp quando tecnicamente aplicável; sem rótulos falsos.
- Verifique componentes Compose Preview Screenshot Testing se já configurados,
  mas não adicione dependência grande apenas para validar uma tela isolada.
- Para Wear OS carregue `WEAR-OS.md` em vez de tratar como telefone estreito.

# React Native / Expo

- Respeite navegação nativa, `SafeArea`, status/navigation bars e teclado.
- Reutilize tokens/fontes/temas; não adicionar bibliotecas UI só por estética.
- Use FlatList/SectionList para listas longas; verifique touch targets e labels.
- Trate dark mode existente e alterações de font scaling.
- Componentes e estilos devem corresponder à base atual sem refatoração ampla.
- Maestro funciona com app compilado instalado em emulador Android; toolchain
  Expo não substitui a necessidade de executar o app na tela real.

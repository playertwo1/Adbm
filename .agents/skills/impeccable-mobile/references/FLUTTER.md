# Flutter

- Reutilize `ThemeData`, `ColorScheme`, `TextTheme`, extensões de tema e tokens.
- Utilize `SafeArea`, `MediaQuery` e layout constraints; evite largura fixa global.
- Teste textScaleFactor/TextScaler e traduções mais longas.
- Priorize componentes e gestos nativos; estados async/error/empty e teclado.
- Evite reconstruções custosas e overdraw; use DevTools caso necessário.
- Maestro controla o APK instalado sem depender do framework; caso a árvore
  acessível seja insuficiente, use IDs de semântica e capturas, não coords rígidas.

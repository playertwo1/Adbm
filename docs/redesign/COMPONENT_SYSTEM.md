# Controles do CoreFlow

O sistema atual combina a paleta CoreFlow e a hierarquia funcional da Apple HIG, com gestos e alvos de toque Android.

| Papel | Aplicação |
|---|---|
| Primário | Fundo de ação em iniciar, retomar e salvar. Rótulos indicam o resultado da ação. |
| Secundário | Superfície neutra com contorno para ajustes ou ações próximas de uma principal. |
| Texto | Navegação e divulgação de detalhes em Hoje, Pausas, Programas e Perfil. |
| Seleção e toggle | Estado semântico existente em `aria-pressed`, `aria-expanded` ou `aria-checked`, com mudança perceptível de estilo. |
| Destrutivo | Cor de perigo e confirmação nos fluxos existentes de cancelamento, exclusão e limpeza. |
| Sessão | Player com controles de ação existentes e raio comum; overlay com Pausar/Continuar, e expansão explícita para os demais controles. |

A WebView compartilha `--cf-control-target` de 48 px, `--cf-control-radius` de 12 px e `--cf-control-feedback` de 160 ms. Labels de checkbox podem ser o alvo de toque. O foco de teclado é visível em botões, campos e resumos expansíveis. O feedback de pressão aplica-se a controles disponíveis. O movimento reduzido usa o caminho de acessibilidade existente.

Referências: [Layout](https://developer.apple.com/design/human-interface-guidelines/layout), [Lists and tables](https://developer.apple.com/design/human-interface-guidelines/lists-and-tables), [Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons), [Typography](https://developer.apple.com/design/human-interface-guidelines/typography), [Color](https://developer.apple.com/design/human-interface-guidelines/color), [Motion](https://developer.apple.com/design/human-interface-guidelines/motion) e [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility).

# Validação da release CoreFlow 1.1.57

## Verificações concluídas

- `bash scripts/check.sh` aprovou diagnósticos, paridade da WebView, testes unitários e builds debug de celular e Wear.
- AVD API 36: menu por toque e Voltar, Hoje com e sem programa, abertura do player de Bracing, Pausas com Corpo e Mente, Pausa de Resposta, overlay B1 compacto e expandido, pausa e retomada.
- No WebView do AVD, Hoje, Programas, Pausas, Evolução, Perfil, Vácuo e Discreto abriram sem rolagem lateral em 432 px.
- A avaliação a 360 px com fonte ampliada revelou que o cartão SOS ultrapassava a largura. As ações dos dois cartões passaram a quebrar linha. Corpo e Mente ficaram dentro de 360 px com fonte a 130%, em claro e AMOLED, ao aplicar a correção no WebView de teste. A regressão e a suíte completa passaram com a correção empacotada.
- O Impeccable identificou 91 ocorrências estáticas na WebView. O detector ajuda a localizar pontos de revisão, incluindo blocos ocultos e regras de contraste dependentes do estado renderizado.

## Verificações físicas pendentes

- Galaxy S25 Ultra com TalkBack, fonte ampliada, gestos One UI, rotação, bloqueio e comportamento prolongado sob economia de bateria.
- Galaxy Watch físico: háptica, pareamento e reconexão.
- Revisão visual independente.

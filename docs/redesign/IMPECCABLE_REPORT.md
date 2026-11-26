# Impeccable — M1

Skill local 4.11.0 e executável 4.10.0. O launcher aceitou `context --target index.html`, `--help`, `--version` e `detect <arquivo> --no-advisory`. Os playbooks `audit` e `critique` são procedimentos da skill; a ajuda do binário não os lista como comandos de terminal.

| Recurso | Superfície | Resultado e ação |
|---|---|---|
| `context --target index.html` | WebView Android | Carregou `PRODUCT.md`, `DESIGN.md` e orientações Android. A alça reaproveita os tokens de superfície, linha, ação e foco. |
| `detect app/src/main/assets/index.html --no-advisory` | HTML embarcado | 73 alertas estáticos, incluindo contraste, cores e indicadores pulsantes. A análise estática não identifica com segurança o fundo efetivo nem o estado visível. |
| Revisão visual a partir das capturas ADB | Hoje e navegação | Na baseline o cabeçalho oferecia marca e salvamento, com a navegação invisível ao toque. A implementação acrescentou a alça, com feedback de pressão e indicador de foco. |
| Revisão visual dos controles nativos | Compacta e expandida | A compacta dedica largura às ações e quebra o nome do circuito. A expandida deixa a orientação da prática legível e ocupa altura considerável. Evidências em `AUDIT_INITIAL.md`. |

## Pausas — três modelos

O comando `context --target index.html` carregou a identidade CoreFlow. A revisão de composição pelo Impeccable tratou Pausas como uma tela de operação e comparou três pontos de entrada: tempo, categoria e busca. As [pranchas](prototypes/pausas/pausas-impeccable-comparativo.png) foram inspecionadas lado a lado. São modelos estáticos, então ainda não medem tempo de tarefa nem comportamento em runtime.

Na implementação aprovada de Corpo e Mente, `detect app/src/main/assets/index.html --no-advisory` analisou a WebView inteira e registrou 92 alertas, contra 73 na baseline local anterior à organização. Parte da diferença aparece em blocos de exercícios agora inicialmente recolhidos. O resultado estático exige conferência dos estados expandidos. A entrada de Pausas foi revisada visualmente e o Maestro verificou abertura, troca de categoria e acesso à Pausa de Resposta.

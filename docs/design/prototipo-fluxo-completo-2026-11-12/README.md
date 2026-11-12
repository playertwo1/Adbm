# CoreFlow · protótipo Fluxo

Protótipo local e interativo da direção visual Fluxo. Abra `index.html` em um navegador; não requer instalação, rede ou dependências.

## Como percorrer

- **App:** Hoje, Programas, Pausas, Evolução, Perfil, configuração inicial, Vácuo, Modo discreto, treino guiado, pausa de resposta e conclusão.
- **Respiração:** SOS, Em Caixa, Expiração Longa, Igual e Personalizado. Ajuste as quatro fases entre 0 e 10 s; avance e pause a sessão demonstrativa.
- **Pílulas:** veja mini, compacta, pausada e expandida; percorra confirmação de cancelamento e o caminho Vácuo → recuperação segura.

Use os três seletores no painel esquerdo e os controles dentro do mockup. As telas sobrepostas usam uma agenda fictícia para mostrar a pílula sobre outro app.

## Ícones PulsoIcon nesta prévia

Os atalhos de Hoje agora usam `Wind` para Vácuo, `PersonStanding` para Pausas, `Activity` para Kegel e `Brain` para Mindfulness. A navegação inferior usa `House`, `ListChecks`, `PersonStanding`, `ChartLine` e `UserRound`. Os desenhos SVG são locais, têm uma espessura única e permanecem estáticos para manter a tela de prática calma; as animações do pacote não foram incluídas.

As formas vieram dos módulos `packages/core/src/icons/{wind,person-standing,activity,brain,house,list-checks,chart-line,user-round}.ts` do [CityPulso/PulsoIcon](https://github.com/CityPulso/PulsoIcon). O arquivo [LICENSE-PulsoIcon](LICENSE-PulsoIcon) acompanha os avisos de licença necessários.

## Limites da prévia

Os valores de progresso, relógio e histórico são exemplos. Os botões de treino, Galaxy Watch, áudio e armazenamento não chamam serviços reais. O protótipo não altera código de produção, preferências, histórico ou integração com o Watch. A interface foi feita com HTML/CSS/JavaScript local e não usa Tailwind.

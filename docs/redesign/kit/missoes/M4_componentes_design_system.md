# M4 — Botões, componentes globais e design system (P1)

Branch: `redesign/m4-design-system`

## Antes
Revise o design system/tema existente. Evolua o que há; não crie um paralelo.
Aproveite os padrões já definidos no overlay (M3).

## Hierarquia de controles
Definir e implementar como componentes reutilizáveis:
primário, secundário, terciário, texto, ícone, compacto, controle de exercício,
destrutivo, flutuante, seleção, toggle — com estados desabilitado, pressionado,
carregando. Escala de altura em VISAO.md.

Evitar: tudo largura total, tudo cápsula, tudo com o mesmo peso, textos grandes,
ícones desnecessários, sombras pesadas, cantos exagerados, cartão dentro de cartão,
vermelho fora de perigo/encerramento, padding sem justificativa.

## Tokens a consolidar
Cores semânticas, tipografia, espaçamento, dimensões, raios, bordas, elevação,
superfícies, ícones, campos, listas, indicadores, navegação, movimento
(durações/curvas), estados de interação, vazio e erro.
Centralizar valores; remover valores arbitrários espalhados no código das telas tocadas.

## Aplicar
Substituir os botões em todas as telas pelos novos componentes.
Usar Impeccable (normalize, quieter, typeset, layout ou equivalentes existentes).

## Documentar
- `docs/redesign/COMPONENT_SYSTEM.md` (catálogo + regras de uso).
- Atualizar DESIGN.md.

## Critério de pronto
- [ ] Componentes criados e usados em todas as telas.
- [ ] Nenhum botão fora da escala sem justificativa registrada.
- [ ] Áreas de toque ≥ 48 dp verificadas.
- [ ] Teste com escala de fonte grande (adb shell settings put system font_scale 1.3).
- [ ] Screenshots before/after das telas principais.
- [ ] Sem regressões nos testes e nos flows Maestro existentes.
- [ ] PROGRESS.md → missão atual: M5.

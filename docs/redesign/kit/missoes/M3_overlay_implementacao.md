# M3 — Overlay: implementação da direção escolhida (P0)

Branch: `redesign/m3-overlay`
Pré-requisito: direção escolhida registrada em PROGRESS.md.

## Implementar
- Compacto e expandido (e ultradiscreto, se aprovado) na direção escolhida.
- Controles proporcionais à superfície (ver escala em VISAO.md), área de toque ≥ 48 dp.
- Onda com variações por fase (tabela em VISAO.md) + rótulo de fase acessível.
- Transições: compacto↔expandido, executar↔pausar↔retomar, mudança de fase,
  reposicionamento, início/encerramento, app↔overlay. Continuidade da onda;
  sem atraso nas ações; respeitar redução de movimento.

## Interação e posicionamento
- Diferenciar toque, arraste e expansão.
- Arraste, snap às bordas, memorizar posição.
- Respeitar barras do sistema, teclado virtual, rotação, expansão perto das bordas.
- Não interceptar toques fora da área interativa.

## Confiabilidade (preservar arquitetura sempre que possível)
- **Uma única fonte de verdade** do estado do exercício; overlay e tela principal
  apenas observam. Nenhum temporizador independente.
- Validar: serviço em primeiro plano, permissões, notificações, pausa/retomada,
  bloqueio/desbloqueio, mudança de configuração, recriação de processo
  (conforme suporte existente), liberação de recursos, **sem overlays duplicados**.
- Animação contínua leve (pausar quando não visível, se aplicável).

## Testes (Maestro + ADB)
Iniciar exercício → overlay aparece → alternar estados → arrastar → pausar →
retomar → mudar fase → abrir outro app → voltar ao ADBM → bloquear/desbloquear →
rotacionar → encerrar → verificar que o overlay sumiu e o serviço foi liberado.
Comparar tempo exibido no overlay vs tela principal em pelo menos 3 momentos.

Gravar a sessão (`screenrecord`) e salvar screenshots "after".

## Critério de pronto
- [ ] Overlay novo funcionando em todos os estados.
- [ ] Flow Maestro do overlay passando (ou passos manuais via ADB documentados).
- [ ] Temporizador sincronizado comprovado.
- [ ] Sem overlay duplicado; recursos liberados ao encerrar.
- [ ] Gravação + screenshots before/after.
- [ ] OVERLAY_DESIGN.md atualizado; DESIGN_DECISIONS.md registrado.
- [ ] Itens de bateria/uso prolongado listados como pendentes no S25 real.
- [ ] PROGRESS.md → missão atual: M4.

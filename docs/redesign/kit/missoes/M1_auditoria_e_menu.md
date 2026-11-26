# M1 — Auditoria inicial + correção do menu lateral (P0)

Branch: `redesign/m1-auditoria-menu`

## Parte A — Conhecer o projeto
1. Rodar a verificação de ambiente (`AMBIENTE.md`).
2. Ler (se existirem): README, AGENTS.md, DESIGN.md, PRODUCT.md, docs de arquitetura.
3. Identificar pela inspeção do código (não presumir):
   stack/UI framework, package, navegação/drawer, overlay (serviço, janela,
   estado), motor de exercícios, programas, pausas, agendamentos,
   notificações, tokens/tema, componentes compartilhados, testes existentes.
4. Registrar o mapa em `PROGRESS.md > Contexto técnico descoberto`.
5. Instalar/verificar Impeccable e listar comandos reais (ver `REGRAS.md`).
6. Rodar testes existentes e registrar o estado inicial (baseline).

## Parte B — Auditoria visual
1. Build + instalar no emulador com navegação por gestos ativa.
2. Criar flow Maestro que percorre todas as áreas principais e captura
   screenshots em `docs/redesign/screenshots/before/`.
3. Iniciar um exercício, exibir o overlay (compacto e expandido) e capturar.
4. Rodar Impeccable audit/critique (ou equivalentes existentes) adaptando ao nativo.
5. Escrever `docs/redesign/AUDIT_INITIAL.md`:
   tabela por tela → problema | evidência (screenshot) | gravidade (P0–P3) |
   impacto | proposta. Incluir inventário das funcionalidades de pausas
   (atividade / rotina / agendamento / preferência / histórico / configuração /
   execução / duplicadas / difíceis de achar) — será usado na M5.

## Parte C — Corrigir o menu lateral
**Reproduza o bug primeiro** (gesto de borda com navegação por gestos) e registre.

Solução prioritária: **alça lateral** discreta, parcialmente aparente, como extensão
do próprio menu (não um FAB solto).
- Abre com toque; feedback visual ao pressionar.
- Área de toque ≥ 48 dp; visual pequeno e integrado à identidade.
- Posicionada fora da zona de conflito ou usando `setSystemGestureExclusionRects`
  (limite do sistema ≈ 200 dp verticais por borda — usar só na faixa da alça).
- Gesto de arrastar mantido apenas se funcionar sem conflito.
- Alternativa aceitável a avaliar: ícone no cabeçalho. Documente se for melhor,
  mas a alça é a direção preferida.

Comportamentos obrigatórios:
- Toque na alça abre; toque fora fecha.
- Voltar com o menu aberto **fecha o menu** antes de navegar.
- Transições suaves; respeitar redução de movimento.
- Navegação nativa do Android continua funcionando.
- Alça não sobrepõe outros controles; nada fecha o app involuntariamente.

## Critério de pronto
- [ ] Ambiente verificado e registrado.
- [ ] Mapa técnico em PROGRESS.md.
- [ ] Screenshots "before" de todas as áreas + overlay.
- [ ] AUDIT_INITIAL.md com gravidade e evidências.
- [ ] IMPECCABLE_REPORT.md iniciado (comandos reais).
- [ ] Flow Maestro do menu passando: abrir por toque, fechar por toque fora,
      fechar com Voltar, navegar entre áreas, gesto de voltar do sistema intacto.
- [ ] Screenshots "after" do menu fechado/aberto.
- [ ] Testes existentes sem regressão.
- [ ] PROGRESS.md atualizado → missão atual: M2.

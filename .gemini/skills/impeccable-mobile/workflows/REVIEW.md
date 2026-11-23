# Review (sem editar código)

1. Identificar tela-alvo e plataforma. Ler PRODUCT.md / DESIGN.md se existirem.
2. Obter captura atual com Maestro ou ADB; não inventar imagem.
3. Para Android, gerar dump XML com `inspect --include-xml`, se não revelar dados privados.
4. Encaminhar ao `impeccable critique` / `audit`, interpretar com regra native.
5. Reportar 3 maiores problemas, evidências e risco, sem nenhuma edição.
6. Se app indisponível, indicar revisão estática (código/design specs) limitada.

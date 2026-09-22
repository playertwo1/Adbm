#!/usr/bin/env bash
# Gate mecanico de consistencia documental de SHA.
#
# Motivacao: na E08.7 (card t_53330354) quatro rodadas consecutivas Builder->Auditor
# foram gastas com a mesma classe de defeito — o SHA declarado em ROADMAP.md e em
# docs/roadmap/execucao.md nao batia com o HEAD real, ou os dois documentos se
# contradiziam. Nenhum era bug de codigo. Defeito detectavel mecanicamente nao deve
# consumir rodada de revisao.
#
# Convencao verificada (a mesma registrada em execucao.md): o SHA de um commit nao
# pode ser gravado dentro do proprio commit sem auto-referencia, entao o alvo
# comportamental e separado do commit documental:
#
#   base_sha=<sha>                   base da etapa
#   behavioral_target_sha=<sha>      alvo auditavel de comportamento
#   documentation_parent_sha=<sha>   pai imediato do commit documental
#
# Uso:  bash scripts/check-doc-sha.sh
# Saida: 0 = consistente, 1 = divergencia (com o motivo), 2 = erro de uso.

set -uo pipefail

ROADMAP="ROADMAP.md"
EXEC="docs/roadmap/execucao.md"
fail=0

die_usage() { echo "erro: execute a partir da raiz do repositorio (nao achei $1)" >&2; exit 2; }
[ -f "$ROADMAP" ] || die_usage "$ROADMAP"
[ -f "$EXEC" ] || die_usage "$EXEC"

report() { echo "FAIL: $*" >&2; fail=1; }

# Ultimo valor declarado para uma chave em um arquivo; vazio se ausente.
declared() {
  grep -oE "$1=\`?[0-9a-f]{7,40}\`?" "$2" 2>/dev/null \
    | tail -1 | grep -oE '[0-9a-f]{7,40}'
}

for key in base_sha behavioral_target_sha documentation_parent_sha; do
  r=$(declared "$key" "$ROADMAP")
  e=$(declared "$key" "$EXEC")

  if [ -z "$r" ] && [ -z "$e" ]; then
    report "$key nao esta declarado em nenhum dos dois documentos."
    continue
  fi
  if [ -z "$r" ]; then report "$key declarado em $EXEC ($e) mas ausente em $ROADMAP."; continue; fi
  if [ -z "$e" ]; then report "$key declarado em $ROADMAP ($r) mas ausente em $EXEC."; continue; fi

  # Comparacao pelo prefixo comum: os documentos podem abreviar.
  n=${#r}; [ ${#e} -lt "$n" ] && n=${#e}
  if [ "${r:0:$n}" != "${e:0:$n}" ]; then
    report "$key divergente entre documentos: $ROADMAP=$r vs $EXEC=$e."
    continue
  fi

  if ! git cat-file -e "${r}^{commit}" 2>/dev/null; then
    report "$key=$r nao existe neste repositorio."
    continue
  fi

  echo "ok: $key=$r (consistente nos dois documentos e presente no repo)"
done

# O commit documental deve ser filho imediato de documentation_parent_sha.
# Antes de commitar, esse pai e o HEAD atual; depois de commitar, e HEAD^.
parent=$(declared documentation_parent_sha "$ROADMAP")
if [ -n "$parent" ] && git cat-file -e "${parent}^{commit}" 2>/dev/null; then
  head_sha=$(git rev-parse HEAD)
  head_parent=$(git rev-parse HEAD^ 2>/dev/null || echo "")
  full_parent=$(git rev-parse "${parent}^{commit}")
  if [ "$full_parent" = "$head_sha" ]; then
    echo "ok: documentation_parent_sha e o HEAD atual (antes de commitar o commit documental)"
  elif [ "$full_parent" = "$head_parent" ]; then
    echo "ok: documentation_parent_sha e o pai imediato de HEAD (commit documental recem-criado)"
  elif git merge-base --is-ancestor "$full_parent" HEAD 2>/dev/null; then
    # A relacao pai-imediato e um invariante de HANDOFF, nao do repositorio: depois
    # que a branch do card e integrada, HEAD anda e ela se quebra para sempre.
    # Fora da ponta da branch basta que o SHA declarado pertenca a esta historia.
    echo "ok: documentation_parent_sha ja integrado nesta historia (branch do card consolidada)"
  else
    report "documentation_parent_sha=$parent nao pertence a historia de HEAD ($head_sha).
      Na ponta da branch do card ele deve ser o HEAD atual (antes de commitar) ou
      o pai imediato de HEAD (depois de commitar)."
  fi
fi

# A arvore precisa estar limpa para que o SHA declarado descreva o conteudo real.
if [ -n "$(git status --porcelain -- "$ROADMAP" "$EXEC")" ]; then
  echo "aviso: $ROADMAP e/ou $EXEC tem alteracoes nao commitadas — o SHA declarado" >&2
  echo "       ainda nao descreve o conteudo em disco. Rode de novo apos o commit." >&2
fi

if [ "$fail" -ne 0 ]; then
  echo >&2
  echo "Consistencia documental de SHA REPROVADA. Corrija antes do handoff:" >&2
  echo "achado desta classe nao deve consumir rodada de auditoria." >&2
  exit 1
fi

echo "Consistencia documental de SHA OK."

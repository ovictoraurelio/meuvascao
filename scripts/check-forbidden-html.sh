#!/bin/sh
# Gate: nenhum set:html, innerHTML, outerHTML, insertAdjacentHTML ou document.write em src/,
# exceto os caminhos listados em scripts/forbidden-html.allowlist (um por linha).
set -eu
cd "$(dirname "$0")/.."
allowlist="scripts/forbidden-html.allowlist"
pattern='set:html|innerHTML|outerHTML|insertAdjacentHTML|document\.write'
hits=$(grep -rnE "$pattern" src --include='*.astro' --include='*.ts' --include='*.tsx' --include='*.mjs' --include='*.js' || true)
status=0
printf '%s\n' "$hits" | while IFS= read -r hit; do
  [ -z "$hit" ] && continue
  file=${hit%%:*}
  if [ -f "$allowlist" ] && grep -qxF "$file" "$allowlist"; then continue; fi
  echo "HTML proibido fora da allowlist: $hit"
  status=1
done || status=1
if printf '%s\n' "$hits" | grep -qE . ; then
  # Recalcula o status fora do subshell do while.
  remaining=$(printf '%s\n' "$hits" | while IFS= read -r hit; do
    [ -z "$hit" ] && continue
    file=${hit%%:*}
    if [ -f "$allowlist" ] && grep -qxF "$file" "$allowlist"; then continue; fi
    echo "$hit"
  done)
  if [ -n "$remaining" ]; then exit 1; fi
fi
echo "check-forbidden-html: nenhuma injeção de HTML fora da allowlist."

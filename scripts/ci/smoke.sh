#!/bin/sh
# Sonda sem imprimir payloads: saúde do D1, páginas públicas e isolamento de rotas dev.
set -eu
base="${1:?Informe URL base}"
expected="${2:?Informe ambiente}"
base="${base%/}"
case "$expected" in development|preview|production) ;; *) exit 1 ;; esac
attempt=1
while [ "$attempt" -le 10 ]; do
  body=$(curl -fsS --max-time 15 "$base/api/health" 2>/dev/null || true)
  if node -e '
    try {
      const [body, expected] = process.argv.slice(1);
      const j = JSON.parse(body);
      process.exit(j.ok === true && j.db === "ok" && j.env === expected ? 0 : 1);
    } catch { process.exit(1); }
  ' "$body" "$expected"; then
    valid=true
    for path in / /jogos; do
      status=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 "$base$path" 2>/dev/null || true)
      [ "$status" = 200 ] || valid=false
    done
    if [ "$expected" = production ]; then
      for path in /dev/mailbox /dev-login; do
        status=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 "$base$path" 2>/dev/null || true)
        [ "$status" = 404 ] || valid=false
      done
    fi
    if [ "$valid" = true ]; then
      echo "Sonda aprovada: saúde, D1 e páginas públicas ($expected)."
      exit 0
    fi
  fi
  echo "Tentativa $attempt: sonda ainda não aprovada."
  attempt=$((attempt + 1))
  [ "$attempt" -gt 10 ] || sleep 6
done
echo "::error::Sonda reprovada: confira saúde, D1, páginas e isolamento de desenvolvimento."
exit 1

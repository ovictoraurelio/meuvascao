#!/bin/sh
# Sonda pós-deploy: /api/health precisa responder ok:true e o ambiente esperado. Tenta algumas vezes
# porque a propagação na borda leva alguns segundos.
set -eu
base="$1"
expected="$2"
attempt=1
while [ "$attempt" -le 10 ]; do
  body=$(curl -fsS --max-time 15 "$base/api/health" 2>/dev/null || true)
  if [ -n "$body" ] && node -e '
    const [body, expected] = process.argv.slice(1);
    const j = JSON.parse(body);
    process.exit(j.ok === true && j.env === expected ? 0 : 1);
  ' "$body" "$expected"; then
    echo "Sonda ok em $base: $body"
    exit 0
  fi
  echo "Tentativa $attempt: ainda sem resposta válida ($body)"
  attempt=$((attempt + 1))
  sleep 6
done
echo "::error::$base/api/health não respondeu ok:true com env=$expected."
exit 1

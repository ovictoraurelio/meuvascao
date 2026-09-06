#!/bin/sh
# Recria o banco D1 local do zero: apaga o estado, aplica as migrações e carrega um seed.
# A persistência padrão do wrangler para o config da raiz é .wrangler/state, a mesma do `astro dev`.
# Uso: sh scripts/db-reset-local.sh [dev|e2e]  (padrão: e2e, o que o Playwright espera)
set -eu
cd "$(dirname "$0")/.."
seed="${1:-e2e}"
rm -rf .wrangler/state/v3/d1
npm run --silent db:migrate
if [ -f "seeds/$seed.sql" ]; then
  npx wrangler d1 execute DB --local --file "seeds/$seed.sql"
fi
echo "db-reset-local: banco local pronto (seed: $seed)."

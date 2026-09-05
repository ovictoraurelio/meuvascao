#!/bin/sh
# Recria o banco D1 local do zero: apaga o estado, aplica as migrações e carrega o seed de E2E.
# A persistência padrão do wrangler para o config da raiz é .wrangler/state, a mesma do `astro dev`.
set -eu
cd "$(dirname "$0")/.."
rm -rf .wrangler/state/v3/d1
npm run --silent db:migrate
if [ -f seeds/e2e.sql ]; then
  npx wrangler d1 execute DB --local --file seeds/e2e.sql
fi
echo "db-reset-local: banco local pronto."

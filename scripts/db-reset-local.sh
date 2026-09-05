#!/bin/sh
# Recria o banco D1 local do zero: apaga o estado, aplica as migrações e carrega o seed de E2E.
set -eu
cd "$(dirname "$0")/.."
rm -rf .wrangler/state/v3/d1
npx wrangler d1 migrations apply DB --local --persist-to .wrangler/state
if [ -f seeds/e2e.sql ]; then
  npx wrangler d1 execute DB --local --persist-to .wrangler/state --file seeds/e2e.sql
fi
echo "db-reset-local: banco local pronto."

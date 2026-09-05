#!/bin/sh
# Deploy do Worker do ambiente indicado a partir do config gerado pelo build; expõe a URL publicada.
set -eu
environment="$1"
log=$(mktemp)
npx wrangler deploy --config dist/server/wrangler.json --env "$environment" 2>&1 | tee "$log"
if [ "$environment" = "production" ]; then
  url="https://meuvascao.com"
else
  url=$(grep -oE 'https://[a-z0-9.-]+\.workers\.dev' "$log" | head -1 || true)
fi
if [ -z "$url" ]; then
  echo "::error::Deploy concluído, mas a URL não apareceu na saída do wrangler."
  exit 1
fi
echo "url=$url" >> "${GITHUB_OUTPUT:-/dev/stdout}"
echo "Publicado em $url"

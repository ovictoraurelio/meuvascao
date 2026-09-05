#!/bin/sh
# Publica uma versão no Worker de preview com alias estável por PR e expõe a URL em $GITHUB_OUTPUT.
# Não altera a URL principal do preview (que segue main). Se o Worker de preview ainda não existir,
# faz o primeiro deploy dele e usa a URL principal.
set -eu
preview_alias="$1"
sha="$2"
log=$(mktemp)
if npx wrangler versions upload --config dist/server/wrangler.json --env preview \
  --preview-alias "$preview_alias" --tag "$preview_alias" --message "$preview_alias $sha" 2>&1 | tee "$log"; then
  url=$(grep -oE 'https://[a-z0-9.-]+\.workers\.dev' "$log" | grep "^https://$preview_alias-" | head -1 || true)
  [ -n "$url" ] || url=$(grep -oE 'https://[a-z0-9.-]+\.workers\.dev' "$log" | head -1 || true)
else
  if grep -qiE "not found|does not exist|10007" "$log"; then
    echo "Worker de preview ainda não existe; fazendo o primeiro deploy do ambiente preview."
    npx wrangler deploy --config dist/server/wrangler.json --env preview 2>&1 | tee "$log"
    url=$(grep -oE 'https://[a-z0-9.-]+\.workers\.dev' "$log" | head -1 || true)
  else
    exit 1
  fi
fi
if [ -z "$url" ]; then
  echo "::error::Não foi possível extrair a URL de preview da saída do wrangler."
  exit 1
fi
echo "url=$url" >> "${GITHUB_OUTPUT:-/dev/stdout}"
echo "Preview publicado em $url"

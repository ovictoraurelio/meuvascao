#!/bin/sh
# Publica uma versão no Worker de preview com alias estável por PR e expõe a URL em $GITHUB_OUTPUT.
# Não altera a URL principal do preview (que segue main). Se o Worker de preview ainda não existir,
# faz o primeiro deploy dele e usa a URL principal.
# Sem pipes na chamada do wrangler: em sh, `cmd | tee` devolve o status do tee, não do cmd.
set -eu
preview_alias="$1"
sha="$2"
log=$(mktemp)
status=0
npx wrangler versions upload --config dist/server/wrangler.json --env preview \
  --preview-alias "$preview_alias" --tag "$preview_alias" --message "$preview_alias $sha" >"$log" 2>&1 || status=$?
cat "$log"
if [ "$status" -ne 0 ]; then
  if grep -qiE "does not (yet )?exist|not found|10007" "$log"; then
    echo "Worker de preview ainda não existe; fazendo o primeiro deploy do ambiente preview."
    status=0
    npx wrangler deploy --config dist/server/wrangler.json --env preview >"$log" 2>&1 || status=$?
    cat "$log"
    [ "$status" -eq 0 ] || exit "$status"
    url=$(grep -oE 'https://[a-z0-9.-]+\.workers\.dev' "$log" | head -1 || true)
  else
    exit "$status"
  fi
else
  url=$(grep -oE 'https://[a-z0-9.-]+\.workers\.dev' "$log" | grep "^https://$preview_alias-" | head -1 || true)
  [ -n "$url" ] || url=$(grep -oE 'https://[a-z0-9.-]+\.workers\.dev' "$log" | head -1 || true)
fi
if [ -z "${url:-}" ]; then
  echo "::error::Não foi possível extrair a URL de preview da saída do wrangler."
  exit 1
fi
echo "url=$url" >>"${GITHUB_OUTPUT:-/dev/stdout}"
echo "Preview publicado em $url"

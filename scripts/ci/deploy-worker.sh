#!/bin/sh
# Deploy do Worker do ambiente indicado a partir do config gerado pelo build; expõe a URL publicada.
# Sem pipes na chamada do wrangler: em sh, `cmd | tee` devolve o status do tee, não do cmd.
# Sem `--env`: o config gerado pelo build já é do ambiente (targetEnvironment) e traz o nome com
# sufixo; passar --env de novo faria o wrangler sufixar duas vezes. O ambiente só é usado para a URL.
set -eu
environment="$1"
log=$(mktemp)
status=0
npx wrangler deploy --config dist/server/wrangler.json >"$log" 2>&1 || status=$?
cat "$log"
[ "$status" -eq 0 ] || exit "$status"
if [ "$environment" = "production" ]; then
  url="https://meuvascao.com"
else
  url=$(grep -oE 'https://[a-z0-9.-]+\.workers\.dev' "$log" | head -1 || true)
fi
if [ -z "$url" ]; then
  echo "::error::Deploy concluído, mas a URL não apareceu na saída do wrangler."
  exit 1
fi
echo "url=$url" >>"${GITHUB_OUTPUT:-/dev/stdout}"
echo "Publicado em $url"

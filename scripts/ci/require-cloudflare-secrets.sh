#!/bin/sh
# Verifica os segredos de deploy. Modo padrão (preview): sem segredos, avisa e marca
# configured=false para os passos seguintes serem pulados, sem deixar o PR vermelho por uma
# configuração externa pendente. Modo --strict (produção): sem segredos, falha.
set -eu
strict=0
[ "${1:-}" = "--strict" ] && strict=1
missing=""
[ -n "${CLOUDFLARE_API_TOKEN:-}" ] || missing="$missing CLOUDFLARE_API_TOKEN"
[ -n "${CLOUDFLARE_ACCOUNT_ID:-}" ] || missing="$missing CLOUDFLARE_ACCOUNT_ID"
if [ -n "$missing" ]; then
  msg="Segredos ausentes no repositório:$missing. Nada foi publicado. Siga docs/runbooks/deploy.md, seção 'Segredos no GitHub'."
  if [ "$strict" = 1 ]; then
    echo "::error::$msg"
    exit 1
  fi
  echo "::warning::$msg"
  echo "configured=false" >> "${GITHUB_OUTPUT:-/dev/stdout}"
  exit 0
fi
echo "configured=true" >> "${GITHUB_OUTPUT:-/dev/stdout}"
echo "Segredos de deploy presentes."

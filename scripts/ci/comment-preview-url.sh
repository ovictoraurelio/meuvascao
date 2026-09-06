#!/bin/sh
# Cria ou atualiza (um único) comentário no PR com a URL de preview da versão publicada.
set -eu
pr="$1"
url="$2"
sha="$3"
marker="<!-- meuvascao-preview -->"
body="$marker
**Preview desta PR:** $url

Versão publicada do commit \`$sha\` no Worker de preview (banco D1 de preview, sem dados reais). A URL principal do preview continua refletindo \`main\`."
existing=$(gh api "repos/$GITHUB_REPOSITORY/issues/$pr/comments" --paginate --jq ".[] | select(.body | startswith(\"$marker\")) | .id" | head -1 || true)
if [ -n "$existing" ]; then
  gh api -X PATCH "repos/$GITHUB_REPOSITORY/issues/comments/$existing" -f body="$body" >/dev/null
  echo "Comentário $existing atualizado."
else
  gh api -X POST "repos/$GITHUB_REPOSITORY/issues/$pr/comments" -f body="$body" >/dev/null
  echo "Comentário criado."
fi

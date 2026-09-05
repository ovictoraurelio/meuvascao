#!/bin/sh
# Produção só publica se o Environment `production` exigir revisores. O GitHub cria Environments
# automaticamente sem proteção, então a ausência da regra bloqueia o deploy em vez de passar.
set -eu
rules=$(gh api "repos/$GITHUB_REPOSITORY/environments/production" --jq '[.protection_rules[]? | select(.type == "required_reviewers")] | length' 2>/dev/null || echo "erro")
if [ "$rules" = "erro" ]; then
  echo "::error::Não foi possível ler as regras do Environment production (permissão ou Environment inexistente). Configure-o com Required reviewers: docs/runbooks/deploy.md, seção 'Environments no GitHub'."
  exit 1
fi
if [ "$rules" -lt 1 ]; then
  echo "::error::O Environment production não tem Required reviewers. Configure antes de publicar: docs/runbooks/deploy.md, seção 'Environments no GitHub'."
  exit 1
fi
echo "Environment production exige revisores ($rules regra(s))."

# Contribuindo

## Pré-requisitos

Node 22 (22.12 ou superior, ver `.nvmrc`), npm 10 ou superior e um shell POSIX (os scripts `build:*`, `db:reset` e o servidor dos testes usam `sh` e variáveis inline; no Windows, use o Git Bash ou o WSL). Para os testes de navegador: `npx playwright install chromium` (em Linux, `--with-deps`).

## Fluxo local

1. `npm ci` instala as dependências. Para **adicionar ou atualizar dependências**, use `npx npm@11 install <pacote>`: o resolvedor do npm 10 falha com o conjunto de peers do Vitest 4 (`Cannot read properties of null (reading 'edgesOut')`), enquanto o `npm ci` a partir do lockfile funciona em qualquer npm 10+. Versões exatas, sem `^`.
2. `npm run types` gera `worker-configuration.d.ts` (ignorado pelo Git) a partir de `wrangler.jsonc`; o editor e o `astro check` dependem dele. `npm run check:types` já o regenera antes de checar.
3. `npm run db:reset` recria o D1 local em `.wrangler/state` (migrações e, quando existir, `seeds/e2e.sql`).
4. `npm run dev` sobe o Astro em http://localhost:4321 com os bindings locais.
5. `npm run preview` faz o build e o serve com `wrangler dev` a partir de `dist/server/wrangler.json` na porta 8788, o mesmo runtime dos testes de navegador e da produção. Não deixe o preview aberto ao rodar `npm test`: os testes sobem o próprio servidor nessa porta.
6. Antes do PR: `npm run check && npm test`.

## Comandos

| Comando                                      | O que faz                                                                                                                                                |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run check`                              | Gates estáticos: actions por SHA, Prettier, ESLint (inclui sinks de HTML e fronteiras de módulo), Stylelint (CSS e `<style>` de `.astro`), `astro check` |
| `npm run test:vitest`                        | Testes unitários (Node) e em workerd com D1 real, numa só execução                                                                                       |
| `npm run test:e2e`                           | `astro build` e Playwright contra o build servido pelo wrangler (projetos `api`, `celular`, `desktop`)                                                   |
| `E2E_ENVIRONMENT=preview npm run test:e2e`   | Mesmos testes com a variável `ENVIRONMENT` sobrescrita para exercitar gates por ambiente                                                                 |
| `npm run build:preview` / `build:production` | Build com `CLOUDFLARE_ENV` definido; é o build que se deploya (`wrangler deploy --config dist/server/wrangler.json`)                                     |
| `npm run db:generate`                        | Gera migração a partir de `src/lib/db/schema.ts` (fatia F3 em diante)                                                                                    |

## Observações

- **Ambientes e build**: o adaptador gera um `dist/server/wrangler.json` achatado para o ambiente escolhido em `CLOUDFLARE_ENV` no momento do build. Sem a variável, o build é o de desenvolvimento, e `wrangler deploy --env production` sobre ele publicaria as variáveis de desenvolvimento sem erro. Use sempre `build:preview`/`build:production` para deploy.
- **Tipos e segredos**: `wrangler types` inclui em `Env` as chaves encontradas em `.dev.vars`. Se você copiar `.dev.vars.example`, o tipo local ganha segredos que a CI (sem `.dev.vars`) não tem; a fatia F6 declara os segredos em um `.d.ts` versionado para eliminar a diferença.
- **compatibility_date**: fixada em 2026-08-15 em `wrangler.jsonc` e em `tests/workers/wrangler.test.jsonc` porque o workerd embutido no `@cloudflare/vitest-pool-workers` não aceita datas posteriores. Suba as duas juntas.
- **Actions por SHA**: além do gate local (`scripts/check-actions-pinned.mjs`), o fundador pode ativar no GitHub a política "Require actions to be pinned to a full-length commit SHA" (Settings → Actions), que recusa workflows não fixados na execução.

## Entrega contínua

`.github/workflows/deploy.yml`: PR publica uma versão de preview com URL própria e comenta no PR; push em `main` faz o deploy do Worker de preview; produção só por `workflow_dispatch` com confirmação e aprovação no Environment `production`. Configuração inicial (token, D1, segredos, Environments), fluxo, rollback e diagnóstico em [docs/runbooks/deploy.md](docs/runbooks/deploy.md). A CI valida o bundle com `wrangler deploy --dry-run` em todo PR; `tests/unit/deploy-policy.test.ts` trava a regra "produção nunca por push".

## Matriz de versões (verificada em 05/09/2026)

Astro 7.3.1 · @astrojs/cloudflare 14.3.0 (exige Astro ≥ 7.2 e wrangler ≥ 4.125) · wrangler 4.129.0 · TypeScript 5.9.3 (o `@astrojs/check` aceita 5.x/6.x) · Vitest 4.1.11 (o `@cloudflare/vitest-pool-workers` 0.22 exige Vitest ^4.1 e traz workerd 1.20260815) · Playwright 1.63.0 · ESLint 10 (o `eslint-plugin-astro` 3 exige ≥ 10) · Stylelint 17 + postcss-html 2 · Drizzle ORM 0.45.2 / drizzle-kit 0.31.10. Atualizações via Dependabot, agrupadas.

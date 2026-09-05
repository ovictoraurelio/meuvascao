# Contribuindo

## Pré-requisitos

Node 22.12 ou superior (`.nvmrc`), npm 10+. Para os testes de navegador: `npx playwright install chromium` (em Linux, `--with-deps`).

## Fluxo

1. `npm ci` (gera `worker-configuration.d.ts` a partir de `wrangler.jsonc`). Para **adicionar ou atualizar dependências**, use `npx npm@11 install <pacote>`: o resolvedor do npm 10 falha com o conjunto de peers do Vitest 4 (`Cannot read properties of null (reading 'edgesOut')`), enquanto o `npm ci` a partir do lockfile funciona em qualquer npm 10+.
2. `npm run db:reset` para preparar o D1 local.
3. `npm run dev` e abrir http://localhost:4321.
4. Antes do PR: `npm run check && npm test`.
5. `npm run preview` faz o build e serve o resultado com `wrangler dev --config dist/server/wrangler.json` na porta 8788, o mesmo runtime dos testes de navegador e da produção. O D1 local fica em `.wrangler/state` tanto no `astro dev` quanto no `wrangler dev`.

Uma fatia por PR, testes antes do código, actions por SHA. As regras completas estão em `CLAUDE.md`; a arquitetura, em `docs/03-arquitetura.md` e nos ADRs em `docs/adr/`.

## Matriz de versões (verificada em 05/09/2026)

Astro 7.3.1 · @astrojs/cloudflare 14.3.0 (exige Astro ≥ 7.2 e wrangler ≥ 4.125) · wrangler 4.129.0 · TypeScript 5.9.3 (o `@astrojs/check` aceita 5.x/6.x) · Vitest 4.1.11 (o `@cloudflare/vitest-pool-workers` 0.22 exige Vitest ^4.1) · Playwright 1.63.0 · ESLint 10 (o `eslint-plugin-astro` 3 exige ≥ 10) · Drizzle ORM 0.45.2 / drizzle-kit 0.31.10. Atualizações via Dependabot, agrupadas.

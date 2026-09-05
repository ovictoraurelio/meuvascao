# Meu Vascão

**O Vasco no peito. A torcida aqui.**

Portal independente, feito por torcedores, para acompanhar o Vasco e viver cada partida em comunidade. Sem vínculo oficial com o Club de Regatas Vasco da Gama.

Estado: **v1 em construção** (fatia F0, fundação). O protótipo 0.1.0 está arquivado em `prototype/`.

## Stack

Astro 7 (SSR) + TypeScript em Cloudflare Workers, binding D1 e configuração do Drizzle ORM, Vitest (unit e workers) e Playwright (E2E). A F0 entrega a home mínima, a sonda de saúde e gates de tipos, lint, HTML e cabeçalhos. Esquema de domínio, tokens em `design/tokens.json`, layout, auditorias de acessibilidade e desempenho entram nas próximas fatias. Postgres em São Paulo segue como alternativa a decidir por spike de latência. Decisões em `docs/03-arquitetura.md`, plano e revisão em `docs/06-revisao-personas.md`, regras de trabalho em `CLAUDE.md`.

## Executar localmente

Pré-requisitos: Node 22.12+ (`.nvmrc`) e npm.

```sh
npm ci
npm run db:reset
npm run dev
```

Abrir http://localhost:4321. O banco D1 local fica em `.wrangler/state` e é recriado por `npm run db:reset`.

## Verificar

```sh
npm run check
npx playwright install chromium
npm test
```

`npm run check` roda os gates estáticos (actions por SHA, HTML proibido, Prettier, ESLint, Stylelint, `astro check`). `npm test` roda os testes unitários, os testes em workerd com D1 real e os testes de navegador contra o build servido pelo wrangler na porta 8788. `npm run preview` serve o build da mesma forma para inspeção manual. Para alterar dependências use `npx npm@11 install` (ver `CONTRIBUTING.md`).

Após o build, os ambientes também podem ser verificados localmente com `E2E_ENVIRONMENT=preview CI=true npx playwright test` e `E2E_ENVIRONMENT=production CI=true npx playwright test`. Isso altera a variável do Worker local; não faz deploy nem acessa o banco remoto. A sonda `/api/health` retorna 503 quando o banco falha ou seu binding está ausente.

## Documentação

1. [Visão de produto e MVP](docs/01-produto.md)
2. [Identidade, experiência e operação editorial](docs/02-experiencia-editorial.md)
3. [Arquitetura e decisão técnica](docs/03-arquitetura.md)
4. [Roadmap, critérios de lançamento e decisões abertas](docs/04-execucao.md)
5. [Registro de kickoff](docs/05-kickoff.md)
6. [Revisão em três personas e consolidação para o Product Owner](docs/06-revisao-personas.md)

## Ambientes e deploy

Desenvolvimento local sem conta. Preview e produção na Cloudflare, configurados em `wrangler.jsonc` (`env.preview` e `env.production`); os IDs de banco e os segredos são preenchidos pelo fundador seguindo o runbook (fatia F12). Nenhum deploy é feito por agente.

## Licença

A definir pelo fundador antes de divulgar o repositório.

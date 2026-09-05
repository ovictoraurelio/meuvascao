# Meu Vascão

**O Vasco no peito. A torcida aqui.**

Portal independente, feito por torcedores, para acompanhar o Vasco e viver cada partida em comunidade. Sem vínculo oficial com o Club de Regatas Vasco da Gama.

Estado: **v1 em construção** (fatia F0, fundação). O protótipo 0.1.0 está arquivado em `prototype/`.

## Stack

Astro 7 (SSR) + TypeScript em Cloudflare Workers, banco D1 via Drizzle ORM (Postgres em São Paulo como alternativa a decidir por spike de latência), CSS com tokens (a partir da fatia F2), Vitest (unit e workerd) e Playwright (E2E e gates). Decisões em `docs/03-arquitetura.md`, plano e revisão em `docs/06-revisao-personas.md`, regras de trabalho para agentes em `CLAUDE.md`.

## Executar localmente

```sh
npm ci
npm run db:reset
npm run dev
```

Abrir http://localhost:4321. Comandos, versões e observações operacionais estão em [CONTRIBUTING.md](CONTRIBUTING.md); verificação completa com `npm run check && npm test`.

## Documentação

1. [Visão de produto e MVP](docs/01-produto.md)
2. [Identidade, experiência e operação editorial](docs/02-experiencia-editorial.md)
3. [Arquitetura e decisão técnica](docs/03-arquitetura.md)
4. [Roadmap, critérios de lançamento e decisões abertas](docs/04-execucao.md)
5. [Registro de kickoff](docs/05-kickoff.md)
6. [Revisão em três personas e consolidação para o Product Owner](docs/06-revisao-personas.md)

## Ambientes e deploy

Desenvolvimento local sem conta. Preview e produção na Cloudflare, configurados em `wrangler.jsonc` (`env.preview` e `env.production`) e resolvidos no build por `npm run build:preview` / `build:production`. IDs de banco e segredos são preenchidos pelo fundador seguindo o runbook (fatia F12). Nenhum deploy é feito por agente.

## Licença

A definir pelo fundador antes de divulgar o repositório.

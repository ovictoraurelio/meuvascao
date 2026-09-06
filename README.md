# Meu Vascão

**O Vasco no peito. A torcida aqui.**

Portal independente, feito por torcedores, para acompanhar o Vasco e viver cada partida em comunidade. Sem vínculo oficial com o Club de Regatas Vasco da Gama.

Estado: **v1 em construção**, com home, agenda, conta/sessão, administração editorial, páginas institucionais e ferramentas de operação implementadas. A participação pública fica fechada por padrão até a configuração dos serviços e da operação. O protótipo 0.1.0 está arquivado em `prototype/`.

## Stack

Astro 7 (SSR) + TypeScript em Cloudflare Workers, banco D1 via Drizzle ORM (Postgres em São Paulo como alternativa a decidir por spike de latência), CSS com tokens, Vitest (unit e workerd) e Playwright (E2E e gates). Decisões em `docs/03-arquitetura.md`, plano e revisão em `docs/06-revisao-personas.md`, regras de trabalho para agentes em `CLAUDE.md`.

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
7. [Roadmap v1 por fatias](docs/07-roadmap-v1.md)
8. [Esteira Vuca e evidências de revisão](docs/09-esteira-vuca.md)

## Ambientes e deploy

Desenvolvimento local sem conta. Preview e produção na Cloudflare, configurados em `wrangler.jsonc` (`env.preview` e `env.production`) e resolvidos no build por `npm run build:preview` / `build:production`. Entrega contínua em `.github/workflows/deploy.yml`: preview por PR e a cada merge em `main`; produção só manual, com aprovação. Configuração inicial e rollback em [docs/runbooks/deploy.md](docs/runbooks/deploy.md). A publicação desta esteira foi autorizada pelo fundador; o Environment protegido e as verificações permanecem ativos. Veja o [recorte de leitura](docs/runbooks/publicacao-leitura.md).

## Licença

A definir pelo fundador antes de divulgar o repositório.

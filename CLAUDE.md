# Meu Vascão — guia para agentes

Portal independente de torcedores do Vasco: dia de jogo, resenha por partida e links curados. Astro SSR + TypeScript em Cloudflare Workers, D1 via Drizzle, CSS com tokens. Plano aprovado da v1 em `docs/06-revisao-personas.md` (consolidação e adendo) e neste guia.

## Comandos

- `npm run dev`: Astro em modo de desenvolvimento com bindings locais (D1 em `.wrangler/state`).
- `npm run db:reset`: recria o D1 local (migrações + `seeds/e2e.sql`).
- `npm run check`: actions por SHA, HTML proibido, Prettier, ESLint, Stylelint, `astro check`.
- `npm test`: unit (Vitest node) + workers (Vitest em workerd com D1 real) + E2E (Playwright contra `astro build` + `wrangler dev`).
- `npm run db:generate`: gera migração a partir de `src/lib/db/schema.ts`. Nunca edite migração aplicada.
- `npm run preview`: build + `wrangler dev --config dist/server/wrangler.json` (porta 8788). O deploy usa esse mesmo config gerado.
- Dependências: adicionar ou atualizar só com `npx npm@11 install <pacote>` (o npm 10 falha na resolução; `npm ci` funciona). Versões exatas, sem `^`.
- Ambiente no código: `import { getEnv } from "@/lib/env"` (usa `cloudflare:workers`); `locals.runtime` está depreciado no adaptador 14 e não deve ser usado.

## Regras de trabalho

1. **Uma fatia por PR**, branch `fatia/Fxx-nome`. Os testes da fatia entram em commit separado antes do código e começam falhando.
2. **Guardrails são intocáveis**: não afrouxe gates de CI, não adicione `eslint-disable`/`stylelint-disable` sem justificativa no PR, não coloque arquivos na allowlist de HTML sem revisão humana.
3. **Autonomia**: pode abrir PR, rodar CI e publicar em preview. **Não pode** fazer merge em `main`, deploy em produção, criar serviço pago, criar contas ou tocar em segredos de produção. Humano assina autenticação, moderação, dados pessoais, deploy e gasto.
4. **Segredos** só em `.dev.vars` (local) e `wrangler secret` (remoto). Nunca no repositório, nos logs ou nos testes.
5. **Fronteiras**: `pages`/`actions` → `modules/*/index.ts` → `*.repo.ts` → `lib/db`. Componentes, layouts e ilhas não importam módulos nem banco. Escritas só por Astro Actions.
6. **Dados**: IDs `crypto.randomUUID()`, tempo em ms UTC, cursor `(created_at, id)`, escrita multi-statement só em `db.batch` dentro de uma função de repositório, idempotência por chave única. Sem contagens completas por visita.
7. **Segurança**: nada de `innerHTML`/`set:html`; toda entrada validada com Zod; sessão só por cookie assinado; conta suspensa bloqueada em toda escrita; `dev-login` e `/dev/mailbox` só fora de produção, verificados em runtime.
8. **Acessibilidade e identidade**: texto mínimo 12 px (0.75rem), alvos 44 px, contraste 4,5:1 via tokens; cores e fontes só por `var(--…)` de `design/tokens.json`. Nenhum escudo do clube ou de adversário; adversário em texto. Estados vazios honestos: nenhum número inventado.
9. **Conteúdo**: copy na voz de `docs/02-experiencia-editorial.md` (tabela de tom). Nada de conteúdo editorial gerado por IA; curadoria e moderação são humanas.
10. **Não fazer na v1**: R2, Queues, Cron, KV, agregação automática, fórum Geral, React, WebSockets, anúncios, painel editorial completo.

## Verificação antes de abrir PR

`npm run check && npm test` verdes localmente; descrição do PR com "como testar" e "o que fica bloqueado por conta externa"; revisão do segundo agente (`/code-review` e `/security-review`) antes de pedir a aprovação humana.

# Meu Vascão — guia para agentes

Portal independente de torcedores do Vasco: dia de jogo, resenha por partida e links curados. Astro 7 SSR + TypeScript em Cloudflare Workers, D1 via Drizzle, CSS com tokens. Plano aprovado da v1 em `docs/06-revisao-personas.md` (consolidação e adendo). Comandos, versões e fluxo local estão em `CONTRIBUTING.md`; este arquivo tem só o que é específico de agente.

## Regras de trabalho

1. **Uma fatia por PR**, branch `fatia/Fxx-nome`. Os testes da fatia entram em commit separado antes do código e começam falhando.
2. **Guardrails são intocáveis**: não afrouxe gates de CI; `eslint-disable`/`stylelint-disable` só com motivo escrito na própria linha e citado no PR.
3. **Autonomia**: pode abrir PR, rodar CI e publicar em preview. **Não pode** fazer merge em `main`, deploy em produção, criar serviço pago, criar contas ou tocar em segredos de produção. Humano assina autenticação, moderação, dados pessoais, deploy e gasto.
4. **Segredos** só em `.dev.vars` (local) e `wrangler secret` (remoto). Nunca no repositório, nos logs ou nos testes.
5. **Fronteiras**: `pages`/`actions` → `modules/*/index.ts` → `*.repo.ts` → `lib/db`. Componentes, layouts e ilhas não importam módulos nem banco. Escritas só por Astro Actions. Ambiente só por `getEnv()` de `@/lib/env` (`cloudflare:workers`); `locals.runtime` está depreciado no adaptador 14.
6. **Dados**: IDs `crypto.randomUUID()`, tempo em ms UTC, cursor `(created_at, id)`, escrita multi-statement só em `db.batch` dentro de uma função de repositório, idempotência por chave única. Sem contagens completas por visita. Nunca edite migração aplicada.
7. **Segurança**: nada de `innerHTML`/`set:html` (ESLint bloqueia em todo `src/`); toda entrada validada com Zod; sessão só por cookie assinado; conta suspensa bloqueada em toda escrita; `dev-login` e `/dev/mailbox` só fora de produção, verificados em runtime.
8. **Acessibilidade e identidade**: texto mínimo 12 px (0.75rem), alvos 44 px, contraste 4,5:1; cores e fontes só por `var(--…)` de `design/tokens.json` (a partir da fatia F2). Exceção: assets estáticos em `public/` (favicon, símbolo) usam os hex da paleta. O uso do escudo do Vasco foi autorizado pelo fundador na evolução UX/UI de 06/09/2026; preservar cores/proporções e registrar fontes em `docs/visual-assets.md`. Adversário permanece em texto. Estados vazios honestos: nenhum número inventado.
9. **Conteúdo**: copy na voz de `docs/02-experiencia-editorial.md` (tabela de tom). Nada de conteúdo editorial gerado por IA; curadoria e moderação são humanas.
10. **Ambientes e entrega**: o build resolve o ambiente por `CLOUDFLARE_ENV` (`npm run build:preview` / `build:production`); um `wrangler deploy --env` sobre um build sem essa variável publica variáveis de desenvolvimento. Preview é automático (`deploy.yml`: versão por PR, deploy a cada merge em `main`). Produção só pelo `workflow_dispatch` com aprovação humana no Environment `production`; agentes não disparam esse workflow nem alteram sua política (travada por `tests/unit/deploy-policy.test.ts`).
11. **Não fazer na v1**: R2, Queues, Cron, KV, agregação automática, fórum Geral, React, WebSockets, anúncios, painel editorial completo.

## Verificação antes de abrir PR

`npm run check && npm test` verdes localmente; descrição do PR com "como testar" e "o que fica bloqueado por conta externa"; revisão do segundo agente (`/code-review` e `/security-review`) antes de pedir a aprovação humana.

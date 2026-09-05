# Runbook: entrega contínua e deploy

Três ambientes, um Worker por ambiente, um fluxo por evento. Tudo o que envolve conta, DNS, segredo e aprovação é do fundador; o agente prepara e verifica, mas não publica em produção.

| Ambiente    | Worker              | URL                                                                                             | Quando publica                                                                                             | Banco                         |
| ----------- | ------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------- |
| development | local               | http://localhost:4321                                                                           | `npm run dev`                                                                                              | D1 local em `.wrangler/state` |
| preview     | `meuvascao-preview` | `meuvascao-preview.<conta>.workers.dev`; por PR, `pr-<n>-meuvascao-preview.<conta>.workers.dev` | todo PR (versão com alias) e todo push em `main` (deploy)                                                  | `meuvascao-preview`           |
| production  | `meuvascao`         | https://meuvascao.com                                                                           | só manual: Actions → "Entrega contínua" → Run workflow → `confirmar = producao` → aprovação no Environment | `meuvascao-prod`              |

O workflow é `.github/workflows/deploy.yml`; os scripts auxiliares estão em `scripts/ci/`. Enquanto os segredos não existirem, os jobs de preview terminam com um aviso e não publicam nada (o PR não fica vermelho por configuração externa pendente); produção falha. Todos falham cedo e com mensagem própria quando o `database_id` ainda é placeholder ou quando o build não é do ambiente certo. O job de produção também confere pela API que o Environment `production` exige revisores; sem essa regra, não publica.

## Configuração inicial (uma vez, pelo fundador)

### 1. Cloudflare: conta e domínio

- O domínio `meuvascao.com` precisa estar como zona na Cloudflare (DNS gerenciado lá) para a rota `custom_domain` da produção funcionar. O preview não depende disso (usa `workers.dev`).
- `npx wrangler login` e depois `npx wrangler whoami` para anotar o **Account ID**.

### 2. Bancos D1

```sh
npx wrangler d1 create meuvascao-preview
npx wrangler d1 create meuvascao-prod
```

Copie cada `database_id` para o bloco correspondente em `wrangler.jsonc` (`env.preview` e `env.production`), substituindo `SUBSTITUIR_APOS_wrangler_d1_create`, e abra um PR com essa mudança. As migrações são aplicadas pelo próprio workflow antes de cada deploy (`wrangler d1 migrations apply … --remote`).

### 3. Token de API

No painel da Cloudflare: My Profile → API Tokens → Create Token → comece pelo modelo **Edit Cloudflare Workers** e ajuste:

- Account → Workers Scripts: Edit; Account → D1: Edit; Account → Account Settings: Read.
- Zone → Workers Routes: Edit e Zone → DNS: Read, limitados à zona `meuvascao.com` (para o domínio próprio da produção).
- Account Resources: só esta conta. Opcional: TTL e restrição de IP.

Guarde o token; ele só aparece uma vez.

### 4. Segredos no GitHub

Settings → Secrets and variables → Actions → New repository secret:

- `CLOUDFLARE_API_TOKEN`: o token acima.
- `CLOUDFLARE_ACCOUNT_ID`: o Account ID do `whoami`.

### 5. Environments no GitHub

Settings → Environments:

- `production`: marque **Required reviewers** e adicione você (e quem mais assina produção). O job de produção verifica essa regra pela API e recusa publicar sem ela. Opcional: restringir a branch `main` em "Deployment branches".
- `preview`: sem proteção; existe só para o histórico de deployments e a URL no PR.

### 6. Segredos do Worker (a partir da fatia F6)

Segredos de runtime não passam pelo GitHub; vão direto para a Cloudflare, por ambiente:

```sh
openssl rand -base64 48 | npx wrangler secret put SESSION_SECRET --env production
openssl rand -base64 48 | npx wrangler secret put SESSION_SECRET --env preview
```

`RESEND_API_KEY`, `TURNSTILE_SECRET_KEY` e `SENTRY_DSN` seguem o mesmo padrão quando as fatias que os usam chegarem.

## Fluxo do dia a dia

1. **PR aberto ou atualizado**: o job "Preview do PR" faz `npm run build:preview`, valida o config gerado, aplica migrações no D1 de preview e publica uma versão com alias `pr-<n>`. A URL aparece num comentário do PR (sempre o mesmo comentário, atualizado) e no Environment `preview`. A URL principal do preview não muda.
2. **Merge em `main`**: o job "Preview acompanha main" faz o deploy do Worker de preview. Quem abrir `meuvascao-preview.<conta>.workers.dev` vê `main`.
3. **Produção**: Actions → "Entrega contínua" → Run workflow → branch `main` → `confirmar` = `producao`. O job fica aguardando a aprovação do revisor do Environment. Depois: `build:production`, validação do config, migrações no D1 de produção, deploy e sonda em `https://meuvascao.com/api/health` (precisa responder `ok: true` e `env: production`).

Antes do **primeiro** deploy em produção, cumprir o checklist da fatia F12 no plano (`docs/06-revisao-personas.md`): spikes S1 a S7 medidos do Rio (latência do D1 decide D1 × Postgres), parecer jurídico sobre nome e símbolo, textos institucionais e de privacidade, operação humana definida.

## Rollback

- **Worker**: `npx wrangler rollback --env production` volta à versão anterior (ou `npx wrangler versions list --env production` e `npx wrangler versions deploy --env production` para escolher uma versão). Leva segundos.
- **Banco**: migrações não são desfeitas automaticamente. Escreva migrações compatíveis com a versão anterior do código (adicionar antes de remover). Em incidente: `npx wrangler d1 time-travel info meuvascao-prod --env production` e `npx wrangler d1 time-travel restore meuvascao-prod --env production --timestamp <ISO-8601>` (retenção do plano da Cloudflare a confirmar). Antes de uma migração arriscada: `npx wrangler d1 export meuvascao-prod --env production --remote --output backups/prod-$(date +%F).sql` (o diretório `backups/` é ignorado pelo Git; não suba dumps para o GitHub).

## Quando algo falha

| Sintoma                                    | Causa provável                                 | O que fazer                                                                        |
| ------------------------------------------ | ---------------------------------------------- | ---------------------------------------------------------------------------------- |
| "Segredos ausentes no repositório"         | Passo 4 não feito                              | Cadastrar `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID`                         |
| "database_id inválido ou placeholder"      | Passo 2 não feito                              | Criar os D1 e colar os IDs em `wrangler.jsonc`                                     |
| "targetEnvironment é development"          | Build sem `CLOUDFLARE_ENV`                     | Usar `npm run build:preview` / `build:production` (o workflow já faz)              |
| "Worker de preview ainda não existe"       | Primeiro PR antes do primeiro push em `main`   | O script faz o primeiro deploy do preview sozinho; nada a fazer                    |
| Erro de zona ou rota no deploy de produção | Domínio ainda não é zona na Cloudflare         | Migrar o DNS para a Cloudflare e repetir                                           |
| Sonda falha após deploy                    | Worker publicado com erro ou banco inacessível | Ver logs em Workers → `meuvascao` → Logs; `npx wrangler rollback --env production` |
| Job de PR não roda                         | PR vem de fork                                 | Esperado: forks não têm segredos; abra a branch no próprio repositório             |

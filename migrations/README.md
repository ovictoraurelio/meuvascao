# Migrações do banco

Arquivos `.sql` gerados pelo `drizzle-kit generate` a partir de `src/lib/db/schema.ts` e aplicados pelo `wrangler d1 migrations apply` (local, preview e produção). Nunca edite um arquivo já aplicado; crie uma nova migração. O D1 não executa "down": rollback é por restauração (ver runbook de backup).

## Numeração

`drizzle-kit generate` numera a partir de `0000`; este projeto nomeia a partir de `0001` (`0001_fundacao`, `0002_identidade`, ...), seguindo o plano. Depois de gerar uma migração nova:

1. Renomeie o arquivo gerado (`0000_algo_gerado.sql` → `000N_nome-da-fatia.sql`, `N` = próximo número da sequência).
2. Atualize o campo `"tag"` da entrada correspondente em `migrations/meta/_journal.json` para o mesmo nome (sem a extensão `.sql`).

Sem o passo 2, `drizzle-kit` continua funcionando (o wrangler nunca lê o journal do drizzle-kit, só o nome do arquivo), mas uma futura introspecção ou `drizzle-kit studio` mostraria um nome que não bate com o arquivo real.

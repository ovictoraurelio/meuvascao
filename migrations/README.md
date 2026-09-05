# Migrações do banco

Arquivos `.sql` gerados pelo `drizzle-kit generate` a partir de `src/lib/db/schema.ts` e aplicados pelo `wrangler d1 migrations apply` (local, preview e produção). Nunca edite um arquivo já aplicado; crie uma nova migração. O D1 não executa "down": rollback é por restauração (ver runbook de backup).

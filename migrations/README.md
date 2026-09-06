# Migrações do banco

Arquivos `.sql` gerados pelo `drizzle-kit generate` a partir de `src/lib/db/schema.ts` e aplicados pelo `wrangler d1 migrations apply` (local, preview e produção). Nunca edite um arquivo já aplicado; crie uma nova migração. O D1 não executa "down": rollback é por restauração (ver runbook de backup).

## Numeração

`drizzle-kit generate` numera a partir de `0000` e calcula o próximo número somando 1 ao `"idx"` da **última** entrada de `migrations/meta/_journal.json` — não ao número no nome do arquivo. Este projeto nomeia a partir de `0001` (`0001_fundacao`, `0002_identidade`, ...), seguindo o plano. Depois de gerar uma migração nova:

1. Renomeie o arquivo gerado (`000N_algo-gerado.sql` → `000N_nome-da-fatia.sql`, mesmo número, só o nome muda).
2. Atualize, na entrada correspondente em `migrations/meta/_journal.json`, **os dois campos**: `"tag"` para o mesmo nome do arquivo (sem `.sql`) e `"idx"` para bater com o número do nome (`0001_fundacao` → `"idx": 1`, `0002_identidade` → `"idx": 2`, ...).

Pular o `"idx"` é o erro fácil de cometer: o arquivo fica com o nome certo, mas a **próxima** geração calcula de novo a partir do `idx` desatualizado e produz um número que já existe — por exemplo, se `"idx"` ficar em `0` depois de nomear o arquivo `0001_fundacao.sql`, a próxima `drizzle-kit generate` volta a gerar `0001_algo-novo.sql`, colidindo com o que já está commitado. O wrangler nunca lê esse journal (só o nome do arquivo), então a aplicação das migrações não quebra na hora — mas duas migrações com o mesmo prefixo teriam ordem de aplicação decidida por ordenação alfabética de nome, não pela ordem real de dependência.

# ADR-002 — Camada de dados: Drizzle sobre D1, com regras de portabilidade

**Status:** Aceito para a v1; revisão condicionada ao spike S1. **Data:** 06/09/2026. **Responsável pela decisão final:** fundador.

## Contexto

A v1 ("Fundação + Dia de Vasco") precisa de um esquema para jogos, links curados e cadastro de contato (fatia F3), com conta/sessão, comentários e moderação vindo nas fatias seguintes. O banco de produção ainda não está decidido: D1 local hoje, com o spike S1 (latência medida do Rio, antes do primeiro deploy em produção) decidindo entre continuar em D1 ou migrar para Postgres em São Paulo via Hyperdrive. Qualquer decisão de camada de dados tomada agora precisa sobreviver a essa troca sem reescrever as rotas.

## Decisão

**Drizzle ORM** (`drizzle-orm/d1`) sobre o binding D1, com `drizzle-kit generate` produzindo o SQL versionado em `migrations/` e `wrangler d1 migrations apply` aplicando (local, preview, produção — nunca `drizzle-kit migrate` diretamente contra D1). Acesso ao banco só por `src/modules/*/*.repo.ts`; nada fora dessa camada importa `drizzle-orm` ou fala com o binding.

Regras de portabilidade, seguidas em todo `src/lib/db/schema.ts`:

- **Timestamps** em `integer` no modo `timestamp_ms` (epoch em milissegundos) — nunca `text` ISO nem `real`.
- **Booleanos** no modo `integer("...", { mode: "boolean" })`.
- **IDs** em `text`, UUID v4 gerado na aplicação (`src/lib/ids.ts`), nunca `AUTOINCREMENT` — um ID já nasce estável, sem depender do dialeto de destino.
- **Enumerações** como `text("...", { enum: [...] })`: checadas em TypeScript, sem tipo `ENUM` nativo do banco (D1/SQLite não tem; Postgres teria, mas o esquema não depende disso). A única checagem de banco real é a regra de negócio que o próprio plano nomeia — `encerrado ⇒ placar preenchido` — como um `CHECK` explícito (`drizzle-orm/sqlite-core`'s `check()`), verificado contra D1 de verdade em `tests/workers/matches-repo.test.ts`.
- **Nenhum SQL de dialeto fora deste ponto central**: nada de `json_extract`, funções de data do SQLite ou sintaxe equivalente em código de rota — o que hoje precisa disso vive só nos repositórios, e ainda não foi necessário.

Cada tabela expõe um `Repo` fino (`createX`, `findX`) devolvendo o tipo inferido do Drizzle (`typeof tabela.$inferSelect`). Deduplicação por normalização acontece **antes** do INSERT (`url-normalize.ts`, `lead-value-normalize.ts`) e a violação de `UNIQUE` vira um erro de domínio (`DuplicateLinkError`, `DuplicateLeadError`) — o chamador nunca vê o erro cru do driver.

## O que a portabilidade custa hoje

Nada de visível: os tipos TypeScript, as consultas e os testes seriam idênticos com `drizzle-orm/node-postgres` no lugar de `drizzle-orm/d1`. O que troca, se o S1 reprovar D1:

1. `src/lib/db/schema.ts` migra de `sqlite-core` para `pg-core` (`text`→`text`, `integer(timestamp_ms)`→`timestamp`, o `CHECK` já é sintaxe padrão de SQL).
2. `src/lib/db/client.ts` troca `drizzle(d1, ...)` por `drizzle(pool, ...)` atrás de um binding Hyperdrive.
3. `migrations/` é regerado do zero (histórico de D1 não migra para Postgres).
4. Repositórios e o resto da aplicação não mudam uma linha — é exatamente o que este ADR existe para garantir.

Isso é uma estimativa, não uma prova: só o spike S1 mede se a troca é necessária, e só a implementação real do Hyperdrive confirma o custo de 3.

## Alternativas consideradas

| Opção                                                           | Por que não                                                                                                                                    |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| SQL puro (sem ORM)                                              | Sem verificação de tipos entre esquema e consulta; qualquer refatoração de coluna vira um erro em runtime, não em `astro check`.               |
| Kysely                                                          | Tipos precisam ser mantidos à mão (ou gerados por uma introspecção separada) em vez de derivados do esquema; sem gerador de migração embutido. |
| Prisma                                                          | Motor Rust separado do runtime de Workers e um cliente mais pesado; não compensa para cinco tabelas na v1.                                     |
| `drizzle-kit migrate` (aplicar direto, sem passar por wrangler) | Não fala com o binding D1 do Workers; o próprio Drizzle recomenda `wrangler d1 migrations apply` para D1.                                      |

## Consequências e riscos

- **Enum só em TypeScript**: um valor fora da lista só é barrado na aplicação (Zod, quando as actions chegarem em F4+), não no banco — aceitável porque nenhuma escrita hoje vem de fora da aplicação; se isso mudar, um `CHECK` por coluna fecha a lacuna a um custo baixo.
- **Sem transação interativa multi-statement no D1**: onde uma fatia futura precisar de mais de uma escrita atômica (ex.: comentar + atualizar contador em F8), a regra é `db.batch(...)` dentro de uma única função de repositório, nunca duas chamadas separadas do chamador.
- **Timestamps como `Date` na aplicação, `integer` no banco**: `new Date()` em cada escrita; nenhuma rota deve formatar data manualmente antes de gravar — isso é trabalho de `src/lib/time/brt.ts` só na leitura/exibição.

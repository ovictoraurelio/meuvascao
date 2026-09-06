# Backup e ensaio de restore local

Os scripts desta fatia trabalham exclusivamente com D1 **local**. O export lê o estado existente; o restore importa num diretório temporário novo, compara uma reexportação integral e remove esse diretório mesmo em falha. Não restaura sobre o banco de desenvolvimento nem aceita opções de ambiente remoto.

Pré-requisitos: dependências instaladas (`npm ci`), Node compatível com o projeto e `sqlite3` no PATH. Feche o servidor local e interrompa escritas durante a cópia. No worktree desejado, prepare um banco com `npm run db:reset` (dados de teste) ou use o banco local já existente.

```sh
sh scripts/backup-export.sh /tmp/meuvascao-local.sql
sh scripts/restore-rehearsal.sh /tmp/meuvascao-local.sql
```

O export também aceita um segundo argumento com o caminho do estado local (diretório que contém `v3/d1`). O arquivo de destino não pode existir. A permissão é `0600`; mantenha backups fora do repositório e de diretórios compartilhados. Exports contêm todos os dados, inclusive dados pessoais quando presentes. Para retenção real, use armazenamento protegido e defina prazo de descarte.

O ensaio aprova somente quando a importação D1 funciona, `integrity_check` retorna `ok`, `foreign_key_check` não retorna violações e o SQL reexportado é idêntico ao backup. O arquivo deve ser gerado pelo export deste runbook e pela mesma versão do Wrangler: SQL editado ou de outras versões pode ser rejeitado. A inspeção de integridade usa SQLite em modo somente leitura, pois D1 não autoriza `PRAGMA integrity_check` por sua API. As saídas de Wrangler são omitidas para não registrar conteúdo do banco ou segredos.

Falhas retornam código 1. Corrija a causa e repita com um arquivo novo; nunca substitua o backup anterior antes de validar a cópia. Ausência de `sqlite3`, arquivo inválido, referências quebradas ou divergência do dump reprovam o ensaio.

## Evidência local

Em 06/09/2026, ensaio em worktree isolado com migração `0001_fundacao.sql` e seed `e2e`: export local, importação em D1 novo, integridade SQLite, referências e reexportação idêntica aprovados. Nenhuma operação remota executada. O estado de origem e o backup permanecem; apenas o estado temporário do ensaio é removido.

RPO de 24 horas e RTO de 4 horas são **metas ainda não validadas remotamente**. Este ensaio não verifica agendamento, retenção, Time Travel, acesso ao provedor ou recuperação de produção. O responsável deve executar o spike S6 em ambiente remoto autorizado antes de declarar essas metas atendidas.

## Sonda de aplicação

```sh
sh scripts/ci/smoke.sh http://localhost:4321 development
```

A sonda exige `/api/health` com `ok: true`, `db: "ok"` e ambiente correto, além de HTTP 200 em `/` e `/jogos`. Em preview e produção exige também HTTP 404 em `GET /dev/mailbox` e `POST /auth/dev-login`, pois as rotas de desenvolvimento só ficam disponíveis em development. Redirecionamentos não contam como sucesso. Tenta até dez vezes, com intervalo de seis segundos, sem imprimir corpos de resposta.

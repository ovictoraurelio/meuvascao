# Operação editorial

A equipe entra com link mágico e um papel previamente atribuído pelo responsável da operação. `editor` e `admin` podem administrar jogos e links; apenas `admin` exporta contatos. Contas suspensas e sessões revogadas são recusadas no servidor. O login de desenvolvimento nunca é uma forma de acesso a ambientes públicos.

Em `/admin/jogos`, escolha **Novo jogo**. Informe adversário, competição, fonte e URL HTTPS. O horário é sempre o de Brasília; deixe vazio com estado **indefinido** quando ainda não houver confirmação. Para adiar, editar ou registrar resultado, abra o jogo, ajuste o estado e salve. O estado **encerrado** exige os dois placares. A página pública conserva o endereço original após qualquer edição.

Em `/admin/links`, cadastre o endereço HTTPS, título, fonte e rótulo editorial. Escolha a seção e a posição. **Retirar** deixa o item fora das consultas públicas; caches anônimos podem levar até 60 segundos para refletir a retirada. Para corrigir ou republicar, use **Editar** e **Publicar**. Curadoria e texto são responsabilidade humana.

Em `/admin/leads`, **Gerar CSV** registra a exportação e oferece **Baixar CSV**. O arquivo contém apenas contatos ativos e protege células que poderiam executar fórmulas em planilhas. O histórico registra quantidade e responsável, sem copiar contatos para a auditoria. Trate o arquivo conforme os consentimentos recebidos e remova cópias quando não forem necessárias.

Toda gravação editorial e sua auditoria usam o mesmo batch no D1. Em falha, confira a mensagem antes de repetir. Não há publicação automática de conteúdo nem criação de contas administrativas pelo formulário.

Validação: `npm run check && npm test`; testes focados em `tests/workers/admin.test.ts`, `tests/unit/admin-csv.test.ts` e `tests/e2e/f07-admin-curadoria.spec.ts`.

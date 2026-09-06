# Moderação da resenha

A fila em `/admin/moderacao` é exclusiva de contas ativas com papel moderador ou admin e sessão válida. Torcedor, editor, sessão revogada e conta suspensa recebem 403 também nas Actions chamadas diretamente. As páginas usam `private, no-store` e `noindex`.

A moderação é humana. Leia o comentário e o contexto antes de decidir. Registre um motivo claro, entre 3 e 1.000 caracteres, sem copiar e-mails, telefones ou outros dados pessoais. Todas as decisões gravam alteração e auditoria no mesmo batch; se a auditoria falhar, a mudança é revertida.

## Rotina da fila

1. Abra “Denúncias abertas”, ordenada da mais antiga para a mais recente.
2. Se houver violação, informe o motivo e escolha “Ocultar comentário”. A linha permanece para preservar respostas e referências, mas o público vê um marcador. Todas as denúncias abertas desse comentário são encerradas na mesma operação.
3. Se o conteúdo estiver dentro das regras, informe o motivo e use “Encerrar sem ocultar”.
4. Quando a conduta exigir, suspenda a conta com motivo. O perfil mostra a suspensão e a justificativa; a leitura continua disponível. Em “Contas suspensas”, registre o motivo da revisão para reativar.

Moderadores não podem alterar contas de moderadores ou administradores. Ninguém altera a própria suspensão. Casos envolvendo esses papéis exigem outro administrador. Contas excluídas não podem ser reativadas por este painel.

Cada lista tem limite de 100 itens. Denúncias resolvidas deixam a fila, permitindo avançar para as próximas. O painel não é um histórico completo: auditorias ficam no banco e devem ser consultadas pelo responsável autorizado, sem exportação pública.

## Incidentes e controle de conversa

Por resenha, configure um intervalo de 0 a 3.600 segundos entre comentários. Zero desliga o modo lento. Fechar a resenha pausa novas publicações; reabrir permite retomá-las. Para incidentes gerais, “Pausar publicações” ativa `settings.escrita_fechada` com valor JSON `true`. “Liberar publicações” grava `false`.

Esses controles não abrem a comunidade se a flag de disponibilidade pública estiver fechada. Tampouco substituem sessão válida e conta ativa. Depois de uma decisão, confira a página pública e a mensagem de confirmação. Em erro, a interface informa falha; não suponha que a operação foi aplicada.

O corpo ocultado permanece no banco para análise interna e não é copiado para o registro de auditoria. Definição de retenção e descarte depende da política aprovada. A interface não oferece republicação automática do conteúdo ocultado.

## Pendências para operação pública

O responsável ainda deve nomear moderadores e substitutos, aprovar as regras e definir um canal real para contestação/contato. Nenhum endereço de e-mail foi inventado no produto: o perfil aponta para as regras enquanto o canal não está definido. Esse canal pendente deve ser resolvido antes de abrir a comunidade.

## Verificação

`tests/workers/moderation.test.ts` exerce autorização, motivo obrigatório, resolução, suspensão/reativação, modo lento, fechamento, controle geral, ordenação da fila e rollback quando a auditoria falha. `tests/e2e/f09-moderacao.spec.ts` verifica 403 direto, privacidade, acessibilidade e denúncia → ocultação → marcador público, integrado à F8 em ambiente local.

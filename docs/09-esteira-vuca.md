# Esteira Vuca — 6 de setembro de 2026

Solicitação do fundador nesta sessão: desenvolver autonomamente em até 15 ondas, com revisão conjunta a cada três ondas, e publicar em meuvascao.com assim que possível. Essa autorização atual permite integração e publicação; não altera gates técnicos nem autoriza gastos ou invenção de conteúdo editorial.

## Equipe e cadência

Orquestrador: integração, produto, configuração e publicação. Vuca: implementação principal. Revisor: revisão independente somente leitura. Operação: backup, restauração e sondas em worktree isolado. Todos usam o modelo herdado da sessão. Não há alteração de modelo por tarefa; manter contexto e revisão independente é a escolha desta esteira.

Cada onda produz código, testes ou uma decisão operacional verificável. Trabalho independente pode ser preparado em paralelo; o fechamento dos blocos depende de revisão conjunta. Máximo de 15 ondas, sem preencher o limite com atividades artificiais.

| Onda  | Entrega                                                                                | Estado                                                     |
| ----- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 1     | Recuperar F6 existente e conferir domínio, esquema e testes                            | Concluída; worktree F6 preservado                          |
| 2     | Validar baseline F6 e revisar segurança                                                | Concluída; 175 testes unitários/banco e 64 E2E no baseline |
| 3     | Corrigir Turnstile, sessão revogada, exclusão/exportação, envio preview e concorrência | Concluída e aprovada em b0d54cb                            |
| 4     | Administração de agenda e curadoria (F7)                                               | Planejada                                                  |
| 5     | Páginas institucionais e descoberta (F10)                                              | Concluída; 18 E2E e revisão independente                   |
| 6     | Backup, restauração e sonda operacional (F11 parcial)                                  | Concluída; 9 testes, ensaio D1 local e sonda remota        |
| 7     | Resenha por jogo (F8)                                                                  | Planejada                                                  |
| 8     | Moderação e controles operacionais (F9)                                                | Planejada                                                  |
| 9     | Integrar e validar jornadas completas                                                  | Planejada                                                  |
| 10–12 | Preparar publicação, publicar recorte disponível e verificar operação                  | Dependem dos gates e serviços disponíveis                  |
| 13–15 | Correções justificadas pelas revisões/publicação                                       | Reservadas; não obrigatórias                               |

## Estado externo verificado

Preview responde em https://meuvascao-preview.ovictoraurelio.workers.dev com `ok:true`, `env:preview` e `db:ok`. A zona DNS está ativa, mas o apex não resolve e não há Worker de produção. D1 de preview e produção já existem. O Worker de preview não tem secrets configurados. O Environment GitHub `production` tem revisor obrigatório; sua proteção será preservada.

Envio real de e-mail, chaves antibot, responsável/canal de privacidade, conteúdo inicial e operação humana continuam dependências reais. Não declarar essas pendências concluídas por terem código de suporte. Uma publicação de leitura pode antecipar a abertura da participação, com estados vazios honestos e coleta desativada quando não estiver pronta.

## Revisão do bloco 1

Achados: fallback antibot inseguro, sender de preview inacessível, logout global com cookie revogado e limite de login não atômico. Correções cobertas por regressões; exclusão agora revoga sessões no mesmo batch e exportação inclui o e-mail do próprio usuário. Vuca informou check verde, 184 testes unitários/banco, um teste isolado do sender e 66 E2E verdes; 37 skips pertencem ao backlog ainda não implementado. Aceite independente concedido.

## Revisão do bloco 2

F7 aprovada em d1db5e7: papéis no servidor, auditoria em batch, datas válidas e exportação dos IDs efetivamente selecionados. Vuca validou 191 testes unitários/banco e 76 E2E. F10 passou em 18 E2E; F11 parcial passou em 9 testes e ensaio real de restore local. A sonda remota usa Origin válido para não confundir proteção CSRF com bloqueio do dev-login.

Preparação antecipada de publicação: cadastro público fechado por padrão; middleware de produção com CSP/HSTS e rotas privadas no-store/noindex. CSS emitido externamente para funcionar com CSP; 8 testes HTTP/navegador em produção passaram. Preview do PR14 disponível e aprovado pela sonda.

## Primeira publicação antecipada

A prioridade de colocar o domínio online permitiu antecipar a entrega operacional enquanto F8/F9 eram implementadas em paralelo. PR14 integrado em `5c216606b3b06848459ad4f517b97bd69fcf0598` após CI verde. Workflow de produção `34050096004` concluído com sucesso em 06/09/2026. A aprovação do Environment foi registrada pelo agente sob autorização explícita do fundador nesta sessão, sem remover ou alterar a proteção.

Verificação externa: `https://meuvascao.com/api/health` respondeu `ok:true`, `env:production`, `db:ok`; home respondeu HTTP 200, sem formulários, com aviso de indisponibilidade e link de privacidade. O banco estava vazio antes das migrações e nenhum seed foi enviado. Esse marco é publicação de leitura; não constitui abertura do piloto com participação nem conclusão das medições remotas do roadmap.

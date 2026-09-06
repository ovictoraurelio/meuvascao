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
| 4     | Administração de agenda e curadoria (F7)                                               | Concluída; integrada e revisada                            |
| 5     | Páginas institucionais e descoberta (F10)                                              | Concluída; 18 E2E e revisão independente                   |
| 6     | Backup, restauração e sonda operacional (F11 parcial)                                  | Concluída; 9 testes, ensaio D1 local e sonda remota        |
| 7     | Resenha por jogo (F8)                                                                  | Concluída; integrada e revisada                            |
| 8     | Moderação e controles operacionais (F9)                                                | Concluída; integrada e revisada                            |
| 9     | Integrar e validar jornadas completas                                                  | Concluída; integrada e revisada                            |
| 10–12 | Publicação antecipada e transversal às ondas 4–9                                       | Sem ondas adicionais artificiais                           |
| 13–15 | Correções justificadas pelas revisões/publicação                                       | Reservadas; não obrigatórias                               |

## Estado externo verificado

A primeira publicação colocou https://meuvascao.com no ar. Preview e produção respondem com banco saudável. A zona DNS está ativa, ambos os Workers e bancos D1 existem. Serviços de participação ainda precisam de configuração. O Environment GitHub `production` mantém revisor obrigatório; sua proteção foi preservada.

Envio real de e-mail, chaves antibot, responsável/canal de privacidade, conteúdo inicial e operação humana continuam dependências reais. Não declarar essas pendências concluídas por terem código de suporte. Uma publicação de leitura pode antecipar a abertura da participação, com estados vazios honestos e coleta desativada quando não estiver pronta.

## Revisão do bloco 1

Achados: fallback antibot inseguro, sender de preview inacessível, logout global com cookie revogado e limite de login não atômico. Correções cobertas por regressões; exclusão agora revoga sessões no mesmo batch e exportação inclui o e-mail do próprio usuário. Vuca informou check verde, 184 testes unitários/banco, um teste isolado do sender e 66 E2E verdes; 37 skips pertencem ao backlog ainda não implementado. Aceite independente concedido.

## Revisão do bloco 2

F7 aprovada em d1db5e7: papéis no servidor, auditoria em batch, datas válidas e exportação dos IDs efetivamente selecionados. Vuca validou 191 testes unitários/banco e 76 E2E. F10 passou em 18 E2E; F11 parcial passou em 9 testes e ensaio real de restore local. A sonda remota usa Origin válido para não confundir proteção CSRF com bloqueio do dev-login.

Preparação antecipada de publicação: cadastro público fechado por padrão; middleware de produção com CSP/HSTS e rotas privadas no-store/noindex. CSS emitido externamente para funcionar com CSP; 8 testes HTTP/navegador em produção passaram. Preview do PR14 disponível e aprovado pela sonda.

## Primeira publicação antecipada

A prioridade de colocar o domínio online permitiu antecipar a entrega operacional enquanto F8/F9 eram implementadas em paralelo. PR14 integrado em `5c216606b3b06848459ad4f517b97bd69fcf0598` após CI verde. Workflow de produção `34050096004` concluído com sucesso em 06/09/2026. A aprovação do Environment foi registrada pelo agente sob autorização explícita do fundador nesta sessão, sem remover ou alterar a proteção.

Verificação externa: `https://meuvascao.com/api/health` respondeu `ok:true`, `env:production`, `db:ok`; home respondeu HTTP 200, sem formulários, com aviso de indisponibilidade e link de privacidade. O banco estava vazio antes das migrações e nenhum seed foi enviado. Esse marco é publicação de leitura; não constitui abertura do piloto com participação nem conclusão das medições remotas do roadmap.

## Revisão do bloco 3

F8, F9 e integração aprovadas por revisão independente no HEAD `0cc0dd2`: sessão e papéis ativos, comentários idempotentes, respostas limitadas a um nível, controles de publicação, moderação auditada, DTO público sem texto oculto e exportação privada apenas da atividade própria. A home destaca conversas reais e a navegação da equipe encaminha moderadores à fila.

Check de tipos, lint, formato e tokens verde; 235 testes unitários/D1 e 9 gates de ambiente de produção passaram. Os gates de produção passaram a integrar o CI, cobrindo recusa das Actions de cadastro e comunidade e CSP em seis rotas. A suíte completa de navegador passou em execução serial local: 114 aprovados e 12 exclusões por ambiente/viewport. O CI do PR15 também passou com a configuração paralela padrão, incluindo gates de produção e dry-run do Worker, no commit `2735385`. Uma intermitência anterior do proxy local do Wrangler (`Network connection lost.`) não se repetiu na execução serial; a origem exata da desconexão não foi comprovada. Nenhuma assertiva foi removida e a concorrência das operações continua coberta pelos testes D1. Preview do PR15 passou na sonda de saúde, banco e rotas públicas.

As nove ondas abrangem o recorte implementável nesta sessão. As ondas 10–15 não serão preenchidas artificialmente. Permanecem pendentes serviços reais de e-mail/antibot/sessão, responsáveis por privacidade e moderação, conteúdo editorial, observabilidade ampliada, medições remotas e piloto acompanhado. Nenhuma dessas dependências foi declarada concluída.

# Resenha por partida

A comunidade fica fechada por padrão em preview e produção. Somente o responsável pela operação deve habilitar `COMMUNITY_ENABLED=true` depois de validar equipe de moderação, políticas e acesso por e-mail. A flag é verificada no servidor nas três Actions, inclusive em requisições diretas. Desenvolvimento local abre por padrão para testes.

Comentários e curtidas exigem conta ativa, apelido definido, sessão não revogada, partida existente, thread aberta e ausência do bloqueio global `settings.escrita_fechada=true`. O modo lento limita cada autor dentro da mesma partida; a resposta explica quantos segundos aguardar. Publicação e contadores ficam no mesmo batch, e chaves únicas impedem duplicação. Há apenas um nível de respostas.

Denúncias exigem conta ativa, sessão válida e comentário visível de partida não excluída. Continuam disponíveis durante fechamento da thread ou pausa global, para preservar o canal com a moderação. A flag de comunidade continua obrigatória. Denúncias não aparecem publicamente.

Neste recorte, todo comentário valida Turnstile, incluindo o primeiro de cada sessão. É uma proteção deliberadamente mais frequente que a proposta inicial; limitar ao primeiro exige um marcador de verificação por sessão em migração futura. Não há bypass público de desafio.

O texto tem até 2.000 caracteres, escapa como texto comum e usa um rascunho local por partida. O rascunho é removido apenas após confirmação de publicação. Ao pedir login, a URL volta à âncora da conversa. Navegadores que bloqueiam armazenamento continuam permitindo o envio, porém sem persistência local do rascunho.

A API entrega no máximo 30 comentários em ordem cronológica, com cursor composto por data e ID. Texto oculto e texto de conta excluída são substituídos por marcadores antes de gerar HTML ou JSON. O navegador verifica novidades a cada 45 segundos somente com a aba visível e na última página carregada. Novas mensagens não deslocam a leitura; a pessoa decide quando abri-las.

Verificação: `npm run check && npm test`. A suíte D1 cobre concorrência de 20 autores, idempotência, curtidas únicas, respostas, cursor, suspensão, modo lento, bloqueio global e exclusão de partida. E2E cobre texto hostil, teclado, denúncia, rascunho, sessão e acessibilidade.

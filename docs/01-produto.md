# Visão de produto e MVP

## Tese

O Meu Vascão é o ponto de encontro digital da torcida: em uma visita curta, o torcedor entende o que está acontecendo, encontra o próximo jogo e participa da conversa.

A hipótese de problema é a fragmentação entre notícias, redes sociais, agenda esportiva e grupos privados. O produto reúne contexto e participação com navegação rápida. A vantagem pretendida está na combinação de utilidade, identidade e continuidade da comunidade; deve ser validada com usuários.

**Promessa:** abrir, se atualizar e chegar à resenha em poucos toques.

## Público e necessidades

| Perfil                   | Necessidade principal                  | História de uso                                                                                             |
| ------------------------ | -------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Torcedor com pouco tempo | Entender as novidades rapidamente      | Como torcedor, quero um resumo do dia para acompanhar o clube entre compromissos.                           |
| Torcedor de dia de jogo  | Informações práticas e companhia       | Como torcedor, quero horário, contexto e conversa da partida no mesmo lugar para participar antes e depois. |
| Participante frequente   | Ter voz e reconhecer outros torcedores | Como participante, quero publicar e responder discussões para construir relações na comunidade.             |
| Editor/moderador         | Manter conteúdo e ambiente confiáveis  | Como responsável, quero publicar, corrigir e moderar sem depender de mudanças no código.                    |

## O produto acompanha três momentos

| Momento   | O que ganha destaque                                                    | Convite à participação                           |
| --------- | ----------------------------------------------------------------------- | ------------------------------------------------ |
| Dia a dia | Resumo do dia, notícias e próximo jogo                                  | Comentar uma notícia ou responder à pauta do dia |
| Pré-jogo  | Horário, adversário, competição, contexto e escalação quando confirmada | Entrar na discussão da partida                   |
| Pós-jogo  | Resultado confirmado, análise e repercussão                             | Debater; avaliação de jogadores em fase seguinte |

Durante a partida, manter a mesma página e discussão. O MVP não promete cobertura lance a lance nem placar em tempo real. Se os dados forem manuais, informar claramente a última atualização.

## Objetivos e métricas

Metas experimentais para um piloto de 30 dias, com aproximadamente 50–100 convidados. Não são benchmarks comprovados. Instrumentar eventos sem conteúdo dos comentários ou e-mails.

| Objetivo                   | Definição e medição                                                                                      | Hipótese de sucesso                   |
| -------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Encontrar o essencial      | Teste observado: localizar próximo jogo partindo da home                                                 | 8 de 10 torcedores em até 10 segundos |
| Ativar participação        | Cadastrados que comentam, reagem ou criam tópico em até 7 dias / novos cadastrados com janela completa   | Pelo menos 25%                        |
| Criar hábito               | Participantes que voltam em um dia distinto entre D7 e D13 / participantes da coorte com janela completa | Pelo menos 20%                        |
| Formar conversa recorrente | Contas distintas com comentário, tópico ou reação válidos nos últimos 7 dias                             | 30 por semana ao fim do piloto        |
| Sustentar a operação       | Denúncias revisadas em até 24 horas / denúncias recebidas                                                | 90%, com responsável escalado         |

Métrica principal: **torcedores que participam por semana**. Acompanhar também leitura recorrente, abertura da página de jogo, cliques na fonte e falhas de publicação. Excluir bots, equipe e contas de teste das métricas de crescimento.

## MVP — prioridade P0

| Capacidade             | Requisito e critérios de aceite                                                                                                                                                                                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Home contextual        | Mostrar próximo jogo ou resultado recente, principais notícias e discussão em destaque. Com dados ausentes, mostrar estado explícito sem informações inventadas.                                                                                                                           |
| Notícias               | Lista paginada e página própria; título, autor, datas, tipo editorial e fonte quando aplicável. Textos próprios e links externos têm apresentação distinta. Leitura não exige conta.                                                                                                       |
| Agregação automatizada | Importar apenas fontes aprovadas e campos permitidos; deduplicar pela identidade do item/URL canônica; guardar origem e horários; repetição do job não duplica item. Falha de uma fonte não impede as demais. Ter pausa por fonte, fila de exceções e link direto para a matéria original. |
| Jogos                  | Agenda e resultados básicos; página permanente por partida com competição, horário, adversário, local quando confirmado, fonte e última atualização. Adiamento e horário indefinido são estados próprios.                                                                                  |
| Conta                  | Login por um provedor OAuth consolidado, inicialmente Google, com biblioteca mantida e compatibilidade validada. Apelido público; e-mail privado; sair da conta e solicitar exclusão. Preservar rascunho ao pedir login.                                                                   |
| Comentários e reações  | Conta necessária para escrever; resposta com um nível de encadeamento, paginação por cursor e uma reação ativa por usuário/alvo. Reenvio de requisição não duplica publicação. Falha mantém rascunho e oferece tentativa novamente.                                                        |
| Fórum enxuto           | Duas categorias iniciais: Geral e Jogos. Criar tópico, responder, fixar, fechar e denunciar. Uma discussão oficial por partida; a página do jogo e o fórum exibem a mesma conversa.                                                                                                        |
| Moderação              | Denunciar conteúdo, ocultar com motivo, suspender conta e registrar ação. Conta suspensa não publica mesmo chamando a API diretamente. Publicação tem limites por conta/IP e proteção contra automação.                                                                                    |
| Administração          | Editor cria rascunho, visualiza, publica, corrige e retira notícia; atualiza jogos e destaca tópicos. Permissões verificadas no servidor, com registro de alterações.                                                                                                                      |
| Descoberta e qualidade | URLs estáveis, HTML legível por buscadores, sitemap, metadados de compartilhamento, navegação por teclado, texto alternativo e layout sem rolagem horizontal em 360 px.                                                                                                                    |

P0 exige equipe mínima para edição e moderação. Caso isso não exista, fazer piloto fechado até a operação estar coberta.

## Evolução

**P1 — após validar o núcleo:** enquetes, avaliação de jogadores após partidas, busca, perfis com histórico, elenco e tabela com dados confiáveis, instalação como PWA e notificações opt-in. Priorizar conforme uso observado; não entregar tudo em um pacote.

**P2 — expansão:** palpite sem dinheiro, quizzes de história, conquistas ligadas a contribuições úteis, cobertura da base e outras modalidades, colunistas convidados, parceiros e benefícios.

**Fora da primeira versão:** aplicativo nativo; streaming de partidas; chat com WebSockets; marketplace; apostas; feed algorítmico personalizado; geração automática de matérias completas. A agregação automática de links e metadados autorizados faz parte do MVP; conteúdo editorial gerado por IA não é necessário para esse fluxo.

## Distribuição e sustentabilidade

Convidar um grupo fundador pequeno, abrir pautas antes de cada partida e publicar repercussão depois. Compartilhamento pelo WhatsApp usa cards e links claros, com ação iniciada pelo usuário. Buscar colaborações com criadores e comunidades quando o produto já tiver experiência demonstrável; nenhum contato está autorizado nesta etapa.

Medir quais conteúdos geram retorno e conversa. SEO pode trazer leitores, mas depende de conteúdo consistente e tempo; agregação de links sozinha não garante aquisição orgânica. Anúncios são a hipótese principal de receita informada pelo fundador. Começar com poucos espaços reservados e considerar publicidade direta de parceiros e patrocínio identificado de quadros. Manter leitura, agenda e conversa principal acessíveis; evitar anúncios que interrompam a navegação ou desloquem o layout. Elegibilidade para redes de anúncios precisa ser verificada antes de escolher a rede; não pressupor aprovação de um agregador.

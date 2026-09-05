# Identidade, experiência e operação editorial

## Direção de marca

**Nome:** Meu Vascão. **Assinatura proposta:** O Vasco no peito. A torcida aqui.

Personalidade: intensa, próxima, bem-humorada e orgulhosa. Comunicação de arquibancada com informação clara. O vínculo com a torcida aparece nas pautas, nas imagens e nas palavras; a leitura precisa continuar confortável.

Preto e branco como base, vermelho nos destaques e ações principais. Faixa diagonal como recurso de composição, usada pontualmente. Tipografia de título forte e texto de leitura simples. Fotografias da torcida e do estádio com origem e permissão registradas. Criar marca própria e explicar a natureza independente do projeto; o domínio não é autorização de uso de marcas ou imagens de terceiros.

Direção inicial de cores, sujeita a teste: preto `#101010`, branco `#FAFAF7`, vermelho `#C51D2B`, cinza `#B8B8B8`. Validar contraste em cada combinação de texto, botão e estado. Priorizar superfícies claras nos textos longos e áreas escuras no destaque de jogo. Não depender da cor para indicar placar, erro ou seleção.

## Tom de voz

| Situação      | Exemplo de comunicação                                                     |
| ------------- | -------------------------------------------------------------------------- |
| Abertura      | “O que tá rolando no Vascão”                                               |
| Pré-jogo      | “Hoje é dia de Vasco. Chega pra resenha.”                                  |
| Convite       | “Qual é a tua leitura do jogo?”                                            |
| Vitória       | “Pode comemorar. Agora conta: quem decidiu?”                               |
| Derrota       | “Hoje doeu. O que precisa mudar?”                                          |
| Falha técnica | “Não conseguimos publicar. Seu texto está salvo aqui para tentar de novo.” |
| Moderação     | “Pode discordar e cobrar. Ataques pessoais não entram na conversa.”        |

Evitar promessa de contratação sem confirmação, urgência artificial e títulos que escondam a informação. Separar notícia, opinião, rumor e publicidade. Rivalidade esportiva cabe; ameaças, racismo, discriminação e exposição de dados pessoais não cabem.

## Navegação no celular

Barra inferior com quatro destinos: **Início · Jogos · Resenha · Perfil**. Notícias entram pela home, com acesso “Todas as notícias” e rota própria. Busca entra quando o acervo justificar.

Na home, a ordem proposta é: marca e contexto; cartão da partida; resumo “Em 1 minuto”; notícia principal; resenha em destaque; últimas notícias. Em dia de jogo, a partida e sua discussão sobem na hierarquia. Conteúdos devem ter data real e estado editorial; os exemplos deste documento não são notícias atuais.

```text
┌─────────────────────────────┐
│ MEU VASCÃO                  │
│ O Vasco no peito.           │
├─────────────────────────────┤
│ PRÓXIMO JOGO                │
│ Vasco × [adversário]        │
│ [data] · [hora] · [torneio]  │
│ [Ver jogo e entrar na resenha]│
├─────────────────────────────┤
│ EM 1 MINUTO                 │
│ 3 links do dia, com fontes  │
├─────────────────────────────┤
│ [Imagem editorial]          │
│ Manchete clara              │
│ Autor · horário · comentários│
├─────────────────────────────┤
│ A TORCIDA TÁ FALANDO        │
│ [Discussão em destaque]     │
├─────────────────────────────┤
│ Início Jogos Resenha Perfil │
└─────────────────────────────┘
```

O desenho é um wireframe conceitual, não uma proposta visual final.

## Fluxos principais

1. **Atualização rápida:** abre home → lê resumo → abre notícia → reage ou comenta. Login aparece apenas no momento de participação e retorna ao ponto de origem.
2. **Pré-jogo:** abre cartão → confere informações → entra na discussão já existente. Não criar salas separadas que dispersem a mesma conversa.
3. **Pós-jogo:** retorna à mesma URL → vê resultado e análise publicados → continua a resenha. Preservar histórico e ordem cronológica como padrão.
4. **Comunidade:** abre Resenha → escolhe tópico ou cria um → responde → pode denunciar. Começar com tópicos editoriais que convidam respostas concretas.

No cartão agregado, separar “Ler na fonte” de “Comentar no Meu Vascão”. A primeira ação vai diretamente ao veículo; a segunda abre a página local com origem, metadados permitidos e discussão. Não impor uma página intermediária para inflar visualizações. Página local sem contexto próprio ou discussão útil pode permanecer fora do índice de busca; não criar milhares de páginas vazias como estratégia de SEO.

Interações têm alvos de toque de pelo menos 44 px como meta do projeto, foco visível, rótulos claros e suporte a movimento reduzido. Nada de reprodução automática de áudio/vídeo. Comentários paginados, com botão para novas mensagens, evitando deslocar o texto durante a leitura.

## Operação editorial

Direção confirmada: agregação principalmente automatizada. Começar com 3–5 fontes cuja forma de integração e uso esteja validada. Publicar automaticamente links e metadados permitidos dessas fontes; usar descrição apenas quando autorizada. Sem permissão para imagem ou descrição, apresentar cartão com fonte, campos autorizados e link, sem extrair o texto integral. Não tratar RSS ou página pública como licença de republicação. Cada item guarda URL, veículo, data, autor quando disponível e tipo de conteúdo; imagens guardam origem e condições de uso.

Fluxo agregado: fonte aprovada → coleta → normalização → deduplicação → checagem de campos/regras → publicação automática de link ou fila de exceções. Monitorar uma amostra diária, pausar fontes com problemas e permitir retirada/correção. Não fundir diferentes reportagens como se fossem duplicatas exatas; agrupamento por assunto pode vir depois, preservando cada origem.

Conteúdo próprio segue pauta → rascunho → checagem → revisão → publicação → correção. Em equipe de uma pessoa, usar checklist explícito. Correções relevantes exibem nota e data.

Cadência inicial proposta: coleta a cada 15–30 minutos, respeitando limites por fonte, e um tópico editorial por partida. O resumo “Em 1 minuto” começa como seleção de três links recentes, sem síntese factual gerada por IA. Uma análise própria pós-jogo depende de responsável disponível. Se não houver novidade, mostrar a data do último item, sem fabricar notícia para preencher o feed.

IA pode futuramente sugerir classificação e resumos, com revisão de fidelidade, fonte rastreável e orçamento por item. Deduplicação exata do MVP é determinística. Importação respeita permissão, frequência e condições da fonte. API esportiva só será escolhida após verificar cobertura das competições do Vasco, atualização, direito de exibição e custo; começar com cadastro manual reduz essa dependência.

## Comunidade e confiança

Leitura pública; participação autenticada com apelido. Papéis separados para torcedor, editor, moderador e administrador. Manter canal de contato, regras curtas e recurso de denúncia visível. Ações de moderação têm motivo e possibilidade de contato para revisão.

No piloto, definir um responsável pela cobertura de cada partida e um substituto. Usar limites de publicação e modo lento quando necessário; poder fechar temporariamente a discussão em incidentes. Remoção não deve apagar o registro administrativo necessário para entender a decisão.

Antes de abrir ao público, concluir políticas de privacidade, retenção/exclusão e uso de conteúdo, adequadas à operação real. Este planejamento não determina prazos legais nem substitui avaliação específica. Não coletar data de nascimento, telefone ou localização precisa sem necessidade de produto.

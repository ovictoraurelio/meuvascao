# Roadmap e decisões abertas

## Sequência proposta

Estimativa preliminar: 6–8 semanas para uma pessoa experiente com dedicação consistente e apoio do fundador em conteúdo/moderação. Acesso às fontes, disponibilidade e resultados do piloto podem alterar o prazo. Não é compromisso de entrega.

| Etapa                               | Entregas                                                                                                                     | Critério de saída                                                                                                           |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 1 — Descoberta e prova, semana 1    | Conversas com 5–10 torcedores, protótipo móvel de home/notícia/jogo, catálogo de 3–5 fontes, prova de login/ingestão/runtime | Torcedores encontram jogo e notícia; pelo menos 3 fontes com integração e campos de uso definidos; decisão técnica revisada |
| 2 — Portal e agregação, semanas 2–3 | Layout, banco, importador, fila de exceções, feed, links de fontes, agenda e administração                                   | Recoleta não duplica; fonte falha isoladamente; editor corrige e retira item; leitura funciona sem login                    |
| 3 — Comunidade, semanas 4–5         | Conta, comentários, reações, tópicos, vínculo único com partidas, denúncias e moderação                                      | Jornada de participação completa; permissões e suspensão funcionam; responsável de moderação definido                       |
| 4 — Piloto, semana 6                | 50–100 convidados, ensaio de partida, restauração, métricas, espaços de anúncios reservados                                  | Sem bloqueadores de segurança/usabilidade; custos medidos; operação acompanha duas partidas                                 |
| 5 — Ajustes e abertura, semanas 7–8 | Correções, conteúdo inicial, páginas institucionais, configuração comercial escolhida e lançamento                           | Critérios abaixo atendidos; rede/parceiro de anúncios avaliado separadamente, sem depender de receita presumida             |

## Backlog inicial ordenado

1. Catalogar fontes: acesso, frequência, campos permitidos, imagens, confiabilidade e responsável por exceções.
2. Validar proposta e navegação com torcedores, especialmente durante uso rápido no celular.
3. Provar login + D1 + ingestão no runtime e estimar custo com requests/CPU/linhas/filas reais.
4. Criar tokens visuais, componentes e estados vazios/de erro.
5. Implementar importador idempotente, normalização, fontes pausáveis e revisão de exceções.
6. Entregar home, páginas de notícia/contexto e links diretos para o original.
7. Implementar agenda, estados de partida e administração.
8. Entregar participação, fórum enxuto e moderação com auditoria.
9. Validar desempenho, cache, limites de abuso, backup e restauração.
10. Fazer piloto e só então ampliar distribuição e monetização.

## Critérios para lançamento público

- Home e páginas principais utilizáveis em 360 px, teclado e leitor de tela; leitura disponível sem cadastro.
- Informação agregada com fonte, data e link; falhas de coleta visíveis para a equipe; nenhuma notícia fictícia em produção.
- Provedor indisponível não derruba a leitura do último conteúdo válido.
- Duplicatas, reenvios e concorrência testados com comportamento idempotente.
- Login não perde rascunho; conta sem permissão não administra; suspensão bloqueia escrita na API.
- Denúncias chegam à fila e há pessoa escalada para revisão.
- Segredos fora do repositório; preview isolado; logs sem dados pessoais desnecessários.
- Teste de pico com perfil documentado e métricas observadas, sem afirmar capacidade antes da medição.
- Restore ensaiado, rollback da aplicação descrito e migrações compatíveis com rollback planejadas.
- Papéis, contato, regras de comunidade, privacidade e condições de uso de fontes/imagens definidos para a operação real.
- Anúncios identificados, espaço reservado e nenhuma obrigação de clicar para participar.
- Orçamento/alertas e controles de redução de consumo configurados.

## Riscos e respostas

| Risco                              | Sinal observável                                  | Resposta                                                                                   |
| ---------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Agregador sem motivo para retornar | Leitura pontual e baixa retenção                  | Testar resumo útil, contexto de jogo e pautas de comunidade; não aumentar coleta cegamente |
| Fontes insuficientes               | Poucos itens utilizáveis ou permissões limitadas  | Buscar feeds/APIs autorizados e parceiros; ajustar abrangência do lançamento               |
| Fórum vazio                        | Tópicos sem resposta                              | Concentrar categorias e discussão por jogo; convidar grupo fundador e manter pauta         |
| Ambiente hostil                    | Denúncias e abandono                              | Moderação ativa, modo lento, limites e suspensão com motivo                                |
| Custo sem receita correspondente   | Custo por mil páginas aumenta e RPM não acompanha | Rever polling, mídia, automações, anúncios e fornecedores; usar receita observada          |
| Dependência de rede de anúncios    | Reprovação ou baixa monetização                   | Avaliar patrocínio direto; não contratar custo fixo com receita futura presumida           |
| Fonte quebrada ou rumor replicado  | Parsing falha ou correções frequentes             | Pausar fonte, revisar regras e preservar classificação/origem                              |

## Decisões registradas

- Confirmado pelo fundador: domínio comprado e repositório remoto criado, conforme informação fornecida.
- Confirmado: agregação principalmente automatizada.
- Confirmado: interesse em receita com anúncios e tolerância a custos maiores se a conta fechar.
- Proposto: começar pelo futebol masculino profissional, fórum com duas categorias, atualização esportiva manual e stack Cloudflare/Astro.

## Perguntas que ainda precisam de resposta

| Decisão                                                   | Responsável                  | Momento necessário                       |
| --------------------------------------------------------- | ---------------------------- | ---------------------------------------- |
| Quais fontes podem ser integradas e com quais campos?     | Fundador/editor + engenharia | Antes de implementar e abrir o agregador |
| Quem acompanha exceções editoriais e moderação?           | Fundador                     | Antes do piloto com participação         |
| Qual teto de gasto antes de existir receita?              | Fundador                     | Antes de ativar serviços pagos           |
| Quem implementará e com qual dedicação?                   | Fundador                     | Antes de assumir datas                   |
| Qual identidade própria e acervo de imagens serão usados? | Fundador/design              | Antes da identidade final                |
| Qual rede ou parceiro de anúncios atende à operação?      | Fundador                     | Antes de integrar monetização            |

Não há bloqueio para desenvolver o protótipo enquanto essas respostas são construídas. Fontes autorizadas, responsáveis operacionais e orçamento são dependências concretas para publicar o serviço.

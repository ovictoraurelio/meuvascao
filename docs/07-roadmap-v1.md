# Roadmap v1 — Fundação e Dia de Vasco

Recorte aprovado no plano local de 05/09/2026 e na revisão de personas: Astro/Cloudflare, jogos cadastrados manualmente, links curados, uma resenha por partida e acesso por link mágico. Este documento torna o plano acessível no repositório; o histórico inicial em `04-execucao.md` inclui propostas anteriores e não amplia este escopo.

## Fatias e aceite

| Fatia | Entrega                          | Aceite principal                                                                         |
| ----- | -------------------------------- | ---------------------------------------------------------------------------------------- |
| F0–F2 | Fundação, gates, tokens e layout | Build, tipos, lint, contraste e navegador                                                |
| F3    | Esquema e repositórios           | Migrações D1, unicidade e normalização                                                   |
| F4    | Home e cadastro de novidades     | Estados vazios honestos, consentimento e antibot                                         |
| F5    | Agenda e página de jogo          | Estados, horário de Brasília, slug estável e fonte                                       |
| F6    | Conta e sessão                   | Link de uso único, sessão revogável, apelido, exportação e exclusão                      |
| F7    | Administração                    | Papéis no servidor, jogos/links, exportação de leads e auditoria                         |
| F8    | Resenha                          | Uma thread por jogo, comentários idempotentes, respostas, curtidas, denúncias e rascunho |
| F9    | Moderação                        | Fila, motivo, suspensão, modo lento, fechamento e bloqueio global de escrita             |
| F10   | Institucionais e descoberta      | Sobre, regras, aviso de privacidade versionado, sitemap, robots e imagem social          |
| F11   | Operação                         | Observabilidade sem dados pessoais, backup/restauração e medições de desempenho          |
| F12   | Publicação                       | Build de ambiente, CI, preview, proteção de produção e sondas reais                      |

## Critérios de abertura

Código pronto não equivale a operação aberta. A participação depende de envio real de e-mail, segredo de sessão, chaves antibot, responsáveis pela moderação e validação dos textos de privacidade. A coleta permanece fechada por padrão fora de desenvolvimento, conforme `runbooks/publicacao-leitura.md`.

Produção usa apenas dados reais cadastrados pelo editor. Seeds são exclusivos de desenvolvimento e testes. Não habilitar agregação automática, anúncios, fórum geral, React, WebSockets, R2, filas ou tarefas de coleta nesta v1.

Antes de ampliar o piloto, medir latência D1 a partir do Rio, concorrência, atualização de cache, custos, envio de e-mail e restauração remota. O ensaio local de restore não demonstra RPO/RTO remoto. Acompanhamento de duas partidas e decisões editoriais continuam trabalho humano.

## Acompanhamento

O estado verificado, revisões e evidências da execução atual estão em [Esteira Vuca](09-esteira-vuca.md). A esteira aceita até 15 ondas e revisões conjuntas a cada três; não remove gates nem transforma dependências externas em entregas concluídas.

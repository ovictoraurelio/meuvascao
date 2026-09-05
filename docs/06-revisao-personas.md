# Revisão em três personas — Meu Vascão 0.1.0

Análise crítica do repositório por três personas (empreendedor, arquiteto de soluções e torcedor do Vasco), com verificação independente e consolidação para o Product Owner. Gerado em 05/09/2026 a partir do commit `b80f494`. Os pareceres das personas foram produzidos por agentes que releram o repositório de forma independente; a consolidação é do orquestrador.

## Contexto e método

Data: 05/09/2026. Objeto: o repositório `meuvascao` na versão `0.1.0` — 1 commit, 17 arquivos versionados, 2.415 linhas (1.077 delas de CSS). Cinco documentos de planejamento, um protótipo estático (HTML/CSS/JS), 5 testes Playwright e um workflow de CI.

Método: o orquestrador leu os 17 arquivos, executou as verificações e mediu contraste e tamanhos de fonte diretamente no CSS. Três agentes-persona releram o repositório de forma independente e entregaram análises com evidência por `arquivo:linha`. A consolidação final separa consensos, tensões e pontos cegos e propõe direcionamentos para o Product Owner. Nenhum arquivo do protótipo ou da documentação foi alterado.

### Placar

| Persona      | Nota | Veredito em uma frase                                                                                                                                                                                                                                      |
| ------------ | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Empreendedor | 4/10 | Execução técnica e honestidade documental acima da média, mas sem cliente confirmado, aposta declarada, dono com dedicação definida ou modelo de receita que feche a conta que o próprio documento apresenta.                                              |
| Arquiteto    | 6/10 | Planejamento honesto sobre o que não sabe, puxado para baixo por um protótipo que não prototipa a experiência especificada, promessas de acessibilidade não cumpridas no CSS e um cronograma que precisa dobrar ou um escopo que precisa cair pela metade. |
| Torcedor     | 5/10 | Documentação madura carregando um protótipo que ainda não descobriu que é do Vasco: a base é confiável, mas a alma (faixa, história, voz de arquibancada, 1924) ainda não entrou em campo.                                                                 |

### Fatos verificados pelo orquestrador

- `npm run check` aprovado (`node --check` + Prettier). `npm test`: 5 de 5 testes aprovados em 2,1 s no Chromium. Confirma a alegação de `docs/05-kickoff.md:33`.
- Toolchain local: Node 22.17.1, npm 10.9.2, Python 3.12.3. O servidor de desenvolvimento é `python3 -m http.server` (`package.json:6`, `playwright.config.js:16`).
- Sem `LICENSE`, `CLAUDE.md` ou `.nvmrc`. O diretório `assets/` existe vazio e não versionado: não há nenhuma imagem própria.
- Contraste WCAG medido sobre os fundos reais do CSS. Seis das dez combinações de texto cinza falham o nível AA para texto normal (4,5:1), e são justamente as usadas em fontes de 7 a 9 px:

| Par (texto / fundo)   | Onde                                    | Razão | AA normal | AA grande |
| --------------------- | --------------------------------------- | ----- | --------- | --------- |
| `#777` / `#f8f7f4`    | eyebrow, welcome p, footer p            | 4,18  | falha     | ok        |
| `#888` / `#f8f7f4`    | news-meta, location, pill, topic-bottom | 3,31  | falha     | ok        |
| `#999` / `#faf9f6`    | poll-note, mini-label, footer small     | 2,71  | falha     | falha     |
| `#8a8a8a` / `#f8f7f4` | news-meta                               | 3,22  | falha     | ok        |
| `#6f6f6f` / `#f8f7f4` | filtros                                 | 4,69  | ok        | ok        |
| `#fff` / `#d9202a`    | botão primário                          | 5,01  | ok        | ok        |
| `#141414` / `#f8f7f4` | corpo                                   | 17,2  | ok        | ok        |

- Tamanhos de fonte: 86 declarações de `font-size` em `style.css`; 23 delas entre 7 e 9 px. O corpo do texto é 14 px (`style.css:52`). O aviso "sem vínculo oficial" tem 8 px (`style.css:783`).
- Tokens de cor: `docs/02-experiencia-editorial.md:11` propõe `#101010`, `#FAFAF7`, `#C51D2B` e `#B8B8B8`. Nenhum aparece no código. O CSS usa `--red #d9202a`, `--black #141414`, fundo `#f8f7f4` e apenas 4 custom properties (`style.css:3-6`), com dezenas de hex soltos.
- Alvos de toque: `docs/02:68` promete ao menos 44 px. Os pontos do slider têm 6×6 px (`style.css:354-360`); o botão de curtir tem padding de 3 px e fonte de 11 px (`style.css:463-468`).
- Segurança do protótipo: o fórum escapa entrada do usuário (`app.js:251-258`); notícias, hero e slides interpolam sem escape a partir de dados estáticos (`app.js:99`, `app.js:130`, `app.js:183-185`). A função `open` sombreia `window.open` (`app.js:103`). Não há CSP. Fontes e imagens vêm de terceiros (Google Fonts, Unsplash).
- Modelo local: curtidas e respostas são chaveadas pelo índice do array (`app.js:99`, `app.js:301`, `app.js:335`). Mudar a ordem ou a quantidade de notícias e tópicos base reatribui curtidas e respostas a outro item.
- Navegação: os links do menu são âncoras internas; não há rotas nem páginas permanentes. A barra inferior prometida em `docs/02:29` não existe (o `README.md:64` reconhece). A faixa diagonal (`docs/02:9`) aparece apenas no gradiente do escudo em CSS (`style.css:529-544`). O bloco "newsletter" (`index.html:173-183`) não tem formulário.
- CI: actions fixadas por tag major, não por SHA. Sem verificação de acessibilidade ou desempenho.
- Testes: 5 E2E cobrindo filtros, modal, curtidas persistentes, HTML tratado como texto no fórum, dados inválidos, armazenamento bloqueado, menu mobile e largura de 360 px. Não cobrem contraste, teclado além de Esc, enquete em fluxo normal, slides do hero nem "Todas as notícias".

---

## Persona: Empreendedor

### 1. Quem sou e o que me importa

Construí e investi em portais de nicho, newsletters e comunidades pagas no Brasil. Aprendi na pele que audiência não é negócio, que display no Brasil paga mal e que a maioria dos fóruns morre vazia. O que me importa aqui: existe um cliente com uma dor que ele reconhece, existe alguém disposto a sustentar isso por meses sem receita, e existe um motivo para o torcedor sair de onde já está.

### 2. Primeira impressão

Este é o kickoff mais honesto e mais bem escrito que vi em muito tempo, e é justamente isso que me preocupa. Cinco documentos, protótipo testado, CI, ADR com preços consultados — e nenhuma pessoa de fora do projeto foi ouvida (`README.md:60`). A documentação inteira é escrita no modo defensivo: "hipótese" (`docs/01-produto.md:7`), "não é compromisso" (`docs/04-execucao.md:5`), "proposto, não aprovado" (`README.md:10`), "cenários aritméticos, não estimativas" (`docs/03-arquitetura.md:112`). Um plano que não se compromete com nada não pode estar errado, e portanto não ensina nada. Eu quero ver uma aposta: "acreditamos que X vascaínos querem Y porque Z; se em 14 dias não acontecer W, paramos". Não está em nenhum dos 17 arquivos.

### 3. O que está bom

- **Honestidade radical.** `README.md:60` admite "não houve pesquisa com torcedores nem validação de demanda". `docs/05-kickoff.md:33` diferencia teste passado de auditoria. Isso é raro e é pré-requisito para aprender rápido.
- **Tom de voz é um ativo real.** A tabela em `docs/02-experiencia-editorial.md:15-23` ("Hoje doeu. O que precisa mudar?") é autêntica, diferenciada e barata de manter. É a única coisa do projeto que um concorrente grande não copia bem.
- **Ética de agregação correta.** Separar "Ler na fonte" de "Comentar" e recusar página intermediária para inflar views (`docs/02-experiencia-editorial.md:66`) é a decisão certa para confiança de longo prazo, ainda que sacrifique pageviews.
- **Uma conversa por partida.** `docs/01-produto.md:54` e `docs/03-arquitetura.md:66`: concentrar em vez de dispersar é a decisão de comunidade mais acertada do plano.
- **North star correta.** `docs/01-produto.md:42` escolhe "torcedores que participam por semana", não pageviews. Para comunidade, é a métrica certa.
- **Matemática de custo e receita exposta sem maquiagem.** `docs/03-arquitetura.md:104-114` mostra os preços da Cloudflare e faz a conta de RPM. O problema é o que a conta revela (ver crítica 3), mas o fato de estar escrita é mérito.
- **Qualidade de engenharia acima do padrão de protótipo.** Teste de XSS em `tests/prototype.spec.js:39-53`, storage bloqueado em `tests/prototype.spec.js:75-102`, 360 px em `tests/prototype.spec.js:104-120`.
- **Disclaimer de independência** no rodapé (`index.html:191-192`) já existe desde o primeiro commit.

### 4. Críticas duras

**1. Não existe aposta, só hipóteses empilhadas.**
Evidência: `README.md:10`, `docs/01-produto.md:7`, `docs/03-arquitetura.md:3`, `docs/04-execucao.md:5`, `docs/03-arquitetura.md:112`. Por que importa: sem uma tese falsificável, o piloto de 30 dias (`docs/01-produto.md:32`) vai produzir números que serão interpretados como "promissores" independentemente do resultado. O que eu faria: uma página, três frases — a aposta, o que precisa ser verdade, o critério de morte em 14 dias.

**2. O plano foi escrito antes de ouvir um único torcedor, e a "descoberta" é ridiculamente pequena.**
Evidência: `README.md:60`; `docs/04-execucao.md:9` coloca "conversas com 5–10 torcedores" na semana 1, depois de 2.415 linhas de planejamento. `docs/01-produto.md:71` ainda diz "nenhum contato está autorizado nesta etapa". Por que importa: 5–10 conversas com pessoas próximas do fundador confirmam o que o fundador já acredita. O que eu faria: 30 conversas em grupos de WhatsApp/Telegram de vascaínos que o fundador não conhece, antes de tocar em Astro. Custo: zero reais, duas semanas.

**3. O próprio documento prova que ads-only não fecha, e ninguém tira a conclusão.**
Evidência: `docs/03-arquitetura.md:112`: 100 mil pageviews × RPM de R$ 2–10 = R$ 200–1.000/mês. `README.md:60`: o fundador "admite crescimento do custo desde que a receita com anúncios sustente". `docs/01-produto.md:73`: "anúncios são a hipótese principal de receita". Por que importa: 100 mil pageviews/mês é um número difícil para um portal novo de nicho (a confirmar), e produz o equivalente a um jantar. RPM de display no Brasil é estruturalmente baixo (a confirmar valores atuais), e um fórum com conteúdo gerado por usuário é risco de reprovação em rede de anúncios (a confirmar política vigente). O modelo "ads sustenta o custo" é uma armadilha clássica: você cresce custo atrás de tráfego que paga centavos. O que eu faria: três fontes de receita desde o dia 1 — apoio recorrente (sócio do portal, R$ 10–20/mês), patrocínio direto local (bares de torcida, lojas de camisa, escolinhas — a confirmar interesse), afiliados (ingressos, camisas, streaming). Display só quando houver volume para justificar.

**4. Nenhum concorrente é nomeado em cinco documentos.**
Evidência: busquei em `docs/01-produto.md`, `docs/02-experiencia-editorial.md`, `docs/04-execucao.md` — zero menções a ge.globo, Lance!, UOL, ESPN, NETVASCO, canais oficiais do clube, YouTube, podcasts, X, Reddit, grupos de WhatsApp. `docs/01-produto.md:7` chama o problema de "fragmentação" e propõe como solução agregar links dessas mesmas fontes com 15–30 minutos de atraso (`docs/02-experiencia-editorial.md:78`). Por que importa: agregar link do ge é ser um ge pior e mais lento. O benchmark implícito "Meu Timão" funciona (a confirmar) por escala de torcida, mais de uma década de SEO acumulado e redação própria — nenhum dos três está disponível aqui. Copiar o padrão de nome "Meu + apelido" convida à comparação e sinaliza derivação. O que eu faria: escolher uma coisa que ninguém faz bem para o vascaíno (exemplo: a melhor resenha pré e pós-jogo em texto, com pauta editorial e moderação séria) e ser dono disso. Nada mais.

**5. Cold start do fórum é o risco número 1 e recebe uma linha.**
Evidência: `docs/04-execucao.md:49` ("Fórum vazio → convidar grupo fundador"). O protótipo maquia o problema com contagens inventadas: `app.js:263,270,276` (38, 64, 27 respostas), `app.js:198` (enquete 82/13/5%). Piloto de 50–100 convidados com 25% de ativação (`docs/01-produto.md:32,37`) = 12 a 25 pessoas participando. Por que importa: isso é um grupo de WhatsApp, não um fórum. Fórum vazio mata a percepção de valor no primeiro acesso e não há segunda chance. O que eu faria: começar a comunidade hoje em WhatsApp/Telegram, com pauta por jogo, custo zero. Se em 6 semanas o grupo não estiver estourando e pedindo estrutura, o fórum não deve ser construído.

**6. Escopo P0 é de 3–4 meses, não 6–8 semanas, e não tem dono.**
Evidência: `docs/01-produto.md:46-57` lista 10 capacidades P0 (OAuth, comentários idempotentes, fórum, moderação com suspensão server-side, administração com auditoria, ingestão com filas, SEO). `docs/03-arquitetura.md:50-62` tem 14 entidades. `docs/04-execucao.md:30-41` exige 12 critérios de lançamento incluindo teste de pico e restore ensaiado. `docs/04-execucao.md:69` deixa "quem implementará e com qual dedicação?" em aberto, e `docs/04-execucao.md:68` não tem teto de gasto. Por que importa: uma estimativa sem responsável, sem horas e sem orçamento não é estimativa. Se a "pessoa experiente" é o próprio fundador em horário residual, são 5–6 meses. O que eu faria: cortar P0 para home + agenda manual + uma discussão por jogo + 3 links/dia curados à mão. Adiar login OAuth (apelido + e-mail mágico resolve), adiar fórum geral, adiar administração.

**7. Agregação automatizada é a parte mais cara, mais frágil e menos diferenciada — e foi "confirmada" como direção.**
Evidência: `docs/04-execucao.md:58`; `docs/03-arquitetura.md:68-78` (cron, filas, dedupe, allowlist, sanitização, fila de exceções); `docs/02-experiencia-editorial.md:72`: "não tratar RSS ou página pública como licença de republicação". Por que importa: se você respeita essa regra (e deve), precisa de permissão de veículos que provavelmente não vão responder (a confirmar). Resultado: cards com título e link. Isso já existe e se chama X/Twitter. Você vai construir infraestrutura de fila para entregar o que uma pessoa faz em 20 minutos por dia — e `docs/02-experiencia-editorial.md:78` já admite que o "Em 1 minuto" começa como 3 links selecionados. O que eu faria: curadoria humana por seis meses. Automatizar quando doer.

**8. Risco de marca: o documento diz uma coisa, o protótipo faz outra.**
Evidência: `docs/02-experiencia-editorial.md:9` alerta que domínio não autoriza uso de marcas de terceiros. O código usa a cruz de malta em oito pontos (`index.html:18,22,128,141,149,156,174,187`), e `style.css:529-544` desenha um escudo com faixa diagonal preto-e-branco e cruz vermelha — é o escudo do clube reconstruído em CSS. `style.css:545-560` faz o mesmo com o Santos. O nome "Vascão" é gíria de torcida, mas nome + escudo + cores + domínio juntos constroem um caso de confusão (a confirmar registros do clube no INPI e postura da SAF com marca). Por que importa: um ofício do clube no mês 3 mata o projeto e queima o domínio. O que eu faria: parecer de advogado de PI antes de qualquer investimento em identidade; registrar marca própria; remover o escudo em CSS; criar símbolo proprietário e usar a cruz como referência cultural, não como logo.

**9. O protótipo valida estética, e a única coisa que deveria capturar, não captura.**
Evidência: as cinco "notícias" em `app.js:38-79` são manifesto, nenhuma é notícia. O bloco "newsletter" em `index.html:173-183` não coleta e-mail — o botão "Ficar por dentro" aponta para `#noticias` (`index.html:182`). Os testes (`docs/05-kickoff.md:35`) cobrem XSS, storage e 360 px — nada sobre demanda. Por que importa: um kickoff de portal deveria ter uma página no ar em meuvascao.com capturando e-mail/WhatsApp desde o dia 1. O protótipo está com `noindex` (`index.html:4`) e roda em `127.0.0.1` (`package.json:6`). Zero aprendizado sobre o mercado até agora. O que eu faria: trocar o bloco por captura real, publicar hoje, divulgar em 5 grupos, contar.

**10. Mobile-first na especificação, desktop-first no código.**
Evidência: `docs/02-experiencia-editorial.md:29-31` pede barra inferior com 4 destinos e cartão de partida no topo. `index.html` não tem barra inferior; o hero é imagem de manifesto (`index.html:67-99`); o cartão de jogo está no `aside` (`index.html:118-143`) e cai abaixo das notícias no mobile (`style.css:980-983`). `README.md:64` admite o desalinhamento. Fontes de 7–9 px em `style.css:86,185,296,494,652,690,916,1071` e alvos de 6 px em `style.css:354-360` contradizem a meta de 44 px em `docs/02-experiencia-editorial.md:68`. Por que importa: o público-alvo está no celular em dia de jogo; o protótipo foi desenhado para impressionar em 1440 px. O que eu faria: não gastar mais uma hora no protótipo atual até a demanda existir; quando existir, refazer a partir do wireframe de `docs/02-experiencia-editorial.md:33-55`.

**11. Métricas de piloto não medem negócio.**
Evidência: `docs/01-produto.md:34-40` — encontrar jogo em 10 s, 25% de ativação, 20% de retorno, 30 contas/semana, 90% de denúncias revisadas. Nenhuma mede disposição a pagar, compartilhamento espontâneo ou retorno em dia sem jogo. Por que importa: 30 contas ativas por semana é o que qualquer grupo de WhatsApp de torcida tem. O que eu faria: adicionar "N pessoas pagaram R$ 10" e "N pessoas voltaram em dia sem jogo sem serem chamadas".

### 5. Riscos que ninguém está vendo

- **Tamanho real do mercado endereçável.** Ninguém fez a conta. Em ordens de grandeza, tudo a confirmar: torcida do Vasco na casa de alguns milhões; digitalmente ativos com conteúdo do clube diariamente, talvez 10–20%; dispostos a adotar um portal independente em vez de ficar no Instagram/ge/WhatsApp, 1–3% desses; dispostos a participar de fórum com regularidade, 5–10% desses; dispostos a pagar, 2–5% desses. O funil termina em centenas de participantes e dezenas de pagantes. Isso não é ruim — é o tamanho de uma comunidade paga saudável — mas exige custo próximo de zero e valor alto por pessoa, não infraestrutura de escala.
- **Dependência do desempenho esportivo.** Audiência de torcida é cíclica com resultado, calendário e crise institucional (situação da SAF, a confirmar). O plano não menciona sazonalidade nem a janela de lançamento: 6–8 semanas a partir de 05/09 cai no fim do Brasileirão (a confirmar calendário), seguido de dois meses de entressafra.
- **O clube é o maior concorrente por atenção.** Canais oficiais da SAF têm o acesso exclusivo que nenhum independente terá (a confirmar). O portal só sobrevive no espaço que o oficial não pode ocupar: crítica, opinião e conversa livre.
- **Burnout do fundador é a causa de morte mais provável.** `docs/02-experiencia-editorial.md:86` prevê "responsável por partida e substituto" não remunerados. Moderar racismo e ameaça às 23h de domingo após derrota, sozinho, por seis meses sem receita, é o que realmente encerra esses projetos.
- **Brand safety.** Fórum de futebol brasileiro gera conteúdo que reprova em rede de anúncios e afasta patrocinador local (a confirmar política das redes). O plano de moderação (`docs/01-produto.md:55`) é bom no papel, mas é uma pessoa.
- **Direito autoral de terceiros.** Além da marca do clube, veículos grandes são agressivos com agregação (a confirmar). O respeito a "campos permitidos" exige contrato, não boa-fé.
- **Sem licença e sem identidade legal.** `README.md:56`. Quem é o titular do domínio, da marca, dos dados dos usuários? Pessoa física recebendo patrocínio é problema fiscal e de LGPD.

### 6. Perguntas que eu faria ao Product Owner

1. Você vai moderar pessoalmente às 23h de domingo depois de uma derrota? Por quantos meses, sem receita?
2. Qual é o teto em reais e em horas por semana antes de desligar? (`docs/04-execucao.md:68-69` estão em branco.)
3. Em quais grupos de vascaínos você já está e quantas pessoas de lá você traria hoje para um grupo fundador?
4. O que você acha que ganha com agregação automatizada que três links por dia curados à mão não entregam?
5. Se um advogado disser que "Vascão" com cruz de malta é risco real, você troca o nome?
6. Qual é a coisa que ge, NETVASCO, canais oficiais e X não fazem para o vascaíno e que você vai fazer melhor?
7. Você aceitaria "50 pessoas pagando R$ 10/mês" como critério de validação no lugar de pageviews?
8. Quem é a "pessoa experiente" das 6–8 semanas? É você? Está contratada, com que dedicação?

### 7. Minhas 5 recomendações prioritárias

1. **Escrever a aposta e o critério de morte em uma página.** Impacto alto, esforço baixo, agora. Substitui o hedging por "acreditamos que X; se em 14 dias não tivermos Y, paramos".
2. **Landing real em meuvascao.com com captura de e-mail/WhatsApp e grupo fundador em WhatsApp com pauta por jogo.** Impacto alto, esforço baixo, agora. Trocar o bloco de `index.html:173-183` por captura de verdade, tirar o `noindex`, publicar. Meta: 200 contatos e 50 pessoas ativas no grupo em 14 dias, ou reavaliar a tese.
3. **Cortar P0 para agenda manual + uma discussão por jogo + 3 links/dia curados por humano.** Impacto alto, esforço médio (é decisão e reescrita de `docs/01-produto.md:44-57`), agora. Agregação automatizada, fórum geral, administração e OAuth vão para P1 condicionado a demanda observada.
4. **Modelo de receita triplo desde o dia 1: apoio recorrente, patrocínio direto local e afiliados.** Impacto alto, esforço médio, próximo. Display só acima de um volume que justifique (a definir com RPM observado, não hipotético). Substituir `docs/03-arquitetura.md:100-116` por uma planilha com três linhas de receita e o custo real da pessoa.
5. **Parecer jurídico de marca, registro de marca própria, remoção do escudo em CSS e política LGPD mínima.** Impacto médio (evita morte súbita), esforço baixo-médio, próximo. Antes de investir um real em identidade visual.

Depois, e só depois: refazer o protótipo mobile-first a partir do wireframe de `docs/02-experiencia-editorial.md:33-55`, e então provar a stack Cloudflare como `docs/03-arquitetura.md:122` já pede.

### 8. Nota: 4/10

Execução técnica e honestidade documental muito acima da média para um kickoff, mas o negócio ainda não tem cliente confirmado, aposta declarada, dono com dedicação definida nem modelo de receita que feche a conta que o próprio documento apresenta.

---

## Persona: Arquiteto de soluções

### 1. Quem sou e o que me importa

Arquiteta de soluções para produtos de conteúdo e comunidade (Astro/Next, Workers/D1/R2/Queues, Postgres, OAuth, cache, filas, OWASP, LGPD, WCAG 2.2, Playwright). Me importa que a stack proposta sobreviva ao primeiro dia de jogo, que uma pessoa consiga operar o sistema sozinha e que nada do que prometemos em acessibilidade e privacidade seja só texto.

### 2. Primeira impressão

A documentação é incomumente honesta para um kickoff: separa hipótese de fato, cita limites de fornecedor, nomeia SSRF, idempotência e cache privado antes de existir uma linha de backend. O protótipo, porém, não prototipa o produto especificado — é um _moodboard_ desktop-first com dados estáticos, tipografia de 7–9px e modelo de dados chaveado por índice, enquanto docs/02 pede barra inferior, jogo em primeiro plano no celular e alvos de 44px (o próprio README:64 admite o desalinhamento). E o plano de 6–8 semanas para uma pessoa cobrir todo o P0 subestima o esforço em cerca de 2×. Base boa para decidir; ainda não é base para construir.

### 3. O que está bom

- **Ingestão pensada como superfície de ataque**: allowlist administrativa, validação de redirects, bloqueio de destinos internos, HTML externo tratado como não confiável (`docs/03-arquitetura.md:72-74`). Raro ver SSRF nomeado antes do primeiro fetch.
- **Idempotência em dois lugares certos**: chave por autor em `comments` e unicidade `source/external_id` + `canonical_url` normalizada (`docs/03-arquitetura.md:59,64`); critério de saída "recoleta não duplica" (`docs/04-execucao.md:10`).
- **Separação cache público × dados pessoais** com `private/no-store` e TTLs explícitos (`docs/03-arquitetura.md:82-84`); polling só com aba visível, com jitter e botão de "novas mensagens" (`:84`) — evita deslocar texto durante leitura.
- **Modelo de custo sem marketing**: distingue RPM de página de RPM de impressão, alerta que "alertas não são teto" e prevê chave de redução de consumo (`docs/03-arquitetura.md:112-116`).
- **Protótipo com higiene defensiva real**: `readStored` valida forma dos dados e tolera `localStorage` bloqueado (`app.js:11-31`), fórum escapa entrada do usuário (`app.js:251-258,301,344`), `<dialog>` nativo com `aria-labelledby` (`app.js:103-108`), `prefers-reduced-motion` respeitado (`style.css:28-39`), `aria-pressed` em curtir e palpite (`app.js:99,199`).
- **Testes que atacam o que importa num protótipo local**: payload XSS no fórum, JSON corrompido, storage bloqueado, 360px sem rolagem horizontal, rede externa abortada (`tests/prototype.spec.js:5-9,39-53,61-66,80-86,117-119`).
- **CI mínima correta**: `permissions: contents: read`, `timeout-minutes`, deps fixadas em versão exata, lockfile v3, zero dependências de produção (`.github/workflows/ci.yml:5-6,11`, `package.json:16-17`). `.gitignore` já prevê `.astro/` e `.wrangler/` (`.gitignore:7-8`).

### 4. Críticas duras

1. **Notícias renderizadas sem escape** — `app.js:99` interpola `n.title`, `n.category` e até `aria-label="Ler: ${n.title}"`; `app.js:130` idem para `item.body`. Hoje os dados são estáticos; no dia em que vierem de RSS de terceiros, um título com `"` quebra o atributo e um `<img onerror>` executa. O teste de XSS cobre só o fórum (`tests/prototype.spec.js:39-53`). _Faria_: um único caminho de renderização com escape obrigatório (ou `textContent`/templates de framework), e teste de XSS também no feed.
2. **Modelo local chaveado por índice** — likes validados por `id < news.length` (`app.js:88`), respostas em `mv-replies-${i}` onde `i` é posição em `baseTopics + salvos` (`app.js:301,335`). Reordenar, remover ou inserir uma notícia/tópico base migra silenciosamente curtidas e respostas para outro item. Os testes cimentam isso (`[data-like='3']`, `[data-topic='3']`). _Faria_: IDs estáveis (slug/ULID) desde o protótipo; é o mesmo hábito que o D1 vai exigir.
3. **Acessibilidade prometida ≠ entregue** — docs/02:11 e :68 prometem contraste validado, alvos ≥44px e não depender da cor. Medi: `#888` sobre `#f8f7f4` = 3,31:1, `#999` = 2,66:1, `#8a8a8a` = 3,22:1, `#777` = 4,18:1 — todos abaixo de 4,5:1 em texto de 7–10px (`style.css:249,499,655,461,189`); 23 ocorrências de `font-size` ≤ 9px; dots do slider 6×6px (`style.css:354-360`), curtir com `padding: 3px` (`:466`), `.text-button` sem padding (`:384`). Filtros, dots e nav sinalizam seleção só por classe/cor, sem `aria-pressed`/`aria-current` (`index.html:108-113`, `app.js:151,188,373`). `<h3>` e `<div>` dentro de `<button class="topic">` é HTML inválido (`app.js:301`). Nenhum `rem` no CSS. _Faria_: escala tipográfica mínima de 12px/0.75rem, cinza de apoio ≥ `#6b6b6b`, alvos 44px (24px é o piso do WCAG 2.2 2.5.8), estados com ARIA, e `@axe-core/playwright` no CI para não regredir.
4. **Paleta incoerente entre docs e código** — docs/02:11 define `#101010/#FAFAF7/#C51D2B/#B8B8B8`; o CSS usa `#d9202a`, `#141414`, `#f8f7f4` (`style.css:3-4,49`), mais `#111`, `#151515`, `#171717`, `#fcfbf8`, `#faf9f6` e 11 cinzas hardcoded; `theme-color` é `#111111` (`index.html:11`); `--muted` é declarado e nunca usado. O cinza proposto `#B8B8B8` sobre `#FAFAF7` dá 1,90:1 — inutilizável para texto. _Faria_: fechar os tokens uma vez (cor, tipo, espaço, raio), validar contraste no próprio arquivo de tokens e gerar o CSS deles.
5. **`function open` sombreia `window.open` e o fechar-por-fora é assimétrico** — `app.js:103` declara `open` no escopo global de um script clássico; `app.js:117-124` só fecha o dialog quando o clique cai à direita ou abaixo (`offsetX/offsetY` negativos falham em `offsetX >= 0`). Consequência: comportamento inconsistente e bug latente quando alguém precisar de `window.open`. _Faria_: `openModal`, e `getBoundingClientRect()` com `clientX/clientY` para detectar clique no backdrop; nada disso sobrevive à migração, então baixo esforço.
6. **Toolchain de dois mundos** — `python3 -m http.server` como servidor dev de um projeto Node (`package.json:6`, `playwright.config.js:16`) e CI instalando Python só para isso (`ci.yml:18-20`). Sem TypeScript apesar da ADR (`docs/03:11`), sem ESLint/stylelint (o "lint" é `node --check`, `package.json:8`), sem LICENSE, `.nvmrc`, CLAUDE.md ou CONTRIBUTING. _Faria_: `npx serve`/Vite agora; ao migrar, o próprio `astro dev` resolve.
7. **Actions fixadas por tag major** — `actions/checkout@v4`, `setup-node@v4`, `setup-python@v5` (`ci.yml:13-18`). Tag é mutável; supply chain de uma action comprometida roda com o token do repositório. _Faria_: SHA completo + Dependabot para actions e npm; `concurrency` para cancelar runs obsoletos.
8. **Testes cobrem o feliz, não o produto** — não há axe, regressão visual, Lighthouse, navegação por teclado ponta a ponta, nem teste do estado vazio (`.empty` existe no CSS `style.css:856` e nunca é renderizado; todo filtro tem ≥1 item). `retries: 1` em CI (`playwright.config.js:7`) mascara flakiness num suíte de 5 testes. _Faria_: axe em toda página, Lighthouse CI com orçamento (LCP ≤ 2,5s em Moto G), retries 0 até haver motivo.
9. **Tabela de alternativas ignora a pergunta "comprar vs. construir"** — `docs/03:35-40` compara quatro variações de "onde hospedar meu código". Faltam BaaS (Supabase/Firebase: auth + Postgres + RLS + realtime prontos), software de fórum (Discourse/NodeBB/Flarum, com moderação e auditoria maduras), headless CMS para o editorial, e comentários como serviço. Fórum + moderação + admin é ~60% do esforço do P0 e a parte menos diferenciada. _Faria_: uma linha por opção com custo mensal "a confirmar" e o que se perde em identidade/UX; decidir explicitamente.
10. **Limites e geografia do D1 tratados de forma genérica** — a ADR cita "limites por banco" (`docs/03:88`) mas não que SQLite tem escritor único por banco nem que o D1 vive numa única região (réplicas de leitura existem, escrita não — a confirmar). Para torcedor no Rio, cada SSR com 3–5 consultas sequenciais a um primário fora do Brasil soma latência; isso pesa mais que o gargalo de escrita em pico de comentários (centenas de writes/min cabem). Sessões em D1 (`docs/03:52`) põem uma leitura no caminho de toda requisição autenticada. _Faria_: spike medindo TTFB do Rio; sessão em KV ou cookie assinado; se p95 > 800ms, Postgres com região São Paulo (Supabase/Neon — a confirmar).
11. **Auth, antibot, observabilidade, e-mail e backup sem nome** — "biblioteca mantida" (`docs/03:92`), "proteção antibot; verificar ferramenta" (`:92`), "observar taxa de erros…" sem ferramenta (`:98`), "exportação periódica" sem mecanismo (`:98`); e-mail transacional não aparece em lugar nenhum (exclusão de conta, aviso de moderação). Sem nome não há estimativa, nem custo, nem spike. _Faria_: candidatos com critério de saída: Better Auth ou Auth.js/`auth-astro` (compatibilidade com Workers a confirmar), Turnstile, Sentry (`@sentry/cloudflare`) + Cloudflare Web Analytics, Resend/Postmark, `wrangler d1 export` + Time Travel (a confirmar) com restore ensaiado.
12. **LGPD nunca é nomeada** — docs/02:88 fala de "políticas de privacidade" genericamente. Faltam: base legal, encarregado, fluxo técnico de exclusão/exportação (docs/01:52 promete "solicitar exclusão"), retenção de logs e comentários ocultos, menores (Art. 14 — torcida tem 13–17 anos), transferência internacional (Cloudflare, Google Fonts via `style.css:1`, Unsplash). E a tela de consentimento OAuth do Google exige URL de política de privacidade para verificação — bloqueia o piloto se ficar para o fim. _Faria_: privacidade e exclusão de conta como P0 técnico, não como "antes de abrir".
13. **Uma thread por notícia criada eagerly** — `docs/03:66` vincula thread a cada notícia/jogo; com agregação a cada 15–30 min isso gera milhares de threads vazias e páginas "sem contexto próprio" que docs/02:66 diz não querer indexar. _Faria_: criar a thread no primeiro comentário; `threads` com CHECK + índice único parcial para o vínculo exclusivo.
14. **Invalidação de cache subestimada** — "validar a retirada em todos os caminhos" (`docs/03:82`) esconde que a Cache API do Worker é por datacenter e purge por tag é Enterprise (a confirmar). _Faria_: TTL curto (60–120s já proposto) como mecanismo primário, chave versionada em KV como secundário, purge por URL para retirada editorial; HTML público idêntico para todos e estado do usuário via `/api/me` no cliente.

**Reaproveitável ao migrar para Astro**: a copy e o tom (`index.html:50-52,145-158`, `app.js:160-176`), a estrutura de seções (jogo · radar · resenha · manifesto), os testes como especificação de comportamento, os textos de estado (storage indisponível, ilustrativo), a ideia de tokens — corrigidos. **Descartável**: todo o `app.js` (delegação por índice, innerHTML), 90% do CSS em px, Unsplash/Google Fonts hotlinked, servidor Python.

### 5. Riscos que ninguém está vendo

- **Marca**: cruz de malta `✠` em sete pontos do HTML, `.vasco-crest` com faixa diagonal preta/branca (`style.css:529-544`), escudo do adversário imitado (`index.html:131`). Domínio "meuvascao" + identidade que evoca o escudo = notificação plausível do clube ou de licenciados. Docs/02:9 reconhece; o protótipo faz o contrário.
- **Google OAuth em modo "external" exige verificação** (política de privacidade, domínio autorizado, logo) — dias a semanas, a confirmar. Se não começar na semana 1, o piloto da semana 6 não tem login.
- **Fontes brasileiras** (ge, Lance, UOL) costumam entregar só título+link em RSS; "3–5 fontes com campos permitidos" pode virar 1–2 — e a home fica rasa. Curadoria manual assistida é o plano B que precisa existir desde já.
- **Redes de anúncios rejeitam "conteúdo agregado"** com frequência; docs/01:73 diz para não presumir, mas a estimativa de receita ainda ancora o projeto.
- **Moderação é o gargalo físico**, não o D1: 500 comentários/hora em Vasco × Flamengo com uma pessoa moderando e SLA de 24h (`docs/01:40`) não fecham.
- **Bus factor 1** em código e operação; nenhum documento de contribuição ou runbook.

### 6. Perguntas que eu faria ao Product Owner

1. Quem implementa, com quantas horas/semana, e o fundador codifica? A estimativa muda 2× com a resposta.
2. Alguma fonte já respondeu por escrito o que permite usar (título, descrição, imagem)? Se não, curadoria manual no piloto é aceitável?
3. O editor precisa publicar texto próprio sem código já no piloto, ou markdown no repositório (content collections) serve por 8 semanas?
4. Fórum próprio é requisito estratégico ou aceita Discourse/NodeBB/Supabase por baixo da identidade Meu Vascão?
5. Teto mensal em USD antes de receita e quem é dono das contas Cloudflare e Google Cloud?
6. Quem modera em dia de jogo (mínimo dois) e em qual janela?
7. Idade mínima da comunidade? Há menores no público-alvo?
8. Houve avaliação jurídica de nome, cruz de malta e domínio? Existe plano B de identidade?

### 7. Arquitetura alvo mínima e plano de spikes de 1 semana

**Alvo mínimo (P0 reescopado)**: Astro SSR + TypeScript em Workers; islands em TS puro/Preact (React só se provar ganho — o protótipo é vanilla); D1 para conteúdo/comunidade _ou_ Postgres regional se o spike de latência falhar; sessão em KV ou cookie assinado; Google OAuth via biblioteca escolhida; Turnstile em escrita; rate limit em KV/Rate Limiting binding (a confirmar); **um Cron Trigger** percorrendo fontes com try/catch por fonte e tabela `ingestion_runs` — Queues só acima de ~10 fontes; **sem R2 no P0** (mídia = URL externa com crédito ou assets do build); artigos próprios em content collections; Sentry + Cloudflare Web Analytics; `wrangler` com dev/preview/prod e migrations versionadas; Playwright + axe + Lighthouse CI; actions por SHA.

**Spikes (5 dias, critério de saída objetivo):**

| Dia | Prova                                                        | Saída                                                                                                      |
| --- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| 1   | Astro SSR + D1 em preview, página com 3 consultas            | TTFB p50 < 400ms / p95 < 800ms medido do Rio; região do primário documentada. Falhou → Postgres SP         |
| 2   | Google OAuth + sessão HttpOnly/Secure/SameSite + CSRF/origin | E2E login/logout/rota protegida verde em preview; segredo fora do repo; sobrevive a cold start             |
| 3   | Escrita concorrente: 200 POSTs, 50 com chave repetida        | 0 duplicatas, p95 < 500ms, erro < 1%, linhas escritas contadas                                             |
| 4   | Ingestão de 3 feeds reais no runtime (parser XML sem DOM)    | Rodar 2× = 0 duplicatas; 1 feed quebrado não derruba os outros; item incompleto cai em exceções            |
| 5   | Cache público + estado privado + custo                       | Publicação visível em ≤ 60s em 2 colos; usuário logado nunca recebe HTML alheio; ms de CPU/req na planilha |

**Estimativa honesta** do P0 como escrito (`docs/01:46-57`): 12–16 semanas para uma pessoa sênior full-time — auth 1, esquema+admin 2, ingestão completa 2, jogos+SEO+cache 1, fórum 2, moderação+abuso 1,5, backup/obs/envs 1, a11y/perf/E2E 1, piloto+ajustes 2. **Cortes para caber em 8–10**: ingestão automática → curadoria assistida (form + bookmarklet), fila de exceções sai; admin editorial → content collections; reações → só "curtir"; R2 e Queues → P1. **Ordem**: spikes → fatia vertical _jogo + resenha_ (o diferencial) → identidade/moderação → curadoria → piloto. Comunidade antes de agregação: é onde mora o risco técnico e o valor.

### 8. Minhas 5 recomendações prioritárias

1. **Semana de spikes antes de qualquer feature** — impacto alto, esforço 1 semana, _agora_. Decide D1 vs Postgres e auth com dados, não com opinião.
2. **Reescopar o P0 e registrar a decisão comprar vs. construir** — impacto alto, esforço 2 dias, _agora_. Sem isso, o cronograma é ficção e o PO planeja o piloto errado.
3. **Fundar o repo Astro+TS com tokens corrigidos** (≥12px, contraste ≥4,5:1, alvos 44px, ARIA de estado), ESLint/stylelint, axe e Lighthouse no CI, actions por SHA, `.nvmrc`, LICENSE, CLAUDE.md — impacto médio-alto, esforço 3 dias, _próximo_.
4. **Modelo de dados com IDs estáveis, idempotência, soft-delete e audit log genérico**, migrations versionadas, seeds e restore ensaiado — impacto alto, esforço 1 semana, _próximo_.
5. **LGPD e observabilidade como P0 técnico**: política de privacidade, exclusão/exportação de conta, retenção, Sentry, analytics sem cookie; fontes e imagens self-hosted — impacto alto, esforço 1 semana, _depois dos spikes, antes do piloto_. Anúncios só depois disso.

### 9. Nota: 6/10

Planejamento acima da média e honesto sobre o que não sabe, puxado para baixo por um protótipo que não prototipa a experiência especificada, promessas de acessibilidade não cumpridas no CSS e um cronograma que precisa dobrar ou o escopo precisa cair pela metade.

---

## Persona: Torcedor do Vasco

### 1. Quem sou e o que me importa

Sócio há décadas, cadeira na social, meia dúzia de grupos de WhatsApp, X aberto durante o jogo e podcast de torcida no fone na volta pra casa. Me importa três coisas: saber rápido o que é fato e o que é boato, ter um lugar pra resenhar sem rival trollando e sem racista solto, e sentir que quem fez aquilo sabe o que é a Colina, a faixa diagonal e a Resposta Histórica — não um template de "sports media" com ✠ colado.

### 2. Primeira impressão

Abri o repositório e encontrei duas coisas diferentes. A documentação (`docs/01` a `docs/05`, `README.md`) é honesta até doer: admite que não houve pesquisa com torcedor (`README.md:60`), que as imagens não são do Vasco (`README.md:45`) e que nada é notícia real. Isso é raro e eu respeito. Já o protótipo (`index.html`, `app.js`, `style.css`) fala outra língua: emocional-genérica, de campanha de marca. Troca "Vasco" por qualquer clube que a copy continua funcionando — e esse é o problema. "Feito por fãs. Movido por um amor infinito." (`index.html:189`) não é frase de arquibancada; é frase de agência. Um vascaíno não é "fã"; é torcedor, é sofredor, é sócio, é o cara que xinga e volta. O protótipo ainda não sabe que é do Vasco.

### 3. O que está bom

- **Honestidade radical na doc.** "Com dados ausentes, mostrar estado explícito sem informações inventadas" (`docs/01-produto.md:48`); "sem fabricar notícia para preencher o feed" (`docs/02-experiencia-editorial.md:78`). É o antídoto contra o site de torcida que inventa "bomba".
- **Tabela de tom de voz da doc é melhor que a copy do protótipo.** "Hoje doeu. O que precisa mudar?", "Pode comemorar. Agora conta: quem decidiu?" (`docs/02-experiencia-editorial.md:19-21`) — isso é conversa de bar vascaíno. Deveria estar no HTML.
- **"Resenha" como nome da comunidade** (`index.html:34`, `index.html:167`) é escolha carioca certeira. E o placeholder "Resenha boa tem respeito." (`app.js:338`) é a melhor linha do produto.
- **Uma discussão por partida, compartilhada entre página do jogo e fórum** (`docs/01-produto.md:54`). Evita a dispersão que mata fórum.
- **"Ler na fonte" separado de "Comentar", sem página intermediária pra inflar pageview** (`docs/02-experiencia-editorial.md:66`). Respeito pelo leitor e pelo veículo.
- **Segurança básica levada a sério num protótipo estático:** `escape()` (`app.js:251-258`) e teste de XSS de verdade (`tests/prototype.spec.js:39-53`).
- **Modo lento e fechamento temporário de discussão** já previstos (`docs/02-experiencia-editorial.md:86`). Quem já viu thread pós-clássico sabe o valor disso.
- **Tópico "Qual foi o seu primeiro jogo em São Januário?"** (`app.js:267-270`) — esse eu abriria e responderia hoje.

### 4. Críticas duras

**1. "Fãs" e "amor infinito": vocabulário que denuncia quem não é da arquibancada.**
Evidência: `index.html:189` ("Feito por fãs. Movido por um amor infinito."), `index.html:157` ("Não é uma fase. É a nossa vida."), `index.html:86` ("Sentir essa história"), `index.html:18` ("O sentimento não pode parar").
Por que importa: torcedor sente o cheiro de copy de agência de longe. Isso destrói o "de vascaíno pra vascaíno" antes do primeiro clique.
O que eu faria: "Feito por torcedor. Sem dono, sem patrão, sem panelinha." / "Sofre, xinga, volta. Vascaíno é assim." / trocar "Sentir essa história" por "Ler" ou "Conhecer". "O sentimento não pode parar" vira "Casaca!" — o grito que só a gente entende.

**2. "PRÓXIMA BATALHA" é linguagem de energético, não de Vasco.**
Evidência: `index.html:121`, `index.html:146`, `app.js:41`, `app.js:169`, `app.js:262` — "batalha" aparece cinco vezes.
Por que importa: ninguém no grupo de zap diz "batalha". Diz "jogo", "clássico", "decisão", "dia de Vasco".
O que eu faria: "É DIA DE VASCO" no cartão; "Domingo tem Vasco" no título da enquete; "Qual seria o seu time pro domingo?" no tópico.

**3. Copy de convite que me trata como forasteiro.**
Evidência: `index.html:37` ("Entrar pra torcida"), `app.js:238` ("Entrar pra torcida ✠"), `index.html:169` ("Puxar uma resenha +").
Por que importa: eu já sou torcida há 40 anos; "entrar pra torcida" soa como onboarding de app de banco. "Puxar uma resenha" ninguém fala — se puxa assunto, se solta o verbo.
O que eu faria: botão do header "Meu apelido" ou "Chegar na Colina"; criar tópico como "Solta o verbo +" ou "Abrir resenha". Manter "Chega mais pra resenha." (`index.html:167`) e "Bora pro pré-jogo" (`index.html:138`) — esses funcionam. "Saudações vascaínas!" (`app.js:248`) também é legítimo, manter.

**4. A faixa diagonal — o símbolo visual mais reconhecível do clube — não existe no layout.**
Evidência: `docs/02-experiencia-editorial.md:9` promete "faixa diagonal como recurso de composição". No CSS, o único gradiente em diagonal está dentro de um escudinho de 52 px (`style.css:530-536`). Hero, header, cards, seções: zero faixa. As cores da doc (`#C51D2B`, `#101010`, `#FAFAF7` em `docs/02:11`) nem batem com o código (`#d9202a`, `#141414`, `#f8f7f4` em `style.css:3-4,49`).
Por que importa: preto + vermelho + Barlow Condensed (`style.css:1`) é a receita padrão de "portal esportivo". Sem a faixa, isso é qualquer site. A faixa é o que faz um vascaíno reconhecer o Vasco a 100 metros.
O que eu faria: faixa diagonal branca sobre preto como divisor de seções e no cartão de jogo; tipografia com personalidade própria (a condensada pode ficar, mas não sozinha); fixar uma paleta única entre doc e código.

**5. Escudos desenhados em CSS: amadorismo visual e risco jurídico dobrado.**
Evidência: `.vasco-crest` (`style.css:529-544`) reproduz o escudo do clube estilizado; `.opponent-crest` (`style.css:545-560`, `index.html:131`) inventa um escudo do Santos com listras e "SFC". A própria doc avisa: "o domínio não é autorização de uso de marcas" (`docs/02-experiencia-editorial.md:9`).
Por que importa: parece camelô de camisa. E se o clube ou o rival implicar, o portal cai no dia do lançamento.
O que eu faria: criar um símbolo próprio (Cruz de Malta é patrimônio cultural amplamente usado, mas não copiar o brasão inteiro); adversário em texto com cor neutra até existir licença de dados/escudos. Reduzir o ✠, que hoje aparece dez vezes (`index.html:18,22,128,141,149,156,174,187`; `app.js:233,238`) — vira papel de parede.

**6. Números falsos no protótipo violam o próprio princípio da doc.**
Evidência: enquete fixa em "82% / 13% / 5%" (`app.js:198`) sob o convite "veja o da galera" (`index.html:153`); curtidas 84/126/203 (`app.js:44,52,60`); "38 respostas" de um fórum vazio (`app.js:264`); avatares "R M J" (`index.html:55`).
Por que importa: `docs/01:48` diz "sem informações inventadas". Se qualquer resquício desse padrão sobreviver ao piloto, a torcida chama de site de fake — e vascaíno já é traumatizado com número inventado.
O que eu faria: estado vazio honesto ("Ninguém palpitou ainda. Começa você.") e zero contador até haver dado real.

**7. As "notícias" são releases de assessoria, não pauta de torcedor.**
Evidência: "Trabalho, intensidade e foco na próxima batalha" com corpo sobre "renovar a confiança" (`app.js:41-45`) é literalmente o texto que o Departamento de Comunicação manda. As cinco notícias (`app.js:38-79`) são peças de clima; nenhuma tem um fato. "Bastidores" (`index.html:110`) vira memória de São Januário (`app.js:49-53`), quando pra vascaíno "bastidores" é Conselho, eleição, SAF, dívida, diretoria.
Por que importa: eu abro portal pra saber de escalação, lesão, arbitragem, ingresso, sócio, transferência e política do clube. Não pra ler "cada canto guarda uma história".
O que eu faria: pautas ilustrativas com forma de pauta real (rótulo "a confirmar" onde couber): "Escalação provável: quem entra no meio?", "Arbitragem do domingo: quem apita e o histórico com o Vasco", "Ingressos: setores, preço de sócio e horário de abertura dos portões", "Conselho vota X na quinta: o que está em jogo (a confirmar)".

**8. Zero história, zero ídolo, zero hino, zero Resposta Histórica — num clube que É história.**
Evidência: nenhuma menção a Roberto Dinamite, Barbosa, Camisas Negras, Expresso da Vitória, remo de 1898, basquete, feminino em `index.html` ou `app.js`. "Quizzes de história" empurrados pra P2 (`docs/01-produto.md:65`). Moderação antirracista resumida a uma frase (`docs/02-experiencia-editorial.md:25`).
Por que importa: a identidade popular e antirracista do Vasco não é marketing, é fundação. A Resposta Histórica de 1924 é a carta de princípios pronta para a comunidade. Ignorar isso é abrir mão da única coisa que nenhum rival pode copiar.
O que eu faria: seção "Memória" com "Hoje na história do Vasco" (efeméride diária = hábito barato); "Regras da Resenha" abertas com um parágrafo sobre 1924: "Este clube foi fundado dizendo não à exclusão. Aqui também."

**9. "Outros esportes" como rodapé apaga metade do clube.**
Evidência: filtro `index.html:113`; corpo genérico em `app.js:71-78`; `docs/04-execucao.md:60` começa "pelo futebol masculino profissional"; base e modalidades em P2 (`docs/01:65`).
Por que importa: basquete e feminino têm torcida engajada e pauta própria; tratá-los como "outros" é o mesmo desprezo que a torcida cobra da mídia.
O que eu faria: filtros nomeados ("Feminino", "Basquete", "Base", "Remo"); mesmo que sem cobertura própria, agregar links dessas modalidades desde o MVP.

**10. Tipografia de 7–9 px é hostil a uma torcida que tem muito sócio acima dos 50.**
Evidência: `style.css:299` (8 px), `:494-495` (7 px), `:690-692` (7 px), `:915-916` (7 px), `:1071-1073` (7 px), eyebrows 9 px (`:185-190`), meta de notícia 9 px (`:456-462`). O aviso "sem vínculo oficial" — a linha de confiança mais importante — tem 8 px (`style.css:782-786`, `index.html:191-192`).
Por que importa: `docs/01:57` promete acessibilidade; isso é inacessível em celular no sol de São Januário.
O que eu faria: mínimo 12 px em qualquer texto; disclaimer legível no header.

**11. O ponto vermelho "ao vivo" mente.**
Evidência: `.live-dot` em "Resenha da torcida" (`index.html:34`) e em "PRÓXIMA BATALHA" (`index.html:121`), mas o MVP não promete tempo real (`docs/01:28`).
Por que importa: em dia de jogo, ponto vermelho piscando significa "está acontecendo agora". Se não está, é urgência artificial, que a própria doc proíbe (`docs/02:25`).
O que eu faria: só acender com estado real de partida (`matches.estado` em `docs/03:57`).

**12. O manifesto "DE VASCAÍNO PRA VASCAÍNO" some justamente no celular.**
Evidência: `style.css:1025-1027` (`.manifesto { display: none }` abaixo de 760 px); a doc diz "prioridade para celular" (`README.md:60`).
Por que importa: a única declaração de independência do produto não existe onde 90% da torcida vai ler.
O que eu faria: uma linha fixa no topo mobile: "Independente. Sem vínculo com o clube. De vascaíno pra vascaíno."

### 5. Riscos que ninguém está vendo

- **Agregação sem camada editorial = "mais um que republica a grande imprensa carioca".** `docs/02:72` publica "automaticamente links e metadados" das fontes. A torcida vascaína tem relação de amor e ódio com a cobertura esportiva do Rio; um portal que só repassa links vira alvo, não abrigo. Precisa de rótulo por item (notícia/opinião/rumor/veículo), contexto e — crucial — canais e podcasts de torcida como fontes de primeira classe, não só os veículos.
- **Anúncios de casa de apostas.** Apostas estão fora do produto (`docs/01:67`), mas a maior verba publicitária do futebol brasileiro é bet. Se aceitar, a torcida vai dizer que "independente" era só até o primeiro banner. Decidir isso agora, publicamente.
- **A conta da moderação não fecha.** Cenário de `docs/03:112`: 100 mil pageviews a R$ 2–10 de RPM dá R$ 200–1.000/mês. Isso não paga um moderador em noite de derrota. Moderação vai ser voluntária → burnout → tóxico → abandono. SLA de 24h (`docs/01:40`) é uma eternidade quando o ataque racista a um jogador aparece aos 5 minutos do apito.
- **Rival com apelido "Mengão" e sem regra.** Nada em `docs/01:55` ou `docs/02:84-88` trata invasão organizada de rivais em dia de clássico. Modo lento não basta; conta nova em janela de jogo precisa de pré-moderação.
- **Sazonalidade política.** Entre temporadas, eleição, Conselho e mercado da bola geram mais tráfego que jogo; o produto está desenhado só ao redor da partida (`docs/01:20-26`).
- **Efeito "notícia velha".** Coleta a cada 15–30 minutos (`docs/02:78`) contra o X em segundos. O portal nunca ganha em velocidade; tem de ganhar em memória, organização e confiança — e isso não está na tese (`docs/01:5-9`).

### 6. Perguntas que eu faria ao Product Owner

1. Quem é o editor humano e quantas horas ele tem no domingo à noite e na segunda de manhã, especialmente depois de derrota em clássico?
2. Quais são as 3–5 fontes? Entram canais e podcasts de torcida? Entram veículos que a torcida desconfia — e com que rótulo?
3. Política do clube (Conselho, eleições, SAF — situação atual a confirmar) entra em "Bastidores" com neutralidade declarada entre chapas, ou fica fora por medo de briga?
4. A Resposta Histórica de 1924 vai ser a base pública das regras da comunidade, ou fica em uma linha da doc?
5. Vai aceitar anúncio de casa de apostas? E patrocínio de chapa política?
6. "Outros esportes" é rodapé permanente ou dívida temporária? Quem cobre feminino e basquete?
7. Em dia de jogo, o que a home entrega em 10 segundos que meu grupo de WhatsApp não entrega? (Minha resposta: hora, onde assistir — direitos a confirmar —, escalação quando sair, árbitro, e um link único de resenha que não se perde.)
8. Vai existir um símbolo próprio ou o produto vai depender do escudo do clube?

### 7. Minhas 5 recomendações prioritárias

| #   | Recomendação                                                                                                                                                                                                                                                                               | Impacto    | Esforço     | Horizonte |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | ----------- | --------- |
| 1   | Reescrever toda a copy do protótipo usando a tabela de voz de `docs/02:15-23` e um glossário vascaíno (Casaca, Colina, Gigante, Caldeirão, dia de Vasco). Eliminar "fãs", "batalha", "amor infinito", "sentir essa história".                                                              | Alto       | Baixo       | Agora     |
| 2   | Zero número inventado, zero escudo alheio. Estados vazios honestos; símbolo próprio; faixa diagonal de verdade no layout; paleta única entre doc e CSS; texto mínimo 12 px; disclaimer legível no header e no mobile.                                                                      | Alto       | Baixo–médio | Agora     |
| 3   | "Dia de Vasco" em 10 segundos: cartão com hora, competição, local, onde assistir (a confirmar), escalação e árbitro quando confirmados, link único da resenha. Trazer avaliação de jogadores pós-jogo de P1 pro MVP — é o maior gerador de hábito e de conversa.                           | Alto       | Médio       | Próximo   |
| 4   | Carta de princípios pública ancorada na Resposta Histórica + moderação de janela de jogo: modo lento automático por 2h após o apito, filtro de termos, pré-moderação de contas novas em dia de clássico, SLA de 1h para denúncias nessa janela, escala de voluntários com substituto.      | Alto       | Médio       | Próximo   |
| 5   | Camada editorial sobre a agregação: rótulo por item (notícia/opinião/rumor/veículo), fontes de torcida em pé de igualdade, "Bastidores" = política do clube com neutralidade declarada, filtros nominais para Feminino/Basquete/Base, e "Hoje na história do Vasco" como efeméride diária. | Médio–alto | Médio       | Depois    |

### 8. Nota: 5/10

Uma documentação madura e honesta carregando um protótipo que ainda não descobriu que é do Vasco — a base é confiável, mas a alma (faixa, história, voz de arquibancada, 1924) ainda não entrou em campo.

---

## Consolidação para o Product Owner

### Leitura consolidada

As três análises convergem em um diagnóstico: a documentação é madura e honesta, o protótipo não prototipa o produto que a documentação especifica, e o plano está superdimensionado em infraestrutura e subdimensionado em gente. As notas (4, 6 e 5) dão média 5: uma base confiável para decidir, ainda não uma base para construir. A boa notícia é que quase tudo que as personas pedem para os próximos 14 dias custa perto de zero em infraestrutura.

### Consensos

Pontos em que as três personas concordam, cada um com a evidência principal.

1. **A honestidade da documentação é o maior ativo do projeto; o hedging em excesso é o defeito dela.** `README.md:60` admite que não houve pesquisa; `docs/04-execucao.md:5` diz "não é compromisso". Falta uma aposta falsificável.
2. **O protótipo é um moodboard desktop, não o produto de `docs/02`.** Sem barra inferior, jogo abaixo das notícias no celular (`style.css:980-983`), hero de manifesto. Não vale polir: descartar como código, aproveitar como referência de copy, estrutura de seções e testes.
3. **Marca e escudos são risco jurídico e de credibilidade.** `docs/02:9` alerta que domínio não autoriza uso de marcas; o CSS reconstrói o escudo do clube (`style.css:529-544`) e inventa o do adversário (`style.css:545-560`), e o ✠ aparece dez vezes.
4. **Acessibilidade prometida não foi entregue.** 23 fontes entre 7 e 9 px, seis pares de cinza abaixo de 4,5:1, alvos de 6 px, contra `docs/02:11` e `docs/02:68`.
5. **Números inventados violam o princípio do próprio produto.** Enquete fixa em 82/13/5 (`app.js:198`), "38 respostas" num fórum vazio (`app.js:264`), contra `docs/01:48` ("sem informações inventadas").
6. **O prazo de 6 a 8 semanas é irreal.** O empreendedor estima 3 a 4 meses; o arquiteto, 12 a 16 semanas para uma pessoa sênior em tempo integral. Ou o prazo dobra ou o escopo cai pela metade.
7. **Agregação automatizada é a parte mais cara, mais frágil e menos diferenciada.** Sem camada editorial, vira "republicador da imprensa carioca". Curadoria humana primeiro (`docs/02:78` já admite que o "Em 1 minuto" começa com três links selecionados).
8. **Moderação é o gargalo real, não infraestrutura.** SLA de 24 h (`docs/01:40`) não serve em janela de jogo; precisa de duas pessoas e de regras para invasão de rivais.
9. **Anúncios display sozinhos não fecham a conta que o próprio documento apresenta** (`docs/03:112`: R$ 200 a 1.000/mês com 100 mil pageviews). Casas de apostas são linha vermelha para a torcida.
10. **Jogo + resenha é o diferencial. Comunidade antes de agregação.** É onde mora o valor para o torcedor e o risco técnico para o arquiteto.
11. **LGPD e exclusão de conta precisam ser P0 técnico**, inclusive porque a verificação do login Google exige política de privacidade publicada.

### Tensões e decisão proposta

| Tensão                                                      | Quem puxa para onde                                                                                                     | Decisão proposta                                                                                                                                                                                                                                                     |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Validar demanda antes de codar × semana de spikes técnicos  | Empreendedor quer landing e grupo de WhatsApp hoje, zero código. Arquiteto quer 5 dias de provas técnicas.              | Fazer os dois em paralelo nas semanas 1 e 2: os spikes custam 5 dias e não dependem de tração. O que depende de tração é construir a fatia vertical, e esse é o gate.                                                                                                |
| Não tocar no protótipo × reescrever copy e identidade agora | Empreendedor: nem uma hora a mais no protótipo. Torcedor: a copy de agência destrói a confiança no primeiro clique.     | A copy nova vai para a landing e para o grupo, onde é validada, não para o protótipo. Glossário vascaíno e tabela de voz como entregável de um dia.                                                                                                                  |
| Identidade forte do Vasco × distância das marcas do clube   | Torcedor quer faixa diagonal e Cruz de Malta. Empreendedor e arquiteto veem risco jurídico.                             | Símbolo próprio. Faixa diagonal como recurso gráfico abstrato (confirmar com o parecer). ✠ como referência cultural em um ou dois pontos, nunca como logo. Nenhum escudo, nem do adversário. Plano B de nome pronto.                                                 |
| Receita tripla desde o dia 1 × independência sem banner     | Empreendedor: apoio, patrocínio e afiliados. Torcedor: "independente" morre no primeiro banner de bet.                  | Apoio recorrente ("sócio do portal") como primeira receita, coerente com "de vascaíno pra vascaíno". Patrocínio direto local com rótulo. Sem bets, sem chapa política, publicado na carta de princípios. Display só depois do piloto e com elegibilidade verificada. |
| Comprar × construir                                         | Arquiteto sugere Supabase, Discourse ou NodeBB. Torcedor quer voz e UX mobile próprias. Empreendedor quer custo zero.   | Não adotar Discourse ou NodeBB: a UX mobile e a voz são o produto. Fórum P0 = uma resenha por jogo, minimalista. Banco (D1 ou Postgres regional) e autenticação decididos pelos spikes dos dias 1 e 2, com dados.                                                    |
| Cortar escopo × mais conteúdo e identidade                  | Empreendedor e arquiteto cortam. Torcedor pede memória, feminino, basquete, política do clube e avaliação de jogadores. | Cortar infraestrutura, não identidade. Efeméride "Hoje na história do Vasco", rótulos de modalidade e regras ancoradas em 1924 são conteúdo barato e entram. Avaliação de jogadores fica como primeiro incremento pós-piloto.                                        |
| Janela de lançamento                                        | Empreendedor: 8 semanas cai no fim do Brasileirão. Torcedor: a entressafra é politizada e movimentada.                  | Piloto em duas partidas ainda na temporada. Entressafra para memória e política do clube com neutralidade declarada, e para medir retorno em dia sem jogo.                                                                                                           |

### Pontos cegos

O que nenhuma das três personas cobriu.

- **Ninguém verificou se as fontes existem.** Não há lista de feeds e canais com o que cada um entrega por RSS. Sem isso, o spike de ingestão e a curadoria são abstratos. O PO levanta dez candidatos (veículos e canais/podcasts de torcida) em um dia.
- **O loop de distribuição não foi desenhado.** O grupo de WhatsApp é a velocidade; o portal é a memória. O link único da resenha por jogo, compartilhado no grupo, é o mecanismo de aquisição e precisa de URL curta e estável e de card de compartilhamento. `docs/01:71` menciona cards, mas ninguém os amarrou ao cold start.
- **Quem cadastra agenda e resultado às 23 h?** O "cadastro manual" de `docs/02:80` precisa estar ligado ao papel de responsável por partida.
- **Bus factor 1 vale também para o PO.** Fundador é PO, editor, moderador e desenvolvedor. A primeira "contratação" deve ser um co-moderador voluntário com substituto, não um dev.
- **Não existe nenhuma imagem própria.** `assets/` está vazio. O acervo com créditos (`docs/02:9`) é dependência de identidade que ninguém colocou em cronograma.

### Direcionamentos

<!-- cols -->

#### Agora (dias 1 a 14, infraestrutura perto de zero)

1. **Aposta e critério de morte em uma página.** Tese sugerida: "a melhor resenha pré e pós-jogo do Vasco em texto, com memória e moderação séria, para vascaínos que já estão em grupos de WhatsApp e querem um lugar que não se perde". Critério: 200 contatos e 50 pessoas ativas no grupo em 14 dias, ou revisar a tese.
2. **Landing em meuvascao.com com captura de e-mail/WhatsApp e grupo fundador com pauta por jogo.** Copy já na voz de `docs/02:15-23` mais glossário vascaíno. Sem `noindex`. Disclaimer de independência legível.
3. **30 conversas com vascaínos fora do círculo do fundador**, com roteiro de cinco perguntas.
4. **Parecer jurídico** sobre nome, ✠, faixa, domínio e LGPD mínima; iniciar registro de marca própria. Decisão pública: sem bets, sem chapa.
5. **Reescopar o P0** em `docs/01` e `docs/04`; registrar comprar × construir como ADR-002; estimativa honesta com responsável e horas.
6. **Semana de spikes** (tabela do arquiteto, 5 dias), em paralelo com os itens 1 a 4. O resultado decide D1 × Postgres e a biblioteca de login.
7. **Higiene de uma hora:** decidir licença, `.nvmrc`, actions por SHA, Dependabot. Não polir o protótipo.

Gate para a fase seguinte: tração do item 1, parecer jurídico sem bloqueio e cinco spikes com saída objetiva.

#### Próximo (semanas 3 a 10, se o gate passar)

1. **Fatia vertical "Dia de Vasco":** página permanente por jogo (hora, competição, local, onde assistir quando confirmado, escalação e árbitro quando confirmados, última atualização), uma resenha por jogo e apelido com login simples. Astro + TypeScript na stack decidida pelos spikes.
2. **Identidade própria:** símbolo, faixa como recurso gráfico, tokens únicos (documento igual ao código, contraste validado no arquivo de tokens), texto mínimo de 12 px, alvos de 44 px, barra inferior no celular, estados vazios honestos.
3. **Carta de princípios pública ancorada na Resposta Histórica de 1924** e moderação de janela de jogo: modo lento automático por 2 h após o apito, pré-moderação de contas novas em clássico, filtro de termos, SLA de 1 h na janela, escala com duas pessoas e substituto.
4. **Curadoria assistida "Em 1 minuto":** três links por dia via formulário ou bookmarklet, rótulo notícia/opinião/rumor/veículo, canais de torcida em pé de igualdade. Sem cron nem filas.
5. **LGPD e observabilidade como P0 técnico:** política, exclusão e exportação de conta, retenção, rastreamento de erros, analytics sem cookie, fontes e imagens hospedadas no próprio domínio.
6. **Receita:** apoio recorrente ativo já no piloto; três conversas com patrocinadores locais.
7. **Piloto** com o grupo fundador em duas partidas, medindo as métricas abaixo.

#### Depois (condicionado ao piloto)

1. **Agregação automatizada** (um Cron, try/catch por fonte) só quando a curadoria passar de uma hora por dia ou de cinco fontes.
2. **Avaliação de jogadores pós-jogo** como primeiro incremento; fórum Geral; efeméride diária; filtros Feminino, Basquete, Base e Remo; cobertura de política do clube com neutralidade declarada.
3. **Display** só com volume, elegibilidade verificada e brand safety. Bets nunca.
4. **PWA, notificações opt-in, busca, perfis, R2 e Queues.**

<!-- /cols -->

### Decisões pendentes

| Decisão                                             | Recomendação                                                                                                                                     | Até quando                      |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------- |
| Quem implementa e com quantas horas por semana      | **Respondida em 05/09:** o agente de IA Vuca implementa. Ver o adendo abaixo: o gargalo passa a ser revisão humana, operação e esperas externas. | Respondida                      |
| Teto de gasto antes de receita (US$/mês e h/semana) | Fixar um número e configurar alertas em 50, 80 e 100%.                                                                                           | Semana 2                        |
| Manter o nome "Meu Vascão"?                         | Manter (é gíria de torcida) se o parecer permitir; símbolo próprio; plano B de nome pronto.                                                      | Semana 2                        |
| Comprar × construir a comunidade                    | Não Discourse. Fórum mínimo próprio. D1 × Postgres pelo spike de latência.                                                                       | Fim da semana de spikes         |
| Fontes (3 a 5, incluindo canais de torcida)         | Começar com curadoria manual independentemente; pedir permissão por escrito em paralelo.                                                         | Semana 2                        |
| Política comercial                                  | Sem bets, sem chapa política; apoio recorrente primeiro.                                                                                         | Agora, e pública                |
| Política do clube como pauta                        | Sim, com neutralidade declarada e rótulo.                                                                                                        | Antes do piloto                 |
| Idade mínima                                        | 18+ para participar, ou consentimento; confirmar com jurídico (LGPD art. 14).                                                                    | Antes do login                  |
| Licença do repositório                              | Decidir se é open source; MIT ou Apache para código, conteúdo à parte.                                                                           | Antes de divulgar o repositório |
| Avaliação de jogadores no MVP?                      | Primeiro incremento pós-piloto, não P0.                                                                                                          | No reescopo                     |

### O que não faremos agora

- Agregação automatizada com filas, R2 ou Queues.
- Polir o protótipo atual. Ele vira referência de copy e estrutura; o código é descartado.
- Painel administrativo editorial. Markdown no repositório basta por oito semanas.
- Rede de display no piloto. Casas de apostas, nunca.
- Threads criadas automaticamente para cada notícia.
- Aplicativo nativo, placar em tempo real e WebSockets, como já previsto em `docs/01:67`.

### Métricas para saber se funcionou

**Gate de 14 dias:** 200 contatos capturados; 50 pessoas ativas no grupo; 30 conversas realizadas; aposta escrita; parecer jurídico recebido; cinco spikes com critério de saída atendido ou reprovado.

**Piloto de 30 dias com duas partidas:**

| Métrica                                                  | Meta                  |
| -------------------------------------------------------- | --------------------- |
| Torcedores que participam por semana (métrica principal) | 30 ou mais            |
| Retorno em dia sem jogo                                  | 20% ou mais da coorte |
| Encontrar o próximo jogo a partir da home                | 8 de 10 em até 10 s   |
| Denúncias tratadas dentro da janela de jogo              | 90% em até 1 h        |
| Apoiadores pagantes                                      | 20 ou mais            |
| Custo por participante                                   | Medido e registrado   |
| TTFB p95 medido do Rio                                   | 800 ms ou menos       |
| LCP em celular intermediário                             | 2,5 s ou menos        |
| Texto abaixo de 12 px em produção                        | Zero                  |
| Violações críticas de acessibilidade (axe)               | Zero                  |
| Números inventados em produção                           | Zero                  |

### Adendo: a implementação é de um agente de IA

Resposta do fundador à decisão pendente número 1, em 05/09/2026: quem implementa é o **Vuca**, agente de IA especialista em código, programação ágil, segurança e qualidade, com velocidade de implementação da ordem de 100 vezes a de um desenvolvedor sênior humano. Este adendo é leitura do orquestrador sobre o que isso muda nas três análises; as personas não foram reexecutadas.

#### O que muda

- **A estimativa de 12 a 16 semanas era de esforço de codificação.** Com o Vuca, código deixa de ser o caminho crítico. Os itens de código do P0 reescopado (scaffold Astro + TypeScript, tokens, esquema, autenticação, página de jogo e resenha, moderação, curadoria assistida, testes, CI) cabem em dias de calendário, limitados por revisão e por decisões, não por digitação.
- **O gargalo muda de lugar.** Passa a ser, nesta ordem: decisões do PO; esperas externas (verificação do login Google, permissão das fontes, parecer jurídico e registro de marca, parecer LGPD); operação humana (editor, dois moderadores, responsável por partida); capacidade humana de revisar o que o Vuca produz; e medições que consomem calendário (spikes de latência, teste de carga, ensaio de restauração e o próprio piloto de duas partidas).
- **Caminho crítico revisado: 4 a 6 semanas, quase nada delas de código.** O prazo de 6 a 8 semanas de `docs/04-execucao.md:5` volta a ser plausível, pelo motivo oposto ao assumido no documento.
- **A fatia vertical "Dia de Vasco" pode existir em preview na semana 2**, em paralelo com a validação de demanda. O gate de tração passa a condicionar o lançamento e a operação, não a construção.
- **Moderação ganha ferramentas, não substitutos.** O Vuca pode construir triagem, filtro de termos, modo lento automático e painel de denúncias em dias. A decisão e a responsabilidade continuam humanas.

#### O que não muda

- **Nenhuma crítica do empreendedor é resolvida por velocidade de código.** Demanda, cold start, receita, marca e dedicação do fundador continuam em aberto. Construir barato torna mais fácil construir a coisa errada, não mais difícil.
- **Nenhuma crítica do torcedor.** Voz, identidade, pauta e moderação em dia de derrota são humanas. "De vascaíno pra vascaíno" exige vascaínos na copy, na curadoria e na moderação. A documentação já veta conteúdo editorial gerado por IA (`docs/01-produto.md:67`, `docs/02-experiencia-editorial.md:78`); manter.
- **A lista "o que não faremos agora" fica igual.** Construção barata não é motivo para construir agregação com filas, painel administrativo, R2 ou Queues antes de a demanda existir.
- **Os spikes continuam necessários e continuam levando dias**, porque medem sistemas externos: latência do banco a partir do Rio, comportamento do OAuth no runtime, custo real por requisição.

#### Riscos novos que o Vuca introduz

1. **Deriva entre especificação e código, em escala.** O protótipo atual é a prova: a documentação promete alvos de 44 px, contraste validado e quatro tokens de cor; o CSS entrega fontes de 7 px, seis pares de cinza abaixo de 4,5:1 e outra paleta. Com 100 vezes mais throughput, a deriva também escala. Resposta: os critérios de aceite de `docs/01-produto.md:46-57` viram testes antes do código; a CI bloqueia contraste abaixo de 4,5:1, fonte abaixo de 12 px, alvo abaixo de 44 px, violações do axe e HTML sem escape no feed.
2. **Gargalo de revisão.** Cem vezes mais código para a mesma quantidade de humano revisar. Resposta: PRs pequenos, uma fatia por vez; um segundo agente revisor obrigatório (revisão de código e de segurança); humano assina apenas autenticação, moderação, exclusão de dados, deploy em produção e qualquer gasto.
3. **Autonomia sobre contas e custo.** Resposta: contas Cloudflare, Google e DNS em nome do fundador; o Vuca não cria serviços pagos; teto e alertas configurados antes do primeiro deploy; o custo do próprio Vuca (inferência) entra na planilha de `docs/03-arquitetura.md:100-116`.
4. **Over-building.** Quando construir custa pouco, o backlog cresce sozinho. Resposta: limite de uma fatia em andamento; nenhum item entra no backlog sem métrica associada.
5. **Bus factor continua 1**, agora com um agente no lugar do desenvolvedor. Resposta: ADRs, runbooks e documentação de operação são parte do "pronto" de cada fatia; um humano precisa conseguir operar o sistema sem o agente.
6. **Responsabilidade legal.** A LGPD exige um controlador e um encarregado humanos; propriedade e licença do código gerado precisam estar definidas antes de divulgar o repositório.
7. **Autenticidade percebida.** Se a comunidade concluir que "tudo é IA", a confiança cai. Resposta: transparência na página institucional: código construído com IA; conteúdo, curadoria e moderação por vascaínos.

#### Como cada persona reagiria

- **Empreendedor:** o custo de construir caiu para perto de zero, o que torna a validação mais urgente, não menos. Não há mais desculpa para a landing não estar no ar hoje. "Quem implementa" está respondido; "quem opera" e "quem paga a conta" continuam em branco.
- **Arquiteto:** velocidade sem guardrails é dívida técnica em escala. A ordem muda: guardrails de CI e testes como especificação vêm antes da primeira feature. Os spikes seguem no plano porque medem o mundo, não o código.
- **Torcedor:** não importa quem digita. Importa quem escolhe a pauta, quem escreve na voz da Colina e quem apaga o racista às 23 h. Se isso for humano e vascaíno, está resolvido.

#### Direcionamentos revisados

**Agora, dias 1 a 7.** Guardrails antes de features: repositório Astro + TypeScript, tokens únicos, CI com axe, Lighthouse, contraste e teste de XSS no feed, actions por SHA, branch protection e segundo agente revisor (Vuca, 1 a 2 dias). Critérios de aceite do P0 reescopado convertidos em testes que falham (Vuca escreve, PO revisa). Spikes 1 a 5 em paralelo (implementação em horas, medições em dias). Landing com captura e grupo fundador (Vuca constrói em horas, PO divulga). Esperas externas iniciadas no dia 1: verificação do OAuth Google, pedidos de permissão às fontes, parecer jurídico.

**Próximo, semanas 2 a 4.** Fatia vertical "Dia de Vasco" em preview; identidade própria; carta de princípios; curadoria assistida; exclusão e exportação de conta. Recrutamento da operação humana: editor, dois moderadores com substituto, responsável por partida. Este é o item mais lento do plano inteiro.

**Piloto, semanas 4 a 6.** Duas partidas com o grupo fundador, medindo as métricas já definidas.

**Depois.** Igual ao plano anterior.

#### Decisões pendentes atualizadas

| Decisão                                                  | Recomendação                                                                                                                                                 | Até quando                      |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------- |
| Nível de autonomia do Vuca                               | Pode: abrir PRs, rodar CI, publicar em preview. Não pode sem humano: merge em `main`, deploy em produção, criar serviço pago, tocar em segredos de produção. | Antes do primeiro PR            |
| Quem revisa o que o Vuca produz                          | Segundo agente revisor em todo PR; humano em autenticação, moderação, dados pessoais, deploy e gasto.                                                        | Antes do primeiro PR            |
| Controlador e encarregado LGPD                           | Pessoa física ou jurídica do fundador; nunca o agente.                                                                                                       | Antes do login                  |
| Transparência sobre uso de IA                            | Declarar na página institucional o que é feito por IA e o que é humano.                                                                                      | Antes do piloto                 |
| Propriedade e licença do código gerado                   | Definir junto com a licença do repositório.                                                                                                                  | Antes de divulgar o repositório |
| Quem opera: editor, moderadores, responsável por partida | Continua sem resposta e agora é o caminho crítico.                                                                                                           | Semana 2                        |

## Como usar os agentes-persona

Quatro agentes reutilizáveis foram criados em `.claude/agents/` e ficam disponíveis a partir da próxima sessão do Claude Code neste repositório:

- `persona-empreendedor`: avalia negócio, mercado, receita, cold start e risco jurídico.
- `persona-arquiteto`: revisa código, ADRs, modelo de dados, plano técnico e propõe spikes.
- `persona-torcedor-vasco`: avalia voz, identidade, conteúdo, hábito e confiança sob a ótica da torcida.
- `persona-product-owner`: consolida análises em consensos, tensões e direcionamentos Agora/Próximo/Depois.

Uso típico: "use o agente persona-torcedor-vasco para revisar a nova home" ou "rode os três agentes-persona sobre o PR #12 e depois o persona-product-owner para consolidar". Cada agente lê o repositório, não altera arquivos e devolve a análise no formato padronizado usado neste documento.

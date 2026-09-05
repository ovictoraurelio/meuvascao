# Meu Vascão

**O Vasco no peito. A torcida aqui.**

Portal independente, feito por torcedores, para acompanhar o Vasco e viver cada partida em comunidade.

- Domínio informado pelo fundador: `meuvascao.com`.
- Repositório informado: `git@github.com:ovictoraurelio/meuvascao.git`.
- Etapa: kickoff com planejamento e protótipo estático navegável (`0.1.0`). Backend e infraestrutura de produção ainda não implementados.
- Proposta inicial: 5 de setembro de 2026. Decisões abaixo estão propostas, não aprovadas definitivamente.

## Documentação

1. [Visão de produto e MVP](docs/01-produto.md)
2. [Identidade, experiência e operação editorial](docs/02-experiencia-editorial.md)
3. [Arquitetura e decisão técnica](docs/03-arquitetura.md)
4. [Roadmap, critérios de lançamento e decisões abertas](docs/04-execucao.md)
5. [Registro de kickoff e revisão inicial](docs/05-kickoff.md)

## Executar localmente

Pré-requisitos: Node.js 22 ou superior, npm e Python 3 (validado com Python 3.12). O protótipo usa HTML, CSS e JavaScript sem framework ou build. Astro/Cloudflare são a arquitetura proposta para o produto, ainda não adotada no código.

```sh
npm ci
npm run dev
```

Abrir [http://127.0.0.1:5173](http://127.0.0.1:5173). O servidor é apenas de desenvolvimento, limitado à máquina local. Encerrar com Ctrl+C.

## Verificar mudanças

```sh
npm run check
npx playwright install chromium
npm test
```

`npm run format` formata os arquivos. Os testes iniciam seu próprio servidor na porta 5174, que precisa estar livre. Em Linux, instalar as dependências do navegador com `npx playwright install --with-deps chromium`. O workflow de CI executa verificação e testes após push/PR; sua execução remota depende da publicação no GitHub.

## O que funciona no protótipo

Home responsiva, filtros de notícias, destaques, modais de conteúdo/jogo, curtidas, palpite demonstrativo, apelido, criação de tópicos e respostas. Apelido, reações, voto e conversas são guardados apenas no `localStorage` deste navegador e desta origem. Isso **não é autenticação nem um fórum compartilhado**. Se o armazenamento estiver bloqueado, as interações continuam apenas na sessão atual, com aviso.

Notícias, horários, adversários, percentuais e contagens iniciais são ilustrativos. Fontes Google Fonts e imagens genéricas do Unsplash são carregadas de terceiros; sua disponibilidade afeta a apresentação. As imagens não documentam eventos reais do Vasco. O acervo definitivo com créditos e condições de uso é uma pendência antes do lançamento.

Ainda não há agregação, API esportiva, login real, moderação, anúncios, publicação de notícias, banco ou deploy. A página usa `noindex` durante esta etapa; isso não substitui controle de acesso.

## Organização

- `index.html`, `style.css`, `app.js`: protótipo demonstrativo.
- `docs/`: visão, experiência, arquitetura proposta e execução.
- `tests/`: testes de interação e regressão com Playwright.
- `.github/workflows/ci.yml`: verificações para GitHub Actions.

Segredos e arquivos `.env` ficam fora do Git. Não há licença de distribuição escolhida nesta etapa; definir uma explicitamente antes de anunciar o projeto como open source.

## Premissas

Equipe pequena, prioridade para celular e operação sem servidores permanentes. Começar pelo futebol profissional masculino; ampliar a cobertura conforme houver responsáveis. O fundador escolheu agregação principalmente automatizada e admite crescimento do custo desde que a receita com anúncios sustente a operação. Não houve pesquisa com torcedores nem validação de demanda: metas e prazos são hipóteses de planejamento.

## Primeiro passo de implementação proposto

Validar o protótipo com torcedores e selecionar 3–5 fontes com integração e campos permitidos documentados. O layout atual explora a identidade: barra inferior, jogo em primeiro plano no celular, páginas permanentes e ações “Ler na fonte” / “Comentar” ainda precisam ser alinhados à experiência proposta. Em paralelo, validar ingestão, login e comentário no runtime escolhido antes de consolidar a stack e executar o MVP.

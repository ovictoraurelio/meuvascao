# Kickoff — Meu Vascão

Data: 05/09/2026. Marco: `0.1.0`, planejamento e protótipo demonstrativo.

## Parecer

A base está preparada para o primeiro commit do projeto. Este marco registra visão, escopo e uma exploração navegável da identidade. A liberação pública do MVP exige as entregas e critérios do [roadmap](04-execucao.md).

## Entregas do marco

- Visão, público, escopo P0/P1/P2 e metas experimentais documentados.
- Agregação automatizada e monetização com anúncios registradas como direções do fundador.
- Arquitetura proposta e alternativas, operação editorial, custos e riscos documentados.
- Protótipo HTML/CSS/JavaScript responsivo com notícias e comunidade demonstrativas.
- README com instalação, execução, verificações e limites da demonstração.
- Dependências de desenvolvimento fixadas e lockfile, formatação, `.editorconfig` e `.gitignore`.
- Testes de navegador e workflow para verificações no GitHub Actions.

## Ajustes da revisão inicial

1. Atualizado o README para distinguir a implementação estática atual da stack proposta.
2. Protegido o carregamento contra JSON inválido, estrutura inválida e armazenamento bloqueado.
3. Mantida interação temporária e aviso quando não for possível persistir dados.
4. Corrigida a contagem de respostas locais no fórum, inclusive após recarregar.
5. Corrigido estado acessível do menu móvel e nome acessível dos diálogos.
6. Ajustada exibição de apelidos longos e respeitada preferência por movimento reduzido.
7. Removida promessa de lance a lance da demonstração da central do jogo.
8. Adicionado `noindex` ao protótipo e restringido o servidor local ao loopback.
9. Formatados os arquivos para revisão e manutenção.

## Verificação

Resultado local em 05/09/2026: `npm run check` aprovado; `npm test` com 5 testes aprovados no Chromium do Playwright (5,4 s); links relativos da documentação válidos. A instalação reportou zero vulnerabilidades conhecidas nas dependências auditadas. Nenhum padrão de chave privada/token foi encontrado na busca dos arquivos candidatos ao commit; isso não constitui auditoria de segurança completa.

Os testes cobrem filtros/notícia/modal e reações persistentes; perfil/tópico/resposta com texto semelhante a HTML sem execução; dados locais inválidos; armazenamento bloqueado; navegação e largura móvel de 360 px. Imagens e fontes externas são bloqueadas nesses testes para evitar dependência de rede.

Inspeção visual adicional em 1440 px e 360 px com recursos externos habilitados: imagens carregaram, sem erros de JavaScript observados e sem rolagem horizontal da página. Essa inspeção não equivale a auditoria completa de acessibilidade, desempenho ou cobertura de todos os navegadores.

O workflow remoto só poderá ser validado após push. Nenhum serviço de nuvem ou anúncio foi ativado por esta revisão.

## Próxima entrega

Validar o protótipo com torcedores; confirmar fontes e campos autorizados; provar ingestão idempotente, autenticação e comentários no runtime escolhido. A barra inferior, o destaque prioritário de jogo no celular, os links diretos das fontes e as páginas permanentes fazem parte dessa evolução.

Antes do lançamento: responsáveis por edição/moderação, orçamento pré-receita, fontes integráveis, acervo visual definitivo, políticas da operação e estratégia comercial. A escolha de licença do repositório também permanece aberta.

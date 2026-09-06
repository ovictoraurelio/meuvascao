# Publicação para leitura

Sem `PUBLIC_SIGNUPS_ENABLED`, o site mantém cadastros abertos apenas em `development`. Em `preview` e `production`, a home e `/entrar` informam a indisponibilidade, mantêm o acesso à privacidade e não renderizam formulários de contato nem Turnstile. As Actions de cadastro de novidades e pedido de link mágico retornam 503 antes de validar campos, acessar D1 ou enviar e-mail.

A flag aceita a string `"true"` para abrir e `"false"` para fechar; valores diferentes também fecham. Configure a variável no ambiente correspondente somente quando cadastro, consentimento, proteção antispam e envio real estiverem prontos. O build precisa resolver o ambiente correto, conforme o runbook de deploy. A flag não substitui permissões das demais escritas, nem revoga sessões existentes.

`SESSION_SECRET` é obrigatório para assinar sessões fora de development. Sem ele, cookies recebidos são tratados como anônimos para preservar a leitura pública; nenhum segredo público é usado em preview. Desenvolvimento continua com segredo de teste local. Nunca publique o segredo de teste como variável de ambiente.

Preview canônico: `https://meuvascao-preview.ovictoraurelio.workers.dev`.

## Verificação local

Após `npm run build`, execute `tests/e2e/public-signups.api.spec.ts` com `E2E_ENVIRONMENT=preview` e com `E2E_ENVIRONMENT=production`. Os testes verificam 503 nas duas Actions e HTTP 200, ausência de formulários/Turnstile e link de privacidade nas duas páginas, inclusive com cookie arbitrário. Os testes unitários de sessão verificam que um cookie assinado pelo segredo público de desenvolvimento não é aceito nesses ambientes.

A suíte habitual de desenvolvimento continua exercitando cadastro e login abertos. Nenhum dado real ou segredo é necessário para esta verificação.

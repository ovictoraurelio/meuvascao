/// <reference types="astro/client" />

// worker-configuration.d.ts (gerado por `wrangler types`, gitignored) só inclui em `Env` os
// segredos presentes no `.dev.vars` de quem gerou os tipos localmente — sem o arquivo (como na
// CI), o tipo `Env` local não teria essas chaves, e um `.dev.vars` copiado do example criaria uma
// diferença de tipos entre ambientes. Declarar aqui (versionado) fecha essa diferença: em runtime
// o valor pode não existir, e por isso todo acesso passa por um cast explícito (src/lib/turnstile.ts,
// src/modules/identidade/session.ts) em vez de confiar no tipo.
interface Env {
  SESSION_SECRET?: string;
  RESEND_API_KEY?: string;
}

// O adaptador @astrojs/cloudflare declara App.Locals com `cfContext` (ExecutionContext).
// Variáveis e bindings vêm de `import { env } from "cloudflare:workers"` (ver src/lib/env.ts).
declare namespace App {
  interface Locals {
    /** Identificador curto da requisição, para correlacionar logs sem dados pessoais. */
    requestId: string;
    /**
     * Resultado da verificação stateless do cookie de sessão (assinatura + expiração), feita uma
     * vez no middleware — nulo sem cookie válido, sem nenhuma leitura de D1. Não confirma que a
     * sessão ainda existe/não foi revogada nem que a conta não está suspensa; quem precisa dessa
     * garantia consulta o banco (getAuthenticatedUser em @/modules/identidade).
     */
    session: { sid: string; uid: string; exp: number } | null;
  }
}

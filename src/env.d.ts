/// <reference types="astro/client" />

// O adaptador @astrojs/cloudflare declara App.Locals com `cfContext` (ExecutionContext).
// Variáveis e bindings vêm de `import { env } from "cloudflare:workers"` (ver src/lib/env.ts).
declare namespace App {
  interface Locals {
    /** Identificador curto da requisição, para correlacionar logs sem dados pessoais. */
    requestId: string;
  }
}

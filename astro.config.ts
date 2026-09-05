import cloudflare from "@astrojs/cloudflare";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: "https://meuvascao.com",
  output: "server",
  // Sem processamento de imagens na v1 (imagens externas com crédito) e sem sessões do Astro:
  // a sessão é nosso cookie assinado (fatia F6). Evita provisionar Images e KV automaticamente.
  adapter: cloudflare({ imageService: "passthrough" }),
  session: false,
  security: {
    // Rejeita POST/PUT/PATCH/DELETE cuja origem não seja o próprio site (CSRF).
    checkOrigin: true,
  },
});

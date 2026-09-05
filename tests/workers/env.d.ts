// O pool injeta as migrações lidas de ./migrations como binding para o setup aplicar.
declare namespace Cloudflare {
  interface Env {
    TEST_MIGRATIONS: import("cloudflare:test").D1Migration[];
  }
}

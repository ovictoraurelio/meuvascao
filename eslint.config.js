import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import astro from "eslint-plugin-astro";
import globals from "globals";
import tseslint from "typescript-eslint";

// Nenhum HTML montado por string em lugar nenhum: nós são criados com createElement/textContent.
const forbiddenHtmlSinks = [
  {
    selector: "MemberExpression[property.name='innerHTML']",
    message: "innerHTML é proibido: monte nós com createElement/textContent.",
  },
  {
    selector: "MemberExpression[property.name='outerHTML']",
    message: "outerHTML é proibido: monte nós com createElement/textContent.",
  },
  {
    selector: "CallExpression[callee.property.name='insertAdjacentHTML']",
    message:
      "insertAdjacentHTML é proibido: use insertAdjacentElement/textContent.",
  },
  {
    selector: "CallExpression[callee.property.name='setHTMLUnsafe']",
    message: "setHTMLUnsafe é proibido.",
  },
  {
    selector:
      "CallExpression[callee.object.name='document'][callee.property.name='write']",
    message: "document.write é proibido.",
  },
];

export default defineConfig([
  globalIgnores([
    "dist/",
    ".astro/",
    ".wrangler/",
    ".dry-run/",
    "node_modules/",
    "prototype/",
    "worker-configuration.d.ts",
    "test-results/",
    "playwright-report/",
    "coverage/",
    ".lighthouseci/",
    "backups/",
    "migrations/",
  ]),
  js.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  ...astro.configs.recommended,
  {
    // Ferramentas, configurações e testes de Node.
    files: [
      "scripts/**/*.{js,mjs,ts}",
      "*.config.{js,mjs,ts}",
      "tests/unit/**/*.ts",
      "tests/e2e/**/*.ts",
      "tests/gates/**/*.ts",
    ],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    // Código do Worker roda na plataforma web (fetch, Response, crypto), não em Node.
    files: ["src/**/*.ts", "tests/workers/**/*.ts"],
    languageOptions: { globals: { ...globals.serviceworker } },
  },
  {
    // Ilhas rodam no navegador.
    files: ["src/islands/**/*.ts"],
    languageOptions: { globals: { ...globals.browser } },
  },
  {
    // Sinks de HTML proibidos em todo o código do app, inclusive nos <script> de arquivos .astro
    // (o plugin do Astro os expõe como arquivos virtuais *.astro/*.ts).
    files: ["src/**/*.{ts,mts,js,mjs}", "src/**/*.astro/*.ts"],
    rules: { "no-restricted-syntax": ["error", ...forbiddenHtmlSinks] },
  },
  {
    // set:html só com justificativa explícita (eslint-disable com motivo), nunca por padrão.
    files: ["**/*.astro"],
    rules: { "astro/no-set-html-directive": "error" },
  },
  {
    // Apresentação não acessa domínio nem banco.
    files: ["src/components/**", "src/islands/**", "src/layouts/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "**/modules/**",
                "**/lib/db/**",
                "@/modules/**",
                "@/lib/db/**",
              ],
              message:
                "Componentes, layouts e ilhas não importam módulos de domínio nem banco.",
            },
          ],
        },
      ],
    },
  },
  {
    // Um módulo fala com o vizinho pelo index.ts, nunca pelo repositório dele.
    files: ["src/modules/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "../*/*.repo",
                "../*/*.repo.ts",
                "@/modules/*/*.repo",
                "@/modules/*/*.repo.ts",
              ],
              message:
                "Importe o index.ts do módulo vizinho, não o repositório.",
            },
          ],
        },
      ],
    },
  },
]);

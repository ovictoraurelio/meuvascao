import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import astro from "eslint-plugin-astro";
import globals from "globals";
import tseslint from "typescript-eslint";

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
    "migrations/",
  ]),
  js.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  ...astro.configs.recommended,
  {
    files: ["**/*.{ts,mts,js,mjs}"],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    // Ilhas rodam no navegador e nunca injetam HTML.
    files: ["src/islands/**/*.ts"],
    languageOptions: { globals: { ...globals.browser } },
    rules: { "no-restricted-syntax": ["error", ...forbiddenHtmlSinks] },
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

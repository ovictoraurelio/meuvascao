/** @type {import("stylelint").Config} */
export default {
  extends: ["stylelint-config-standard"],
  plugins: ["stylelint-declaration-strict-value"],
  rules: {
    // Toda cor e toda fonte vêm de tokens (var(--…)); nenhum hex solto fora de tokens.css.
    "color-no-hex": true,
    "scale-unlimited/declaration-strict-value": [
      ["/color$/", "fill", "stroke", "font-family", "font-size"],
      {
        ignoreValues: [
          "currentColor",
          "transparent",
          "inherit",
          "initial",
          "unset",
          "none",
          "0",
        ],
      },
    ],
    // Tamanho de fonte em rem, derivado da escala de tokens; nunca em px.
    "declaration-property-unit-disallowed-list": { "font-size": ["px"] },
    "selector-class-pattern": null,
    "custom-property-pattern": null,
  },
  overrides: [
    {
      files: ["src/styles/tokens.css"],
      rules: {
        "color-no-hex": null,
        "scale-unlimited/declaration-strict-value": null,
      },
    },
  ],
};

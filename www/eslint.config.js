const js = require("@eslint/js");
const tseslint = require("typescript-eslint");
const prettier = require("eslint-config-prettier");
const globals = require("globals");

module.exports = tseslint.config(
  { ignores: ["dist/**", "build/**", "node_modules/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    files: ["src/**/*.{js,ts}"],
    languageOptions: { globals: globals.browser }
  },
  {
    files: ["*.js"],
    languageOptions: { globals: globals.node },
    rules: { "@typescript-eslint/no-require-imports": "off" }
  }
);

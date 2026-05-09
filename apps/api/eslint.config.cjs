const js = require("@eslint/js");
const tseslint = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");

module.exports = [
  js.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        process: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        fetch: "readonly",
        NodeJS: "readonly",
        require: "readonly",
        module: "readonly",
        __dirname: "readonly",
        __filename: "readonly"
      }
    },
    plugins: {
      "@typescript-eslint": tseslint
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["error", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_",
        "ignoreRestSiblings": true
      }],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-empty-function": "warn",
      "no-console": "off"
    }
  }
];
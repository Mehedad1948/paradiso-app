import { defineConfig, globalIgnores } from "eslint/config";
import react from "eslint-plugin-react";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import globals from "globals";

export default defineConfig([
  globalIgnores([
    "public/*",
    "dist/*",
    ".next/*",
    "node_modules/*",
    "**/*.css",
    "**/*.config.js",
    "**/.DS_Store",
  ]),
  {
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },

    plugins: {
      react,
      "@typescript-eslint": typescriptEslint,
    },

    settings: {
      react: {
        version: "detect",
      },
    },

    files: ["**/*.ts", "**/*.tsx"],

    rules: {
      // Basic dev sanity
      "no-console": "warn",
      "no-unused-vars": "off",

      // Typescript
      "@typescript-eslint/no-unused-vars": ["warn", {
        args: "after-used",
        argsIgnorePattern: "^_",
        ignoreRestSiblings: true,
      }],

      // React-specific
      "react/prop-types": "off",
      "react/jsx-uses-react": "off",
      "react/react-in-jsx-scope": "off",
    },
  }
]);

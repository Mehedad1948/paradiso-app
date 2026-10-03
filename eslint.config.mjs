import { defineConfig, globalIgnores } from "eslint/config";
import react from "eslint-plugin-react";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import globals from "globals";
import unusedImports from "eslint-plugin-unused-imports";

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
      "unused-imports": unusedImports,
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
      "unused-imports/no-unused-imports": "warn",

      // Typescript
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          args: "after-used",
          argsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],

      // React-specific
      "react/prop-types": "off",
      "react/jsx-uses-react": "off",
      "react/react-in-jsx-scope": "off",
    },
  },
  {
    files: [
      "app/(pages)/(panel)/**/*.{ts,tsx}",
      "features/**/*.{ts,tsx}",
      "hooks/queries/**/*.{ts,tsx}",
      "hooks/auth/**/*.{ts,tsx}",
      "app/auth/**/*.{ts,tsx}",
      "lib/api/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/services",
                "@/services/**",
                "@/app/actions/**",
                "**/actions/**",
              ],
              message:
                "Panel data must go through React Query hooks and the BFF client.",
            },
          ],
        },
      ],
    },
  },
]);

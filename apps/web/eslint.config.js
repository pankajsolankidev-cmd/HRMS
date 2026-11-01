import tsParser from "@typescript-eslint/parser";
import tseslint from "@typescript-eslint/eslint-plugin";
import unusedImports from "eslint-plugin-unused-imports";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist", "build", "node_modules"]),

  {
    files: ["**/*.{js,jsx,ts,tsx}"],

    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2020,
    },

    plugins: {
      "@typescript-eslint": tseslint,
      "unused-imports": unusedImports,
    },

    rules: {
      // ✅ remove unused imports
      "unused-imports/no-unused-imports": "error",

      // ⚠️ warn unused vars (allow _var)
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],

      // ❌ disable default rules
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
]);

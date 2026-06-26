import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // ── Global ignores ────────────────────────────────
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "generated/**",
    "vitest.workspace.ts",
  ]),

  // ── Disable react rules for ESLint 10 compatibility ─
  // eslint-plugin-react is not fully compatible with ESLint 10 flat config.
  // These rules are disabled to prevent crashes.
  // TODO: Re-enable once eslint-plugin-react adds ESLint 10 flat config support.
  {
    rules: {
      "react/display-name": "off",
      "react/no-direct-mutation-state": "off",
      "react/jsx-no-target-blank": "off",
      "react/jsx-no-comment-textnodes": "off",
      "react/jsx-no-duplicate-props": "off",
      "react/no-children-prop": "off",
      "react/no-danger-with-children": "off",
      "react/no-deprecated": "off",
      "react/no-find-dom-node": "off",
      "react/no-is-mounted": "off",
      "react/no-render-return-value": "off",
      "react/no-string-refs": "off",
      "react/no-unescaped-entities": "off",
      "react/no-unknown-property": "off",
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      "react/require-render-return": "off",
    },
  },

  // ── Project-specific rules (ESLint 10.5+ syntax) ─
  {
    rules: {
      // ── Module boundary constraints ──────────────────
      // ESLint 10.5+ uses `patterns[].group` (gitignore-style glob)
      // to restrict imports, replacing the old `patterns` array syntax.
      //
      // Allowed:
      //   @/features/{module}        → index.ts barrel
      //   @/features/{module}/client → client.ts sub-barrel
      // Restricted:
      //   @/features/{module}/components/**
      //   @/features/{module}/actions.ts
      //   @/features/{module}/queries.ts
      //   @/features/{module}/types.ts
      //   @/features/{module}/validations.ts
      //   @/features/{module}/middleware.ts
      //   @/features/{module}/agent/**
      "no-restricted-imports": ["warn", {
        patterns: [
          {
            group: [
              "@/features/*/components/**",
              "@/features/*/actions.ts",
              "@/features/*/queries.ts",
              "@/features/*/types.ts",
              "@/features/*/validations.ts",
              "@/features/*/middleware.ts",
              "@/features/*/agent/**",
            ],
            message: "模块内的内部文件只能通过桶文件（index.ts 或 client.ts）访问。请使用 @/features/{module-name} 代替。",
          },
        ],
      }],

      // ── TypeScript: tune no-unused-vars ───────────
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      }],
    },
  },

  // ── Test files: relax rules ───────────────────────
  {
    files: ["**/*.{test,spec}.{ts,tsx}", "**/__tests__/**", "**/__mocks__/**"],
    rules: {
      // Allow direct imports in test files (for unit testing internal functions)
      "no-restricted-imports": "off",
      // Allow require() imports in test files (for mocking)
      "@typescript-eslint/no-require-imports": "off",
      // Relax unused vars for test files
      "@typescript-eslint/no-unused-vars": "off",
      // Relax Next.js rules for test files (allow <img>, etc.)
      "@next/next/no-img-element": "off",
      // Relax a11y rules for test files
      "jsx-a11y/alt-text": "off",
    },
  },
]);

export default eslintConfig;

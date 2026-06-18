import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // eslint-plugin-react 与 ESLint 10 不兼容，禁用所有 react 规则防止崩溃
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
  // ── 模块边界规则 ──────────────────────────────────────────────
  // 禁止 features 模块之间深度导入内部路径，只能通过 barrel 文件（index.ts）访问
  {
    rules: {
      "no-restricted-imports": [
        "warn",
        {
          patterns: [
            // 禁止从 features 模块导入内部路径（components/, actions.ts, queries.ts, types.ts, validations.ts）
            // 只允许导入 index.ts（桶文件）
            {
              group: [
                "**/features/auth/components/**",
                "**/features/auth/actions*",
                "**/features/auth/queries*",
                "**/features/auth/types*",
                "**/features/auth/validations*",
                "**/features/auth/middleware*",
                "**/features/hospital/components/**",
                "**/features/hospital/actions*",
                "**/features/hospital/queries*",
                "**/features/hospital/types*",
                "**/features/hospital/validations*",
                "**/features/registration/components/**",
                "**/features/registration/actions*",
                "**/features/registration/queries*",
                "**/features/registration/types*",
                "**/features/registration/validations*",
                "**/features/chat/components/**",
                "**/features/chat/actions*",
                "**/features/chat/queries*",
                "**/features/chat/types*",
                "**/features/chat/agent/**",
                "**/features/chat/tools/**",
                "**/features/chat/prompts/**",
                "**/features/admin/components/**",
                "**/features/admin/actions*",
                "**/features/admin/queries*",
                "**/features/admin/types*",
                "**/features/home/components/**",
              ],
              message:
                "模块内的内部文件只能通过桶文件（index.ts）访问。请使用 @/features/{module-name} 代替。",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;

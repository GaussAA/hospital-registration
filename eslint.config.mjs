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
  // TODO: ESLint 10.5 的 no-restricted-imports 语法已变更，
  // 需使用 { paths: [...] } 格式重新实现模块边界约束
  // 当前暂不启用，待确认 ESLint 10 的正确配置语法后补充
  // 開發時請自覺遵守：模块间互调仅通过 barrel 文件（index.ts）
]);

export default eslintConfig;

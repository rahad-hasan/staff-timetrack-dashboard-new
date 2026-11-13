import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              // zod's default export is the whole namespace object, so the
              // bundler must keep every export — ~40 locales, 34 KB gz — in
              // any client chunk that uses it at runtime.
              name: "zod",
              importNames: ["default"],
              message: 'Use `import { z } from "zod"` (the default import bundles every zod locale).',
            },
          ],
        },
      ],
    },
  },
  {
    // Support screens: one AA keyboard focus indicator (FOCUS_RING / FOCUS_RING_INSET /
    // FOCUS_RING_ON_BLUE in components/Support/primitives/tokens.ts) — the ad-hoc translucent
    // rings it replaced measured 1.28–1.89:1 (WCAG 1.4.11).
    files: ["src/components/Support/**/*.{ts,tsx}", "src/app/(main_layout)/support/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/focus-visible:(ring|outline)-\\[#/]",
          message: "Use FOCUS_RING / FOCUS_RING_INSET / FOCUS_RING_ON_BLUE from Support/primitives (one AA focus indicator).",
        },
        {
          selector: "TemplateElement[value.raw=/focus-visible:(ring|outline)-\\[#/]",
          message: "Use FOCUS_RING / FOCUS_RING_INSET / FOCUS_RING_ON_BLUE from Support/primitives (one AA focus indicator).",
        },
      ],
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      ".next-agent/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;

import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Mirror the `@/*` alias from tsconfig.json so tests import the way app code does.
    alias: [
      {
        find: /^@\//,
        replacement: fileURLToPath(new URL("./", import.meta.url)),
      },
    ],
  },
  test: {
    // React component tests need a DOM; JSX comes from tsconfig's "jsx": "react-jsx".
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    // Tests live beside the source they cover.
    include: ["**/*.test.{ts,tsx}"],
    exclude: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "design/**",
    ],
  },
});

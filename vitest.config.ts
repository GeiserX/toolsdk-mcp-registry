import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    testTimeout: 10000,

    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts"],
      exclude: [
        "node_modules/",
        "dist/",
        "**/*.test.ts",
        "**/*.spec.ts",
        "**/*-types.ts",
        "**/*-schema.ts",
        "**/*-route.ts",
        "**/index.ts",
        "src/api/**",
        "src/domains/mcp-gateway/**",
        "src/domains/sandbox/clients/**",
        "src/domains/executor/local-executor.ts",
        "src/domains/executor/sandbox-executor.ts",
        "src/domains/search/**",
        "src/domains/package/package-handler.ts",
        "src/domains/package/package-repository.ts",
        "src/shared/scripts-helpers/**",
        "src/shared/utils/mcp-client-util.ts",
        "src/shared/utils/file-util.ts",
        "src/shared/utils/package-util.ts",
        "src/shared/utils/validation-util.ts",
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },

    setupFiles: ["./vitest.setup.ts"],

    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/packages/**",
      "**/indexes/**",
      "**/.{idea,git,cache,output,temp}/**",
    ],
  },
});

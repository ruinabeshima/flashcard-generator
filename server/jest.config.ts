import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  clearMocks: true,
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  testMatch: ["**/tests/**/*.test.ts"],
  collectCoverageFrom: ["**/*.ts", "!**/*.d.ts", "!**/tests/**", "!**/prisma/generated/**"],
  coverageThreshold: {
    global: {
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80,
    },
  },
};

export default config;

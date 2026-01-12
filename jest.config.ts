import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", { useESM: true }],
  },
  moduleNameMapper: {
    "^(.*)\\.js$": "$1",
  },
  testMatch: ["**/__tests__/**/*.test.ts"],
  verbose: true,
};

export default config;

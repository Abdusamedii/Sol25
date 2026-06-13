import { defineConfig } from 'vitest/config';

const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/sol25_test';

export default defineConfig({
  test: {
    env: {
      DATABASE_URL: testDatabaseUrl,
      NODE_ENV: 'test',
    },
    exclude: ['dist/**', 'node_modules/**'],
    fileParallelism: false,
  },
});

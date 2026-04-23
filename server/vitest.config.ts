import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    env: {
      NODE_ENV: 'test',
    },
    sequence: {
      concurrent: false,
    },
    testTimeout: 15000,
    hookTimeout: 15000,
  },
});

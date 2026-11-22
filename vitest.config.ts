import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    // Keep test-generated writes out of Turbopack's watched dependency tree.
    fsModuleCachePath: fileURLToPath(
      new URL('./.next/cache/vitest', import.meta.url),
    ),
    maxWorkers: 4,
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,mjs}'],
    setupFiles: ['./tests/setup.ts'],
    clearMocks: true,
    restoreMocks: true,
  },
});

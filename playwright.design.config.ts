import base from './playwright.responsive.config';
import { defineConfig } from '@playwright/test';

export default defineConfig({
  ...base,
  testMatch: ['design-preview.spec.ts'],
  timeout: 90_000,
  use: { ...base.use, actionTimeout: 10_000 },
  outputDir: 'test-results/design-preview',
  reporter: [
    ['list'],
    [
      'html',
      { outputFolder: 'playwright-report/design-preview', open: 'never' },
    ],
  ],
});

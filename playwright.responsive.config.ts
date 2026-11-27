import { defineConfig, devices } from '@playwright/test';

/** Run against a production build so development compilation cannot mask UI issues. */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  testMatch: [
    'responsive-workspaces.spec.ts',
    'responsive-onboarding.spec.ts',
    'locations.spec.ts',
  ],
  timeout: 180_000,
  workers: 3,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report/responsive', open: 'never' }],
  ],
  outputDir: 'test-results/responsive',
  use: {
    baseURL: 'http://127.0.0.1:3015',
    viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npm run start -- --hostname 127.0.0.1 --port 3015',
    url: 'http://127.0.0.1:3015/api/health',
    reuseExistingServer: false,
    timeout: 60_000,
  },
});

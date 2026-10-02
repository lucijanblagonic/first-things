// @ts-check
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    // Existing specs must not be affected by sw.js; tests/e2e/pwa.spec.js opts back in.
    serviceWorkers: 'block',
    // Specs start from an empty board that has already been saved once, not
    // from a first visit (which seeds example tasks). tests/e2e/demo.spec.js
    // opts out to cover the first visit.
    storageState: {
      cookies: [],
      origins: [
        {
          origin: 'http://localhost:4173',
          localStorage: [{ name: 'decision-matrix:data', value: '{"version":1,"tasks":[]}' }],
        },
      ],
    },
  },
  webServer: {
    command: 'npm run serve',
    port: 4173,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});

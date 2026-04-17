import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  // Next.js dev-server HMR races when multiple RSC pages compile in parallel;
  // running tests serially keeps the suite stable. CI can bump this up.
  workers: process.env.CI ? 2 : 1,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: 'http://localhost:3050',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3050',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
})

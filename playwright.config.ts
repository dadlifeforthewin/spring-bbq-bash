import { defineConfig } from '@playwright/test'
import { loadEnv } from 'vite'

// Mirror vitest.config.ts: load .env.local into the test process so specs can
// read VOLUNTEER_PASSWORD, etc. Next.js already loads these into the dev server.
Object.assign(process.env, loadEnv('', process.cwd(), ''))

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

import { test, expect } from '@playwright/test'
import { loginVolunteer } from './helpers/volunteer'

test.describe('Station picker (authed)', () => {
  test.beforeEach(async ({ page }) => {
    const pw = process.env.VOLUNTEER_PASSWORD
    test.skip(!pw, 'VOLUNTEER_PASSWORD env var not set — skipping station-picker specs')
    await loginVolunteer(page, pw!)
  })

  test('hero wordmark renders', async ({ page }) => {
    await page.goto('/station')
    await expect(page.getByText(/VOLUNTEER HUB/i)).toBeVisible()
    await expect(page.getByRole('heading', { name: /BASH.*GLOW/i })).toBeVisible()
  })

  test('writes slug to localStorage and navigates on tap', async ({ page }) => {
    await page.goto('/station')
    await page.getByRole('button', { name: /Drinks/i }).click()
    await page.waitForURL(/\/station\/activity/)
    const stored = await page.evaluate(() => localStorage.getItem('sbbq_station'))
    expect(stored).toBe('drinks')
  })
})

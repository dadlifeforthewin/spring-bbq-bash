import { test, expect } from '@playwright/test'

test('wrong volunteer password stays on login page', async ({ page }) => {
  await page.goto('/station')
  await page.getByLabel(/volunteer password/i).fill('definitely-not-the-password-xyz123')
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page.getByText(/wrong password/i)).toBeVisible()
  await expect(page.getByRole('heading', { name: /volunteer sign-in/i })).toBeVisible()
})

test('correct volunteer password loads the station picker', async ({ page }) => {
  const pw = process.env.VOLUNTEER_PASSWORD
  test.skip(!pw, 'VOLUNTEER_PASSWORD env var not set — skipping happy path')

  await page.goto('/station')
  await page.getByLabel(/volunteer password/i).fill(pw!)
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page.getByRole('heading', { name: /pick your station/i })).toBeVisible()
  // Sanity: at least the check-in station button exists
  await expect(page.getByRole('button', { name: /check-in/i })).toBeVisible()
})

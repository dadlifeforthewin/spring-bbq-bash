import { test, expect } from '@playwright/test'

test('parent registers one child successfully', async ({ page }) => {
  await page.goto('/register')

  const primary = page.getByRole('group', { name: /primary parent/i })
  await primary.getByLabel(/^name$/i).fill('Jane Carter')
  await primary.getByLabel(/^phone$/i).fill('555-111-2222')
  await primary.getByLabel(/^email/i).fill(`jane${Date.now()}@test.com`)

  await page.getByLabel(/first name/i).fill('Maya')
  await page.getByLabel(/last name/i).fill('Carter')
  await page.getByLabel(/^age$/i).fill('7')

  // Waiver
  await page.getByLabel('Type your full name to sign', { exact: true }).fill('Jane Carter')
  await page.getByLabel(/electronically sign this permission slip/i).check()

  // Photo consents
  await page.getByLabel(/include my child in photo memories/i).check()
  await page.getByLabel(/for LCA promotional/i).check()
  await page.getByLabel(/auto-identify my child/i).check()
  await page.getByLabel(/photo consent signature/i).fill('Jane Carter')

  // AI & data use disclosure
  await page.getByLabel(/opt in to AI processing/i).check()
  await page.getByLabel('Type your full name to sign this AI disclosure', { exact: true }).fill('Jane Carter')
  await page.getByLabel(/electronically sign this AI/i).check()

  await page.getByRole('button', { name: /submit permission slip/i }).click()
  await expect(page).toHaveURL(/\/register\/confirm/)
})

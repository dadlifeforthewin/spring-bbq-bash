import type { Page } from '@playwright/test'

export async function loginAdmin(page: Page, password: string) {
  await page.goto('/admin')
  await page.getByLabel(/admin password/i).fill(password)
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.getByRole('link', { name: /children/i }).waitFor({ timeout: 5000 })
}

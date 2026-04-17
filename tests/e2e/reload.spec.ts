import { test, expect } from '@playwright/test'
import { registerChild, loginVolunteer, apiCheckIn } from './helpers/volunteer'

test('volunteer reloads tickets via cash', async ({ page, request }) => {
  const pw = process.env.VOLUNTEER_PASSWORD
  test.skip(!pw, 'VOLUNTEER_PASSWORD env var not set')

  const { child_id, qr_code } = await registerChild(request, { first_name: 'ReloadKid' })
  await loginVolunteer(page, pw!)
  await apiCheckIn(page, child_id)

  await page.goto('/station/reload')
  await page.getByLabel(/qr code/i).fill(qr_code)
  await page.getByRole('button', { name: /look up/i }).click()
  await expect(page.getByText(/ReloadKid/)).toBeVisible()

  await page.getByLabel(/tickets to add/i).fill('5')
  await page.getByLabel(/amount charged/i).fill('5')
  // Cash is the default method, but click to be deterministic
  await page.getByRole('button', { name: /^cash$/i }).click()
  await page.getByLabel(/staff name/i).fill('Volunteer C')
  await page.getByRole('button', { name: /^Add 5/ }).click()

  await expect(page.getByText(/balance \d+/i)).toBeVisible()
})

test('FACTS allowance caps the reload', async ({ page, request }) => {
  const pw = process.env.VOLUNTEER_PASSWORD
  test.skip(!pw, 'VOLUNTEER_PASSWORD env var not set')

  const { child_id } = await registerChild(request, {
    first_name: 'FactsKid',
    facts_reload_permission: true,
    facts_max_amount: 5,
  })
  await loginVolunteer(page, pw!)
  await apiCheckIn(page, child_id)

  // Burn the FACTS cap
  const first = await page.request.post('/api/reload', {
    data: { child_id, tickets_added: 5, payment_method: 'facts', amount_charged: 5, staff_name: 'Bot' },
  })
  expect(first.ok()).toBeTruthy()

  // Next FACTS reload should 403
  const capped = await page.request.post('/api/reload', {
    data: { child_id, tickets_added: 1, payment_method: 'facts', amount_charged: 1, staff_name: 'Bot' },
  })
  expect(capped.status()).toBe(403)
  const body = await capped.json()
  expect(body.error).toMatch(/FACTS allowance exceeded/i)
})

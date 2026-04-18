import { test, expect } from '@playwright/test'
import { registerChild, loginVolunteer, apiCheckIn } from './helpers/volunteer'

// Post-rebuild: /api/reload now tops up drink_tickets_remaining (the only metered bucket
// that can be reloaded). Jail / prize wheel / DJ are fixed and cannot be refilled.

test('cash reload adds to drink_tickets_remaining', async ({ page, request }) => {
  const pw = process.env.VOLUNTEER_PASSWORD
  test.skip(!pw, 'VOLUNTEER_PASSWORD env var not set')

  const { child_id } = await registerChild(request, { first_name: 'ReloadKid' })
  await loginVolunteer(page, pw!)
  await apiCheckIn(page, child_id)

  // Default is 2; add 3 more
  const res = await page.request.post('/api/reload', {
    data: { child_id, tickets_added: 3, payment_method: 'cash', amount_charged: 3, staff_name: 'Bot' },
  })
  expect(res.ok()).toBeTruthy()
  const body = await res.json()
  expect(body.drink_tickets).toBe(5)

  const status = await page.request.get(`/api/reload?child_id=${child_id}`)
  const statusBody = await status.json()
  expect(statusBody.drink_tickets).toBe(5)
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

  const first = await page.request.post('/api/reload', {
    data: { child_id, tickets_added: 5, payment_method: 'facts', amount_charged: 5, staff_name: 'Bot' },
  })
  expect(first.ok()).toBeTruthy()

  const capped = await page.request.post('/api/reload', {
    data: { child_id, tickets_added: 1, payment_method: 'facts', amount_charged: 1, staff_name: 'Bot' },
  })
  expect(capped.status()).toBe(403)
  const body = await capped.json()
  expect(body.error).toMatch(/FACTS allowance exceeded/i)
})

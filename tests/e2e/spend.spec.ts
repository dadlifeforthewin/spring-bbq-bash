import { test, expect } from '@playwright/test'
import { registerChild, loginVolunteer, apiCheckIn } from './helpers/volunteer'

// Post-rebuild: /api/spend is deprecated. Activity goes through /api/stations/activity
// with station-specific logic. "Drinks" is the metered spend analog (2 per kid).

test('volunteer redeems a drink ticket', async ({ page, request }) => {
  const pw = process.env.VOLUNTEER_PASSWORD
  test.skip(!pw, 'VOLUNTEER_PASSWORD env var not set')

  const { child_id } = await registerChild(request, { first_name: 'DrinkKid' })
  await loginVolunteer(page, pw!)
  await apiCheckIn(page, child_id)

  // Kid starts with 2 drink tickets (schema default)
  const first = await page.request.post('/api/stations/activity', {
    data: { child_id, station: 'drinks' },
  })
  expect(first.ok()).toBeTruthy()
  const firstBody = await first.json()
  expect(firstBody.balance.drink_tickets).toBe(1)

  const second = await page.request.post('/api/stations/activity', {
    data: { child_id, station: 'drinks' },
  })
  expect(second.ok()).toBeTruthy()
  const secondBody = await second.json()
  expect(secondBody.balance.drink_tickets).toBe(0)

  // Third drink should fail — no tickets left
  const third = await page.request.post('/api/stations/activity', {
    data: { child_id, station: 'drinks' },
  })
  expect(third.status()).toBe(409)
  const thirdBody = await third.json()
  expect(thirdBody.error).toMatch(/no drink tickets/i)
})

test('free stations log a visit but do not deduct anything', async ({ page, request }) => {
  const pw = process.env.VOLUNTEER_PASSWORD
  test.skip(!pw, 'VOLUNTEER_PASSWORD env var not set')

  const { child_id, qr_code } = await registerChild(request, { first_name: 'CornholeKid' })
  await loginVolunteer(page, pw!)
  await apiCheckIn(page, child_id)

  const res = await page.request.post('/api/stations/activity', {
    data: { child_id, station: 'cornhole' },
  })
  expect(res.ok()).toBeTruthy()
  const body = await res.json()
  expect(body.kind).toBe('free_visit')

  // Timeline should carry the visit for the keepsake email
  const tl = await page.request.get(`/api/children/by-qr/${encodeURIComponent(qr_code)}/timeline`)
  const tlBody = await tl.json()
  const hit = tlBody.events.find((e: { station: string }) => e.station === 'cornhole')
  expect(hit).toBeTruthy()
})

test('legacy /api/spend is gone (410)', async ({ request }) => {
  const res = await request.post('/api/spend', { data: {} })
  expect(res.status()).toBe(410)
})

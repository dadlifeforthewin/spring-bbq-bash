import { test, expect } from '@playwright/test'
import { registerChild, loginVolunteer, apiCheckIn } from './helpers/volunteer'

test('volunteer spends tickets at a station', async ({ page, request, context }) => {
  const pw = process.env.VOLUNTEER_PASSWORD
  test.skip(!pw, 'VOLUNTEER_PASSWORD env var not set')

  const { child_id, qr_code } = await registerChild(request, { first_name: 'SpenderKid' })
  await loginVolunteer(page, pw!)
  await apiCheckIn(page, child_id)

  // Pick a station that has catalog items — cornhole has "Game (3 tosses)" seeded at 2 🎟
  await context.addInitScript(() => {
    localStorage.setItem('sbbq_station', 'cornhole')
  })

  await page.goto('/station/spend')
  await page.getByLabel(/qr code/i).fill(qr_code)
  await page.getByRole('button', { name: /look up/i }).click()
  await expect(page.getByText(/SpenderKid/)).toBeVisible()

  // Click the first catalog item
  await page.getByRole('button', { name: /game \(3 tosses\)/i }).click()
  // Confirm modal
  await page.getByRole('button', { name: /^confirm$/i }).click()

  await expect(page.getByText(/spent 2 🎟 on game \(3 tosses\)/i)).toBeVisible()
})

test('insufficient balance blocks a spend', async ({ page, request, context }) => {
  const pw = process.env.VOLUNTEER_PASSWORD
  test.skip(!pw, 'VOLUNTEER_PASSWORD env var not set')

  const { child_id } = await registerChild(request, { first_name: 'BrokeKid' })
  await loginVolunteer(page, pw!)
  await apiCheckIn(page, child_id)

  // Drain balance by spending 10 tickets' worth at cornhole via direct API calls
  // (cornhole game is 2 tickets — five purchases takes them to 0, then one more fails)
  const catRes = await page.request.get('/api/catalog?station=cornhole')
  const cat = await catRes.json()
  const item = cat.items[0]
  for (let i = 0; i < 5; i++) {
    const ok = await page.request.post('/api/spend', {
      data: { child_id, station: 'cornhole', catalog_item_id: item.id },
    })
    expect(ok.ok()).toBeTruthy()
  }
  const blocked = await page.request.post('/api/spend', {
    data: { child_id, station: 'cornhole', catalog_item_id: item.id },
  })
  expect(blocked.status()).toBe(409)
  const body = await blocked.json()
  expect(body.error).toMatch(/insufficient tickets/i)

  void context // lint: touch context so the fixture is used
})

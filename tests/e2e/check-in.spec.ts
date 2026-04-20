import { test, expect } from '@playwright/test'

test('volunteer checks in a child via QR', async ({ page, request }) => {
  const pw = process.env.VOLUNTEER_PASSWORD
  test.skip(!pw, 'VOLUNTEER_PASSWORD env var not set — skipping check-in happy path')

  // Register a child first and capture the qr_code
  const email = `checkin-${Date.now()}@test.com`
  const regRes = await request.post('/api/register', {
    data: {
      primary_parent: { name: 'Check-in Parent', phone: '555-999-0000', email },
      secondary_parent: null,
      children: [{
        first_name: 'CheckIn', last_name: 'Kid', age: 8, grade: '3rd',
        allergies: '', special_instructions: '',
        pickup_authorizations: [],
        facts_reload_permission: true, facts_max_amount: 10,
      }],
      waiver_signature: { typed_name: 'Check-in Parent' },
      photo_consent_app: true,
      photo_consent_promo: false,
      vision_matching_consent: false,
      photo_signature: { typed_name: 'Check-in Parent' },
      ai_consent_signature: { typed_name: 'Check-in Parent' },
      ai_consent_granted: true,
    },
  })
  expect(regRes.ok()).toBeTruthy()
  const regBody = await regRes.json()
  const qr: string = regBody.created[0].qr_code

  // Log in as volunteer
  await page.goto('/station')
  await page.getByLabel(/volunteer password/i).fill(pw!)
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page.getByRole('heading', { name: /BASH.*GLOW/i })).toBeVisible()

  // Go to check-in
  await page.goto('/station/check-in')
  await page.getByLabel(/qr code/i).fill(qr)
  await page.getByRole('button', { name: /look up/i }).click()
  await expect(page.getByText(/CheckIn Kid/)).toBeVisible()

  // Staff name + mugshot + dropoff + check in
  await page.getByLabel(/staff name/i).fill('Volunteer A')
  await page.getByRole('button', { name: /take mugshot/i }).click()
  await expect(page.getByRole('button', { name: /mugshot saved/i })).toBeVisible()
  await page.getByLabel(/both parents/i).check()
  await page.getByRole('button', { name: /^check in$/i }).click()
  await expect(page.getByText(/checked in! next kid/i)).toBeVisible()
})

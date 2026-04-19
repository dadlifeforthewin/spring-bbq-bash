import { test, expect } from '@playwright/test'

// Generate a random UUID v4 — mimics a wristband's pre-printed code
function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

test('walk-up registration binds to the pre-printed QR code', async ({ page, request }) => {
  const qr = uuid()
  await page.goto(`/register/walkup/${qr}`)

  const primary = page.getByRole('group', { name: /primary parent/i })
  await primary.getByLabel(/^name$/i).fill('Sam Walker')
  await primary.getByLabel(/^phone$/i).fill('555-333-4444')
  await primary.getByLabel(/^email/i).fill(`sam${Date.now()}@test.com`)

  await page.getByLabel(/first name/i).fill('Lou')
  await page.getByLabel(/last name/i).fill('Walker')
  await page.getByLabel(/^age$/i).fill('6')

  await page.getByLabel('Type your full name to sign', { exact: true }).fill('Sam Walker')
  await page.getByLabel(/electronically sign this permission slip/i).check()

  await page.getByLabel(/include my child in photo memories/i).check()
  await page.getByLabel(/photo consent signature/i).fill('Sam Walker')

  // AI & data use disclosure
  await page.getByLabel(/opt in to AI processing/i).check()
  await page.getByLabel('Type your full name to sign this AI disclosure', { exact: true }).fill('Sam Walker')
  await page.getByLabel(/electronically sign this AI/i).check()

  await page.getByRole('button', { name: /submit permission slip/i }).click()
  await expect(page).toHaveURL(/\/register\/confirm/)

  // Verify qr binding via a separate programmatic walkup POST (UI path above already hit confirm)
  const qr2 = uuid()
  const apiRes = await request.post('/api/register', {
    data: {
      qr_code: qr2,
      primary_parent: { name: 'Sam Walker', phone: '555-333-4444', email: `sam${Date.now()}b@test.com` },
      secondary_parent: null,
      children: [{
        first_name: 'Lou', last_name: 'Walker', age: 6, grade: '', allergies: '', special_instructions: '',
        pickup_authorizations: [], facts_reload_permission: true, facts_max_amount: 10,
      }],
      waiver_signature: { typed_name: 'Sam Walker' },
      photo_consent_app: true,
      photo_consent_promo: false,
      vision_matching_consent: false,
      photo_signature: { typed_name: 'Sam Walker' },
      ai_consent_signature: { typed_name: 'Sam Walker' },
      ai_consent_granted: true,
    },
  })
  expect(apiRes.ok()).toBeTruthy()
  const body = await apiRes.json()
  expect(body.created[0].qr_code).toBe(qr2)
})

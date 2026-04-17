import { test, expect } from '@playwright/test'

test('parent edits pickup list via magic link', async ({ page, request }) => {
  const email = `jane${Date.now()}@test.com`

  // Submit registration directly via API to grab edit_token
  const regRes = await request.post('/api/register', {
    data: {
      primary_parent: { name: 'Jane Carter', phone: '555-111-2222', email },
      secondary_parent: null,
      children: [{
        first_name: 'Maya',
        last_name: 'Carter',
        age: 7,
        grade: '2nd',
        allergies: '',
        special_instructions: '',
        pickup_authorizations: [],
        facts_reload_permission: true,
        facts_max_amount: 10,
      }],
      waiver_signature: { typed_name: 'Jane Carter' },
      photo_consent_app: true,
      photo_consent_promo: false,
      vision_matching_consent: true,
      photo_signature: { typed_name: 'Jane Carter' },
    },
  })
  expect(regRes.ok()).toBeTruthy()
  const regBody = await regRes.json()
  const token: string = regBody.edit_token
  expect(token).toBeTruthy()

  // Visit edit page
  await page.goto(`/register/edit/${token}`)
  await expect(page.getByRole('heading', { name: /edit your registration/i })).toBeVisible()

  // Add a pickup person
  await page.getByRole('button', { name: /add another person/i }).click()
  await page.getByPlaceholder('Name').fill('Grandma Carol')
  await page.getByPlaceholder('Relationship (optional)').fill('Grandma')

  // Save
  await page.getByRole('button', { name: /save changes/i }).click()
  await expect(page.getByText(/saved — your changes are live/i)).toBeVisible()

  // Verify persisted via GET API
  const getRes = await request.get(`/api/register/edit/${token}`)
  expect(getRes.ok()).toBeTruthy()
  const data = await getRes.json()
  expect(data.children[0].pickup_authorizations).toEqual([
    { name: 'Grandma Carol', relationship: 'Grandma' },
  ])
})

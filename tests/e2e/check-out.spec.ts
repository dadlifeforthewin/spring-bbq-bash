import { test, expect } from '@playwright/test'
import { registerChild, loginVolunteer, apiCheckIn } from './helpers/volunteer'

test('volunteer releases a child to an approved pickup', async ({ page, request }) => {
  const pw = process.env.VOLUNTEER_PASSWORD
  test.skip(!pw, 'VOLUNTEER_PASSWORD env var not set')

  const { child_id, qr_code } = await registerChild(request, { first_name: 'CheckoutKid' })
  await loginVolunteer(page, pw!)
  await apiCheckIn(page, child_id)

  await page.goto('/station/check-out')
  await page.getByLabel(/qr code/i).fill(qr_code)
  await page.getByRole('button', { name: /look up/i }).click()
  await expect(page.getByText(/CheckoutKid/)).toBeVisible()

  // Click the Aunt Polly pickup option
  await page.getByRole('button', { name: /aunt polly/i }).click()
  await page.getByLabel(/staff name/i).fill('Volunteer B')
  await page.getByRole('button', { name: /release to selected/i }).click()
  await expect(page.getByText(/checked out safely/i)).toBeVisible()
})

test('volunteer cannot release to a name that is not on the approved list', async ({ page, request }) => {
  const pw = process.env.VOLUNTEER_PASSWORD
  test.skip(!pw, 'VOLUNTEER_PASSWORD env var not set')

  const { child_id } = await registerChild(request, { first_name: 'StrangerDangerKid' })
  await loginVolunteer(page, pw!)
  await apiCheckIn(page, child_id)

  const res = await page.request.post('/api/checkout', {
    data: {
      child_id,
      checked_out_to_name: 'Stranger Danger',
      checked_out_by_staff_name: 'Volunteer B',
    },
  })
  expect(res.status()).toBe(403)
})

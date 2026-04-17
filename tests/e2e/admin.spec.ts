import { test, expect } from '@playwright/test'
import { registerChild } from './helpers/volunteer'
import { loginAdmin } from './helpers/admin'

test('wrong admin password stays on login', async ({ page }) => {
  await page.goto('/admin')
  await page.getByLabel(/admin password/i).fill('definitely-not-the-password')
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page.getByText(/wrong password/i)).toBeVisible()
})

test('admin dashboard loads stats after login', async ({ page }) => {
  const pw = process.env.ADMIN_PASSWORD
  test.skip(!pw, 'ADMIN_PASSWORD env var not set')
  await loginAdmin(page, pw!)
  await expect(page.getByText(/registered/i)).toBeVisible()
  await expect(page.getByText(/tickets spent/i)).toBeVisible()
})

test('admin edits a child and the PATCH persists', async ({ page, request }) => {
  const pw = process.env.ADMIN_PASSWORD
  test.skip(!pw, 'ADMIN_PASSWORD env var not set')

  const { child_id } = await registerChild(request, { first_name: 'AdminEditKid' })
  await loginAdmin(page, pw!)
  await page.goto(`/admin/children/${child_id}`)
  await expect(page.getByRole('heading', { name: /AdminEditKid/ })).toBeVisible()

  await page.locator('textarea[rows="2"]').first().fill('peanuts, dairy')
  await page.getByRole('button', { name: /save changes/i }).click()
  await expect(page.getByText(/^saved\.$/i)).toBeVisible()

  const getRes = await page.request.get(`/api/children/${child_id}`)
  expect(getRes.ok()).toBeTruthy()
  const body = await getRes.json()
  expect(body.child.allergies).toBe('peanuts, dairy')
})

test('admin bulk set-initial-balance updates not-yet-checked-in kids', async ({ page, request }) => {
  const pw = process.env.ADMIN_PASSWORD
  test.skip(!pw, 'ADMIN_PASSWORD env var not set')

  const { child_id } = await registerChild(request, { first_name: 'BulkKid' })
  await loginAdmin(page, pw!)

  const res = await page.request.post('/api/bulk/set-initial-balance', {
    data: { balance: 15, only_not_checked_in: true },
  })
  expect(res.ok()).toBeTruthy()
  const body = await res.json()
  expect(body.updated).toBeGreaterThanOrEqual(1)

  const getRes = await page.request.get(`/api/children/${child_id}`)
  const child = await getRes.json()
  expect(child.child.ticket_balance).toBe(15)
})

test('admin catalog CRUD: create, edit, delete a custom item', async ({ page }) => {
  const pw = process.env.ADMIN_PASSWORD
  test.skip(!pw, 'ADMIN_PASSWORD env var not set')

  await loginAdmin(page, pw!)

  // Create
  const createRes = await page.request.post('/api/admin/catalog', {
    data: { station_slug: 'cornhole', name: `E2E item ${Date.now()}`, ticket_cost: 4, sort_order: 99 },
  })
  expect(createRes.ok()).toBeTruthy()
  const { item } = await createRes.json()

  // Edit
  const editRes = await page.request.patch(`/api/admin/catalog/${item.id}`, {
    data: { ticket_cost: 7 },
  })
  expect(editRes.ok()).toBeTruthy()

  // Delete (cleanup)
  const delRes = await page.request.delete(`/api/admin/catalog/${item.id}`)
  expect(delRes.ok()).toBeTruthy()
})

test('admin settings GET + PATCH round-trip', async ({ page }) => {
  const pw = process.env.ADMIN_PASSWORD
  test.skip(!pw, 'ADMIN_PASSWORD env var not set')

  await loginAdmin(page, pw!)

  const getRes = await page.request.get('/api/admin/settings')
  expect(getRes.ok()).toBeTruthy()
  const { event } = await getRes.json()

  const patchRes = await page.request.patch('/api/admin/settings', {
    data: { default_initial_tickets: event.default_initial_tickets },
  })
  expect(patchRes.ok()).toBeTruthy()
})

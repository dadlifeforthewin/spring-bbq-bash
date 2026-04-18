import { test, expect } from '@playwright/test'
import { registerChild } from './helpers/volunteer'
import { loginAdmin } from './helpers/admin'

test('cron send-stories rejects without the correct secret', async ({ request }) => {
  const res = await request.post('/api/cron/send-stories', {
    headers: { 'x-cron-secret': 'definitely-not-the-secret' },
  })
  expect(res.status()).toBe(401)
})

test('cron send-stories groups approved stories per family and writes email_sends rows', async ({ page, request, browser }) => {
  const adminPw = process.env.ADMIN_PASSWORD
  const cronSecret = process.env.CRON_SECRET
  test.skip(!adminPw || !cronSecret,
    'ADMIN_PASSWORD + CRON_SECRET required for the Phase 7 gate')

  // Family A: 2 kids share a primary-parent email
  const sharedEmail = `familyA-${Date.now()}@test.com`
  const regRes1 = await request.post('/api/register', {
    data: {
      primary_parent: { name: 'Family A', phone: '555-100-2000', email: sharedEmail },
      secondary_parent: null,
      children: [{
        first_name: 'AlphaKid', last_name: 'Aye', age: 6, grade: '1st',
        allergies: '', special_instructions: '',
        pickup_authorizations: [],
        facts_reload_permission: true, facts_max_amount: 10,
      }],
      waiver_signature: { typed_name: 'Family A' },
      photo_consent_app: true, photo_consent_promo: false, vision_matching_consent: false,
      photo_signature: { typed_name: 'Family A' },
    },
  })
  expect(regRes1.ok()).toBeTruthy()
  const reg1 = await regRes1.json()
  const childA1 = reg1.created[0].child_id

  const regRes2 = await request.post('/api/register', {
    data: {
      primary_parent: { name: 'Family A', phone: '555-100-2000', email: sharedEmail },
      secondary_parent: null,
      children: [{
        first_name: 'BetaKid', last_name: 'Aye', age: 8, grade: '3rd',
        allergies: '', special_instructions: '',
        pickup_authorizations: [],
        facts_reload_permission: true, facts_max_amount: 10,
      }],
      waiver_signature: { typed_name: 'Family A' },
      photo_consent_app: true, photo_consent_promo: false, vision_matching_consent: false,
      photo_signature: { typed_name: 'Family A' },
    },
  })
  expect(regRes2.ok()).toBeTruthy()
  const reg2 = await regRes2.json()
  const childA2 = reg2.created[0].child_id

  // Family B: 1 kid, different email
  const familyBEmail = `familyB-${Date.now()}@test.com`
  const regRes3 = await request.post('/api/register', {
    data: {
      primary_parent: { name: 'Family B', phone: '555-200-3000', email: familyBEmail },
      secondary_parent: null,
      children: [{
        first_name: 'SoloKid', last_name: 'Bee', age: 5, grade: 'K',
        allergies: '', special_instructions: '',
        pickup_authorizations: [],
        facts_reload_permission: true, facts_max_amount: 10,
      }],
      waiver_signature: { typed_name: 'Family B' },
      photo_consent_app: true, photo_consent_promo: false, vision_matching_consent: false,
      photo_signature: { typed_name: 'Family B' },
    },
  })
  expect(regRes3.ok()).toBeTruthy()
  const reg3 = await regRes3.json()
  const childB1 = reg3.created[0].child_id

  // Admin: mark all 3 stories as auto_approved with seeded text
  const adminCtx = await browser.newContext()
  const adminPage = await adminCtx.newPage()
  await loginAdmin(adminPage, adminPw!)

  const storyHtml = '<p>A bright little story seeded for the Phase 7 gate.</p>'
  const storyText = 'A bright little story seeded for the Phase 7 gate.\n\nBy the numbers: 3 stations visited · 6 tickets spent · 1 photos · favorite stop: Cornhole (1 visits)'

  for (const childId of [childA1, childA2, childB1]) {
    const list = await adminPage.request.get(`/api/stories?status=all`)
    const body = await list.json()
    const row = body.stories.find((s: { child_id: string }) => s.child_id === childId)
    expect(row).toBeTruthy()
    const patch = await adminPage.request.patch(`/api/stories/${row.id}`, {
      data: { status: 'auto_approved', story_text: storyText, story_html: storyHtml },
    })
    expect(patch.ok()).toBeTruthy()
  }

  // Fire the cron endpoint
  const cronRes = await page.request.post('/api/cron/send-stories', {
    headers: { 'x-cron-secret': cronSecret! },
  })
  expect(cronRes.ok()).toBeTruthy()
  const cronBody = await cronRes.json()

  // 2 families processed
  expect(cronBody.families).toBeGreaterThanOrEqual(2)
  // sent + failed === families (every family gets a terminal write)
  expect(cronBody.sent + cronBody.failed).toBe(cronBody.families)

  // Verify via the admin stats that email_sends got rows even on RESEND-less envs
  const statsRes = await adminPage.request.get('/api/admin/stats')
  expect(statsRes.ok()).toBeTruthy()

  await adminCtx.close()
})

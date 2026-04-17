import { test, expect } from '@playwright/test'
import { registerChild, loginVolunteer, apiCheckIn } from './helpers/volunteer'
import { loginAdmin } from './helpers/admin'

test.describe('Phase 5 story pipeline', () => {
  test('register → check-in → spends → checkout → generation produces a grounded story', async ({ page, request, browser }) => {
    const volunteerPw = process.env.VOLUNTEER_PASSWORD
    const adminPw = process.env.ADMIN_PASSWORD
    const anthropic = process.env.ANTHROPIC_API_KEY
    test.skip(!volunteerPw || !adminPw || !anthropic,
      'VOLUNTEER_PASSWORD + ADMIN_PASSWORD + ANTHROPIC_API_KEY all required for the Phase 5 gate')

    const { child_id, qr_code } = await registerChild(request, { first_name: 'Zephyra' })

    // Admin bulk-bump the child's balance so we have room for multiple spends
    const adminCtx = await browser.newContext()
    const adminPage = await adminCtx.newPage()
    await loginAdmin(adminPage, adminPw!)
    const bulkRes = await adminPage.request.post('/api/bulk/set-initial-balance', {
      data: { balance: 30, only_not_checked_in: true },
    })
    expect(bulkRes.ok()).toBeTruthy()
    await adminCtx.close()

    // Volunteer: check in + multiple spends across ≥3 stations + checkout
    await loginVolunteer(page, volunteerPw!)
    await apiCheckIn(page, child_id)

    const spendAt = async (station: string) => {
      const cat = await page.request.get(`/api/catalog?station=${station}`)
      expect(cat.ok()).toBeTruthy()
      const items: { id: string }[] = (await cat.json()).items
      expect(items.length).toBeGreaterThan(0)
      const res = await page.request.post('/api/spend', {
        data: { child_id, station, catalog_item_id: items[0].id },
      })
      expect(res.ok()).toBeTruthy()
    }

    await spendAt('cornhole')
    await spendAt('cornhole') // same station twice — makes cornhole the favorite
    await spendAt('face_painting')
    await spendAt('arts_crafts')
    await spendAt('prize_wheel')

    const checkoutRes = await page.request.post('/api/checkout', {
      data: {
        child_id,
        checked_out_to_name: 'E2E Parent',
        checked_out_by_staff_name: 'Phase 5 Bot',
      },
    })
    expect(checkoutRes.ok()).toBeTruthy()

    // Call /api/stories/generate directly (synchronous) so we don't race the fire-and-forget
    const genRes = await page.request.post('/api/stories/generate', { data: { child_id } })
    expect(genRes.ok()).toBeTruthy()
    const gen = await genRes.json()
    expect(['auto_approved', 'needs_review']).toContain(gen.status)
    expect(typeof gen.score).toBe('number')
    expect(gen.preview).toMatch(/Zephyra/i)

    void qr_code // unused after the API flow; keep reference so lint is happy

    // Fresh admin context to pull the full story row
    const adminCtx2 = await browser.newContext()
    const adminPage2 = await adminCtx2.newPage()
    await loginAdmin(adminPage2, adminPw!)
    const stories = await adminPage2.request.get('/api/stories?status=all')
    const storiesBody = await stories.json()
    const row = storiesBody.stories.find((s: { child_id: string }) => s.child_id === child_id)
    expect(row).toBeTruthy()

    const detailRes = await adminPage2.request.get(`/api/stories/${row.id}`)
    const { story } = await detailRes.json()
    const text: string = story.story_text

    // Grounding rules
    expect(text).not.toMatch(/\b\d{1,2}:\d{2}\s?(am|pm)\b/i) // no timestamps
    expect(text).toMatch(/Zephyra/i) // contains the child's name somewhere
    // Mentions at least 2 stations from the actual timeline
    const stations = ['cornhole', 'face painting', 'arts', 'prize']
    const mentions = stations.filter((s) => text.toLowerCase().includes(s)).length
    expect(mentions).toBeGreaterThanOrEqual(2)

    await adminCtx2.close()
  })
})

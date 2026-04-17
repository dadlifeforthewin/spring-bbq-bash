import { test, expect, Page } from '@playwright/test'
import { registerChild, loginVolunteer, apiCheckIn } from './helpers/volunteer'
import { loginAdmin } from './helpers/admin'

const TINY_JPEG_BASE64 =
  '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAP//////////////////////////////////////////' +
  '////////////////////////////////////////////wgARCAABAAEDAREAAhEBAxEB/8QAFAAB' +
  'AAAAAAAAAAAAAAAAAAAACf/EABQBAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhADEAAAAT//xAAU' +
  'EAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAEFAn//xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAED' +
  'AQE/AX//xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/AX//xAAUEAEAAAAAAAAAAAAAAAAA' +
  'AAAA/9oACAEBAAY/An//xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/IX//2gAMAwEAAgAD' +
  'AAAAECP/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/EH//xAAUEQEAAAAAAAAAAAAAAAAA' +
  'AAAA/9oACAECAQE/EH//xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/EH//2Q=='

const tinyJpeg = () => Buffer.from(TINY_JPEG_BASE64, 'base64')

async function pollStatus(page: Page, photoId: string, maxTries = 12): Promise<string> {
  for (let i = 0; i < maxTries; i++) {
    await new Promise((r) => setTimeout(r, 2000))
    const res = await page.request.get(`/api/admin/photos/status?photo_id=${encodeURIComponent(photoId)}`)
    if (!res.ok()) continue
    const body = await res.json()
    // Terminal statuses: auto, pending_review, unmatched, confirmed, rejected
    if (body.match_status && body.match_status !== 'pending_review') {
      return body.match_status
    }
    // pending_review is also "settled" for our purposes — terminal until an admin acts
    if (body.match_status === 'pending_review') return 'pending_review'
  }
  return 'timeout'
}

test.describe('Phase 6 vision pipeline', () => {
  test('roaming photo classifies into auto / pending_review / unmatched', async ({ page, request, browser }) => {
    const volunteerPw = process.env.VOLUNTEER_PASSWORD
    const anthropic = process.env.ANTHROPIC_API_KEY
    test.skip(!volunteerPw || !anthropic,
      'VOLUNTEER_PASSWORD + ANTHROPIC_API_KEY required for Phase 6 gate')

    // Register a kid with vision matching consent
    const { child_id } = await registerChild(request, { first_name: 'Visionaria' })
    // Flip vision_matching_consent=true via admin API (register defaults it false)
    const adminPw = process.env.ADMIN_PASSWORD
    test.skip(!adminPw, 'ADMIN_PASSWORD required to enable vision consent')

    const adminCtx = await browser.newContext()
    const adminPage = await adminCtx.newPage()
    await loginAdmin(adminPage, adminPw!)
    const flip = await adminPage.request.patch(`/api/children/${child_id}`, {
      data: { vision_matching_consent: true },
    })
    expect(flip.ok()).toBeTruthy()
    await adminCtx.close()

    await loginVolunteer(page, volunteerPw!)
    await apiCheckIn(page, child_id)

    // Jail mugshot — triggers background face reference extraction
    const mug = await page.request.post('/api/photos/upload', {
      multipart: {
        photo: { name: 'mug.jpg', mimeType: 'image/jpeg', buffer: tinyJpeg() },
        child_ids: JSON.stringify([child_id]),
        station: 'jail',
        capture_mode: 'station_scan',
      },
    })
    expect(mug.ok()).toBeTruthy()

    // Give the background face reference extraction a moment
    await new Promise((r) => setTimeout(r, 3000))

    // Roaming photo — upload with empty child_ids + capture_mode=roaming_vision
    const roam = await page.request.post('/api/photos/upload', {
      multipart: {
        photo: { name: 'roam.jpg', mimeType: 'image/jpeg', buffer: tinyJpeg() },
        child_ids: '[]',
        station: 'roaming',
        capture_mode: 'roaming_vision',
      },
    })
    expect(roam.ok()).toBeTruthy()
    const { photo_id } = await roam.json()
    expect(photo_id).toBeTruthy()

    const finalStatus = await pollStatus(page, photo_id)
    // Any of auto / pending_review / unmatched is a valid outcome for the pipeline
    expect(['auto', 'pending_review', 'unmatched']).toContain(finalStatus)
  })

  test('roaming upload rejects a station_scan with no child_ids (regression guard)', async ({ page, request }) => {
    const volunteerPw = process.env.VOLUNTEER_PASSWORD
    test.skip(!volunteerPw, 'VOLUNTEER_PASSWORD required')
    await registerChild(request, { first_name: 'Guard' })
    await loginVolunteer(page, volunteerPw!)

    const res = await page.request.post('/api/photos/upload', {
      multipart: {
        photo: { name: 'x.jpg', mimeType: 'image/jpeg', buffer: tinyJpeg() },
        child_ids: '[]',
        station: 'jail',
        capture_mode: 'station_scan',
      },
    })
    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/child_id/i)
  })
})

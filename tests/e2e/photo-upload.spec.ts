import { test, expect } from '@playwright/test'
import { registerChild, loginVolunteer, apiCheckIn } from './helpers/volunteer'

// Smallest valid JPEG (a 1x1 white pixel), base64-decoded at runtime.
const TINY_JPEG_BASE64 =
  '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAP//////////////////////////////////////////' +
  '////////////////////////////////////////////wgARCAABAAEDAREAAhEBAxEB/8QAFAAB' +
  'AAAAAAAAAAAAAAAAAAAACf/EABQBAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhADEAAAAT//xAAU' +
  'EAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAEFAn//xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAED' +
  'AQE/AX//xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/AX//xAAUEAEAAAAAAAAAAAAAAAAA' +
  'AAAA/9oACAEBAAY/An//xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/IX//2gAMAwEAAgAD' +
  'AAAAECP/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/EH//xAAUEQEAAAAAAAAAAAAAAAAA' +
  'AAAA/9oACAECAQE/EH//xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/EH//2Q=='

function tinyJpegBuffer(): Buffer {
  return Buffer.from(TINY_JPEG_BASE64, 'base64')
}

test('volunteer uploads a mugshot for one kid via station_scan', async ({ page, request }) => {
  const pw = process.env.VOLUNTEER_PASSWORD
  test.skip(!pw, 'VOLUNTEER_PASSWORD env var not set')

  const { child_id, qr_code } = await registerChild(request, {
    first_name: 'PhotoKid',
    photo_consent_app: true,
  })
  await loginVolunteer(page, pw!)
  await apiCheckIn(page, child_id)

  const res = await page.request.post('/api/photos/upload', {
    multipart: {
      photo: { name: 'mugshot.jpg', mimeType: 'image/jpeg', buffer: tinyJpegBuffer() },
      child_ids: JSON.stringify([child_id]),
      station: 'jail',
      capture_mode: 'station_scan',
      volunteer_name: 'E2E Photog',
    },
  })
  expect(res.ok()).toBeTruthy()
  const body = await res.json()
  expect(body.ok).toBe(true)
  expect(body.tagged_child_ids).toEqual([child_id])
  expect(typeof body.photo_id).toBe('string')

  // Verify a photo_taken station event was recorded
  const tl = await page.request.get(`/api/children/by-qr/${encodeURIComponent(qr_code)}/timeline`)
  const tlBody = await tl.json()
  const photoEvents = tlBody.events.filter((e: { event_type: string }) => e.event_type === 'photo_taken')
  expect(photoEvents.length).toBeGreaterThanOrEqual(1)
})

test('upload is rejected 403 if any scanned child lacks photo consent', async ({ page, request }) => {
  const pw = process.env.VOLUNTEER_PASSWORD
  test.skip(!pw, 'VOLUNTEER_PASSWORD env var not set')

  const ok = await registerChild(request, { first_name: 'YesPhoto', photo_consent_app: true })
  const blocked = await registerChild(request, { first_name: 'NoPhoto', photo_consent_app: false })
  await loginVolunteer(page, pw!)

  const res = await page.request.post('/api/photos/upload', {
    multipart: {
      photo: { name: 'shot.jpg', mimeType: 'image/jpeg', buffer: tinyJpegBuffer() },
      child_ids: JSON.stringify([ok.child_id, blocked.child_id]),
      station: 'cornhole',
      capture_mode: 'station_scan',
    },
  })
  expect(res.status()).toBe(403)
  const body = await res.json()
  expect(body.blocked).toContain(blocked.child_id)
})

test('unauthorized upload (no volunteer cookie) is rejected 401', async ({ request }) => {
  const res = await request.post('/api/photos/upload', {
    multipart: {
      photo: { name: 'shot.jpg', mimeType: 'image/jpeg', buffer: tinyJpegBuffer() },
      child_ids: JSON.stringify([]),
      station: 'cornhole',
      capture_mode: 'station_scan',
    },
  })
  expect(res.status()).toBe(401)
})

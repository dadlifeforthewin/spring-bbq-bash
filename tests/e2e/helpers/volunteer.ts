import type { APIRequestContext, Page } from '@playwright/test'

export async function registerChild(request: APIRequestContext, overrides?: {
  first_name?: string
  allergies?: string
  photo_consent_app?: boolean
  facts_reload_permission?: boolean
  facts_max_amount?: number
}): Promise<{ child_id: string; qr_code: string; email: string }> {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`
  const res = await request.post('/api/register', {
    data: {
      primary_parent: { name: 'E2E Parent', phone: '555-000-0000', email },
      secondary_parent: null,
      children: [{
        first_name: overrides?.first_name ?? 'E2EKid',
        last_name: 'Tester',
        age: 8, grade: '3rd',
        allergies: overrides?.allergies ?? '',
        special_instructions: '',
        pickup_authorizations: [{ name: 'Aunt Polly', relationship: 'Aunt' }],
        facts_reload_permission: overrides?.facts_reload_permission ?? true,
        facts_max_amount: overrides?.facts_max_amount ?? 10,
      }],
      waiver_signature: { typed_name: 'E2E Parent' },
      photo_consent_app: overrides?.photo_consent_app ?? true,
      photo_consent_promo: false,
      vision_matching_consent: false,
      photo_signature: { typed_name: 'E2E Parent' },
    },
  })
  if (!res.ok()) throw new Error(`register failed: ${res.status()}`)
  const body = await res.json()
  return { child_id: body.created[0].child_id, qr_code: body.created[0].qr_code, email }
}

export async function loginVolunteer(page: Page, password: string) {
  await page.goto('/station')
  await page.getByLabel(/volunteer password/i).fill(password)
  await page.getByRole('button', { name: /sign in/i }).click()
  // Wait until the picker shows — confirms cookie was set + page refreshed
  await page.getByRole('heading', { name: /pick your station/i }).waitFor({ timeout: 5000 })
}

// Uses page.request so the volunteer cookie travels with the call
export async function apiCheckIn(page: Page, childId: string) {
  const res = await page.request.post('/api/checkin', {
    data: { child_id: childId, dropoff_type: 'both_parents', staff_name: 'E2E Bot' },
  })
  if (!res.ok()) throw new Error(`checkin failed: ${res.status()}`)
}

import { describe, it, expect } from 'vitest'
import { buildReceiptPdf } from '@/lib/pdf/registration-receipt'

describe('registration receipt PDF', () => {
  it('produces a non-trivial PDF for a sample payload', async () => {
    const bytes = await buildReceiptPdf({
      event_name: 'LCA Spring BBQ Glow Party Bash 2026',
      event_date: '2026-04-25',
      primary_parent: { name: 'Jane Carter', phone: '555-111-2222', email: 'jane@test.com' },
      secondary_parent: null,
      children: [{
        first_name: 'Maya',
        last_name: 'Carter',
        age: 7,
        grade: '2nd',
        allergies: 'peanuts',
        special_instructions: null,
        qr_code: '11111111-2222-4333-8444-555555555555',
        pickup_authorizations: [{ name: 'Grandma Carol', relationship: 'Grandma' }],
        facts_reload_permission: true,
        facts_max_amount: 10,
      }],
      waiver: {
        text: 'Sample waiver text for testing purposes only.',
        typed_name: 'Jane Carter',
        signed_at: '2026-04-16T12:00:00Z',
      },
      photo_consent: {
        photo_consent_app: true,
        photo_consent_promo: false,
        vision_matching_consent: true,
        typed_name: 'Jane Carter',
        signed_at: '2026-04-16T12:00:00Z',
      },
    })

    expect(bytes).toBeInstanceOf(Uint8Array)
    expect(bytes.byteLength).toBeGreaterThan(1024)
    // PDF files start with "%PDF-"
    const header = new TextDecoder().decode(bytes.slice(0, 5))
    expect(header).toBe('%PDF-')
  })
})

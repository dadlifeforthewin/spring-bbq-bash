import { describe, it, expect } from 'vitest'
import { registrationSchema } from '@/lib/validators'

const validForm = {
  primary_parent: { name: 'Jane Carter', phone: '555-111-2222', email: 'jane@example.com' },
  secondary_parent: null,
  children: [{
    first_name: 'Maya',
    last_name: 'Carter',
    age: 7,
    grade: '2nd',
    allergies: '',
    special_instructions: '',
    pickup_authorizations: [{ name: 'Grandma Carol', relationship: 'Grandma' }],
    facts_reload_permission: true,
    facts_max_amount: 10,
  }],
  waiver_signature: { typed_name: 'Jane Carter' },
  photo_consent_app: true,
  photo_consent_promo: false,
  vision_matching_consent: true,
  photo_signature: { typed_name: 'Jane Carter' },
}

describe('registrationSchema', () => {
  it('accepts a valid single-child registration', () => {
    expect(registrationSchema.safeParse(validForm).success).toBe(true)
  })

  it('requires at least one child', () => {
    const bad = { ...validForm, children: [] }
    expect(registrationSchema.safeParse(bad).success).toBe(false)
  })

  it('caps facts_max_amount at 10', () => {
    const bad = { ...validForm, children: [{ ...validForm.children[0], facts_max_amount: 11 }] }
    expect(registrationSchema.safeParse(bad).success).toBe(false)
  })

  it('requires primary parent email', () => {
    const bad = { ...validForm, primary_parent: { ...validForm.primary_parent, email: '' } }
    expect(registrationSchema.safeParse(bad).success).toBe(false)
  })

  it('waiver signature cannot be empty', () => {
    const bad = { ...validForm, waiver_signature: { typed_name: '' } }
    expect(registrationSchema.safeParse(bad).success).toBe(false)
  })
})

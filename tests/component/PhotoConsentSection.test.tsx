import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PhotoConsentSection, { PhotoConsent } from '@/components/registration/PhotoConsentSection'

const blank: PhotoConsent = {
  photo_consent_app: false,
  photo_consent_promo: false,
  vision_matching_consent: false,
  photo_signature_name: '',
}

describe('PhotoConsentSection', () => {
  it('toggles photo_consent_app', () => {
    const onChange = vi.fn()
    render(<PhotoConsentSection value={blank} onChange={onChange} />)
    fireEvent.click(screen.getByLabelText(/include my child in photo memories/i))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ photo_consent_app: true }))
  })

  it('renders the vision matching benefits copy', () => {
    render(<PhotoConsentSection value={blank} onChange={() => {}} />)
    expect(screen.getByText(/more candid shots|face recognition|deleted 30 days/i)).toBeInTheDocument()
  })

  it('updates the signature name', () => {
    const onChange = vi.fn()
    render(<PhotoConsentSection value={blank} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText(/photo consent signature/i), { target: { value: 'Jane' } })
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ photo_signature_name: 'Jane' }))
  })
})

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ConsentBanner from '@/components/station/ConsentBanner'

describe('ConsentBanner', () => {
  it('renders PHOTOS OK banner when photo_consent_app is true', () => {
    render(<ConsentBanner photoConsentApp={true} />)
    const el = screen.getByTestId('consent-banner')
    expect(el.textContent).toMatch(/photos ok/i)
    expect(el.className).toMatch(/green/)
  })

  it('renders NO PHOTOS banner when photo_consent_app is false', () => {
    render(<ConsentBanner photoConsentApp={false} />)
    const el = screen.getByTestId('consent-banner')
    expect(el.textContent).toMatch(/no photos/i)
    expect(el.className).toMatch(/red/)
  })
})

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import AllergiesBanner from '@/components/station/AllergiesBanner'

describe('AllergiesBanner', () => {
  it('renders amber banner with allergies text when non-empty', () => {
    render(<AllergiesBanner allergies="peanuts, dairy" />)
    const el = screen.getByTestId('allergies-banner')
    expect(el.textContent).toMatch(/peanuts, dairy/)
    expect(el.className).toMatch(/amber|yellow/)
  })

  it('returns null when allergies is empty string', () => {
    const { container } = render(<AllergiesBanner allergies="" />)
    expect(container.firstChild).toBeNull()
  })

  it('returns null when allergies is null', () => {
    const { container } = render(<AllergiesBanner allergies={null} />)
    expect(container.firstChild).toBeNull()
  })
})

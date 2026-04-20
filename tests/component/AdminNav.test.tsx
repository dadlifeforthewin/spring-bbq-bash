import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AdminNav } from '@/components/glow/AdminNav'

describe('<AdminNav>', () => {
  it('renders brand + 9 nav links + right slot', () => {
    render(<AdminNav active="dashboard" right={<span data-testid="rs">LIVE · 0 ONSITE</span>} />)
    expect(screen.getByText(/LCA · BASH OPS/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^Dashboard$/ })).toHaveAttribute('href', '/admin')
    expect(screen.getByRole('link', { name: /^Children$/ })).toHaveAttribute('href', '/admin/children')
    expect(screen.getByRole('link', { name: /^Stories$/ })).toHaveAttribute('href', '/admin/stories')
    expect(screen.getByRole('link', { name: /^Photos$/ })).toHaveAttribute('href', '/admin/photos')
    expect(screen.getByRole('link', { name: /^Stations$/ })).toHaveAttribute('href', '/admin/stations')
    expect(screen.getByRole('link', { name: /^Prizes$/ })).toHaveAttribute('href', '/admin/prizes')
    expect(screen.getByRole('link', { name: /^Cleanup$/ })).toHaveAttribute('href', '/admin/cleanup')
    expect(screen.getByRole('link', { name: /^Bulk$/ })).toHaveAttribute('href', '/admin/bulk')
    expect(screen.getByRole('link', { name: /^Settings$/ })).toHaveAttribute('href', '/admin/settings')
    expect(screen.getByTestId('rs')).toBeInTheDocument()
  })

  it('marks the active page', () => {
    render(<AdminNav active="photos" />)
    const photos = screen.getByRole('link', { name: /photos/i })
    expect(photos.getAttribute('aria-current')).toBe('page')
  })

  it('supports new Phase 5.5 keys (prizes, cleanup)', () => {
    render(<AdminNav active="prizes" />)
    const prizes = screen.getByRole('link', { name: /^Prizes$/ })
    expect(prizes.getAttribute('aria-current')).toBe('page')
  })
})

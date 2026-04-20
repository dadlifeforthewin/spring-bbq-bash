import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AdminNav } from '@/components/glow/AdminNav'

describe('<AdminNav>', () => {
  it('renders brand + 7 nav links + right slot', () => {
    render(<AdminNav active="dashboard" right={<span data-testid="rs">LIVE · 0 ONSITE</span>} />)
    expect(screen.getByText(/LCA · BASH OPS/i)).toBeInTheDocument()
    const links = screen.getAllByRole('link')
    expect(links.length).toBeGreaterThanOrEqual(7)
    expect(screen.getByTestId('rs')).toBeInTheDocument()
  })

  it('marks the active page', () => {
    render(<AdminNav active="photos" />)
    const photos = screen.getByRole('link', { name: /photos/i })
    expect(photos.getAttribute('aria-current')).toBe('page')
  })
})

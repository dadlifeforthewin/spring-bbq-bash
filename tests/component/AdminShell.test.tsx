import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import AdminShell from '@/components/admin/AdminShell'

describe('<AdminShell> nav', () => {
  it('includes the 3 Phase 5.5 links (Catalog, Prizes, Cleanup)', () => {
    render(<AdminShell><div>body</div></AdminShell>)
    const catalog = screen.getByRole('link', { name: /^Catalog$/ })
    const prizes  = screen.getByRole('link', { name: /^Prizes$/ })
    const cleanup = screen.getByRole('link', { name: /^Cleanup$/ })
    expect(catalog).toHaveAttribute('href', '/admin/catalog')
    expect(prizes).toHaveAttribute('href', '/admin/prizes')
    expect(cleanup).toHaveAttribute('href', '/admin/cleanup')
  })

  it('keeps existing top-level nav links', () => {
    render(<AdminShell><div>body</div></AdminShell>)
    expect(screen.getByRole('link', { name: /^Dashboard$/ })).toHaveAttribute('href', '/admin')
    expect(screen.getByRole('link', { name: /^Children$/ })).toHaveAttribute('href', '/admin/children')
    expect(screen.getByRole('link', { name: /^Stories$/ })).toHaveAttribute('href', '/admin/stories')
    expect(screen.getByRole('link', { name: /^Photos$/ })).toHaveAttribute('href', '/admin/photos')
    expect(screen.getByRole('link', { name: /^Stations$/ })).toHaveAttribute('href', '/admin/stations')
    expect(screen.getByRole('link', { name: /^Bulk$/ })).toHaveAttribute('href', '/admin/bulk')
    expect(screen.getByRole('link', { name: /^Settings$/ })).toHaveAttribute('href', '/admin/settings')
  })
})

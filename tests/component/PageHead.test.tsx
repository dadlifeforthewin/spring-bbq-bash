import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PageHead } from '@/components/glow/PageHead'

describe('<PageHead>', () => {
  it('renders title', () => {
    render(<PageHead title="Check-in Station" />)
    expect(screen.getByRole('heading', { name: 'Check-in Station' })).toBeInTheDocument()
  })

  it('renders optional back + sub + right slot', () => {
    render(
      <PageHead
        back={{ href: '/station', label: 'stations' }}
        title="Photo Booth"
        sub="Tap to snap"
        right={<span data-testid="right-slot">LIVE</span>}
      />
    )
    expect(screen.getByRole('link', { name: /stations/i })).toHaveAttribute('href', '/station')
    expect(screen.getByText('Tap to snap')).toBeInTheDocument()
    expect(screen.getByTestId('right-slot')).toBeInTheDocument()
  })
})

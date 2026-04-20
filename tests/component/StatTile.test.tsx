import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatTile } from '@/components/glow/StatTile'

describe('<StatTile>', () => {
  it('renders label + value', () => {
    render(<StatTile label="Checked in" value="217" tone="mint" />)
    expect(screen.getByText('Checked in')).toBeInTheDocument()
    expect(screen.getByText('217')).toBeInTheDocument()
  })

  it('applies tabular-nums to value', () => {
    render(<StatTile label="x" value="99" tone="cyan" />)
    const val = screen.getByText('99')
    expect(val.className).toMatch(/tabular-nums|font-variant-numeric/)
  })
})

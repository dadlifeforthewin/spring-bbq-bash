import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TimelineTrack } from '@/components/glow/TimelineTrack'

const items = [
  { time: '5:30', label: 'Doors open',           state: 'done' as const, tone: 'mint' as const },
  { time: '6:30', label: 'Grill + games',        state: 'now'  as const, tone: 'gold' as const },
  { time: '7:30', label: "Kids' blessing circle", state: 'next' as const, tone: 'cyan' as const },
]

describe('<TimelineTrack>', () => {
  it('renders each item', () => {
    render(<TimelineTrack items={items} />)
    expect(screen.getByText('Doors open')).toBeInTheDocument()
    expect(screen.getByText('Grill + games')).toBeInTheDocument()
    expect(screen.getByText("Kids' blessing circle")).toBeInTheDocument()
  })

  it('gives the "now" item a NOW chip', () => {
    render(<TimelineTrack items={items} />)
    expect(screen.getByText('NOW')).toBeInTheDocument()
  })
})

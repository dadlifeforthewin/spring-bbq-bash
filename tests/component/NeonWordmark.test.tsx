import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NeonWordmark } from '@/components/glow/NeonWordmark'

describe('<NeonWordmark>', () => {
  it('renders text with Monoton class + tone', () => {
    render(<NeonWordmark tone="cyan">VOLUNTEER HUB</NeonWordmark>)
    const el = screen.getByText('VOLUNTEER HUB')
    expect(el.className).toMatch(/font-\[monoton|font-monoton|var\(--font-monoton\)/)
    expect(el.className).toMatch(/text-neon-cyan|text-glow-cyan/)
  })

  it('defaults to magenta tone', () => {
    render(<NeonWordmark>SPRING</NeonWordmark>)
    const el = screen.getByText('SPRING')
    expect(el.className).toMatch(/text-neon-magenta|text-glow-magenta/)
  })
})

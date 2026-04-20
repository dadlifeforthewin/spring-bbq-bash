import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SignPanel } from '@/components/glow/SignPanel'

describe('<SignPanel>', () => {
  it('renders children', () => {
    render(<SignPanel tone="magenta">hello</SignPanel>)
    expect(screen.getByText('hello')).toBeInTheDocument()
  })

  it('renders 4 bolt corners', () => {
    const { container } = render(<SignPanel tone="cyan">hi</SignPanel>)
    const bolts = container.querySelectorAll('[data-role="bolt"]')
    expect(bolts.length).toBe(4)
  })

  it('applies tone-specific border color', () => {
    const { container } = render(<SignPanel tone="gold">x</SignPanel>)
    const panel = container.querySelector('[data-role="sign-panel"]') as HTMLElement
    expect(panel.className).toMatch(/border-neon-gold/)
  })
})

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SectionHeading } from '@/components/glow/SectionHeading'

describe('<SectionHeading>', () => {
  it('renders num + title + rule', () => {
    const { container } = render(<SectionHeading num="LOG" title="Recent arrivals" />)
    expect(screen.getByText('LOG')).toBeInTheDocument()
    expect(screen.getByText('Recent arrivals')).toBeInTheDocument()
    const rule = container.querySelector('[data-role="rule"]')
    expect(rule).not.toBeNull()
  })

  it('applies tone classes', () => {
    render(<SectionHeading num="NOW" title="Live" tone="gold" />)
    const num = screen.getByText('NOW')
    expect(num.className).toMatch(/text-neon-gold|text-glow-gold/)
  })
})

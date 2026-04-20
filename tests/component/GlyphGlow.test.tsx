import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { GlyphGlow } from '@/components/glow/GlyphGlow'

describe('<GlyphGlow>', () => {
  it('applies tone color + glow filter to children', () => {
    const { container } = render(
      <GlyphGlow tone="cyan" size={80}><svg data-testid="g" /></GlyphGlow>
    )
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toMatch(/text-neon-cyan/)
    expect(wrapper.style.filter).toMatch(/drop-shadow/i)
    expect(wrapper.style.width).toBe('80px')
  })
})

import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { GridFloor } from '@/components/glow/GridFloor'

describe('<GridFloor>', () => {
  it('renders an absolutely-positioned aria-hidden decorative element', () => {
    const { container } = render(<GridFloor />)
    const el = container.firstChild as HTMLElement
    expect(el).toBeTruthy()
    expect(el.getAttribute('aria-hidden')).toBe('true')
    expect(el.className).toMatch(/absolute/)
    expect(el.className).toMatch(/pointer-events-none/)
  })

  it('accepts a className override', () => {
    const { container } = render(<GridFloor className="custom-class" />)
    const el = container.firstChild as HTMLElement
    expect(el.className).toMatch(/custom-class/)
  })
})

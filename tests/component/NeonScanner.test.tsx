import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NeonScanner } from '@/components/glow/NeonScanner'

describe('<NeonScanner>', () => {
  it('renders hint text', () => {
    render(<NeonScanner tone="cyan" hint="Align QR">placeholder</NeonScanner>)
    expect(screen.getByText('Align QR')).toBeInTheDocument()
    expect(screen.getByText('placeholder')).toBeInTheDocument()
  })

  it('renders 4 bracket corners', () => {
    const { container } = render(<NeonScanner tone="cyan" hint="...">x</NeonScanner>)
    expect(container.querySelectorAll('[data-role="corner"]').length).toBe(4)
  })

  it('renders a beam when scanning', () => {
    const { container, rerender } = render(<NeonScanner tone="cyan" hint="x" scanning>y</NeonScanner>)
    expect(container.querySelector('[data-role="beam"]')).not.toBeNull()
    rerender(<NeonScanner tone="cyan" hint="x" scanning={false}>y</NeonScanner>)
    expect(container.querySelector('[data-role="beam"]')).toBeNull()
  })
})

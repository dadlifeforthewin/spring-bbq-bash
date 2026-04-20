import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import { BigToggle } from '@/components/glow/BigToggle'

function Harness({ initial = false }: { initial?: boolean }) {
  const [on, setOn] = useState(initial)
  return <BigToggle checked={on} onChange={setOn} label="Accept terms" sub="Required" />
}

describe('<BigToggle>', () => {
  it('renders label + sub', () => {
    render(<Harness />)
    expect(screen.getByText('Accept terms')).toBeInTheDocument()
    expect(screen.getByText('Required')).toBeInTheDocument()
  })

  it('toggles on click', () => {
    render(<Harness initial={false} />)
    const cb = screen.getByRole('checkbox') as HTMLInputElement
    expect(cb.checked).toBe(false)
    fireEvent.click(cb)
    expect(cb.checked).toBe(true)
  })

  it('has visible focus ring', () => {
    render(<Harness />)
    const cb = screen.getByRole('checkbox') as HTMLInputElement
    cb.focus()
    const label = cb.closest('label')!
    expect(label.className).toMatch(/focus-within:/)
  })
})

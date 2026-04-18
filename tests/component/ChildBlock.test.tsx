import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ChildBlock, { emptyChild } from '@/components/registration/ChildBlock'

describe('ChildBlock', () => {
  it('emits onChange when first_name changes', () => {
    const onChange = vi.fn()
    render(<ChildBlock value={emptyChild()} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Maya' } })
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ first_name: 'Maya' }))
  })

  it('emptyChild defaults FACTS billing to off (parent-facing UI removed)', () => {
    const v = emptyChild()
    expect(v.facts_reload_permission).toBe(false)
    expect(v.facts_max_amount).toBe(0)
  })

  it('renders the perks-included chips', () => {
    render(<ChildBlock value={emptyChild()} onChange={() => {}} />)
    expect(screen.getByText(/2 drinks/i)).toBeInTheDocument()
    expect(screen.getByText(/3 jail/i)).toBeInTheDocument()
    expect(screen.getByText(/1 prize spin/i)).toBeInTheDocument()
    expect(screen.getByText(/1 DJ shoutout/i)).toBeInTheDocument()
  })
})

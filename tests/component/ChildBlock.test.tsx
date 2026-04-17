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

  it('zeroes facts_max_amount when FACTS permission is toggled off', () => {
    const onChange = vi.fn()
    const v = { ...emptyChild(), facts_reload_permission: true, facts_max_amount: 10 }
    render(<ChildBlock value={v} onChange={onChange} />)
    fireEvent.click(screen.getByLabelText(/facts reload permission/i))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      facts_reload_permission: false,
      facts_max_amount: 0,
    }))
  })

  it('caps the FACTS amount input at max=10', () => {
    const onChange = vi.fn()
    const v = { ...emptyChild(), facts_reload_permission: true, facts_max_amount: 10 }
    render(<ChildBlock value={v} onChange={onChange} />)
    const amount = screen.getByLabelText(/facts max amount/i) as HTMLInputElement
    expect(amount.max).toBe('10')
    expect(amount.min).toBe('0')
  })
})

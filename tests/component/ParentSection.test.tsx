import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ParentSection from '@/components/registration/ParentSection'

describe('ParentSection', () => {
  it('renders primary parent fields and fires onChange', () => {
    const onChange = vi.fn()
    render(<ParentSection label="Primary Parent" value={{ name: '', phone: '', email: '' }} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Jane' } })
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ name: 'Jane' }))
  })
})

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PickupList from '@/components/registration/PickupList'

describe('PickupList', () => {
  it('adds a blank row when "Add another person" is clicked', () => {
    const onChange = vi.fn()
    render(<PickupList value={[]} onChange={onChange} />)
    fireEvent.click(screen.getByText(/add another person/i))
    expect(onChange).toHaveBeenCalledWith([{ name: '', relationship: '' }])
  })

  it('removes a row when the remove button is clicked', () => {
    const onChange = vi.fn()
    render(<PickupList value={[{ name: 'Grandma', relationship: 'Grandma' }]} onChange={onChange} />)
    fireEvent.click(screen.getByLabelText('remove-0'))
    expect(onChange).toHaveBeenCalledWith([])
  })

  it('updates the name field for a row', () => {
    const onChange = vi.fn()
    render(<PickupList value={[{ name: '', relationship: '' }]} onChange={onChange} />)
    const nameInput = screen.getByPlaceholderText('Name')
    fireEvent.change(nameInput, { target: { value: 'Carol' } })
    expect(onChange).toHaveBeenCalledWith([{ name: 'Carol', relationship: '' }])
  })
})

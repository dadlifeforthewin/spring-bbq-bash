import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import WaiverSection from '@/components/registration/WaiverSection'

describe('WaiverSection', () => {
  it('fires setTypedName when the signature input changes', () => {
    const setTypedName = vi.fn()
    const setAck = vi.fn()
    render(<WaiverSection typedName="" setTypedName={setTypedName} ack={false} setAck={setAck} />)
    fireEvent.change(screen.getByLabelText(/type your full name/i), { target: { value: 'Jane Carter' } })
    expect(setTypedName).toHaveBeenCalledWith('Jane Carter')
  })

  it('fires setAck when the checkbox is clicked', () => {
    const setTypedName = vi.fn()
    const setAck = vi.fn()
    render(<WaiverSection typedName="" setTypedName={setTypedName} ack={false} setAck={setAck} />)
    fireEvent.click(screen.getByLabelText(/electronically sign/i))
    expect(setAck).toHaveBeenCalledWith(true)
  })

  it('renders scrollable waiver text', () => {
    render(<WaiverSection typedName="" setTypedName={() => {}} ack={false} setAck={() => {}} />)
    expect(screen.getByTestId('waiver-text')).toBeInTheDocument()
  })
})

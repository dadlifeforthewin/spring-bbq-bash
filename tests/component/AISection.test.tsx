import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AISection from '@/components/registration/AISection'

describe('AISection', () => {
  it('renders the AI disclosure text with the required clauses', () => {
    render(<AISection typedName="" setTypedName={() => {}} ack={false} setAck={() => {}} consent={null} setConsent={() => {}} />)
    const block = screen.getByTestId('ai-disclosure-text')
    expect(block.textContent).toContain('Anthropic')
    expect(block.textContent).toContain('NOT shared with other families')
    expect(block.textContent).toContain('30 days')
    expect(block.textContent).toContain('90 days')
  })

  it('fires setAck when the checkbox is clicked', () => {
    const setAck = vi.fn()
    render(<AISection typedName="" setTypedName={() => {}} ack={false} setAck={setAck} consent={true} setConsent={() => {}} />)
    fireEvent.click(screen.getByLabelText(/electronically sign this AI/i))
    expect(setAck).toHaveBeenCalledWith(true)
  })

  it('fires setTypedName when the signature input changes', () => {
    const setTypedName = vi.fn()
    render(<AISection typedName="" setTypedName={setTypedName} ack={false} setAck={() => {}} consent={true} setConsent={() => {}} />)
    fireEvent.change(screen.getByLabelText(/type your full name to sign this AI disclosure/i), {
      target: { value: 'Jane Carter' },
    })
    expect(setTypedName).toHaveBeenCalledWith('Jane Carter')
  })

  it('fires setConsent(true) when the OPT IN radio is selected', () => {
    const setConsent = vi.fn()
    render(<AISection typedName="" setTypedName={() => {}} ack={false} setAck={() => {}} consent={null} setConsent={setConsent} />)
    fireEvent.click(screen.getByLabelText(/opt in to AI processing/i))
    expect(setConsent).toHaveBeenCalledWith(true)
  })

  it('fires setConsent(false) when the OPT OUT radio is selected', () => {
    const setConsent = vi.fn()
    render(<AISection typedName="" setTypedName={() => {}} ack={false} setAck={() => {}} consent={null} setConsent={setConsent} />)
    fireEvent.click(screen.getByLabelText(/opt out of AI processing/i))
    expect(setConsent).toHaveBeenCalledWith(false)
  })
})

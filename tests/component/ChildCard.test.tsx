import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ChildCard from '@/components/station/ChildCard'

const child = {
  first_name: 'Maya',
  last_name: 'Carter',
  age: 7,
  grade: '2nd',
  allergies: 'peanuts',
  photo_consent_app: true,
  drink_tickets_remaining: 2,
  jail_tickets_remaining: 3,
  prize_wheel_used_at: null,
  dj_shoutout_used_at: null,
}

const primary = { name: 'Jane Carter', phone: '555-111-2222' }

describe('ChildCard', () => {
  it('renders name, age/grade, and the consent banner', () => {
    render(<ChildCard child={child} primary_parent={primary} />)
    expect(screen.getByText(/Maya Carter/)).toBeInTheDocument()
    expect(screen.getByText(/age 7/i)).toBeInTheDocument()
    expect(screen.getByText(/grade 2nd/i)).toBeInTheDocument()
    expect(screen.getByTestId('consent-banner')).toBeInTheDocument()
  })

  it('renders perk chips for every bucket', () => {
    render(<ChildCard child={child} primary_parent={primary} />)
    expect(screen.getByText(/drinks/i)).toBeInTheDocument()
    expect(screen.getByText(/jail \/ pass/i)).toBeInTheDocument()
    expect(screen.getByText(/prize wheel/i)).toBeInTheDocument()
    expect(screen.getByText(/DJ shoutout/i)).toBeInTheDocument()
  })

  it('renders allergies banner when allergies present', () => {
    render(<ChildCard child={child} primary_parent={primary} />)
    expect(screen.getByTestId('allergies-banner')).toBeInTheDocument()
  })

  it('provides tel: and sms: links for primary parent', () => {
    render(<ChildCard child={child} primary_parent={primary} />)
    const call = screen.getByRole('link', { name: /call/i })
    const text = screen.getByRole('link', { name: /text/i })
    expect(call.getAttribute('href')).toBe('tel:555-111-2222')
    expect(text.getAttribute('href')).toBe('sms:555-111-2222')
  })

  it('renders the children slot when provided', () => {
    render(
      <ChildCard child={child} primary_parent={primary}>
        <button>Station Action</button>
      </ChildCard>
    )
    expect(screen.getByRole('button', { name: /station action/i })).toBeInTheDocument()
  })
})

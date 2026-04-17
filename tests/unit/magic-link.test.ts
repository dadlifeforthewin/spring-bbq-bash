import { describe, it, expect } from 'vitest'
import { signToken, verifyToken } from '@/lib/magic-link'

process.env.MAGIC_LINK_SECRET = 'test-secret-at-least-32-chars-long-please'

describe('magic-link', () => {
  it('signs and verifies a token round-trip', () => {
    const token = signToken({ child_id: 'abc', scope: 'edit' }, 60)
    const payload = verifyToken(token)
    expect(payload?.child_id).toBe('abc')
    expect(payload?.scope).toBe('edit')
  })

  it('rejects tampered tokens', () => {
    const token = signToken({ child_id: 'abc' }, 60)
    const tampered = token.slice(0, -3) + 'xxx'
    expect(verifyToken(tampered)).toBeNull()
  })

  it('rejects expired tokens', () => {
    const token = signToken({ child_id: 'abc' }, -1) // already expired
    expect(verifyToken(token)).toBeNull()
  })
})

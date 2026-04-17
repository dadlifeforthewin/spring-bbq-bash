import { describe, it, expect } from 'vitest'
import { serverClient } from '@/lib/supabase'

const canHit = !!process.env.SUPABASE_SERVICE_ROLE_KEY

describe.skipIf(!canHit)('db smoke', () => {
  it('reads the seeded event', async () => {
    const sb = serverClient()
    const { data, error } = await sb.from('events').select('name').limit(1)
    expect(error).toBeNull()
    expect(data?.[0]?.name).toContain('Glow Party Bash')
  })
})

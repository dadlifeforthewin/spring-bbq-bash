import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the serverClient and claude before importing the module under test
const buildDataset = () => {
  const childRow = {
    id: 'child-1',
    first_name: 'Maya',
    last_name: 'Carter',
    age: 7,
    grade: '2nd',
    checked_in_dropoff_type: 'both_parents',
  }
  const eventRow = { name: 'LCA Spring BBQ', faith_tone_level: 'strong', story_prompt_template: 'SYSTEM. VARIETY_SEED: {variety_seed}' }
  const guardians = [{ name: 'Jane Carter', is_primary: true }]
  const stationEvents = [
    { station: 'face_painting', event_type: 'ticket_spend', tickets_delta: -5, item_name: 'Full face', vibe_tags: [], created_at: '2026-04-25T17:05:00Z' },
    { station: 'cornhole', event_type: 'ticket_spend', tickets_delta: -2, item_name: 'Game', vibe_tags: [], created_at: '2026-04-25T17:25:00Z' },
    { station: 'cornhole', event_type: 'ticket_spend', tickets_delta: -2, item_name: 'Game', vibe_tags: [], created_at: '2026-04-25T17:45:00Z' },
    { station: 'jail', event_type: 'photo_taken', tickets_delta: 0, item_name: null, vibe_tags: [], created_at: '2026-04-25T17:00:00Z' },
  ]
  const photoTags = [
    { photos: { id: 'photo-1', taken_at: '2026-04-25T17:00:00Z', capture_mode: 'station_scan', vision_summary: null } },
  ]
  return { childRow, eventRow, guardians, stationEvents, photoTags }
}

const mockSb = (dataset: ReturnType<typeof buildDataset>) => {
  const { childRow, eventRow, guardians, stationEvents, photoTags } = dataset
  return {
    from: vi.fn((table: string) => {
      const makeQuery = (data: unknown) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const q: any = {}
        q.select = vi.fn(() => q)
        q.eq = vi.fn(() => q)
        q.order = vi.fn(() => q)
        q.limit = vi.fn(() => q)
        q.maybeSingle = vi.fn(async () => ({ data, error: null }))
        q.then = (resolve: (v: { data: unknown; error: null }) => void) =>
          resolve({ data, error: null })
        return q
      }
      if (table === 'children') return makeQuery(childRow)
      if (table === 'events') return makeQuery(eventRow)
      if (table === 'guardians') return makeQuery(guardians)
      if (table === 'station_events') return makeQuery(stationEvents)
      if (table === 'photo_tags') return makeQuery(photoTags)
      // Default: kid has no redemption. The payload test that seeds one
      // (prize_redemptions) builds its own client locally.
      if (table === 'prize_redemptions') return makeQuery(null)
      throw new Error(`unexpected table ${table}`)
    }),
  }
}

vi.mock('@/lib/supabase', () => ({ serverClient: vi.fn() }))
vi.mock('@/lib/claude', () => ({
  claude: vi.fn(),
  HAIKU_MODEL: 'claude-haiku-4-5-20251001',
}))

import { serverClient } from '@/lib/supabase'
import { claude } from '@/lib/claude'
import { generateStory, buildPayload } from '@/lib/story-generator'

beforeEach(() => {
  vi.resetAllMocks()
})

describe('story-generator buildPayload', () => {
  it('computes favorite station and aggregates stats from timeline + photos', async () => {
    const ds = buildDataset()
    vi.mocked(serverClient).mockReturnValue(mockSb(ds) as never)

    const payload = await buildPayload('child-1')

    expect(payload.child.first_name).toBe('Maya')
    expect(payload.family_last_name).toBe('Carter')
    expect(payload.stats.stations_visited).toBe(2) // face_painting + cornhole
    expect(payload.stats.tickets_spent).toBe(9)
    expect(payload.stats.photos).toBe(1)
    expect(payload.stats.favorite?.name).toBe('Cornhole')
    expect(payload.stats.favorite?.visits).toBe(2)
    expect(payload.dropoff_type).toBe('both_parents')
    expect(payload.photos_meta).toHaveLength(1)
    expect(payload.photos_meta[0].station).toBe('jail')
    // When no prize was won, prize_won is null.
    expect(payload.stats.prize_won).toBeNull()
  })

  it('includes prize_won when the child has a redemption and adds it to the stats line', async () => {
    const ds = buildDataset()
    // Seed a redemption joined to a prize label.
    const prizeRedemption = { prizes: { label: 'Glow bracelet' } }
    const customSb = {
      from: vi.fn((table: string) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const q: any = {}
        q.select = vi.fn(() => q)
        q.eq = vi.fn(() => q)
        q.order = vi.fn(() => q)
        q.limit = vi.fn(() => q)
        const pick = () => {
          if (table === 'children') return ds.childRow
          if (table === 'events') return ds.eventRow
          if (table === 'guardians') return ds.guardians
          if (table === 'station_events') return ds.stationEvents
          if (table === 'photo_tags') return ds.photoTags
          if (table === 'prize_redemptions') return prizeRedemption
          throw new Error(`unexpected table ${table}`)
        }
        q.maybeSingle = vi.fn(async () => ({ data: pick(), error: null }))
        q.then = (resolve: (v: { data: unknown; error: null }) => void) =>
          resolve({ data: pick(), error: null })
        return q
      }),
    }
    vi.mocked(serverClient).mockReturnValue(customSb as never)

    const payload = await buildPayload('child-1')
    expect(payload.stats.prize_won).toBe('Glow bracelet')
  })
})

describe('story-generator buildStatsLine', () => {
  it('appends "won: <label>" when prize_won is present', async () => {
    const ds = buildDataset()
    vi.mocked(serverClient).mockReturnValue(mockSb(ds) as never)
    const { buildStatsLine } = await import('@/lib/story-generator')
    const line = buildStatsLine({
      stations_visited: 3,
      tickets_spent: 9,
      photos: 2,
      favorite: { name: 'Cornhole', visits: 2 },
      prize_won: 'Glow bracelet',
    })
    expect(line).toContain('won: Glow bracelet')
  })

  it('omits the won fragment when prize_won is null', async () => {
    const ds = buildDataset()
    vi.mocked(serverClient).mockReturnValue(mockSb(ds) as never)
    const { buildStatsLine } = await import('@/lib/story-generator')
    const line = buildStatsLine({
      stations_visited: 3,
      tickets_spent: 9,
      photos: 2,
      favorite: { name: 'Cornhole', visits: 2 },
      prize_won: null,
    })
    expect(line).not.toContain('won:')
  })
})

describe('story-generator generateStory', () => {
  it('calls Claude with the prompt template + payload and formats response', async () => {
    const ds = buildDataset()
    vi.mocked(serverClient).mockReturnValue(mockSb(ds) as never)

    const create = vi.fn().mockResolvedValue({
      content: [{
        type: 'text',
        text: 'Second-grade energy: Maya showed up ready. She crushed Cornhole twice and left with a butterfly from Face Painting.\n\nBy the numbers: 2 stations visited · 9 tickets spent · 1 photos · favorite stop: Cornhole (2 visits)',
      }],
    })
    vi.mocked(claude).mockReturnValue({ messages: { create } } as never)

    const result = await generateStory('child-1')

    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: expect.stringContaining('VARIETY_SEED:'),
      messages: [expect.objectContaining({ role: 'user' })],
    }))
    // The system prompt should have replaced {variety_seed} with a real value
    const systemArg = create.mock.calls[0][0].system as string
    expect(systemArg).not.toContain('{variety_seed}')

    expect(result.story_text).toContain('Maya')
    expect(result.story_text).toContain('By the numbers')
    expect(result.story_html).toContain('<p>')
    expect(result.story_html).toContain('<div class="stats">')
    expect(result.word_count).toBeGreaterThan(0)
  })
})

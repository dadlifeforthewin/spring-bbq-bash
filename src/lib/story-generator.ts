import { serverClient } from './supabase'
import { claude, HAIKU_MODEL } from './claude'

type DropoffType = 'both_parents' | 'one_parent' | 'grandparent' | 'other_approved_adult' | null

type TimelineRow = {
  station: string
  event_type: string
  tickets_delta: number
  item_name: string | null
  vibe_tags: string[] | null
  created_at: string
}

type PhotoMeta = {
  id: string
  station: string | null
  capture_mode: string
  vision_summary: Record<string, unknown> | null
  taken_at: string
}

export type GeneratorPayload = {
  child: { first_name: string; age: number | null; grade: string | null }
  family_last_name: string
  event: { name: string; faith_tone: string }
  timeline: TimelineRow[]
  dropoff_type: DropoffType
  photos_meta: PhotoMeta[]
  stats: {
    stations_visited: number
    tickets_spent: number
    photos: number
    favorite: { name: string; visits: number } | null
    // Prize wheel label from prize_redemptions join. Null when the kid
    // did not spin the wheel. When present, buildStatsLine appends
    // `· won: {label}` so it flows into the keepsake email stats line.
    prize_won: string | null
  }
}

export type GeneratedStory = {
  story_text: string
  story_html: string
  word_count: number
  payload: GeneratorPayload
  variety_seed: string
  photo_count: number
}

const VARIETY_SEEDS = [
  'open with season + grade, close with a list of three',
  'open with a wry observation, close with a callback to the mugshot',
  'open with the child showing up, close with the dance floor',
  'open with energy level, close with favorite station',
  'open with a quick scene-set, close with the family being named',
]

const NON_VISIT_EVENT_TYPES = new Set(['check_in', 'check_out', 'reload', 'photo_taken'])

function stationLabel(slug: string): string {
  return slug.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function computeStats(timeline: TimelineRow[], photoCount: number, prizeWon: string | null = null) {
  const visitCounts = new Map<string, number>()
  const ticketsByStation = new Map<string, number>()
  const photosByStation = new Map<string, number>()
  let ticketsSpent = 0

  for (const e of timeline) {
    if (e.event_type === 'ticket_spend') {
      ticketsSpent += Math.abs(e.tickets_delta || 0)
      visitCounts.set(e.station, (visitCounts.get(e.station) ?? 0) + 1)
      ticketsByStation.set(e.station, (ticketsByStation.get(e.station) ?? 0) + Math.abs(e.tickets_delta || 0))
    }
    if (e.event_type === 'photo_taken') {
      photosByStation.set(e.station, (photosByStation.get(e.station) ?? 0) + 1)
    }
  }

  const stationsVisited = visitCounts.size

  // Favorite: most-visited non check-in/out; tie-breakers: photos-at-station, tickets-at-station
  let favorite: { name: string; visits: number } | null = null
  let best = -1
  let bestPhotos = -1
  let bestTickets = -1
  for (const [station, visits] of visitCounts) {
    const photos = photosByStation.get(station) ?? 0
    const tickets = ticketsByStation.get(station) ?? 0
    const better =
      visits > best ||
      (visits === best && photos > bestPhotos) ||
      (visits === best && photos === bestPhotos && tickets > bestTickets)
    if (better) {
      best = visits
      bestPhotos = photos
      bestTickets = tickets
      favorite = { name: stationLabel(station), visits }
    }
  }

  return {
    stations_visited: stationsVisited,
    tickets_spent: ticketsSpent,
    photos: photoCount,
    favorite,
    prize_won: prizeWon,
  }
}

function pickVarietySeed(): string {
  return VARIETY_SEEDS[Math.floor(Math.random() * VARIETY_SEEDS.length)]
}

function paragraphsToHtml(text: string): string {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join('\n')
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function splitBodyAndStats(raw: string): { body: string; stats: string } {
  const trimmed = raw.trim()
  const byNumbersIdx = trimmed.search(/\n\s*by the numbers[:]/i)
  if (byNumbersIdx === -1) {
    return { body: trimmed, stats: '' }
  }
  return {
    body: trimmed.slice(0, byNumbersIdx).trim(),
    stats: trimmed.slice(byNumbersIdx).trim(),
  }
}

export function buildStatsLine(stats: GeneratorPayload['stats']): string {
  const parts = [
    `${stats.stations_visited} stations visited`,
    `${stats.tickets_spent} tickets spent`,
    `${stats.photos} photos`,
  ]
  if (stats.favorite) {
    parts.push(`favorite stop: ${stats.favorite.name} (${stats.favorite.visits} visits)`)
  }
  if (stats.prize_won) {
    parts.push(`won: ${stats.prize_won}`)
  }
  return `By the numbers: ${parts.join(' · ')}`
}

export async function buildPayload(childId: string): Promise<GeneratorPayload> {
  const sb = serverClient()

  const [{ data: child }, { data: evt }, { data: guardians }] = await Promise.all([
    sb
      .from('children')
      .select('id, first_name, last_name, age, grade, checked_in_dropoff_type, raffle_prize_name')
      .eq('id', childId)
      .maybeSingle(),
    sb.from('events').select('name, faith_tone_level').limit(1).maybeSingle(),
    sb.from('guardians').select('name, is_primary').eq('child_id', childId),
  ])
  if (!child) throw new Error(`child ${childId} not found`)
  if (!evt) throw new Error('no event row')

  const { data: events } = await sb
    .from('station_events')
    .select('station, event_type, tickets_delta, item_name, vibe_tags, created_at')
    .eq('child_id', childId)
    .order('created_at', { ascending: true })
    .limit(500)

  const { data: photoTags } = await sb
    .from('photo_tags')
    .select('photos(id, taken_at, capture_mode, vision_summary)')
    .eq('child_id', childId)
    .limit(200)

  // Prize redemption (optional): the volunteer-typed free-text label flows
  // into the stats line. Older rows (pre-2026-04-24) used the prizes catalog
  // FK — fall back to that label so historical data still renders.
  // If the kid was also a raffle winner, append the raffle prize for an
  // even bigger flex in the keepsake.
  const { data: redemption } = await sb
    .from('prize_redemptions')
    .select('prize_label, prizes(label)')
    .eq('child_id', childId)
    .maybeSingle()
  const wheelPrize: string | null =
    (redemption as { prize_label?: string | null; prizes?: { label?: string } | null } | null)?.prize_label
    ?? (redemption as { prizes?: { label?: string } | null } | null)?.prizes?.label
    ?? null
  const rafflePrize: string | null = (child.raffle_prize_name ?? null) || null
  const prize_won: string | null = (() => {
    if (wheelPrize && rafflePrize) return `${wheelPrize} (wheel), ${rafflePrize} (raffle 🎉)`
    if (rafflePrize) return `${rafflePrize} (raffle 🎉)`
    return wheelPrize
  })()

  const timeline: TimelineRow[] = (events ?? []).map((e) => ({
    station: e.station,
    event_type: e.event_type,
    tickets_delta: e.tickets_delta ?? 0,
    item_name: e.item_name,
    vibe_tags: e.vibe_tags ?? [],
    created_at: e.created_at,
  }))

  const photos_meta: PhotoMeta[] = (photoTags ?? [])
    .map((t) => t.photos as unknown as { id: string; taken_at: string; capture_mode: string; vision_summary: Record<string, unknown> | null } | null)
    .filter((p): p is NonNullable<typeof p> => !!p)
    .map((p) => {
      const stationEvt = timeline.find(
        (e) => e.event_type === 'photo_taken' && Math.abs(new Date(e.created_at).getTime() - new Date(p.taken_at).getTime()) < 5000,
      )
      return {
        id: p.id,
        station: stationEvt?.station ?? null,
        capture_mode: p.capture_mode,
        vision_summary: p.vision_summary,
        taken_at: p.taken_at,
      }
    })

  const stats = computeStats(timeline, photos_meta.length, prize_won)

  // Family last name comes from child row; fall back to primary guardian surname if needed
  const primary = (guardians ?? []).find((g) => g.is_primary)
  const family_last_name = child.last_name || (primary?.name.split(/\s+/).slice(-1)[0] ?? '')

  return {
    child: { first_name: child.first_name, age: child.age, grade: child.grade },
    family_last_name,
    event: { name: evt.name, faith_tone: evt.faith_tone_level },
    timeline: timeline.filter((e) => !NON_VISIT_EVENT_TYPES.has(e.event_type) || e.event_type === 'photo_taken'),
    dropoff_type: (child.checked_in_dropoff_type ?? null) as DropoffType,
    photos_meta,
    stats,
  }
}

export async function generateStory(childId: string): Promise<GeneratedStory> {
  const payload = await buildPayload(childId)

  const sb = serverClient()
  const { data: evt } = await sb.from('events').select('story_prompt_template').limit(1).maybeSingle()
  const template = evt?.story_prompt_template ??
    'You are writing a warm keepsake story. VARIETY_SEED: {variety_seed}. Return the story body and a By the numbers stats line.'

  const variety_seed = pickVarietySeed()
  const system = template.replace('{variety_seed}', variety_seed)

  const resp = await claude().messages.create({
    model: HAIKU_MODEL,
    max_tokens: 600,
    system,
    messages: [{ role: 'user', content: JSON.stringify(payload) }],
  })

  const text = resp.content
    .map((c) => (c.type === 'text' ? c.text : ''))
    .join('')
    .trim()

  const { body, stats } = splitBodyAndStats(text)
  const statsLine = stats || buildStatsLine(payload.stats)
  const story_text = `${body}\n\n${statsLine}`
  const word_count = body.split(/\s+/).filter(Boolean).length
  const story_html = `${paragraphsToHtml(body)}\n<div class="stats"><strong>${escapeHtml(statsLine.split(':')[0])}:</strong>${escapeHtml(statsLine.slice(statsLine.indexOf(':') + 1))}</div>`

  return {
    story_text,
    story_html,
    word_count,
    payload,
    variety_seed,
    photo_count: payload.stats.photos,
  }
}

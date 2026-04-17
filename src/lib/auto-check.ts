export const DEFAULT_BANNED_PHRASES = [
  'adventure of a lifetime',
  'unforgettable',
  'blessed',
  'God',
  'prayed',
]

const TIMESTAMP_RE = /\b\d{1,2}:\d{2}\s?(am|pm)\b/i

export type AutoCheckInput = {
  story_text: string
  reference_story_text: string
  child_first_name: string
  timeline_stations: string[] // slugs (e.g., ['cornhole', 'face_painting'])
  banned_phrases?: string[]
  pass_threshold?: number
}

export type AutoCheckResult = {
  score: number
  passed: boolean
  notes: string[]
  details: {
    word_count: number
    reference_word_count: number
    word_count_ok: boolean
    first_sentence_has_name: boolean
    timeline_station_mentions: number
    closer_mentions: number
    banned_hits: string[]
    timestamp_hit: boolean
  }
}

function countWords(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length
}

function openingWindow(s: string, maxChars = 240): string {
  // The spec reference opens with a scene-setting sentence ("Second-grade energy…")
  // and names the child in the very next clause. Treat the opening as the first ~240
  // characters (roughly the first two sentences) rather than the literal first sentence.
  return s.trim().slice(0, maxChars)
}

const STATION_STOPWORDS = new Set(['and', 'of', 'the', 'a'])

function distinctiveTokens(slug: string): string[] {
  return slug
    .replace(/_/g, ' ')
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t && !STATION_STOPWORDS.has(t))
}

function countStationMentions(text: string, stations: string[]): number {
  const lower = text.toLowerCase()
  const seen = new Set<string>()
  for (const s of stations) {
    const tokens = distinctiveTokens(s)
    const hits = tokens.filter((t) => new RegExp(`\\b${escapeRe(t)}\\b`, 'i').test(lower)).length
    // For multi-token slugs require ≥2 tokens to avoid false positives on common words;
    // single-token slugs (cornhole) just need the one.
    if ((tokens.length >= 2 && hits >= 2) || (tokens.length === 1 && hits === 1)) {
      seen.add(s)
    }
  }
  return seen.size
}

function extractCloser(text: string): string {
  // The closer is typically the last non-empty paragraph before the stats line
  const withoutStats = text.split(/\n\s*by the numbers[:]/i)[0].trim()
  const paragraphs = withoutStats.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
  return paragraphs[paragraphs.length - 1] ?? ''
}

export function autoCheck(input: AutoCheckInput): AutoCheckResult {
  const threshold = input.pass_threshold ?? 0.8
  const banned = input.banned_phrases ?? DEFAULT_BANNED_PHRASES

  const wc = countWords(input.story_text)
  const refWc = countWords(input.reference_story_text)
  const lower = 0.7 * refWc
  const upper = 1.3 * refWc
  const word_count_ok = wc >= lower && wc <= upper

  const opening = openingWindow(input.story_text)
  const first_sentence_has_name = new RegExp(`\\b${escapeRe(input.child_first_name)}\\b`, 'i').test(opening)

  const timeline_station_mentions = countStationMentions(input.story_text, input.timeline_stations)

  const closer = extractCloser(input.story_text)
  const closer_mentions = countStationMentions(closer, input.timeline_stations)

  const lowerText = input.story_text.toLowerCase()
  const banned_hits = banned.filter((phrase) => {
    const re = new RegExp(`\\b${escapeRe(phrase.toLowerCase())}\\b`, 'i')
    return re.test(lowerText)
  })

  const timestamp_hit = TIMESTAMP_RE.test(input.story_text)

  const checks = [
    word_count_ok,
    first_sentence_has_name,
    timeline_station_mentions >= 2,
    closer_mentions >= 2,
    banned_hits.length === 0,
    !timestamp_hit,
  ]
  const passCount = checks.filter(Boolean).length
  const score = Number((passCount / checks.length).toFixed(3))

  const notes: string[] = []
  if (!word_count_ok) {
    notes.push(`word count ${wc} outside ±30% of reference ${refWc}`)
  }
  if (!first_sentence_has_name) notes.push(`opening (~240 chars) missing child name "${input.child_first_name}"`)
  if (timeline_station_mentions < 2) notes.push(`only ${timeline_station_mentions} station(s) from timeline mentioned (need 2+)`)
  if (closer_mentions < 2) notes.push(`closer references ${closer_mentions} station(s) from timeline (need 2+)`)
  if (banned_hits.length > 0) notes.push(`banned phrases: ${banned_hits.join(', ')}`)
  if (timestamp_hit) notes.push('contains a timestamp (e.g., 5:12 pm) — not allowed')

  return {
    score,
    passed: score >= threshold,
    notes,
    details: {
      word_count: wc,
      reference_word_count: refWc,
      word_count_ok,
      first_sentence_has_name,
      timeline_station_mentions,
      closer_mentions,
      banned_hits,
      timestamp_hit,
    },
  }
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

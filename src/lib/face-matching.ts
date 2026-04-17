import { claude, HAIKU_MODEL } from './claude'
import { serverClient } from './supabase'

export type FeatureVector = {
  hair_color?: string
  hair_length?: string
  skin_tone?: string
  eye_color?: string
  approximate_height?: string
  clothing_colors?: string[] | string
  accessories?: string[]
  [key: string]: unknown
}

export type VisionSummary = {
  person_count: number
  activity_description: string
  mood: 'happy' | 'focused' | 'silly' | 'tired' | 'neutral' | string
  multi_children: boolean
  [key: string]: unknown
}

export type MatchOutcome = {
  match: boolean
  confidence: number
  reasoning: string
}

const AUTO_TAG_THRESHOLD = 0.9
const PENDING_THRESHOLD = 0.7

export async function loadPhotoAsBase64(storagePath: string): Promise<{ data: string; mediaType: 'image/jpeg' | 'image/png' }> {
  const sb = serverClient()
  const { data, error } = await sb.storage.from('photos').download(storagePath)
  if (error || !data) throw new Error(`storage download failed: ${error?.message}`)
  const buf = Buffer.from(await data.arrayBuffer())
  const mediaType: 'image/jpeg' | 'image/png' = storagePath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg'
  return { data: buf.toString('base64'), mediaType }
}

function extractJson<T>(text: string): T | null {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return null
  try { return JSON.parse(match[0]) as T } catch { return null }
}

export async function describeFace(imageBase64: string, mediaType: 'image/jpeg' | 'image/png', firstName: string): Promise<FeatureVector | null> {
  const resp = await claude().messages.create({
    model: HAIKU_MODEL,
    max_tokens: 400,
    system: 'You help identify children at a community event. Respond with JSON only. Never guess beyond what is visible. Do not mention race or ethnicity.',
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data: imageBase64 },
        },
        {
          type: 'text',
          text: `For the child named ${firstName} in this photo, return a JSON object describing their distinctive visual features: { "hair_color": "", "hair_length": "", "eye_color": "", "clothing_colors": [], "accessories": [] }. Respond only with JSON.`,
        },
      ],
    }],
  })
  const text = resp.content.map((c) => (c.type === 'text' ? c.text : '')).join('')
  return extractJson<FeatureVector>(text)
}

export async function summarizeVision(imageBase64: string, mediaType: 'image/jpeg' | 'image/png'): Promise<VisionSummary | null> {
  const resp = await claude().messages.create({
    model: HAIKU_MODEL,
    max_tokens: 300,
    system: 'You summarize event photos for a family keepsake email. Respond with JSON only.',
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data: imageBase64 },
        },
        {
          type: 'text',
          text: 'Return JSON with exactly these keys: { "person_count": number, "activity_description": string (≤ 12 words), "mood": "happy|focused|silly|tired|neutral", "multi_children": boolean }. Respond only with JSON.',
        },
      ],
    }],
  })
  const text = resp.content.map((c) => (c.type === 'text' ? c.text : '')).join('')
  return extractJson<VisionSummary>(text)
}

export async function scoreMatch(
  imageBase64: string,
  mediaType: 'image/jpeg' | 'image/png',
  features: FeatureVector,
  firstName: string,
): Promise<MatchOutcome | null> {
  const resp = await claude().messages.create({
    model: HAIKU_MODEL,
    max_tokens: 200,
    system: 'You match children in photos to reference descriptions. Be conservative — when uncertain, confidence should be low. Respond with JSON only.',
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data: imageBase64 },
        },
        {
          type: 'text',
          text: `Reference features for a child named ${firstName}: ${JSON.stringify(features)}. Is this child visible in the photo? Return JSON: { "match": boolean, "confidence": number between 0 and 1, "reasoning": string (≤ 25 words) }.`,
        },
      ],
    }],
  })
  const text = resp.content.map((c) => (c.type === 'text' ? c.text : '')).join('')
  return extractJson<MatchOutcome>(text)
}

export function classifyConfidence(confidence: number): 'auto' | 'pending_review' | 'unmatched' {
  if (confidence >= AUTO_TAG_THRESHOLD) return 'auto'
  if (confidence >= PENDING_THRESHOLD) return 'pending_review'
  return 'unmatched'
}

import Anthropic from '@anthropic-ai/sdk'

export const HAIKU_MODEL = 'claude-haiku-4-5-20251001'

let _client: Anthropic | null = null

export function claude(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set')
    _client = new Anthropic({ apiKey })
  }
  return _client
}

import { Resend } from 'resend'

let _client: Resend | null = null

export function resend(): Resend {
  if (!_client) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) throw new Error('RESEND_API_KEY is not set')
    _client = new Resend(apiKey)
  }
  return _client
}

export function emailFrom(): string {
  const from = process.env.EMAIL_FROM
  if (!from) throw new Error('EMAIL_FROM is not set (e.g., "LCA Spring BBQ <keepsakes@lca.example.com>")')
  return from
}

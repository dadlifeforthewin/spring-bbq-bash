import { createHmac, timingSafeEqual } from 'crypto'

type Payload = {
  child_id?: string
  family_primary_email?: string
  scope?: string
  exp?: number
}

function secret() {
  const s = process.env.MAGIC_LINK_SECRET
  if (!s || s.length < 32) throw new Error('MAGIC_LINK_SECRET must be ≥ 32 chars')
  return s
}

function b64url(buf: Buffer | string) {
  return Buffer.from(buf).toString('base64url')
}

export function signToken(payload: Omit<Payload, 'exp'>, ttlSeconds: number): string {
  const body: Payload = { ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds }
  const json = JSON.stringify(body)
  const encoded = b64url(json)
  const sig = createHmac('sha256', secret()).update(encoded).digest('base64url')
  return `${encoded}.${sig}`
}

export function verifyToken(token: string): Payload | null {
  const [encoded, sig] = token.split('.')
  if (!encoded || !sig) return null

  const expected = createHmac('sha256', secret()).update(encoded).digest('base64url')
  const a = Buffer.from(sig, 'base64url')
  const b = Buffer.from(expected, 'base64url')
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null

  try {
    const payload: Payload = JSON.parse(Buffer.from(encoded, 'base64url').toString())
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { signToken } from '@/lib/magic-link'

const COOKIE = 'sbbq_volunteer'
const EIGHT_HOURS = 60 * 60 * 8

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const password = body?.password
  const expected = process.env.VOLUNTEER_PASSWORD
  if (!expected || !password || password !== expected) {
    return Response.json({ error: 'invalid password' }, { status: 401 })
  }

  const token = signToken({ scope: 'volunteer' }, EIGHT_HOURS)
  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: EIGHT_HOURS,
  })

  return Response.json({ ok: true })
}

export async function DELETE() {
  cookies().delete(COOKIE)
  return Response.json({ ok: true })
}

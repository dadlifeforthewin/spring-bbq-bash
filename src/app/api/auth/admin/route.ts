import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { signToken } from '@/lib/magic-link'
import { ADMIN_COOKIE } from '@/lib/admin-auth'

const TWELVE_HOURS = 60 * 60 * 12

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const password = body?.password
  const expected = process.env.ADMIN_PASSWORD
  if (!expected || !password || password !== expected) {
    return Response.json({ error: 'invalid password' }, { status: 401 })
  }

  const token = signToken({ scope: 'admin' }, TWELVE_HOURS)
  cookies().set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: TWELVE_HOURS,
  })
  return Response.json({ ok: true })
}

export async function DELETE() {
  cookies().delete(ADMIN_COOKIE)
  return Response.json({ ok: true })
}

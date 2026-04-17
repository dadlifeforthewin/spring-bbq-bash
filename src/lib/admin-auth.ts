import { cookies } from 'next/headers'
import { verifyToken } from './magic-link'

const COOKIE = 'sbbq_admin'

export function isAdminAuthed(): boolean {
  const c = cookies().get(COOKIE)
  if (!c) return false
  const payload = verifyToken(c.value)
  return !!payload && payload.scope === 'admin'
}

export { COOKIE as ADMIN_COOKIE }

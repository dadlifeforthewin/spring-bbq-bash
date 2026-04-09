// Dead-simple shared-password gate for volunteers + admin.
// One event, one night — no per-user accounts. Everything behind /admin, /checkin,
// and /zone/* requires the ADMIN_PASSWORD. Parents accessing /ticket/[code] do
// NOT need the password; their ticket code is their access token.

import { cookies } from "next/headers";

const COOKIE = "sbbq_auth";

export function isVolunteerAuthed(): boolean {
  const c = cookies().get(COOKIE);
  if (!c) return false;
  return c.value === process.env.ADMIN_PASSWORD;
}

export function setVolunteerAuth(password: string): boolean {
  if (password !== process.env.ADMIN_PASSWORD) return false;
  cookies().set(COOKIE, password, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24, // 24h
  });
  return true;
}

export function clearVolunteerAuth() {
  cookies().delete(COOKIE);
}

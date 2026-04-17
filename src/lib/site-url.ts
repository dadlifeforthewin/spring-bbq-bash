// Resolve the canonical site URL for server-to-server fetches.
// Prefers NEXT_PUBLIC_SITE_URL (explicit), falls back to VERCEL_URL (auto-set
// on every Vercel deploy), and finally to localhost for dev.
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL
  if (explicit) return explicit.replace(/\/$/, '')
  const vercel = process.env.VERCEL_URL
  if (vercel) return `https://${vercel}`
  return 'http://localhost:3050'
}

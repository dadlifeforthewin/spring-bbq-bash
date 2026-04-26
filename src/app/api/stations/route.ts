import { serverClient } from '@/lib/supabase'

// Public stations metadata for the picker. The stations table is locked for
// the event so we cache aggressively at the edge: served from Vercel's CDN
// for 5 min, then revalidated in the background. The picker also caches the
// response in localStorage for instant remount.
export async function GET() {
  const sb = serverClient()
  const { data, error } = await sb
    .from('stations')
    .select('slug, name, sort_order')
    .order('sort_order', { ascending: true })

  if (error) {
    return Response.json({ stations: [] }, { status: 500 })
  }

  return new Response(
    JSON.stringify({ stations: data ?? [] }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // Edge cache disabled for event day — DB seed of the four missing
        // stations (drinks, dj_shoutout, photo, roaming) wasn't propagating
        // fast enough to volunteer tablets via the prior 5-min s-maxage.
        // Re-enable the aggressive cache after the event.
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    },
  )
}

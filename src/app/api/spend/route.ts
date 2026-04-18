// /api/spend is deprecated in favor of /api/stations/activity (D4 rework).
// Kept as a thin 410 so any stale client hits fail loud, not silently decrement the wrong field.
export async function POST() {
  return Response.json(
    { error: 'deprecated — use POST /api/stations/activity' },
    { status: 410 },
  )
}

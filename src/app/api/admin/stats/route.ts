import { NextRequest } from 'next/server'
import { serverClient } from '@/lib/supabase'
import { isAdminAuthed } from '@/lib/admin-auth'

export async function GET(_req: NextRequest) {
  if (!isAdminAuthed()) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  const sb = serverClient()

  const [children, events, reloads, aiStories, photos, evt] = await Promise.all([
    sb.from('children').select('id, checked_in_at, checked_out_at, drink_tickets_remaining, jail_tickets_remaining, prize_wheel_used_at, dj_shoutout_used_at'),
    sb.from('station_events').select('station, event_type, tickets_delta'),
    sb.from('reload_events').select('tickets_added, payment_method, amount_charged'),
    sb.from('ai_stories').select('status'),
    sb.from('photos').select('id, capture_mode'),
    sb.from('events').select('id, ends_at, name, event_date').limit(1).maybeSingle(),
  ])

  const kids = children.data ?? []
  const registered = kids.length
  const checkedIn = kids.filter((k) => k.checked_in_at && !k.checked_out_at).length
  const checkedOut = kids.filter((k) => k.checked_out_at).length
  const notArrived = kids.filter((k) => !k.checked_in_at).length
  const drinksLeft = kids.reduce((s, k) => s + (k.drink_tickets_remaining ?? 0), 0)
  const jailLeft   = kids.reduce((s, k) => s + (k.jail_tickets_remaining ?? 0), 0)
  const wheelUsed  = kids.filter((k) => !!k.prize_wheel_used_at).length
  const djUsed     = kids.filter((k) => !!k.dj_shoutout_used_at).length

  const evts = events.data ?? []
  const ticketsSpent = evts
    .filter((e) => e.event_type === 'ticket_spend')
    .reduce((s, e) => s + Math.abs(e.tickets_delta ?? 0), 0)

  const spendByStation: Record<string, number> = {}
  for (const e of evts) {
    if (e.event_type === 'ticket_spend') {
      spendByStation[e.station] = (spendByStation[e.station] ?? 0) + Math.abs(e.tickets_delta ?? 0)
    }
  }

  const reloadRows = reloads.data ?? []
  const factsTotal = reloadRows
    .filter((r) => r.payment_method === 'facts')
    .reduce((s, r) => s + (Number(r.amount_charged) || 0), 0)
  const cashTotal = reloadRows
    .filter((r) => r.payment_method === 'cash')
    .reduce((s, r) => s + (Number(r.amount_charged) || 0), 0)
  const venmoTotal = reloadRows
    .filter((r) => r.payment_method === 'venmo')
    .reduce((s, r) => s + (Number(r.amount_charged) || 0), 0)
  const compCount = reloadRows.filter((r) => r.payment_method === 'comp').length

  const stories = aiStories.data ?? []
  const storiesByStatus: Record<string, number> = {}
  for (const s of stories) {
    storiesByStatus[s.status] = (storiesByStatus[s.status] ?? 0) + 1
  }

  const photosCount = (photos.data ?? []).length

  // Alert: checked in but not checked out after event end time
  let notCheckedOutAfterEnd = 0
  const endsAt = evt.data?.ends_at ? new Date(evt.data.ends_at).getTime() : null
  if (endsAt && Date.now() > endsAt) {
    notCheckedOutAfterEnd = kids.filter((k) => k.checked_in_at && !k.checked_out_at).length
  }

  return Response.json({
    event: evt.data ?? null,
    counts: {
      registered,
      checked_in: checkedIn,
      checked_out: checkedOut,
      not_arrived: notArrived,
      drinks_remaining: drinksLeft,
      jail_remaining: jailLeft,
      prize_wheel_used: wheelUsed,
      dj_shoutout_used: djUsed,
      tickets_spent: ticketsSpent,
      // Back-compat for components that haven't been redesigned yet (D8 replaces this).
      tickets_outstanding: drinksLeft + jailLeft,
      photos: photosCount,
      not_checked_out_after_end: notCheckedOutAfterEnd,
    },
    spend_by_station: spendByStation,
    money: {
      facts_total: Number(factsTotal.toFixed(2)),
      cash_total: Number(cashTotal.toFixed(2)),
      venmo_total: Number(venmoTotal.toFixed(2)),
      comp_count: compCount,
    },
    stories_by_status: storiesByStatus,
  })
}

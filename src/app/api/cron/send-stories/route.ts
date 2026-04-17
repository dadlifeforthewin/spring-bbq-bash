import { NextRequest } from 'next/server'
import { render } from '@react-email/render'
import StoryEmail, { subjectForFamily } from '@/emails/StoryEmail'
import { collectReadyFamilies } from '@/lib/family-grouping'
import { resend, emailFrom } from '@/lib/resend'
import { serverClient } from '@/lib/supabase'

const RATE_DELAY_MS = 110 // ~9 emails/sec, safely under Resend's 10/sec limit

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function POST(req: NextRequest) {
  const provided = req.headers.get('x-cron-secret') ?? req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  const expected = process.env.CRON_SECRET
  if (!expected || provided !== expected) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  const sb = serverClient()

  // Pull event metadata once for the template header
  const { data: eventRow } = await sb
    .from('events')
    .select('name, event_date, email_logo_url, email_from_name')
    .limit(1)
    .maybeSingle()

  const families = await collectReadyFamilies()
  if (families.length === 0) {
    return Response.json({ ok: true, families: 0, sent: 0, failed: 0 })
  }

  let sent = 0
  let failed = 0
  const results: { email: string; status: 'sent' | 'failed'; error?: string }[] = []

  for (const family of families) {
    // Insert a queued row up front so failures are visible in the dashboard
    const { data: sendRow } = await sb
      .from('email_sends')
      .insert({
        primary_parent_email: family.primary_parent_email,
        child_ids: family.child_ids,
        status: 'sending',
      })
      .select('id')
      .single()

    try {
      const subject = subjectForFamily(
        family.children.map((c) => ({
          first_name: c.first_name,
          age: c.age,
          story_html: c.story_html ?? '',
          photos: c.photos,
          stats_line: c.stats_line,
        })),
        eventRow?.name ?? 'Glow Party Bash',
        family.family_last_name,
      )

      const html = await render(StoryEmail({
        event_name: eventRow?.name ?? 'Glow Party Bash',
        event_date: eventRow?.event_date ?? '',
        event_logo_url: eventRow?.email_logo_url ?? null,
        primary_parent_name: family.primary_parent_name,
        children: family.children.map((c) => ({
          first_name: c.first_name,
          age: c.age,
          story_html: c.story_html ?? '',
          photos: c.photos,
          stats_line: c.stats_line,
        })),
        reply_to: eventRow?.email_from_name ?? null,
      }))

      const result = await resend().emails.send({
        from: emailFrom(),
        to: family.primary_parent_email,
        subject,
        html,
      })

      if (result.error) {
        await sb.from('email_sends').update({
          status: 'failed',
          error: result.error.message ?? String(result.error),
        }).eq('id', sendRow?.id ?? '')
        failed += 1
        results.push({ email: family.primary_parent_email, status: 'failed', error: result.error.message })
      } else {
        await sb.from('email_sends').update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          resend_message_id: result.data?.id ?? null,
        }).eq('id', sendRow?.id ?? '')
        await sb.from('ai_stories').update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          delivery_email: family.primary_parent_email,
        }).in('id', family.story_ids)
        sent += 1
        results.push({ email: family.primary_parent_email, status: 'sent' })
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      await sb.from('email_sends').update({ status: 'failed', error: message }).eq('id', sendRow?.id ?? '')
      failed += 1
      results.push({ email: family.primary_parent_email, status: 'failed', error: message })
    }

    await sleep(RATE_DELAY_MS)
  }

  return Response.json({
    ok: true,
    families: families.length,
    sent,
    failed,
    results,
  })
}

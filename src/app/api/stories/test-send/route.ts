import { NextRequest } from 'next/server'
import { z } from 'zod'
import { render } from '@react-email/render'
import StoryEmail, { subjectForFamily } from '@/emails/StoryEmail'
import { resend, emailFrom } from '@/lib/resend'
import { serverClient } from '@/lib/supabase'
import { isAdminAuthed } from '@/lib/admin-auth'

const schema = z.object({
  to: z.string().email(),
})

const SYNTHETIC_STORY_HTML = `
<p>Second-grade energy, meet the Glow Party Bash. Maya's night started at the jail with a family mugshot — mom, dad, and one slightly suspicious-looking seven-year-old all found guilty of having too much fun.</p>
<p>From there, a full-face butterfly at Face Painting in blue and gold. Pizza kept her fueled, and then she found her calling: Cornhole. A spin of the Prize Wheel earned her candy, and the Arts &amp; Crafts table sent her home with a glow bracelet she made herself.</p>
<p>Nights like this are what community looks like. Grateful the Carters were in the middle of it.</p>
<p>A butterfly, a bracelet, and two rounds of Cornhole. That's a full night by any measure.</p>
`

const SYNTHETIC_STATS = 'By the numbers: 6 stations visited · 15 tickets spent · 4 photos · favorite stop: Cornhole (2 visits)'

export async function POST(req: NextRequest) {
  if (!isAdminAuthed()) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'validation', issues: parsed.error.flatten() }, { status: 400 })
  }

  const sb = serverClient()
  const { data: eventRow } = await sb
    .from('events')
    .select('name, event_date, email_logo_url')
    .limit(1)
    .maybeSingle()

  const eventName = eventRow?.name ?? 'LCA Spring BBQ Glow Party Bash'
  const children = [{
    first_name: 'Maya',
    age: 7,
    story_html: SYNTHETIC_STORY_HTML,
    photos: [],
    stats_line: SYNTHETIC_STATS,
  }]

  const subject = `[TEST] ${subjectForFamily(children, eventName, 'Carter')}`
  const html = await render(StoryEmail({
    event_name: eventName,
    event_date: eventRow?.event_date ?? '',
    event_logo_url: eventRow?.email_logo_url ?? null,
    primary_parent_name: 'Jane Carter',
    children,
  }))

  try {
    const result = await resend().emails.send({
      from: emailFrom(),
      to: parsed.data.to,
      subject,
      html,
    })
    if (result.error) {
      return Response.json({ error: 'resend error', details: result.error.message }, { status: 502 })
    }
    return Response.json({ ok: true, message_id: result.data?.id ?? null })
  } catch (e) {
    return Response.json({ error: 'send failed', details: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}

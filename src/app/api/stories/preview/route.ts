import { NextRequest } from 'next/server'
import { render } from '@react-email/render'
import StoryEmail from '@/emails/StoryEmail'
import { isAdminAuthed } from '@/lib/admin-auth'

const SYNTHETIC_STORY_HTML = `
<p>Second-grade energy, meet the Glow Party Bash. Maya's night started at the jail with a family mugshot — mom, dad, and one slightly suspicious-looking seven-year-old all found guilty of having too much fun.</p>
<p>From there, a full-face butterfly at Face Painting in blue and gold. Pizza kept her fueled, and then she found her calling: Cornhole. A spin of the Prize Wheel earned her candy, and the Arts &amp; Crafts table sent her home with a glow bracelet she made herself.</p>
<p>Nights like this are what community looks like. Grateful the Carters were in the middle of it.</p>
<p>A butterfly, a bracelet, and two rounds of Cornhole. That's a full night by any measure.</p>
`

export async function GET(_req: NextRequest) {
  if (!isAdminAuthed()) {
    return new Response('unauthorized', { status: 401 })
  }

  const html = await render(StoryEmail({
    event_name: 'LCA Spring BBQ Glow Party Bash',
    event_date: '2026-04-25',
    primary_parent_name: 'Jane Carter',
    children: [{
      first_name: 'Maya',
      age: 7,
      story_html: SYNTHETIC_STORY_HTML,
      photos: [],
      stats_line: 'By the numbers: 6 stations visited · 15 tickets spent · 4 photos · favorite stop: Cornhole (2 visits)',
    }],
  }))

  return new Response(html, { headers: { 'Content-Type': 'text/html' } })
}

import { NextRequest } from 'next/server'
import { render } from '@react-email/render'
import RegistrationConfirmationEmail from '@/emails/RegistrationConfirmationEmail'

// PUBLIC preview of the registration confirmation email — no auth gate so the
// URL can be shared with people giving feedback pre-event. Mirrors the admin-
// gated /api/register/preview route but drops isAdminAuthed() on the way in.
//
// Query: ?variant=single renders a one-kid email; default is the multi-kid
// variant (the more interesting layout).
//
// Synthetic data only — fake "Carter family", placeholder edit token that
// won't resolve to a real registration. Safe to share publicly.

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const variant = url.searchParams.get('variant')

  const multi = [
    { first_name: 'Maya',    last_name: 'Carter', age: 7, grade: '2' as string | null },
    { first_name: 'Henry',   last_name: 'Carter', age: 5, grade: 'K' as string | null },
    { first_name: 'Sawyer',  last_name: 'Carter', age: 9, grade: '4' as string | null },
  ]
  const single = [multi[0]]

  const html = await render(
    RegistrationConfirmationEmail({
      event_name: 'LCA Spring BBQ Bash',
      event_date: '2026-04-25',
      event_time: 'Doors 4:45 · Party 5–8 PM',
      event_location: 'Lincoln Christian Academy',
      event_logo_url: null,
      primary_parent_name: 'Jane Carter',
      children: variant === 'single' ? single : multi,
      edit_url: 'https://spring-bbq-bash.vercel.app/register/edit/preview-token',
    }),
  )

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html',
      // Crawlers should not index a one-off event preview page.
      'X-Robots-Tag': 'noindex, nofollow',
    },
  })
}

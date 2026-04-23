import { NextRequest } from 'next/server'
import { render } from '@react-email/render'
import RegistrationConfirmationEmail from '@/emails/RegistrationConfirmationEmail'
import { isAdminAuthed } from '@/lib/admin-auth'

// Admin-gated HTML preview of the registration confirmation email.
// Mirrors /api/stories/preview. Useful for eyeballing copy/layout
// changes without running a real send.
//
// Query: ?variant=single renders a one-kid email; default is the
// multi-kid variant (the more interesting layout).
export async function GET(req: NextRequest) {
  if (!isAdminAuthed()) {
    return new Response('unauthorized', { status: 401 })
  }

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
      event_time: '5:00–8:00 PM',
      event_location: 'Lincoln Christian Academy',
      event_logo_url: null,
      primary_parent_name: 'Jane Carter',
      children: variant === 'single' ? single : multi,
      edit_url: 'https://spring-bbq-bash.vercel.app/register/edit/preview-token',
    }),
  )

  return new Response(html, { headers: { 'Content-Type': 'text/html' } })
}

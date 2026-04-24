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
// Synthetic data only — fake "Carter family", and the "Edit your registration"
// button points back at this preview URL so reviewers can't accidentally
// escape to a real (and in preview mode, expired-looking) edit route.

const PREVIEW_BANNER = `
<div style="background:#FFE147;color:#0B0A1F;padding:10px 16px;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;font-size:12px;font-weight:600;letter-spacing:0.02em;line-height:1.45;position:sticky;top:0;z-index:100;box-shadow:0 2px 8px rgba(0,0,0,0.3);">
  <strong>EMAIL DESIGN PREVIEW</strong> — this is what parents receive after registering. Buttons are inactive; feedback welcome on layout, copy, and overall vibe.
</div>
`.trim()

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const variant = url.searchParams.get('variant')
  // Keep interactive links pointing back at the preview itself so reviewers
  // who tap "Edit your registration" just reload this page instead of landing
  // on the real /register/edit/[token] route with an invalid token.
  const selfUrl = `${url.origin}/email-preview${variant === 'single' ? '?variant=single' : ''}`

  const multi = [
    { first_name: 'Maya',    last_name: 'Carter', age: 7, grade: '2' as string | null },
    { first_name: 'Henry',   last_name: 'Carter', age: 5, grade: 'K' as string | null },
    { first_name: 'Sawyer',  last_name: 'Carter', age: 9, grade: '4' as string | null },
  ]
  const single = [multi[0]]

  const rawHtml = await render(
    RegistrationConfirmationEmail({
      event_name: 'LCA Spring BBQ Bash',
      event_date: '2026-04-25',
      event_time: 'Doors 4:45 · Party 5–8 PM',
      event_location: 'Lincoln Christian Academy',
      event_logo_url: null,
      primary_parent_name: 'Jane Carter',
      children: variant === 'single' ? single : multi,
      edit_url: selfUrl,
    }),
  )

  // Inject the preview banner immediately after <body> so it sticks to the
  // top of the rendered email HTML without touching the email template.
  const html = rawHtml.replace(/(<body[^>]*>)/i, `$1${PREVIEW_BANNER}`)

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html',
      // Crawlers should not index a one-off event preview page.
      'X-Robots-Tag': 'noindex, nofollow',
    },
  })
}

import { render } from '@react-email/render'
import { resend, emailFrom } from '@/lib/resend'
import { serverClient } from '@/lib/supabase'
import RegistrationConfirmationEmail, {
  subjectForRegistration,
  type RegistrationEmailChild,
} from '@/emails/RegistrationConfirmationEmail'
import { siteUrl } from '@/lib/site-url'

// Hard-coded event surface for Spring BBQ Bash 2026.
// Time + location aren't stored as human-readable strings in `events`
// (we only keep timestamptz columns for check-in windows), so we pin
// these here rather than derive + format on every send. If the event
// relocates or the window shifts, update these two lines.
const EVENT_TIME = '5:00–8:00 PM'
const EVENT_LOCATION = 'Lincoln Christian Academy'

export type SendRegistrationInput = {
  to: string
  primary_parent_name: string
  edit_token: string
  children: {
    first_name: string
    last_name: string
    age: number | null
    grade: string | null
    child_id: string
  }[]
}

export async function sendRegistrationConfirmation(input: SendRegistrationInput) {
  const sb = serverClient()

  const { data: eventRow } = await sb
    .from('events')
    .select('name, event_date, email_logo_url')
    .limit(1)
    .maybeSingle()

  const event_name = eventRow?.name ?? 'LCA Spring BBQ Bash'

  const emailChildren: RegistrationEmailChild[] = input.children.map((c) => ({
    first_name: c.first_name,
    last_name: c.last_name,
    age: c.age,
    grade: c.grade,
  }))

  const html = await render(
    RegistrationConfirmationEmail({
      event_name,
      event_date: eventRow?.event_date ?? '',
      event_time: EVENT_TIME,
      event_location: EVENT_LOCATION,
      event_logo_url: eventRow?.email_logo_url ?? null,
      primary_parent_name: input.primary_parent_name,
      children: emailChildren,
      edit_url: `${siteUrl()}/register/edit/${input.edit_token}`,
    }),
  )

  const subject = subjectForRegistration(emailChildren)
  const childIds = input.children.map((c) => c.child_id)

  // Create the email_sends row in 'sending' state so we have a trail
  // even if Resend times out or the process crashes mid-send.
  const { data: sendRow } = await sb
    .from('email_sends')
    .insert({
      primary_parent_email: input.to,
      child_ids: childIds,
      status: 'sending',
    })
    .select('id')
    .single()

  try {
    const result = await resend().emails.send({
      from: emailFrom(),
      to: input.to,
      subject,
      html,
    })

    if (result.error) {
      if (sendRow) {
        await sb
          .from('email_sends')
          .update({ status: 'failed', error: result.error.message })
          .eq('id', sendRow.id)
      }
      return { ok: false as const, error: result.error.message }
    }

    if (sendRow) {
      await sb
        .from('email_sends')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          resend_message_id: result.data?.id ?? null,
        })
        .eq('id', sendRow.id)
    }

    return { ok: true as const, message_id: result.data?.id ?? null }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    if (sendRow) {
      await sb.from('email_sends').update({ status: 'failed', error: message }).eq('id', sendRow.id)
    }
    return { ok: false as const, error: message }
  }
}

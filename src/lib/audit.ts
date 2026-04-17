import { serverClient } from './supabase'

type AuditAction = 'checkout' | 'admin_login' | 'consent_change' | 'photo_deleted'
  | 'reload' | 'registration_edit' | 'volunteer_login' | 'manual_pickup_override'

export async function writeAudit(params: {
  action: AuditAction
  actor: string
  target_type?: string
  target_id?: string
  details?: Record<string, unknown>
  ip_address?: string
}) {
  const sb = serverClient()
  await sb.from('audit_log').insert({
    action: params.action,
    actor: params.actor,
    target_type: params.target_type ?? null,
    target_id: params.target_id ?? null,
    details: params.details ?? {},
    ip_address: params.ip_address ?? null,
  })
}

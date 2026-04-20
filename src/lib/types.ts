// Domain types for the kid-profile schema. Hand-written to match migration 0002.
// Nullable columns → `T | null`; enum check constraints → string literal unions;
// timestamps → `string` (ISO); uuid → `string`; jsonb → `unknown`.

export type Station =
  | 'check_in' | 'jail' | 'cornhole' | 'face_painting'
  | 'arts_crafts' | 'prize_wheel' | 'video_games' | 'dance_competition'
  | 'quiet_corner' | 'pizza' | 'cake_walk' | 'check_out' | 'photo' | 'reload'

export type DropoffType = 'both_parents' | 'one_parent' | 'grandparent' | 'other_approved_adult'
export type FaithTone = 'strong' | 'subtle' | 'off'
export type EventType = 'ticket_spend' | 'photo_taken' | 'check_in' | 'check_out' | 'reload'
export type CaptureMode = 'station_scan' | 'roaming_vision'
export type MatchStatus = 'auto' | 'pending_review' | 'unmatched' | 'confirmed' | 'rejected'
export type PhotoTagSource = 'scan' | 'vision_auto' | 'admin_manual'
export type PaymentMethod = 'facts' | 'cash' | 'venmo' | 'comp'
export type AiStoryStatus =
  | 'pending' | 'pending_review' | 'needs_review' | 'approved'
  | 'auto_approved' | 'sent' | 'skipped'
export type EmailStatus = 'queued' | 'sending' | 'sent' | 'failed'
export type SignatureType = 'liability_waiver' | 'photo_consent'
export type AuditAction =
  | 'checkout' | 'admin_login' | 'consent_change' | 'photo_deleted'
  | 'reload' | 'registration_edit' | 'volunteer_login' | 'manual_pickup_override'

export type EventRow = {
  id: string
  name: string
  event_date: string
  check_in_opens_at: string
  check_in_closes_at: string
  ends_at: string
  default_initial_tickets: number
  faith_tone_level: FaithTone
  reference_story_html: string | null
  reference_story_text: string | null
  story_prompt_template: string | null
  email_from_name: string | null
  email_logo_url: string | null
  created_at: string
  updated_at: string
}

export type Child = {
  id: string
  event_id: string
  qr_code: string
  first_name: string
  last_name: string
  age: number | null
  grade: string | null
  tier: string
  allergies: string | null
  special_instructions: string | null
  photo_consent_app: boolean
  photo_consent_promo: boolean
  vision_matching_consent: boolean
  facts_reload_permission: boolean
  facts_max_amount: number
  ticket_balance: number // legacy — kept for migration compatibility; new code reads the buckets below
  drink_tickets_remaining: number
  jail_tickets_remaining: number
  prize_wheel_used_at: string | null
  dj_shoutout_used_at: string | null
  checked_in_at: string | null
  checked_in_dropoff_type: DropoffType | null
  checked_out_at: string | null
  checked_out_to_name: string | null
  checked_out_by_staff_name: string | null
  created_at: string
  updated_at: string
}

export type Guardian = {
  id: string
  child_id: string
  name: string
  phone: string | null
  email: string | null
  is_primary: boolean
}

export type PickupAuthorization = {
  id: string
  child_id: string
  name: string
  relationship: string | null
  created_at: string
}

export type StationRow = {
  slug: Station
  name: string
  sort_order: number
  active: boolean
}

export type CatalogItem = {
  id: string
  station_slug: Station
  name: string
  ticket_cost: number
  sort_order: number
  active: boolean
  created_at: string
}

export type StationEvent = {
  id: string
  child_id: string
  station: Station
  event_type: EventType
  tickets_delta: number
  item_name: string | null
  vibe_tags: string[]
  volunteer_name: string | null
  notes: string | null
  created_at: string
}

export type Photo = {
  id: string
  storage_path: string
  taken_at: string
  volunteer_name: string | null
  capture_mode: CaptureMode
  vision_summary: unknown
  match_confidence: number | null
  match_status: MatchStatus
}

export type PhotoTag = {
  id: string
  photo_id: string
  child_id: string
  tagged_by: PhotoTagSource
  created_at: string
}

export type FaceReference = {
  id: string
  child_id: string
  reference_photo_id: string | null
  embedding_data: unknown
  created_at: string
}

export type ReloadEvent = {
  id: string
  child_id: string
  tickets_added: number
  payment_method: PaymentMethod
  amount_charged: number | null
  staff_name: string | null
  created_at: string
}

export type AiStory = {
  id: string
  child_id: string
  generated_at: string | null
  status: AiStoryStatus
  story_html: string | null
  story_text: string | null
  photo_count: number | null
  word_count: number | null
  auto_check_score: number | null
  auto_check_notes: string | null
  sent_at: string | null
  delivery_email: string | null
  moderation_notes: string | null
}

export type EmailSend = {
  id: string
  primary_parent_email: string
  child_ids: string[]
  sent_at: string | null
  status: EmailStatus
  resend_message_id: string | null
  error: string | null
  created_at: string
}

export type Signature = {
  id: string
  child_id: string
  signature_type: SignatureType
  typed_name: string
  signed_at: string
  ip_address: string | null
  user_agent: string | null
}

export type AuditLog = {
  id: string
  action: AuditAction
  actor: string
  target_type: string | null
  target_id: string | null
  details: unknown
  ip_address: string | null
  created_at: string
}

export type Prize = {
  id: string
  label: string
  sub: string | null
  sort_order: number
  active: boolean
  created_at: string
}

export type PrizeRedemption = {
  id: string
  child_id: string
  prize_id: string
  volunteer_name: string | null
  updated_at: string
}

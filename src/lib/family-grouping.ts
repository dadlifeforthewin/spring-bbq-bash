import { serverClient } from './supabase'

const SIGNED_URL_TTL = 60 * 60 * 24 * 7 // 7 days per spec §5.7

export type FamilyStoryChild = {
  child_id: string
  story_id: string
  first_name: string
  last_name: string
  age: number | null
  story_html: string | null
  story_text: string | null
  stats_line: string
  photos: { url: string; alt?: string }[]
}

export type FamilyPayload = {
  primary_parent_email: string
  primary_parent_name: string
  /** All addresses to deliver to (primary + any secondary). Deduped + lowercased. */
  recipient_emails: string[]
  family_last_name: string
  children: FamilyStoryChild[]
  story_ids: string[]
  child_ids: string[]
}

const READY_STATUSES = new Set(['approved', 'auto_approved'])

function extractStatsLine(storyText: string | null | undefined): string {
  if (!storyText) return ''
  const m = storyText.match(/by the numbers[\s\S]+$/i)
  return m ? m[0].trim() : ''
}

export async function collectReadyFamilies(): Promise<FamilyPayload[]> {
  const sb = serverClient()

  const { data: stories, error } = await sb
    .from('ai_stories')
    .select('id, child_id, status, story_html, story_text')
    .in('status', Array.from(READY_STATUSES))
  if (error) throw new Error(`ai_stories query failed: ${error.message}`)
  if (!stories || stories.length === 0) return []

  const childIds = stories.map((s) => s.child_id)

  const [{ data: children }, { data: guardians }, { data: photoTags }] = await Promise.all([
    sb.from('children').select('id, first_name, last_name, age').in('id', childIds),
    sb.from('guardians').select('child_id, name, email, is_primary').in('child_id', childIds),
    sb.from('photo_tags').select('child_id, photos(id, storage_path, taken_at)').in('child_id', childIds),
  ])

  const childMap = new Map<string, { first_name: string; last_name: string; age: number | null }>()
  for (const c of children ?? []) childMap.set(c.id, { first_name: c.first_name, last_name: c.last_name, age: c.age })

  // Per-child: keep the primary guardian as the "named" parent on the email,
  // and accumulate every guardian email (primary + secondary) for delivery.
  const primaryGuardianByChild = new Map<string, { name: string; email: string }>()
  const guardianEmailsByChild = new Map<string, string[]>()
  for (const g of guardians ?? []) {
    if (!g.email) continue
    const norm = g.email.trim().toLowerCase()
    if (!norm) continue
    const list = guardianEmailsByChild.get(g.child_id) ?? []
    if (!list.includes(norm)) list.push(norm)
    guardianEmailsByChild.set(g.child_id, list)
    if (g.is_primary && !primaryGuardianByChild.has(g.child_id)) {
      primaryGuardianByChild.set(g.child_id, { name: g.name, email: norm })
    }
  }

  const photosByChild = new Map<string, { id: string; storage_path: string; taken_at: string }[]>()
  for (const t of photoTags ?? []) {
    const p = t.photos as unknown as { id: string; storage_path: string; taken_at: string } | null
    if (!p) continue
    const list = photosByChild.get(t.child_id) ?? []
    list.push(p)
    photosByChild.set(t.child_id, list)
  }

  const grouped = new Map<string, FamilyPayload>()

  for (const story of stories) {
    const child = childMap.get(story.child_id)
    const guardian = primaryGuardianByChild.get(story.child_id)
    if (!child || !guardian) continue

    const photos = (photosByChild.get(story.child_id) ?? [])
      .sort((a, b) => new Date(a.taken_at).getTime() - new Date(b.taken_at).getTime())
      .slice(0, 8)

    const signedPhotos: { url: string; alt?: string }[] = []
    for (const p of photos) {
      const { data } = await sb.storage.from('photos').createSignedUrl(p.storage_path, SIGNED_URL_TTL)
      if (data?.signedUrl) {
        signedPhotos.push({ url: data.signedUrl, alt: `${child.first_name} at the event` })
      }
    }

    const payload: FamilyStoryChild = {
      child_id: story.child_id,
      story_id: story.id,
      first_name: child.first_name,
      last_name: child.last_name,
      age: child.age,
      story_html: story.story_html,
      story_text: story.story_text,
      stats_line: extractStatsLine(story.story_text),
      photos: signedPhotos,
    }

    const childEmails = guardianEmailsByChild.get(story.child_id) ?? [guardian.email]

    const existing = grouped.get(guardian.email)
    if (existing) {
      existing.children.push(payload)
      existing.story_ids.push(story.id)
      existing.child_ids.push(story.child_id)
      for (const e of childEmails) {
        if (!existing.recipient_emails.includes(e)) existing.recipient_emails.push(e)
      }
    } else {
      grouped.set(guardian.email, {
        primary_parent_email: guardian.email,
        primary_parent_name: guardian.name,
        recipient_emails: [...childEmails],
        family_last_name: child.last_name,
        children: [payload],
        story_ids: [story.id],
        child_ids: [story.child_id],
      })
    }
  }

  // Ensure the primary email always sorts first so Resend's `to[0]` matches
  // the canonical address we record in email_sends.primary_parent_email.
  for (const fam of grouped.values()) {
    fam.recipient_emails = [
      fam.primary_parent_email,
      ...fam.recipient_emails.filter((e) => e !== fam.primary_parent_email),
    ]
  }

  return Array.from(grouped.values())
}

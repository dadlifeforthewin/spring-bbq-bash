import { verifyToken } from '@/lib/magic-link'
import { serverClient } from '@/lib/supabase'
import EditForm, { EditInitial } from '@/components/registration/EditForm'

async function loadInitial(token: string): Promise<EditInitial | null> {
  const payload = verifyToken(token)
  if (!payload || payload.scope !== 'edit' || !payload.family_primary_email) return null
  const email = payload.family_primary_email

  const sb = serverClient()

  const { data: primaryGuardians } = await sb
    .from('guardians')
    .select('child_id, name, phone, email')
    .eq('email', email)
    .eq('is_primary', true)

  const childIds = (primaryGuardians ?? []).map((g) => g.child_id)
  if (childIds.length === 0) return null

  const { data: children } = await sb
    .from('children')
    .select('id, first_name, last_name, age, grade, allergies, special_instructions, facts_reload_permission, facts_max_amount')
    .in('id', childIds)

  const { data: secondary } = await sb
    .from('guardians')
    .select('name, phone, email')
    .in('child_id', childIds)
    .eq('is_primary', false)

  const { data: pickups } = await sb
    .from('pickup_authorizations')
    .select('child_id, name, relationship')
    .in('child_id', childIds)

  const pickupByChild = new Map<string, { name: string; relationship: string | null }[]>()
  for (const p of pickups ?? []) {
    const list = pickupByChild.get(p.child_id) ?? []
    list.push({ name: p.name, relationship: p.relationship })
    pickupByChild.set(p.child_id, list)
  }

  const primary = primaryGuardians?.[0]
  const secondaryRow = secondary?.[0]

  return {
    primary_parent: {
      name: primary?.name ?? '',
      phone: primary?.phone ?? '',
      email: primary?.email ?? '',
    },
    secondary_parent: secondaryRow
      ? { name: secondaryRow.name, phone: secondaryRow.phone ?? '', email: secondaryRow.email ?? '' }
      : null,
    children: (children ?? []).map((c) => ({
      id: c.id,
      first_name: c.first_name,
      last_name: c.last_name,
      age: c.age,
      grade: c.grade ?? '',
      allergies: c.allergies ?? '',
      special_instructions: c.special_instructions ?? '',
      pickup_authorizations: pickupByChild.get(c.id) ?? [],
      facts_reload_permission: c.facts_reload_permission,
      facts_max_amount: c.facts_max_amount,
    })),
  }
}

export default async function EditPage({ params }: { params: { token: string } }) {
  const initial = await loadInitial(params.token)
  if (!initial) {
    return (
      <main className="mx-auto max-w-xl p-6 space-y-3">
        <h1 className="text-2xl font-bold">This edit link has expired</h1>
        <p className="text-slate-600">If you need to update your registration, please contact the school admin.</p>
      </main>
    )
  }
  return <EditForm token={params.token} initial={initial} />
}

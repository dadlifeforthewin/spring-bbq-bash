import { ReactNode } from 'react'
import ConsentBanner from './ConsentBanner'
import AllergiesBanner from './AllergiesBanner'

type ChildForCard = {
  first_name: string
  last_name: string
  age: number | null
  grade: string | null
  allergies: string | null
  photo_consent_app: boolean
  ticket_balance: number
}

type ParentForCard = {
  name: string
  phone: string | null
}

export default function ChildCard({
  child,
  primary_parent,
  children,
}: {
  child: ChildForCard
  primary_parent: ParentForCard
  children?: ReactNode
}) {
  const phone = primary_parent.phone ?? ''
  const borderClass = child.photo_consent_app ? 'border-green-500' : 'border-red-500'

  return (
    <article className={`overflow-hidden rounded-lg border-4 ${borderClass} bg-white shadow`}>
      <ConsentBanner photoConsentApp={child.photo_consent_app} />

      <div className="space-y-3 p-4">
        <header className="flex items-baseline justify-between gap-3">
          <h2 className="text-2xl font-black text-slate-900">
            {child.first_name} {child.last_name}
          </h2>
          <div className="text-sm text-slate-500">
            {child.age != null && <span className="mr-2">age {child.age}</span>}
            {child.grade && <span>grade {child.grade}</span>}
          </div>
        </header>

        <AllergiesBanner allergies={child.allergies} />

        <div className="flex items-center justify-between rounded bg-slate-100 px-3 py-2">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Parent</div>
            <div className="font-semibold text-slate-900">{primary_parent.name}</div>
          </div>
          {phone && (
            <div className="flex gap-2">
              <a
                href={`tel:${phone}`}
                className="rounded bg-blue-600 px-3 py-1.5 text-sm font-bold text-white"
              >
                📞 Call
              </a>
              <a
                href={`sms:${phone}`}
                className="rounded bg-blue-600 px-3 py-1.5 text-sm font-bold text-white"
              >
                💬 Text
              </a>
            </div>
          )}
        </div>

        <div className="flex items-baseline justify-between">
          <span className="text-sm uppercase tracking-wide text-slate-500">Tickets</span>
          <span className="text-3xl font-black text-slate-900">{child.ticket_balance}</span>
        </div>

        {children && <div className="pt-2">{children}</div>}
      </div>
    </article>
  )
}

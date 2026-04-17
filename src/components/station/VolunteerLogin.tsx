'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function VolunteerLogin() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/volunteer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        setError('Wrong password.')
        return
      }
      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-sm items-center p-6">
      <form onSubmit={onSubmit} className="w-full space-y-4">
        <h1 className="text-3xl font-black">Volunteer Sign-In</h1>
        <label className="block">
          <span className="block text-sm text-slate-600">Shared password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            aria-label="volunteer password"
            className="w-full rounded border px-3 py-2"
          />
        </label>
        {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-fuchsia-600 py-3 font-bold text-white disabled:opacity-50"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  )
}

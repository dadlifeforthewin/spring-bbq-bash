'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GlowCross } from '@/components/glow/GlowCross'
import { Button } from '@/components/glow/Button'
import { Input } from '@/components/glow/Input'
import { Heading, Eyebrow } from '@/components/glow/Heading'

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
    <main className="flex min-h-[70dvh] items-center">
      <form onSubmit={onSubmit} className="w-full space-y-6">
          <div className="text-center space-y-4">
            <div className="inline-flex justify-center">
              <GlowCross size={56} tone="cyan" />
            </div>
            <Eyebrow tone="magenta">Volunteers only</Eyebrow>
            <Heading level={1} size="lg" tone="wordmark">
              Volunteer Sign-In
            </Heading>
            <p className="text-sm text-mist">
              Shared password from the volunteer brief.
            </p>
          </div>

          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            aria-label="volunteer password"
            label="Volunteer password"
            placeholder="••••••••"
          />

          {error && (
            <p role="alert" className="rounded-xl border border-danger/60 bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <Button type="submit" tone="magenta" size="xl" fullWidth loading={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
    </main>
  )
}

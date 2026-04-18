'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Aurora } from '@/components/glow/Aurora'
import { GlowCross } from '@/components/glow/GlowCross'
import { Button } from '@/components/glow/Button'
import { Input } from '@/components/glow/Input'
import { Heading, Eyebrow } from '@/components/glow/Heading'

export default function AdminLogin() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/admin', {
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
    <div className="relative min-h-screen">
      <Aurora className="fixed inset-0 z-0" />
      <main className="relative z-10 mx-auto flex min-h-[85vh] max-w-sm items-center px-6">
        <form onSubmit={onSubmit} className="w-full space-y-6">
          <div className="text-center space-y-4">
            <div className="inline-flex justify-center">
              <GlowCross size={56} tone="gold" />
            </div>
            <Eyebrow tone="gold">Organizers only</Eyebrow>
            <Heading level={1} size="lg" tone="wordmark">
              Admin Sign-In
            </Heading>
            <p className="text-sm text-mist">
              Admin password controls dashboards, bulk ops, and story moderation.
            </p>
          </div>

          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            aria-label="admin password"
            label="Admin password"
            placeholder="••••••••"
          />

          {error && (
            <p role="alert" className="rounded-xl border border-danger/60 bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <Button type="submit" tone="gold" size="xl" fullWidth loading={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </main>
    </div>
  )
}

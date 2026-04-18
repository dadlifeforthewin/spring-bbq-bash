import Link from 'next/link'
import { Aurora } from '@/components/glow/Aurora'
import { GlowCross } from '@/components/glow/GlowCross'
import { Heading, Eyebrow } from '@/components/glow/Heading'
import { Button } from '@/components/glow/Button'
import { Chip } from '@/components/glow/Chip'
import { Card, CardEyebrow } from '@/components/glow/Card'

export default function Home() {
  return (
    <div className="relative min-h-screen">
      <Aurora className="fixed inset-0 z-0" />

      <main className="relative z-10 mx-auto max-w-2xl px-6 pt-16 pb-20 space-y-10 text-center">
        <div className="flex justify-center">
          <GlowCross size={80} tone="cyan" />
        </div>

        <div className="space-y-4">
          <Eyebrow tone="magenta">Lincoln Christian Academy · Est. 1995 · 30 Years</Eyebrow>
          <Heading level={1} tone="wordmark" size="2xl">Spring BBQ Bash</Heading>
          <p className="font-display text-neon-gold text-glow-gold text-lg tracking-wide">
            Glow Party Edition
          </p>
          <p className="text-mist text-sm">
            Saturday, April 25, 2026 · 5:00–8:00 PM
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <Chip tone="magenta" glow>2 drinks</Chip>
          <Chip tone="cyan" glow>3 jail / pass</Chip>
          <Chip tone="gold" glow>1 prize spin</Chip>
          <Chip tone="uv" glow>1 DJ shoutout</Chip>
        </div>

        <Card tone="default" padded className="text-left space-y-4">
          <CardEyebrow className="text-neon-cyan">Parents</CardEyebrow>
          <p className="text-paper text-sm leading-relaxed">
            After you&apos;ve bought your ticket, finish the permission slip so
            your kid&apos;s wristband is ready when they arrive.
          </p>
          <Link href="/register">
            <Button tone="magenta" size="lg" fullWidth>
              Fill out permission slip →
            </Button>
          </Link>
        </Card>

        <Card tone="default" padded className="text-left space-y-4">
          <CardEyebrow className="text-neon-gold">Volunteers &amp; organizers</CardEyebrow>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/station">
              <Button tone="cyan" size="md" fullWidth>Volunteer portal</Button>
            </Link>
            <Link href="/admin">
              <Button tone="gold" size="md" fullWidth>Admin</Button>
            </Link>
          </div>
        </Card>

        <footer className="pt-8 space-y-1">
          <p className="text-xs text-faint">
            Designed &amp; built by{' '}
            <a href="https://attntodetail.ai" className="text-neon-cyan hover:text-glow-cyan transition">
              Attn: To Detail
            </a>
          </p>
          <p className="text-[10px] text-faint/70">
            Donated to LCA in celebration of 30 years.
          </p>
        </footer>
      </main>
    </div>
  )
}

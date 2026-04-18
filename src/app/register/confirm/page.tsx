import { Aurora } from '@/components/glow/Aurora'
import { GlowCross } from '@/components/glow/GlowCross'
import { Heading, Eyebrow } from '@/components/glow/Heading'
import { Card, CardEyebrow } from '@/components/glow/Card'
import { Chip } from '@/components/glow/Chip'

export default function ConfirmPage() {
  return (
    <div className="relative min-h-screen">
      <Aurora className="fixed inset-0 z-0" />

      <main className="relative z-10 mx-auto max-w-xl px-5 pt-20 pb-24 text-center space-y-8">
        <div className="flex justify-center">
          <GlowCross size={96} tone="magenta" />
        </div>

        <div className="space-y-4">
          <Eyebrow tone="magenta">You&apos;re registered</Eyebrow>
          <Heading level={1} tone="wordmark" size="xl">
            See you Friday under the blacklight.
          </Heading>
          <p className="text-mist text-base leading-relaxed max-w-md mx-auto">
            Every kid arrives with the full Glow Party Edition perks preloaded.
            Volunteers will track the rest on their wristband.
          </p>
        </div>

        <Card tone="default" padded className="text-left space-y-4">
          <CardEyebrow className="text-neon-cyan">What to know</CardEyebrow>
          <ul className="space-y-3 text-sm text-paper leading-relaxed">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 text-neon-magenta">01</span>
              <span>Arrive Saturday, April 25, anytime between 5:00 and 8:00 PM. Check-in + jail mugshot happen together.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 text-neon-cyan">02</span>
              <span>Wear something glow-friendly if you can — white, neon, anything that pops under blacklight.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 text-neon-uv">03</span>
              <span>Keepsake email lands the morning after with photos, your kid&apos;s story, and a download link.</span>
            </li>
          </ul>
        </Card>

        <div className="flex flex-wrap justify-center gap-2">
          <Chip tone="magenta" glow>2 drinks</Chip>
          <Chip tone="cyan" glow>3 jail / pass</Chip>
          <Chip tone="gold" glow>1 prize spin</Chip>
          <Chip tone="uv" glow>1 DJ shoutout</Chip>
        </div>

        <footer className="pt-8 border-t border-ink-hair/60">
          <p className="text-xs text-faint max-w-md mx-auto leading-relaxed">
            Permission slip saved. Need to update pickup authorizations or
            contact info? We&apos;ll include an edit link in your keepsake
            email the morning after the event.
          </p>
        </footer>
      </main>
    </div>
  )
}

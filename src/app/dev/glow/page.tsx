'use client'

import { useState } from 'react'
import {
  Aurora, GridFloor,
  NeonWordmark, SectionHeading, PageHead,
  SignPanel, BigToggle, NeonScanner,
  StatTile, TimelineTrack, AdminNav,
  GlyphGlow,
  DrinksGlyph, JailGlyph, PrizeWheelGlyph, DJGlyph,
  CheckInGlyph, CheckOutGlyph, PhotoGlyph, RoamingGlyph,
  Button, Chip, Card,
  GlowCross,
} from '@/components/glow'
import type { TimelineItem } from '@/components/glow'

const TONES: Array<'magenta' | 'cyan' | 'uv' | 'gold' | 'mint'> = [
  'magenta', 'cyan', 'uv', 'gold', 'mint',
]

const TIMELINE_SAMPLE: TimelineItem[] = [
  { time: '5:00', label: 'Doors open',               state: 'done', tone: 'mint' },
  { time: '5:30', label: 'Welcome + glow check-in',  state: 'done', tone: 'cyan' },
  { time: '6:15', label: 'Stations in full swing',   state: 'now',  tone: 'gold' },
  { time: '7:00', label: 'Prize wheel grand finale', state: 'next', tone: 'uv' },
  { time: '7:45', label: 'DJ shoutouts',             state: 'next', tone: 'magenta' },
  { time: '8:00', label: 'Doors close',              state: 'next', tone: 'mint' },
]

export default function GlowShowcase() {
  const [toggle1, setToggle1] = useState(true)
  const [toggle2, setToggle2] = useState(false)

  return (
    <div className="relative min-h-dvh bg-ink text-paper">
      <Aurora className="opacity-60" />
      <GridFloor className="opacity-30" />
      <div className="relative z-10 mx-auto max-w-[1200px] px-5 py-10">
        {/* Header */}
        <div className="mb-10 flex items-baseline justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-mist [font-family:var(--font-mono),JetBrains_Mono,monospace]">
              /dev/glow · primitive showcase
            </div>
            <h1 className="font-display text-3xl font-bold text-paper mt-1">
              Glow redesign — primitive inventory
            </h1>
          </div>
          <Chip tone="cyan" glow>20 components</Chip>
        </div>

        {/* ========== 1. Wordmark ========== */}
        <Section num="01" title="NeonWordmark" tone="cyan">
          <div className="flex flex-wrap items-center gap-6">
            {TONES.concat('paper' as any).map((t) => (
              <NeonWordmark key={t} tone={t as any} size="md">BASH &amp; GLOW</NeonWordmark>
            ))}
          </div>
          <div className="mt-6">
            <NeonWordmark tone="cyan" size="xl">SPRING BBQ</NeonWordmark>
          </div>
        </Section>

        {/* ========== 2. Section Heading ========== */}
        <Section num="02" title="SectionHeading" tone="gold">
          <div className="space-y-3 max-w-2xl">
            <SectionHeading num="LOG" title="Recent arrivals" tone="cyan" />
            <SectionHeading num="NOW" title="Live activity" tone="gold" />
            <SectionHeading num="LIVE" title="Stations · 8 open" tone="mint" />
            <SectionHeading num="DRAFT" title="Story in review" tone="uv" />
            <SectionHeading num="ALERTS" title="2 flagged" tone="magenta" />
          </div>
        </Section>

        {/* ========== 3. Page Head ========== */}
        <Section num="03" title="PageHead" tone="magenta">
          <div className="rounded-xl border border-ink-hair bg-ink-2/40 p-6 max-w-3xl">
            <PageHead
              back={{ href: '#', label: 'stations' }}
              title="PHOTO BOOTH"
              sub="Tap to snap. Consent-off kids get text-only receipts."
              right={<Chip tone="magenta" glow>TAKEN · 48</Chip>}
            />
          </div>
        </Section>

        {/* ========== 4. Station Glyphs (under GlyphGlow) ========== */}
        <Section num="04" title="Station glyphs (8)" tone="uv">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { Comp: DrinksGlyph,     tone: 'cyan',    name: 'Drinks' },
              { Comp: JailGlyph,       tone: 'magenta', name: 'Jail / Pass' },
              { Comp: PrizeWheelGlyph, tone: 'gold',    name: 'Prize Wheel' },
              { Comp: DJGlyph,         tone: 'uv',      name: 'DJ Shoutout' },
              { Comp: CheckInGlyph,    tone: 'cyan',    name: 'Check-in' },
              { Comp: CheckOutGlyph,   tone: 'mint',    name: 'Check-out' },
              { Comp: PhotoGlyph,      tone: 'magenta', name: 'Photo Booth' },
              { Comp: RoamingGlyph,    tone: 'uv',      name: 'Roaming' },
            ].map(({ Comp, tone, name }) => (
              <div key={name} className="flex flex-col items-center gap-3 rounded-xl border border-ink-hair bg-ink-2/40 p-5">
                <GlyphGlow tone={tone as any} size={80}><Comp /></GlyphGlow>
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-paper">{name}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* ========== 5. Stat Tiles ========== */}
        <Section num="05" title="StatTile" tone="mint">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <StatTile label="Checked in"    value="217" tone="mint"    outline />
            <StatTile label="Expected"      value="310" tone="cyan"    outline />
            <StatTile label="Kids zone"     value="58"  tone="magenta" outline />
            <StatTile label="Photos"        value="94"  tone="gold"    outline />
            <StatTile label="Stories ready" value="6"   tone="uv"      outline />
          </div>
          <div className="mt-4 text-[11px] text-mist">(second row — solid bg, no `outline`)</div>
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-5 gap-3">
            {TONES.map((t) => (
              <StatTile key={t} label={t} value="42" tone={t} />
            ))}
          </div>
        </Section>

        {/* ========== 6. Sign Panel ========== */}
        <Section num="06" title="SignPanel" tone="cyan">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TONES.map((t) => (
              <SignPanel key={t} tone={t} padding="md">
                <div className="text-[10px] uppercase tracking-[0.14em] text-mist [font-family:var(--font-mono),JetBrains_Mono,monospace]">{t} tone</div>
                <div className="mt-2 font-display text-lg font-bold text-paper">
                  Wristband · {t.toUpperCase()}-04
                </div>
                <div className="mt-1 text-sm text-mist">Pickup code 7214 · Tent B · Craft table</div>
              </SignPanel>
            ))}
          </div>
        </Section>

        {/* ========== 7. Big Toggle ========== */}
        <Section num="07" title="BigToggle" tone="mint">
          <div className="space-y-3 max-w-xl">
            <BigToggle checked={toggle1} onChange={setToggle1} label="I agree to the photo release" sub="Required to upload photos to the family album" tone="mint" />
            <BigToggle checked={toggle2} onChange={setToggle2} label="Opt in to AI story" sub="You can pick opt-out instead" tone="cyan" />
            <BigToggle checked={false} onChange={() => {}} label="Disabled example" sub="Can't toggle this" tone="gold" disabled />
          </div>
        </Section>

        {/* ========== 8. Neon Scanner ========== */}
        <Section num="08" title="NeonScanner" tone="gold">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <div className="mb-2 text-[11px] text-mist">cyan · scanning</div>
              <NeonScanner tone="cyan" aspect="portrait" hint="Align QR · auto-capture" scanning>
                <GlyphGlow tone="cyan" size={72}><CheckInGlyph /></GlyphGlow>
              </NeonScanner>
            </div>
            <div>
              <div className="mb-2 text-[11px] text-mist">magenta · snap</div>
              <NeonScanner tone="magenta" aspect="portrait" hint="Tap · 3-2-1" scanning>
                <GlyphGlow tone="magenta" size={72}><PhotoGlyph /></GlyphGlow>
              </NeonScanner>
            </div>
            <div>
              <div className="mb-2 text-[11px] text-mist">mint · idle</div>
              <NeonScanner tone="mint" aspect="portrait" hint="Align wristband" scanning={false}>
                <GlyphGlow tone="mint" size={72}><CheckOutGlyph /></GlyphGlow>
              </NeonScanner>
            </div>
            <div>
              <div className="mb-2 text-[11px] text-mist">uv · placeholder = cross</div>
              <NeonScanner tone="uv" aspect="portrait" hint="Uploading…" scanning>
                <GlowCross size={72} tone="uv" />
              </NeonScanner>
            </div>
          </div>
        </Section>

        {/* ========== 9. Timeline Track ========== */}
        <Section num="09" title="TimelineTrack" tone="uv">
          <SignPanel tone="uv" padding="lg">
            <div className="text-[10px] uppercase tracking-[0.14em] text-neon-uv [font-family:var(--font-mono),JetBrains_Mono,monospace]">NIGHT TIMELINE</div>
            <div className="mt-3">
              <TimelineTrack items={TIMELINE_SAMPLE} />
            </div>
          </SignPanel>
        </Section>

        {/* ========== 10. Admin Nav ========== */}
        <Section num="10" title="AdminNav" tone="magenta">
          <div className="rounded-xl overflow-hidden border border-ink-hair">
            <AdminNav
              active="photos"
              right={<Chip tone="mint" glow>LIVE · 217 ONSITE</Chip>}
            />
          </div>
        </Section>

        {/* ========== 11. Existing Primitives (for comparison) ========== */}
        <Section num="11" title="Existing primitives (for reference)" tone="mint">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {TONES.map((t) => (
                <Button key={t} tone={t === 'uv' ? 'uv' : t === 'magenta' ? 'magenta' : t === 'cyan' ? 'cyan' : t === 'gold' ? 'gold' : 'mint'}>{t}</Button>
              ))}
              <Button tone="ghost">ghost</Button>
              <Button tone="danger">danger</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {TONES.map((t) => (
                <Chip key={t} tone={t === 'uv' ? 'uv' : t as any} glow>{t}</Chip>
              ))}
              <Chip tone="danger" glow>danger</Chip>
              <Chip tone="warn" glow>warn</Chip>
              <Chip tone="quiet">quiet</Chip>
            </div>
            <Card tone="glow-cyan">
              <div className="font-display text-lg text-paper">Card · glow-cyan</div>
              <div className="text-sm text-mist mt-1">The existing Card primitive already supports 5 glow variants + default/raised/outline.</div>
            </Card>
          </div>
        </Section>

        <div className="mt-12 mb-4 text-center text-[10px] text-mist uppercase tracking-[0.18em] [font-family:var(--font-mono),JetBrains_Mono,monospace]">
          END · /dev/glow · 20 primitives on branch glow-redesign
        </div>
      </div>
    </div>
  )
}

function Section({ num, title, tone, children }: { num: string; title: string; tone: 'magenta' | 'cyan' | 'uv' | 'gold' | 'mint'; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <SectionHeading num={num} title={title} tone={tone} />
      <div className="mt-5">{children}</div>
    </section>
  )
}

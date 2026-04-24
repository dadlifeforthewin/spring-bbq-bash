/* In-app volunteer cheat sheet. Source of truth for in-product help.
 * The print-ready paper version lives at `docs/runbooks/volunteer-cheatsheet.md` —
 * keep both in sync when copy changes. */

import Link from 'next/link'
import { PageHead, Chip } from '@/components/glow'

export const dynamic = 'force-static'

type StationLink = { id: string; label: string; emoji: string }

const STATIONS: StationLink[] = [
  { id: 'check-in', label: 'Check-in', emoji: '👋' },
  { id: 'check-out', label: 'Check-out', emoji: '🚪' },
  { id: 'drinks', label: 'Drinks', emoji: '🥤' },
  { id: 'jail', label: 'Jail', emoji: '🚨' },
  { id: 'prize-wheel', label: 'Prize Wheel', emoji: '🎡' },
  { id: 'dj', label: 'DJ Shoutout', emoji: '📻' },
  { id: 'photo', label: 'Photo', emoji: '✨' },
  { id: 'roaming', label: 'Roaming', emoji: '📸' },
  { id: 'free-stations', label: 'Free stations', emoji: '🌽' },
]

function Section({
  id,
  emoji,
  title,
  meter,
  children,
}: {
  id: string
  emoji: string
  title: string
  meter?: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      className="scroll-mt-4 rounded-2xl border border-ink-hair/70 bg-ink-2/60 p-4 space-y-3"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-lg font-bold tracking-tight text-paper leading-tight">
          <span aria-hidden className="mr-2">
            {emoji}
          </span>
          {title}
        </h2>
        {meter && (
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-mist [font-family:var(--font-mono),JetBrains_Mono,monospace]">
            {meter}
          </span>
        )}
      </div>
      <div className="text-sm text-paper/90 leading-relaxed space-y-2 [&_strong]:text-paper [&_strong]:font-semibold [&_em]:not-italic [&_em]:text-neon-cyan [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-0.5 [&_code]:rounded [&_code]:bg-ink/80 [&_code]:border [&_code]:border-ink-hair [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-xs [&_code]:[font-family:var(--font-mono),monospace]">
        {children}
      </div>
    </section>
  )
}

function Note({
  tone,
  children,
}: {
  tone: 'red' | 'yellow' | 'cyan'
  children: React.ReactNode
}) {
  const palette = {
    red: 'border-red-500/50 bg-red-500/10 text-red-100',
    yellow: 'border-amber-400/55 bg-amber-400/10 text-amber-100',
    cyan: 'border-neon-cyan/50 bg-neon-cyan/10 text-paper',
  }[tone]
  return (
    <div className={`mt-2 rounded-lg border px-3 py-2 text-sm ${palette}`}>
      {children}
    </div>
  )
}

export default function HelpPage() {
  return (
    <>
      <PageHead
        back={{ href: '/station', label: 'station' }}
        title="VOLUNTEER HELP"
        sub="Find your station below. Each section is the same as the printed cheat sheet."
        right={<Chip tone="cyan" glow>HELP</Chip>}
      />

      {/* Sticky station jumper — most important nav for a volunteer who tapped Help mid-shift */}
      <nav
        aria-label="Jump to station"
        className="sticky top-0 z-10 -mx-4 px-4 py-3 mt-4 border-b border-ink-hair/60 bg-ink/85 backdrop-blur-md"
      >
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-mist mb-2 [font-family:var(--font-mono),JetBrains_Mono,monospace]">
          Jump to your station
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="inline-flex items-center gap-1 min-h-[36px] rounded-full border border-ink-hair bg-ink-2/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-paper hover:border-neon-cyan/55 hover:text-neon-cyan transition-colors active:scale-[0.97] touch-manipulation"
            >
              <span aria-hidden>{s.emoji}</span>
              <span>{s.label}</span>
            </a>
          ))}
        </div>
      </nav>

      <div className="mt-4 space-y-3">
        <Section id="before" emoji="🚦" title="Before kids arrive">
          <ul>
            <li>Open the URL on your tablet or phone. Allow the camera when it asks.</li>
            <li>Type the password once. The app remembers you all night.</li>
            <li>Tap your station from the picker. Next scan goes straight to your post.</li>
            <li>If anything looks weird or stuck, find Brian or the admin. Don&apos;t refresh wildly — you&apos;ll lose the station selection.</li>
          </ul>
        </Section>

        <Section id="universal" emoji="🔁" title="How every station works">
          <ol>
            <li><strong>Scan</strong> the kid&apos;s wristband QR (or paste the code into the box if the camera struggles).</li>
            <li>Tap <strong>Look up</strong> — the kid&apos;s card appears with name, perk balance, and a colored consent banner.</li>
            <li><strong>Do your station&apos;s action</strong> (tap the right button, see your section below).</li>
            <li>Wait for the green <em>✨</em> success toast. Tap <strong>Scan next wristband</strong> to move on.</li>
          </ol>
          <Note tone="red">
            If the card border is <strong>red</strong>, do not photograph this kid. Period.
          </Note>
          <Note tone="yellow">
            If the card has a <strong>yellow allergy banner</strong>, read it before handing them food or letting them visit the kitchen.
          </Note>
        </Section>

        <Section id="check-in" emoji="👋" title="Check-in">
          <p><strong>Your job:</strong> Greet the family at the jail set, take the mugshot, send them in.</p>
          <ol>
            <li>Scan kid&apos;s QR. Have siblings? Scan each one.</li>
            <li>Type your name in &quot;Your name (staff)&quot;.</li>
            <li>Camera shows the jail viewfinder. Frame the family at the jail set. Tap <strong>📸 Take mugshot</strong>. Wait for &quot;Mugshot saved&quot;.</li>
            <li>Pick the dropoff: <strong>Both parents / One parent / Grandparent / Other approved adult</strong>.</li>
            <li>Tap the big magenta <strong>Check In</strong> button.</li>
            <li>Green toast = done. Hand them a wristband if not already on. Send them off.</li>
          </ol>
          <Note tone="red">
            <strong>If the card is red (no photos):</strong> a red box says &quot;🚫 No photo consent — mugshot is skipped.&quot; Just pick the dropoff and tap Check In. Skip the photo entirely.
          </Note>
          <Note tone="yellow">
            <strong>If already checked in:</strong> Yellow box says when. Don&apos;t double check-in. Send them on.
          </Note>
        </Section>

        <Section id="check-out" emoji="🚪" title="Check-out">
          <p><strong>Your job:</strong> Make sure the kid leaves with someone on their approved list.</p>
          <ol>
            <li>Scan kid&apos;s QR.</li>
            <li>The app shows pre-approved pickup people: primary parent, secondary parent, plus anyone the family added (Grandma, Aunt, etc.). <strong>Tap the person who&apos;s actually here.</strong></li>
            <li>Type your name in &quot;Your name (staff)&quot;.</li>
            <li>Tap mint-green <strong>Release to selected</strong>.</li>
            <li>Green toast = the kid is officially released and the keepsake-email story starts generating in the background.</li>
          </ol>
          <Note tone="red">
            <strong>If the pickup person is NOT on the list:</strong> STOP. Do not release the child. Walk to the head check-out volunteer or call the admin. The parent must verbally authorize over the phone, and an admin must override.
          </Note>
          <Note tone="yellow">
            <strong>If the kid isn&apos;t checked in yet:</strong> Yellow box. Send them to the check-in table first.
          </Note>
        </Section>

        <Section id="drinks" emoji="🥤" title="Drinks" meter="2 per kid">
          <p><strong>Your job:</strong> Pour the drink, mark it on their wristband.</p>
          <ol>
            <li>Scan kid&apos;s QR.</li>
            <li>The card shows their <strong>drinks remaining</strong> (cyan chip). Should be 2, 1, or 0.</li>
            <li>Tap cyan <strong>Redeem drink ticket</strong>.</li>
            <li>Green toast: &quot;Drink redeemed — N left.&quot; Pour the drink. Done.</li>
          </ol>
          <Note tone="red">
            <strong>If 0 left:</strong> Red banner says so. Button disabled. Send the parent to Brian — admin can comp extra tickets from the child detail page.
          </Note>
        </Section>

        <Section id="jail" emoji="🚨" title="Jail" meter="3 sends or passes total">
          <p><strong>Your job:</strong> Lock &apos;em up, or use a pass to spring a kid out.</p>
          <ol>
            <li>Scan kid&apos;s QR.</li>
            <li>The card shows <strong>jail / pass remaining</strong> (magenta chip). Same bucket — sends and passes both pull from the same 3.</li>
            <li>Pick <strong>🚨 Send to jail</strong> or <strong>🗝️ Use pass</strong>.</li>
            <li>Type your name (optional).</li>
            <li>Tap <strong>Send to jail</strong> or <strong>Use get-out pass</strong>.</li>
            <li>Green toast confirms it.</li>
          </ol>
          <Note tone="red">
            <strong>If 0 left:</strong> Red banner. Button disabled. They&apos;re out for the rest of the night — no reload.
          </Note>
          <Note tone="cyan">
            Check-in already takes a separate jail-style mugshot. The &quot;Send to jail&quot; action just logs a visit — no second photo needed.
          </Note>
        </Section>

        <Section id="prize-wheel" emoji="🎡" title="Prize Wheel" meter="1 spin per kid">
          <p><strong>Your job:</strong> Spin the wheel, hand out the prize.</p>
          <ol>
            <li>Scan kid&apos;s QR.</li>
            <li>Card shows &quot;1 prize wheel&quot; (gold) — or &quot;used&quot; with a strike-through if they already spun.</li>
            <li>Tap <strong>Spin the wheel</strong>.</li>
            <li>Green toast: &quot;Prize wheel spun. One per kid — done for the night.&quot;</li>
          </ol>
          <Note tone="yellow">
            <strong>Already spun:</strong> Yellow banner says so. Button disabled. Send them on. No exceptions without admin override.
          </Note>
        </Section>

        <Section id="dj" emoji="📻" title="DJ Shoutout" meter="1 per kid">
          <p><strong>Your job:</strong> Take their song request, queue it for the DJ.</p>
          <ol>
            <li>Scan kid&apos;s QR.</li>
            <li>Card shows &quot;1 DJ shoutout&quot; (purple) — or &quot;used&quot; if they already requested.</li>
            <li>Type the song into the <strong>Song request</strong> box. Keep it kid-appropriate.</li>
            <li>Tap purple <strong>Queue shoutout</strong>.</li>
            <li>Green toast confirms. Hand the request to the DJ on paper if needed.</li>
          </ol>
          <Note tone="yellow">
            <strong>Already requested:</strong> Yellow banner. Button disabled. Tell them their first song is still in the queue.
          </Note>
        </Section>

        <Section id="photo" emoji="✨" title="Photo (scan-then-shoot)">
          <p><strong>Your job:</strong> Capture posed photos at any of the booth-style stations.</p>
          <ol>
            <li>Scan <strong>every kid in the frame</strong> — each one becomes a chip at the top.</li>
            <li>Type your name (optional).</li>
            <li>Allow the camera. Frame the shot. Tap big magenta <strong>📸 Shutter (N)</strong> where N is how many kids are in frame.</li>
            <li>Green toast: &quot;✨ Uploaded · tagged N kids.&quot; Photo saves against every kid you scanned.</li>
            <li>Same group? Just tap shutter again. Different group? Tap ✕ on each chip and scan new kids.</li>
          </ol>
          <Note tone="red">
            <strong>If a kid in the batch has NO photo consent:</strong> A full-screen red modal blocks the shutter. Tap &quot;Remove no-consent kids&quot; — they vanish from the chips and you can shoot the rest. Or ask the kid to step out of frame.
          </Note>
        </Section>

        <Section id="roaming" emoji="📸" title="Roaming photographer">
          <p><strong>Your job:</strong> Shoot candids around the room. The app figures out who&apos;s in each photo.</p>
          <ol>
            <li>Type your name (optional).</li>
            <li>Allow camera. Aim. Tap purple <strong>📸 Shutter</strong>.</li>
            <li>The shot appears in &quot;Recent shots&quot;: uploading → analyzing → &quot;✅ tagged [name]&quot; / &quot;🔍 pending review&quot; / &quot;❓ unmatched&quot;.</li>
            <li>Just keep shooting. Don&apos;t wait between shots.</li>
          </ol>
          <Note tone="cyan">
            Only kids whose parents opted in to face matching get auto-tagged. &quot;Unmatched&quot; photos get reviewed later by the admin — that&apos;s normal, don&apos;t worry about it.
          </Note>
        </Section>

        <Section id="free-stations" emoji="🌽" title="Free stations (cornhole, face painting, arts &amp; crafts, video games, dance, pizza, cake walk, movie room)">
          <p><strong>Your job:</strong> Run your station. Scan to log the visit so the kid&apos;s keepsake email mentions it.</p>
          <ol>
            <li>Scan kid&apos;s QR.</li>
            <li>Tap <strong>Log visit</strong>.</li>
            <li>Green toast: &quot;Visit logged — [Name] was here.&quot;</li>
          </ol>
          <p>No tickets get spent. No balance changes. Just a record so tomorrow&apos;s email tells the parent their kid was here.</p>
        </Section>

        <Section id="comp-reloads" emoji="💵" title="Comp reloads">
          <p>No volunteer station for this. If a parent wants more drink tickets, send them to <strong>Brian</strong>. Admin comps tickets from the child detail page in <code>/admin/children</code>. Jail, prize wheel, and DJ cannot be reloaded — they&apos;re one-per-kid for the night.</p>
        </Section>

        <Section id="troubleshooting" emoji="🛠️" title="If something goes wrong">
          <ul className="!pl-0 !list-none space-y-2">
            <li className="rounded-md border border-ink-hair/70 bg-ink/40 p-2.5"><strong>App is slow:</strong> Wait 5 seconds and try again. Most actions are quick — slowness usually means the network is choking.</li>
            <li className="rounded-md border border-ink-hair/70 bg-ink/40 p-2.5"><strong>QR won&apos;t scan</strong> (camera struggling, blacklight is rough on cameras): Type the code manually into the input box below the camera. Every station has one.</li>
            <li className="rounded-md border border-ink-hair/70 bg-ink/40 p-2.5"><strong>Kid forgot or lost their wristband:</strong> Call the admin. Admin can look the kid up by name in <code>/admin/children</code> and reissue or use a temporary code.</li>
            <li className="rounded-md border border-ink-hair/70 bg-ink/40 p-2.5"><strong>Card says &quot;0 left&quot; but kid swears they have more:</strong> Call the admin. Admin can comp tickets via the child detail page.</li>
            <li className="rounded-md border border-ink-hair/70 bg-ink/40 p-2.5"><strong>Camera doesn&apos;t open:</strong> Refresh the page (you may need to log back in). On iPhone Safari: Settings → Safari → Camera → Allow.</li>
            <li className="rounded-md border border-ink-hair/70 bg-ink/40 p-2.5"><strong>Lost the station picker</strong> (got dumped to &quot;no station selected&quot;): Tap <strong>Pick a station</strong> and pick yours again.</li>
            <li className="rounded-md border border-ink-hair/70 bg-ink/40 p-2.5"><strong>Yellow &quot;Not checked in yet&quot; warning when you scan:</strong> Send the kid to the <strong>Check-in</strong> table first. Nothing else works until they&apos;re checked in.</li>
            <li className="rounded-md border border-ink-hair/70 bg-ink/40 p-2.5"><strong>Tapped the wrong action and it went through:</strong> Call the admin. They can reverse most things from the child detail page.</li>
          </ul>
        </Section>

        <Section id="who-to-find" emoji="📞" title="Who to find for what">
          <ul>
            <li><strong>App not working / scanner broken:</strong> Brian (cell number on a sticker on your tablet).</li>
            <li><strong>Allergy emergency or any medical issue:</strong> Call 911 first. Then alert the head of school.</li>
            <li><strong>Lost child:</strong> Head check-out volunteer + admin together. Sweep stations.</li>
            <li><strong>Pickup person not on the approved list:</strong> Head check-out runs the override. Do NOT release the child without it.</li>
            <li><strong>Parent disputes a ticket count or wants a comp:</strong> Send them to the admin. Don&apos;t argue with parents.</li>
            <li><strong>Kid wandered into the wrong area:</strong> Walk them back. No app action needed.</li>
          </ul>
        </Section>

        <div className="pt-2 pb-6 text-center">
          <Link
            href="/station"
            className="inline-flex items-center gap-1.5 min-h-[44px] rounded-xl border border-ink-hair bg-ink-2/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-paper hover:border-neon-cyan/50 hover:text-neon-cyan transition-colors active:scale-[0.98] touch-manipulation [font-family:var(--font-mono),JetBrains_Mono,monospace]"
          >
            <span aria-hidden>←</span>
            <span>Back to stations</span>
          </Link>
        </div>
      </div>
    </>
  )
}

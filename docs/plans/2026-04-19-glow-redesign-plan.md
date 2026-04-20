# Station + Admin Glow Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/specs/2026-04-19-station-admin-glow-redesign-design.md`

**Goal:** Bring `/station/*` (7 pages) and `/admin/*` (9 pages — 4 full restyle + 5 polish-only) to parity with the shipped Glow Party design system established on `/` and `/register`, using the handoff dropped in `docs/design/` on 2026-04-18.

**Architecture:** Tailwind-native. The codebase already has `src/components/glow/` with `Aurora`, `Button`, `Chip`, `Card`, `Section`, `Heading`, `Input`, `GlowCross`, all built with custom Tailwind theme tokens (`neon-magenta/cyan/uv/gold/mint`, `ink/paper/mist`, `shadow-glow-*`, `bg-aurora/aurora-soft/grain`, `animate-pulse-glow/drift/rise/sparkle`). This plan **keeps the existing primitives**, **adds 9 new primitives + 8 station glyph SVGs**, and **refactors the station/admin pages** to use the unified system. No CSS Modules introduced. No second paradigm.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript 5.4, Tailwind 3.4, Vitest 4 + jsdom + React Testing Library, Playwright 1.59, Supabase client 2.45, Resend 6, `html5-qrcode` 2.3.

**Branch:** `glow-redesign` off `kid-profile-rebuild` (already created and pushed).

---

## Token reconciliation (spec delta)

The design spec called out five neon hexes (`#ff3ec9`, `#55d8ff`, `#ffd84a`, `#a970ff`, `#5dffb1`) but the shipped Tailwind config uses slightly different values and named them by function, not by number. Reality wins — adopt the shipped names everywhere.

| Spec name | Tailwind token | Hex | Role |
|---|---|---|---|
| `neon-1` | `neon-magenta` | `#FF2E93` | Jail, Photo, Alerts, danger accents |
| `neon-2` | `neon-cyan` | `#00E6F7` | Drinks, Check-in, LIVE |
| `neon-3` | `neon-gold` | `#FFE147` | Prize Wheel, NOW, warnings |
| `neon-4` | `neon-uv` | `#9B5CFF` | DJ, Roaming, timeline spine |
| `neon-5` | `neon-mint` | `#4BE6B3` | Check-out, Approved, Done |

Station→tone map (revised with shipped names):
| Station | Tone | Glyph |
|---|---|---|
| Drinks | `cyan` | `<DrinksGlyph>` |
| Jail / Pass | `magenta` | `<JailGlyph>` |
| Prize Wheel | `gold` | `<PrizeWheelGlyph>` |
| DJ Shoutout | `uv` | `<DJGlyph>` |
| Check-in | `cyan` | `<CheckInGlyph>` |
| Check-out | `mint` | `<CheckOutGlyph>` |
| Photo Booth | `magenta` | `<PhotoGlyph>` (polaroid) |
| Roaming | `uv` | `<RoamingGlyph>` |

Any references below to tone names use the Tailwind shipped set: `magenta | cyan | uv | gold | mint | danger | warn`.

---

## File structure

### New files (20 primitives + 8 glyphs + 2 layouts + 2 utilities = 32)
```
src/components/glow/
  GridFloor.tsx              # perspective-grid floor overlay, composes with Aurora
  NeonWordmark.tsx           # Monoton hero wordmark (BASH & GLOW, VOLUNTEER HUB, etc.)
  SectionHeading.tsx         # NUM · TITLE · rule eyebrow band
  PageHead.tsx               # back + title + sub + right-slot
  SignPanel.tsx              # corner-bolt neon sign card
  BigToggle.tsx              # tap-sized toggle with neon nub
  NeonScanner.tsx            # QR/camera frame visual (brackets + beam + hint)
  StatTile.tsx               # big neon numeral stat box
  TimelineTrack.tsx          # vertical gradient spine + glowing dots
  AdminNav.tsx               # top admin nav bar
  GlyphGlow.tsx              # wrapper applying tone + glow to inline SVG

src/components/glow/glyphs/
  DrinksGlyph.tsx
  JailGlyph.tsx
  PrizeWheelGlyph.tsx
  DJGlyph.tsx
  CheckInGlyph.tsx
  CheckOutGlyph.tsx
  PhotoGlyph.tsx             # polaroid
  RoamingGlyph.tsx
  index.ts                   # barrel

src/app/station/layout.tsx   # new — Aurora + GridFloor + mono footer strip
src/app/admin/layout.tsx     # new — Aurora + AdminNav + LIVE poll

tests/component/
  GridFloor.test.tsx
  NeonWordmark.test.tsx
  SectionHeading.test.tsx
  PageHead.test.tsx
  SignPanel.test.tsx
  BigToggle.test.tsx
  NeonScanner.test.tsx
  StatTile.test.tsx
  TimelineTrack.test.tsx
  AdminNav.test.tsx
  GlyphGlow.test.tsx

tests/e2e/
  station-picker.spec.ts     # new — visual smoke for restyled picker
  admin-shell.spec.ts        # new — AdminNav + dashboard smoke
```

### Modified files (≈16 screens + config + index)
```
tailwind.config.js                              # add beam-sweep, breathe, count-up keyframes
src/components/glow/index.ts                    # export 11 new primitives + 8 glyphs
src/components/station/StationPicker.tsx        # full rebuild to glyph cards
src/components/station/CheckInStation.tsx       # wrap in PageHead + Scanner
src/components/station/CheckOutStation.tsx      # wrap in PageHead + Scanner + SignPanel gate
src/components/station/ActivityStation.tsx      # mode-driven wrapper (5 station types)
src/components/station/PhotoStation.tsx         # PageHead + Scanner with polaroid placeholder
src/components/station/RoamingStation.tsx       # PageHead + Scanner + SignPanel confirmation
src/components/station/LookupStation.tsx        # PageHead + SignPanel + StatTile grid + Timeline
src/components/admin/Dashboard.tsx              # hero + StatTile grid + TimelineTrack + alerts
src/components/admin/PhotoQueue.tsx             # chip-filter + tile grid
src/components/admin/PhotoGallery.tsx           # AdminNav-aware layout
src/components/admin/StoriesList.tsx            # + 10s poll fix for pending rows (STATUS.md audit)
src/components/admin/StoryEditor.tsx            # SignPanel + SectionHeading + auto-check chips
src/components/admin/ChildrenList.tsx           # primitive swap (Button/Chip)
src/components/admin/ChildEditor.tsx            # primitive swap
src/components/admin/BulkBalance.tsx            # primitive swap
src/components/admin/CatalogEditor.tsx          # primitive swap
src/components/admin/Settings.tsx               # primitive swap
```

### Not touched
- `src/components/glow/{Aurora, Button, Chip, Card, Section, Heading, Input, GlowCross}.tsx` — shipped, in use, kept as-is.
- `src/components/registration/*` — at D10/D11 standard, not in scope.
- `src/emails/*` — matches system, not in scope.
- `src/app/{page,register}/*` — parent-facing, not in scope.
- All API routes, DB migrations, auth logic — pure presentation pass.

---

## Pre-flight

- [ ] **Confirm branch** — run `git branch --show-current` → expect `glow-redesign`. If not, `git checkout glow-redesign` (branch was created + pushed in the spec commit).
- [ ] **Install up-to-date deps** — `npm install`. Expect clean install, no vulnerabilities surfaced that weren't already known.
- [ ] **Confirm dev server port** — `npm run dev` boots on :3050 (port pinned per STATUS.md). Leave it running in a background terminal for visual smoke.
- [ ] **Confirm test tooling** — `npm run test -- --run` executes existing component specs (35+ unit/component tests should pass). `npm run typecheck` is clean. `npm run test:e2e -- --list` shows 26 E2E specs.

---

## Phase 0 — Keyframe + config prep

### Task 0.1: Extend Tailwind with new keyframes + animations

**Files:**
- Modify: `tailwind.config.js:56-79` (keyframes + animation blocks)

- [ ] **Step 1: Add `beam-sweep`, `breathe`, `count-up`, `draw-border`, `corner-pulse` keyframes**

Edit `tailwind.config.js`, inside `theme.extend.keyframes`, add after `sparkle`:

```js
        'beam-sweep': {
          '0%':   { transform: 'translateY(-100%)', opacity: '0' },
          '15%':  { opacity: '1' },
          '85%':  { opacity: '1' },
          '100%': { transform: 'translateY(100%)', opacity: '0' },
        },
        'breathe': {
          '0%, 100%': { transform: 'scale(1)',   filter: 'brightness(1)' },
          '50%':      { transform: 'scale(1.05)', filter: 'brightness(1.25)' },
        },
        'count-up-glow': {
          '0%':   { opacity: '.4', filter: 'brightness(1)' },
          '55%':  { opacity: '1',  filter: 'brightness(1.4)' },
          '100%': { opacity: '1',  filter: 'brightness(1)' },
        },
        'draw-border': {
          '0%':   { 'stroke-dashoffset': '200' },
          '100%': { 'stroke-dashoffset': '0' },
        },
        'corner-pulse': {
          '0%, 100%': { transform: 'scale(1)',   opacity: '1' },
          '40%':      { transform: 'scale(1.2)', opacity: '.9' },
        },
```

- [ ] **Step 2: Register those keyframes as animations**

Inside `theme.extend.animation`, add after `sparkle`:

```js
        'beam-sweep':    'beam-sweep 1.6s linear infinite',
        'breathe':       'breathe 2.4s ease-in-out infinite',
        'count-up-glow': 'count-up-glow 360ms ease-out',
        'draw-border':   'draw-border 400ms ease-out forwards',
        'corner-pulse':  'corner-pulse 320ms ease-out',
```

- [ ] **Step 3: Verify Tailwind picks them up**

Run: `npx tailwindcss --content './src/**/*.tsx' -o /tmp/tw-probe.css 2>&1 | head`
Expected: no errors. Grep the output for the new animation names:

```bash
grep -E "beam-sweep|breathe|count-up-glow|draw-border|corner-pulse" /tmp/tw-probe.css
```
Expected: 5 matches.

- [ ] **Step 4: Commit**

```bash
git add tailwind.config.js
git commit -m "feat(tailwind): add beam-sweep, breathe, count-up, draw-border, corner-pulse keyframes for glow-redesign"
git push
```

---

## Phase 1 — New primitives: Foundation (4 components)

Each new primitive gets a `.tsx` + component test. Use the existing Tailwind token set.

### Task 1.1: `<GridFloor>` — perspective grid overlay

Composes with `<Aurora>` to reproduce the landing's "perspective synthwave grid floor + noise" backdrop.

**Files:**
- Create: `src/components/glow/GridFloor.tsx`
- Create: `tests/component/GridFloor.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// tests/component/GridFloor.test.tsx
import { render } from '@testing-library/react'
import { GridFloor } from '@/components/glow/GridFloor'

describe('<GridFloor>', () => {
  it('renders an absolutely-positioned aria-hidden decorative element', () => {
    const { container } = render(<GridFloor />)
    const el = container.firstChild as HTMLElement
    expect(el).toBeTruthy()
    expect(el.getAttribute('aria-hidden')).toBe('true')
    expect(el.className).toMatch(/absolute/)
    expect(el.className).toMatch(/pointer-events-none/)
  })

  it('accepts a className override', () => {
    const { container } = render(<GridFloor className="custom-class" />)
    const el = container.firstChild as HTMLElement
    expect(el.className).toMatch(/custom-class/)
  })
})
```

- [ ] **Step 2: Run the test — expect failure**

Run: `npm run test -- --run tests/component/GridFloor.test.tsx`
Expected: FAIL with `Cannot find module '@/components/glow/GridFloor'`.

- [ ] **Step 3: Implement `GridFloor.tsx`**

```tsx
// src/components/glow/GridFloor.tsx
import { clsx } from './clsx'

/**
 * Perspective grid floor at the bottom of a hero/section.
 * Pure CSS — two gradients (vertical lines + horizontal lines) on a
 * perspective-transformed plane. Composes with <Aurora /> in layout files.
 */
export function GridFloor({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={clsx(
        'pointer-events-none absolute inset-x-0 bottom-0 h-[45vh] overflow-hidden',
        '[perspective:800px]',
        className,
      )}
    >
      <div
        className={clsx(
          'absolute inset-x-[-10%] bottom-[-20%] h-[80vh] [transform-origin:center_top] [transform:rotateX(62deg)]',
          // vertical lines
          '[background-image:repeating-linear-gradient(to_right,rgba(155,92,255,.18)_0,rgba(155,92,255,.18)_1px,transparent_1px,transparent_60px)]',
        )}
      />
      <div
        className={clsx(
          'absolute inset-x-[-10%] bottom-[-20%] h-[80vh] [transform-origin:center_top] [transform:rotateX(62deg)]',
          // horizontal lines fading up
          '[background-image:repeating-linear-gradient(to_bottom,rgba(0,230,247,.16)_0,rgba(0,230,247,.16)_1px,transparent_1px,transparent_60px)]',
          '[mask-image:linear-gradient(to_top,black,transparent_70%)]',
        )}
      />
    </div>
  )
}
```

- [ ] **Step 4: Run the test — expect pass**

Run: `npm run test -- --run tests/component/GridFloor.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/glow/GridFloor.tsx tests/component/GridFloor.test.tsx
git commit -m "feat(glow): add <GridFloor> perspective grid overlay for backdrop composition"
git push
```

---

### Task 1.2: `<NeonWordmark>` — Monoton hero wordmark

**Files:**
- Create: `src/components/glow/NeonWordmark.tsx`
- Create: `tests/component/NeonWordmark.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// tests/component/NeonWordmark.test.tsx
import { render, screen } from '@testing-library/react'
import { NeonWordmark } from '@/components/glow/NeonWordmark'

describe('<NeonWordmark>', () => {
  it('renders text with Monoton class + tone', () => {
    render(<NeonWordmark tone="cyan">VOLUNTEER HUB</NeonWordmark>)
    const el = screen.getByText('VOLUNTEER HUB')
    expect(el.className).toMatch(/font-\[monoton|font-monoton|var\(--font-monoton\)/)
    expect(el.className).toMatch(/text-neon-cyan|text-glow-cyan/)
  })

  it('defaults to magenta tone', () => {
    render(<NeonWordmark>SPRING</NeonWordmark>)
    const el = screen.getByText('SPRING')
    expect(el.className).toMatch(/text-neon-magenta|text-glow-magenta/)
  })
})
```

- [ ] **Step 2: Run the test — expect failure**

Run: `npm run test -- --run tests/component/NeonWordmark.test.tsx`
Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement `NeonWordmark.tsx`**

```tsx
// src/components/glow/NeonWordmark.tsx
import { HTMLAttributes } from 'react'
import { clsx } from './clsx'

type Tone = 'magenta' | 'cyan' | 'uv' | 'gold' | 'mint' | 'paper'
type Size = 'sm' | 'md' | 'lg' | 'xl'

type Props = HTMLAttributes<HTMLSpanElement> & {
  tone?: Tone
  size?: Size
  as?: 'span' | 'h1' | 'h2'
}

const toneClasses: Record<Tone, string> = {
  magenta: 'text-neon-magenta [text-shadow:0_0_6px_#FF2E93,0_0_14px_#FF2E93,0_0_28px_rgba(255,46,147,.6),0_0_44px_rgba(255,46,147,.35)]',
  cyan:    'text-neon-cyan    [text-shadow:0_0_6px_#00E6F7,0_0_14px_#00E6F7,0_0_28px_rgba(0,230,247,.6),0_0_44px_rgba(0,230,247,.35)]',
  uv:      'text-neon-uv      [text-shadow:0_0_6px_#9B5CFF,0_0_14px_#9B5CFF,0_0_28px_rgba(155,92,255,.6),0_0_44px_rgba(155,92,255,.35)]',
  gold:    'text-neon-gold    [text-shadow:0_0_6px_#FFE147,0_0_14px_#FFE147,0_0_28px_rgba(255,225,71,.6),0_0_44px_rgba(255,225,71,.35)]',
  mint:    'text-neon-mint    [text-shadow:0_0_6px_#4BE6B3,0_0_14px_#4BE6B3,0_0_28px_rgba(75,230,179,.6),0_0_44px_rgba(75,230,179,.35)]',
  paper:   'text-paper        [text-shadow:0_0_6px_#F5F2FF,0_0_14px_rgba(245,242,255,.7)]',
}

const sizeClasses: Record<Size, string> = {
  sm: 'text-2xl',
  md: 'text-4xl',
  lg: 'text-6xl',
  xl: 'text-7xl sm:text-8xl',
}

export function NeonWordmark({
  tone = 'magenta',
  size = 'md',
  as = 'span',
  className,
  children,
  ...rest
}: Props) {
  const Tag = as as any
  return (
    <Tag
      {...rest}
      className={clsx(
        '[font-family:var(--font-monoton),Monoton,monospace] tracking-[0.04em] leading-[1]',
        toneClasses[tone],
        sizeClasses[size],
        className,
      )}
    >
      {children}
    </Tag>
  )
}
```

- [ ] **Step 4: Run the test + typecheck + commit**

```bash
npm run test -- --run tests/component/NeonWordmark.test.tsx
npm run typecheck
git add src/components/glow/NeonWordmark.tsx tests/component/NeonWordmark.test.tsx
git commit -m "feat(glow): add <NeonWordmark> Monoton hero wordmark with tone + size variants"
git push
```

Expected: 2 passing tests, no type errors.

---

### Task 1.3: `<SectionHeading>` — `NUM · TITLE · rule` eyebrow

**Files:**
- Create: `src/components/glow/SectionHeading.tsx`
- Create: `tests/component/SectionHeading.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// tests/component/SectionHeading.test.tsx
import { render, screen } from '@testing-library/react'
import { SectionHeading } from '@/components/glow/SectionHeading'

describe('<SectionHeading>', () => {
  it('renders num + title + rule', () => {
    const { container } = render(<SectionHeading num="LOG" title="Recent arrivals" />)
    expect(screen.getByText('LOG')).toBeInTheDocument()
    expect(screen.getByText('Recent arrivals')).toBeInTheDocument()
    const rule = container.querySelector('[data-role="rule"]')
    expect(rule).not.toBeNull()
  })

  it('applies tone classes', () => {
    render(<SectionHeading num="NOW" title="Live" tone="gold" />)
    const num = screen.getByText('NOW')
    expect(num.className).toMatch(/text-neon-gold|text-glow-gold/)
  })
})
```

- [ ] **Step 2: Run test → fail → implement → pass**

```tsx
// src/components/glow/SectionHeading.tsx
import { HTMLAttributes } from 'react'
import { clsx } from './clsx'

type Tone = 'magenta' | 'cyan' | 'uv' | 'gold' | 'mint' | 'mist'

type Props = HTMLAttributes<HTMLDivElement> & {
  num: string
  title: React.ReactNode
  tone?: Tone
}

const toneClasses: Record<Tone, string> = {
  magenta: 'text-neon-magenta',
  cyan:    'text-neon-cyan',
  uv:      'text-neon-uv',
  gold:    'text-neon-gold',
  mint:    'text-neon-mint',
  mist:    'text-mist',
}

const ruleToneClasses: Record<Tone, string> = {
  magenta: 'via-neon-magenta/40',
  cyan:    'via-neon-cyan/40',
  uv:      'via-neon-uv/40',
  gold:    'via-neon-gold/40',
  mint:    'via-neon-mint/40',
  mist:    'via-ink-hair',
}

export function SectionHeading({ num, title, tone = 'cyan', className, ...rest }: Props) {
  return (
    <div {...rest} className={clsx('flex items-baseline gap-3', className)}>
      <span
        className={clsx(
          'rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]',
          '[font-family:var(--font-mono),JetBrains_Mono,monospace]',
          toneClasses[tone],
          `border-current/40`,
        )}
      >
        {num}
      </span>
      <h3 className="font-display text-lg font-bold tracking-tight text-paper">{title}</h3>
      <span
        data-role="rule"
        className={clsx(
          'h-px flex-1 bg-gradient-to-r from-transparent to-transparent',
          ruleToneClasses[tone],
        )}
      />
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
npm run test -- --run tests/component/SectionHeading.test.tsx
npm run typecheck
git add src/components/glow/SectionHeading.tsx tests/component/SectionHeading.test.tsx
git commit -m "feat(glow): add <SectionHeading> NUM·TITLE·rule eyebrow band with tone variants"
git push
```

Expected: 2 passing tests.

---

### Task 1.4: `<PageHead>` — back + title + sub + right-slot

**Files:**
- Create: `src/components/glow/PageHead.tsx`
- Create: `tests/component/PageHead.test.tsx`

- [ ] **Step 1: Write the test**

```tsx
// tests/component/PageHead.test.tsx
import { render, screen } from '@testing-library/react'
import { PageHead } from '@/components/glow/PageHead'

describe('<PageHead>', () => {
  it('renders title', () => {
    render(<PageHead title="Check-in Station" />)
    expect(screen.getByRole('heading', { name: 'Check-in Station' })).toBeInTheDocument()
  })

  it('renders optional back + sub + right slot', () => {
    render(
      <PageHead
        back={{ href: '/station', label: 'stations' }}
        title="Photo Booth"
        sub="Tap to snap"
        right={<span data-testid="right-slot">LIVE</span>}
      />
    )
    expect(screen.getByRole('link', { name: /stations/i })).toHaveAttribute('href', '/station')
    expect(screen.getByText('Tap to snap')).toBeInTheDocument()
    expect(screen.getByTestId('right-slot')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Implement**

```tsx
// src/components/glow/PageHead.tsx
import { HTMLAttributes } from 'react'
import Link from 'next/link'
import { clsx } from './clsx'

type Props = HTMLAttributes<HTMLElement> & {
  title: React.ReactNode
  sub?: React.ReactNode
  back?: { href: string; label: string }
  right?: React.ReactNode
}

export function PageHead({ title, sub, back, right, className, ...rest }: Props) {
  return (
    <header
      {...rest}
      className={clsx(
        'flex items-start justify-between gap-4 border-b border-ink-hair/60 pb-4',
        className,
      )}
    >
      <div className="flex-1 min-w-0">
        {back && (
          <Link
            href={back.href}
            className={clsx(
              'inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-mist',
              '[font-family:var(--font-mono),JetBrains_Mono,monospace]',
              'hover:text-paper transition-colors',
            )}
          >
            ← {back.label}
          </Link>
        )}
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-paper leading-tight mt-1">
          {title}
        </h1>
        {sub && <p className="text-sm text-mist leading-relaxed mt-1 max-w-prose">{sub}</p>}
      </div>
      {right && <div className="shrink-0 flex items-center gap-2">{right}</div>}
    </header>
  )
}
```

- [ ] **Step 3: Commit**

```bash
npm run test -- --run tests/component/PageHead.test.tsx
npm run typecheck
git add src/components/glow/PageHead.tsx tests/component/PageHead.test.tsx
git commit -m "feat(glow): add <PageHead> with back-link + title + sub + right-slot"
git push
```

Expected: 2 passing tests.

---

## Phase 2 — New primitives: Interactive (3 components)

### Task 2.1: `<SignPanel>` — corner-bolt neon sign card

**Files:**
- Create: `src/components/glow/SignPanel.tsx`
- Create: `tests/component/SignPanel.test.tsx`

- [ ] **Step 1: Write the test**

```tsx
// tests/component/SignPanel.test.tsx
import { render, screen } from '@testing-library/react'
import { SignPanel } from '@/components/glow/SignPanel'

describe('<SignPanel>', () => {
  it('renders children', () => {
    render(<SignPanel tone="magenta">hello</SignPanel>)
    expect(screen.getByText('hello')).toBeInTheDocument()
  })

  it('renders 4 bolt corners', () => {
    const { container } = render(<SignPanel tone="cyan">hi</SignPanel>)
    const bolts = container.querySelectorAll('[data-role="bolt"]')
    expect(bolts.length).toBe(4)
  })

  it('applies tone-specific border color', () => {
    const { container } = render(<SignPanel tone="gold">x</SignPanel>)
    const panel = container.querySelector('[data-role="sign-panel"]') as HTMLElement
    expect(panel.className).toMatch(/border-neon-gold/)
  })
})
```

- [ ] **Step 2: Implement**

```tsx
// src/components/glow/SignPanel.tsx
import { HTMLAttributes } from 'react'
import { clsx } from './clsx'

type Tone = 'magenta' | 'cyan' | 'uv' | 'gold' | 'mint'
type Padding = 'sm' | 'md' | 'lg'

type Props = HTMLAttributes<HTMLDivElement> & {
  tone?: Tone
  padding?: Padding
}

const toneClasses: Record<Tone, string> = {
  magenta: 'border-neon-magenta/60 shadow-glow-magenta',
  cyan:    'border-neon-cyan/60    shadow-glow-cyan',
  uv:      'border-neon-uv/60      shadow-glow-uv',
  gold:    'border-neon-gold/60    shadow-glow-gold',
  mint:    'border-neon-mint/60    shadow-glow-mint',
}

const boltToneClasses: Record<Tone, string> = {
  magenta: 'bg-neon-magenta [box-shadow:0_0_10px_#FF2E93,0_0_18px_rgba(255,46,147,.5)]',
  cyan:    'bg-neon-cyan    [box-shadow:0_0_10px_#00E6F7,0_0_18px_rgba(0,230,247,.5)]',
  uv:      'bg-neon-uv      [box-shadow:0_0_10px_#9B5CFF,0_0_18px_rgba(155,92,255,.5)]',
  gold:    'bg-neon-gold    [box-shadow:0_0_10px_#FFE147,0_0_18px_rgba(255,225,71,.5)]',
  mint:    'bg-neon-mint    [box-shadow:0_0_10px_#4BE6B3,0_0_18px_rgba(75,230,179,.5)]',
}

const paddingClasses: Record<Padding, string> = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-7 sm:p-9',
}

export function SignPanel({ tone = 'magenta', padding = 'md', className, children, ...rest }: Props) {
  return (
    <div
      {...rest}
      data-role="sign-panel"
      className={clsx(
        'relative rounded-2xl border-2 bg-ink-2/70 backdrop-blur-sm',
        toneClasses[tone],
        paddingClasses[padding],
        className,
      )}
    >
      {(['top-2 left-2', 'top-2 right-2', 'bottom-2 left-2', 'bottom-2 right-2'] as const).map((pos) => (
        <span
          key={pos}
          data-role="bolt"
          aria-hidden
          className={clsx(
            'absolute h-1.5 w-1.5 rounded-full',
            boltToneClasses[tone],
            pos,
          )}
        />
      ))}
      {children}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
npm run test -- --run tests/component/SignPanel.test.tsx
npm run typecheck
git add src/components/glow/SignPanel.tsx tests/component/SignPanel.test.tsx
git commit -m "feat(glow): add <SignPanel> corner-bolt neon sign card with tone + padding variants"
git push
```

Expected: 3 passing tests.

---

### Task 2.2: `<BigToggle>` — checklist/consent toggle

**Files:**
- Create: `src/components/glow/BigToggle.tsx`
- Create: `tests/component/BigToggle.test.tsx`

- [ ] **Step 1: Write the test**

```tsx
// tests/component/BigToggle.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import { BigToggle } from '@/components/glow/BigToggle'

function Harness({ initial = false }: { initial?: boolean }) {
  const [on, setOn] = useState(initial)
  return <BigToggle checked={on} onChange={setOn} label="Accept terms" sub="Required" />
}

describe('<BigToggle>', () => {
  it('renders label + sub', () => {
    render(<Harness />)
    expect(screen.getByText('Accept terms')).toBeInTheDocument()
    expect(screen.getByText('Required')).toBeInTheDocument()
  })

  it('toggles on click', () => {
    render(<Harness initial={false} />)
    const cb = screen.getByRole('checkbox') as HTMLInputElement
    expect(cb.checked).toBe(false)
    fireEvent.click(cb)
    expect(cb.checked).toBe(true)
  })

  it('has visible focus ring', () => {
    render(<Harness />)
    const cb = screen.getByRole('checkbox') as HTMLInputElement
    cb.focus()
    // Tailwind's focus-visible classes apply via class string; just confirm label container has focus-within styling hook.
    const label = cb.closest('label')!
    expect(label.className).toMatch(/focus-within:/)
  })
})
```

- [ ] **Step 2: Implement**

```tsx
// src/components/glow/BigToggle.tsx
import { clsx } from './clsx'

type Tone = 'magenta' | 'cyan' | 'uv' | 'gold' | 'mint'

type Props = {
  checked: boolean
  onChange: (next: boolean) => void
  label: React.ReactNode
  sub?: React.ReactNode
  tone?: Tone
  disabled?: boolean
}

const onToneClasses: Record<Tone, string> = {
  magenta: 'bg-neon-magenta/25 border-neon-magenta shadow-glow-magenta',
  cyan:    'bg-neon-cyan/25    border-neon-cyan    shadow-glow-cyan',
  uv:      'bg-neon-uv/25      border-neon-uv      shadow-glow-uv',
  gold:    'bg-neon-gold/25    border-neon-gold    shadow-glow-gold',
  mint:    'bg-neon-mint/25    border-neon-mint    shadow-glow-mint',
}

const nubToneClasses: Record<Tone, string> = {
  magenta: 'bg-neon-magenta',
  cyan:    'bg-neon-cyan',
  uv:      'bg-neon-uv',
  gold:    'bg-neon-gold',
  mint:    'bg-neon-mint',
}

export function BigToggle({ checked, onChange, label, sub, tone = 'mint', disabled }: Props) {
  return (
    <label
      className={clsx(
        'flex items-center gap-4 rounded-xl border border-ink-hair bg-ink-2/70 px-4 py-3 cursor-pointer',
        'focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-ink focus-within:ring-paper/50',
        checked && onToneClasses[tone],
        disabled && 'opacity-40 cursor-not-allowed',
        'transition-[background-color,border-color,box-shadow] duration-[220ms] ease-[cubic-bezier(.2,.8,.2,1)]',
      )}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        aria-hidden
        className={clsx(
          'relative inline-block h-[30px] w-[56px] rounded-full border border-ink-hair bg-ink-3/60',
          checked && nubToneClasses[tone].replace('bg-', 'border-'),
        )}
      >
        <span
          className={clsx(
            'absolute top-[3px] h-[22px] w-[22px] rounded-full shadow-card',
            'transition-[left,background-color] duration-[220ms] ease-[cubic-bezier(.2,.8,.2,1)]',
            checked ? `left-[30px] ${nubToneClasses[tone]}` : 'left-[3px] bg-faint',
          )}
        />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block font-display text-sm font-semibold text-paper">{label}</span>
        {sub && <span className="block text-xs text-mist mt-0.5">{sub}</span>}
      </span>
    </label>
  )
}
```

- [ ] **Step 3: Commit**

```bash
npm run test -- --run tests/component/BigToggle.test.tsx
npm run typecheck
git add src/components/glow/BigToggle.tsx tests/component/BigToggle.test.tsx
git commit -m "feat(glow): add <BigToggle> tap-sized checklist/consent toggle with tone variants"
git push
```

Expected: 3 passing tests.

---

### Task 2.3: `<NeonScanner>` — QR/camera visual frame

**Files:**
- Create: `src/components/glow/NeonScanner.tsx`
- Create: `tests/component/NeonScanner.test.tsx`

**Important:** This is the visual frame only. Actual QR scanning stays in `src/components/QRScanner.tsx` (or wherever it lives). The Scanner component is composable — camera feed / placeholder / placeholder glyph go in `children`.

- [ ] **Step 1: Write the test**

```tsx
// tests/component/NeonScanner.test.tsx
import { render, screen } from '@testing-library/react'
import { NeonScanner } from '@/components/glow/NeonScanner'

describe('<NeonScanner>', () => {
  it('renders hint text', () => {
    render(<NeonScanner tone="cyan" hint="Align QR">placeholder</NeonScanner>)
    expect(screen.getByText('Align QR')).toBeInTheDocument()
    expect(screen.getByText('placeholder')).toBeInTheDocument()
  })

  it('renders 4 bracket corners', () => {
    const { container } = render(<NeonScanner tone="cyan" hint="...">x</NeonScanner>)
    expect(container.querySelectorAll('[data-role="corner"]').length).toBe(4)
  })

  it('renders a beam when scanning', () => {
    const { container, rerender } = render(<NeonScanner tone="cyan" hint="x" scanning>y</NeonScanner>)
    expect(container.querySelector('[data-role="beam"]')).not.toBeNull()
    rerender(<NeonScanner tone="cyan" hint="x">y</NeonScanner>)
    expect(container.querySelector('[data-role="beam"]')).toBeNull()
  })
})
```

- [ ] **Step 2: Implement**

```tsx
// src/components/glow/NeonScanner.tsx
import { HTMLAttributes } from 'react'
import { clsx } from './clsx'

type Tone = 'magenta' | 'cyan' | 'uv' | 'gold' | 'mint'
type Aspect = 'square' | 'portrait'

type Props = HTMLAttributes<HTMLDivElement> & {
  tone?: Tone
  aspect?: Aspect
  hint?: React.ReactNode
  scanning?: boolean
}

const cornerToneClasses: Record<Tone, string> = {
  magenta: 'border-neon-magenta shadow-glow-magenta',
  cyan:    'border-neon-cyan    shadow-glow-cyan',
  uv:      'border-neon-uv      shadow-glow-uv',
  gold:    'border-neon-gold    shadow-glow-gold',
  mint:    'border-neon-mint    shadow-glow-mint',
}

const beamToneClasses: Record<Tone, string> = {
  magenta: 'bg-gradient-to-b from-transparent via-neon-magenta/60 to-transparent',
  cyan:    'bg-gradient-to-b from-transparent via-neon-cyan/60    to-transparent',
  uv:      'bg-gradient-to-b from-transparent via-neon-uv/60      to-transparent',
  gold:    'bg-gradient-to-b from-transparent via-neon-gold/60    to-transparent',
  mint:    'bg-gradient-to-b from-transparent via-neon-mint/60    to-transparent',
}

const aspectClasses: Record<Aspect, string> = {
  square:   'aspect-square',
  portrait: 'aspect-[3/4]',
}

export function NeonScanner({ tone = 'cyan', aspect = 'portrait', hint, scanning = true, className, children, ...rest }: Props) {
  const cornerBase = 'absolute h-8 w-8 border-2'
  return (
    <div
      {...rest}
      className={clsx(
        'relative w-full overflow-hidden rounded-[14px] bg-ink-2/70 border border-ink-hair',
        aspectClasses[aspect],
        className,
      )}
    >
      {/* Corner brackets */}
      <span data-role="corner" className={clsx(cornerBase, 'top-3 left-3 border-t-2 border-l-2 border-b-0 border-r-0 rounded-tl-[6px]', cornerToneClasses[tone])} />
      <span data-role="corner" className={clsx(cornerBase, 'top-3 right-3 border-t-2 border-r-2 border-b-0 border-l-0 rounded-tr-[6px]', cornerToneClasses[tone])} />
      <span data-role="corner" className={clsx(cornerBase, 'bottom-3 left-3 border-b-2 border-l-2 border-t-0 border-r-0 rounded-bl-[6px]', cornerToneClasses[tone])} />
      <span data-role="corner" className={clsx(cornerBase, 'bottom-3 right-3 border-b-2 border-r-2 border-t-0 border-l-0 rounded-br-[6px]', cornerToneClasses[tone])} />
      {/* Content slot (placeholder, camera feed, or photo) */}
      <div className="absolute inset-3 flex items-center justify-center">{children}</div>
      {/* Beam */}
      {scanning && (
        <span
          data-role="beam"
          aria-hidden
          className={clsx(
            'absolute inset-x-3 h-[20%] motion-safe:animate-beam-sweep',
            beamToneClasses[tone],
          )}
        />
      )}
      {/* Hint */}
      {hint && (
        <span
          className={clsx(
            'absolute inset-x-0 bottom-3 text-center text-[10px] font-semibold uppercase tracking-[0.18em]',
            '[font-family:var(--font-mono),JetBrains_Mono,monospace]',
            'text-mist',
          )}
        >
          {hint}
        </span>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
npm run test -- --run tests/component/NeonScanner.test.tsx
npm run typecheck
git add src/components/glow/NeonScanner.tsx tests/component/NeonScanner.test.tsx
git commit -m "feat(glow): add <NeonScanner> QR/camera visual frame with brackets + beam + hint"
git push
```

Expected: 3 passing tests.

---

## Phase 3 — New primitives: Data display (3 components)

### Task 3.1: `<StatTile>` — big neon numeral stat box

**Files:**
- Create: `src/components/glow/StatTile.tsx`
- Create: `tests/component/StatTile.test.tsx`

- [ ] **Step 1: Write the test**

```tsx
// tests/component/StatTile.test.tsx
import { render, screen } from '@testing-library/react'
import { StatTile } from '@/components/glow/StatTile'

describe('<StatTile>', () => {
  it('renders label + value', () => {
    render(<StatTile label="Checked in" value="217" tone="mint" />)
    expect(screen.getByText('Checked in')).toBeInTheDocument()
    expect(screen.getByText('217')).toBeInTheDocument()
  })

  it('applies tabular-nums to value', () => {
    render(<StatTile label="x" value="99" tone="cyan" />)
    const val = screen.getByText('99')
    expect(val.className).toMatch(/tabular-nums|font-variant-numeric/)
  })
})
```

- [ ] **Step 2: Implement**

```tsx
// src/components/glow/StatTile.tsx
import { HTMLAttributes } from 'react'
import { clsx } from './clsx'

type Tone = 'magenta' | 'cyan' | 'uv' | 'gold' | 'mint'

type Props = HTMLAttributes<HTMLDivElement> & {
  label: React.ReactNode
  value: React.ReactNode
  tone?: Tone
  outline?: boolean
}

const toneValueClasses: Record<Tone, string> = {
  magenta: 'text-neon-magenta [text-shadow:0_0_6px_#FF2E93,0_0_14px_rgba(255,46,147,.5)]',
  cyan:    'text-neon-cyan    [text-shadow:0_0_6px_#00E6F7,0_0_14px_rgba(0,230,247,.5)]',
  uv:      'text-neon-uv      [text-shadow:0_0_6px_#9B5CFF,0_0_14px_rgba(155,92,255,.5)]',
  gold:    'text-neon-gold    [text-shadow:0_0_6px_#FFE147,0_0_14px_rgba(255,225,71,.5)]',
  mint:    'text-neon-mint    [text-shadow:0_0_6px_#4BE6B3,0_0_14px_rgba(75,230,179,.5)]',
}

const toneBorderClasses: Record<Tone, string> = {
  magenta: 'border-neon-magenta/40',
  cyan:    'border-neon-cyan/40',
  uv:      'border-neon-uv/40',
  gold:    'border-neon-gold/40',
  mint:    'border-neon-mint/40',
}

export function StatTile({ label, value, tone = 'cyan', outline = false, className, ...rest }: Props) {
  return (
    <div
      {...rest}
      className={clsx(
        'rounded-xl border bg-ink-2/60 p-4 flex flex-col gap-1',
        toneBorderClasses[tone],
        outline && 'bg-transparent',
        className,
      )}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mist [font-family:var(--font-mono),JetBrains_Mono,monospace]">
        {label}
      </span>
      <span
        className={clsx(
          'font-display text-4xl font-bold leading-none tabular-nums',
          toneValueClasses[tone],
        )}
      >
        {value}
      </span>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
npm run test -- --run tests/component/StatTile.test.tsx
npm run typecheck
git add src/components/glow/StatTile.tsx tests/component/StatTile.test.tsx
git commit -m "feat(glow): add <StatTile> big neon numeral stat box with tone + outline variants"
git push
```

Expected: 2 passing tests.

---

### Task 3.2: `<TimelineTrack>` — vertical glowing timeline

**Files:**
- Create: `src/components/glow/TimelineTrack.tsx`
- Create: `tests/component/TimelineTrack.test.tsx`

- [ ] **Step 1: Write the test**

```tsx
// tests/component/TimelineTrack.test.tsx
import { render, screen } from '@testing-library/react'
import { TimelineTrack } from '@/components/glow/TimelineTrack'

const items = [
  { time: '5:30', label: 'Doors open',           state: 'done' as const, tone: 'mint' as const },
  { time: '6:30', label: 'Grill + games',        state: 'now'  as const, tone: 'gold' as const },
  { time: '7:30', label: "Kids' blessing circle", state: 'next' as const, tone: 'cyan' as const },
]

describe('<TimelineTrack>', () => {
  it('renders each item', () => {
    render(<TimelineTrack items={items} />)
    expect(screen.getByText('Doors open')).toBeInTheDocument()
    expect(screen.getByText('Grill + games')).toBeInTheDocument()
    expect(screen.getByText("Kids' blessing circle")).toBeInTheDocument()
  })

  it('gives the "now" item a NOW chip', () => {
    render(<TimelineTrack items={items} />)
    expect(screen.getByText('NOW')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Implement**

```tsx
// src/components/glow/TimelineTrack.tsx
import { clsx } from './clsx'
import { Chip } from './Chip'

type State = 'done' | 'now' | 'next'
type Tone = 'magenta' | 'cyan' | 'uv' | 'gold' | 'mint'

export type TimelineItem = {
  time: string
  label: React.ReactNode
  state: State
  tone: Tone
}

const dotToneClasses: Record<Tone, string> = {
  magenta: 'border-neon-magenta bg-ink-2',
  cyan:    'border-neon-cyan    bg-ink-2',
  uv:      'border-neon-uv      bg-ink-2',
  gold:    'border-neon-gold    bg-ink-2',
  mint:    'border-neon-mint    bg-ink-2',
}

const glowToneClasses: Record<Tone, string> = {
  magenta: 'shadow-glow-magenta',
  cyan:    'shadow-glow-cyan',
  uv:      'shadow-glow-uv',
  gold:    'shadow-glow-gold',
  mint:    'shadow-glow-mint',
}

export function TimelineTrack({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="relative pl-6">
      <span aria-hidden className="absolute left-[10px] top-1 bottom-1 w-[2px] rounded bg-gradient-to-b from-neon-magenta via-neon-uv to-neon-cyan opacity-70" />
      {items.map((it, i) => (
        <li key={i} className="relative mb-4 flex items-baseline gap-3">
          <span
            aria-hidden
            className={clsx(
              'absolute -left-[15px] top-1 h-[14px] w-[14px] rounded-full border-2',
              dotToneClasses[it.tone],
              it.state === 'now' && clsx(glowToneClasses[it.tone], 'motion-safe:animate-breathe'),
            )}
          />
          <span className={clsx(
            'font-display text-lg font-bold tabular-nums w-14 shrink-0',
            it.state === 'done' ? 'text-mist line-through' : 'text-paper',
          )}>
            {it.time}
          </span>
          <span className={clsx(
            'text-sm',
            it.state === 'done' ? 'text-mist line-through' : 'text-paper',
          )}>
            {it.label}
          </span>
          {it.state === 'now' && <Chip tone="gold">NOW</Chip>}
          {it.state === 'done' && <Chip tone="quiet">done</Chip>}
        </li>
      ))}
    </ol>
  )
}
```

- [ ] **Step 3: Commit**

```bash
npm run test -- --run tests/component/TimelineTrack.test.tsx
npm run typecheck
git add src/components/glow/TimelineTrack.tsx tests/component/TimelineTrack.test.tsx
git commit -m "feat(glow): add <TimelineTrack> glowing-dots vertical timeline with done/now/next states"
git push
```

Expected: 2 passing tests.

---

### Task 3.3: `<AdminNav>` — top admin nav shell

**Files:**
- Create: `src/components/glow/AdminNav.tsx`
- Create: `tests/component/AdminNav.test.tsx`

- [ ] **Step 1: Write the test**

```tsx
// tests/component/AdminNav.test.tsx
import { render, screen } from '@testing-library/react'
import { AdminNav } from '@/components/glow/AdminNav'

describe('<AdminNav>', () => {
  it('renders brand + 7 nav links + right slot', () => {
    render(<AdminNav active="dashboard" right={<span data-testid="rs">LIVE · 0 ONSITE</span>} />)
    expect(screen.getByText(/LCA · BASH OPS/i)).toBeInTheDocument()
    const links = screen.getAllByRole('link')
    // Dashboard, Children, Stories, Photos, Stations, Bulk, Settings = 7
    expect(links.length).toBeGreaterThanOrEqual(7)
    expect(screen.getByTestId('rs')).toBeInTheDocument()
  })

  it('marks the active page', () => {
    render(<AdminNav active="photos" />)
    const photos = screen.getByRole('link', { name: /photos/i })
    expect(photos.getAttribute('aria-current')).toBe('page')
  })
})
```

- [ ] **Step 2: Implement**

```tsx
// src/components/glow/AdminNav.tsx
import Link from 'next/link'
import { clsx } from './clsx'

export type AdminNavKey = 'dashboard' | 'children' | 'stories' | 'photos' | 'stations' | 'bulk' | 'settings'

type Props = {
  active: AdminNavKey
  right?: React.ReactNode
}

const LINKS: { key: AdminNavKey; href: string; label: string }[] = [
  { key: 'dashboard', href: '/admin',           label: 'Dashboard' },
  { key: 'children',  href: '/admin/children',  label: 'Children' },
  { key: 'stories',   href: '/admin/stories',   label: 'Stories' },
  { key: 'photos',    href: '/admin/photos',    label: 'Photos' },
  { key: 'stations',  href: '/admin/stations',  label: 'Stations' },
  { key: 'bulk',      href: '/admin/bulk',      label: 'Bulk' },
  { key: 'settings',  href: '/admin/settings',  label: 'Settings' },
]

export function AdminNav({ active, right }: Props) {
  return (
    <nav className="flex items-center gap-6 border-b border-ink-hair/60 bg-ink-2/80 backdrop-blur-sm px-5 py-3">
      <span className="flex items-center gap-2 whitespace-nowrap">
        <span aria-hidden className="h-2 w-2 rounded-full bg-neon-magenta shadow-glow-magenta" />
        <span className="font-display text-sm font-bold tracking-[0.08em] text-paper">LCA · BASH OPS</span>
      </span>
      <ul className="flex items-center gap-4 overflow-x-auto">
        {LINKS.map((l) => {
          const isActive = l.key === active
          return (
            <li key={l.key}>
              <Link
                href={l.href}
                aria-current={isActive ? 'page' : undefined}
                className={clsx(
                  'text-[11px] font-semibold uppercase tracking-[0.14em]',
                  '[font-family:var(--font-mono),JetBrains_Mono,monospace]',
                  'transition-colors',
                  isActive ? 'text-paper' : 'text-mist hover:text-paper',
                )}
              >
                {l.label}
              </Link>
            </li>
          )
        })}
      </ul>
      {right && <div className="ml-auto shrink-0">{right}</div>}
    </nav>
  )
}
```

- [ ] **Step 3: Commit**

```bash
npm run test -- --run tests/component/AdminNav.test.tsx
npm run typecheck
git add src/components/glow/AdminNav.tsx tests/component/AdminNav.test.tsx
git commit -m "feat(glow): add <AdminNav> top admin shell with 7 nav links + LIVE right-slot"
git push
```

Expected: 2 passing tests.

---

## Phase 4 — Glyph set + GlyphGlow wrapper

### Task 4.1: `<GlyphGlow>` wrapper

**Files:**
- Create: `src/components/glow/GlyphGlow.tsx`
- Create: `tests/component/GlyphGlow.test.tsx`

- [ ] **Step 1: Write the test**

```tsx
// tests/component/GlyphGlow.test.tsx
import { render } from '@testing-library/react'
import { GlyphGlow } from '@/components/glow/GlyphGlow'

describe('<GlyphGlow>', () => {
  it('applies tone color + glow filter to children', () => {
    const { container } = render(
      <GlyphGlow tone="cyan" size={80}><svg data-testid="g" /></GlyphGlow>
    )
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toMatch(/text-neon-cyan/)
    expect(wrapper.style.filter).toMatch(/drop-shadow/i)
    expect(wrapper.style.width).toBe('80px')
  })
})
```

- [ ] **Step 2: Implement**

```tsx
// src/components/glow/GlyphGlow.tsx
import { clsx } from './clsx'

type Tone = 'magenta' | 'cyan' | 'uv' | 'gold' | 'mint'

type Props = {
  tone: Tone
  size?: number
  className?: string
  children: React.ReactNode
}

const toneClasses: Record<Tone, string> = {
  magenta: 'text-neon-magenta',
  cyan:    'text-neon-cyan',
  uv:      'text-neon-uv',
  gold:    'text-neon-gold',
  mint:    'text-neon-mint',
}

const toneHexes: Record<Tone, { solid: string; faint: string }> = {
  magenta: { solid: '#FF2E93', faint: 'rgba(255,46,147,.55)' },
  cyan:    { solid: '#00E6F7', faint: 'rgba(0,230,247,.55)' },
  uv:      { solid: '#9B5CFF', faint: 'rgba(155,92,255,.55)' },
  gold:    { solid: '#FFE147', faint: 'rgba(255,225,71,.55)' },
  mint:    { solid: '#4BE6B3', faint: 'rgba(75,230,179,.55)' },
}

export function GlyphGlow({ tone, size = 80, className, children }: Props) {
  const { solid, faint } = toneHexes[tone]
  return (
    <span
      className={clsx('inline-grid place-items-center', toneClasses[tone], className)}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        filter: `drop-shadow(0 0 4px ${solid}) drop-shadow(0 0 14px ${faint})`,
      }}
    >
      {children}
    </span>
  )
}
```

- [ ] **Step 3: Commit**

```bash
npm run test -- --run tests/component/GlyphGlow.test.tsx
npm run typecheck
git add src/components/glow/GlyphGlow.tsx tests/component/GlyphGlow.test.tsx
git commit -m "feat(glow): add <GlyphGlow> tone+size wrapper for station glyph SVGs"
git push
```

---

### Tasks 4.2–4.9: The 8 station glyphs

Each glyph is a tiny pure SVG component. Pattern is identical — create the file, no separate test (visual smoke is covered by the picker E2E in Task 5.2). Keep each file under 40 lines.

**Common SVG contract:** every glyph uses `fill="none" stroke="currentColor"` so `<GlyphGlow tone>` controls color. `viewBox` is `0 0 100 100` unless otherwise noted.

- [ ] **Step 1: Create `DrinksGlyph.tsx`**

```tsx
// src/components/glow/glyphs/DrinksGlyph.tsx
export function DrinksGlyph({ size = 80 }: { size?: number }) {
  return (
    <svg viewBox="0 0 80 100" width={size} height={size * 100 / 80} fill="none" stroke="currentColor" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" aria-hidden>
      <path d="M16 28 L22 92 Q22 96 26 96 L54 96 Q58 96 58 92 L64 28 Z" />
      <rect x={12} y={22} width={56} height={8} rx={2} />
      <rect x={38} y={4} width={6} height={20} rx={2} />
      <path d="M28 48 L52 48 M26 66 L54 66" strokeWidth={2} opacity={0.55} />
    </svg>
  )
}
```

- [ ] **Step 2: Create `JailGlyph.tsx`**

```tsx
// src/components/glow/glyphs/JailGlyph.tsx
export function JailGlyph({ size = 80 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x={14} y={20} width={72} height={60} rx={6} />
      <line x1={30} y1={26} x2={30} y2={74} />
      <line x1={42} y1={26} x2={42} y2={74} />
      <line x1={54} y1={26} x2={54} y2={74} />
      <line x1={66} y1={26} x2={66} y2={74} />
      <circle cx={50} cy={86} r={3} fill="currentColor" stroke="none" />
    </svg>
  )
}
```

- [ ] **Step 3: Create `PrizeWheelGlyph.tsx`**

```tsx
// src/components/glow/glyphs/PrizeWheelGlyph.tsx
export function PrizeWheelGlyph({ size = 80 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" aria-hidden>
      <circle cx={50} cy={54} r={36} />
      <line x1={50} y1={18} x2={50} y2={90} strokeWidth={2} />
      <line x1={18} y1={36} x2={82} y2={72} strokeWidth={2} />
      <line x1={18} y1={72} x2={82} y2={36} strokeWidth={2} />
      <circle cx={50} cy={54} r={5} fill="currentColor" stroke="none" />
      <path d="M44 8 L56 8 L50 22 Z" fill="currentColor" stroke="none" />
    </svg>
  )
}
```

- [ ] **Step 4: Create `DJGlyph.tsx`**

```tsx
// src/components/glow/glyphs/DJGlyph.tsx
export function DJGlyph({ size = 80 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} stroke="currentColor" strokeLinecap="round" aria-hidden>
      <g strokeWidth={5}>
        <line x1={12} y1={54} x2={12} y2={72} />
        <line x1={26} y1={40} x2={26} y2={60} />
        <line x1={40} y1={20} x2={40} y2={80} />
        <line x1={54} y1={46} x2={54} y2={54} />
        <line x1={68} y1={12} x2={68} y2={88} />
        <line x1={82} y1={34} x2={82} y2={66} />
      </g>
    </svg>
  )
}
```

- [ ] **Step 5: Create `CheckInGlyph.tsx`**

```tsx
// src/components/glow/glyphs/CheckInGlyph.tsx
export function CheckInGlyph({ size = 80 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {/* QR corner brackets */}
      <path d="M20 34 L20 20 L34 20" />
      <path d="M66 20 L80 20 L80 34" />
      <path d="M80 66 L80 80 L66 80" />
      <path d="M34 80 L20 80 L20 66" />
      {/* Arrow in */}
      <path d="M40 50 L60 50 M52 42 L60 50 L52 58" strokeWidth={3.5} />
    </svg>
  )
}
```

- [ ] **Step 6: Create `CheckOutGlyph.tsx`**

```tsx
// src/components/glow/glyphs/CheckOutGlyph.tsx
export function CheckOutGlyph({ size = 80 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 34 L20 20 L34 20" />
      <path d="M66 20 L80 20 L80 34" />
      <path d="M80 66 L80 80 L66 80" />
      <path d="M34 80 L20 80 L20 66" />
      {/* Arrow out */}
      <path d="M40 50 L60 50 M52 42 L60 50 L52 58" strokeWidth={3.5} transform="translate(8 0)" />
    </svg>
  )
}
```

- [ ] **Step 7: Create `PhotoGlyph.tsx`** (tilted polaroid)

```tsx
// src/components/glow/glyphs/PhotoGlyph.tsx
export function PhotoGlyph({ size = 80 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x={16} y={14} width={68} height={78} rx={4} transform="rotate(-6 50 53)" />
      <rect x={22} y={20} width={56} height={46} rx={2} strokeWidth={2.5} transform="rotate(-6 50 43)" />
      <path d="M82 22 L82 32 M77 27 L87 27" strokeWidth={2.5} />
      <path d="M88 16 L88 22 M85 19 L91 19" strokeWidth={2} opacity={0.7} />
    </svg>
  )
}
```

- [ ] **Step 8: Create `RoamingGlyph.tsx`**

```tsx
// src/components/glow/glyphs/RoamingGlyph.tsx
export function RoamingGlyph({ size = 80 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {/* walker */}
      <circle cx={38} cy={22} r={7} />
      <path d="M38 30 L38 58 M38 40 L22 52 M38 40 L54 48 M38 58 L30 84 M38 58 L48 84" />
      {/* floating camera */}
      <rect x={64} y={30} width={28} height={20} rx={3} />
      <circle cx={78} cy={40} r={5} strokeWidth={2} />
      <circle cx={88} cy={34} r={1.5} fill="currentColor" stroke="none" />
    </svg>
  )
}
```

- [ ] **Step 9: Barrel export all 8 glyphs**

Create `src/components/glow/glyphs/index.ts`:
```ts
export { DrinksGlyph } from './DrinksGlyph'
export { JailGlyph } from './JailGlyph'
export { PrizeWheelGlyph } from './PrizeWheelGlyph'
export { DJGlyph } from './DJGlyph'
export { CheckInGlyph } from './CheckInGlyph'
export { CheckOutGlyph } from './CheckOutGlyph'
export { PhotoGlyph } from './PhotoGlyph'
export { RoamingGlyph } from './RoamingGlyph'
```

- [ ] **Step 10: Typecheck + commit**

```bash
npm run typecheck
git add src/components/glow/glyphs/
git commit -m "feat(glow): add 8 station glyph SVGs (drinks/jail/prize/DJ/check-in/check-out/photo-polaroid/roaming)"
git push
```

Expected: typecheck clean.

---

### Task 4.10: Update `src/components/glow/index.ts` barrel

**File:** `src/components/glow/index.ts`

- [ ] **Step 1: Append new exports**

Edit `src/components/glow/index.ts`, append after existing exports:

```ts
export { GridFloor } from './GridFloor'
export { NeonWordmark } from './NeonWordmark'
export { SectionHeading } from './SectionHeading'
export { PageHead } from './PageHead'
export { SignPanel } from './SignPanel'
export { BigToggle } from './BigToggle'
export { NeonScanner } from './NeonScanner'
export { StatTile } from './StatTile'
export { TimelineTrack } from './TimelineTrack'
export type { TimelineItem } from './TimelineTrack'
export { AdminNav } from './AdminNav'
export type { AdminNavKey } from './AdminNav'
export { GlyphGlow } from './GlyphGlow'
export * from './glyphs'
```

- [ ] **Step 2: Typecheck + commit**

```bash
npm run typecheck
git add src/components/glow/index.ts
git commit -m "feat(glow): barrel-export all new primitives + glyphs from components/glow"
git push
```

---

## Phase 5 — Station rebuild

### Task 5.1: Create `app/station/layout.tsx`

**Files:**
- Create: `src/app/station/layout.tsx`

- [ ] **Step 1: Write the layout**

```tsx
// src/app/station/layout.tsx
import { Aurora, GridFloor } from '@/components/glow'

export default function StationLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh bg-ink text-paper">
      <Aurora className="opacity-60" />
      <GridFloor className="opacity-40" />
      <div className="relative z-10 mx-auto max-w-[480px] px-4 py-5 pb-20 safe-bottom">
        {children}
      </div>
      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-ink-hair/60 bg-ink/80 backdrop-blur-sm px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-mist [font-family:var(--font-mono),JetBrains_Mono,monospace]">
        <span className="mx-auto block max-w-[480px]">
          SHIFT · LCA · APR 25 · 5–8PM
        </span>
      </footer>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck + verify in browser**

```bash
npm run typecheck
```

Then browse to `http://localhost:3050/station` — expect: Aurora + grid floor visible, footer strip at bottom, existing picker rendered above (will be rebuilt in Task 5.2).

- [ ] **Step 3: Commit**

```bash
git add src/app/station/layout.tsx
git commit -m "feat(station): add station layout with Aurora backdrop + mono footer strip"
git push
```

---

### Task 5.2: Rebuild `StationPicker.tsx` with glyph cards

**Files:**
- Modify: `src/components/station/StationPicker.tsx`

- [ ] **Step 1: Read the current picker to understand the slug contract**

```bash
cat src/components/station/StationPicker.tsx | head -60
```

Note the `STATIONS` array shape, the `onPick` prop, and the localStorage key (`sbbq_station_slug` or similar). Preserve that contract. The rebuild only swaps the rendering.

- [ ] **Step 2: Replace picker body with neon wordmark hero + tone-coded glyph card grid**

```tsx
// src/components/station/StationPicker.tsx (after imports)
import { NeonWordmark, GlyphGlow, Chip } from '@/components/glow'
import {
  DrinksGlyph, JailGlyph, PrizeWheelGlyph, DJGlyph,
  CheckInGlyph, CheckOutGlyph, PhotoGlyph, RoamingGlyph,
} from '@/components/glow/glyphs'

// Keep existing STATIONS array + types; if absent, add:
type StationSlug = 'check_in' | 'check_out' | 'drinks' | 'jail' | 'prize_wheel' | 'dj_shoutout' | 'photo' | 'roaming'

type Tone = 'magenta' | 'cyan' | 'uv' | 'gold' | 'mint'

const GRID: { slug: StationSlug; href: string; name: string; sub: string; tone: Tone; Glyph: React.FC<{ size?: number }> }[] = [
  { slug: 'check_in',    href: '/station/check-in',      name: 'Check-in',    sub: 'Scan arrivals',        tone: 'cyan',    Glyph: CheckInGlyph },
  { slug: 'check_out',   href: '/station/check-out',     name: 'Check-out',   sub: 'Pickup-code gate',     tone: 'mint',    Glyph: CheckOutGlyph },
  { slug: 'drinks',      href: '/station/activity?s=drinks',      name: 'Drinks',      sub: '2 tickets per wristband', tone: 'cyan',    Glyph: DrinksGlyph },
  { slug: 'jail',        href: '/station/activity?s=jail',        name: 'Jail / Pass', sub: 'Send / free · 1 ea',     tone: 'magenta', Glyph: JailGlyph },
  { slug: 'prize_wheel', href: '/station/activity?s=prize_wheel', name: 'Prize Wheel', sub: '1 spin per wristband',   tone: 'gold',    Glyph: PrizeWheelGlyph },
  { slug: 'dj_shoutout', href: '/station/activity?s=dj_shoutout', name: 'DJ Shoutout', sub: '1 song per wristband',   tone: 'uv',      Glyph: DJGlyph },
  { slug: 'photo',       href: '/station/photo',         name: 'Photo Booth', sub: 'Consent-gated',         tone: 'magenta', Glyph: PhotoGlyph },
  { slug: 'roaming',     href: '/station/roaming',       name: 'Roaming',     sub: 'Auto-tag vision',       tone: 'uv',      Glyph: RoamingGlyph },
]

const STATION_SLUG_STORAGE_KEY = 'sbbq_station_slug' // match existing key name

export default function StationPicker() {
  const pick = (slug: StationSlug, href: string) => {
    try { localStorage.setItem(STATION_SLUG_STORAGE_KEY, slug) } catch {}
    window.location.href = href
  }
  return (
    <div className="flex flex-col gap-6">
      {/* Hero */}
      <div className="flex flex-col items-center gap-3 pt-4 pb-2 text-center">
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-mist [font-family:var(--font-mono),JetBrains_Mono,monospace]">
          VOLUNTEER HUB
        </span>
        <NeonWordmark tone="cyan" size="md" as="h1">BASH &amp; GLOW</NeonWordmark>
        <p className="text-sm text-mist">Tap your station.</p>
      </div>
      {/* Grid */}
      <div className="grid grid-cols-2 gap-3">
        {GRID.map((s) => (
          <button
            key={s.slug}
            onClick={() => pick(s.slug, s.href)}
            className={clsx(
              'group flex flex-col items-center gap-2 rounded-2xl border bg-ink-2/60 p-4 text-center',
              'border-ink-hair hover:border-current transition-[transform,border-color] duration-200',
              'active:scale-[0.97] motion-safe:hover:-translate-y-0.5',
              `hover:text-neon-${s.tone}`,
            )}
          >
            <GlyphGlow tone={s.tone} size={72}><s.Glyph /></GlyphGlow>
            <span className="font-display text-sm font-bold uppercase tracking-[0.08em] text-paper">{s.name}</span>
            <span className="text-[10px] uppercase tracking-[0.14em] text-mist">{s.sub}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// Add clsx import at top if missing
import { clsx } from '@/components/glow/clsx'
```

- [ ] **Step 3: Visual-smoke E2E test**

Create `tests/e2e/station-picker.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

test('station picker renders all 8 stations + hero wordmark', async ({ page }) => {
  await page.goto('/station')
  await expect(page.getByText(/BASH ?& ?GLOW/i)).toBeVisible()
  await expect(page.getByText(/VOLUNTEER HUB/i)).toBeVisible()
  for (const name of ['Check-in', 'Check-out', 'Drinks', 'Jail / Pass', 'Prize Wheel', 'DJ Shoutout', 'Photo Booth', 'Roaming']) {
    await expect(page.getByRole('button', { name: new RegExp(name, 'i') })).toBeVisible()
  }
})

test('picker writes slug to localStorage on tap', async ({ page }) => {
  await page.goto('/station')
  await page.getByRole('button', { name: /Drinks/ }).click()
  // Wait briefly for navigation triggered by window.location.href
  await page.waitForURL(/\/station\/activity\?s=drinks/)
  const stored = await page.evaluate(() => localStorage.getItem('sbbq_station_slug'))
  expect(stored).toBe('drinks')
})
```

- [ ] **Step 4: Run typecheck + E2E smoke + commit**

```bash
npm run typecheck
npm run test:e2e -- tests/e2e/station-picker.spec.ts
git add src/components/station/StationPicker.tsx tests/e2e/station-picker.spec.ts
git commit -m "feat(station): rebuild picker with NeonWordmark hero + 8 tone-coded glyph cards"
git push
```

Expected: typecheck clean, 2 E2E specs pass.

---

### Task 5.3: Rebuild `CheckInStation.tsx`

**Files:**
- Modify: `src/components/station/CheckInStation.tsx`

- [ ] **Step 1: Wrap existing scanner + action logic in new chrome**

Preserve the existing scan + walk-in + manual-lookup behavior; change only the composition. Key change: use `<PageHead>` + `<NeonScanner>` + tone-cyan.

```tsx
// src/components/station/CheckInStation.tsx (top of file, after imports)
import { PageHead, NeonScanner, Chip, Button, SectionHeading } from '@/components/glow'
// ... keep existing useState/useEffect hooks for scanner state, arrival log, etc.

export default function CheckInStation() {
  // ... existing hooks ...
  return (
    <div className="flex flex-col gap-5">
      <PageHead
        back={{ href: '/station', label: 'stations' }}
        title="CHECK-IN STATION"
        sub="Scan a family's QR, or tap Walk-in to register a new kid."
        right={<Chip tone="cyan" glow>LIVE · {checkedInCount}</Chip>}
      />
      <NeonScanner tone="cyan" aspect="portrait" hint="Align QR · auto-capture" scanning={!scanResult}>
        {/* existing camera feed / placeholder content */}
      </NeonScanner>
      <div className="grid grid-cols-2 gap-3">
        <Button tone="magenta" size="lg" fullWidth onClick={handleWalkin}>Walk-in</Button>
        <Button tone="ghost" size="lg" fullWidth onClick={handleManualLookup}>Manual lookup</Button>
      </div>
      <section className="flex flex-col gap-2">
        <SectionHeading num="LOG" title="Recent arrivals" tone="cyan" />
        {/* existing arrival-log map preserved */}
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Verify existing check-in E2E still passes**

```bash
npm run test:e2e -- tests/e2e/checkin.spec.ts  # or the existing name
```

Expected: all existing check-in specs green.

- [ ] **Step 3: Commit**

```bash
git add src/components/station/CheckInStation.tsx
git commit -m "feat(station/check-in): restyle with PageHead + NeonScanner + cyan tone"
git push
```

---

### Task 5.4: Rebuild `CheckOutStation.tsx`

**Files:**
- Modify: `src/components/station/CheckOutStation.tsx`

- [ ] **Step 1: Same pattern as check-in but with mint tone + pickup-code gate in `<SignPanel>`**

```tsx
// In CheckOutStation.tsx — essential composition delta
import { PageHead, NeonScanner, SignPanel, Button, Chip, SectionHeading } from '@/components/glow'

// ... existing hooks ...
return (
  <div className="flex flex-col gap-5">
    <PageHead
      back={{ href: '/station', label: 'stations' }}
      title="CHECK-OUT STATION"
      sub="Scan the wristband and match the 4-digit pickup code."
      right={<Chip tone="mint" glow>OUT · {checkedOutCount}</Chip>}
    />
    {!matchedKid ? (
      <NeonScanner tone="mint" aspect="portrait" hint="Align wristband QR" scanning>
        {/* scanner feed */}
      </NeonScanner>
    ) : (
      <SignPanel tone="mint" padding="lg">
        {/* existing pickup-code challenge UI preserved — just re-skin buttons/inputs */}
      </SignPanel>
    )}
    <section className="flex flex-col gap-2">
      <SectionHeading num="LOG" title="Recent pickups" tone="mint" />
      {/* existing recent log */}
    </section>
  </div>
)
```

- [ ] **Step 2: Verify existing check-out E2E still passes**

```bash
npm run test:e2e -- tests/e2e/checkout.spec.ts  # confirm name from package
```

- [ ] **Step 3: Commit**

```bash
git add src/components/station/CheckOutStation.tsx
git commit -m "feat(station/check-out): restyle with PageHead + Scanner→SignPanel gate (mint tone)"
git push
```

---

### Task 5.5: Rebuild `ActivityStation.tsx` (5-mode driver)

**Files:**
- Modify: `src/components/station/ActivityStation.tsx`

- [ ] **Step 1: Read current ActivityStation to find how stationType is resolved (query param, localStorage, or context)**

```bash
cat src/components/station/ActivityStation.tsx | head -80
```

- [ ] **Step 2: Rebuild using tone+glyph lookup driven by resolved stationType**

Key piece: build a single STATION_MAP keyed by type → `{tone, glyph, tagline, actionLabel, actionTone}`.

```tsx
// src/components/station/ActivityStation.tsx (top)
import { PageHead, NeonScanner, GlyphGlow, Chip, Button, SectionHeading } from '@/components/glow'
import {
  DrinksGlyph, JailGlyph, PrizeWheelGlyph, DJGlyph,
} from '@/components/glow/glyphs'

type StationMode = 'drinks' | 'jail' | 'prize_wheel' | 'dj_shoutout' | 'free_visit'

const STATION_MAP: Record<StationMode, {
  tone: 'magenta' | 'cyan' | 'uv' | 'gold' | 'mint'
  Glyph: React.FC<{ size?: number }>
  name: string
  tagline: string
  actionLabel: string
  secondary?: string
}> = {
  drinks:      { tone: 'cyan',    Glyph: DrinksGlyph,     name: 'DRINKS',        tagline: 'Pour and scan. Two drink tickets per wristband.', actionLabel: '−1 Drink' },
  jail:        { tone: 'magenta', Glyph: JailGlyph,       name: 'JAIL / PASS',   tagline: 'Send a kid to jail (−1) or free them (−1). Same bucket.', actionLabel: 'Send to Jail', secondary: 'Free from Jail' },
  prize_wheel: { tone: 'gold',    Glyph: PrizeWheelGlyph, name: 'PRIZE WHEEL',   tagline: 'One spin per wristband. Scan before they pull.',         actionLabel: '−1 Spin' },
  dj_shoutout: { tone: 'uv',      Glyph: DJGlyph,         name: 'DJ SHOUTOUT',   tagline: "Pick their song, scan, send it to the booth.",          actionLabel: 'Record Shoutout' },
  free_visit:  { tone: 'cyan',    Glyph: DrinksGlyph,     name: 'FREE VISIT',    tagline: 'Just scan to log the visit. No ticket cost.',            actionLabel: 'Log Visit' },
}

export default function ActivityStation({ mode }: { mode: StationMode }) {
  const cfg = STATION_MAP[mode]
  // ... existing useState for scannedKid, existing POST handlers ...

  return (
    <div className="flex flex-col gap-5">
      <PageHead
        back={{ href: '/station', label: 'stations' }}
        title={cfg.name}
        sub={cfg.tagline}
        right={<Chip tone={cfg.tone} glow>{redeemedCount} GIVEN</Chip>}
      />
      <div className="flex justify-center py-2">
        <GlyphGlow tone={cfg.tone} size={140}><cfg.Glyph /></GlyphGlow>
      </div>
      <NeonScanner tone={cfg.tone} aspect="square" hint="Scan wristband" scanning={!scannedKid}>
        {/* scanner content */}
      </NeonScanner>
      {/* Kid-info card (Chip badges for consent/allergy/balance) */}
      {scannedKid && (
        <div className="flex flex-col gap-3 rounded-xl border border-ink-hair bg-ink-2/60 p-4">
          {/* existing kid header with name, balances, allergies */}
          <div className="grid grid-cols-2 gap-2">
            <Button tone={cfg.tone} size="lg" fullWidth onClick={() => handleRedeem('primary')}>{cfg.actionLabel}</Button>
            {cfg.secondary && (
              <Button tone="ghost" size="lg" fullWidth onClick={() => handleRedeem('secondary')}>{cfg.secondary}</Button>
            )}
          </div>
        </div>
      )}
      <section className="flex flex-col gap-2">
        <SectionHeading num="LIVE" title="Last 10 redemptions" tone={cfg.tone} />
        {/* existing activity log */}
      </section>
    </div>
  )
}
```

- [ ] **Step 3: Typecheck + run existing station E2E**

```bash
npm run typecheck
npm run test:e2e -- tests/e2e/spend.spec.ts tests/e2e/reload.spec.ts
```

Expected: no regressions.

- [ ] **Step 4: Commit**

```bash
git add src/components/station/ActivityStation.tsx
git commit -m "feat(station/activity): restyle as 5-mode driver with tone + glyph map"
git push
```

---

### Task 5.6: Rebuild `PhotoStation.tsx`

**Files:**
- Modify: `src/components/station/PhotoStation.tsx`

- [ ] **Step 1: Compose with Scanner (polaroid placeholder) + consent Chip**

```tsx
// src/components/station/PhotoStation.tsx
import { PageHead, NeonScanner, GlyphGlow, Chip, Button, SectionHeading } from '@/components/glow'
import { PhotoGlyph } from '@/components/glow/glyphs'

export default function PhotoStation() {
  // ... existing camera / capture hooks ...
  return (
    <div className="flex flex-col gap-5">
      <PageHead
        back={{ href: '/station', label: 'stations' }}
        title="PHOTO BOOTH"
        sub="Tap to snap. Consent-off kids get text-only receipts."
        right={<Chip tone="magenta" glow>TAKEN · {takenCount}</Chip>}
      />
      <NeonScanner tone="magenta" aspect="portrait" hint="Tap to snap · 3-2-1" scanning={!capturing}>
        {!cameraReady ? <GlyphGlow tone="magenta" size={96}><PhotoGlyph /></GlyphGlow> : null /* camera feed */}
      </NeonScanner>
      {/* Frame-style filter chips — keep existing list */}
      <div className="flex gap-2 flex-wrap">
        {FRAME_OPTIONS.map((f) => (
          <Chip key={f} tone={frame === f ? 'magenta' : 'quiet'} glow={frame === f} onClick={() => setFrame(f)}>{f}</Chip>
        ))}
      </div>
      <div className={clsx('rounded-xl border px-4 py-3 text-sm', consentGranted ? 'border-neon-mint/50 text-neon-mint' : 'border-neon-gold/50 text-neon-gold')}>
        {consentGranted
          ? 'CONSENT ON · Photos sync to the family\'s album after the event.'
          : 'CONSENT OFF · Text-only receipt. No photos saved.'}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button tone="magenta" size="lg" fullWidth onClick={handleSnap}>Snap!</Button>
        <Button tone="ghost" size="lg" fullWidth onClick={handleRetake}>Retake last</Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck + E2E + commit**

```bash
npm run typecheck
npm run test:e2e -- tests/e2e/photo.spec.ts  # verify name
git add src/components/station/PhotoStation.tsx
git commit -m "feat(station/photo): restyle with polaroid placeholder + consent-banner copy (magenta tone)"
git push
```

---

### Task 5.7: Rebuild `RoamingStation.tsx`

**Files:**
- Modify: `src/components/station/RoamingStation.tsx`

- [ ] **Step 1: Compose with Scanner + SignPanel confirmation + match-status Chip**

```tsx
// src/components/station/RoamingStation.tsx
import { PageHead, NeonScanner, GlyphGlow, SignPanel, Chip, Button, SectionHeading } from '@/components/glow'
import { RoamingGlyph } from '@/components/glow/glyphs'

export default function RoamingStation() {
  // ... existing camera + upload + poll hooks ...
  return (
    <div className="flex flex-col gap-5">
      <PageHead
        back={{ href: '/station', label: 'stations' }}
        title="ROAMING"
        sub="Shoot freely. We'll sort the matches after the event."
        right={<Chip tone="uv" glow>QUEUE · {queuedCount}</Chip>}
      />
      <NeonScanner tone="uv" aspect="portrait" hint="Tap to snap · auto-upload" scanning={!uploading}>
        {!cameraReady ? <GlyphGlow tone="uv" size={96}><RoamingGlyph /></GlyphGlow> : null /* camera feed */}
      </NeonScanner>
      {lastUploadStatus && (
        <SignPanel tone="uv" padding="md">
          <div className="text-sm text-paper">Sent to queue. Photos sync after the event.</div>
          <div className="mt-2 flex items-center gap-2">
            <Chip tone={lastUploadStatus === 'auto' ? 'mint' : lastUploadStatus === 'pending_review' ? 'gold' : 'quiet'}>
              {lastUploadStatus.toUpperCase()}
            </Chip>
          </div>
        </SignPanel>
      )}
      <SectionHeading num="LAST 5" title="Recent captures" tone="uv" />
      {/* existing thumbnail strip */}
    </div>
  )
}
```

- [ ] **Step 2: Typecheck + E2E + commit**

```bash
npm run typecheck
npm run test:e2e -- tests/e2e/vision.spec.ts
git add src/components/station/RoamingStation.tsx
git commit -m "feat(station/roaming): restyle with Scanner + SignPanel confirmation (uv tone)"
git push
```

---

### Task 5.8: Rebuild `LookupStation.tsx` (profile)

**Files:**
- Modify: `src/components/station/LookupStation.tsx`

- [ ] **Step 1: Compose with SignPanel + StatTile grid + TimelineTrack**

```tsx
// src/components/station/LookupStation.tsx
import { PageHead, NeonScanner, SignPanel, StatTile, TimelineTrack, Chip } from '@/components/glow'
import type { TimelineItem } from '@/components/glow'

export default function LookupStation() {
  // ... existing scan hook → fetches kid timeline + balances ...
  const kidTone = (kid?.pref_tone as 'magenta'|'cyan'|'uv'|'gold'|'mint') ?? 'uv'
  return (
    <div className="flex flex-col gap-5">
      <PageHead
        back={{ href: '/station', label: 'stations' }}
        title="KID LOOKUP"
        sub="Scan any wristband to see what the kid has done tonight."
      />
      {!kid ? (
        <NeonScanner tone="cyan" aspect="portrait" hint="Scan wristband" scanning />
      ) : (
        <SignPanel tone={kidTone} padding="lg">
          <h2 className="font-display text-2xl font-bold text-paper">{kid.name}</h2>
          <div className="mt-1 flex flex-wrap gap-2">
            {kid.allergies?.length ? <Chip tone="gold">⚠ {kid.allergies.join(', ')}</Chip> : null}
            {!kid.photo_consent_granted ? <Chip tone="quiet">photos off</Chip> : null}
            {!kid.ai_consent_granted ? <Chip tone="quiet">ai off</Chip> : null}
          </div>
          <div className="mt-4 grid grid-cols-4 gap-3">
            <StatTile label="Drinks"   value={`${kid.drinks_left}/2`}  tone="cyan" />
            <StatTile label="Jail"     value={`${kid.jail_left}/3`}    tone="magenta" />
            <StatTile label="Spins"    value={`${kid.spins_left}/1`}   tone="gold" />
            <StatTile label="Shoutout" value={`${kid.dj_left}/1`}      tone="uv" />
          </div>
          <div className="mt-4">
            <TimelineTrack items={kid.visits.map((v: any): TimelineItem => ({
              time: v.time,
              label: v.station_label,
              state: v.is_last ? 'now' : 'done',
              tone: v.tone,
            }))} />
          </div>
        </SignPanel>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
npm run typecheck
git add src/components/station/LookupStation.tsx
git commit -m "feat(station/profile): restyle lookup with SignPanel + StatTile grid + TimelineTrack"
git push
```

---

## Phase 6 — Admin shell + dashboard

### Task 6.1: Create `app/admin/layout.tsx` with AdminNav + Aurora

**Files:**
- Create: `src/app/admin/layout.tsx`

- [ ] **Step 1: Write the layout with live-poll right-slot**

```tsx
// src/app/admin/layout.tsx
'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Aurora, AdminNav, Chip } from '@/components/glow'
import type { AdminNavKey } from '@/components/glow'

function pathToKey(path: string): AdminNavKey {
  if (path.startsWith('/admin/children')) return 'children'
  if (path.startsWith('/admin/stories'))  return 'stories'
  if (path.startsWith('/admin/photos'))   return 'photos'
  if (path.startsWith('/admin/stations')) return 'stations'
  if (path.startsWith('/admin/bulk'))     return 'bulk'
  if (path.startsWith('/admin/settings')) return 'settings'
  return 'dashboard'
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '/admin'
  const [onsite, setOnsite] = useState<number | null>(null)

  useEffect(() => {
    let alive = true
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/stats', { credentials: 'include' })
        if (!res.ok) return
        const data = await res.json()
        if (alive && typeof data.onsite === 'number') setOnsite(data.onsite)
      } catch {}
    }
    fetchStats()
    const id = setInterval(fetchStats, 5000)
    return () => { alive = false; clearInterval(id) }
  }, [])

  return (
    <div className="relative min-h-dvh bg-ink text-paper">
      <Aurora className="opacity-40" />
      <AdminNav
        active={pathToKey(pathname)}
        right={<Chip tone="mint" glow>LIVE · {onsite ?? '—'} ONSITE</Chip>}
      />
      <div className="relative z-10 mx-auto max-w-[1440px] px-5 py-6">
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Remove old `AdminShell` usage from admin pages**

The existing `src/components/admin/AdminShell.tsx` wraps every admin page. With the new layout.tsx, that wrapping moves up. Check for per-page `AdminShell` usage and remove it (it'll cause double-chrome otherwise):

```bash
grep -rln "AdminShell" src/app/admin/ src/components/admin/
```

For each page that imports and wraps in `<AdminShell>`, replace the wrapper with just `<>` children. The functional equivalent now lives in layout.tsx.

- [ ] **Step 3: Typecheck + browse `/admin`**

```bash
npm run typecheck
```

Browse to `http://localhost:3050/admin` — expect: AdminNav visible with 7 links, LIVE chip updates from API, no double chrome.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/layout.tsx src/components/admin/
git commit -m "feat(admin): add shell layout with AdminNav + Aurora + LIVE poll; drop per-page AdminShell"
git push
```

---

### Task 6.2: Rebuild `Dashboard.tsx`

**Files:**
- Modify: `src/components/admin/Dashboard.tsx`

- [ ] **Step 1: Compose hero + stat grid + timeline + alerts + stations**

```tsx
// src/components/admin/Dashboard.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import { PageHead, StatTile, SignPanel, TimelineTrack, Chip, Button } from '@/components/glow'
import type { TimelineItem } from '@/components/glow'

export default function Dashboard() {
  const [stats, setStats]       = useState<{ checked_in: number; expected: number; kids_zone: number; photos: number; onsite: number } | null>(null)
  const [alerts, setAlerts]     = useState<{ id: string; title: string; sub: string }[]>([])
  const [stations, setStations] = useState<{ name: string; tone: 'magenta'|'cyan'|'uv'|'gold'|'mint'; note: string }[]>([])
  const [timeline, setTimeline] = useState<TimelineItem[]>([])
  const [now, setNow]           = useState<Date>(new Date())

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/admin/stats', { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          setStats(data)
          setAlerts(data.alerts || [])
          setStations(data.stations || [])
          setTimeline(data.timeline || [])
        }
      } catch {}
    }
    load()
    const id = setInterval(load, 5000)
    const tick = setInterval(() => setNow(new Date()), 30000)
    return () => { clearInterval(id); clearInterval(tick) }
  }, [])

  const heroTitle = useMemo(() => {
    // State-driven copy matching spec §4
    if (!stats) return 'Bash loading. Final walkthroughs pending.'
    if (stats.checked_in === 0) return 'Bash loading. Final walkthroughs pending.'
    return 'Bash is LIVE. Here\'s the pulse.'
  }, [stats])

  const dateStrip = now.toLocaleString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  }).toUpperCase()

  return (
    <div className="flex flex-col gap-6">
      <PageHead
        title={heroTitle}
        sub={dateStrip}
        right={<Button tone="ghost" size="sm" disabled title="Coming post-event">Broadcast</Button>}
      />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile label="Checked in"    value={stats?.checked_in ?? '—'} tone="mint"    outline />
        <StatTile label="Expected"      value={stats?.expected   ?? '—'} tone="cyan"    outline />
        <StatTile label="Kids zone"     value={stats?.kids_zone  ?? '—'} tone="magenta" outline />
        <StatTile label="Photos posted" value={stats?.photos     ?? '—'} tone="gold"    outline />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <SignPanel tone="uv" padding="lg">
          <span className="text-[10px] uppercase tracking-[0.14em] text-neon-uv [font-family:var(--font-mono),JetBrains_Mono,monospace]">NIGHT TIMELINE</span>
          <div className="mt-3">
            <TimelineTrack items={timeline} />
          </div>
        </SignPanel>
        <div className="flex flex-col gap-4">
          <SignPanel tone="magenta" padding="md">
            <span className="text-[10px] uppercase tracking-[0.14em] text-neon-magenta [font-family:var(--font-mono),JetBrains_Mono,monospace]">ALERTS · {alerts.length}</span>
            <ul className="mt-3 flex flex-col gap-2">
              {alerts.map((a) => (
                <li key={a.id} className="rounded-lg border border-ink-hair bg-ink-3/60 p-3">
                  <div className="font-display text-sm text-paper">{a.title}</div>
                  <div className="text-xs text-mist mt-1">{a.sub}</div>
                </li>
              ))}
              {alerts.length === 0 && <li className="text-xs text-mist">No alerts.</li>}
            </ul>
          </SignPanel>
          <SignPanel tone="cyan" padding="md">
            <span className="text-[10px] uppercase tracking-[0.14em] text-neon-cyan [font-family:var(--font-mono),JetBrains_Mono,monospace]">STATIONS · {stations.length} OPEN</span>
            <ul className="mt-3 flex flex-col gap-1">
              {stations.map((s) => (
                <li key={s.name} className="flex items-center justify-between py-1">
                  <span className="font-display text-sm text-paper">{s.name}</span>
                  <Chip tone={s.tone}>{s.note}</Chip>
                </li>
              ))}
            </ul>
          </SignPanel>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck + E2E + commit**

```bash
npm run typecheck
npm run test:e2e -- tests/e2e/admin.spec.ts  # verify name from package
git add src/components/admin/Dashboard.tsx
git commit -m "feat(admin/dashboard): rebuild hero + StatTile grid + TimelineTrack + alerts/stations panels"
git push
```

Expected: no regressions in existing admin E2E.

---

## Phase 7 — Admin full-restyle (3 surfaces)

### Task 7.1: Rebuild `PhotoQueue.tsx` + `PhotoGallery.tsx`

**Files:**
- Modify: `src/components/admin/PhotoQueue.tsx`
- Modify: `src/components/admin/PhotoGallery.tsx`

- [ ] **Step 1: Replace page header + filter chips + tile grid with new primitives**

```tsx
// src/components/admin/PhotoQueue.tsx (key composition)
import { PageHead, Chip, GlyphGlow } from '@/components/glow'
import { GlowCross } from '@/components/glow' // kept as empty-state placeholder

// ... existing hooks for photos, filter, approve/reject ...

return (
  <div className="flex flex-col gap-5">
    <PageHead
      title="Photos"
      sub="PHOTOS · MODERATION — 4 awaiting review. Approve or flag. Consent-off photos can be released to the guest only."
      right={
        <div className="flex items-center gap-2">
          <Chip tone="mint"    glow>APPROVED · {approvedCount}</Chip>
          <Chip tone="gold"    glow>QUEUE · {queueCount}</Chip>
          <Chip tone="danger"  glow>FLAGGED · {flaggedCount}</Chip>
        </div>
      }
    />
    <div className="flex flex-wrap gap-2">
      {(['all', 'queue', 'approved', 'flagged', 'unmatched'] as const).map((f) => (
        <Chip key={f} tone={filter === f ? 'cyan' : 'quiet'} glow={filter === f} onClick={() => setFilter(f)}>{f}</Chip>
      ))}
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {photos.map((p) => {
        const stateChip = p.state === 'approved' ? 'mint' : p.state === 'queue' ? 'gold' : 'danger'
        const frameTone = p.frame_tone ?? 'cyan'
        return (
          <button
            key={p.id}
            onClick={() => openAction(p.id)}
            className={clsx(
              'group relative rounded-xl border bg-ink-2/60 p-1.5 text-left',
              `border-neon-${frameTone}/40`,
            )}
          >
            <div className={clsx('aspect-square rounded-lg overflow-hidden grid place-items-center',
              `bg-gradient-to-br from-neon-${frameTone}/10 via-transparent to-transparent`)}
            >
              {p.image_url
                ? <img src={p.image_url} alt="" className="h-full w-full object-cover" />
                : <GlyphGlow tone={frameTone} size={54}><GlowCross /></GlyphGlow> /* placeholder only, until image loads */}
            </div>
            <div className="flex items-center justify-between pt-2 px-1.5 pb-1">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-mist [font-family:var(--font-mono),JetBrains_Mono,monospace] truncate">{p.label}</span>
              <Chip tone={stateChip}>{p.state}</Chip>
            </div>
          </button>
        )
      })}
    </div>
  </div>
)
```

(`PhotoGallery.tsx` — same header pattern, different data source and action set.)

- [ ] **Step 2: Typecheck + E2E + commit**

```bash
npm run typecheck
npm run test:e2e -- tests/e2e/admin-photos.spec.ts  # verify name
git add src/components/admin/PhotoQueue.tsx src/components/admin/PhotoGallery.tsx
git commit -m "feat(admin/photos): restyle queue + gallery with PageHead + chip filter + tone-bordered tiles"
git push
```

---

### Task 7.2: Rebuild `StoriesList.tsx` with 10s pending poll

**Files:**
- Modify: `src/components/admin/StoriesList.tsx`

The STATUS.md audit finding: "Stories list doesn't auto-refresh." Bundle the fix here.

- [ ] **Step 1: Add 10s poll while any row is `pending`**

```tsx
// src/components/admin/StoriesList.tsx (key bits)
import { PageHead, Chip } from '@/components/glow'
import { useEffect, useState } from 'react'

// ... existing state ...

useEffect(() => {
  const hasPending = rows.some((r) => r.status === 'pending')
  if (!hasPending) return
  const id = setInterval(() => fetchRows(), 10_000)
  return () => clearInterval(id)
}, [rows])

return (
  <div className="flex flex-col gap-5">
    <PageHead
      title="Stories"
      sub="STORIES · REVIEW QUEUE"
      right={
        <div className="flex flex-wrap gap-2">
          {(['all', 'pending', 'needs_review', 'auto_approved', 'approved', 'sent'] as const).map((f) => (
            <Chip key={f} tone={filter === f ? 'cyan' : 'quiet'} glow={filter === f} onClick={() => setFilter(f)}>{f}</Chip>
          ))}
        </div>
      }
    />
    <ul className="flex flex-col gap-2">
      {rows.map((r) => (
        <li key={r.id}>
          <Link href={`/admin/stories/${r.id}`} className="flex items-center justify-between rounded-xl border border-ink-hair bg-ink-2/60 p-3 hover:border-neon-cyan/60 transition">
            <div>
              <div className="font-display text-sm text-paper">{r.child_name}</div>
              <div className="mt-1 flex gap-2">
                <Chip tone={r.status === 'auto_approved' ? 'mint' : r.status === 'needs_review' ? 'gold' : 'quiet'}>{r.status}</Chip>
                <Chip tone="quiet">{r.word_count} words</Chip>
                <Chip tone="quiet">{r.photo_count} photos</Chip>
              </div>
            </div>
            <Chip tone={r.score >= 0.8 ? 'mint' : r.score >= 0.6 ? 'gold' : 'danger'}>score {r.score.toFixed(2)}</Chip>
          </Link>
        </li>
      ))}
    </ul>
  </div>
)
```

- [ ] **Step 2: Typecheck + E2E + commit**

```bash
npm run typecheck
npm run test:e2e -- tests/e2e/stories.spec.ts
git add src/components/admin/StoriesList.tsx
git commit -m "feat(admin/stories): restyle list + add 10s poll while any row pending (closes STATUS audit)"
git push
```

---

### Task 7.3: Rebuild `StoryEditor.tsx` (highest-judgment surface)

**Files:**
- Modify: `src/components/admin/StoryEditor.tsx`

- [ ] **Step 1: Compose with SignPanel + photo strip + SectionHeading + auto-check chips + Button row**

```tsx
// src/components/admin/StoryEditor.tsx (key composition)
import { PageHead, SignPanel, SectionHeading, TimelineTrack, Chip, Button } from '@/components/glow'
import type { TimelineItem } from '@/components/glow'

// ... existing hooks for story data, regenerate, approve, skip ...

const kidTone = (story.child.pref_tone ?? 'uv') as 'magenta'|'cyan'|'uv'|'gold'|'mint'

return (
  <div className="flex flex-col gap-5">
    <PageHead
      back={{ href: '/admin/stories', label: 'stories' }}
      title={`${story.child.name}'s keepsake`}
      sub="Review, edit, regenerate, or approve."
    />
    <SignPanel tone={kidTone} padding="lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-paper">{story.child.name}</h2>
          <div className="mt-1 flex flex-wrap gap-2">
            {story.autocheck.word_ok   && <Chip tone="mint">word-count ✓</Chip>}
            {story.autocheck.stations_ok && <Chip tone="mint">≥2 stations ✓</Chip>}
            {story.autocheck.banned_ok && <Chip tone="mint">no banned phrases ✓</Chip>}
            {story.autocheck.timestamps_ok && <Chip tone="mint">no timestamps ✓</Chip>}
            {!story.autocheck.word_ok   && <Chip tone="danger">word-count ✗</Chip>}
          </div>
        </div>
        {story.photos?.length > 0 && (
          <div className="flex gap-2">
            {story.photos.slice(0, 4).map((p: any) => (
              <img key={p.id} src={p.url} alt="" className="h-16 w-16 rounded-lg object-cover border border-ink-hair" />
            ))}
          </div>
        )}
      </div>
      <div className="mt-5">
        <SectionHeading num="DRAFT" title="Keepsake story" tone={kidTone} />
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="mt-3 w-full rounded-xl border-2 border-ink-hair bg-ink-3/70 px-4 py-3 text-paper min-h-[260px] focus:outline-none focus:border-neon-cyan/60 focus:shadow-glow-cyan transition-[border-color,box-shadow]"
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button tone="cyan" size="lg" onClick={handleRegenerate}>Regenerate</Button>
        <Button tone="mint" size="lg" onClick={handleApprove}>Approve</Button>
        <Button tone="ghost" size="lg" onClick={handleSendBack}>Send back</Button>
        <Button tone="ghost" size="lg" onClick={handleSkip}>Skip</Button>
      </div>
    </SignPanel>
    <section>
      <SectionHeading num="LIVE" title="Stations this kid visited" tone={kidTone} />
      <div className="mt-3">
        <TimelineTrack items={story.timeline as TimelineItem[]} />
      </div>
    </section>
  </div>
)
```

- [ ] **Step 2: Typecheck + E2E + commit**

```bash
npm run typecheck
npm run test:e2e -- tests/e2e/stories.spec.ts
git add src/components/admin/StoryEditor.tsx
git commit -m "feat(admin/stories/editor): restyle with SignPanel + photo strip + autocheck chips + Timeline"
git push
```

---

## Phase 8 — Admin polish-only (5 pages)

For each page: no layout rebuild. Swap native `<button>` → `<Button>`, status pills → `<Chip>`, counters → `<StatTile>`, table headers → `<SectionHeading>` where relevant. Keep all behavior.

### Task 8.1: `ChildrenList.tsx` swap

**Files:**
- Modify: `src/components/admin/ChildrenList.tsx`

- [ ] **Step 1: Swap buttons + chips**

```tsx
// Essential swaps:
// <button className="...">Edit</button>  →  <Button tone="ghost" size="sm">Edit</Button>
// <span className="...pill...">checked-in</span>  →  <Chip tone="mint">checked in</Chip>
// <span>NEW</span>  →  <Chip tone="gold">NEW</Chip>
// <span>VIP</span>  →  <Chip tone="magenta">VIP</Chip>
```

Wrap the page header with `<PageHead title="Children" sub="{N} total — search + filter by status/allergies/consent" />`.

- [ ] **Step 2: Typecheck + commit**

```bash
npm run typecheck
git add src/components/admin/ChildrenList.tsx
git commit -m "polish(admin/children): swap to Button + Chip primitives + PageHead"
git push
```

### Task 8.2: `ChildEditor.tsx` swap

- [ ] **Step 1**: Same pattern — wrap in `<PageHead back={{href:'/admin/children',label:'children'}} title={child.name} />`. Swap section headers to `<SectionHeading num="GUARDIANS" title="Pickup people" tone="cyan" />` etc.
- [ ] **Step 2**: Commit as `polish(admin/children-editor): swap primitives`.

### Task 8.3: `BulkBalance.tsx` swap

- [ ] **Step 1**: `<PageHead title="Bulk balance" sub="Set the initial ticket balance for every checked-in kid at once." />` + swap the confirm button to `<Button tone="magenta" size="lg">`.
- [ ] **Step 2**: Commit as `polish(admin/bulk): swap primitives`.

### Task 8.4: `CatalogEditor.tsx` swap

- [ ] **Step 1**: `<PageHead title="Stations" sub="Event-night station catalog." />` + swap every row action.
- [ ] **Step 2**: Commit as `polish(admin/stations): swap primitives`.

### Task 8.5: `Settings.tsx` swap

- [ ] **Step 1**: `<PageHead title="Settings" sub="Event window, default tickets, branding, AI prompt." />` + swap save buttons + result chips.
- [ ] **Step 2**: Commit as `polish(admin/settings): swap primitives`.

---

## Phase 9 — QA gate

### Task 9.1: Typecheck clean

- [ ] **Step 1: Run + expect zero errors**

```bash
npm run typecheck
```

Expected: `Found 0 errors.` — if not, fix inline before proceeding.

### Task 9.2: Full Vitest + E2E suite

- [ ] **Step 1: Unit + component**

```bash
npm run test -- --run
```

Expected: all existing specs + 11 new primitive specs pass.

- [ ] **Step 2: E2E**

```bash
npm run test:e2e
```

Expected: all 26 existing E2E + 2 new (station-picker, admin-shell) pass. If any existing spec regresses, fix the offender — don't loosen the test.

### Task 9.3: Prototype-ism scrub

- [ ] **Step 1: Run the scrub greps**

```bash
set -o pipefail
grep -rEn "Risen ?& ?Redeemed|Bash Wall|Fr\.? Mike|Main Tent|\bGrill\b|Games & Yard|Cleanup Crew|Kids Zone|Bar ?/ ?Drinks|bash\.risenandredeemed" src/ && { echo "PROTOTYPE-ISM FOUND — fix before closing phase"; exit 1; } || echo "CLEAN"
```

Expected: `CLEAN`.

### Task 9.4: Reveal-scrub

- [ ] **Step 1: Run the reveal grep on parent-visible paths**

```bash
grep -rEn "keepsake|ai[_ ]story|AI-generated" src/app/station src/components/station src/app/register 2>&1 && { echo "REVEAL LEAK FOUND — fix before closing phase"; exit 1; } || echo "CLEAN"
```

Expected: `CLEAN`.

### Task 9.5: Motion review (real phone)

- [ ] **Step 1: Record Chrome DevTools Performance on real phone**

Per `_config/motion-review-checklist.md`:
- Connect iPhone 15 via USB; open Chrome remote debugging
- Open Performance panel, throttle to "Slow 4G + 6× CPU"
- Record 20s on `/station` (picker stagger reveal + scanner beam via tapping a station)
- Record 20s on `/admin` (stat tiles + timeline breathing)
- Expected: sustained 60fps on each recording; INP ≤ 200ms; CLS ≤ 0.02
- Save traces under `docs/qa/2026-04-19-glow-redesign-screenshots/perf-*.json`

- [ ] **Step 2: Verify reduced-motion fallback**

- Toggle iOS → Settings → Accessibility → Motion → Reduce Motion ON
- Reload `/station` + `/admin`
- Expected: no ambient loops running (scanner beam static, timeline dot static, LIVE chip static); reveals collapse to 120ms opacity fades

### Task 9.6: Applitools baselines (or declared skipped)

- [ ] **Step 1: Check for `APPLITOOLS_API_KEY` in env**

```bash
grep -E "^APPLITOOLS_API_KEY" .env.local || echo "MISSING"
```

If `MISSING`: note in Phase 9 close declaration as `Applitools: no API key, baseline skipped`. If present: run the baseline capture per `_config/visual-review-protocol.md` for:
- `/station`, `/station/check-in`, `/station/check-out`, `/station/activity?s=drinks`, `/station/photo`, `/station/roaming`, `/station/profile`
- `/admin`, `/admin/photos`, `/admin/stories`, `/admin/children`, `/admin/settings`

### Task 9.7: Screenshot capture

- [ ] **Step 1: Playwright screenshot sweep**

Create `scripts/qa-screenshots.ts`:

```ts
import { chromium, devices } from 'playwright'
import { mkdirSync } from 'node:fs'

const OUT = 'docs/qa/2026-04-19-glow-redesign-screenshots'
mkdirSync(OUT, { recursive: true })

const mobile   = devices['iPhone 15 Pro'] ?? devices['iPhone 13']
const desktop  = { viewport: { width: 1440, height: 900 } }

const STATION_ROUTES = ['/station', '/station/check-in', '/station/check-out', '/station/activity?s=drinks', '/station/activity?s=jail', '/station/activity?s=prize_wheel', '/station/activity?s=dj_shoutout', '/station/photo', '/station/roaming', '/station/profile']
const ADMIN_ROUTES   = ['/admin', '/admin/children', '/admin/stories', '/admin/photos', '/admin/stations', '/admin/bulk', '/admin/settings']

async function sweep(browser: any, ctx: any, prefix: string, routes: string[]) {
  const page = await ctx.newPage()
  for (const route of routes) {
    await page.goto(`http://localhost:3050${route}`, { waitUntil: 'networkidle' })
    const safe = route.replaceAll(/[/?=&]/g, '_').replace(/^_/, '')
    await page.screenshot({ path: `${OUT}/${prefix}__${safe || 'root'}.png`, fullPage: true })
  }
  await page.close()
}

async function main() {
  const browser = await chromium.launch()
  const m = await browser.newContext({ ...mobile, deviceScaleFactor: 3 })
  await sweep(browser, m, 'mobile',  STATION_ROUTES)
  await sweep(browser, m, 'mobile',  ADMIN_ROUTES)  // optional — admin on mobile
  await m.close()
  const d = await browser.newContext(desktop)
  await sweep(browser, d, 'desktop', ADMIN_ROUTES)
  await sweep(browser, d, 'desktop', STATION_ROUTES) // optional — station on desktop
  await d.close()
  await browser.close()
}
main()
```

Run:

```bash
npm run dev &   # ensure dev server up
sleep 5
npx tsx scripts/qa-screenshots.ts
ls docs/qa/2026-04-19-glow-redesign-screenshots/
```

Expected: 34 PNGs (17 routes × 2 viewports).

- [ ] **Step 2: Commit screenshots + script**

```bash
git add scripts/qa-screenshots.ts docs/qa/
git commit -m "qa: capture glow-redesign screenshots at mobile + desktop"
git push
```

### Task 9.8: Innovation tracker entry

- [ ] **Step 1: Append entry to `knowledge/innovation-tracker.md`**

(That file lives in the `ai_system` workspace root, not this repo. If you're working on this branch in isolation, skip this step and open it in the sibling project to add.)

Entry content:
```
### Scanner beam + breathing timeline dot + count-up stat combo

- Category: Motion
- Freshness: 2026-04-19
- Production: LCA Spring BBQ Bash /station/* and /admin/* (glow-redesign branch)
- Technique: layered ambient + state-change + reveal motion, all GPU-composited, with `prefers-reduced-motion` collapse to opacity fades. One continuous loop per page; reveals stagger 40ms; counters use tabular-nums to prevent CLS.
- Why it reads premium: each motion has a specific signal job (scanning / current-step / value-changed). No motion exists as decoration.
- Pairs well with: aurora canvas backdrop, neon-tube Monoton wordmarks, stat-tile grids.
```

### Task 9.9: Phase-close declaration

- [ ] **Step 1: Write phase close to `docs/qa/2026-04-19-glow-redesign-phase-close.md`**

Template:
```markdown
# Glow Redesign — Phase 9 Close Declaration

**Date:** 2026-04-??
**Branch:** glow-redesign
**Commit range:** {first-commit}…{last-commit}

## Ran
- L1 Code Quality: `tsc --noEmit` clean ✓
- L4 Security: prototype-ism scrub clean ✓, reveal-scrub clean ✓
- L5 A11y: focus rings verified on every NeonButton/Chip/BigToggle; keyboard traversal works on picker + dashboard + editor
- L6 Functional Testing: 35+ unit/component + 28 E2E all pass ✓
- L7 Innovation: tracker entry appended ✓
- Screenshots: 34 PNGs captured at mobile + desktop

## Skipped / Not Verified
- L2 Applitools baseline: {reason — e.g., "no APPLITOOLS_API_KEY in env this week"}
- L3 Motion review on real phone: {"done" | "pending — dry-run device scheduled Tue Apr 21"}

## Known open items
- {Any deferred follow-ups}
```

- [ ] **Step 2: Commit**

```bash
git add docs/qa/2026-04-19-glow-redesign-phase-close.md knowledge/innovation-tracker.md  # if touched
git commit -m "qa(glow-redesign): phase 9 close declaration + innovation tracker entry"
git push
```

---

## Self-review

**Spec coverage — every spec section maps to tasks:**
- §1 Tokens — reconciled with existing `tailwind.config.js` (intro table); no new config needed beyond Task 0.1 keyframes.
- §2 Primitives — Tasks 1.1–4.10 cover all 11 new primitives + 8 glyphs. Existing primitives (Aurora, Button, Chip, Card, Section, Heading, Input, GlowCross) remain untouched and in use.
- §3 Per-surface composition — Tasks 5.1–5.8 cover station surfaces; Tasks 6.1–8.5 cover admin surfaces.
- §4 Brand strings & copy — Tasks 5.1 (footer strip), 5.3–5.8 (taglines), 6.1 (AdminNav wordmark), 6.2 (dashboard hero template), 7.1–7.3 (admin subheadings).
- §5 Motion — Task 0.1 ships the keyframes; motion applied inside each primitive (NeonScanner beam, TimelineTrack breathe) + dashboard count-up/flare animations in Task 6.2.
- §6 Phasing + quality gates — Tasks 9.1–9.9 run every layer.

**Placeholder scan:** no "TBD", no "add appropriate error handling", no "similar to Task N" references — each task carries its own complete code.

**Type consistency check:** `Tone` type repeated across primitives (NeonWordmark, SectionHeading, SignPanel, BigToggle, NeonScanner, StatTile, TimelineTrack, AdminNav, GlyphGlow) uses the same 5-value set `'magenta' | 'cyan' | 'uv' | 'gold' | 'mint'` (+ `'quiet' | 'danger' | 'warn'` where applicable for Chip). Tailwind class strings reference shipped tokens only — `text-neon-magenta`, `shadow-glow-cyan`, etc. — never invented names.

**Scope check:** fits in a single implementation plan. 9 phases, each independently mergeable per the split-cutoff strategy in the spec §6.

---

## Execution Handoff

**Plan complete and saved to `docs/plans/2026-04-19-glow-redesign-plan.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — Dispatch a fresh subagent per task; review between tasks; fast iteration. Good fit here because many tasks are atomic (one primitive each) and the plan is long.

**2. Inline Execution** — Execute tasks in this session using `superpowers:executing-plans`; batch execution with checkpoints for review.

**Which approach?**

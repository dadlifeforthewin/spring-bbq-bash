# Station + Admin Glow Redesign — Design Spec

**Date:** 2026-04-19 (Sunday)
**Event:** Saturday, April 25, 2026 · 5:00–8:00 PM · Lincoln Christian Academy
**Target branch:** `glow-redesign` off `kid-profile-rebuild`
**Reviewer:** Brian Leach

## Why

Parent-facing surfaces (`/`, `/register`, `/register/confirm`) were rebuilt to the Glow Party design system in D10/D11. Volunteer-facing (`/station/*`) and operator-facing (`/admin/*`) surfaces still run the pre-rebuild utility styling. With 6 days to event this pass brings those surfaces to parity — same neon-on-`#0b0118` language, same motion standards, same craft bar — using the design handoff dropped in `docs/design/` on 2026-04-18.

Not a net-new design. We're **porting** the prototype's vocabulary (corner-bolt sign panels, scanner frames, stat tiles, timeline with glowing dots, etc.) onto **our station set and admin IA**, scrubbed of the prototype's placeholder parish branding and the cross-as-decoration motif.

## Scope

### In scope
- **All 7 station screens fully restyled:** `/station` (picker), `/station/check-in`, `/station/check-out`, `/station/activity` (unified endpoint for drinks / jail / prize-wheel / DJ / free-visit), `/station/photo`, `/station/roaming`, `/station/profile`.
- **Admin — full restyle (4 surfaces):** `AdminNav` shell (applied via `app/admin/layout.tsx`), `/admin` (dashboard), `/admin/photos` + `/admin/photos/queue` (moderation), `/admin/stories` + `/admin/stories/[id]` (review + edit).
- **Admin — primitives-only polish (5 surfaces):** `/admin/children`, `/admin/children/[id]`, `/admin/bulk`, `/admin/stations`, `/admin/settings`. Primitive swaps (buttons → `<NeonButton>`, pills → `<NeonChip>`, stats → `<StatTile>`, table headers → `<SectionHeading>`) with no layout rebuild.
- **Shared foundation:** `src/components/glow/` module containing 12 primitive components + 8 station glyph SVGs + `glow-tokens.css`.

### Out of scope (do not touch)
- `/`, `/register`, `/register/edit/[token]`, `/register/confirm` — already at D10/D11 standard.
- `src/emails/StoryEmail.tsx` — already matches the system.
- Backend logic, API routes, database migrations, auth flows, cron wiring, station catalog semantics — this is pure presentation.
- Existing E2E behavior: all 26 specs must continue to pass untouched. They assert behavior, not appearance.

### Cross-cutting rules
- **Cross motif:** retained **only as a placeholder** inside `<NeonScanner>` (camera-loading state) and inside `<AdminPhotos>` tile empty-states. Once real camera feed or real image arrives, the cross is replaced. Cross never appears as a decorative centerpiece.
- **Volunteer landing hero:** reuses the live BASH & GLOW neon-tube wordmark (scaled down) with a `VOLUNTEER HUB` eyebrow. No cross, no new glyph.
- **Working branch:** `glow-redesign` off `kid-profile-rebuild`. Each phase is independently mergeable.

## §1 — Design tokens

Loaded globally at `src/components/glow/glow-tokens.css`, imported once from `app/layout.tsx`. All primitives reference these CSS vars — no hardcoded colors or fonts anywhere.

### Palette (9 tokens)
| Token | Value | Role |
|---|---|---|
| `--neon-1` | `#ff3ec9` | pink — Jail, Photo, Alerts |
| `--neon-2` | `#55d8ff` | cyan — Drinks, Check-in, LIVE |
| `--neon-3` | `#ffd84a` | yellow — Prize Wheel, NOW, warnings |
| `--neon-4` | `#a970ff` | purple — DJ, Roaming, timeline spine |
| `--neon-5` | `#5dffb1` | mint — Check-out, Approved, Done |
| `--bg-deep` | `#0b0118` | page background |
| `--bg-elev` | `#120627` | raised surfaces (cards, sign panels) |
| `--ink` | `#ffffff` | primary text |
| `--ink-dim` | `#9a8dbe` | secondary text, mono metadata |

### Station → tone map
| Station | Tone | Glyph |
|---|---|---|
| Drinks | cyan | `<DrinksGlyph>` |
| Jail / Pass | pink | `<JailGlyph>` |
| Prize Wheel | yellow | `<PrizeWheelGlyph>` |
| DJ Shoutout | purple | `<DJGlyph>` |
| Check-in | cyan | `<CheckInGlyph>` |
| Check-out | mint | `<CheckOutGlyph>` |
| Photo Booth | pink | `<PhotoGlyph>` (polaroid) |
| Roaming | purple | `<RoamingGlyph>` |

### Glow tiers (3 depths)
Applied as `text-shadow` (for type) or `filter: drop-shadow` (for SVG).
- **xs** — `0 0 4px <tone>`. Chips, hint text, inline labels.
- **sm** — `0 0 6px <tone>, 0 0 14px <tone>`. Body accents, toggle nubs, active links.
- **md** — `0 0 6px <tone>, 0 0 14px <tone>, 0 0 28px rgba(<tone>, .6), 0 0 44px rgba(<tone>, .35)`. Hero numerals, sign-panel titles, CTA focus.

### Typography (4 roles)
- **Monoton · neon-tube hero** — `<NeonWordmark>`, scanner-sized numerals. 700 weight, letter-spacing .04em.
- **Unbounded 800 · display + section titles** — `<PageHead>` title, `<SectionHeading>` title, button labels. letter-spacing .01em.
- **JetBrains Mono · metadata / chips / eyebrows** — `<NeonChip>`, mono footers, `<SectionHeading num>`. letter-spacing .12em, uppercase.
- **JetBrains Mono tabular-nums · counters + times** — `<StatTile value>`, timeline times, activity log "2m ago". `font-variant-numeric: tabular-nums`.

### Spacing + radius + stroke
- **Space scale** (Tailwind-aligned): 4, 8, 12, 16, 20, 24, 32px as `--space-1` through `--space-8`.
- **Radius:** card 12px · sign-panel 16px · pill/chip 999px · scanner 14px.
- **Stroke weights:** neon 3px · primary 1.5px · hairline 1px.

## §2 — Primitive inventory

All primitives live at `src/components/glow/`, each as `{Name}.tsx` + `{Name}.module.css`. Barrel export from `src/components/glow/index.ts`.

### Foundational (2)
1. **`<FrameBackdrop soft? verySoft?>`** — aurora radial + perspective grid floor + noise. Renders behind `/station` and `/admin` routes via their respective `layout.tsx`.
2. **`<GlyphGlow tone size>{children}</GlyphGlow>`** — wrapper applying `color: var(--neon-*)` + glow filter stack to any inline SVG. All 8 station glyphs pass through it; so does the retained cross placeholder.

### Layout + navigation (4)
3. **`<AdminNav active>`** — horizontal admin shell. `LCA · BASH OPS` wordmark left · nav links (`Dashboard · Children · Stories · Photos · Stations · Bulk · Settings`) · `<NeonChip tone="mint">LIVE · {onsiteCount} ONSITE</NeonChip>` right-slot that polls `/api/admin/stats`.
4. **`<PageHead back? title sub? right?>`** — back-link + Unbounded title + optional sub + optional right-slot chip or button. Every `/station/*` inner page uses it.
5. **`<SectionHeading num title tone?>`** — `NUM · TITLE · rule` eyebrow band with tone variant (cyan default).
6. **`<SignPanel tone padding?>`** — corner-bolt neon sign card with `.bolt tl/tr/bl/br` pseudo-elements. Used for hero moments (wristband reveal, pickup-code gate, story editor).

### Interactive (4)
7. **`<NeonButton variant tone? size? block? disabled?>`** — CTA with variants:
   - `big-gradient` — pink→cyan horizontal gradient fill, dark inset Unbounded label (the WALK-IN / CLOSE-OUT button).
   - `tone` — single-color filled using `--neon-*`.
   - `ghost` — transparent with tone-colored hairline border + tone text.
   - Sizes: `sm / md / lg / xl`. `block` for full-width.
8. **`<NeonChip tone variant size?>`** — status pill. `variant`: `solid`, `outlined`, `quiet` (ink-dim), `danger` (red tone). Sizes: `sm / md`.
9. **`<BigToggle checked onChange label sub? tone?>`** — tap-sized track (56×30px min) + neon nub. Rendered as `<label>` wrapping visually-hidden `<input type="checkbox">` — a11y-native.
10. **`<NeonScanner aspect tone hint>{children?}</NeonScanner>`** — QR/camera frame: bracket corners + animated beam + hint caption strip. `aspect`: `square` or `portrait`. Children slot for placeholder (`<GlyphGlow>` cross) — real camera feed or photo replaces it.

### Data display (2)
11. **`<StatTile label value tone outline?>`** — big neon numeral stat box. `outline` renders the stacked-lines effect (screenshot 4 style). `tabular-nums`.
12. **`<TimelineTrack items={{time, label, state, tone}[]}>`** — vertical gradient spine + glowing dots per item. `state`: `done` (struck-through, dim) · `now` (breathing pulse, yellow chip) · `next` (outline ring, tone ring).

### Glyph set (8 SVG components)
13. `<DrinksGlyph>` — take-out cup + lid + straw (cyan)
14. `<JailGlyph>` — rounded rectangle with vertical bars (pink)
15. `<PrizeWheelGlyph>` — 6-segment wheel + top pointer (yellow)
16. `<DJGlyph>` — 7 vertical waveform bars of varying height (purple)
17. `<CheckInGlyph>` — QR bracket corners with arrow-in (cyan)
18. `<CheckOutGlyph>` — QR bracket corners with arrow-out (mint)
19. `<PhotoGlyph>` — tilted polaroid + flash-spark (pink)
20. `<RoamingGlyph>` — walker figure + small camera (purple)

Each glyph uses `stroke="currentColor"` so `<GlyphGlow tone>` controls the color at the wrapper level.

## §3 — Per-surface composition

### Station shell (all 7)
`app/station/layout.tsx` wraps every `/station/*` in `<FrameBackdrop verySoft>` + mobile-first safe-area padding + a thin mono footer strip (`NN · {STATION} · {ROUTE}`).

#### 1. `/station` — picker (new build)
- **Hero:** live BASH & GLOW neon-tube wordmark scaled down + `VOLUNTEER HUB` eyebrow + `Tap your station` sub.
- **Body:** 8 station cards in 2-column grid. Each card = `<GlyphGlow tone>` + station glyph + Unbounded name + mono sub (`2 tickets`, `1 spin`, `log visits`, etc.).
- **Footer eyebrow:** `SHIFT · LCA · APR 25 · 5–8PM`.
- **Behavior:** tap → write station slug to `localStorage` → `router.push('/station/<route>')`. Preserves existing slug contract.

#### 2. `/station/check-in` (tone=cyan, glyph=CheckInGlyph)
- `<PageHead back="stations" title="CHECK-IN STATION" sub="Scan a family's QR, or tap Walk-in to register a new kid." right={<NeonChip tone="cyan">LIVE · 217</NeonChip>} />`
- `<NeonScanner aspect="portrait" tone="cyan" hint="Align QR · auto-capture" />` (cross as empty-state placeholder, camera feed replaces)
- Action row: `<NeonButton variant="big-gradient">Walk-in</NeonButton>` · `<NeonButton variant="ghost">Manual lookup</NeonButton>`
- `<SectionHeading num="LOG" title="Recent arrivals" tone="cyan" />` + list: per-party card with family name, party size, time-ago `<NeonChip quiet>`.

#### 3. `/station/check-out` (tone=mint, glyph=CheckOutGlyph)
- Same shell as check-in, mint tone.
- `<NeonScanner>` + on match: `<SignPanel tone="mint">` with pickup-code challenge (4-digit entry) + child/parent identity confirm.
- Manual pickup-override path keeps writing `audit_log` event `manual_pickup_override` (existing behavior preserved).

#### 4. `/station/activity` (tone + glyph vary by `stationType`)
- One URL serving 5 modes: drinks, jail, prize-wheel, DJ, free-visit. Station slug from `localStorage` drives tone + glyph + action copy.
- `<PageHead title={STATION_NAME_UPPER} sub={STATION_TAGLINE} right={<NeonChip tone>{GIVEN_COUNT}</NeonChip>} />`
- Large centered `<GlyphGlow size={140} tone>` station glyph as identity anchor.
- Compact scanner → on successful scan, show kid name + balances as `<NeonChip>` badges + consent/allergy warnings in `<SignPanel tone="yellow">` if flagged.
- Redeem action: `<NeonButton>` variant per station:
  - Drinks: `−1 Drink` (cyan)
  - Jail: `Send to Jail` / `Free from Jail` (pink, pair)
  - Prize Wheel: `−1 Spin` (yellow)
  - DJ: `Record Shoutout` (purple, opens song-pick sheet)
  - Free-visit: `Log Visit` (cyan)
- `<SectionHeading num="LIVE" title="Last 10 redemptions" />` activity log below.

#### 5. `/station/photo` (tone=pink, glyph=PhotoGlyph)
- Same shell as check-in, pink tone.
- `<NeonScanner aspect="portrait" tone="pink" hint="Tap to snap · 3-2-1">` with polaroid placeholder during empty/load.
- Frame-style filter chips row (Neon Cross / BBQ Bash / Glow Halo / No Frame — preserve existing behavior).
- Consent banner: `<NeonChip tone="mint">CONSENT ON · Photos sync to the family's album after the event.</NeonChip>` or `<NeonChip tone="yellow">CONSENT OFF · Text-only receipt. No photos saved.</NeonChip>` driven by `children.photo_consent_granted`.
- `<NeonButton tone="pink" variant="big">Snap!</NeonButton>` · `<NeonButton variant="ghost">Retake last</NeonButton>`.

#### 6. `/station/roaming` (tone=purple, glyph=RoamingGlyph)
- Viewfinder-style `<NeonScanner>` + `PhotoViewfinder` integration + capture upload with `capture_mode=roaming_vision`.
- Post-capture: `<SignPanel tone="purple">` with `Sent to queue. Photos sync after the event.` + last-5 captures thumbnail strip. Polls `/api/admin/photos/status` for match outcome as `<NeonChip>` state (auto / pending_review / unmatched).

#### 7. `/station/profile` — read-only kid lookup (tone = kid's `pref_tone`)
- Scan-to-find (reuse scanner).
- On match: `<SignPanel tone={kid.pref_tone}>` with kid name Unbounded XL + allergy/consent chips. `<StatTile>` grid × 4 for balances (drinks, jail, spins, shoutout). `<TimelineTrack>` of their station visits.

### Admin shell (all pages)
`app/admin/layout.tsx` → `<FrameBackdrop verySoft>` + `<AdminNav active={pathname}>` + `<NeonChip tone="mint">LIVE · {onsiteCount} ONSITE</NeonChip>` right-slot polling.

#### 8. `/admin` — dashboard
- `<PageHead title="Bash is LIVE. Here's the pulse." sub="{DAY} · {MON DD} · {time}" right={<NeonButton variant="ghost">Broadcast</NeonButton>} />` — title adapts by event state (pre / live / post).
- `<StatTile outline>` grid × 4: Checked in · Expected · Kids zone · Photos posted.
- 1.6fr / 1fr columns:
  - Left: `<SignPanel tone="purple"><TimelineTrack items={nightTimeline} /></SignPanel>` — seeded event timeline with state advance.
  - Right stack: `<SignPanel tone="pink">` Alerts · N + `<SignPanel tone="cyan">` Stations · 8 open with per-station tone chips.
- **Fix bundled:** polling interval for stories list is already 5s on dashboard; keep 5s here. The separate `/admin/stories` list gets a new 10s poll while any rows are `pending` (addresses STATUS.md pre-event audit finding).

#### 9. `/admin/photos` + `/admin/photos/queue` — moderation
- `<PageHead title="Photos" sub="PHOTOS · MODERATION" right={<NeonChip mint>APPROVED · 94</NeonChip><NeonChip yellow>QUEUE · 4</NeonChip><NeonChip danger>FLAGGED · 1</NeonChip>} />`
- Filter `<NeonChip>` row: All · Queue · Approved · Flagged · Unmatched.
- 4-column tile grid. Tile = `<div>` wrapping photo `<Image>` (or `<GlyphGlow>` cross placeholder if no image yet) + tone-border matching state + `<NeonChip>` status chip + mono label.
- Tap tile → action sheet: Confirm / Reject / Release-to-guest (consent-off flow).

#### 10. `/admin/stories` + `/admin/stories/[id]` — review + edit (highest-judgment surface)
- **List** (`/admin/stories`):
  - `<PageHead title="Stories" sub="STORIES · REVIEW QUEUE" />` + status filter `<NeonChip>` row.
  - Per-row: kid name Unbounded + `<NeonChip>` score + `<NeonChip>` word-count + `<NeonChip>` photo-count + auto-approved / needs-review badge.
  - **Auto-refresh fix:** poll `/api/admin/stories?status=pending` every 10s while any row is `pending` (closes STATUS.md audit finding).
- **Editor** (`/admin/stories/[id]`):
  - `<SignPanel tone={child.pref_tone}>` with kid name + photo strip (photos that appear in the story).
  - `<SectionHeading num="DRAFT" title="{name}'s keepsake story" />` + editable `<textarea>` with glow focus ring.
  - Auto-check `<NeonChip>` badges: `word-count ✓`, `≥2 stations ✓`, `no banned phrases ✓`, `no timestamps ✓`.
  - `<NeonButton>` row: `Regenerate · Approve · Send back · Skip`.
  - Subtle `<TimelineTrack>` underneath showing the kid's station visits — reviewer can verify the story references real moments.

### Polish-only admin (5 pages)
`/admin/children`, `/admin/children/[id]`, `/admin/bulk`, `/admin/stations`, `/admin/settings`:
- Inherit `<AdminNav>` + `<FrameBackdrop verySoft>` via layout.
- All `<button>` → `<NeonButton>` variants.
- All status pills → `<NeonChip>`.
- Stats (where present) → `<StatTile>`.
- Table header rows → `<SectionHeading>` eyebrow treatment above the table.
- **No layout rebuild, no hero surfaces.**

## §4 — Brand strings & copy

All day-of-week references verified against the real calendar: event = Saturday 2026-04-25 ✓. Today = Sunday 2026-04-19 ✓. No literal day/date strings — all formatted from real timestamps via `Intl.DateTimeFormat`.

### AdminNav wordmark
- **Locked: `LCA · BASH OPS`** — short, utility-coded, doesn't compete with the parent-facing BASH & GLOW neon wordmark.
- Nav link order (by event-night frequency of use): `Dashboard · Children · Stories · Photos · Stations · Bulk · Settings`.
- Right-slot: `<NeonChip tone="mint">LIVE · {onsiteCount} ONSITE</NeonChip>`.

### Dashboard hero (state-driven template)
- **Pre-event** (`now < event.starts_at`): `Bash loading. Final walkthroughs pending.`
- **Event day** (`event.starts_at ≤ now < event.ends_at`): `Bash is LIVE. Here's the pulse.`
- **Post-event** (`now ≥ event.ends_at`): `Bash wrapped. Morning queue ready.`
- Date strip (`<PageHead sub>`): `{DAY} · {MON DD} · {hh:mm}` formatted live — Saturday the 25th will render `SATURDAY · APR 25 · 7:12 PM`.

### Station picker eyebrow
`SHIFT · LCA · APR 25 · 5–8PM` — baked into the copy since it's the single event date for this season.

### Station taglines (all under 80 chars)
| Route | Tagline |
|---|---|
| `/station/check-in` | Scan a family's QR, or tap Walk-in to register a new kid. |
| `/station/check-out` | Scan the wristband and match the 4-digit pickup code. |
| `/station/activity` · drinks | Pour and scan. Two drink tickets per wristband. |
| `/station/activity` · jail | Send a kid to jail (−1) or free them (−1). Same bucket. |
| `/station/activity` · prize-wheel | One spin per wristband. Scan before they pull. |
| `/station/activity` · DJ shoutout | Pick their song, scan, send it to the booth. |
| `/station/activity` · free-visit | Just scan to log the visit. No ticket cost. |
| `/station/photo` | Tap to snap. Consent-off kids get text-only receipts. |
| `/station/roaming` | Shoot freely. We'll sort the matches after the event. |
| `/station/profile` | Scan any wristband to see what the kid has done tonight. |

### Photo consent banner copy (reveal-sensitive)
- On: `CONSENT ON · Photos sync to the family's album after the event.`
- Off: `CONSENT OFF · Text-only receipt. No photos saved.`

### Roaming confirmation
`Sent to queue. Photos sync after the event.`

### Admin photos subheader
`PHOTOS · MODERATION` — drops the prototype's "Bash Wall" concept entirely.

### Stories admin (staff-only copy)
The word `keepsake` appears **only inside `/admin/*`**, never on `/station/*` or any parent-visible surface. Admin copy:
- List subtitle: `STORIES · REVIEW QUEUE`
- Editor section-heading: `DRAFT · {kid.name}'s keepsake story`

### Scrubs enforced at the QA gate
1. No prototype-isms anywhere in `src/`: `Risen & Redeemed`, `Bash Wall`, `Fr. Mike`, `Main Tent`, `Grill`, `Games & Yard`, `Cleanup Crew`, `Kids Zone`, `Bar / Drinks`, `bash.risenandredeemed`.
2. No reveal-leak in station/ paths: `keepsake`, `ai_story`, `AI story`, `AI-generated`.
3. No literal day-of-week strings in JSX — all dates formatted from `events.starts_at` via `Intl.DateTimeFormat`.

## §5 — Motion

### Principle
Utility tools for volunteers working under time pressure. Motion is supportive, never decorative.

### Ambient loops (always-on, ≤1 per page)
| Loop | Duration | Easing | Where |
|---|---|---|---|
| Scanner beam sweep | 1.6s | linear | Scanner-active pages only; pauses on capture |
| `now` timeline dot breathing | 2.4s | ease-in-out | Admin dashboard |
| LIVE chip leading-dot pulse | 1.8s | ease-in-out | All admin pages (right-slot) |

### First-load / route-change
| Motion | Duration | Easing | Notes |
|---|---|---|---|
| Station picker cards | 240ms, 40ms stagger | ease-out cubic | 8px translate-up + opacity |
| Admin stat tiles count-up | 600ms | ease-out quart | `tabular-nums` prevents width shift |
| Sign panel border draw-in | 400ms | ease-out cubic | pseudo-element stroke-dashoffset on mount |

### Interaction feedback
| Element | Motion | Duration |
|---|---|---|
| Button press (all variants) | `translate-y: 1px` + `filter: brightness(1.15)` | 80ms |
| Chip hover (pointer only) | glow blur 22px → 44px | 180ms |
| `<BigToggle>` nub | slide + track fill crossfade | 220ms `cubic-bezier(.2, .8, .2, 1)` |
| Successful scan | bracket-corner pulse scale 1→1.2→1 + glow flash | 320ms total |
| Picker card tap | scale 0.97 → 1.04 → 1 bounce | 300ms total |

### State change
| Trigger | Motion | Duration |
|---|---|---|
| Counter tile increments | number glow flare (opacity 1→1.4→1) + 1.04 scale bounce | 360ms |
| Timeline advance (done→now) | color tween + breathing pulse starts | 400ms + loop |
| Story auto-check badge appears | scale-in 0.6→1 + rotate wiggle | 260ms |

### Rules
- **GPU-composited only:** `transform`, `opacity`, `filter: drop-shadow`. Never animate `box-shadow` (CPU-heavy).
- **`will-change`** applied sparingly and removed after the animation ends.
- ≤6 concurrent animations per frame; ≤1 continuous loop per page.

### `prefers-reduced-motion: reduce`
- All motion collapses to 120ms opacity-only fades.
- Every ambient loop suspended.
- Stat counter tween disabled — numbers appear final.

### Motion review gate (per `_config/motion-review-checklist.md`)
- Chrome DevTools Performance capture on throttled Slow 4G + 6× CPU slowdown on a real phone.
- Target: sustained 60fps during picker stagger + scanner beam + timeline breathing.
- **INP** ≤ 200ms · **CLS** ≤ 0.02 during tile reveals.
- Manual toggle of OS reduced-motion pref on macOS + iOS — confirm all ambient loops stop and reveals collapse to fades.

## §6 — Phasing + quality gates

### Branch discipline
- All work on `glow-redesign` off `kid-profile-rebuild`.
- Each phase is independently mergeable.
- Existing 26 E2E specs must stay green throughout (they assert behavior, not appearance).

### Phases
| # | Phase | Scope | Est | Parallel |
|---|---|---|---|---|
| 0 | Setup | `src/components/glow/` folder · `glow-tokens.css` · font load verification | 30m | — |
| 1 | Foundation primitives | `FrameBackdrop`, `GlyphGlow`, `NeonChip`, `NeonButton`, `SectionHeading`, `PageHead` + unit tests | 2–3h | — |
| 2 | Interactive + data primitives | `SignPanel`, `BigToggle`, `NeonScanner`, `StatTile`, `TimelineTrack`, `AdminNav` + unit tests | 2–3h | **‖ Phase 3** |
| 3 | Glyph set | 8 SVG glyph components | 1–2h | **‖ Phase 2** |
| 4 | Station shell + picker | `app/station/layout.tsx` · `/station` picker redesign | 1h | — |
| 5 | Station inner | check-in, check-out, activity, photo, roaming, profile | 3–4h | Split 3 subagents |
| 6 | Admin shell + dashboard | `app/admin/layout.tsx` · `/admin` rebuild | 2h | — |
| 7 | Admin full-restyle | photos+queue + stories+editor | 2–3h | Split 2 subagents |
| 8 | Admin polish-only | 5 pages (children, child-editor, bulk, catalog, settings) | 1–2h | Split 2 subagents |
| 9 | QA gate | typecheck · full E2E · Applitools baselines · motion review · scrub grep · screenshots | 2h | — |

**Total: 14–20 working hours, compressable to 3–5 calendar days with aggressive subagent dispatch.**

### Merge cutoff strategy (recommended)
- **Before dry-run (Tuesday April 21):** Phases 0–5 merge — volunteers test tablets with new look at the Tuesday walkthrough.
- **Post dry-run, before Saturday (Wed–Fri):** Phases 6–8 merge.
- **If Phases 6–8 slip:** admin stays on current styling for event night. Still a working command center; rebuild becomes post-event polish.

### Per-phase quality gate (`_config/quality-gates.md`)
Every phase close requires:
- **L1 Code Quality:** `tsc --noEmit` clean.
- **L6 Functional Testing:** phase-specific test script with full passing output (primitives get unit tests; screens get Playwright visual smoke).
- **L5 A11y:** focus ring visible on every interactive, WCAG 2.1 AA contrast on every tone, keyboard traversal works, `prefers-reduced-motion` respected.
- **Phase-close declaration:** explicit "Skipped / Not Verified" row listing every layer that didn't run. No silent skips.

### Final gate (after Phase 9)
All 7 layers run:
- **L1 Code Quality:** `tsc --noEmit` clean.
- **L2 Visual Design:** Applitools baselines captured for all restyled routes at mobile (390×844 iPhone 15, 3×) + desktop (1440×900).
- **L3 Motion:** Chrome DevTools 60fps capture on throttled Slow 4G + 6× CPU; reduced-motion pref toggle verified on macOS + iOS.
- **L4 Security:** scrub greps return zero matches.
- **L5 Usability & A11y:** WCAG 2.1 AA audit + keyboard-only walkthrough.
- **L6 Functional Testing:** full Playwright suite (existing 26 + any new visual smoke) passes.
- **L7 Premium Innovation:** `knowledge/innovation-tracker.md` entry added for the scanner-beam + timeline-breathing + counter-up combo.

### Scrub greps (Layer 4 + copy-rules)
```bash
# prototype-isms (zero matches in src/)
grep -rE "Risen ?& ?Redeemed|Bash Wall|Fr\.? Mike|Main Tent|Grill|Games & Yard|Cleanup Crew|Kids Zone|Bar ?/ ?Drinks|bash\.risenandredeemed" src/

# reveal-scrub (zero matches under station/*)
grep -rE "keepsake|ai[_ ]story|AI-generated" src/app/station src/components/station
```

### Screenshot capture (HARD STOP #9)
- **Mobile 390×844 iPhone 15 @ 3×:** all 7 station pages × states (idle, active-scan, success, error, empty).
- **Desktop 1440×900:** all 4 admin full-restyle pages + all 5 admin polish pages.
- **Isolated captures:** focus + hover states for `<NeonButton>`, `<NeonChip>`, `<BigToggle>`.
- All saved under `docs/qa/2026-04-19-glow-redesign-screenshots/`.

## Open items / deferred

- **Innovation slate** (Phase 4 of workflow-rules): the scanner-beam + timeline-breathing + stat-counter-up combo is new enough to submit to `knowledge/innovation-tracker.md` under the Motion category; tracker update is a Phase 9 deliverable.
- **Applitools API key** must be live before Phase 9; if it isn't, L2 explicitly lists "Applitools: no API key" in the Skipped row and Brian takes the gap as a known risk.
- **Admin Broadcast button** in the dashboard right-slot references a feature not yet built — rendered but disabled with a tooltip "Coming post-event" unless Brian wants it wired up this pass.
- **`/station/profile` pref-tone:** uses `children.pref_tone` which is a new column. If that column isn't set up on the existing `kid-profile-rebuild` branch, fall back to `neon-4` purple default — documented as a conditional in Phase 5 task spec.

## Verification checklist

- [ ] `glow-tokens.css` imported exactly once from `app/layout.tsx`; no duplicate imports.
- [ ] All 12 primitives and 8 glyphs export from `src/components/glow/index.ts`.
- [ ] All 8 glyphs use `stroke="currentColor"` (no hardcoded colors).
- [ ] `AdminNav` applied via `app/admin/layout.tsx` — no per-page duplication.
- [ ] `FrameBackdrop` applied via `app/station/layout.tsx` and `app/admin/layout.tsx` — no per-page duplication.
- [ ] Tailwind `input[type=text]` specificity gotcha handled: every CSS Module targeting text inputs uses `input.class-name` chain.
- [ ] Existing 26 E2E specs still pass after every phase.
- [ ] Scrub greps return zero matches.
- [ ] All user-facing copy verified against the calendar (event = Saturday 2026-04-25).
- [ ] Reveal scrub: `keepsake | ai_story | AI-generated` absent from `/station/*` code + rendered output.
- [ ] Motion review run on real phone with Slow 4G + 6× CPU throttle.
- [ ] Applitools baselines captured (or explicitly declared skipped).
- [ ] Screenshots captured at mobile + desktop + interactive states and saved under `docs/qa/`.
- [ ] Innovation tracker entry added.
- [ ] Phase-close declarations honest — `Skipped / Not Verified` row present on every phase.

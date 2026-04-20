# Glow Redesign — STATUS

**Branch:** `glow-redesign` (HEAD `fa9daca`) · **Last update:** 2026-04-20 (midday, Phase 5 shipped, Phase 5.5 queued)
**Event:** Saturday, April 25, 2026 (5 days out) · **Dry-run:** Tuesday April 21 (tomorrow)
**Spec:** `docs/specs/2026-04-19-station-admin-glow-redesign-design.md`
**Plan:** `docs/plans/2026-04-19-glow-redesign-plan.md`
**Phase 5.5 reference (new features):** `docs/design/cleanup-crew-reference.md`
**Not auto-deployed** — Vercel production branch is `kid-profile-rebuild`, not this one.

---

## 🔜 NEXT SESSION — Resume Phase 5.5 (new features: prize_wheel + cleanup crew)

Brian paused here to refresh Claude. On resume:

1. **Read this file first** (you're reading it).
2. **Pull:** `/usr/bin/git pull origin glow-redesign` (expect HEAD at `fa9daca` or later).
3. **Baseline:** `npm run typecheck && npm run test -- --run` — expect clean + 67/67.
4. **Start with Task 5.5.1** — write `docs/plans/2026-04-20-phase-5.5-features-plan.md` (detailed task breakdown with DB schemas, API contracts, UI specs, seed data). This plan document is the durable record of the sub-tasks listed below.
5. **Then execute Tasks 5.5.2 → 5.5.9 sequentially** (features depend on migrations; admin CRUD depends on tables; station pages depend on admin CRUD being usable). Some Phase 5.5 sub-tasks CAN run in parallel worktrees (e.g., prize_wheel migration vs. cleanup migration), but plan them in the addendum first.

### Phase 5.5 task backlog (durable — re-create in session task list on resume)

| # | Task | Depends on |
|---|---|---|
| 5.5.1 | Write Phase 5.5 plan addendum at `docs/plans/2026-04-20-phase-5.5-features-plan.md` — full TDD breakdown w/ DB schemas, API contracts, UI specs, seed data for prize_wheel and cleanup features. References `docs/design/cleanup-crew-reference.md` | — |
| 5.5.2 | Supabase migration: `prizes` table (id, label, sub, sort_order, active, created_at). Seed starter list. Regenerate types. | 5.5.1 |
| 5.5.3 | `/admin/prizes` CRUD page — list + create + edit + deactivate + reorder. Year-over-year reuse. | 5.5.2 |
| 5.5.4 | `/station/prize_wheel` station page — scan wristband → Chip grid of active prizes → tap prize → log redemption. Gold tone. PageHead + NeonScanner. | 5.5.2 |
| 5.5.5 | Supabase migrations: `cleanup_tasks` + `cleanup_completions` + `cleanup_locks` per schema draft in `docs/design/cleanup-crew-reference.md`. Seed 7 example tasks from the reference. | — |
| 5.5.6 | `/admin/cleanup` CRUD page — list + create + edit + reorder + deactivate. | 5.5.5 |
| 5.5.7 | `/station/cleanup` toggles + close-out button per `docs/design/cleanup-crew-reference.md`. Gold tone. N/M DONE chip. CLOSE OUT enabled when remaining=0 → POSTs `cleanup_locks` row. Toggles stay tappable after close-out. | 5.5.5 |
| 5.5.8 | Seed rows into `stations` table: `(slug=cleanup, name=Cleanup Crew)` and `(slug=prize_wheel, name=Prize Wheel)`. Confirm picker renders both tiles with correct tone+glyph via StationPicker's ROUTING map. | 5.5.3, 5.5.4, 5.5.6, 5.5.7 |
| 5.5.9 | Design 8 dedicated SVG glyphs replacing SparkGlyph fallback on cornhole, face_painting, arts_crafts, video_games, dance_competition, pizza, cake_walk, quiet_corner. Phase 4 stroke-based style, 100×100 viewBox, `strokeWidth=3`. Update picker ROUTING map. | — (can parallel with anything) |

### Locked decisions from 2026-04-20 session (do NOT re-ask)

- **Prize wheel mechanics:** spun at check-in; this is a logging-only volunteer flow (scan → pick prize → log).
- **Prize list:** admin CRUD (year-over-year reuse), NOT hardcoded.
- **Cleanup tone:** **gold** (shares with prize_wheel — never colocated on same page).
- **Cleanup close-out:** `cleanup_locks` row POSTed when all items done; individual item toggles stay tappable after close-out (for early-cleanup volunteers who miscounted).
- **Cleanup admin:** full CRUD — tasks are year-over-year reusable.
- **Reloads:** deprecated. No re-upping tickets. Hard caps: 2 drinks + 3 jail tickets per kid.
- **Picker:** DB-driven. ROUTING map in `src/components/station/StationPicker.tsx` already has fallback for unknown slugs; 5.5.8 needs to extend it with explicit entries for `cleanup` and `prize_wheel` once new DB rows exist.

### What NOT to touch

- Phase 6–8 (admin shell, dashboard, photos queue, stories, bulk, catalog, settings) is post-Phase-5.5 work. Stay scoped.

## Why this branch exists

Parent-facing surfaces (`/`, `/register`, `/register/confirm`) are already at D10/D11 Glow Party standard. `/station/*` (7 pages) and `/admin/*` (9 pages) still run pre-rebuild utility styling. This branch brings them to parity using the design handoff in `docs/design/` — minus the cross-as-decoration motif (cross stays only as a photo-tile placeholder per Brian's 2026-04-19 call) and minus the prototype's parish-church branding (adapted to LCA).

## Shipped so far (11 commits on `glow-redesign`, pushed)

**Foundation complete. 20 new primitives + 8 station glyphs. 24/24 component tests green. Typecheck clean. All reviewed spec ✅ + quality ✅. Brian visually approved the showcase page on 2026-04-20.**

| Phase | Commit | Scope |
|---|---|---|
| 0 | `5547147` | Tailwind keyframes (beam-sweep, breathe, count-up-glow, draw-border, corner-pulse) |
| 4 | `1e9aee1` + `24cc756` | `<GlyphGlow>` + 8 station glyphs: drinks, jail, prize-wheel, DJ, check-in, check-out, photo (polaroid + flash-spark), roaming |
| 1 | `9821121` + `4603bd8` | `<GridFloor>`, `<NeonWordmark>` (Monoton hero), `<SectionHeading>` (NUM·TITLE·rule), `<PageHead>` |
| 2 | `08ec79d` | `<SignPanel>` (corner-bolt sign), `<BigToggle>`, `<NeonScanner>` (bracket corners + beam + hint) |
| 3 | `f2a8fcf` | `<StatTile>`, `<TimelineTrack>`, `<AdminNav>` |
| dev | `be92fa5` | `/dev/glow` showcase route (remove before prod merge) |

**Key decisions locked:**
- Token reconciliation: use existing shipped Tailwind names (`neon-magenta/cyan/uv/gold/mint`, `ink/paper/mist`, `shadow-glow-*`) — NOT the `--neon-1..5` CSS-vars the spec initially proposed.
- Station → tone map: drinks=cyan · jail=magenta · prize-wheel=gold · DJ=uv · check-in=cyan · check-out=mint · photo=magenta · roaming=uv.
- AdminNav wordmark: `LCA · BASH OPS`.
- Nav link order: Dashboard · Children · Stories · Photos · Stations · Bulk · Settings.
- Cross retained ONLY as camera-loading / photo-tile empty-state placeholder.
- Volunteer landing hero reuses the live BASH & GLOW wordmark (no new centerpiece).

## Phase 5 — SHIPPED 2026-04-20

9 tasks across 13 commits. Picker + 6 station pages migrated to glow primitives; legacy StationShell + ReloadStation + /station/reload route deleted. 67/67 unit tests green; typecheck clean.

| Task | Commit | Scope |
|---|---|---|
| 5.1 | `01a003e` | app/station/layout.tsx (Aurora+GridFloor+mono footer) + strip Aurora from StationShell & VolunteerLogin + `safe-bottom` utility |
| 5.2 | `996322b` | StationPicker: NeonWordmark hero, DB-driven 16-slug GlyphGlow grid, SparkGlyph fallback, SignPanel quick-ref, empty-state handling |
| 5.3–5.8 | `1258837`→`49f5f1e` | 6 station components rebuilt in parallel worktrees (CheckIn/CheckOut/Activity/Photo/Roaming/Lookup) |
| fix | `a1570f8` | LookupStation: visible QR form + 5 profile sections restored + double-scanner race fixed; PhotoStation: cameraReady wired + viewfinder clip fix + Chip keyboard a11y; CheckOut subtitle copy |
| 5.9 | `c7f0c2b` | Delete ReloadStation, /station/reload, reload.spec.ts, StationShell |

**Remaining surfaces on `glow-redesign` from original plan:**

| Phase | Scope | Risk |
|---|---|---|
| 5.5 (new — not in original plan) | prize_wheel station + cleanup crew station + admin CRUD for both. Reference: `docs/design/cleanup-crew-reference.md`. 8 sub-tasks tracked. | Medium — new DB tables + migrations |
| 6 | Admin shell layout + dashboard | Medium |
| 7 | Admin photos-queue + stories list + stories editor | Medium |
| 8 | Admin polish-only (children list, child editor, bulk, catalog, settings) | Low — primitive swaps |
| 9 | QA gate (typecheck, full E2E, Applitools, motion review, scrub greps, screenshots) | — |

**Merge strategy:** Phase 5 shipped before Tuesday dry-run ✓. Phase 5.5 features (prize_wheel + cleanup) targeted for Wed–Thu, post-dry-run. Admin Phases 6–8 remain post-dry-run; if they slip, admin stays on current styling for event night (still a working command center).

## How to resume

1. Read this file (<60 lines).
2. `/clear` if needed.
3. Read `docs/specs/2026-04-19-station-admin-glow-redesign-design.md` for design decisions.
4. Read `docs/plans/2026-04-19-glow-redesign-plan.md` starting at Phase 5 for task-by-task TDD steps.
5. Branch is already checked out and pushed; run `git pull origin glow-redesign` to confirm HEAD at `be92fa5`.
6. `npm run typecheck && npm run test -- --run` should pass before touching anything.
7. Dispatch per `superpowers:subagent-driven-development` flow: one implementer per task, spec-reviewer, code-quality-reviewer, proceed.

## Pre-event critical path (not blocked by this branch — lives on `kid-profile-rebuild`)

Per the kid-profile-rebuild STATUS: Resend went live last night (2026-04-19), so email delivery is unblocked. Still open: full manual dry-run on a real phone (deadline Tuesday April 21), volunteer device setup, wristband printing. The glow-redesign work is deliberately not on the critical path — it ships visual polish, not functionality.

## Parked / known

- `/dev/glow` route needs to be removed (or admin-gated) before merging `glow-redesign` into anything auto-deployed.
- Phase 5 Task 5.2 (StationPicker rebuild) uses `localStorage` key `sbbq_station_slug` — confirm against the existing picker's key name before writing (plan notes this as a contract to preserve).
- Applitools API key status unknown — Phase 9 Task 9.6 either captures baselines or declares "skipped" honestly.

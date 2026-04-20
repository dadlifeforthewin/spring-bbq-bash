# Glow Redesign — STATUS

**Branch:** `glow-redesign` (HEAD `3973796`) · **Last update:** 2026-04-20 (evening, Phase 5.5 shipped + simplified cleanup + merge-ready)
**Event:** Saturday, April 25, 2026 (5 days out) · **Dry-run:** Tuesday April 21 (tomorrow)
**Spec:** `docs/specs/2026-04-19-station-admin-glow-redesign-design.md`
**Plan:** `docs/plans/2026-04-19-glow-redesign-plan.md`
**Phase 5.5 plan addendum:** `docs/plans/2026-04-20-phase-5.5-features-plan.md`
**Phase 5.5 reference (new features):** `docs/design/cleanup-crew-reference.md`
**Not auto-deployed** — Vercel production branch is `kid-profile-rebuild`, not this one.

---

## 🔜 NEXT SESSION — Deploy + merge

Phase 5.5 implementation + visual QA complete. Brian approved all 8 reviewed screenshots (6 prize_wheel + 2 simplified cleanup) on 2026-04-20 evening. Cleanup was **simplified post-review** to a toggle-only checklist (no lock mechanism) — see memory + STATUS §Phase 5.5 row 5.5.7.

1. **Read this file first** (you're reading it).
2. **Pull:** `/usr/bin/git pull origin glow-redesign` (expect HEAD `62dcb65` or later).
3. **Baseline:** `npm run typecheck && npm run test -- --run` — expect clean + 115/115.
4. **Apply migrations to remote:** `supabase db push` to land 0010_prizes → 0011_cleanup → 0012_stations_seed_phase_5_5 → 0013_rls_phase_5_5 (in order, idempotent).
5. **Populate `/admin/prizes`** pre-event — table ships empty; station shows admin hint if unpopulated.
6. **Remove `/dev/glow` showcase route** before merging into any auto-deployed branch.
7. **Merge to `kid-profile-rebuild`** after the above three.

No more cleanup-crew work pending — Brian's decision to strip the lock mechanism stands; do NOT re-propose it.

## Phase 5.5 — SHIPPED 2026-04-20 ✅

| Task | Commit | Scope |
|---|---|---|
| 5.5.1 | `e3dd999` | Plan addendum + cleanup-crew-reference doc |
| 5.5.2 | `7a79477` | Migration `0010_prizes.sql` + `Prize`/`PrizeRedemption` types |
| 5.5.5 | `5e9a9f3` → `5029ef5` | Migrations `0011_cleanup.sql` (cleanup_tasks/completions/locks) + Station type + 7 seed tasks + FK cascade→restrict fix |
| 5.5.9 | `a16169e` | 9 new SVG glyphs (cornhole, face_painting, arts_crafts, video_games, dance_competition, pizza, cake_walk, quiet_corner, cleanup) + barrel resorted |
| 5.5.3 | `dae2d46` | `/admin/prizes` CRUD page + API routes (GET/POST + PATCH/DELETE soft-delete) |
| 5.5.4 | `609059b` → `06ea742` | `/station/prize_wheel` state-machine page (8 states, 2s affirmation, rescan [Change]) + `prize-wheel/{prizes,lookup,redeem}` endpoints + story-generator `prize_won` extension + UPSERT race fix |
| 5.5.6 | `ee4623b` | `/admin/cleanup` CRUD page + API routes (mirror of prizes) |
| 5.5.7 | `0011dbc` → `108e073` → `bb8940b` → `3973796` | `/station/cleanup` — initial toggle list + close-out flow → banner move → layout clearance fix → **simplified to toggle-only (lock mechanism removed per Brian's decision — simple is better)**. `cleanup_locks` table remains in schema as dead storage (harmless); `/api/stations/cleanup/lock` endpoint deleted. PageHead subtitle: "Check items as you finish. Toggle off if something was marked by mistake." |
| 5.5.8 | `13d4c92` | Migration `0012_stations_seed_phase_5_5.sql` + StationPicker ROUTING (prize_wheel→/station/prize_wheel, +cleanup entry, 8 slugs use dedicated glyphs, SparkGlyph stays as FALLBACK) + AdminShell nav links (Catalog, Prizes, Cleanup) |
| 5.5.10 | `cf10895` | Final-review cleanup: `0013_rls_phase_5_5.sql` (RLS enabled on all 5 Phase 5.5 tables, service-role only per 0003 pattern) + dead prize_wheel branch deleted from `/api/stations/activity/route.ts` |

**Tests:** 67/67 → 115/115 (+48 net after lock-test removal; earlier peak 118). Typecheck clean. Every task received spec-compliance + code-quality review via `superpowers:subagent-driven-development`; final cross-task review confirmed merge-readiness. Controller self-reviewed all visual output before Brian handoff (per `feedback_self_review_before_presenting.md`).

**Visual inspection captured** (at 375×812 mobile viewport — `fullPage: false` for honest phone UX) saved to `/tmp`:
- `/tmp/prize-wheel-{1..6}-*.png` — 6 states (scanner idle, chip grid, affirmation, already-redeemed, update-mode w/ CURRENT marker, empty-catalog). Brian-approved.
- `/tmp/cleanup-v4-1-some-done-top.png` and `/tmp/cleanup-v4-2-all-done-bottom.png` — simplified 2-state flow after lock removal. Brian-approved.
- StationPicker + AdminShell not screen-captured (volunteer password gate + env-safety rule; coverage via component tests)

## Deploy / operational notes

- **Remote Supabase needs 4 new migrations applied** in order: 0010, 0011, 0012, 0013. All idempotent (ON CONFLICT) or additive. Run `supabase db push`.
- **No new env vars.** All routes use existing `isAdminAuthed()` / `isVolunteerAuthed()` cookies.
- **Prize catalog is empty on fresh DB.** Brian populates via `/admin/prizes` pre-event so the chip grid has entries; station page has an `empty_catalog` state with admin hint if anyone opens it before prizes are seeded.
- **Cleanup tasks have 7 seed rows** (0011 migration). Admin can edit pre-event.
- **Admin nav link for Catalog** was added as a bonus backfill (pre-existing gap — CatalogEditor was reachable only by direct URL before 5.5.8).

## Phase 5.5 follow-ups routed to later phases (not blocking merge)

- Response-shape consolidation (`{ prize }` vs `{ task }`) — refactor opportunity when a 3rd CRUD pattern lands
- Generic `CatalogEditor<T>` to dedupe PrizesEditor + CleanupEditor scaffolding (~150 LOC reclaim)
- Component-test assertions are mock-call-heavy; shift to observable-behavior assertions
- Weak glyph-identity test in StationPicker (asserts svg exists, not glyph identity) — add `data-glyph` attributes when convenient
- CleanupStation doesn't apply server's canonical `remaining` on toggle response — noted but acceptable at volunteer-count traffic
- `prize_wheel` route uses underscore instead of kebab-case (inconsistent with `/station/check-in` convention); matches DB slug so rename ripples if changed

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
| 6 | Admin shell layout + dashboard | Medium |
| 7 | Admin photos-queue + stories list + stories editor | Medium |
| 8 | Admin polish-only (children list, child editor, bulk, catalog, settings) | Low — primitive swaps |
| 9 | QA gate (typecheck, full E2E, Applitools, motion review, scrub greps, screenshots) | — |

**Merge strategy:** Phase 5 shipped before Tuesday dry-run ✓. Phase 5.5 shipped same day, merge-ready pending Brian's walk-through + migration apply ✓. Admin Phases 6–8 remain post-dry-run; if they slip, admin stays on current styling for event night (still a working command center).

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

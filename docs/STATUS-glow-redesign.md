# Glow Redesign — STATUS

**Branch:** `glow-redesign` (off `kid-profile-rebuild`) · **Last update:** 2026-04-20
**Event:** Saturday, April 25, 2026 (5 days out)
**Spec:** `docs/specs/2026-04-19-station-admin-glow-redesign-design.md`
**Plan:** `docs/plans/2026-04-19-glow-redesign-plan.md`
**Not auto-deployed** — Vercel production branch is `kid-profile-rebuild`, not this one.

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

## Remaining phases (Phase 5–9 of the plan)

| Phase | Scope | Risk |
|---|---|---|
| 5 | Station shell + picker + 6 inner pages (check-in, check-out, activity, photo, roaming, profile) | **High** — rewrites live files, E2E must stay green |
| 6 | Admin shell layout + dashboard | Medium |
| 7 | Admin photos-queue + stories list + stories editor | Medium |
| 8 | Admin polish-only (children list, child editor, bulk, catalog, settings) | Low — primitive swaps, no layout rebuild |
| 9 | QA gate (typecheck, full E2E, Applitools, motion review, scrub greps, screenshots) | — |

**Merge strategy:** split cutoff around Tuesday April 21 dry-run. Phases 5 before; Phases 6–8 after. If 6–8 slip, admin stays on current styling for event night (still a working command center).

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

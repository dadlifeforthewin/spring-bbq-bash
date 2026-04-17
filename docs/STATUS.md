# Kid Profile Rebuild — STATUS

**Branch:** `kid-profile-rebuild` · **Last update:** 2026-04-17
**Plan:** `docs/plans/2026-04-16-kid-profile-rebuild-plan.md` · **Spec:** `docs/specs/2026-04-16-kid-profile-rebuild-design.md`

## Progress

- **Phase 0 — Foundation:** ✅ complete
- **Phase 1 — Schema Migration:** ✅ complete (7/7)
- **Phase 2 — Parent Registration Flow:** ✅ complete (12/12)
- **Phase 3 — Event-Night Volunteer Screens:** ✅ complete (9/9)
  - ✅ 3.1 ConsentBanner + AllergiesBanner + ChildCard shared display components
  - ✅ 3.2 Volunteer auth API + login + StationPicker
  - ✅ 3.3 Check-in (scan → card → mugshot → dropoff → submit)
  - ✅ 3.4 Check-out with pickup validation + `audit_log` (checkout + manual_pickup_override)
  - ✅ 3.5 Photo station + `PhotoViewfinder` + `/api/photos/upload` + check-in mugshot integration (Storage bucket `photos` provisioned in 0000_storage_setup.sql)
  - ✅ 3.6 Spend station + `/api/catalog` GET + `/api/spend` POST
  - ✅ 3.7 Reload station + `/api/reload` GET/POST with FACTS allowance guard
  - ✅ 3.8 Profile lookup (`/api/children/by-qr/[qr]/timeline` + read-only page)
  - 🟡 3.9 Gate: typecheck clean · 35/35 unit+component · **16/16 E2E** (registration, walkup, edit, volunteer login, check-in+mugshot, check-out, spend, reload, photo upload — all happy + negative paths). Applitools + motion review still not run.
- **Phase 4 — Admin Screens:** ✅ substantially complete (7/7 built; realtime + zip deferred)
  - ✅ 4.1 Admin auth (`src/lib/admin-auth.ts`, scope `admin`, 12h) + `/api/auth/admin` + `/api/admin/stats` + polling dashboard (5s interval, realtime deferred)
  - ✅ 4.2 Children list (`/admin/children`) with search/status/allergies/consent filters + detail editor (`/admin/children/[id]`) with full child + guardians + pickup CRUD and `consent_change` audit
  - ✅ 4.3 Bulk set-initial-balance (`/admin/bulk`) + `/api/bulk/set-initial-balance` (writes comp `reload_events` per child + audit log)
  - ✅ 4.4 Catalog editor (`/admin/stations`) + `/api/admin/catalog` CRUD (realtime broadcast deferred; station pages re-fetch on next load)
  - ✅ 4.5 Photo gallery (`/admin/photos`) with signed URLs + untag/delete; **bulk-ZIP download deferred**
  - ✅ 4.6 Settings (`/admin/settings`) + `/api/admin/settings` — event times, default tickets, faith tone, email branding, AI prompt template
  - 🟡 4.7 Gate: typecheck clean · 35/35 unit+component · **22/22 E2E** (6 new admin specs cover login, dashboard stats, child edit, bulk, catalog CRUD, settings round-trip). Applitools baselines not run.
- **Phase 5 — AI Story Pipeline:** ✅ complete (8/8)
  - ✅ 5.1 `src/lib/claude.ts` — lazy Anthropic client + `HAIKU_MODEL = claude-haiku-4-5-20251001`
  - ✅ 5.2 `0005_seed_gold_standard.sql` — v6 gold standard + prompt template seeded into `events`
  - ✅ 5.3 `src/lib/story-generator.ts` — builds payload (timeline, favorite station, dropoff, photo meta), calls Haiku, formats body + stats line. Unit tests cover stats/favorite math + Claude call shape.
  - ✅ 5.4 `src/lib/auto-check.ts` — 6-rule scoring (word-count ±30%, opening mentions child, ≥2 timeline stations, ≥2 stations in closer, banned phrases, no timestamps). Unit tests cover pass + 3 failure modes.
  - ✅ 5.5 `POST /api/stories/generate` — authed as admin OR volunteer; writes `ai_stories` with `auto_approved` or `needs_review`.
  - ✅ 5.6 `/api/checkout` fires `POST /api/stories/generate` in background (cookie forwarded, not awaited).
  - ✅ 5.7 `/admin/stories` list (status filter + score) + `/admin/stories/[id]` editor (text edit, regenerate, approve / send-back / skip).
  - ✅ 5.8 Gate: `tests/e2e/stories.spec.ts` runs the full pipeline against real Claude — register → admin bulk balance → check-in → 5 spends across 4 stations → checkout → generate → asserts `auto_approved|needs_review` + no timestamps + child name present + ≥2 timeline stations mentioned. **23/23 E2E now green** (auto-skips when `ANTHROPIC_API_KEY` is missing).
- **Phase 6–7:** not started

## Phase 5 follow-ups (deferred)

1. **Supabase Edge Function polling** — the plan contemplates an Edge Function polling `ai_stories.status = 'pending'`. Current pipeline fires from `/api/checkout` as a background `fetch`; simpler and works in dev. Add a cron fallback if the deploy target kills in-flight fetches.
2. **Banned-phrase / threshold tuning from `/admin/settings`** — both are module-level defaults. Wire them through the events row so the admin can edit without a redeploy.
3. **Photo vision summaries** — `payload.photos_meta[].vision_summary` is always null (Phase 6 fills it). Story quality jumps when vision descriptions flow in.
4. **Cost / latency telemetry** — record Claude response times + token counts per row.
5. **E2E cost** — `stories.spec.ts` hits real Claude (~$0.002 per run). Auto-skips without `ANTHROPIC_API_KEY`. CI should mock Claude or budget for it.

## Environment setup (done — don't redo)

- **Port pinned to 3050** (avoids A2D :3000 / A&E Cafe :3100 collision)
- **Supabase CLI linked** to project `jujobpieydbyfsfhycsp` (LCA Spring BBQ) — `supabase db push` applies migrations
- **`.env.local`** populated: Supabase URL + anon + service_role + `MAGIC_LINK_SECRET` + `SESSION_COOKIE_SECRET` + `VOLUNTEER_PASSWORD` + `ADMIN_PASSWORD` + `ANTHROPIC_API_KEY`. Still empty (fill when needed): `RESEND_API_KEY`, `EMAIL_FROM`.
- **Playwright loads `.env.local`** into the test process via `loadEnv` in `playwright.config.ts`, same way `vitest.config.ts` does.
- **Vitest** loads env via `loadEnv('', cwd, '')` from `vite` in `vitest.config.ts`
- **Playwright** runs workers=1 locally (CI uses 2 workers + 1 retry). Next.js dev-server races when multiple RSC pages compile in parallel; serial is stable.

## Deviations from the plan (keep in mind)

1. **`supabase.ts`** — `supabase` const is a `browserClient()` factory. `supabaseAdmin()` → `serverClient()`.
2. **`0001_drop_legacy.sql`** — removed invalid `drop file if exists public.schema_v1_sentinel;` (typo in plan).
3. **`api/register/route.ts`** — cast changed to `parsed.data as unknown as { qr_code: string }` for TS. Unused `writeAudit` import omitted.
4. **Page + RegistrationForm split** — Next.js 14 rejects custom page props, so the form lives in `src/components/registration/RegistrationForm.tsx`; `/register/page.tsx` and `/register/walkup/[qrCode]/page.tsx` render it.
5. **E2E selectors (Task 2.8)** — aria-labels tuned to match plan's Playwright regexes (see commit 297b67b).
6. **Edit page** — `export const dynamic = 'force-dynamic'` + try/catch around `verifyToken` + `serverClient` so a stale token or HMR hiccup shows the "expired link" state instead of the Next.js error overlay.
7. **Phase 3 volunteer auth** — new file `src/lib/volunteer-auth.ts` using `magic-link` helpers with scope `volunteer` (8h). Old `src/lib/auth.ts` (`ADMIN_PASSWORD`/`sbbq_auth`) is unchanged; new endpoints all use the volunteer cookie.
8. **StationPicker routing** — `check_in` → `/station/check-in`, `check_out` → `/station/check-out`, `jail` → `/station/photo` (when built), everything else → `/station/spend`.
9. **Playwright parallelism** — `workers: 1` locally in `playwright.config.ts`; remove if HMR races ever disappear.
10. **Check-out story kickoff** — plan calls for POST `/api/stories/generate` from `/api/checkout`; left as `// TODO(plan Phase 5)`.

## Phase 2 follow-ups (deferred)

1. Replace placeholder waiver copy in `src/components/registration/WaiverSection.tsx` (marked `TODO(plan Phase 2)`) with the real LCA paper-slip text.
2. Phase 7 will wire `buildReceiptPdf` into `/api/register` — generate PDF, upload to Supabase Storage `receipts/<child_id>.pdf` with a 90-day signed URL, attach to the Resend email.
3. Consent editing is not exposed via `/register/edit/[token]` (`registrationEditSchema` omits photo consent fields).
4. Manual smoke + Applitools baseline for `/register` — not run this session.

## Phase 4 follow-ups (deferred)

1. **Realtime dashboard** — currently polls `/api/admin/stats` every 5s. Supabase Realtime subscription on `children`, `station_events`, `reload_events`, `ai_stories` would update counters instantly.
2. **Catalog realtime broadcast** — admin edits currently require station pages to refresh. A Supabase Realtime channel on `catalog_items` would live-update station devices (plan 4.4).
3. **Bulk photo ZIP download** — plan 4.5 Step: server-side ZIP stream of signed URLs. Not built.
4. **Quick-actions on child detail** — "Add tickets" shortcut (comp reload), "Print replacement wristband", "Resend registration email", "Trigger AI story preview" — skeletons only; wire each as Phase 5/6/7 builds out the pipelines.
5. **Pre-existing admin pages** — `src/app/admin/catalog`, `src/app/admin/tickets`, `src/app/admin/wristbands` from the old build still exist and are accessible. They use the legacy `ADMIN_PASSWORD`/`sbbq_auth` cookie flow (different from the new `sbbq_admin` cookie). Decide: port them, delete them, or leave them behind their own gate. Not breaking anything as-is.
6. **Applitools baselines** for admin dashboard, children list, child editor, bulk page, catalog editor, photo gallery, settings — not run.

## Phase 3 follow-ups (deferred)

1. **Vibe tags on spend events** — plan 3.6 Step 5 mentions a one-tap vibe-tag row after spend; not built.
2. **Catalog realtime** — plan 3.6 mentions Supabase Realtime subscription for live catalog edits; currently `/api/catalog` is a one-shot fetch.
3. **Profile lookup E2E spec** — low priority; route is read-only and already exercised indirectly by every other spec via `/api/children/by-qr`.
4. **Applitools baseline** for every station screen (per `_config/visual-review-protocol.md`) and Chrome DevTools motion review (per `_config/motion-review-checklist.md`) — not run.
5. **Story kickoff from check-out** — plan 3.4 calls for POST `/api/stories/generate` from `/api/checkout`; left as `// TODO(plan Phase 5)`.

## How to resume

1. Read this file.
2. **To finish Phase 3 properly:** set `VOLUNTEER_PASSWORD` in `.env.local`, run `npm run test:e2e`, then decide whether to build the photo station (3.5) before moving on.
3. **To jump to Phase 4 (Admin Screens):** open the plan, search `### Task 4.1`.
4. Run `git status` from `/Users/brianleach/projects/spring_bbq/spring-bbq-bash` to confirm clean state before starting.
5. Per-task pattern: failing test → implement → tests pass → typecheck → commit + push → update this file.

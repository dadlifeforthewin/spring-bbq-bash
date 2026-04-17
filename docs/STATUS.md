# Kid Profile Rebuild — STATUS

**Branch:** `kid-profile-rebuild` · **Last update:** 2026-04-17
**Plan:** `docs/plans/2026-04-16-kid-profile-rebuild-plan.md` · **Spec:** `docs/specs/2026-04-16-kid-profile-rebuild-design.md`

## Progress

- **Phase 0 — Foundation:** ✅ complete
- **Phase 1 — Schema Migration:** ✅ complete (7/7)
- **Phase 2 — Parent Registration Flow:** ✅ complete (12/12)
- **Phase 3 — Event-Night Volunteer Screens:** substantially complete (7 of 9 tasks, camera/photo deferred)
  - ✅ 3.1 ConsentBanner + AllergiesBanner + ChildCard shared display components
  - ✅ 3.2 Volunteer auth API + login + StationPicker (happy-path E2E auto-skips until `VOLUNTEER_PASSWORD` env set)
  - ✅ 3.3 Check-in core (scan → card → dropoff → submit) — **mugshot + photo upload deferred**
  - ✅ 3.4 Check-out with pickup validation + `audit_log` (checkout + manual_pickup_override)
  - ⬜ 3.5 Photo station (camera + Storage upload) — **deferred** (needs Supabase Storage bucket + mediaDevices handling)
  - ✅ 3.6 Spend station + `/api/catalog` GET + `/api/spend` POST with balance guard
  - ✅ 3.7 Reload station + `/api/reload` GET/POST with FACTS allowance guard
  - ✅ 3.8 Profile lookup (`/api/children/by-qr/[qr]/timeline` + read-only page)
  - 🟡 3.9 Gate: typecheck clean · 33/33 unit+component · **13/13 E2E** (check-in + check-out + spend + reload happy and negative paths). Applitools + motion review still not run this session.
- **Phase 4–7:** not started

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

## Phase 3 follow-ups (deferred)

1. **Task 3.5 Photo station + mugshot capture** — needs a Supabase Storage bucket (`photos`), `PhotoViewfinder` component (getUserMedia + canvas), and `POST /api/photos/upload` (multipart + signed upload + `photos` + `photo_tags` + `station_events` rows). Wires back into check-in (mugshot before Check In) and the roaming photo station.
2. **Vibe tags on spend events** — plan 3.6 Step 5 mentions a one-tap vibe-tag row after spend; not built.
3. **Catalog realtime** — plan 3.6 mentions Supabase Realtime subscription for live catalog edits; currently `/api/catalog` is a one-shot fetch.
4. **E2E coverage** — check-in, check-out, spend, reload specs all green (happy + negative paths). Profile lookup does not have a dedicated spec yet (low priority, it's read-only and would duplicate the by-qr route coverage already exercised by every other spec).
5. **Applitools baseline** for every station screen (per `_config/visual-review-protocol.md`) and Chrome DevTools motion review (per `_config/motion-review-checklist.md`) — not run.

## How to resume

1. Read this file.
2. **To finish Phase 3 properly:** set `VOLUNTEER_PASSWORD` in `.env.local`, run `npm run test:e2e`, then decide whether to build the photo station (3.5) before moving on.
3. **To jump to Phase 4 (Admin Screens):** open the plan, search `### Task 4.1`.
4. Run `git status` from `/Users/brianleach/projects/spring_bbq/spring-bbq-bash` to confirm clean state before starting.
5. Per-task pattern: failing test → implement → tests pass → typecheck → commit + push → update this file.

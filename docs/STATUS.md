# Kid Profile Rebuild — STATUS

**Branch:** `kid-profile-rebuild` · **Last update:** 2026-04-16
**Plan:** `docs/plans/2026-04-16-kid-profile-rebuild-plan.md` · **Spec:** `docs/specs/2026-04-16-kid-profile-rebuild-design.md`

## Progress

- **Phase 0 — Foundation:** ✅ complete
- **Phase 1 — Schema Migration:** ✅ complete (all 7 tasks)
- **Phase 2 — Parent Registration Flow:** ✅ complete (12 of 12)
  - ✅ 2.1 Zod validators + unit tests
  - ✅ 2.2 Magic-link token helpers
  - ✅ 2.3 Registration POST API
  - ✅ 2.4 ParentSection component
  - ✅ 2.5 PickupList component
  - ✅ 2.6 ChildBlock + WaiverSection + PhotoConsentSection
  - ✅ 2.7 /register page assembly + /register/confirm
  - ✅ 2.8 E2E happy path
  - ✅ 2.9 Magic-link edit API + /register/edit/[token] page
  - ✅ 2.10 Walk-up flow (/register/walkup/[qrCode])
  - ✅ 2.11 Registration receipt PDF builder (Storage upload deferred to Phase 7)
  - ✅ 2.12 Gate: typecheck clean · 24/24 unit+component · 4/4 E2E
- **Phase 3 — Event-Night Volunteer Screens:** not started (next)
- **Phase 4–7:** not started

## Environment setup (done — don't redo)

- **Port pinned to 3050** (avoids collision with A2D :3000 and A&E Cafe :3100)
- **Supabase CLI linked** to project `jujobpieydbyfsfhycsp` (LCA Spring BBQ) — use `supabase db push` to apply migrations
- **`.env.local`** populated with Supabase URL + anon + service_role keys; secrets for MAGIC_LINK_SECRET and SESSION_COOKIE_SECRET generated. ANTHROPIC_API_KEY, RESEND_API_KEY, EMAIL_FROM still empty (fill before Phase 5 / Phase 7)
- **Vitest loads env** via `loadEnv('', cwd, '')` from `vite` in `vitest.config.ts`

## Deviations from the plan (keep in mind)

1. **`supabase.ts`** — `supabase` const is a `browserClient()` factory (plan's const crashes at import when .env missing). Also `supabaseAdmin()` renamed to `serverClient()` per plan.
2. **`0001_drop_legacy.sql`** — removed the invalid `drop file if exists public.schema_v1_sentinel;` line (typo in plan).
3. **`api/register/route.ts`** — cast changed to `parsed.data as unknown as { qr_code: string }` (plan's single cast fails TS). Unused `writeAudit` import omitted.
4. **Page + RegistrationForm split** — Next.js 14 doesn't allow custom props on page components, so the RegisterPage body moved to `src/components/registration/RegistrationForm.tsx`. `/register/page.tsx` and `/register/walkup/[qrCode]/page.tsx` both render `<RegistrationForm>` (with `qrOverride` for walkup).
5. **E2E selectors (Task 2.8)** — aria-labels tuned to match plan's Playwright regexes:
   - Waiver ack → `aria-label="I electronically sign this permission slip"`
   - PhotoConsent promo → `aria-label="Include my child's photos for LCA promotional or social media use"`
   - PhotoConsent vision → `aria-label="Allow roaming photographer to auto-identify my child in photos"`
   - Waiver typed-name input: aria-label removed so the wrapping `<label>` span ("Type your full name to sign") is the accessible name.
6. **Edit page** — `export const dynamic = 'force-dynamic'` added to `/register/edit/[token]/page.tsx` so RSC doesn't cache the guardian/pickup data between edits.

## Phase 2 follow-ups (deferred)

1. Replace placeholder waiver copy in `src/components/registration/WaiverSection.tsx` (marked `TODO(plan Phase 2)`) with the real LCA paper-slip text.
2. Phase 7 will wire `buildReceiptPdf` into `/api/register` — generate PDF after insert, upload to Supabase Storage at `receipts/<child_id>.pdf` with a 90-day signed URL, attach to the Resend email.
3. Consent editing not exposed via `/register/edit/[token]` — `registrationEditSchema` omits photo consent fields. If parents need to retract consent post-submit, extend schema + PATCH + EditForm.
4. Manual smoke (register a 2-kid family end-to-end, verify DB rows, check `audit_log`) + Applitools baseline for `/register` — not run this session. Do before calling the phase fully shipped.

## How to resume

1. Read this file.
2. If continuing Phase 2 follow-ups: pick from the list above.
3. Otherwise, open the plan and jump to Task 3.1 (`### Task 3.1` in `docs/plans/2026-04-16-kid-profile-rebuild-plan.md`).
4. Run `git status` from `/Users/brianleach/projects/spring_bbq/spring-bbq-bash` to confirm clean state before starting.
5. Working pattern per task: failing test → implement → tests pass → typecheck → commit + push → update this file.

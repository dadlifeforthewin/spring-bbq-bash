# Kid Profile Rebuild — STATUS

**Branch:** `kid-profile-rebuild` · **Last update:** 2026-04-16
**Plan:** `docs/plans/2026-04-16-kid-profile-rebuild-plan.md` · **Spec:** `docs/specs/2026-04-16-kid-profile-rebuild-design.md`

## Progress

- **Phase 0 — Foundation:** ✅ complete (already done before this session)
- **Phase 1 — Schema Migration:** ✅ complete (all 7 tasks)
- **Phase 2 — Parent Registration Flow:** 1 of 12 tasks done
  - ✅ 2.1 Zod validators + unit tests
  - ⬜ 2.2 Magic-link token helpers (next)
  - ⬜ 2.3 Registration POST API
  - ⬜ 2.4–2.7 Registration form UI + assembly
  - ⬜ 2.8 E2E happy path
  - ⬜ 2.9 Magic-link edit API + page
  - ⬜ 2.10 Walk-up flow
  - ⬜ 2.11 Registration receipt PDF
  - ⬜ 2.12 Phase 2 gate check
- **Phase 3–7:** not started

## Environment setup (done — don't redo)

- **Port pinned to 3050** (avoids collision with A2D :3000 and A&E Cafe :3100)
- **Supabase CLI linked** to project `jujobpieydbyfsfhycsp` (LCA Spring BBQ) — use `supabase db push` to apply migrations
- **`.env.local`** populated with Supabase URL + anon + service_role keys; secrets for MAGIC_LINK_SECRET and SESSION_COOKIE_SECRET generated. ANTHROPIC_API_KEY, RESEND_API_KEY, EMAIL_FROM still empty (fill before Phase 5 / Phase 7)
- **Vitest loads env** via `loadEnv('', cwd, '')` from `vite` in `vitest.config.ts`

## Deviations from the plan (keep in mind)

1. **`supabase.ts`** — `supabase` const is a `browserClient()` factory instead (plan's const crashes at import when .env missing). Also `supabaseAdmin()` renamed to `serverClient()` per plan.
2. **`0001_drop_legacy.sql`** — removed the invalid `drop file if exists public.schema_v1_sentinel;` line (typo in plan; `drop file` isn't valid Postgres).

## How to resume

1. Read this file
2. Read plan's Task 2.2 section (search `### Task 2.2` in the plan)
3. `cd` to `/Users/brianleach/projects/spring_bbq/spring-bbq-bash` and run `git status` to confirm clean state
4. Execute the task — migrations apply via `supabase db push` (CLI already linked)
5. After every task: typecheck + tests + commit + push

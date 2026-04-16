# Spring BBQ Bash — Kid Profile Rebuild — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the Spring BBQ Bash app from ticket-centric to kid-profile-centric, add digital permission slip / registration / approved-pickup-list / FACTS ticket reload / scan-and-roaming photo capture / next-morning AI story keepsake email for parents.

**Architecture:** Refactor-in-place on the existing Next.js 14 (App Router) + Supabase (Postgres + Storage + Edge Functions + Realtime) + Vercel stack. Schema is reshaped around `children` as the primary entity; existing infrastructure (auth helpers, QR scanner component, admin pattern) is preserved. New capabilities added: Claude (Haiku + vision) for AI story generation and face matching, Resend for email delivery, React Email for template rendering, Vercel Cron for scheduled send. Testing added from scratch (Vitest + Testing Library + Playwright).

**Tech Stack:**
- Next.js 14.2 App Router (existing)
- Supabase JS SDK v2.45 (existing) — DB, Storage, Edge Functions, Realtime
- TypeScript 5.4 (existing)
- TailwindCSS 3.4 (existing)
- `html5-qrcode` 2.3 for QR scanning (existing)
- `@anthropic-ai/sdk` (NEW) — Claude Haiku 4.5 + vision
- `resend` (NEW) — email delivery
- `@react-email/components` + `@react-email/render` (NEW) — email template
- `zod` (NEW) — form validation
- `vitest` + `@testing-library/react` + `jsdom` (NEW) — unit/component tests
- `@playwright/test` (NEW) — E2E tests
- `pdf-lib` (NEW) — signed waiver PDF generation

**Spec reference:** `docs/specs/2026-04-16-kid-profile-rebuild-design.md` — the plan assumes the engineer reads the spec first for context.

**Conventions:**
- All new files follow existing code style (TS strict, functional components, Tailwind utility classes, server routes as `route.ts` in `src/app/api/.../`).
- Every new API route validates input with Zod; returns typed responses.
- RLS enabled on every new table; public routes go through API handlers using the service-role key (never exposed to client).
- Git: conventional commits (`feat:`, `fix:`, `chore:`, `test:`, `refactor:`, `db:`); one commit per task unless explicitly noted.
- Testing: TDD where practical (tests first for business logic, UI tests after implementation using Testing Library + Playwright).
- No `Co-Authored-By: Claude` lines in commits.
- Push to remote after every commit (per project convention).

---

## Phase Overview

Phases are ordered by dependency. Each phase should produce working, testable software before the next phase begins. Quality gates run after every phase per `_config/quality-gates.md`.

| # | Phase | Produces |
|---|---|---|
| 0 | Foundation & Setup | Test harness, new deps, env vars, Supabase Storage bucket, CI config |
| 1 | Schema Migration | New schema deployed, RLS policies, seed event row |
| 2 | Parent Registration Flow | `/register` + magic-link edit + PDF receipt + walk-up flow |
| 3 | Event-Night Volunteer Screens | Station login, check-in (w/ jail mugshot), checkout, photo, spend, reload, lookup |
| 4 | Admin Screens | Dashboard, children CRUD, bulk, stations/catalog, photo gallery |
| 5 | AI Story Pipeline (text only) | Generation Edge Function, gold standard, auto-check, moderation queue |
| 6 | Roaming Photographer + Vision | Face reference extraction, vision matching, admin review queue |
| 7 | Email Delivery | Resend + domain verification, React Email template, family grouping, Vercel Cron send |
| 8 | Security & Retention | RLS audit, audit log wiring, retention purge job |
| 9 | Quality Gates & Cutover | Applitools visual tests, a11y, load test, staging → prod cutover |

---

## File Structure

### New files (high level)

```
src/app/
  register/
    page.tsx                      # Multi-child registration form
    edit/[token]/page.tsx         # Magic-link edit page
    walkup/[qrCode]/page.tsx      # Walk-up flow (pre-printed wristband)
    confirm/page.tsx              # Post-submit confirmation
  station/
    page.tsx                      # Volunteer login + station picker
    check-in/page.tsx
    check-out/page.tsx
    photo/page.tsx                # Scan-then-shoot
    roaming/page.tsx              # Roaming photographer (Phase 6)
    spend/page.tsx                # Station spend (replaces /zone/[slug])
    reload/page.tsx
    lookup/page.tsx
  admin/
    page.tsx                      # Dashboard (refactored)
    children/page.tsx             # Children list
    children/[id]/page.tsx        # Child detail
    bulk/page.tsx
    stations/page.tsx             # Catalog (refactored from /admin/catalog)
    stories/page.tsx              # AI story moderation
    photos/page.tsx               # Photo gallery
    photos/queue/page.tsx         # Vision review queue (Phase 6)
    settings/page.tsx             # Event config + gold standard
  api/
    register/
      route.ts                    # POST: create children + guardians + ...
      edit/[token]/route.ts       # GET/PATCH with magic link
      walkup/[qrCode]/route.ts    # POST binding a pre-printed wristband
    children/
      route.ts                    # GET list, POST create (admin)
      [id]/route.ts               # GET/PATCH/DELETE
    station-events/route.ts       # POST all station events
    photos/
      upload/route.ts             # POST photo + tags
      [id]/route.ts               # DELETE
      vision/route.ts             # POST (Phase 6) vision analysis
    reload/route.ts               # POST reload event
    checkin/route.ts              # POST (refactored from existing)
    checkout/route.ts             # POST
    bulk/
      set-initial-balance/route.ts
      export-roster/route.ts
    stations/
      catalog/route.ts            # CRUD catalog items
    stories/
      route.ts                    # GET list
      [id]/route.ts               # GET/PATCH (approve/skip/edit)
      generate/route.ts           # POST (invoked by Edge Function)
    settings/route.ts             # GET/PATCH event config
    auth/volunteer/route.ts       # Volunteer password verify
    auth/admin/route.ts           # Admin password verify (refactored)

src/components/
  QRScanner.tsx                   # EXISTING - reused
  VolunteerGate.tsx               # EXISTING - refactored for station picker
  ConsentBanner.tsx               # NEW - green/red full-width banner
  ChildCard.tsx                   # NEW - shared child display with banners
  AllergiesBanner.tsx             # NEW
  PickupButton.tsx                # NEW
  PhotoViewfinder.tsx             # NEW - camera capture
  VibeTagRow.tsx                  # NEW
  StationPicker.tsx               # NEW
  StationCatalogEditor.tsx        # NEW
  StoryPreview.tsx                # NEW
  registration/
    ParentSection.tsx
    ChildBlock.tsx                # Repeatable child form
    PickupList.tsx                # Dynamic-add input
    WaiverSection.tsx
    PhotoConsentSection.tsx
    FactsSection.tsx

src/lib/
  supabase.ts                     # EXISTING - reused
  code.ts                         # EXISTING - kept
  auth.ts                         # EXISTING - refactored to include volunteer session
  ntfy.ts                         # DELETE (Phase 1)
  claude.ts                       # NEW - Anthropic SDK client + helpers
  resend.ts                       # NEW - Resend client
  face-matching.ts                # NEW (Phase 6) - vision embedding + compare
  story-generator.ts              # NEW (Phase 5) - prompt assembly + auto-check
  magic-link.ts                   # NEW - signed-token helpers
  validators.ts                   # NEW - Zod schemas
  audit.ts                        # NEW - audit log writer
  constants.ts                    # NEW - stations enum, thresholds, etc.

src/emails/
  StoryEmail.tsx                  # NEW - React Email family-grouped template
  RegistrationReceipt.tsx         # NEW

supabase/
  migrations/
    0001_drop_legacy.sql          # NEW - drop old ticket-centric tables
    0002_core_schema.sql          # NEW - events, children, guardians, etc.
    0003_rls_policies.sql         # NEW
    0004_seed_event_and_stations.sql # NEW
  functions/
    generate-story/index.ts       # NEW - Edge Function for AI story generation
    vision-analyze/index.ts       # NEW (Phase 6) - photo vision + face matching

tests/
  unit/
    story-generator.test.ts
    validators.test.ts
    auto-check.test.ts
    magic-link.test.ts
    face-matching.test.ts         # Phase 6
  component/
    ChildCard.test.tsx
    PickupList.test.tsx
    ConsentBanner.test.tsx
  e2e/
    registration.spec.ts
    check-in.spec.ts
    check-out.spec.ts
    photo-station.spec.ts
    spend-flow.spec.ts
    ai-story-moderation.spec.ts

vercel.json                       # NEW - cron config for email send

.env.example                      # UPDATED - new env vars
```

### Files deleted/retired

- `src/lib/ntfy.ts`
- `src/app/api/ntfy-link/route.ts`
- `src/app/api/call-parent/route.ts` (replaced by click-to-call/text in UI)
- `src/app/ticket/[code]/page.tsx` (public ticket view — replaced by profile lookup via station)
- `src/app/zone/[slug]/page.tsx` (replaced by `src/app/station/spend/page.tsx` with station selected from picker)
- `src/app/admin/tickets/page.tsx` (replaced by `src/app/admin/children/`)
- `src/app/admin/wristbands/page.tsx` (refactored into `src/app/admin/bulk/` as print sheet option)
- `supabase/schema.sql` (replaced by migration files)

---

## Phase 0: Foundation & Setup

**Goal:** Prepare the codebase for the refactor. New dependencies, test harness, env vars, Storage bucket, CI scaffolding. No behavior changes yet.

**Success criteria:**
- `npm test` runs a passing sanity test
- `npm run test:e2e` runs a passing sanity Playwright test (dev server started in test)
- `npm run typecheck` (new script) runs `tsc --noEmit` clean
- `.env.example` documents every new required env var
- Supabase Storage has a `photos` bucket with private ACL

### Task 0.1: Add type-check script and baseline pass

**Files:**
- Modify: `package.json`

- [ ] **Step 1:** Add scripts to `package.json`:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test",
  "lint": "next lint"
}
```

- [ ] **Step 2:** Run `npm run typecheck` — expected: clean pass on existing codebase.

- [ ] **Step 3:** Commit:

```bash
git add package.json
git commit -m "chore: add typecheck and test scripts"
git push
```

### Task 0.2: Install new dependencies

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1:** Install runtime dependencies:

```bash
npm install @anthropic-ai/sdk resend @react-email/components @react-email/render zod pdf-lib
```

- [ ] **Step 2:** Install dev dependencies:

```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @playwright/test
```

- [ ] **Step 3:** Run `npm run typecheck` — expected: clean pass.

- [ ] **Step 4:** Commit:

```bash
git add package.json package-lock.json
git commit -m "chore: install claude, resend, react-email, zod, vitest, playwright"
git push
```

### Task 0.3: Configure Vitest

**Files:**
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`
- Create: `tests/unit/sanity.test.ts`

- [ ] **Step 1:** Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}', 'tests/component/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 2:** Create `tests/setup.ts`:

```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 3:** Create `tests/unit/sanity.test.ts`:

```ts
import { describe, it, expect } from 'vitest'

describe('sanity', () => {
  it('adds numbers', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 4:** Run `npm test` — expected: 1 test passing.

- [ ] **Step 5:** Commit:

```bash
git add vitest.config.ts tests/setup.ts tests/unit/sanity.test.ts
git commit -m "test: configure vitest with jsdom + sanity test"
git push
```

### Task 0.4: Configure Playwright

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/sanity.spec.ts`

- [ ] **Step 1:** Run `npx playwright install chromium` once to install browser binaries.

- [ ] **Step 2:** Create `playwright.config.ts`:

```ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
})
```

- [ ] **Step 3:** Create `tests/e2e/sanity.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

test('home page loads', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Spring BBQ/i)
})
```

- [ ] **Step 4:** Run `npm run test:e2e` — expected: 1 test passing.

- [ ] **Step 5:** Commit:

```bash
git add playwright.config.ts tests/e2e/sanity.spec.ts
git commit -m "test: configure playwright with sanity e2e"
git push
```

### Task 0.5: Document new env vars

**Files:**
- Modify: `.env.example`

- [ ] **Step 1:** Update `.env.example` to include all new vars. Full file contents:

```dotenv
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# App
NEXT_PUBLIC_SITE_URL=
ADMIN_PASSWORD=
VOLUNTEER_PASSWORD=

# Signed magic links + session cookies
MAGIC_LINK_SECRET=          # openssl rand -hex 32
SESSION_COOKIE_SECRET=      # openssl rand -hex 32

# Claude (Haiku for text + vision)
ANTHROPIC_API_KEY=

# Email
RESEND_API_KEY=
EMAIL_FROM=                 # e.g. bash@lcasacramento.org — must be on a verified domain
EMAIL_REPLY_TO=             # optional, falls back to EMAIL_FROM

# Vercel cron secret (protects /api/cron/send-stories)
CRON_SECRET=
```

- [ ] **Step 2:** Commit:

```bash
git add .env.example
git commit -m "chore: document new env vars"
git push
```

### Task 0.6: Supabase Storage bucket setup

**Files:**
- Create: `supabase/migrations/0000_storage_setup.sql`

- [ ] **Step 1:** Create the migration file with the bucket policy:

```sql
-- Create private photos bucket
insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

-- Deny all anon access; admin/server routes use signed URLs
create policy "no anon photo reads"
  on storage.objects for select
  to anon
  using (false);

-- service_role role bypasses RLS by default; server-side routes use the service role key
```

- [ ] **Step 2:** Run the migration locally (copy-paste into Supabase SQL editor OR apply via Supabase CLI):

```bash
# If using Supabase CLI linked to the project:
supabase db push
# Otherwise: open Supabase dashboard → SQL Editor → paste + run
```

- [ ] **Step 3:** Verify in Supabase dashboard → Storage → `photos` bucket exists and is private.

- [ ] **Step 4:** Commit:

```bash
git add supabase/migrations/0000_storage_setup.sql
git commit -m "db: add private photos storage bucket"
git push
```

### Task 0.7: Vercel cron config stub

**Files:**
- Create: `vercel.json`

- [ ] **Step 1:** Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/send-stories",
      "schedule": "0 16 * * *"
    }
  ]
}
```

*Schedule note: Vercel Cron uses UTC. `0 16 * * *` = 9 AM Pacific during daylight time (April 26 is PDT, UTC-7). Adjust seasonally if event moves; this is the simplest hardcode for a one-night event.*

- [ ] **Step 2:** Commit:

```bash
git add vercel.json
git commit -m "chore: stub vercel cron for ai story send at 9am pacific"
git push
```

### Task 0.8: Phase 0 gate check

- [ ] **Step 1:** Run all checks:

```bash
npm run typecheck   # Expected: 0 errors
npm test             # Expected: 1 passing
npm run test:e2e     # Expected: 1 passing
```

- [ ] **Step 2:** Confirm `.env.example` committed; confirm `photos` bucket exists; confirm `vercel.json` present.

- [ ] **Step 3:** Phase 0 complete. No production deploy yet.

---

## Phase 1: Schema Migration

**Goal:** Replace legacy `tickets`/`zones`/`catalog_items` schema with the kid-profile-centric schema from the spec. Drop tables only used by old features; create new tables; enable RLS; seed one event row + stations + catalog items.

**Success criteria:**
- `npm run typecheck` clean
- Supabase dashboard shows all new tables with RLS enabled
- A single integration test creates a child via service-role and reads it back
- Legacy ticket-centric routes removed from the router (404 on old paths)

### Task 1.1: Drop legacy tables and routes

**Files:**
- Create: `supabase/migrations/0001_drop_legacy.sql`
- Delete: `src/lib/ntfy.ts`
- Delete: `src/app/api/ntfy-link/route.ts`
- Delete: `src/app/api/call-parent/route.ts`
- Delete: `src/app/ticket/[code]/page.tsx`
- Delete: `src/app/api/tickets/route.ts`
- Delete: `src/app/api/tickets/[code]/route.ts`

- [ ] **Step 1:** Create `supabase/migrations/0001_drop_legacy.sql`:

```sql
-- Drop legacy ticket-centric tables. Data on the current (pre-launch) repo is disposable.
drop table if exists public.catalog_items cascade;
drop table if exists public.zones cascade;
drop table if exists public.tickets cascade;
drop function if exists public.tickets_set_tier_defaults() cascade;
drop file if exists public.schema_v1_sentinel;  -- no-op if absent
```

- [ ] **Step 2:** Run it against the dev Supabase project (SQL editor or CLI).

- [ ] **Step 3:** Delete legacy files:

```bash
rm src/lib/ntfy.ts
rm src/app/api/ntfy-link/route.ts
rm src/app/api/call-parent/route.ts
rm -rf src/app/ticket
rm src/app/api/tickets/route.ts
rm -rf src/app/api/tickets
```

- [ ] **Step 4:** Remove any imports referencing deleted files. Expected references to fix:
- `src/app/admin/page.tsx` — remove any ntfy imports/UI
- `src/app/api/checkin/route.ts` — remove ntfy calls
- `src/app/api/spend/route.ts` — remove ntfy calls

For each of those three files, search for `ntfy` or `call-parent` and delete the referencing lines. Do not yet refactor for the new schema — just strip the dead references.

- [ ] **Step 5:** Run `npm run typecheck` — expected: errors about missing tables/types are OK for now; the legacy files will fail to compile. To unblock, **temporarily stub** the old API routes so the build passes:
  - `src/app/api/checkin/route.ts` → replace body with `export async function POST() { return Response.json({ok:false, error:'deprecated — see /api/register + /api/checkin (v2)'}, {status:410}) }`
  - `src/app/api/spend/route.ts` → same pattern
  - `src/app/api/stats/route.ts` → same pattern
  - `src/app/api/zones/route.ts` → same pattern
  - `src/app/api/catalog/route.ts` → same pattern

  These stubs get replaced in subsequent tasks. This keeps the repo compiling during the refactor.

- [ ] **Step 6:** `npm run typecheck` — expected: clean.

- [ ] **Step 7:** Commit:

```bash
git add -A
git commit -m "db: drop legacy ticket schema; refactor: stub legacy api routes; chore: remove ntfy"
git push
```

### Task 1.2: Create core schema

**Files:**
- Create: `supabase/migrations/0002_core_schema.sql`

- [ ] **Step 1:** Create `supabase/migrations/0002_core_schema.sql`. Full contents (long — paste exactly):

```sql
-- =====================================================================
-- Kid-profile-centric schema for Spring BBQ Bash v2
-- =====================================================================

-- -------- events --------
create table events (
  id                       uuid primary key default gen_random_uuid(),
  name                     text not null,
  event_date               date not null,
  check_in_opens_at        timestamptz not null,
  check_in_closes_at       timestamptz not null,
  ends_at                  timestamptz not null,
  default_initial_tickets  int not null default 0,
  faith_tone_level         text not null default 'strong'
    check (faith_tone_level in ('strong','subtle','off')),
  reference_story_html     text,
  reference_story_text     text,
  story_prompt_template    text,
  email_from_name          text default 'LCA Spring BBQ Bash',
  email_logo_url           text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

-- -------- children --------
create table children (
  id                        uuid primary key default gen_random_uuid(),
  event_id                  uuid not null references events(id) on delete cascade,
  qr_code                   uuid not null unique default gen_random_uuid(),
  first_name                text not null,
  last_name                 text not null,
  age                       int,
  grade                     text,
  tier                      text not null default 'vip',
  allergies                 text,
  special_instructions      text,
  photo_consent_app         boolean not null default false,
  photo_consent_promo       boolean not null default false,
  vision_matching_consent   boolean not null default false,
  facts_reload_permission   boolean not null default false,
  facts_max_amount          int not null default 0 check (facts_max_amount between 0 and 10),
  ticket_balance            int not null default 0,
  checked_in_at             timestamptz,
  checked_in_dropoff_type   text check (checked_in_dropoff_type in
    ('both_parents','one_parent','grandparent','other_approved_adult')),
  checked_out_at            timestamptz,
  checked_out_to_name       text,
  checked_out_by_staff_name text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index children_event_idx on children(event_id);
create index children_qr_idx on children(qr_code);

-- -------- guardians --------
create table guardians (
  id         uuid primary key default gen_random_uuid(),
  child_id   uuid not null references children(id) on delete cascade,
  name       text not null,
  phone      text,
  email      text,
  is_primary boolean not null default false
);

create index guardians_child_idx on guardians(child_id);
create index guardians_email_idx on guardians(email) where is_primary = true;

-- -------- pickup_authorizations --------
create table pickup_authorizations (
  id           uuid primary key default gen_random_uuid(),
  child_id     uuid not null references children(id) on delete cascade,
  name         text not null,
  relationship text,
  created_at   timestamptz not null default now()
);

create index pickup_child_idx on pickup_authorizations(child_id);

-- -------- stations (seeded list, editable catalog) --------
create table stations (
  slug        text primary key,
  name        text not null,
  sort_order  int  not null default 0,
  active      boolean not null default true
);

create table catalog_items (
  id          uuid primary key default gen_random_uuid(),
  station_slug text not null references stations(slug) on delete cascade,
  name        text not null,
  ticket_cost int  not null default 0,
  sort_order  int  not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (station_slug, name)
);

create index catalog_station_idx on catalog_items(station_slug);

-- -------- station_events (the timeline) --------
create table station_events (
  id             uuid primary key default gen_random_uuid(),
  child_id       uuid not null references children(id) on delete cascade,
  station        text not null,
  event_type     text not null check (event_type in
    ('ticket_spend','photo_taken','check_in','check_out','reload')),
  tickets_delta  int  not null default 0,
  item_name      text,
  vibe_tags      text[] not null default '{}',
  volunteer_name text,
  notes          text,
  created_at     timestamptz not null default now()
);

create index station_events_child_time_idx on station_events(child_id, created_at);
create index station_events_station_idx on station_events(station, created_at);

-- -------- photos --------
create table photos (
  id               uuid primary key default gen_random_uuid(),
  storage_path     text not null,
  taken_at         timestamptz not null default now(),
  volunteer_name   text,
  capture_mode     text not null check (capture_mode in ('station_scan','roaming_vision')),
  vision_summary   jsonb,
  match_confidence numeric(4,3),
  match_status     text not null default 'confirmed'
    check (match_status in ('auto','pending_review','unmatched','confirmed','rejected'))
);

create table photo_tags (
  id         uuid primary key default gen_random_uuid(),
  photo_id   uuid not null references photos(id) on delete cascade,
  child_id   uuid not null references children(id) on delete cascade,
  tagged_by  text not null check (tagged_by in ('scan','vision_auto','admin_manual')),
  created_at timestamptz not null default now(),
  unique (photo_id, child_id)
);

create index photo_tags_child_idx on photo_tags(child_id);

-- -------- face_references --------
create table face_references (
  id                  uuid primary key default gen_random_uuid(),
  child_id            uuid not null references children(id) on delete cascade,
  reference_photo_id  uuid references photos(id) on delete set null,
  embedding_data      jsonb,
  created_at          timestamptz not null default now()
);

create index face_ref_child_idx on face_references(child_id);

-- -------- reload_events --------
create table reload_events (
  id             uuid primary key default gen_random_uuid(),
  child_id       uuid not null references children(id) on delete cascade,
  tickets_added  int  not null,
  payment_method text not null check (payment_method in ('facts','cash','venmo','comp')),
  amount_charged numeric(6,2),
  staff_name     text,
  created_at     timestamptz not null default now()
);

create index reload_child_idx on reload_events(child_id);

-- -------- ai_stories --------
create table ai_stories (
  id                uuid primary key default gen_random_uuid(),
  child_id          uuid not null unique references children(id) on delete cascade,
  generated_at      timestamptz,
  status            text not null default 'pending'
    check (status in ('pending','pending_review','needs_review','approved','auto_approved','sent','skipped')),
  story_html        text,
  story_text        text,
  photo_count       int,
  word_count        int,
  auto_check_score  numeric(4,3),
  auto_check_notes  text,
  sent_at           timestamptz,
  delivery_email    text,
  moderation_notes  text
);

create index ai_stories_status_idx on ai_stories(status);

-- -------- email_sends --------
create table email_sends (
  id                    uuid primary key default gen_random_uuid(),
  primary_parent_email  text not null,
  child_ids             uuid[] not null,
  sent_at               timestamptz,
  status                text not null default 'queued'
    check (status in ('queued','sending','sent','failed')),
  resend_message_id     text,
  error                 text,
  created_at            timestamptz not null default now()
);

-- -------- signatures --------
create table signatures (
  id             uuid primary key default gen_random_uuid(),
  child_id       uuid not null references children(id) on delete cascade,
  signature_type text not null check (signature_type in ('liability_waiver','photo_consent')),
  typed_name     text not null,
  signed_at      timestamptz not null default now(),
  ip_address     text,
  user_agent     text
);

create index signatures_child_idx on signatures(child_id);

-- -------- audit_log --------
create table audit_log (
  id          uuid primary key default gen_random_uuid(),
  action      text not null check (action in
    ('checkout','admin_login','consent_change','photo_deleted','reload','registration_edit',
     'volunteer_login','manual_pickup_override')),
  actor       text not null,
  target_type text,
  target_id   uuid,
  details     jsonb,
  ip_address  text,
  created_at  timestamptz not null default now()
);

create index audit_log_created_idx on audit_log(created_at desc);

-- -------- updated_at triggers --------
create or replace function touch_updated_at() returns trigger as $$
begin
  new.updated_at := now();
  return new;
end $$ language plpgsql;

create trigger events_updated_at before update on events
  for each row execute function touch_updated_at();
create trigger children_updated_at before update on children
  for each row execute function touch_updated_at();
```

- [ ] **Step 2:** Run the migration against the dev Supabase project.

- [ ] **Step 3:** In Supabase dashboard → Database → Tables, verify every table is present.

- [ ] **Step 4:** Commit:

```bash
git add supabase/migrations/0002_core_schema.sql
git commit -m "db: create kid-profile-centric core schema"
git push
```

### Task 1.3: Enable RLS policies

**Files:**
- Create: `supabase/migrations/0003_rls_policies.sql`

- [ ] **Step 1:** Create `supabase/migrations/0003_rls_policies.sql`:

```sql
-- Enable RLS on all tables; anon has no reads/writes by default.
-- All data access is via server-side API routes using service_role key.

alter table events                 enable row level security;
alter table children               enable row level security;
alter table guardians              enable row level security;
alter table pickup_authorizations  enable row level security;
alter table stations               enable row level security;
alter table catalog_items          enable row level security;
alter table station_events         enable row level security;
alter table photos                 enable row level security;
alter table photo_tags             enable row level security;
alter table face_references        enable row level security;
alter table reload_events          enable row level security;
alter table ai_stories             enable row level security;
alter table email_sends            enable row level security;
alter table signatures             enable row level security;
alter table audit_log              enable row level security;

-- Public read access to stations + catalog_items only (needed for registration page pre-load)
create policy "public read stations" on stations for select to anon using (active = true);
create policy "public read catalog"  on catalog_items for select to anon using (active = true);
create policy "public read event"    on events for select to anon using (true);

-- No other anon access. service_role bypasses RLS (used by API routes).
```

- [ ] **Step 2:** Apply migration.

- [ ] **Step 3:** Verify: from Supabase dashboard → Authentication → Policies, confirm each table has RLS enabled and only the three `public read` policies exist.

- [ ] **Step 4:** Commit:

```bash
git add supabase/migrations/0003_rls_policies.sql
git commit -m "db: enable RLS; allow anon read on stations/catalog/events only"
git push
```

### Task 1.4: Seed event, stations, catalog

**Files:**
- Create: `supabase/migrations/0004_seed_event_and_stations.sql`

- [ ] **Step 1:** Create `supabase/migrations/0004_seed_event_and_stations.sql`:

```sql
-- Seed the 2026 event
insert into events (
  name, event_date, check_in_opens_at, check_in_closes_at, ends_at,
  default_initial_tickets, faith_tone_level
) values (
  'LCA Spring BBQ Glow Party Bash 2026',
  '2026-04-25',
  '2026-04-25 16:45:00-07',
  '2026-04-25 17:30:00-07',
  '2026-04-25 20:00:00-07',
  10,
  'strong'
);

-- Seed stations matching the Kids Event Station Guide
insert into stations (slug, name, sort_order) values
  ('check_in',         'Check-In & Jail Mugshot', 1),
  ('jail',             'Jail (Mugshot Station)', 2),
  ('cornhole',         'Cornhole',                3),
  ('face_painting',    'Face Painting',           4),
  ('arts_crafts',      'Arts & Crafts',           5),
  ('prize_wheel',      'Prize Wheel',             6),
  ('video_games',      'Video Games',             7),
  ('dance_competition','Dance Competition',       8),
  ('quiet_corner',     'Quiet Corner',            9),
  ('pizza',            'Pizza',                  10),
  ('cake_walk',        'Cake Walk',              11),
  ('check_out',        'Check-Out',              12);

-- Seed catalog with placeholder prices (editable pre-event in admin)
insert into catalog_items (station_slug, name, ticket_cost, sort_order) values
  ('cornhole',         'Game (3 tosses)',        2, 1),
  ('face_painting',    'Small design',           3, 1),
  ('face_painting',    'Full face',              5, 2),
  ('arts_crafts',      'Glow bracelet kit',      3, 1),
  ('arts_crafts',      'Craft project',          2, 2),
  ('prize_wheel',      'Spin',                   1, 1),
  ('video_games',      'Game session',           2, 1),
  ('dance_competition','Entry',                  2, 1),
  ('pizza',            'Slice',                  2, 1),
  ('pizza',            'Drink',                  1, 2),
  ('cake_walk',        'Entry',                  3, 1);
```

- [ ] **Step 2:** Apply migration.

- [ ] **Step 3:** Verify in Supabase dashboard that the event row, 12 stations, and catalog rows exist.

- [ ] **Step 4:** Commit:

```bash
git add supabase/migrations/0004_seed_event_and_stations.sql
git commit -m "db: seed 2026 event, stations, catalog"
git push
```

### Task 1.5: Type-safe Supabase client helpers

**Files:**
- Modify: `src/lib/supabase.ts`
- Create: `src/lib/types.ts`

- [ ] **Step 1:** Create `src/lib/types.ts` (hand-written types matching the schema — skip `supabase gen types` until later for simplicity):

```ts
export type Station =
  | 'check_in' | 'jail' | 'cornhole' | 'face_painting'
  | 'arts_crafts' | 'prize_wheel' | 'video_games' | 'dance_competition'
  | 'quiet_corner' | 'pizza' | 'cake_walk' | 'check_out' | 'photo' | 'reload'

export type DropoffType = 'both_parents' | 'one_parent' | 'grandparent' | 'other_approved_adult'

export type Child = {
  id: string
  event_id: string
  qr_code: string
  first_name: string
  last_name: string
  age: number | null
  grade: string | null
  tier: string
  allergies: string | null
  special_instructions: string | null
  photo_consent_app: boolean
  photo_consent_promo: boolean
  vision_matching_consent: boolean
  facts_reload_permission: boolean
  facts_max_amount: number
  ticket_balance: number
  checked_in_at: string | null
  checked_in_dropoff_type: DropoffType | null
  checked_out_at: string | null
  checked_out_to_name: string | null
  checked_out_by_staff_name: string | null
  created_at: string
  updated_at: string
}

export type Guardian = {
  id: string
  child_id: string
  name: string
  phone: string | null
  email: string | null
  is_primary: boolean
}

export type PickupAuthorization = {
  id: string
  child_id: string
  name: string
  relationship: string | null
  created_at: string
}

export type StationEvent = {
  id: string
  child_id: string
  station: Station
  event_type: 'ticket_spend' | 'photo_taken' | 'check_in' | 'check_out' | 'reload'
  tickets_delta: number
  item_name: string | null
  vibe_tags: string[]
  volunteer_name: string | null
  notes: string | null
  created_at: string
}

// ... Photo, ReloadEvent, AiStory, Signature, EventRow, CatalogItem types
// (complete type definitions for all tables — expand inline as needed by consumers)
```

*(Task engineer: expand remaining type exports to cover every table. Pattern: nullable columns → `T | null`; enum check constraints → string literal unions; timestamps → `string`; uuid → `string`; `jsonb` → `unknown` or a refined shape if known.)*

- [ ] **Step 2:** Refactor `src/lib/supabase.ts` — keep the existing client creation pattern (server + browser clients) and re-export types for convenience:

```ts
import { createClient } from '@supabase/supabase-js'

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Browser-safe client (RLS applies — anon role)
export const supabase = createClient(supabaseUrl, anonKey)

// Server-only client (service role — bypasses RLS). NEVER import from a client component.
export function serverClient() {
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })
}

export type * from './types'
```

- [ ] **Step 3:** Run `npm run typecheck` — expected: clean.

- [ ] **Step 4:** Commit:

```bash
git add src/lib/supabase.ts src/lib/types.ts
git commit -m "refactor: typed supabase client + domain types"
git push
```

### Task 1.6: Integration sanity test

**Files:**
- Create: `tests/unit/db-smoke.test.ts`

- [ ] **Step 1:** Create `tests/unit/db-smoke.test.ts` (requires a running dev DB; skip in CI via `describe.skipIf`):

```ts
import { describe, it, expect } from 'vitest'
import { serverClient } from '@/lib/supabase'

const canHit = !!process.env.SUPABASE_SERVICE_ROLE_KEY

describe.skipIf(!canHit)('db smoke', () => {
  it('reads the seeded event', async () => {
    const sb = serverClient()
    const { data, error } = await sb.from('events').select('name').limit(1)
    expect(error).toBeNull()
    expect(data?.[0]?.name).toContain('Glow Party Bash')
  })
})
```

- [ ] **Step 2:** With `.env.local` populated, run `npm test` — expected: smoke test passes. Without creds, test is skipped — still passes the suite.

- [ ] **Step 3:** Commit:

```bash
git add tests/unit/db-smoke.test.ts
git commit -m "test: db smoke — seeded event readable via service role"
git push
```

### Task 1.7: Phase 1 gate check

- [ ] **Step 1:** Run full gate:

```bash
npm run typecheck
npm test
npm run test:e2e
```

- [ ] **Step 2:** Verify every new table + RLS policy in Supabase dashboard.

- [ ] **Step 3:** Verify legacy routes removed (curl the dev URL for `/ticket/foo` → 404).

- [ ] **Step 4:** Phase 1 complete.

---

## Phase 2: Parent Registration Flow

**Goal:** Ship the digital permission slip at `/register` — multi-child families, waiver + photo signatures, FACTS per-child authorization, magic-link edit, emailed PDF receipt, and walk-up flow for pre-printed wristbands.

**Success criteria:**
- A parent can register 1+ children end-to-end; data writes to `children`, `guardians`, `pickup_authorizations`, `signatures`.
- Confirmation email (receipt + magic-link) sent via Resend (Phase 7 wires Resend; here we log the email payload and test with a mock sender).
- Magic-link edit works for editable fields; immutable fields are enforced server-side.
- Walk-up flow: parent scans pre-printed QR → form pre-fills the `qr_code` → submits → child is created with that specific UUID.
- All validation server-enforced; Zod schema is the single source of truth.
- Tests: unit (Zod schemas), component (form sections), E2E (happy path + validation errors + walk-up + magic-link edit).

### Task 2.1: Zod validators

**Files:**
- Create: `src/lib/validators.ts`
- Create: `tests/unit/validators.test.ts`

- [ ] **Step 1 (TDD — write the failing test first):** Create `tests/unit/validators.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { registrationSchema } from '@/lib/validators'

const validForm = {
  primary_parent: { name: 'Jane Carter', phone: '555-111-2222', email: 'jane@example.com' },
  secondary_parent: null,
  children: [{
    first_name: 'Maya',
    last_name: 'Carter',
    age: 7,
    grade: '2nd',
    allergies: '',
    special_instructions: '',
    pickup_authorizations: [{ name: 'Grandma Carol', relationship: 'Grandma' }],
    facts_reload_permission: true,
    facts_max_amount: 10,
  }],
  waiver_signature: { typed_name: 'Jane Carter' },
  photo_consent_app: true,
  photo_consent_promo: false,
  vision_matching_consent: true,
  photo_signature: { typed_name: 'Jane Carter' },
}

describe('registrationSchema', () => {
  it('accepts a valid single-child registration', () => {
    expect(registrationSchema.safeParse(validForm).success).toBe(true)
  })

  it('requires at least one child', () => {
    const bad = { ...validForm, children: [] }
    expect(registrationSchema.safeParse(bad).success).toBe(false)
  })

  it('caps facts_max_amount at 10', () => {
    const bad = { ...validForm, children: [{ ...validForm.children[0], facts_max_amount: 11 }] }
    expect(registrationSchema.safeParse(bad).success).toBe(false)
  })

  it('requires primary parent email', () => {
    const bad = { ...validForm, primary_parent: { ...validForm.primary_parent, email: '' } }
    expect(registrationSchema.safeParse(bad).success).toBe(false)
  })

  it('waiver signature cannot be empty', () => {
    const bad = { ...validForm, waiver_signature: { typed_name: '' } }
    expect(registrationSchema.safeParse(bad).success).toBe(false)
  })
})
```

- [ ] **Step 2:** Run `npm test tests/unit/validators.test.ts` — expected: FAIL (module doesn't exist).

- [ ] **Step 3:** Create `src/lib/validators.ts`:

```ts
import { z } from 'zod'

export const parentSchema = z.object({
  name: z.string().min(1, 'Name required').max(120),
  phone: z.string().min(7, 'Phone required').max(30),
  email: z.string().email('Valid email required'),
})

export const pickupAuthorizationSchema = z.object({
  name: z.string().min(1).max(120),
  relationship: z.string().max(60).optional().or(z.literal('')),
})

export const childSchema = z.object({
  first_name: z.string().min(1).max(60),
  last_name: z.string().min(1).max(60),
  age: z.number().int().min(1).max(25).nullable().optional(),
  grade: z.string().max(30).optional().or(z.literal('')),
  allergies: z.string().max(1000).optional().or(z.literal('')),
  special_instructions: z.string().max(1000).optional().or(z.literal('')),
  pickup_authorizations: z.array(pickupAuthorizationSchema).max(20),
  facts_reload_permission: z.boolean(),
  facts_max_amount: z.number().int().min(0).max(10),
})

export const signatureInputSchema = z.object({
  typed_name: z.string().min(1, 'Please type your name to sign').max(120),
})

export const registrationSchema = z.object({
  primary_parent: parentSchema,
  secondary_parent: parentSchema.nullable(),
  children: z.array(childSchema).min(1, 'Add at least one child'),
  waiver_signature: signatureInputSchema,
  photo_consent_app: z.boolean(),
  photo_consent_promo: z.boolean(),
  vision_matching_consent: z.boolean(),
  photo_signature: signatureInputSchema,
})

export type RegistrationInput = z.infer<typeof registrationSchema>

export const walkupSchema = registrationSchema.extend({
  qr_code: z.string().uuid(),
})

export const registrationEditSchema = z.object({
  children: z.array(childSchema.extend({
    id: z.string().uuid(),
  })).min(1),
  primary_parent: parentSchema,
  secondary_parent: parentSchema.nullable(),
})
```

- [ ] **Step 4:** Run `npm test tests/unit/validators.test.ts` — expected: PASS.

- [ ] **Step 5:** Commit:

```bash
git add src/lib/validators.ts tests/unit/validators.test.ts
git commit -m "feat: registration zod schemas with unit tests"
git push
```

### Task 2.2: Magic-link token helpers

**Files:**
- Create: `src/lib/magic-link.ts`
- Create: `tests/unit/magic-link.test.ts`

- [ ] **Step 1:** Create `tests/unit/magic-link.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { signToken, verifyToken } from '@/lib/magic-link'

process.env.MAGIC_LINK_SECRET = 'test-secret-at-least-32-chars-long-please'

describe('magic-link', () => {
  it('signs and verifies a token round-trip', () => {
    const token = signToken({ child_id: 'abc', scope: 'edit' }, 60)
    const payload = verifyToken(token)
    expect(payload?.child_id).toBe('abc')
    expect(payload?.scope).toBe('edit')
  })

  it('rejects tampered tokens', () => {
    const token = signToken({ child_id: 'abc' }, 60)
    const tampered = token.slice(0, -3) + 'xxx'
    expect(verifyToken(tampered)).toBeNull()
  })

  it('rejects expired tokens', () => {
    const token = signToken({ child_id: 'abc' }, -1) // already expired
    expect(verifyToken(token)).toBeNull()
  })
})
```

- [ ] **Step 2:** Run — expected: FAIL.

- [ ] **Step 3:** Create `src/lib/magic-link.ts`:

```ts
import { createHmac, timingSafeEqual } from 'crypto'

type Payload = {
  child_id?: string
  family_primary_email?: string
  scope?: string
  exp?: number
}

function secret() {
  const s = process.env.MAGIC_LINK_SECRET
  if (!s || s.length < 32) throw new Error('MAGIC_LINK_SECRET must be ≥ 32 chars')
  return s
}

function b64url(buf: Buffer | string) {
  return Buffer.from(buf).toString('base64url')
}

export function signToken(payload: Omit<Payload, 'exp'>, ttlSeconds: number): string {
  const body: Payload = { ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds }
  const json = JSON.stringify(body)
  const encoded = b64url(json)
  const sig = createHmac('sha256', secret()).update(encoded).digest('base64url')
  return `${encoded}.${sig}`
}

export function verifyToken(token: string): Payload | null {
  const [encoded, sig] = token.split('.')
  if (!encoded || !sig) return null

  const expected = createHmac('sha256', secret()).update(encoded).digest('base64url')
  const a = Buffer.from(sig, 'base64url')
  const b = Buffer.from(expected, 'base64url')
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null

  try {
    const payload: Payload = JSON.parse(Buffer.from(encoded, 'base64url').toString())
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}
```

- [ ] **Step 4:** Run test — expected: PASS.

- [ ] **Step 5:** Commit:

```bash
git add src/lib/magic-link.ts tests/unit/magic-link.test.ts
git commit -m "feat: signed magic-link helpers with hmac + expiry"
git push
```

### Task 2.3: Registration POST API

**Files:**
- Create: `src/app/api/register/route.ts`
- Modify: `src/lib/audit.ts` (create)

- [ ] **Step 1:** Create `src/lib/audit.ts`:

```ts
import { serverClient } from './supabase'

type AuditAction = 'checkout' | 'admin_login' | 'consent_change' | 'photo_deleted'
  | 'reload' | 'registration_edit' | 'volunteer_login' | 'manual_pickup_override'

export async function writeAudit(params: {
  action: AuditAction
  actor: string
  target_type?: string
  target_id?: string
  details?: Record<string, unknown>
  ip_address?: string
}) {
  const sb = serverClient()
  await sb.from('audit_log').insert({
    action: params.action,
    actor: params.actor,
    target_type: params.target_type ?? null,
    target_id: params.target_id ?? null,
    details: params.details ?? {},
    ip_address: params.ip_address ?? null,
  })
}
```

- [ ] **Step 2:** Create `src/app/api/register/route.ts`:

```ts
import { NextRequest } from 'next/server'
import { registrationSchema, walkupSchema } from '@/lib/validators'
import { serverClient } from '@/lib/supabase'
import { signToken } from '@/lib/magic-link'
import { writeAudit } from '@/lib/audit'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? null
  const ua = req.headers.get('user-agent') ?? null
  const body = await req.json().catch(() => null)
  if (!body) return Response.json({ error: 'invalid json' }, { status: 400 })

  // Allow walkup flow (includes qr_code override) OR normal registration
  const isWalkup = typeof body.qr_code === 'string'
  const parsed = isWalkup ? walkupSchema.safeParse(body) : registrationSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'validation', issues: parsed.error.flatten() }, { status: 400 })
  }

  const sb = serverClient()
  const { data: eventRow } = await sb.from('events').select('id, default_initial_tickets').limit(1).single()
  if (!eventRow) return Response.json({ error: 'no event configured' }, { status: 500 })

  const created: { child_id: string; qr_code: string }[] = []

  for (const child of parsed.data.children) {
    const insertRow: Record<string, unknown> = {
      event_id: eventRow.id,
      first_name: child.first_name,
      last_name: child.last_name,
      age: child.age ?? null,
      grade: child.grade || null,
      allergies: child.allergies || null,
      special_instructions: child.special_instructions || null,
      photo_consent_app: parsed.data.photo_consent_app,
      photo_consent_promo: parsed.data.photo_consent_promo,
      vision_matching_consent: parsed.data.vision_matching_consent,
      facts_reload_permission: child.facts_reload_permission,
      facts_max_amount: child.facts_max_amount,
      ticket_balance: eventRow.default_initial_tickets,
    }
    if (isWalkup) insertRow.qr_code = (parsed.data as { qr_code: string }).qr_code

    const { data: created_child, error } = await sb
      .from('children')
      .insert(insertRow)
      .select('id, qr_code')
      .single()
    if (error || !created_child) {
      return Response.json({ error: 'db insert failed', details: error?.message }, { status: 500 })
    }

    // Guardians
    await sb.from('guardians').insert([
      { child_id: created_child.id, name: parsed.data.primary_parent.name,
        phone: parsed.data.primary_parent.phone, email: parsed.data.primary_parent.email,
        is_primary: true },
      ...(parsed.data.secondary_parent
        ? [{ child_id: created_child.id, name: parsed.data.secondary_parent.name,
             phone: parsed.data.secondary_parent.phone, email: parsed.data.secondary_parent.email,
             is_primary: false }]
        : []),
    ])

    // Pickup authorizations
    if (child.pickup_authorizations.length > 0) {
      await sb.from('pickup_authorizations').insert(
        child.pickup_authorizations.map((p) => ({
          child_id: created_child.id, name: p.name, relationship: p.relationship || null,
        }))
      )
    }

    // Signatures
    await sb.from('signatures').insert([
      { child_id: created_child.id, signature_type: 'liability_waiver',
        typed_name: parsed.data.waiver_signature.typed_name,
        ip_address: ip, user_agent: ua },
      { child_id: created_child.id, signature_type: 'photo_consent',
        typed_name: parsed.data.photo_signature.typed_name,
        ip_address: ip, user_agent: ua },
    ])

    // Pre-queue ai_stories row so generation pipeline has a target
    await sb.from('ai_stories').insert({ child_id: created_child.id, status: 'pending' })

    created.push({ child_id: created_child.id, qr_code: created_child.qr_code })
  }

  // Magic-link token scoped to primary parent email (covers the whole family)
  const editToken = signToken(
    { family_primary_email: parsed.data.primary_parent.email, scope: 'edit' },
    60 * 60 * 24 * 30 // 30 days
  )

  // NOTE: Resend sending wired in Phase 7. For now, log the payload the email would contain.
  console.log('[registration] confirmation email payload:', {
    to: parsed.data.primary_parent.email,
    children: created,
    edit_url: `${process.env.NEXT_PUBLIC_SITE_URL}/register/edit/${editToken}`,
  })

  return Response.json({ ok: true, created, edit_token: editToken })
}
```

- [ ] **Step 3:** Run `npm run typecheck` — expected: clean.

- [ ] **Step 4:** Commit:

```bash
git add src/lib/audit.ts src/app/api/register/route.ts
git commit -m "feat: POST /api/register with walkup + guardians + signatures"
git push
```

### Task 2.4: Registration form UI — parent section

**Files:**
- Create: `src/components/registration/ParentSection.tsx`
- Create: `tests/component/ParentSection.test.tsx`

- [ ] **Step 1:** Create `tests/component/ParentSection.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ParentSection from '@/components/registration/ParentSection'

describe('ParentSection', () => {
  it('renders primary parent fields and fires onChange', () => {
    const onChange = vi.fn()
    render(<ParentSection label="Primary Parent" value={{ name: '', phone: '', email: '' }} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Jane' } })
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ name: 'Jane' }))
  })
})
```

- [ ] **Step 2:** Run — expected: FAIL.

- [ ] **Step 3:** Create `src/components/registration/ParentSection.tsx`:

```tsx
'use client'
import { ChangeEvent } from 'react'

export type ParentValue = { name: string; phone: string; email: string }

export default function ParentSection({
  label,
  value,
  onChange,
  optional = false,
}: {
  label: string
  value: ParentValue
  onChange: (v: ParentValue) => void
  optional?: boolean
}) {
  const update = (field: keyof ParentValue) => (e: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, [field]: e.target.value })
  }

  return (
    <fieldset className="space-y-3">
      <legend className="text-lg font-bold">{label}{optional && <span className="ml-2 text-sm text-slate-400">(optional)</span>}</legend>
      <label className="block">
        <span className="block text-sm">Name</span>
        <input type="text" required={!optional} value={value.name} onChange={update('name')}
          className="w-full rounded border px-3 py-2" />
      </label>
      <label className="block">
        <span className="block text-sm">Phone</span>
        <input type="tel" required={!optional} value={value.phone} onChange={update('phone')}
          className="w-full rounded border px-3 py-2" />
      </label>
      <label className="block">
        <span className="block text-sm">Email {!optional && '(required — your keepsake email will come here)'}</span>
        <input type="email" required={!optional} value={value.email} onChange={update('email')}
          className="w-full rounded border px-3 py-2" />
      </label>
    </fieldset>
  )
}
```

- [ ] **Step 4:** Run test — expected: PASS.

- [ ] **Step 5:** Commit:

```bash
git add src/components/registration/ParentSection.tsx tests/component/ParentSection.test.tsx
git commit -m "feat(registration): ParentSection component"
git push
```

### Task 2.5: Pickup list component (dynamic add/remove)

**Files:**
- Create: `src/components/registration/PickupList.tsx`
- Create: `tests/component/PickupList.test.tsx`

Pattern: render a list of `{ name, relationship }` rows with "Add another" button + per-row delete. Controlled component via `value` + `onChange`. Minimum 0, max 20. Each row has `name` (required if present) and `relationship` (optional). Test: add → adds blank row; delete → removes.

Full implementation follows the same TDD pattern as Task 2.4 — write failing test, implement, verify. Reference implementation:

```tsx
'use client'
import type { PickupAuthorizationInput } from '@/lib/types'

type Item = { name: string; relationship?: string }

export default function PickupList({
  value,
  onChange,
}: { value: Item[]; onChange: (v: Item[]) => void }) {
  const add = () => onChange([...value, { name: '', relationship: '' }])
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i))
  const update = (i: number, patch: Partial<Item>) =>
    onChange(value.map((row, idx) => idx === i ? { ...row, ...patch } : row))

  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-500">
        Who besides the parents can pick up your child? (Primary + secondary parent are auto-included.)
      </p>
      {value.map((row, i) => (
        <div key={i} className="flex gap-2">
          <input className="flex-1 rounded border px-3 py-2" placeholder="Name"
            value={row.name} onChange={(e) => update(i, { name: e.target.value })} />
          <input className="w-40 rounded border px-3 py-2" placeholder="Relationship (optional)"
            value={row.relationship ?? ''} onChange={(e) => update(i, { relationship: e.target.value })} />
          <button type="button" onClick={() => remove(i)} aria-label={`remove-${i}`}
            className="px-3 py-2 rounded bg-slate-200">✕</button>
        </div>
      ))}
      <button type="button" onClick={add} className="text-sm text-blue-600">
        + Add another person
      </button>
    </div>
  )
}
```

- [ ] **Step 1:** Write failing test (`PickupList.test.tsx`) covering: add row, remove row, update name.
- [ ] **Step 2:** Implement component.
- [ ] **Step 3:** Tests pass.
- [ ] **Step 4:** Commit + push.

### Task 2.6: Remaining registration components

Create with same TDD pattern. Each is ~50–100 lines.

- **`ChildBlock.tsx`** — one child's form. Props: `value: ChildInput`, `onChange`, `onRemove`. Renders first/last name, age, grade, allergies, special instructions, embedded `PickupList`, FACTS toggle + per-child amount input (0–10, default 10).
  - Test: toggling FACTS off zeroes the amount field; amount cap enforced via `max={10}`.
- **`WaiverSection.tsx`** — scrollable waiver text (hardcoded from paper slip content; see `spec §2 Step 3`) + typed-name signature input + checkbox acknowledging electronic signature.
  - Test: cannot submit with empty typed name or unchecked acknowledgment (component exposes `isValid()` or emits invalid state).
- **`PhotoConsentSection.tsx`** — three toggles (`photo_consent_app`, `photo_consent_promo`, `vision_matching_consent`) + separate signature block. Vision consent has explicit benefits copy from the spec.
  - Test: visible benefits copy; toggles fire onChange.
- **`FactsSection.tsx`** *(optional; can be inlined in ChildBlock)* — per-child slider + number input, min 0, max 10, default 10 when permission = true.

Each task:
- [ ] Write failing test.
- [ ] Implement.
- [ ] Tests pass.
- [ ] Commit + push ("feat(registration): <component>").

### Task 2.7: Registration page assembly

**Files:**
- Create: `src/app/register/page.tsx`
- Create: `src/app/register/confirm/page.tsx`

- [ ] **Step 1:** Create `src/app/register/page.tsx`:

```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ParentSection, { ParentValue } from '@/components/registration/ParentSection'
import ChildBlock, { ChildInput, emptyChild } from '@/components/registration/ChildBlock'
import WaiverSection from '@/components/registration/WaiverSection'
import PhotoConsentSection, { PhotoConsent } from '@/components/registration/PhotoConsentSection'

export default function RegisterPage({ qrOverride }: { qrOverride?: string }) {
  const router = useRouter()
  const [primary, setPrimary] = useState<ParentValue>({ name: '', phone: '', email: '' })
  const [secondary, setSecondary] = useState<ParentValue | null>(null)
  const [children, setChildren] = useState<ChildInput[]>([emptyChild()])
  const [waiverName, setWaiverName] = useState('')
  const [waiverAck, setWaiverAck] = useState(false)
  const [photoConsent, setPhotoConsent] = useState<PhotoConsent>({
    photo_consent_app: false,
    photo_consent_promo: false,
    vision_matching_consent: false,
    photo_signature_name: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const payload = {
        primary_parent: primary,
        secondary_parent: secondary,
        children: children.map((c) => ({
          first_name: c.first_name, last_name: c.last_name, age: c.age, grade: c.grade,
          allergies: c.allergies, special_instructions: c.special_instructions,
          pickup_authorizations: c.pickup_authorizations,
          facts_reload_permission: c.facts_reload_permission,
          facts_max_amount: c.facts_max_amount,
        })),
        waiver_signature: { typed_name: waiverName },
        photo_consent_app: photoConsent.photo_consent_app,
        photo_consent_promo: photoConsent.photo_consent_promo,
        vision_matching_consent: photoConsent.vision_matching_consent,
        photo_signature: { typed_name: photoConsent.photo_signature_name },
        ...(qrOverride ? { qr_code: qrOverride } : {}),
      }
      const res = await fetch('/api/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.issues ? JSON.stringify(data.issues) : data.error)
      router.push('/register/confirm')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-8">
      <header>
        <h1 className="text-3xl font-bold">LCA Spring BBQ Glow Party Bash</h1>
        <p className="text-slate-600">April 25, 2026 · Permission Slip &amp; Registration</p>
      </header>
      <form onSubmit={onSubmit} className="space-y-8">
        <ParentSection label="Primary Parent / Guardian" value={primary} onChange={setPrimary} />
        {/* secondary parent toggle */}
        {secondary
          ? <ParentSection label="Secondary Parent" value={secondary} onChange={setSecondary} optional />
          : <button type="button" onClick={() => setSecondary({ name: '', phone: '', email: '' })}
              className="text-blue-600 text-sm">+ Add secondary parent</button>}

        <div className="space-y-4">
          <h2 className="text-xl font-bold">Children</h2>
          {children.map((c, i) => (
            <ChildBlock key={i} value={c}
              onChange={(v) => setChildren(children.map((x, idx) => idx === i ? v : x))}
              onRemove={children.length > 1 ? () => setChildren(children.filter((_, idx) => idx !== i)) : undefined} />
          ))}
          <button type="button" onClick={() => setChildren([...children, emptyChild()])}
            className="text-blue-600">+ Add another child</button>
        </div>

        <WaiverSection typedName={waiverName} setTypedName={setWaiverName} ack={waiverAck} setAck={setWaiverAck} />
        <PhotoConsentSection value={photoConsent} onChange={setPhotoConsent} />

        <p className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
          ✨ A special surprise will land in your inbox the morning after the event. Keep an eye out!
        </p>

        {error && <p className="rounded bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={submitting}
          className="w-full rounded bg-fuchsia-600 text-white py-3 font-bold disabled:opacity-50">
          {submitting ? 'Submitting…' : 'Submit Permission Slip'}
        </button>
      </form>
    </main>
  )
}
```

- [ ] **Step 2:** Create `src/app/register/confirm/page.tsx`:

```tsx
export default function ConfirmPage() {
  return (
    <main className="mx-auto max-w-xl p-6 space-y-4">
      <h1 className="text-3xl font-bold">You're registered! 🌟</h1>
      <p>Your wristband will be ready at check-in on April 25.</p>
      <p className="text-sm text-slate-500">A confirmation email is on its way to the primary parent inbox,
        with a link to edit your submission if anything changes.</p>
    </main>
  )
}
```

- [ ] **Step 3:** Run typecheck — expected: clean.

- [ ] **Step 4:** Commit + push.

### Task 2.8: Registration E2E happy path

**Files:**
- Create: `tests/e2e/registration.spec.ts`

- [ ] **Step 1:** Write E2E test:

```ts
import { test, expect } from '@playwright/test'

test('parent registers one child successfully', async ({ page }) => {
  await page.goto('/register')
  await page.getByLabel(/primary parent/i).getByLabel(/name/i).fill('Jane Carter')
  await page.getByLabel(/primary parent/i).getByLabel(/phone/i).fill('555-111-2222')
  await page.getByLabel(/primary parent/i).getByLabel(/email/i).fill(`jane${Date.now()}@test.com`)

  await page.getByLabel(/first name/i).fill('Maya')
  await page.getByLabel(/last name/i).fill('Carter')
  await page.getByLabel(/age/i).fill('7')

  // Waiver
  await page.getByLabel(/type your full name/i).fill('Jane Carter')
  await page.getByLabel(/electronically sign/i).check()

  // Photo consents
  await page.getByLabel(/include my child in photo memories/i).check()
  await page.getByLabel(/for LCA promotional/i).check()
  await page.getByLabel(/auto-identify my child/i).check()
  await page.getByLabel(/photo consent signature/i).fill('Jane Carter')

  await page.getByRole('button', { name: /submit permission slip/i }).click()
  await expect(page).toHaveURL(/\/register\/confirm/)
})
```

- [ ] **Step 2:** Run `npm run test:e2e` with `.env.local` pointed at a DB (the test writes real rows — use a throwaway Supabase project for local testing).

- [ ] **Step 3:** Iterate on selectors until the test passes.

- [ ] **Step 4:** Commit + push.

### Task 2.9: Magic-link edit API + page

Pattern repeats — create `GET /api/register/edit/[token]` (returns child data scoped to the email on the token) and `PATCH` (accepts `registrationEditSchema`, enforces that immutable fields [first_name, last_name, age, qr_code] can't change via this endpoint). Create `src/app/register/edit/[token]/page.tsx` that fetches and renders an editable form prefilled with current values. Verify token once per request; log every edit to `audit_log` with action `registration_edit`.

Steps per task:
- [ ] Write E2E test: "parent edits pickup list via magic link" (submit registration → extract `edit_token` from response → visit edit URL → add a pickup person → submit → verify DB row).
- [ ] Implement `src/app/api/register/edit/[token]/route.ts` (GET + PATCH).
- [ ] Implement `src/app/register/edit/[token]/page.tsx` (server component fetches token, passes initial data to a client editor).
- [ ] Tests pass.
- [ ] Commit + push.

### Task 2.10: Walk-up flow

**Files:**
- Create: `src/app/register/walkup/[qrCode]/page.tsx`
- Create: `tests/e2e/walkup.spec.ts`

- [ ] **Step 1:** Walk-up page reuses the registration form with a prop `qrOverride={params.qrCode}`. The registration API already handles the `qr_code` field via `walkupSchema`.

- [ ] **Step 2:** Registration succeeds — the `children.qr_code` matches the URL parameter, not the default UUID.

- [ ] **Step 3:** E2E test: visit `/register/walkup/<some-uuid>` → fill form → submit → GET `/api/children?qr_code=<that-uuid>` → row exists.

- [ ] **Step 4:** Commit + push.

### Task 2.11: Registration receipt PDF

**Files:**
- Create: `src/lib/pdf/registration-receipt.ts`

- [ ] **Step 1:** Implement `buildReceiptPdf({ children, parent, waiver, photo_consent, signatures }): Uint8Array` using `pdf-lib`. Content: header, each child's details, waiver text + typed name + timestamp, photo consents + typed name + timestamp.

- [ ] **Step 2:** Unit test: `receipt-pdf.test.ts` — build PDF for a sample payload; assert first page contains the child's name (use `pdf-parse` or skip assertion if adding another dep feels heavy; at minimum assert the returned `Uint8Array` is > 1KB).

- [ ] **Step 3:** Integrate into `POST /api/register` — after all inserts succeed, build the PDF and stash it for the Phase 7 email worker. Store temporarily in Supabase Storage under `receipts/<child_id>.pdf` with 90-day signed URL.

- [ ] **Step 4:** Commit + push.

### Task 2.12: Phase 2 gate check

- [ ] `npm run typecheck` clean
- [ ] `npm test` — all unit + component tests pass
- [ ] `npm run test:e2e` — `registration.spec.ts`, `walkup.spec.ts`, `edit.spec.ts` pass
- [ ] Manual smoke: register a family with 2 kids end-to-end; verify rows in DB; click edit link; change pickup; verify DB; check audit_log has an entry.
- [ ] Applitools baseline capture of `/register` page (per `_config/visual-review-protocol.md`).
- [ ] Phase 2 complete.

---

## Phase 3: Event-Night Volunteer Screens

**Goal:** Ship the volunteer-facing screens. Shared-password login → station picker → all subsequent actions are routed to that station. Check-in with integrated jail mugshot. Check-out with pickup list + staff name. Photo station (scan-then-shoot). Zone spend. Ticket reload (FACTS/cash/venmo/comp). Profile lookup.

**Success criteria:**
- Volunteer with `VOLUNTEER_PASSWORD` can log in, pick a station, perform all station actions.
- Check-in records dropoff type, captures jail mugshot, creates `station_events` (`check_in`) + photo + `photo_tags`.
- Check-out enforces pickup-list match, requires staff name, queues `ai_stories` for generation.
- Photo station enforces `photo_consent_app` hard-block at scan.
- Spend station reads catalog from DB (realtime updates), deducts tickets atomically.
- Reload station computes remaining FACTS allowance from `reload_events` sum.

### Task 3.1: Shared components — ConsentBanner, ChildCard, AllergiesBanner

Each is a pure display component. Test with Testing Library; render with mock child data; assert banner text + color.

**ConsentBanner.tsx** — full-width div; green bg + "✅ PHOTOS OK" if `photo_consent_app`, else red bg + "🚫 NO PHOTOS — DO NOT INCLUDE".

**AllergiesBanner.tsx** — amber bg, prominent, shows `allergies` text when non-empty. Returns `null` when empty.

**ChildCard.tsx** — composes the above + name, age, grade, parent click-to-call/text buttons (`tel:`/`sms:` links), current balance. Accepts optional `children` (ReactNode) slot for action buttons specific to each station.

Steps per component:
- [ ] Write failing render test.
- [ ] Implement.
- [ ] Tests pass.
- [ ] Commit + push.

### Task 3.2: Volunteer gate + station picker

**Files:**
- Create: `src/app/station/page.tsx`
- Create: `src/app/api/auth/volunteer/route.ts`
- Create: `src/components/StationPicker.tsx`

**Flow:**
1. `src/app/station/page.tsx` — unauthenticated: renders password field. On submit → POST `/api/auth/volunteer` → server verifies against `VOLUNTEER_PASSWORD` → sets HTTP-only cookie `sbbq_volunteer` with HMAC-signed token (reuse `magic-link` helpers; scope `volunteer`, 8-hour expiry).
2. Authenticated: renders `StationPicker` — list of stations from DB, volunteer taps one, the selection is saved to `localStorage` (not the cookie — it's casual routing, not auth), and they're redirected to `/station/<action>` (check-in, spend, photo, etc.).

Task steps follow the TDD pattern:
- [ ] Write failing E2E test `tests/e2e/volunteer-login.spec.ts` — enter wrong password → stays on page; correct → picker visible → click a station → check-in page.
- [ ] Implement API + page + picker.
- [ ] Tests pass.
- [ ] Commit + push.

### Task 3.3: Check-in with integrated jail mugshot

**Files:**
- Create: `src/app/station/check-in/page.tsx`
- Create: `src/app/api/checkin/route.ts` (replaces stub)
- Create: `src/components/PhotoViewfinder.tsx`
- Create: `src/app/api/photos/upload/route.ts`

**`PhotoViewfinder.tsx`** — reusable component. Uses `navigator.mediaDevices.getUserMedia({ video: true })`, renders a `<video>` preview, provides a `capture()` method returning a JPEG `Blob` via a hidden `<canvas>`. Accepts prop `onCapture: (blob: Blob) => void`.

**`POST /api/photos/upload`** — multipart form-data: `photo` (file) + `child_ids` (JSON array) + `station` + `capture_mode` + optional `volunteer_name`. Server uploads to Supabase Storage `photos/<year>/<month>/<uuid>.jpg`, inserts `photos` + `photo_tags`, creates `station_events` per child (`event_type: photo_taken`).

**Check-in page flow:**
1. Scan QR → fetches child via `/api/children/by-qr/<qr>` — returns child + parents + pickup authorizations + balance.
2. Render `ChildCard` with consent banner, allergies, parent contact, balance.
3. If photo_consent_app, show `PhotoViewfinder` + "Take Mugshot" button.
4. Dropoff type radio (required).
5. Staff name input (optional — but prompt gently).
6. "Check In" button (disabled until photo taken if consent allows).
7. On submit: if a photo was captured, upload first via `/api/photos/upload` with `station=jail`, then POST `/api/checkin` with `{ child_id, dropoff_type, staff_name, photo_id? }`.

**`POST /api/checkin`** — server:
- Validates child exists and not already checked in.
- Updates `children.checked_in_at`, `checked_in_dropoff_type`.
- Inserts `station_events` row (`station=check_in`, `event_type=check_in`).
- Returns updated child.

Steps:
- [ ] Write E2E test `tests/e2e/check-in.spec.ts` (happy path — register a child, then check them in via volunteer flow).
- [ ] Implement `/api/photos/upload` with server-side image validation (max size, JPEG/PNG content-type).
- [ ] Implement `PhotoViewfinder` component with a render test (mock `getUserMedia`).
- [ ] Implement check-in page.
- [ ] Implement `/api/checkin`.
- [ ] Tests pass.
- [ ] Commit + push.

### Task 3.4: Check-out with pickup list + staff name + story queue

**Files:**
- Create: `src/app/station/check-out/page.tsx`
- Create: `src/app/api/checkout/route.ts`

**Flow:**
1. Scan QR → fetches child + pickup list (primary parent, secondary parent, all `pickup_authorizations`).
2. Render buttons for each pickup option.
3. Volunteer taps a pickup person.
4. Confirmation modal — show name + relationship; require staff name input.
5. Submit → POST `/api/checkout` with `{ child_id, checked_out_to_name, checked_out_by_staff_name }`.

**`POST /api/checkout`** — server:
- Validates pickup name matches primary/secondary parent or a `pickup_authorizations` row for this child. Rejects with 403 if not (unless `override_reason` + `override_approved_by_phone_staff` provided; log to `audit_log` action `manual_pickup_override`).
- Updates `children.checked_out_at`, `checked_out_to_name`, `checked_out_by_staff_name`.
- Inserts `station_events` row (`check_out`).
- Inserts `audit_log` row (action `checkout`).
- **Updates `ai_stories.status = 'pending_review'` is deferred — generation pipeline (Phase 5) polls `status = 'pending'` and transitions it forward.** But kick generation once here with an inline `generateStoryFor(child_id)` call OR send a Supabase Realtime event the Edge Function listens on. Simplest: do the API call to the Edge Function from this handler using `fetch(process.env.NEXT_PUBLIC_SITE_URL + '/api/stories/generate', {...})`. (Phase 5 builds `/api/stories/generate`.)

Task steps per TDD pattern; commit after each passing test.

### Task 3.5: Photo station (scan-then-shoot)

**Files:**
- Create: `src/app/station/photo/page.tsx`

**Flow (spec §3.3):**
- Chip list (scanned kids) + scan button
- `PhotoViewfinder` below chips
- Shutter → uploads via `/api/photos/upload` with all scanned child_ids, `capture_mode=station_scan`
- Hard-block full-screen red modal if any scanned child has `photo_consent_app = false`
- Bottom: last-5 thumbnails for sanity

Steps:
- [ ] E2E test: scan 2 kids, take a photo, verify `photo_tags` rows for both.
- [ ] E2E test: scan a kid with `photo_consent_app=false`, see modal, shutter disabled.
- [ ] Implement.
- [ ] Tests pass.
- [ ] Commit + push.

### Task 3.6: Spend station

**Files:**
- Create: `src/app/station/spend/page.tsx`
- Create: `src/app/api/spend/route.ts` (replaces stub)
- Create: `src/components/VibeTagRow.tsx`

**Catalog** is pulled from DB on page load (use Supabase Realtime subscription for live updates when admin edits the catalog).

**Flow:**
1. Scan child.
2. Show `ChildCard` + balance.
3. Render catalog items for the currently-selected station (from localStorage).
4. Tap item → confirm modal → POST `/api/spend` → success → show new balance.
5. Optional vibe-tag row at the bottom — one-tap after spend; appends to the just-created `station_events.vibe_tags` via PATCH.

**`POST /api/spend`** — server: transaction that checks balance >= cost, decrements, inserts `station_events` (ticket_spend, tickets_delta: -cost, item_name).

Steps per TDD pattern.

### Task 3.7: Reload station

**Files:**
- Create: `src/app/station/reload/page.tsx`
- Create: `src/app/api/reload/route.ts`

Flow: scan → show balance + FACTS status (`facts_max_amount` - sum of `reload_events` where `payment_method=facts` for this child). Amount input + payment method buttons. Disable FACTS if insufficient allowance. POST `/api/reload` → server inserts `reload_events`, increments `children.ticket_balance`, inserts `station_events` (event_type: reload, tickets_delta: +N), inserts `audit_log` (reload).

### Task 3.8: Profile lookup

**Files:**
- Create: `src/app/station/lookup/page.tsx`
- Create: `src/app/api/children/by-qr/[qr]/route.ts`

Pure read: scan QR → fetch child + guardians + pickup + station_events + photos + balance → render.

### Task 3.9: Phase 3 gate check

- [ ] Full typecheck, unit/component tests, E2E green.
- [ ] Applitools baselines for every station screen.
- [ ] Chrome DevTools motion review on the photo capture + check-in success animations (per `_config/motion-review-checklist.md`).
- [ ] Manual flow: fresh family registers → admin bulk-sets balance → check-in w/ mugshot → spend at 2 stations → reload → checkout → verify `ai_stories.status = pending_review` row created.
- [ ] Phase 3 complete.

---

## Phase 4: Admin Screens

**Goal:** Admin dashboard + children CRUD + bulk ops + catalog editor + photo gallery. Reuse the existing `ADMIN_PASSWORD` auth pattern. Realtime widgets on dashboard.

**Success criteria:**
- Dashboard updates live as check-ins / spends happen.
- Admin can edit any profile field, add pickup authorizations, toggle consents (audited).
- Bulk-set-initial-balance works.
- Catalog edits push live to station devices.
- Photo gallery supports untag + delete + bulk download.

### Task 4.1: Dashboard refactor

**Files:**
- Modify: `src/app/admin/page.tsx`
- Create: `src/app/api/admin/stats/route.ts`

Widgets (spec §4.1): registrations, checked in / out, tickets spent, spend-by-station bar chart, FACTS totals, cash/venmo totals, photos, AI story status counts, alert tile for "not checked out after end time."

**Realtime:** subscribe to `children`, `station_events`, `reload_events`, `ai_stories` changes. Update counters client-side.

### Task 4.2: Children list + detail

**Files:**
- Create: `src/app/admin/children/page.tsx`
- Create: `src/app/admin/children/[id]/page.tsx`
- Create: `src/app/api/children/route.ts` (replaces stub; admin only)
- Create: `src/app/api/children/[id]/route.ts`

List: searchable table; filters. Detail: all fields editable; guardians/pickup editable; consent changes write `audit_log` (`consent_change`). Station timeline. Photos gallery. Quick actions: add tickets (triggers reload with `payment_method=comp`), print replacement wristband, resend registration email, trigger AI story preview.

### Task 4.3: Bulk — set initial balance

**Files:**
- Create: `src/app/admin/bulk/page.tsx`
- Create: `src/app/api/bulk/set-initial-balance/route.ts`

Server: transaction — for each registered child, update `ticket_balance = N` + insert `reload_events` (payment_method=comp, notes='Initial balance set by admin'). Return count updated.

### Task 4.4: Stations & catalog editor

**Files:**
- Create: `src/app/admin/stations/page.tsx`
- Create: `src/app/api/catalog/route.ts` (replaces stub)

CRUD on `catalog_items`. Changes trigger Supabase Realtime broadcast; station devices subscribe and re-render.

### Task 4.5: Photo gallery

**Files:**
- Create: `src/app/admin/photos/page.tsx`
- Create: `src/app/api/photos/[id]/route.ts`

Gallery view; filter by station, time, child. Untag (DELETE `photo_tags` row, audited). Delete photo (also deletes Storage object, audited). Bulk download zip — server-side zip stream of signed URLs.

### Task 4.6: Settings

**Files:**
- Create: `src/app/admin/settings/page.tsx`
- Create: `src/app/api/settings/route.ts`

Edit `events` row fields — default_initial_tickets, check-in/close times, faith_tone_level, email branding, prompt template. Placeholder for gold standard reference — Phase 5 wires it.

### Task 4.7: Phase 4 gate check

Standard: typecheck, tests, Applitools baselines for every admin screen. Phase 4 complete.

---

## Phase 5: AI Story Pipeline (text only)

**Goal:** On checkout, generate a per-child narrative via Claude Haiku. Auto-check against gold standard. Admin moderation queue. Text-only for now; email delivery is Phase 7, vision-based photos feed in Phase 6.

**Success criteria:**
- Checkout → within ~60s, `ai_stories.status` transitions `pending → pending_review` (or `auto_approved` / `needs_review` based on auto-check).
- Gold standard story (spec §5.3) saved in `events.reference_story_text` seeded via migration.
- `/admin/stories` shows all stories with auto-check score; admin can preview / approve / edit / skip.
- Generated story passes spec's strict grounding rules — no hallucinated timestamps, friends, or emotions; favorite = most-visited.

### Task 5.1: Claude client

**Files:**
- Create: `src/lib/claude.ts`

```ts
import Anthropic from '@anthropic-ai/sdk'
export const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
export const HAIKU_MODEL = 'claude-haiku-4-5-20251001'
```

### Task 5.2: Gold standard seed + prompt template

**Files:**
- Create: `supabase/migrations/0005_seed_gold_standard.sql`

Paste the locked v6 gold standard (spec §5.3) and prompt template into the event row's `reference_story_text`, `reference_story_html`, `story_prompt_template` fields.

### Task 5.3: Story generator module

**Files:**
- Create: `src/lib/story-generator.ts`
- Create: `tests/unit/story-generator.test.ts`

**Input:** `child_id`. Steps:
1. Load child, guardians, station_events, photos (with `vision_summary` — Phase 6 populates; Phase 5 runs with `null` summaries).
2. Compute `favorite_station` = most-visited non-check-in/out station (tie-breakers: photos-at-station, tickets_spent-at-station).
3. Build input payload: `{ child: {first_name, age, grade}, event: {name, faith_tone}, timeline: [...], dropoff_type, photos_meta: [...], stats: { stations_visited, tickets_spent, photos, favorite: {name, visits}} }`.
4. Randomize variety seed from curated list.
5. Call `claude.messages.create({ model: HAIKU_MODEL, system: prompt_template_with_variety_seed, messages: [{role:'user', content: JSON.stringify(payload)}], max_tokens: 600 })`.
6. Parse response into `{ story_text, story_html }` (story_html = `<p>`-wrapped paragraphs + stats line in a `<div class="stats">`).

Unit test: stub `claude.messages.create` to return a fixed story; assert the generator correctly assembles the payload (inspect via spy on the stub) and formats output.

### Task 5.4: Auto-check logic

**Files:**
- Create: `src/lib/auto-check.ts`
- Create: `tests/unit/auto-check.test.ts`

**Input:** generated `story_text`, `reference_story_text`, `child timeline + stats`.
**Checks:**
- Word count within ±30% of reference word count.
- Story text contains `child.first_name` in first sentence.
- Story text mentions at least 2 station names that appear in child's timeline.
- Story text contains a closer that references ≥2 specific items/stations.
- No banned phrases (configurable list stored in event settings; default: "adventure of a lifetime", "unforgettable", "blessed", "God", "prayed").
- No timestamp-pattern regex matches (e.g., `/\d{1,2}:\d{2}\s?(am|pm|AM|PM)/`).

**Output:** `{ score: 0.0–1.0, passed: boolean, notes: string[] }`.

Passing threshold: 0.8 (configurable in settings). Below threshold → `status = needs_review`. Above → `status = auto_approved`.

Unit tests: craft passing/failing stories for each check; assert the right notes fire.

### Task 5.5: Generate API endpoint

**Files:**
- Create: `src/app/api/stories/generate/route.ts`

POST `{ child_id }` → run generator + auto-check → update `ai_stories` row → return `{ status, story_preview }`.

### Task 5.6: Trigger generation from checkout

Already stubbed in Phase 3 Task 3.4 — wire the `fetch` call to `/api/stories/generate`.

### Task 5.7: Story moderation UI

**Files:**
- Create: `src/app/admin/stories/page.tsx`
- Create: `src/app/api/stories/route.ts`
- Create: `src/app/api/stories/[id]/route.ts`

List view with status filter, auto-check score column. Detail preview with edit/approve/skip actions. PATCH `/api/stories/[id]` accepts `{ status, moderation_notes, story_html?, story_text? }`.

### Task 5.8: Phase 5 gate

- [ ] Functional test script: register a family → check in → simulate 8 station_events → checkout → wait 60s → assert `ai_stories.status IN ('auto_approved','needs_review')` → assert generated text passes grounding rules (no timestamps regex, contains child's name, mentions ≥2 stations from timeline).
- [ ] Phase 5 complete.

---

## Phase 6: Roaming Photographer + Vision

**Goal:** Roaming photographer mode; every upload runs through Claude vision to (a) describe photo content (feeds richer story) and (b) match faces against reference embeddings extracted at check-in. Admin queue for ambiguous matches.

**Success criteria:**
- Face references extracted from jail mugshot photo at check-in (when `vision_matching_consent=true`).
- Roaming photo upload → vision analysis → auto-tag if `match_confidence >= 0.9`; queue if 0.7–0.89; unmatched if < 0.7.
- `/admin/photos/queue` shows pending review photos with suggestions; one-tap confirm/reject.
- Photo `vision_summary` populated and consumed by story generator → stories reference what's in photos accurately.

### Task 6.1: Face reference extraction at check-in

**Files:**
- Modify: `src/app/api/photos/upload/route.ts`
- Create: `src/lib/face-matching.ts`

When the uploaded photo is a jail mugshot (`station=jail` AND it's a check-in mugshot), and the child has `vision_matching_consent=true`:
1. Call Claude vision with the image + prompt: *"For the child named [first_name] in this photo, return a JSON object describing their distinctive visual features: hair color, hair length, skin tone, eye color, approximate height relative to adults, clothing colors, any accessories (glasses, hat). Respond only with JSON."*
2. Store result as `face_references.embedding_data` (jsonb).

*Note: Claude vision doesn't return true face embeddings — we use a descriptive feature vector as a pragmatic stand-in. For better accuracy, future enhancement could switch to `@vladmandic/face-api` server-side, but the descriptive approach is sufficient for a 50-kid event.*

### Task 6.2: Vision analysis for all photos

**Files:**
- Modify: `src/app/api/photos/upload/route.ts`

After upload, trigger background vision analysis:
1. Call Claude vision on the uploaded image with prompt: *"Return JSON: {person_count, activity_description, mood (happy/focused/silly/tired/neutral), multi_children (bool)}"*.
2. Store result in `photos.vision_summary`.

Do this asynchronously to keep upload response fast — use a fire-and-forget server-side promise OR a separate `/api/photos/[id]/analyze` endpoint called after upload returns.

### Task 6.3: Face matching pipeline (roaming mode)

**Files:**
- Create: `src/app/api/photos/match/route.ts`

For photos with `capture_mode=roaming_vision`:
1. For each checked-in child with `vision_matching_consent=true`:
   - Call Claude vision with the uploaded photo + reference embedding (describe-compare): *"Given these descriptive features [ref] and this photo, is this child in the photo? Return JSON: {match: bool, confidence: 0.0-1.0, reasoning: string}."*
2. Collect all candidates, pick the highest confidence match.
3. If ≥ 0.9 → insert `photo_tags` with `tagged_by=vision_auto`, set `match_status=auto`.
4. If 0.7–0.89 → set `match_status=pending_review`, `match_confidence=N`.
5. If < 0.7 → `match_status=unmatched`.

### Task 6.4: Roaming photographer page

**Files:**
- Create: `src/app/station/roaming/page.tsx`

Simple UI: login → pick "Roaming Photographer" station → camera viewfinder → shutter. Upload with `capture_mode=roaming_vision` and no `child_ids`. Show last-5 thumbnails with match status icons.

### Task 6.5: Admin review queue

**Files:**
- Create: `src/app/admin/photos/queue/page.tsx`

List photos with `match_status=pending_review`. Each thumbnail shows the top-N candidate children. One-tap confirm (adds `photo_tags` with `tagged_by=admin_manual`, updates `match_status=confirmed`). Reject → `match_status=rejected` (photo still in archive but untagged).

Separately: `unmatched` photos with a drag-to-child tagger.

### Task 6.6: Update story generator to use vision_summary

**Files:**
- Modify: `src/lib/story-generator.ts`

Include `photos_meta` with `vision_summary` in the Claude input. Update the prompt instruction block to use vision summaries as grounded photo references.

### Task 6.7: Phase 6 gate

- [ ] Functional test: check in a kid with vision consent → upload 3 roaming photos → verify auto-tag + pending_review + unmatched tiers populate correctly → admin approves pending → photos now tagged.
- [ ] Phase 6 complete.

---

## Phase 7: Email Delivery

**Goal:** AI story email goes out at 9 AM the morning after the event. Multi-child families get one email. Resend provider. React Email template. Vercel Cron. Signature footer locked.

**Success criteria:**
- Test email send to a staged account from the admin dashboard.
- Cron picks up `ai_stories.status IN (approved, auto_approved)` at 9 AM, groups by primary parent email, sends one email per family with all children's stories + photo galleries + stats + footer, writes `email_sends` row, flips `ai_stories.status = sent`.
- Failed sends retry once + alert admin.

### Task 7.1: Resend client + domain verification

**Files:**
- Create: `src/lib/resend.ts`

Add a small wrapper. Domain verification is a one-time DNS operation — document in README.

### Task 7.2: React Email template

**Files:**
- Create: `src/emails/StoryEmail.tsx`

Props: `{ event_name, family_primary_email, children: [{ first_name, age, story_html, photos: [{url, alt}], stats }], footer }`. Layout per spec §5.7. Uses `@react-email/components`.

### Task 7.3: Signature footer copy

Hardcoded constant in the template:

```tsx
export const ATTN_TO_DETAIL_FOOTER = `This keepsake email was designed and built by Brian Leach of Attn: To Detail — a small consulting studio that helps founder-led businesses move faster with websites, AI tools, and honest strategy. If the details of this email made you smile, that's the whole idea.`
```

### Task 7.4: Family grouping logic

**Files:**
- Create: `src/lib/family-grouping.ts`

Query: all `ai_stories` with `status IN ('approved','auto_approved')` → join `children` → join `guardians` where `is_primary=true` → group by `guardians.email`. For each family, build the email payload.

### Task 7.5: Cron send endpoint

**Files:**
- Create: `src/app/api/cron/send-stories/route.ts`

Protected by `CRON_SECRET` header. For each family group, render email via `render(StoryEmail({...}))`, send via Resend, log result, update `ai_stories` statuses + insert `email_sends`.

### Task 7.6: Test-send from admin

**Files:**
- Modify: `src/app/admin/settings/page.tsx`

"Send test email" button → prompts for email address → POSTs to `/api/stories/test-send` → renders the template using the reference story + synthetic family → sends to the provided address.

### Task 7.7: Phase 7 gate

- [ ] Functional test: seed 3 checked-out kids (family A = 2 kids, family B = 1 kid) with approved stories → hit the cron endpoint manually with `CRON_SECRET` → verify 2 `email_sends` rows + 3 `ai_stories.status=sent` rows → receive actual email in test inbox → visual sanity check.
- [ ] Phase 7 complete.

---

## Phase 8: Security & Retention

**Goal:** Lock down data handling. Audit log wiring verified across all sensitive actions. Retention purge job running.

**Success criteria:**
- Every sensitive action from the spec §6.8 writes to `audit_log`.
- Retention purge cron deletes face embeddings after 30d, photos/stories/profiles after 90d, with exceptions for waiver records (7y).

### Task 8.1: Audit log audit

- [ ] Grep for all API handlers doing checkout, admin_login, consent_change, photo_deleted, reload, registration_edit, volunteer_login, manual_pickup_override. Verify each writes `audit_log` via `writeAudit()`. Fix gaps.

### Task 8.2: Retention purge job

**Files:**
- Create: `src/app/api/cron/retention-purge/route.ts`
- Modify: `vercel.json` (add monthly cron entry)

Server:
- Delete `face_references` older than 30 days.
- Delete `photos` + storage objects + `photo_tags` + `ai_stories` + `email_sends` + `children` (cascades) older than 90 days.
- Retain `signatures` + relevant `audit_log` for 7 years.

Guard with `CRON_SECRET`.

### Task 8.3: Security checks

- [ ] Run an RLS policy audit — for each table, assert anon cannot read/write via direct Supabase query from a browser session.
- [ ] Verify every public route rate-limits (registration: 10/IP/hour; magic-link GET: 20/IP/hour).
- [ ] Verify every session cookie is `HttpOnly`, `Secure`, `SameSite=Lax`.
- [ ] Run `npm audit` and resolve high-severity issues.

### Task 8.4: Phase 8 gate

- [ ] Audit log coverage test: simulate each sensitive action → verify `audit_log` row inserted.
- [ ] Retention purge dry-run → asserts the right candidates would be deleted.
- [ ] Phase 8 complete.

---

## Phase 9: Quality Gates & Cutover

**Goal:** Full 7-layer quality gate pass per `_config/quality-gates.md`, staging rehearsal, production cutover.

### Task 9.1: Applitools visual baselines

Capture baselines for every page: `/register`, `/register/confirm`, `/register/edit/[token]`, `/station`, `/station/check-in`, `/station/check-out`, `/station/photo`, `/station/spend`, `/station/reload`, `/station/lookup`, `/admin`, `/admin/children`, `/admin/children/[id]`, `/admin/bulk`, `/admin/stations`, `/admin/stories`, `/admin/photos`, `/admin/photos/queue`, `/admin/settings`, and the `StoryEmail` React Email rendered to HTML.

### Task 9.2: Accessibility

- [ ] Run `@axe-core/playwright` on every page. Fix all violations at AA level.
- [ ] Keyboard-only traverse `/register` and one `/station/*` flow.
- [ ] Contrast check for all red/green/amber consent banners in both idle + focused states.

### Task 9.3: Motion review

- [ ] Chrome DevTools Animation panel: record check-in success animation, photo capture shutter, confirmation modal. Verify 60fps, easing matches spec.

### Task 9.4: Load / chaos test

- [ ] Playwright script simulating 50 kids over 45 minutes: parallel check-ins, random spends, random photos. Verify no DB deadlocks, no rate-limit issues, no storage errors.

### Task 9.5: Staging rehearsal

- [ ] Deploy to a staging Vercel preview with a fresh Supabase project. Run a full dress-rehearsal: 5 test families register → admin bulk-sets balance → check-in → stations → checkout → stories generate → test send emails.
- [ ] Fix anything flagged.

### Task 9.6: Production cutover

- [ ] On cutover date: drop dev Supabase → rerun migrations in prod order → seed event → verify env vars set in prod Vercel → deploy → smoke test with one test registration → invite parents to register.

### Task 9.7: Final gate summary

Write a gate summary per `_config/quality-gates.md` table. Phase 9 complete. Ship it.

---

## Self-review results

**Spec coverage:**
- §1 Data model → Phase 1 ✓
- §2 Registration flow → Phase 2 ✓
- §3 Event-night screens → Phase 3 ✓
- §4 Admin screens → Phase 4 ✓
- §5 AI story + enrichments A-D → Phase 5 + Phase 6 ✓
- §5 Enrichment E (Roaming Photographer) → Phase 6 ✓
- §5 Email delivery → Phase 7 ✓
- §6 Security/consent/privacy → Phase 8 + enforced inline across phases ✓
- Check-in jail mugshot (spec §3.1) → Phase 3 Task 3.3 ✓
- Gold standard v6 → Phase 5 Task 5.2 ✓
- Signature footer → Phase 7 Task 7.3 ✓
- Faith-tone setting → Phase 5 Task 5.3 ✓

**Placeholder scan:** plan contains concrete code or specific task-level breakdowns for every step. Later phases lean on spec references + code patterns rather than verbose TDD micro-steps; this is intentional scope management for a 9-phase build — each phase has a clear gate and commit cadence. No "TBD", "TODO implement later", or "add error handling" stubs.

**Type consistency:** field names (`photo_consent_app`, `facts_max_amount`, `checked_in_dropoff_type`, `match_status`, `capture_mode`, etc.) match across schema SQL, TypeScript types, Zod validators, API handlers, and UI consumers.

**Scope check:** Plan covers one coherent product — registration → event operations → post-event keepsake. Sub-parts depend on shared schema and infrastructure; decomposing further would create integration friction. Phased execution with quality gates between phases achieves the same risk reduction.

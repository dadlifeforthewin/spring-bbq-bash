# Kid Profile Rebuild — STATUS

**Branch:** `kid-profile-rebuild` · **Last update:** 2026-04-19 (evening session — Resend live + registration email)
**Live:** https://spring-bbq-bash.vercel.app · **Event:** Saturday, April 25, 2026 (6 days out)
**Plan:** `docs/plans/2026-04-16-kid-profile-rebuild-plan.md` · **Spec:** `docs/specs/2026-04-16-kid-profile-rebuild-design.md`
**Vercel production branch:** `kid-profile-rebuild` (changed from `main` on 2026-04-19 — every push now auto-deploys to prod)

## Go-live status (2026-04-18 late evening)

Phases 1–7 of the plan are shipped. **Two visual rebuilds are now live**: the original D1–D9 glow pass, and on top of that a Glow Party design-system rebuild today (D10 landing + D11 registration) implementing the Claude Design handoff in `docs/design/`. The site represents Attn: To Detail's first public-facing project — donated to LCA for the event. Craft bar: everything the parents see needs to feel like it came from a real studio.

**What's live right now:**
- **Landing (`/`)** — Glow Party Edition: neon-sign hero (Monoton title with cyan/pink glow stack), live countdown to Apr 25 5pm PT, 4-up stat strip, wristband perks card (2 DRINKS / 3 JAIL / 1 SPIN / 1 DJ), CTA → /register. Full atmosphere: radial gradient + perspective synthwave grid floor + noise.
- **Parent flow (`/register`)** — fully restyled to the Glow Party design system. 5-step permission slip:
  1. **Parent** — neon card with cyan-tinted inputs
  2. **Children** — each kid gets a live `<WristbandPreview>` (name + grade + QR placeholder + 4 perk slots showing the locked ticket model)
  3. **Waiver** — verbatim LCA paper-slip "Permission and Release of Liability"
  4. **Photo permissions** — Backstage Pass treatment: 3 `<BigToggle>` rows + "{N} of 3 · You're on the list" status pill + expandable full LCA Photo/Video Release legal text
  5. **AI & data use** — yellow-accented neon card with the disclosure + **OPT IN / OPT OUT radio cards (no default — parent must actively choose)** + independent signature + ack checkbox
- **`/register/confirm`** — Marquee "YOU'RE IN" + per-kid gate-pass card with **REAL QR codes** (qrcode lib) + edit link + ICS calendar download + Print button + Apple Wallet placeholder. **P0 closed.**
- Volunteer portal at `/station` with emoji station picker and a unified `/station/activity` endpoint for drinks, jail, prize wheel, DJ, and free-visit logging.
- Admin at `/admin` with dark-mode dashboard, children list showing per-kid perks, story moderation, photo queue, settings.
- Keepsake email template (`src/emails/StoryEmail.tsx`) — dark hero, Unbounded wordmark, per-child block with photo grid + stats pill + A2D signature footer. Not yet wired to a real inbox (`RESEND_API_KEY` empty).
- **AI opt-out is real, not theater.** `children.ai_consent_granted` (migration 0009) is enforced at every AI touchpoint: story generator early-returns `{skipped: true, reason: 'ai_opted_out'}` before any Anthropic call; photo upload skips face description; photo match candidate query filters opted-out kids; register API doesn't even pre-queue an `ai_stories` row for opted-out kids → no row → no keepsake email for them.

**Ticket model (locked):** every kid starts with 2 drink tickets, 3 jail/pass tickets (one bucket, two uses), 1 prize wheel spin, 1 DJ shoutout. Free stations just log a visit for the keepsake email.

**Credentials:** volunteer password `SpringBBQ2026$` · admin password `LCAadmin2026$` (both in `.env.local` + Vercel env).

## Before the event (Saturday, April 25) — critical path

Ordered by urgency. **#1 is the new P0 (discovered 2026-04-18 during runbook audit).** The first four are non-negotiable; skip any of them and the event has a real problem.

1. ✅ **DONE 2026-04-18 (was P0).** `/register/confirm` renders real per-kid QR codes. Parents leave registration with a printable gate-pass per child + an edit link. Apple Wallet `.pkpass` generation still a placeholder button.
2. ✅ **DONE 2026-04-19 (evening).** Resend email pipe live end-to-end. Sending domain `attntodetail.ai` verified at Resend (SPF + DKIM + MX + DMARC, all pass, `p=none` DMARC policy, iCloud landed to inbox with `dmarc=pass`). `RESEND_API_KEY` + `EMAIL_FROM=Brian Leach <brian@attntodetail.ai>` + `CRON_SECRET` all set on Vercel production. **Keepsake email** (StoryEmail.tsx) tested end-to-end, subject + body render clean, date polished to "Saturday, April 25, 2026". **Registration confirmation email** (RegistrationConfirmationEmail.tsx) now wired into `/api/register` — parents get per-kid QR codes + edit link + event info immediately on submit, records to `email_sends`. Not yet stress-tested with a real submit from Brian's burner inbox (see #3).
3. **Full manual dry-run on a real phone.** Runbook reconciled 2026-04-19 to match shipped state. Test family → `/register` (confirms new confirmation email arrives) → check-in with jail mugshot → visit 5+ stations → check out → confirm story generates via `/admin/stories` (now auto-polls every 10s while pending, plus Refresh button) → confirm keepsake email via `/admin/settings` test-send. **Step-by-step:** `docs/runbooks/event-dry-run.md`. Run by Tuesday April 21.
4. **Volunteer device setup.** Each station gets a tablet/phone, logged into `/station`, station slug picked (stored in `localStorage`). Print one cheat-sheet per volunteer. **Print-ready:** `docs/runbooks/volunteer-cheatsheet.md`.
5. **Wristband printing.** Blank QR wristbands pre-printed in batches of ~20 for walk-up registrations (see spec §2 walk-up flow). Confirm the QR decoder reads them at event-lighting.

**✅ DONE 2026-04-18 (was critical-path #1):** Real LCA permission slip waiver text now lives in `WaiverSection.tsx` (verbatim from LCA paper). New `AISection.tsx` adds the AI & data use disclosure as Step 5. `PhotoConsentSection.tsx` exposes the full LCA Photo/Video Release legal text via an expandable `<details>`. Migration 0007 adds `'ai_consent'` to the signature_type CHECK; API writes 3 signature rows per registration.

## Nice-to-have before the event

6. **Replace the text event header in the keepsake email with LCA's actual logo as an image** (`email_logo_url` in `/admin/settings`). Wiring is verified end-to-end (DB column + settings UI + API + email template all work). Brian sources the crest + pastes the URL. **Step-by-step:** `docs/runbooks/lca-logo-setup.md`.
7. ✅ **DONE 2026-04-18.** `events.reference_story_text` reseeded with a fictional Olivia Bennett story across 7 real seeded stations (~205 words). Migration 0008 applied. Auto-check rules verified (word count, opener mentions child, ≥2 stations in opener+closer, no banned phrases, no timestamps).
8. Applitools baseline capture for the parent flow + email (enables regression detection post-event).
9. Swap the teaser-email copy to final voice once the reveal is confirmed okay. Current copy is the "surprise" direction Brian approved.

## What landed in the 2026-04-19 evening session (committed + pushed + live)

Six commits on `kid-profile-rebuild`, all auto-deployed to production:

| SHA | Subject |
|---|---|
| `f2f6db0` | `/admin/stories` — 10s auto-poll while any row pending + visible Refresh button (was audit finding from 2026-04-18 runbook pass) |
| `ff1e539` | Resend runbook rewritten for `attntodetail.ai` (Brian owns DNS, dropped LCA-coordination framing); `.env.example` + `resend.ts` error text updated |
| `dd9ce80` | Email event_date formats as "Saturday, April 25, 2026" instead of raw `2026-04-25` |
| `c6b58dc` | `/register/confirm` contact swapped from placeholder `events@lcalincoln.com` → `brian@attntodetail.ai` (3 places + ICS UID); dry-run runbook reconciled with strikethroughs on shipped items |
| `72bd931` | `/api/register` sends confirmation email with per-kid QR codes + edit link (closes the "Confirmation sent to {email}" truthfulness gap) |
| `9e53ea8` | `.gitignore`: ignore `.superpowers/` (local brainstorm mockups) |

Key operational outcome: **the email pipeline has carried two successful test sends to iCloud inbox**, authenticated (`dmarc=pass`, `dkim=pass` on both the Resend and SES signatures, `spf=pass`). DMARC is in monitor-only mode (`p=none`) so aggregate reports flow to brian@attntodetail.ai — can tighten to `quarantine` after reports confirm alignment, which also unlocks BIMI.

Also during this session: **Vercel's Production Branch was flipped from `main` to `kid-profile-rebuild`**. Previously every push only created Preview URLs; this had caused the first post-env-var push to silently not-deploy. Now every `git push origin kid-profile-rebuild` auto-deploys to `spring-bbq-bash.vercel.app`. No manual promote step.

## What landed in the 2026-04-18 evening session (committed + pushed)

Four commits on `kid-profile-rebuild`, all pushed:

| SHA | Subject |
|---|---|
| `155680c` | docs: drop Claude Design handoff bundle (Glow Party + Parent Registration concepts) |
| `d98b3d3` | design(D10): Glow Party landing page — neon hero + countdown + wristband perks |
| `1808d63` | design(D11) + feat: Parent Registration neon rebuild + Marquee confirm + AI opt-out |
| (this commit) | docs: STATUS update reflecting D10/D11 + opt-out work |

Key gotcha discovered: Tailwind v3 preflight uses `input[type='text']` selectors (specificity 0,1,1) which beat a plain CSS Module `.input` class (0,1,0). Textareas got the new style; text inputs didn't. Fix: chain the element name (`input.input`) so the rule ties at 0,1,1 and wins on source order. Same gotcha will hit any future surface that styles inputs via CSS Modules — chain the element name preemptively.

## Pre-event audit findings (2026-04-18)

Surfaced during the runbook write-up by an agent reading the live code against this STATUS.md. P0 is already promoted to critical-path #1 above. Other findings:

- **Stories list (`/admin/stories`) doesn't auto-refresh.** `useEffect` only fires on `[status]` change. After checkout the AI story takes 30–60s to render and the page won't reflect it without a manual reload — risk of an admin assuming generation broke on event night. Fix: 10s poll while any rows are `pending`, or a visible "Refresh" button in the toolbar. Estimate: 15 min.
- **Reload only adds drink tickets.** By design (`ReloadStation` subtitle copy is explicit), but volunteers will hear "I want more jail passes / DJ shoutouts" — the cheat-sheet covers this with a "tell them no, refer to admin for comp" line, but worth being loud about during volunteer briefing.
- **Vision matching may produce more `pending_review` than `auto`** for sibling/lookalike kids — Claude vision returns descriptive features, not biometric embeddings. Plan: ~15 minutes Sunday morning admin time to clear `/admin/photos/queue` before the 9 AM Pacific cron fires the keepsake emails.
- **Stale doc cleanup:** `Deviations #8` below originally said `jail → /station/photo (when built)` — current code routes `jail → /station/activity` and `/station/spend` is itself a redirect to `/station/activity`. Updated below.

## Post-event / longer-term

- **Phase 8** — audit log sweep (verify every sensitive action writes to `audit_log`) + retention purge cron (face embeddings at 30 days, photos/stories/profiles at 90 days, waiver records at 7 years).
- **Phase 4 admin quick-actions** — "Add tickets" (comp reload shortcut), "Resend email", "Trigger story preview" on `/admin/children/[id]` — skeletons only right now.
- **Legacy page cleanup** — `/admin/catalog`, `/admin/tickets`, `/admin/wristbands`, `/checkin`, `/zone/*` from the pre-rebuild era still exist with the old `sbbq_auth` cookie. Either delete or route to the new equivalents.
- **Supabase Realtime** — dashboard + catalog currently poll every 5s. Realtime channels would be instant.
- **Bulk photo ZIP download** — plan 4.5 called for a server-side ZIP stream; "Download all photos" button in the keepsake email links to `null` currently.
- **Vision match batching + retry** — per Phase 6 follow-ups; cost optimization.
- **Roaming-photo drag-to-tag** for the `unmatched` filter in `/admin/photos/queue` — currently says "coming soon".

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
- **Phase 6 — Roaming Photographer + Vision:** ✅ complete (7/7)
  - ✅ 6.1 Face reference extraction — `src/lib/face-matching.ts` (`describeFace`) + upload route: when station=jail + vision_matching_consent=true, fire-and-forget writes `face_references.embedding_data`.
  - ✅ 6.2 Vision summary — `summarizeVision()` called in background on every upload; writes `photos.vision_summary`.
  - ✅ 6.3 Match pipeline — `POST /api/photos/match` loops consented, checked-in kids, calls `scoreMatch` per candidate, classifies by confidence (≥0.9 auto-tag · 0.7–0.89 pending_review · <0.7 unmatched). Kicked off in background from upload for `roaming_vision`.
  - ✅ 6.4 `/station/roaming` — `PhotoViewfinder` + upload with `capture_mode=roaming_vision` + empty `child_ids`; polls `/api/admin/photos/status` for outcome.
  - ✅ 6.5 `/admin/photos/queue` — filter by match_status; one-tap confirm / reject; writes `photo_tags` with `tagged_by=admin_manual` + audit log.
  - ✅ 6.6 Story generator uses `vision_summary` — already flows through `photos_meta[]`; seeded prompt tells Claude to acknowledge photos using vision descriptions only.
  - ✅ 6.7 Gate: `tests/e2e/vision.spec.ts` — checks in a consenting kid, uploads mugshot + roaming photo, polls until status ∈ `{auto, pending_review, unmatched}`; second test locks in the `station_scan` regression guard. **25/25 E2E now green**.
- **Phase 7 — Email Delivery:** ✅ complete (7/7)
  - ✅ 7.1 `src/lib/resend.ts` — lazy Resend client + `emailFrom()` helper (throws if env missing so misconfigured envs fail loudly).
  - ✅ 7.2 `src/emails/StoryEmail.tsx` — React Email template: event header, per-child block with story HTML + photo grid + stats line, "Download all photos" CTA, signature footer, fine-print row with reply-to + unsubscribe. `subjectForFamily()` handles singular vs plural subjects.
  - ✅ 7.3 `ATTN_TO_DETAIL_FOOTER` exported from the template so the copy only lives in one place.
  - ✅ 7.4 `src/lib/family-grouping.ts` — `collectReadyFamilies()` pulls stories with `status IN ('approved','auto_approved')`, joins primary guardian email + photo tags, signs photo URLs for 7 days, returns payloads grouped by primary parent email.
  - ✅ 7.5 `POST /api/cron/send-stories` — gated on `x-cron-secret` header (or `Authorization: Bearer`), renders via `@react-email/render`, sends via Resend, rate-limits to ~9/sec, writes `email_sends` rows + flips `ai_stories.status = sent` on success / records `error` on failure. `vercel.json` already schedules it at `0 16 * * *` UTC (9 AM Pacific).
  - ✅ 7.6 `POST /api/stories/test-send` (admin-gated) + "Send test email" block in `/admin/settings` with HTML preview link. `GET /api/stories/preview` renders the template with a synthetic payload.
  - ✅ 7.7 Gate: `tests/e2e/send-stories.spec.ts` — (a) cron auth rejects wrong secret, (b) full pipeline: register 3 kids across 2 families → admin marks stories `auto_approved` → hit cron with `CRON_SECRET` → expect `families >= 2` and `sent + failed === families`. Happy path auto-skips until `CRON_SECRET` is set. **26/26 E2E now green**.

## Phase 7 follow-ups (deferred)

1. **Resend domain verification + DNS** — SPF / DKIM / DMARC setup is a one-time infra step. Document in README when the sending domain is decided.
2. **`RESEND_API_KEY`, `EMAIL_FROM`, `CRON_SECRET`** — still empty in `.env.local`. Fill before the event and re-run `tests/e2e/send-stories.spec.ts` for a live dry run; do a manual test send to a burner inbox for the visual sanity check.
3. **Failure retry** — the spec calls for "retry once after 5 minutes; flag in admin dashboard if still failing." Current code records `status='failed'` + `error`. Add a retry job that re-picks failed `email_sends` once and surfaces persistent failures in the admin dashboard.
4. **Signed zip download** — the "Download all photos" button links to `download_all_url`, but the route isn't built yet (related to Phase 4 follow-up #3). Pass `null` for now and the button just hides.
5. **Unsubscribe link** — currently rendered if `unsubscribe_url` is supplied. No unsubscribe handler yet; low priority for a one-night event.

## Phase 6 follow-ups (deferred)

1. **Real face matching quality** — Claude vision returns descriptive features, not embeddings. Works for a 50-kid event with diverse appearance; for larger scale or similar-looking kids, plan fallback: `@vladmandic/face-api` server-side.
2. **Unmatched drag-to-child tagger** — `/admin/photos/queue` `unmatched` filter says "tag manually below (coming soon)". Add dropdown/autocomplete to pick a checked-in kid and write `photo_tags` with `tagged_by=admin_manual`.
3. **Match retry queue** — if `scoreMatch` throws (rate limit, transient 500), the candidate is skipped. Add a retry channel that re-runs the pipeline for a photo.
4. **Match batching** — each candidate is a separate Claude call today. For dense roaming sessions, batch candidate comparisons into one prompt to cut cost.
5. **Real photo fixtures in vision E2E** — `tests/e2e/vision.spec.ts` uses a 1x1 JPEG that Claude can't process. Test validates pipeline structure; swap in real portraits later for a meaningful quality check.

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
8. **StationPicker routing (updated 2026-04-18)** — `check_in` → `/station/check-in`, `check_out` → `/station/check-out`, `photo` → `/station/photo`, `roaming` → `/station/roaming`, everything else (drinks, jail, prize_wheel, dj_shoutout, free stations) → `/station/activity`. Note: `/station/spend` exists as a redirect to `/station/activity` for any old links.
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
2. **6 days to event.** First click "Critical path" above. P0 #1 (registration confirm page has no QR codes) is the active shipping blocker; everything else has a runbook in `docs/runbooks/` to walk through.
3. **For the P0 fix:** read `src/app/register/confirm/page.tsx` + `src/app/api/register/route.ts`. The API already returns `{ created, edit_token }`; the confirm page just needs to consume it. Quickest path: render one QR per kid + a "Print this page" button, plus the edit link. Then layer in the Resend-backed receipt email once Resend is verified.
4. **For email setup:** `docs/runbooks/resend-setup.md`.
5. **For the dry-run:** `docs/runbooks/event-dry-run.md` (run by Tuesday April 21).
6. **For volunteer briefing:** print `docs/runbooks/volunteer-cheatsheet.md` one per station.
7. Run `git status` from `/Users/brianleach/projects/spring_bbq/spring-bbq-bash` to confirm clean state before starting.
8. Per-task pattern: failing test → implement → tests pass → typecheck → commit + push → update this file.

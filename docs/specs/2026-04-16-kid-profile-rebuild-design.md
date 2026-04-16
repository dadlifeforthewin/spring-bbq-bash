# Spring BBQ Bash — Kid Profile Rebuild

**Event:** LCA Spring BBQ Glow Party Bash · April 25, 2026
**Status:** Design — approved sections 1-6; implementation plan pending
**Approach:** Refactor-in-place on existing Next.js + Supabase + Vercel stack
**Date:** 2026-04-16

---

## Summary

The existing Spring BBQ app is ticket-centric — each admission is a "ticket" with a QR wristband and a spending balance. This rebuild inverts the model so the child is the primary entity. Every feature hangs off a kid's profile: check-in/out with an approved-pickup list, parent contact, digital ticket balance (replacing physical tickets), photo capture at stations and by a roaming photographer, and a next-morning AI story email that tells parents the story of their child's night with photos embedded.

Existing infrastructure (Supabase auth, admin dashboard pattern, station UIs, Vercel deploy) is preserved. The ntfy.sh push layer is removed — parent contact happens via click-to-call/text on the staff device. New features (registration/permission slip, photo pipeline, FACTS reload, AI story, email delivery) are additive.

---

## Approach decision

**Chosen: Refactor-in-place.** Schema is reshaped around `children` as the primary entity; working infrastructure is preserved; UI is rebuilt screen-by-screen on top of the new model. Rejected alternatives:
- **Incremental bolt-on** — leaves two competing mental models (tickets + children) fighting forever.
- **Ground-up rebuild** — throws away working Supabase/auth/deploy/print scaffolding for no gain.

---

## Section 1 — Data Model

### Tables

**`events`** — singleton per annual event, editable pre-event.
- `id`, `name`, `event_date`, `check_in_opens_at`, `check_in_closes_at`, `ends_at`
- `default_initial_tickets` (admin-configurable before event)
- `faith_tone_level` (enum: `strong` / `subtle` / `off`; default `strong`)
- `reference_story_html`, `reference_story_text` (the locked gold standard, for prompt calibration and auto-check comparison)

**`children`** — primary entity (replaces legacy `tickets`).
- `id`, `event_id`, `qr_code` (UUID, unique, non-guessable)
- `first_name`, `last_name`, `age`, `grade`, `tier` (default `vip` for 2026; schema allows future tier variation)
- `allergies`, `special_instructions` *(no `medications` field — out of scope)*
- `photo_consent_app` (bool), `photo_consent_promo` (bool), `vision_matching_consent` (bool, default false)
- `facts_reload_permission` (bool), `facts_max_amount` (int, 0–10, default 10)
- `ticket_balance` (int, currently available)
- `checked_in_at`, `checked_in_dropoff_type` (enum: `both_parents` / `one_parent` / `grandparent` / `other_approved_adult`)
- `checked_out_at`, `checked_out_to_name`, `checked_out_by_staff_name`
- `created_at`, `updated_at`

**`guardians`** — parent/guardian contacts (1..N per child).
- `id`, `child_id`, `name`, `phone`, `email`, `is_primary` (bool)

**`pickup_authorizations`** — additional approved pickup persons per child.
- `id`, `child_id`, `name`, `relationship` (optional; free text)

**`station_events`** — append-only timeline of every child interaction. Single source of truth for the AI story.
- `id`, `child_id`, `station` (enum: `jail`, `cornhole`, `face_painting`, `arts_crafts`, `prize_wheel`, `video_games`, `dance_competition`, `quiet_corner`, `pizza`, `cake_walk`, `check_in`, `check_out`, `photo`, `reload`)
- `event_type` (enum: `ticket_spend`, `photo_taken`, `check_in`, `check_out`, `reload`)
- `tickets_delta` (int; negative for spend, positive for reload, 0 for neutral)
- `item_name` (optional; e.g., "Butterfly — full face")
- `vibe_tags` (array of enum: `group`, `won`, `big_laugh`, `first_try`, `hesitant`; optional one-tap tagging by volunteers)
- `volunteer_name` (optional free-text), `notes` (optional free-text)
- `created_at`

**`photos`** — metadata for photos stored in Supabase Storage.
- `id`, `storage_path`, `taken_at`, `volunteer_name`
- `capture_mode` (enum: `station_scan` / `roaming_vision`)
- `vision_summary` (JSONB; populated by Claude vision at upload: `{ person_count, activity, mood, multi_children }`)
- `match_confidence` (numeric 0.0–1.0; only populated for roaming mode)
- `match_status` (enum: `auto` / `pending_review` / `unmatched` / `confirmed` / `rejected`)

**`photo_tags`** — many-to-many; one photo may tag multiple children.
- `id`, `photo_id`, `child_id`, `tagged_by` (enum: `scan` / `vision_auto` / `admin_manual`), `created_at`

**`face_references`** — per-child face embeddings extracted from check-in photos; used only for vision matching.
- `id`, `child_id`, `reference_photo_id`, `embedding_data`, `created_at`
- Deleted 30 days post-event (automated).

**`reload_events`** — ticket reloads (separate from `station_events` for payment reconciliation).
- `id`, `child_id`, `tickets_added`, `payment_method` (enum: `facts` / `cash` / `venmo` / `comp`), `amount_charged`, `staff_name`, `created_at`

**`ai_stories`** — one row per child.
- `id`, `child_id`, `generated_at`, `status` (enum: `pending` / `pending_review` / `needs_review` / `approved` / `auto_approved` / `sent` / `skipped`)
- `story_html`, `story_text`, `photo_count`
- `sent_at`, `delivery_email`, `moderation_notes` (admin edits before send)

**`email_sends`** — groups per-child stories by family for delivery.
- `id`, `primary_parent_email`, `child_ids` (array), `sent_at`, `status`, `resend_message_id`

**`signatures`** — immutable record of digital signatures on waivers/consents.
- `id`, `child_id`, `signature_type` (enum: `liability_waiver` / `photo_consent`), `typed_name`, `signed_at`, `ip_address`, `user_agent`

**`audit_log`** — append-only log for sensitive actions.
- `id`, `action` (enum: `checkout` / `admin_login` / `consent_change` / `photo_deleted` / `reload` / `registration_edit`)
- `actor` (staff name or `parent`), `target_type`, `target_id`, `details` (JSONB), `ip_address`, `created_at`

### Relationships

- Child has many guardians, pickup_authorizations, station_events, photo_tags, reload_events; one ai_story; one face_references entry.
- Photo has many photo_tags.
- `station_events` is the chronological feed that powers both the admin timeline view and the AI story input.

### Row Level Security

- RLS enabled on every table.
- `anon` role has zero read/write on any child-related data.
- Public write access only to the registration endpoint (rate-limited + honeypot).
- Admin/volunteer access mediated by server-side API routes that check session tokens before querying.

---

## Section 2 — Registration Flow (Digital Permission Slip)

**Route:** `/register` (public, no auth).

### Form structure (single-page, multi-child support)

**Step 1 — Parent/Guardian Information** *(collected once per family)*
- Primary parent: name, phone, email *(required — AI story delivery depends on this)*
- "Add secondary parent" → name, phone, email (all optional)

**Step 2 — Child Information** *(repeats; "Add another child" button appends a new child block)*
For each child:
- First name, last name, age, grade
- Allergies or medical conditions (optional free-text)
- Special instructions (optional free-text)
- Approved pickup list — dynamic rows: name + optional relationship (Grandma, Aunt Sarah, etc.); primary + secondary parent are auto-included, not re-entered
- FACTS reload authorization: Yes/No; if Yes, per-child amount input (default $10, min $0, max $10)

**Step 3 — Permission & Liability Waiver** *(once per family)*
- Full waiver text in scrollable block (copied from LCA paper slip)
- Required: typed full name + checkbox acknowledging electronic signature
- Auto-captured: timestamp, IP, user agent → written to `signatures` (type `liability_waiver`)

**Step 4 — Photo Permissions** *(once per family; applies to all children unless overridden per-child)*
- `photo_consent_app` — required choice (Yes/No): "Include my child in photo memories — photos taken at the event will be included in the keepsake email the next morning."
- `photo_consent_promo` — required choice (Yes/No): "I also give permission for photos or videos of my child to be used for LCA promotional or social media purposes."
- `vision_matching_consent` — optional opt-in (default OFF): "Allow our roaming photographer to auto-identify my child in photos using face recognition. This means more candid shots of your child in the keepsake email without staff stopping them to scan their wristband. Face data stays on our servers and is deleted 30 days after the event."
- Required: typed full name + checkbox → written to `signatures` (type `photo_consent`)

**Step 5 — Teaser copy** *(above submit button)*
> *"A special surprise will land in your inbox the morning after the event. Keep an eye out!"*

### Submit behavior

- Server validates required fields.
- Writes `children` (one row per child), `guardians`, `pickup_authorizations`, `signatures`.
- Generates unique UUID `qr_code` per child.
- Emails primary parent a receipt with signed waiver PDF attached + magic link to edit.
- Displays confirmation page: "You're registered! Wristbands ready at check-in on April 25."

### Edit-after-submit

- Magic link in the receipt email opens `/register/edit/:token`.
- Signed token: 30-day expiration, 5-use limit.
- Parent can edit pickup list, contact info, FACTS amount, consents.
- Child name, age, waiver, signatures are **read-only after submit** — changes require contact with school admin.
- Every edit writes to `audit_log` (action: `registration_edit`).

### Walk-up / at-door flow

- Blank QR wristbands pre-printed in a batch of ~20 at the check-in table.
- Parent takes a blank wristband, scans the QR on a tablet → same registration form opens with the `qr_code` already bound to the URL.
- Full waiver required — no shortened form.
- On submit, the wristband is now linked to the child and the kid can be immediately checked in on the same device.

---

## Section 3 — Event-Night Screens

All event-night routes live under `/station` and require the shared `VOLUNTEER_PASSWORD`. After login, volunteers see a **station picker** — they tap their current station (Cornhole, Pizza, etc.) and all subsequent actions are routed to that station's context.

### 3.1 Check-In (`/station/check-in`)

The check-in station is **co-located with the jail set**. Every kid takes the jail mugshot as part of checking in — this guarantees every child has at least one photo in their AI story.

1. Volunteer scans child's QR (or types name to search for damaged-wristband fallback). For families with multiple kids, volunteer can scan additional siblings to add them to the same check-in batch (they share the mugshot).
2. Child card(s) display:
   - **Full-width consent banner** (top):
     - Green ✅ "PHOTOS OK" — `photo_consent_app = true`
     - Red 🚫 "NO PHOTOS — DO NOT INCLUDE" — `photo_consent_app = false`
   - Name, age, grade
   - **Allergies banner** — big yellow/amber bar if allergies present
   - Parent contact: primary parent name + two buttons (📞 Call, 💬 Text) using `tel:` and `sms:`
   - Ticket balance (initial amount set by admin)
   - Card border color: green (photos OK) / red (no photos) / amber (app-only, no promo)
3. **Dropoff type tap** (required): `Both parents` / `One parent` / `Grandparent` / `Other approved adult` — shared across the batch.
4. **Take the jail mugshot:**
   - Camera viewfinder activates.
   - Parent(s) + kid(s) pose in the jail set.
   - Shutter → capture → uploads to Supabase Storage → creates `photos` row (`capture_mode: station_scan`) + `photo_tags` for each child in the batch + `station_events` (`station: jail`, `event_type: photo_taken`) for each child.
   - If any child in the batch has `photo_consent_app = false`, mugshot step is skipped (full red modal explains why); check-in still completes.
   - "Retake" option before confirming.
5. **"Check In"** button (large, green) after photo confirmed.
6. On tap: writes `checked_in_at`, `checked_in_dropoff_type`, and a `station_events` row (`station: check_in`) for each child in the batch.
7. Success animation; volunteer moves to next family.

### 3.2 Check-Out (`/station/check-out`)

1. Volunteer scans child's QR.
2. Child card displays (same as check-in).
3. **Approved pickup panel:**
   - Header: "Who is picking up [child name]?"
   - Buttons for: primary parent, secondary parent (if present), each row from `pickup_authorizations`.
   - Each button shows name + relationship ("Grandma Carol", "Aunt Sarah").
4. Volunteer taps the pickup person.
5. **Staff name input** (required) — volunteer types their name before confirmation.
6. Confirmation modal: "Confirm checkout of [child name] to [pickup person]?"
7. On confirm: writes `checked_out_at`, `checked_out_to_name`, `checked_out_by_staff_name`; writes `station_events` row (`check_out`); writes `audit_log` row; **queues `ai_stories` row with status `pending`**.

**Edge case — not on list:** "Not on the list?" button shows red alert: "Do not release child. Contact parent first." + Call Parent button. If parent authorizes on call, staff can type new name + select "approved by phone by [staff name]" flag; logged in audit.

### 3.3 Photo Station — Fixed / Scan-Then-Shoot (`/station/photo`)

1. Top chip row: scanned-kids list (empty to start) + big "📷 Scan Kid" button.
2. Volunteer scans 1+ kids → each adds a chip with thumbnail + (×) to remove.
3. Camera viewfinder below chips (uses `navigator.mediaDevices.getUserMedia`).
4. Shutter button → captures → uploads to Supabase Storage → creates `photos` row (`capture_mode: station_scan`) + `photo_tags` per kid → writes `station_events` per kid (`event_type: photo_taken`).
5. Volunteer can keep shooting (same batch persists) OR tap "Clear batch" to reset.
6. Last 5 photos display as thumbnails at bottom for quick sanity-check.

**Consent hard guard:** If any scanned kid has `photo_consent_app = false`, full-screen red modal: "This child cannot be photographed. Remove from batch to continue." Shutter disabled until removed. No override.

### 3.4 Photo Station — Roaming Photographer (`/station/roaming`)

New mode. One dedicated volunteer per event.
1. Photographer enters photo mode. No scanning required.
2. Photos captured → uploaded → **each photo runs through Claude vision in the background**:
   - Vision describes content (person count, activity, mood, multi-children present).
   - Face matching compares against stored `face_references` for all checked-in kids where `vision_matching_consent = true`.
   - Match confidence calculated per candidate.
3. Routing:
   - **≥ 90% confidence** — auto-attached to child's profile; `match_status: auto`.
   - **70–89% confidence** — queued for admin review; `match_status: pending_review`.
   - **< 70% or no match** — `match_status: unmatched`; admin can manually tag later.
4. Admin review UI (`/admin/photos/queue`): thumbnails + vision-suggested child(ren) + one-tap confirm/reject.

### 3.5 Zone Spend (`/station/spend`)

1. Volunteer at any station scans child.
2. Child card + balance.
3. Station's item menu (configurable in `/admin/stations`):
   - e.g., Cornhole: "Game — 2 tickets"
   - e.g., Pizza: "Slice — 2 tickets", "Drink — 1 ticket"
   - e.g., Face Painting: "Small design — 3 tickets", "Full face — 5 tickets"
4. Volunteer taps the item.
5. Sufficient balance → deducts tickets → writes `station_events` (`event_type: ticket_spend`, `tickets_delta: -N`, `item_name`).
6. Insufficient balance → red banner "Insufficient tickets" + suggestion to send parent to ticket reload desk.
7. Optional one-tap vibe tags (`group` / `won` / `big_laugh` / `first_try` / `hesitant`) appended to the station_events row.

### 3.6 Ticket Reload (`/station/reload`)

1. Volunteer at reload desk scans child.
2. Screen shows current balance + FACTS authorization status + remaining FACTS allowance (e.g., "$10 authorized, $6 remaining — $4 used").
3. Volunteer enters amount or ticket count.
4. Payment method buttons:
   - **Charge FACTS** — enabled only if parent authorized + balance remaining; deducts from FACTS allowance
   - **Cash** — logs cash collected
   - **Venmo** — logs Venmo confirmation
   - **Comp** — no charge (admin-only)
5. Writes `reload_events` + `station_events` (`event_type: reload`, `tickets_delta: +N`).

### 3.7 Profile Quick-Lookup (`/station/lookup`)

Utility — scan any QR from any station to see:
- Name, consent banner, allergies banner, parent contact
- Current balance
- Full station timeline for the night
- Photos taken of this child (thumbnail gallery)
- Pickup list
- Photo consent status

---

## Section 4 — Admin Screens

All admin routes live under `/admin` and require `ADMIN_PASSWORD`.

### 4.1 Dashboard (`/admin`)

Live-updating widgets via Supabase realtime:
- Registrations: total / new today / edited today
- Checked in right now (count + % of registered)
- Checked out (count + last 10 with timestamps + pickup person)
- Total tickets spent tonight
- Spend by station (horizontal bar chart)
- Total FACTS reloads authorized / used
- Cash + Venmo totals
- Photos taken
- AI stories: pending / needs_review / approved / auto_approved / sent
- **Alert tile** after event ends: "Checked in but not yet checked out" — flags kids still on site

### 4.2 Children (`/admin/children`)

**List view:** searchable table — name, age/grade, parent, balance, checked-in status, photo consent. Filters: checked in / out / not arrived, has allergies, photo consent status.

**Detail view (click a row):**
- All profile fields (admin-editable inline)
- Guardians (edit)
- Pickup list (add/remove)
- Consent toggles (change → logs audit entry)
- Full station timeline (chronological)
- Photos of this child (gallery thumbnails)
- Ticket balance + "Add tickets" quick action
- Quick actions: print replacement wristband, resend registration email, trigger AI story preview

### 4.3 Bulk Actions (`/admin/bulk`)

- **Set initial balance for all registered children:** input amount → preview ("This will update 47 children. Existing balances will be overwritten.") → confirm → each gets a `reload_events` row with `payment_method: comp`, `notes: 'Initial balance set by admin'`.
- Export roster CSV
- Print unprinted wristbands (batch print sheet)
- Force-close checked-in kids (end-of-night cleanup)

### 4.4 Stations & Catalog (`/admin/stations`)

- Each station's item list editable live during event
- Each item: name, ticket cost, active toggle
- Changes push to station devices via Supabase realtime — no refresh

### 4.5 AI Story Queue (`/admin/stories`)

- List of all stories ordered by checkout time
- Each row: child name, generated timestamp, photo count, word count, status, auto-check score
- Click to preview → full rendered story + photo gallery as parent will see it
- Actions per story:
  - ✅ **Approve** → `status: approved`
  - ✏️ **Edit** → rich text editor; saves `moderation_notes`
  - 🚫 **Skip** → `status: skipped`
- Bulk "Approve all" with confirmation count + reminder to spot-check a sample

### 4.6 Photo Review Queue (`/admin/photos/queue`)

- All photos where `match_status = pending_review`
- Each thumbnail shown with vision-suggested child(ren) + confidence percentage
- One-tap confirm (tags) or reject (sends to unmatched pool)
- Unmatched pool: manual tagging via drag-to-child or multi-select

### 4.7 Photos (`/admin/photos`)

- Full gallery; sort by time or station
- Click → see tagged kids, photographer, timestamp, vision summary
- Admin can untag or delete (audited)
- Bulk download zip (per child or all)
- "Promo export" filter — excludes any photos where any tagged child has `photo_consent_promo = false`

### 4.8 Settings (`/admin/settings`)

- Event-level config: date, times, `default_initial_tickets`, `faith_tone_level`
- Station list (add/remove year-over-year)
- **Gold standard reference story** — view / regenerate / edit (baseline for auto-check)
- Email branding (logo, header color, signature block)
- AI story prompt template (editable)
- "Test AI story" — generate a story from fake data with current prompt to preview

---

## Section 5 — AI Story Generation + Email Delivery

### 5.1 Generation trigger

- Checkout completes → row inserted into `ai_stories` with `status: pending`.
- Supabase Edge Function polls pending rows, fetches the child's timeline, calls Claude, writes back, sets `status: pending_review`.
- Runs continuously from first checkout until ~10 PM. Stories generate within 30–60s of checkout — data is still warm.

### 5.2 Input payload to Claude

For each child:
- Profile: first name, age, grade
- Event name + date + faith tone level
- Full `station_events` chronological list (station, event_type, tickets_delta, item_name, vibe_tags, timestamp)
- `checked_in_dropoff_type` (e.g., `both_parents`)
- Photo metadata: count, stations where taken, `vision_summary` for each (person_count, activity, mood, multi_children)
- Repeat-station detection: favorite = most-visited (ties broken by photos-at-station, then tickets-spent)
- Variety seed: curated descriptor set (random openers, transitions, closers from a short list we author)

### 5.3 Model & prompt

**Model:** Claude Haiku 4.5 — fast, cheap (~$0.002/story), quality sufficient for this narrative length.

**System prompt (versioned in `/admin/settings`):**

> You are writing a warm, brief keepsake story for a parent about their child's night at the LCA Spring BBQ Glow Party Bash. Tone: affectionate, specific, lightly wry, faith-and-community-resonant without scripture.
>
> Structure:
> 1. Open with a hook that names the child and grade.
> 2. Narrative timeline of highlights, grounded only in station names, items redeemed, and vision-described photo content. **Do not use specific timestamps.** Use soft sequencing language ("from there," "later," "she closed the night at…").
> 3. Acknowledge photos using vision descriptions — e.g., "a photo catches the grin mid-wait."
> 4. One short paragraph of community warmth — maximum 2 sentences — that includes the family by name.
> 5. Closer: one sentence referencing 2–3 specific items or stations from this child's night ("A butterfly, a bracelet, and two rounds of Cornhole.").
>
> Length: 150–220 words before the stats line.
>
> **Strict grounding rules:**
> - Narrate only from the timeline data provided. Do not invent social interactions ("made a friend"), emotional states, or details not in the data.
> - For the check-in mugshot, use `checked_in_dropoff_type` to correctly name who was in the photo.
> - For vibe tags, only reference them as attributed observations ("volunteers noted big laughs at Cornhole") — not as invented facts.
> - Do not mention medical/allergy info.
> - Use the child's first name only.
> - If the data contains no photos, omit the photo acknowledgments.

**Reference gold standard (locked v6):**

> Second-grade energy, meet the Glow Party Bash. Maya's night started at the jail with a family mugshot — mom, dad, and one slightly suspicious-looking seven-year-old all found guilty of having too much fun.
>
> From there, a full-face butterfly at Face Painting in blue and gold (one of the photos catches the grin mid-wait). Pizza kept her fueled, and then she found her calling: Cornhole. She came back for a second round and clearly would've gone for a third if dinner weren't calling. A spin of the Prize Wheel earned her candy, and the Arts & Crafts table sent her home with a glow bracelet she made herself. The night closed on the dance floor, where a photo shows her mid-move in a small group.
>
> Nights like this are what community looks like. Grateful the Carters were in the middle of it.
>
> A butterfly, a bracelet, and two rounds of Cornhole. That's a full night by any measure.
>
> **By the numbers:** 6 stations visited · 15 tickets spent · 4 photos · favorite stop: Cornhole (2 visits)

### 5.4 Auto-check (before parent delivery)

Each generated story is scored against the reference:
- Word count within ±30% of reference
- Structural check: opens with child's first name; references at least 2 station names from the child's actual timeline; has a closer referencing ≥2 specific items
- Banned-word dictionary (configurable): no "adventure of a lifetime," "unforgettable," clichés; no scripture quotation; no medical references
- Data grounding: at least 2 real station names from the timeline appear in the story

**Score ≥ pass threshold** → `status: auto_approved` (eligible for auto-send at 9 AM).
**Score < pass threshold** → `status: needs_review` (holds until admin approves in `/admin/stories`).

### 5.5 Photo consent enforcement (belt + suspenders + third belt)

- **Data layer:** Query excludes photos where `photo_consent_app = false`.
- **Generation layer:** If no photos after filter, prompt is flagged to omit photo references.
- **Template layer:** Email template only renders gallery if `photos.length > 0`.
- **Vision matching:** Face matching pipeline excludes children with `vision_matching_consent = false`; their reference embeddings are never stored.

### 5.6 Stats line

Computed from `station_events`:
- Stations visited (count of distinct stations)
- Tickets spent (sum of negative `tickets_delta`)
- Photos (count of tagged photos)
- Favorite = most-visited station (ties broken by photos, then by tickets)

Rendered below narrative as: *"**By the numbers:** N stations visited · N tickets spent · N photos · favorite stop: [Station] (N visits)"*

### 5.7 Email delivery

**Provider:** Resend
- Free tier (100 emails/day) covers a 50-kid event comfortably; $0.001 beyond
- Needs `RESEND_API_KEY` env var
- Verified sending domain (one-time DNS setup for SPF + DKIM + DMARC)

**Grouping — multi-child families:**
- Grouping key: primary parent email from `guardians` where `is_primary = true`
- Send job groups children by `primary_parent_email`
- Single email per family with one section per child
- Singular subject for one child, plural for multiple — e.g., *"A little surprise from last night — Maya's night at the Glow Party Bash 🌟"* vs. *"…the Carter kids at the Glow Party Bash 🌟"*

**Email template:**
- Header: LCA logo + event name + date
- For each child: mini-header with name + age, story HTML, photo gallery (thumbnail grid, Supabase signed URLs, 7-day expiry), stats line
- Closing block: "Download all photos" button (links to a signed zip URL hosted on the event domain)
- Footer:
  > *This keepsake email was designed and built by Brian Leach of Attn: To Detail — a small consulting studio that helps founder-led businesses move faster with websites, AI tools, and honest strategy. If the details of this email made you smile, that's the whole idea. brian@attntodetail.ai · attntodetail.ai*
- Fine print: unsubscribe link, reply-to address

**Scheduled send:**
- Vercel Cron runs at 9:00 AM the morning after the event
- Picks up all `ai_stories.status IN (approved, auto_approved)` and sends via Resend
- Rate limit: 10 emails/sec
- On send: `ai_stories.status = sent`, `sent_at = now()`; writes `email_sends` row
- On failure: retry once after 5 minutes; if still failing, flag in admin dashboard

### 5.8 Enrichment layers (confirmed)

All five enabled:
- **A. Check-in dropoff tap** — mandatory 1-tap at check-in → grounds the jail mugshot narration.
- **B. Photo vision analysis** — Claude vision runs on upload; stored as `photos.vision_summary`; feeds grounded photo references.
- **C. Volunteer vibe tags** — optional one-tap at any station; attributed as volunteer observations in story.
- **D. Descriptor variety seed** — curated set of openers/transitions/closers passed per story so 50 stories aren't cookie-cutter.
- **E. Roaming photographer mode** — dedicated volunteer; vision auto-tags photos; admin reviews pending_review queue.

### 5.9 Cost estimate

For a 50-kid event with ~250 total photos:
- Story generation (Haiku): 50 × ~$0.002 = ~$0.10
- Photo vision (description): 250 × ~$0.01 = ~$2.50
- Face matching (roaming mode): 250 × ~$0.02 (compared against ~50 refs each) = ~$5.00
- Email send (Resend): free (under 100/day)
- **Total: ~$8**

---

## Section 6 — Security, Consent, Privacy

### 6.1 Authentication

- **Parent registration** — public URL; `qr_code` is UUID (128-bit, non-guessable).
- **Edit magic link** — signed token, 30-day expiration, 5-use limit.
- **Admin** — `ADMIN_PASSWORD` env var; session cookie 8-hour expiry; IP logged on login.
- **Volunteer stations** — shared `VOLUNTEER_PASSWORD`; station selection in localStorage; session expires 11 PM event night (hard cutoff).
- **AI story email links** — signed token per `ai_stories.id`; 90-day expiry.

### 6.2 Consent (three separate toggles)

| Toggle | Controls | Default |
|---|---|---|
| `photo_consent_app` | Any photography during event | Required choice at registration |
| `photo_consent_promo` | Photos usable for LCA social/promo | Required choice |
| `vision_matching_consent` | Face recognition auto-tagging | **OFF** — neutral explanation, no nudge |

**Enforcement layers:**
- Registration form — both photo toggles required; vision is opt-in only with clear benefits explanation.
- Photo station (fixed) — `photo_consent_app = false` blocks capture with full-screen red modal.
- Photo station (roaming) — vision pipeline skips children with `vision_matching_consent = false`.
- Child card border color keyed to consent: green / red / amber.
- AI story generation — query filters exclude photos where consent doesn't match usage.
- Admin gallery — `photo_consent_promo = false` photos excluded from promo bulk export.

### 6.3 Face recognition data

- Reference embeddings encrypted at rest in Supabase.
- No face vectors persist outside Supabase; Claude vision processes images via API and returns descriptive text.
- Parent revokes `vision_matching_consent` post-event → embeddings deleted immediately; auto-tagged photos unqueued.
- **Retention: 30 days post-event, automatic deletion.**

### 6.4 Data retention

| Data | Retention | Reason |
|---|---|---|
| Child profile data | 90 days | Follow-up window, not indefinite |
| Photos (shareable) | 90 days | Parents download at their pace |
| Photos (archive, admin-only) | 1 year | School yearbook use if consented |
| AI stories | 90 days | Same as photos |
| Waiver signatures + IP + timestamp | 7 years | Standard liability retention |
| `station_events` / `reload_events` | 1 year | Year-over-year stats |
| Face embeddings | 30 days | Minimum viable |

Automated monthly purge job. Admin override allowed per-record with audit entry.

### 6.5 Digital signatures

- Two signature blocks: liability waiver + photo consent.
- Signature = typed full name + checkbox + auto-captured timestamp + IP + user agent → `signatures` table (immutable).
- PDF of full signed registration auto-generated and emailed to primary parent on submit.

### 6.6 FACTS / payment

- **No FACTS account numbers or PII entered or stored.**
- Only `facts_reload_permission` (bool) + `facts_max_amount` (int 0–10) per child.
- Actual charge happens outside the app (school finance office reconciles from admin export).
- Admin export: CSV with child name + FACTS amount used. No bank info.

### 6.7 Email deliverability

- Sending domain verified with SPF + DKIM + DMARC (one-time DNS).
- Unsubscribe link in every email; honored immediately.
- Reply-to points to monitored address (school admin or Brian's inbox for year one).

### 6.8 Audit log

Append-only; not editable from UI. Captures:
- Every checkout (who released to whom, staff member)
- Admin logins
- Consent changes (post-registration edits)
- Photo deletions
- Ticket reloads
- Registration edits

Exportable by admin.

### 6.9 Infrastructure

- Supabase RLS on every table; `anon` role has no reads by default.
- Storage bucket private; access via signed URLs (15-min expiry for station viewing, 7-day for email galleries).
- Vercel preview deployments use separate env vars; no prod data in preview.
- Secrets rotation: admin + volunteer passwords regenerated per event year.

### 6.10 Incident response

- **Photo of no-consent kid captured** — "Delete photo" on lookup; audited.
- **Wrong checkout** — admin "Reopen session" reverts; ai_story stays pending; staff investigates.
- **Registration spam** — rate-limit (10 submits/IP/hour) + honeypot field.

---

## Open items / deferred

- **Earning tickets at stations** — considered, deferred to v2. Complicates every station UI and payout reconciliation.
- **Staff notes field on profile** — dropped. "Anything important goes via staff device's native text to parent."
- **Raffle tickets** — out of scope. Stays as a physical system handled at the check-in table.
- **SMS provider (Twilio/etc.)** — not needed. Staff uses `tel:`/`sms:` from the device; AI story goes via email.
- **ntfy.sh push** — removed.

---

## Quality gates that will apply during build

Per `_config/quality-gates.md`:
- **Layer 1 — Code Quality:** `tsc --noEmit` clean after every phase.
- **Layer 2 — Visual Design:** Applitools Eyes comparison on every UI change (station screens, admin, registration form, email template).
- **Layer 5 — Accessibility:** WCAG 2.1 AA on all parent-facing flows (registration, email view).
- **Layer 6 — Functional Testing:** Every phase ships with a functional test script + passing output. No "should work."
- **Layer 7 — Premium Innovation:** Roaming photographer + vision matching + grounded AI story is the cutting-edge technique for this project.

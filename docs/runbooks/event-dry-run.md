# Spring BBQ Bash — pre-event dry-run script

**Last updated:** 2026-04-19 (reconciled after Resend went live + confirm-page QR + waiver shipped 2026-04-18)
**Run this:** Tuesday April 21 at the latest (gives 4 days for any fixes)
**Time required:** ~30 minutes
**Tools:** one phone, one laptop (for admin), a burner email inbox you can check on the phone

---

## Setup checklist

Run through this before you start the script. If any item is unchecked, fix it first — the dry-run won't tell you anything useful otherwise.

- [ ] Site is at https://spring-bbq-bash.vercel.app and loads (you see the "Spring BBQ Bash · Glow Party Edition" wordmark)
- [x] `RESEND_API_KEY` and `EMAIL_FROM` are set in Vercel env ✅ completed 2026-04-19. Sending domain `attntodetail.ai` verified at Resend with SPF + DKIM + MX + DMARC; test-send landed in iCloud inbox with `dmarc=pass`.
- [ ] `ANTHROPIC_API_KEY` is set in Vercel env (story generation at step 16 silently no-ops without it)
- [ ] Volunteer password (`SpringBBQ2026$`) and admin password (`LCAadmin2026$`) memorized or noted
- [ ] Burner email (Gmail/iCloud alias, or a `+test` alias on your real address) ready, opened on the phone
- [ ] You're logged out of any prior session — open both browsers in **incognito / private window** to be safe
- [ ] At least one **registered child with a known QR code** is in the database (see step 5 — you can register a fake family for the dry-run, then delete after)

---

## Step-by-step script

Each step has: what to do, expected result, what to flag if it doesn't match. Number every flag with the step number when you report it.

### Step 1 — Landing page loads with current copy
**Do:** On the phone, open https://spring-bbq-bash.vercel.app
**Expect:** Aurora background, glowing cross, "Spring BBQ Bash · Glow Party Edition" wordmark, "Saturday, April 25, 2026 · 5:00–8:00 PM" subtitle. Four neon chips below: "2 drinks · 3 jail / pass · 1 prize spin · 1 DJ shoutout". Two cards: "Parents → Fill out permission slip" and "Volunteers & organizers" with two buttons.
**Flag if:** Any text reads "Spring BBQ" without "Glow Party Edition", or chip counts differ from `2 / 3 / 1 / 1`, or the date is wrong.

### Step 2 — Registration form loads with all 5 sections
**Do:** Tap "Fill out permission slip →"
**Expect:** Page title "Spring BBQ Bash · Permission Slip · Lincoln Christian Academy". Form sections in order: Step 1 Parents (Primary Parent / Guardian), Step 2 Children (one default child block), Waiver, Photo Permissions, AI Disclosure, then a gold "One more thing…" surprise card and the "Submit permission slip" button.
**Flag if:** Any section is missing, the waiver text still reads `TODO(plan Phase 2)` placeholder, or the "Submit" button is enabled before you check the waiver + AI ack boxes.

### Step 3 — Fill out the form with a fake family
**Do:** Fill in primary parent (use the burner email here), add a secondary parent (optional), add **two children** (so multi-kid email grouping is exercised), tick FACTS reload permission for at least one kid, fill in pickup authorizations.
**Expect:** Adding the second child appends a fresh block; remove buttons appear once there are 2+ kids; FACTS amount input shows when toggle is on, max $10.
**Flag if:** Any required-field validation seems wrong, or Step 2 doesn't let you add multiple children.

### Step 4 — Sign waiver + photo + AI sections
**Do:** Type your full name in the waiver, photo consent, and AI consent name fields. Tick the acknowledgement checkboxes.
**Expect:** Submit button transitions from disabled → enabled once both `waiverAck` and `aiAck` are checked.
**Flag if:** Submit is enabled before both acks are checked, or stays disabled after both are checked.

### Step 5 — Submit the form
**Do:** Tap "Submit permission slip"
**Expect:** Brief loading state, then redirect to `/register/confirm`.
**Flag if:** Any validation error appears (the "Something went wrong" red box). Note exact text — submit failures usually surface a Zod issue list.

### Step 6 — Confirmation page renders + email arrives
**Do:** Read the confirm page. Then switch to the burner inbox on your phone.
**Expect on page:** "YOU'RE IN" marquee, per-kid gate-pass card with a **real QR code** (generated client-side from the API's `created[]` response), the edit link, ICS calendar download, Print button, and Apple Wallet placeholder button. Contact email footer shows `brian@attntodetail.ai`. The line "Confirmation sent to {email}" reflects the email that just fired.
**Expect in inbox (within ~30s):** An email from `brian@attntodetail.ai` with subject referencing your kids' names. Body has per-kid QR codes rendered inline as images. (Wired via `sendRegistrationConfirmation` in `/api/register`, logged to the `email_sends` table — visible in Supabase if you need to verify.)
**Flag if:** Any QR cell renders blank on the confirm page (sessionStorage flow broke — check browser console). OR no email arrives within a minute (check Supabase `email_sends` row: `status='failed'` + `error` column reveals Resend issue; `status='sent'` but nothing in inbox = spam filter or wrong address). Apple Wallet button is expected to be a placeholder for now.

### Step 7 — Get the kids' QR codes for testing
**Do:** Switch to the **laptop**, open https://spring-bbq-bash.vercel.app/admin in incognito. Log in with `LCAadmin2026$`. Click "Children" in the top nav. Find your fake family. Click into one of the kids — copy the QR code from the URL (the `/admin/children/[id]` route shows full child detail; the QR string is what you'll type into station QR inputs).
**Expect:** Children list shows your two test kids; each row has parent name + balance + checked-in status. Detail page shows guardians, pickup list, consent toggles, a "Add tickets" quick action.
**Flag if:** QR code can't be located on the detail page (you may need to copy from the database directly via Supabase dashboard if the admin UI doesn't surface it).

### Step 8 — Volunteer login + station picker
**Do:** Back on the **phone**, go to https://spring-bbq-bash.vercel.app/station. Enter the volunteer password `SpringBBQ2026$`.
**Expect:** Station picker grid loads with emoji tiles for every station (Check-in 👋, Check-out 🚪, Drinks 🥤, Jail 🚨, Prize Wheel 🎡, DJ 📻, Cornhole 🌽, Face Painting 🎨, Arts & Crafts ✂️, Video Games 🎮, Dance 💃, Pizza 🍕, Cake Walk 🍰, Quiet Room 📽️, Photo ✨, Roaming 📸).
**Flag if:** Any station tile is missing, or the picker doesn't appear (means stations table didn't seed).

### Step 9 — Check-in: scan QR + take mugshot + submit
**Do:** Tap "Check-in 👋". Paste/type one of your test kid's QR codes into the input. Tap "Look up". Once the child card appears: type your name in "Your name (staff)". Allow camera access when prompted. The Jail mugshot section is open with a viewfinder. Aim at anything (selfie of you is fine — front camera). Tap "📸 Take mugshot". Wait for "Mugshot saved" green confirmation. Pick a Dropoff (e.g., "Both parents"). Tap "Check In".
**Expect:** Consent banner reads "✅ Photos OK" (assuming you ticked photo consent at step 3). Card border is mint-green. Perk chips show 2 drinks · 3 jail/pass · 1 prize wheel · 1 DJ shoutout. After Check-in: green "✨ Checked in! Next kid?" toast.
**Flag if:** Camera permission fails, mugshot upload fails (red "Upload failed" — check Vercel function logs), or the check-in API returns an error.

### Step 10 — Drinks: scan + redeem (verify balance updates)
**Do:** Tap "Scan next wristband" or back to picker → tap "Drinks 🥤". Scan the same kid's QR. Tap "Redeem drink ticket".
**Expect:** Card shows perk chips updating from `2 drinks` → `1 drinks` after redeem. Toast: "Drink redeemed — 1 left."
**Flag if:** Balance doesn't decrement, or the perk chip stays at 2.

### Step 11 — Jail: scan + send to jail (mugshot logged via station_event)
**Do:** Back to picker → tap "Jail 🚨". Scan same kid. Pick "🚨 Send to jail" (default). Tap "Send to jail".
**Expect:** Toast: "Sent to jail — 2 left." Perk chip "jail / pass" goes from 3 → 2.
**Flag if:** The Jail station shows a camera (it shouldn't — that's only for Check-in). Or the balance doesn't decrement.

### Step 12 — Prize wheel: scan + spin (verify one-time)
**Do:** Back to picker → "Prize Wheel 🎡". Scan kid. Tap "Spin the wheel".
**Expect:** Toast: "Prize wheel spun. One per kid — done for the night." Perk chip "1 prize wheel" → "used" (struck-through).
**Try a second time:** Scan same kid again. Expect amber warning "Already used tonight — one per kid." and the spin button is disabled.

### Step 13 — DJ shoutout: scan + queue song
**Do:** Back to picker → "DJ Shoutout 📻". Scan kid. Type a kid-appropriate song name (e.g., "Mr. Brightside") in the "Song request" textarea. Tap "Queue shoutout".
**Expect:** Toast: `DJ shoutout queued: "Mr. Brightside".` Perk chip "1 DJ shoutout" → "used".
**Flag if:** Queue button is enabled with empty song request (it shouldn't be).

### Step 14 — Photo station: scan-then-shoot
**Do:** Back to picker → "Photo ✨". Scan kid (chip appears at top). Optionally scan the second kid too (chip appears below). Allow camera. Tap "📸 Shutter (1)" or "Shutter (2)".
**Expect:** Mint-green chip per kid. After upload: "✨ Uploaded · tagged N kid(s)." toast.
**Flag if:** Any kid in the batch lacks photo consent — should display a full-screen red modal "🚫 No Photos" blocking the shutter.

### Step 15 — Roaming photographer: shoot without scanning
**Do:** Back to picker → "Roaming 📸". Skip the volunteer name (or fill it). Allow camera. Tap "📸 Shutter".
**Expect:** Photo appears in "Recent shots" list at bottom: timestamp + "uploading…" → "analyzing…" → eventually "✅ tagged [name]" / "🔍 pending review" / "❓ unmatched". Polling runs for ~12s.
**Flag if:** Status stays at "analyzing…" indefinitely (means the vision/match pipeline didn't return). You'll verify outcome at step 17 in `/admin/photos/queue`.

### Step 16 — Check-out: scan + select pickup + release
**Do:** Back to picker → "Check-out 🚪". Scan kid. Pick a pickup person (e.g., "Primary parent"). Type your staff name. Tap "Release to selected".
**Expect:** Green toast "✨ Checked out safely. See them next time." This action also fires `POST /api/stories/generate` in the background — the AI story for this kid begins rendering.
**Flag if:** No pickup options appear (means `pickup_authorizations` didn't seed at registration), or the release button stays disabled.

### Step 17 — Admin dashboard reflects the dry-run
**Do:** Switch back to the **laptop**, refresh `/admin` if open. Expect counters to update within 5 seconds (dashboard polls every 5s).
**Expect:** "Checked in" shows ≥ 1, "Checked out" shows ≥ 1, "Tickets spent" shows the drink+jail decrements, "Photos taken" shows ≥ 1. The "Spend by station" bar chart shows drinks + jail bars. "AI story status" shows at least one row in pending/needs_review/auto_approved.
**Flag if:** Counts stay at 0 (means stats endpoint isn't aggregating correctly), or the bar chart is empty.

### Step 18 — Story moderation
**Do:** Top nav → "Stories". Wait ~30–60 seconds after checkout for the story to appear (Claude Haiku takes ~10–20s). Page auto-refreshes every 10s while any row is `pending`, and there's a manual "Refresh" button in the toolbar if you want to force it.
**Expect:** A row for your test kid with status `auto_approved` (if quality passed) or `needs_review` (if it failed auto-check). Click in to see the rendered story + photo gallery.
**Flag if:** Story never appears (check Vercel logs for `/api/stories/generate` errors — usually `ANTHROPIC_API_KEY` missing). Or content reads visibly AI-slop ("unforgettable adventure", "lifetime memory") — banned phrases should have caught these.

### Step 19 — Photo queue review
**Do:** Top nav → "Photo queue". Filter set to "pending review" by default.
**Expect:** Your roaming photo from step 15 may be here if the vision match landed in the 70–89% confidence band. Each row shows the thumbnail + suggested kid + confidence + Confirm / Reject buttons.
**Flag if:** Photo shows but the signed URL is broken (image won't render).

### Step 20 — Settings: send the test email
**Do:** Top nav → "Settings". Scroll to "Send a test email" block at the bottom. Enter the burner email address. Tap "Send test".
**Expect:** Within 2-3 seconds: green box "Sent · id [resend-message-id]".
**Flag if:** Red error "Send failed" — usually `RESEND_API_KEY` or `EMAIL_FROM` is missing in Vercel env, or the sending domain isn't verified in Resend.

### Step 21 — Open the email on the burner inbox
**Do:** Switch to the **phone**, refresh the burner inbox. Email should arrive within 30-60 seconds.
**Expect:** Subject reads something like *"A little surprise from last night — [Name]'s night at the Glow Party Bash 🌟"* (singular for one kid, plural for multiple). Open it. Verify:
- Dark hero section with LCA event name + date
- Per-child block: name + age, narrative story, **photo grid renders with thumbnails (no broken images)**, stats line ("By the numbers: N stations · N tickets · N photos · favorite stop: …")
- A2D footer at bottom: "designed and built by Brian Leach of Attn: To Detail" with link to attntodetail.ai
- "From" address matches your `EMAIL_FROM` env var

**Flag if:** Photos show as broken images (signed URLs may be expiring too fast — should be 7 days). Footer missing. Subject is wrong format. Email lands in spam (DMARC / DKIM / SPF setup issue).

### Step 22 (optional, if `CRON_SECRET` is set) — Trigger the live cron path
**Do:** From a terminal:
```
curl -X POST https://spring-bbq-bash.vercel.app/api/cron/send-stories \
  -H "x-cron-secret: $CRON_SECRET"
```
**Expect:** JSON response with `families: N`, `sent: N`, `failed: 0`. Burner inbox gets the actual production email (since you registered with that address). This is what fires automatically Sunday morning at 9am Pacific via Vercel cron (`vercel.json` has `0 16 * * *` UTC).
**Flag if:** Returns 401 (auth header rejected — check `CRON_SECRET` env), or `failed > 0` (check Vercel logs for the per-family error).

---

## Cleanup

After the dry-run, either:
- **Delete the test family:** `/admin/children` → click each test kid → look for delete option in the editor (not yet a quick action; may need to delete via Supabase dashboard).
- **Or just leave them.** The post-event 90-day purge cron will handle them. Nothing breaks if test rows are still there on event night.

---

## Common gotchas

- **`RESEND_API_KEY` / `EMAIL_FROM` empty** — the test-send button fails silently with "Send failed" or 500. Check Vercel env, then redeploy (env changes don't propagate to running functions until next deploy). *As of 2026-04-19 both are set; sending domain is `attntodetail.ai`.*
- **`ANTHROPIC_API_KEY` empty** — checkout completes fine but no story appears in `/admin/stories` because the background `fetch` to `/api/stories/generate` 500s. Check Vercel function logs.
- **Camera permission denied** — Safari iOS sometimes silently blocks camera on first visit; user has to manually re-enable in Settings → Safari → Camera. Test on Chrome Android too.
- **QR scan fails under blacklight** — the picker uses `navigator.mediaDevices.getUserMedia({ facingMode: 'environment' })`. Low light + neon makes camera autofocus jumpy. Manual paste of the QR string is always the fallback (every QR input has a text field).
- **Multiple browser tabs / sessions** — the volunteer cookie expires at hard cutoff 11 PM event night. If a tablet sits idle past that, every scan returns 401. Re-log in.
- **Missing a deploy after a push** — Vercel's Production Branch is now `kid-profile-rebuild` (changed 2026-04-19), so every push auto-deploys to production. Before that change, pushes only created Preview URLs and required a manual promote; if prod ever stops matching HEAD, verify the production-branch setting didn't get reverted.

---

## Pass criteria

Ship-ready when:
- All 21 mandatory steps pass without errors (step 22 optional)
- Test email arrives in the burner inbox within 60 seconds of triggering test send
- Story content reads naturally — no "adventure of a lifetime", no scripture quoting, no medical references, no timestamps
- All photos in the email render (no broken refs, no 403s on signed URLs)
- Dashboard counts match what you actually did (1 check-in, 1 check-out, 2 spends, 1 photo, etc.)
- Footer correctly attributes Attn: To Detail with a working link to attntodetail.ai

---

## Inconsistencies / known gaps to fix before Saturday

Reconciled 2026-04-19. Resolved items struck through with commit hashes; active items keep their numbers.

1. ~~**Confirm page does not display QR codes.**~~ **Shipped 2026-04-18** — per-kid gate-pass cards with real QR codes now render from the API's `created[]` response. Parents get a printable wristband reference on submit.

   ~~**`/api/register` does not send a confirmation email.**~~ **Partially open.** The confirm page still shows "Confirmation sent to {email}" but the register API does not actually call Resend today — only the keepsake cron does. Either wire register → Resend, or soften the confirm-page copy before Saturday. Not blocking the dry-run.

2. ~~**Real LCA waiver text not in the form.**~~ **Shipped 2026-04-18** — `WaiverSection.tsx` now carries the verbatim LCA paper-slip text. `PhotoConsentSection.tsx` also exposes the full LCA Photo/Video Release via an expandable `<details>`. Migration 0007 added `'ai_consent'` to the signature_type CHECK and the API writes 3 signature rows per registration.

3. **No "delete child" quick action in admin.** Still open. After the dry-run, removing the test family requires the Supabase dashboard. Not blocking.

4. ~~**Stories list does not auto-refresh.**~~ **Shipped 2026-04-19** (`f2f6db0`) — `/admin/stories` now polls every 10s while any row is `pending`, plus a visible "Refresh" button and "last updated" timestamp.

5. **Reload station only adds drink tickets.** Still stands by design — confirmed by ReloadStation copy: "Only drink tickets reload — jail, prize wheel, and DJ are fixed at the start." Cover this during volunteer briefing so staff don't promise what the station can't deliver.

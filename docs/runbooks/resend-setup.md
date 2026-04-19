# Resend Setup Runbook — Spring BBQ Bash

**Purpose:** Stand up the transactional email pipeline that sends keepsake story emails to families after the event (Saturday April 25, 2026).

**Owner:** Brian Leach (brian@attntodetail.ai)
**Provider:** Resend (https://resend.com)
**Sending domain:** `lcasacramento.org` (LCA-owned — DNS changes require coordination with LCA admin)

---

## Prerequisites

- LCA admin access to the DNS provider for `lcasacramento.org` (Cloudflare, GoDaddy, Squarespace, etc. — confirm before starting)
- Brian's Resend account (or a shared LCA account if LCA prefers ownership)
- Vercel project access for `spring-bbq-bash` (env var management)
- A working local checkout of `spring-bbq-bash` for the smoke test

---

## Step 1 — Create the Resend account + API key

1. Sign in at https://resend.com/login (or sign up if no account exists yet).
2. Create or select the workspace that will own this project. Recommended name: `LCA Spring BBQ Bash`.
3. Navigate to **API Keys** → **Create API Key**.
   - Name: `spring-bbq-bash-prod`
   - Permission: **Sending access** (do not grant Full Access for production)
   - Domain: leave unrestricted for now; lock to the verified domain after Step 2
4. Copy the key (`re_...`) immediately — Resend only shows it once. Store in 1Password under `Spring BBQ Bash · Resend API Key (prod)`.
5. Repeat for a `spring-bbq-bash-dev` key if local development needs to send real emails. Otherwise skip — local dev should use Resend's test mode or `onboarding@resend.dev`.

---

## Step 2 — Add and verify the sending domain

1. In Resend, go to **Domains** → **Add Domain**.
2. Enter `lcasacramento.org`. Region: pick the closest (likely `us-east-1`).
3. Resend will show DNS records to add. There are typically **3 record sets**:
   - **SPF** — `TXT` on `@` (or `lcasacramento.org`) — usually merges into existing SPF record.
   - **DKIM** — `TXT` on `resend._domainkey.lcasacramento.org` (long public key value).
   - **MX (return-path)** — `MX` on `send.lcasacramento.org` pointing to `feedback-smtp.<region>.amazonses.com` priority 10. This enables bounce/feedback handling.
4. **Coordinate with the LCA DNS admin.** Send them:
   - The exact host/value for each record (copy directly from Resend — do not retype DKIM)
   - Reassurance: SPF will be merged not replaced; DKIM and MX records are net-new on a subdomain
   - The reason: required to send branded transactional email from `@lcasacramento.org`
5. After DNS propagates (typically 5–30 minutes; can take up to 24h), click **Verify** in Resend. All three records must show green.
6. Once verified, lock the API key from Step 1 to this domain (Resend → API Keys → edit → restrict).

**Gotcha:** If LCA already uses Google Workspace / Microsoft 365 for inbound mail, the existing SPF record likely contains `include:_spf.google.com` or similar. The new SPF must merge Resend's include into the same record — never create a second SPF TXT record (RFC 7208 forbids it).

---

## Step 3 — Decide the From and Reply-To addresses

Per `.env.example`:
- `EMAIL_FROM` — must be on the verified domain. Format: `"LCA Spring BBQ <keepsakes@lcasacramento.org>"`
- `EMAIL_REPLY_TO` — optional; falls back to `EMAIL_FROM`. Use a monitored mailbox so parents who hit Reply reach a human.

**Recommended values:**
- `EMAIL_FROM` = `LCA Spring BBQ <keepsakes@lcasacramento.org>`
- `EMAIL_REPLY_TO` = `bash@lcasacramento.org` (or whichever LCA mailbox the event team monitors that weekend)

Confirm `keepsakes@` either:
- Is a real mailbox at LCA, OR
- Is set up as an alias forwarding to a real mailbox, OR
- At minimum, won't bounce inbound mail (parents will reply even when told not to)

---

## Step 4 — Configure Vercel environment variables

In the Vercel dashboard for `spring-bbq-bash`, under **Settings → Environment Variables**, set the following on **Production** (and **Preview** if the team wants preview deploys to send real mail — usually not):

| Variable | Value | Notes |
|----------|-------|-------|
| `RESEND_API_KEY` | `re_...` from Step 1 | Sensitive — encrypted env |
| `EMAIL_FROM` | `LCA Spring BBQ <keepsakes@lcasacramento.org>` | Must match verified domain |
| `EMAIL_REPLY_TO` | `bash@lcasacramento.org` | Optional but recommended |
| `CRON_SECRET` | `openssl rand -hex 32` output | Protects `/api/cron/send-stories` |

Then **redeploy** (Vercel does not pick up env changes until the next deploy). Trigger via `vercel --prod` from the project root, or push an empty commit, or use the Vercel UI redeploy button.

---

## Step 5 — Wire the Vercel cron

`vercel.json` already declares the daily cron:

```json
{
  "crons": [
    { "path": "/api/cron/send-stories", "schedule": "0 16 * * *" }
  ]
}
```

This runs daily at 16:00 UTC (09:00 PT during PDT). The route handler at `src/app/api/cron/send-stories/route.ts` validates the request via:

- `x-cron-secret` header, OR
- `Authorization: Bearer <CRON_SECRET>` header

Vercel automatically sets the `Authorization` header on cron invocations using the project's `CRON_SECRET` env var when present — no extra config needed. After the first scheduled run, check **Vercel → Deployments → Functions → cron/send-stories** logs to confirm a 200.

---

## Step 6 — Local smoke test

From `/Users/brianleach/projects/spring_bbq/spring-bbq-bash`:

1. Set the production env vars in `.env.local` (or use a `--env-file` flag — never commit `.env.local`).
2. Start the app: `npm run dev`
3. Sign in to admin (`/admin`) using `ADMIN_PASSWORD`.
4. Hit the test-send endpoint to send the synthetic story preview to your own inbox:

```bash
curl -X POST http://localhost:3000/api/stories/test-send \
  -H 'Content-Type: application/json' \
  -H "Cookie: $(cat ~/.spring-bbq-admin-cookie)" \
  -d '{"to": "brian@attntodetail.ai"}'
```

(Replace cookie path with however you're carrying the admin session, or trigger via the admin Settings UI which already wires this endpoint.)

5. Expect a 200 response with `{ id: "..." }` from Resend, and the keepsake email in your inbox within 30 seconds.
6. Open the email and verify:
   - Subject renders correctly (`subjectForFamily` output)
   - LCA logo loads
   - Body HTML matches the StoryEmail template
   - Reply-To resolves to `EMAIL_REPLY_TO` (hit Reply and check the To: field)
   - Message is **not** flagged spam in Gmail/Outlook (check the warning banner)

If spam-flagged, confirm DKIM is signing (Gmail → "Show original" → look for `dkim=pass` and `spf=pass`).

---

## Step 7 — Production cron dry-run

Before April 25, 2026, do a full dry-run against the production deploy:

1. Seed the production DB with one test family + one synthetic story (via admin tools).
2. Manually invoke the cron via curl with the secret:

```bash
curl -X POST https://spring-bbq-bash.vercel.app/api/cron/send-stories \
  -H "Authorization: Bearer $CRON_SECRET"
```

3. Confirm Vercel function logs show 200, Resend dashboard shows the send, recipient receives the email.
4. Delete the test family/story rows after verification.

---

## Operational notes for event weekend

- **Resend free tier limits:** 100 emails/day, 3,000/month. If LCA expects > 100 keepsake recipients, upgrade to Pro ($20/mo) **before** April 25. The cron will silently fail past the daily limit.
- **Monitor the Resend dashboard** Saturday evening through Sunday morning — bounces, complaints, deferred sends.
- **Bounce handling:** Resend logs bounces to the dashboard; the app does not currently re-process them. If a parent reports they didn't receive their keepsake, check Resend → Logs → filter by their email.
- **Kill switch:** Pause sends by either (a) removing `RESEND_API_KEY` from Vercel env and redeploying, or (b) deleting the cron entry in `vercel.json` and redeploying. Option (a) is faster.

---

## Checklist (use during setup)

- [ ] Resend account created / accessed
- [ ] API key generated, stored in 1Password
- [ ] DNS records sent to LCA admin
- [ ] DNS records added (SPF merged, DKIM, MX)
- [ ] Domain verified green in Resend
- [ ] API key restricted to verified domain
- [ ] `EMAIL_FROM` mailbox/alias confirmed at LCA
- [ ] `EMAIL_REPLY_TO` mailbox confirmed monitored
- [ ] `RESEND_API_KEY` set on Vercel Production
- [ ] `EMAIL_FROM` set on Vercel Production
- [ ] `EMAIL_REPLY_TO` set on Vercel Production
- [ ] `CRON_SECRET` set on Vercel Production (32-byte hex)
- [ ] Production redeploy triggered
- [ ] Local smoke test passed (test-send to own inbox)
- [ ] Production cron dry-run passed
- [ ] Resend tier confirmed adequate for expected recipient count
- [ ] Day-of monitoring plan agreed with LCA

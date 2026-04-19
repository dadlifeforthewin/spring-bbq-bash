# LCA Logo — Keepsake Email Setup

How to put the Lincoln Christian Academy logo at the top of every keepsake
email instead of the default text wordmark.

**Time required:** ~10 minutes once you have the logo file in hand.

---

## How the wiring already works

End-to-end this is fully built — you just need to point it at an image URL.

| Layer | What it does | File |
|------|--------------|------|
| DB column `events.email_logo_url` | Stores the URL string | `supabase/migrations/0002_core_schema.sql` |
| Admin UI input | "Email branding → Logo URL" text field | `src/components/admin/Settings.tsx` |
| API persist | `PATCH /api/admin/settings` validates + writes the column | `src/app/api/admin/settings/route.ts` |
| Email render | Cron + test-send read `email_logo_url`, pass it to `<StoryEmail>` as `event_logo_url`. The template renders `<Img src=… height={48} />` above the wordmark when set; falls through to the text wordmark when null. | `src/emails/StoryEmail.tsx`, `src/app/api/cron/send-stories/route.ts`, `src/app/api/stories/test-send/route.ts` |

So all you need is a hosted URL.

---

## 1. Get the LCA crest

In order of preference:

1. **Ask the LCA admin office.** Email or call the school office and ask for
   the official crest as a PNG with transparent background. This is the
   fastest path and ensures you're using current brand-approved artwork.
2. **Pull from lcalincoln.com.** Inspect the header logo on the school site
   and save it. Then verify it has a transparent background; if it has a
   solid white box around it, knock the background out (Figma → Remove BG,
   or upload to remove.bg).
3. **Re-create it.** Last resort. Match the typography and crest from any
   recent LCA print piece. Don't ship without an admin signoff.

---

## 2. Specs

| Spec | Value | Why |
|------|-------|-----|
| Format | PNG (transparent background) | Email clients render PNG cleanly; transparency lets it sit on the dark INK_2 hero background |
| Width | ≤ 200 px (rendered at 48 px tall) | The template hard-codes `height={48}` — extra width wastes bytes; ~3:1 aspect ratio is the sweet spot |
| Resolution | 2x for retina (so source ~96 px tall, 400 px wide max) | Email clients on retina displays will downscale; 2x source = crisp render |
| Color | Use the LCA brand color crest, not a single-color silhouette | The hero has a dark UV gradient background, so a full-color crest with light strokes reads best |
| File size | Under 50 KB | Some Gmail / Outlook clients clip emails over 102 KB total — the email body is already heavy with photos, so keep the logo lean |

**Sanity check:** open the file at 100% on a black background — if the
strokes disappear or the colors mud out, lighten the artwork before you ship.

---

## 3. Host the file

Pick one (in order of preference):

### Option A — Supabase Storage `public-assets` bucket (recommended)

1. Open Supabase Studio → Storage.
2. If a `public-assets` (or similar public read) bucket doesn't exist,
   create one and set public read access.
3. Upload `lca-crest.png`.
4. Right-click → Get URL. The public URL looks like:
   `https://<project-ref>.supabase.co/storage/v1/object/public/public-assets/lca-crest.png`

### Option B — A CDN URL Brian already has

If the LCA file lives on the school site or another CDN you control, use
the direct image URL. **Verify it's HTTPS** — email clients drop HTTP
images.

### Option C — Any direct https URL

GitHub raw, Cloudflare R2, S3 public bucket — anything that returns
`Content-Type: image/png` over HTTPS works. Avoid Google Drive / Dropbox
share links — they redirect through HTML pages and won't render in email.

---

## 4. Paste the URL into the app

1. Sign in to admin: `https://spring-bbq-bash.vercel.app/admin`
2. Go to `/admin/settings`.
3. Scroll to **Email branding → Logo URL**.
4. Paste the full https URL.
5. Click **Save settings**. You should see a green "Saved." confirmation.

---

## 5. Verify it renders

Two ways:

**Quick visual** — same `/admin/settings` page, scroll to **Send a test
email**:
1. Enter your own email address.
2. Click **Send test**.
3. Check your inbox. The logo should appear at the top of the hero,
   centered, ~48px tall, sitting above the "LCA Spring BBQ Glow Party
   Bash 2026" wordmark.

**HTML preview** — click the **Preview HTML** link next to the test send.
This opens `/api/stories/preview` in a new tab with the rendered email
HTML using the gold-standard reference story. Confirm the logo URL loads
and isn't blocked.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Logo doesn't appear in test email | URL not HTTPS, or content-type isn't an image | Check the URL in a browser — should show the image directly, not an HTML page |
| Logo shows as broken-image icon in Gmail | URL requires auth, or bucket is private | Make the bucket / object publicly readable |
| Logo shows in preview but not in inbox | Email client (Outlook on Windows especially) blocks remote images by default | Recipient has to click "show images" — this is normal first-send behavior |
| Logo is huge / pixelated | Source image too small or too large | Re-export at ~96 px tall, 2x retina, transparent PNG |
| Logo crowds the wordmark | This is the intended look (logo + wordmark together) | If you want logo-only, you'd need to wrap the wordmark in a `{!event_logo_url && (…)}` conditional in `StoryEmail.tsx` — current design intentionally shows both |

---

## Notes for future-Brian

- The template currently shows **both** the logo and the text wordmark
  ("LCA Spring BBQ Glow Party Bash 2026" + "Glow Party Edition"). If you
  ever want logo-only, edit the conditional in `src/emails/StoryEmail.tsx`
  around the `<Heading>` and "Glow Party Edition" `<Text>` to also gate on
  `!event_logo_url`.
- The DB column is `email_logo_url`, but the email template prop is
  `event_logo_url`. The mapping happens in the API handlers (cron +
  test-send). If you ever add a third caller, mirror the
  `event_logo_url: eventRow?.email_logo_url ?? null` pattern.
- This is a one-time setup. Once the URL is in place, every keepsake email
  for this event uses it automatically.

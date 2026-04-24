# Spring BBQ Bash · Glow Party Edition

Digital ticketing, in-event spending, check-in/out, and parent push notifications for the Lincoln Christian Academy Spring BBQ Bash on **Saturday, April 25, 2026**.

Built as a single Next.js app deployable in about 20 minutes on Vercel + Supabase + ntfy.sh. **Total cost: $0.**

---

## What it does

1. **Digital tickets** in two tiers — General ($40) and VIP ($50) — each with a unique code and QR wristband.
2. **Per-ticket spending balance** for optional pre-loaded game credits.
3. **VIP perks** (Free Dress Pass, Spin the Wheel, Get Out of Jail Free, DJ Shoutout, Premium Drink, Glow Pack) tracked as single-use toggles on each ticket.
4. **Check-in and check-out** at Zone 1 (Foyer) with a QR scanner.
5. **Four zone stations** — Foyer, Main Church, TK/Quiet Area, Cafeteria — each with its own catalog of games/items and a "Call Parent" button.
6. **Free push notifications to parents** via the [ntfy.sh](https://ntfy.sh) free service. Parents install a free app at check-in, scan a QR, and get real push notifications to their locked phone when staff taps "Call Parent."
7. **Admin dashboard** with live tickets sold, checked-in count, gross revenue, spend-by-zone, recent activity.
8. **Printable wristbands** — a one-click print sheet with QR + ticket code + tier badge. Print on cardstock or sticker paper.

---

## Deploy in 20 minutes

### 1. Create the Supabase project (5 min)

1. Go to https://supabase.com → "New project" (free tier).
2. Pick any name/region. Save the **database password** somewhere.
3. Open **SQL Editor** → New query → paste the entire contents of `supabase/schema.sql` → **Run**.
4. Open **Project Settings → API**. Copy these three values:
   - `Project URL`
   - `anon public` key
   - `service_role` key (⚠ keep secret — server only)

### 2. Push the code to GitHub

```bash
cd spring-bbq-bash
git init && git add -A && git commit -m "initial"
# Create a new empty repo on github.com, then:
git remote add origin https://github.com/YOUR-USER/spring-bbq-bash.git
git push -u origin main
```

### 3. Deploy on Vercel (10 min)

1. Go to https://vercel.com → "Add New Project" → import your GitHub repo.
2. Framework = Next.js (auto-detected). No changes needed.
3. **Environment Variables** — add all of these before clicking Deploy:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | (from Supabase step) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (from Supabase step) |
| `SUPABASE_SERVICE_ROLE_KEY` | (from Supabase step — service_role) |
| `ADMIN_PASSWORD` | pick something like `bbq-2026-pink-cow-42` |
| `NTFY_TOPIC_PREFIX` | `sbbq-` + a random string — run `openssl rand -hex 8` in terminal |
| `NEXT_PUBLIC_SITE_URL` | the Vercel URL after first deploy (you'll set this after) |

4. Click **Deploy**. Wait ~2 minutes.
5. Copy the final URL (e.g. `https://spring-bbq-bash.vercel.app`). Go back to **Settings → Environment Variables**, set `NEXT_PUBLIC_SITE_URL` to that URL, and redeploy.

### 4. Add tickets and print wristbands

1. Visit `https://your-site/admin` → enter the `ADMIN_PASSWORD`.
2. Go to **Tickets → Generate tickets** → make 40 general + 10 VIP (or whatever mix you're selling).
3. Go to **Wristbands** → Print. Cut out the cards, attach to cheap neon wristbands with a pin or adhesive.
4. Go to **Catalog** and edit game names and prices to match what you actually decide on.

---

## Event-night operation

### Roles

| Station | URL | Who runs it |
|---|---|---|
| Check-in / checkout | `/checkin` | 1–2 volunteers at the Foyer door |
| Zone 1 Foyer | `/zone/foyer` | Volunteer redeeming pizza/drinks/glow sticks |
| Zone 2 Main Church | `/zone/main` | Games + DJ perks |
| Zone 3 Quiet Area | `/zone/quiet` | Movie room — typically no spending |
| Zone 4 Cafeteria | `/zone/cafeteria` | Video game volunteer |
| Admin dashboard | `/admin` | Event director |

All volunteer pages share the same `ADMIN_PASSWORD`. On a phone they sign in once and the cookie lasts 24 hours.

### Parent notification setup (at check-in)

1. Parent walks up and hands over their paid ticket.
2. Volunteer scans the wristband QR on the `/checkin` page. Enters child name, age, parent name, parent phone (as fallback).
3. A **subscribe QR code** appears on screen.
4. Parent installs the free **ntfy** app ([iOS](https://apps.apple.com/us/app/ntfy/id1625396347) · [Android](https://play.google.com/store/apps/details?id=io.heckel.ntfy)) — about 30 seconds.
5. Parent scans the on-screen QR → ntfy app opens → taps Subscribe. Done.
6. Volunteer ticks the "Parent subscribed" checkbox → Check In.

**If a parent refuses or can't install the app:** leave the checkbox unchecked. When a volunteer later taps "Call Parent," the system will return a "NOT SUBSCRIBED — use PA announcement" warning so the mic volunteer knows to page them by name.

### Calling a parent

1. Volunteer opens the zone page, scans the kid's wristband.
2. Taps the big red **📣 Call Parent Now** button. Optionally types a message like *"Emma has a scraped knee."*
3. Parent's phone gets a native push notification with title **"Emma needs you"** and the zone name. Delivery is typically 1–3 seconds.

---

## Offline / wifi-down backup plan

The digital system assumes wifi or LTE works. It almost always will. But for the ~1% chance it doesn't, here's the paper fallback:

1. **Print the wristband sheet twice.** Give one to the admin clipboard.
2. Print 4 copies of the `BACKUP-SPEND-SHEET.pdf` (one per zone) — a blank grid with columns for Ticket Code, Item, Amount, Time.
3. If the system goes down, volunteers tally spend on paper. A PA announcement covers the parent-notification gap.
4. After the event, the admin can re-enter paper transactions on `/ticket/[code]` via the admin dashboard to reconcile balances.

> I didn't auto-generate the backup sheet PDF — you can make one in Google Docs in 3 minutes. Let me know if you want me to generate it.

---

## Security notes

- **ntfy topics are unguessable** because they use your `NTFY_TOPIC_PREFIX` + the ticket code. As long as you don't publish the prefix, nobody can spam parent notifications.
- **All volunteer/admin routes** are behind the shared `ADMIN_PASSWORD` cookie gate.
- **Parent access** to `/ticket/[code]` is intentionally public so parents can open their kid's live balance from their own phone. Ticket codes are short (~6 chars) but the data exposed is non-sensitive.
- The `SUPABASE_SERVICE_ROLE_KEY` is server-only and never ships to the browser.

---

## Local development

```bash
npm install
cp .env.example .env.local
# fill in the env vars
npm run dev
# open http://localhost:3000
```

---

## File map

```
src/
  app/
    page.tsx                  # landing / station selector
    layout.tsx                # root layout
    globals.css               # glow-party theme
    checkin/page.tsx          # check-in / checkout station
    zone/[slug]/page.tsx      # per-zone station (spend + call parent)
    ticket/[code]/page.tsx    # public parent view of a ticket
    admin/
      page.tsx                # live dashboard
      tickets/page.tsx        # ticket CRUD
      catalog/page.tsx        # zone catalog editor
      wristbands/page.tsx     # printable wristband sheet
    api/
      auth/route.ts           # POST volunteer password
      tickets/route.ts        # GET all / POST create
      tickets/[code]/route.ts # GET one / PATCH / DELETE
      checkin/route.ts        # POST check-in or check-out
      spend/route.ts          # POST spend or perk redeem
      call-parent/route.ts    # POST ntfy notification
      catalog/route.ts        # GET/POST/PATCH/DELETE catalog items
      zones/route.ts          # GET zones
      stats/route.ts          # GET dashboard metrics
      ntfy-link/route.ts      # GET topic for a ticket
  lib/
    supabase.ts               # server + browser clients + Ticket type
    ntfy.ts                   # ntfy topic + send helpers
    auth.ts                   # cookie-based volunteer auth
    code.ts                   # extract ticket code from QR content
  components/
    QRScanner.tsx             # html5-qrcode wrapper
    VolunteerGate.tsx         # shared password gate
supabase/
  schema.sql                  # full database schema + seed data
```

---

## Known limitations

- **iPhone users must install the ntfy app** for push notifications. A parent who refuses the app will need a PA announcement fallback.
- **No refund button for individual items yet** — refunds must be issued by adjusting the balance directly via admin. (Can add an item-level refund button if you want.)
- **No photo-of-child** on the ticket. Could be added with Supabase Storage + a camera input on the checkin page.
- **Ticket codes are sequential** (`SBBQ-001`, `SBBQ-002`…). Fine for a private event, but guessable — anyone with the URL can see a ticket balance. If you want random codes, change `padCode` in `/api/tickets/route.ts`.

---

## Questions / extensions

Happy to add any of these on request:
- **Apple Wallet / Google Wallet passes** for the per-kid gate pass (Apple Wallet requires an Apple Developer Program membership + signing cert; Google Wallet requires a Google service account)
- **Photo of child** on check-in
- **Per-volunteer login** instead of a shared password
- **Live ticker** on the admin dashboard with sound alert for new check-ins
- **Export all data** as CSV after the event
- **Self-service online ticket sales** pre-event (Stripe integration)

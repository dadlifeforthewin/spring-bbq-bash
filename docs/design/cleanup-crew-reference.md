# Cleanup Crew Station — Design Reference

Simple toggle checklist. Brian-approved mobile mock captured 2026-04-20; simplified 2026-04-20 (removed lock / close-out mechanism — just toggles now). Source screenshot was in macOS TemporaryItems and auto-purged; ask Brian to re-send if a pixel-accurate reference is needed.

## Layout (mobile-only; `/station/cleanup`)

- `<PageHead>` — back link "← STATIONS" to `/station`, title "CLEANUP CREW", subtitle "Check items as you finish. Toggle off if something was marked by mistake.", right-side `<Chip tone="gold" glow>` showing "N/M DONE" progress (e.g., "2/7 DONE").
- Hairline dashed divider under the head.
- Stacked list of pill-style task rows. Each row:
  - Left: chunky iOS-style toggle switch (track is gold when on, gray/ink-2 when off).
  - Right of toggle: uppercase display-font task label + small mist-colored sub-label for location (e.g., "FOLD & STACK TABLES" / "Main Tent").
  - Completed rows strike through the label and desaturate the toggle.
  - Border: faint ink-hair when off; mint-at-30%-opacity glow when on (visual parity with BigToggle primitive).

## Behavior

- Item toggles are always tappable. If a task is toggled off by accident, it's toggled back on. No lock, no close-out button, no banner — just a shared checklist.
- Progress chip in the head is live-reactive to toggle state.
- Toggles are optimistic with server round-trip. A failed POST reverts the flip and surfaces an inline error.

## Tone

- **Gold** (shares with prize_wheel — never colocated on the same page).

## Admin CRUD (`/admin/cleanup`)

- List view of cleanup tasks with: label, sub (location), sort_order, active.
- Inline reorder (drag or up/down buttons).
- Add new task / edit existing / deactivate.
- Tasks persist year over year — this is a recurring event.

## DB tables

```
cleanup_tasks
  id uuid pk
  label text not null
  sub text                       -- location / detail
  sort_order int not null default 0
  active boolean not null default true
  created_at timestamptz default now()

cleanup_completions
  id uuid pk
  event_id uuid fk events
  task_id uuid fk cleanup_tasks
  completed_at timestamptz default now()
  completed_by text              -- volunteer name/handle
  unique (event_id, task_id)     -- one row per task per event; toggled off = delete row
```

The `cleanup_locks` table exists in the schema (migration `0011_cleanup.sql`) but is unused by the app. Left in place to avoid migration churn — harmless dead storage.

## Seed examples (from the mock)

1. Fold & Stack Tables — Main Tent
2. Trash Bags to Dumpster — Side lot
3. Collect Lost & Found — Check-in table
4. Pull Down Signage — Gates + parking
5. Break Down Cardboard — Back of kitchen
6. Label Leftovers for Fridge — Kitchen
7. Lock Sheds + Confirm Lights — Grounds

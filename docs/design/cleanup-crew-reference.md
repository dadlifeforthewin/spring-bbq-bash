# Cleanup Crew Station — Design Reference

Brian-approved mobile mock captured 2026-04-20. Source screenshot was in macOS TemporaryItems and auto-purged; ask Brian to re-send if a pixel-accurate reference is needed. Written description below.

## Layout (mobile-only; `/station/cleanup`)

- `<PageHead>` — back link "← STATIONS" to `/station`, title "CLEANUP CREW", subtitle "Check items as you finish. Last person to tap 'Lock' closes out the night.", right-side `<Chip tone="gold" glow>` showing "N/M DONE" progress (e.g., "2/7 DONE").
- Hairline dashed divider under the head.
- **NIGHT LOCKED banner** (`locked === true` only): gold `SignPanel` with eyebrow "CLOSEOUT CONFIRMED" + display text "NIGHT LOCKED" + locked-at timestamp. Top-of-page status banner, scrolls with content, below PageHead divider. Not sticky — it's a status indicator, not a sticky header — so it never competes with the sticky CLOSE OUT button for viewport space. Hidden when `locked === false`.
- Stacked list of pill-style task rows. Each row:
  - Left: chunky iOS-style toggle switch (track is gold when on, gray/ink-2 when off).
  - Right of toggle: uppercase display-font task label + small mist-colored sub-label for location (e.g., "FOLD & STACK TABLES" / "Main Tent").
  - Completed rows strike through the label and desaturate the toggle.
  - Border: faint ink-hair when off; mint-at-30%-opacity glow when on (visual parity with BigToggle primitive).
- Bottom sticky full-width gradient button (`CLOSE OUT (N LEFT)`): magenta→cyan gradient, disabled while `N > 0`. Tappable only when all items are toggled on.

## Behavior

- Item toggles are **always** tappable, including after close-out. Intent: someone who cleaned early can still toggle state if they miscounted, or a late volunteer can un-toggle if an item was prematurely marked.
- Close-out button is enabled only when `remaining === 0`. Tapping it POSTs a `cleanup_locked_at` timestamp on the event (single row in a `cleanup_locks` table or a column on `events`). That's it — UI affirms "Night locked" via the top-of-page status banner (not a sticky overlay — it scrolls with the task list, so the sticky CLOSE OUT button remains the only pinned UI and the last task rows stay visible). Items remain toggleable, and if any item later flips to off, `remaining` > 0 and the close-out button re-enables (tapping again writes a new `cleanup_locked_at`).
- Progress chip in the head is live-reactive to toggle state.

## Tone

- **Gold** (shares with prize_wheel — never colocated on the same page).

## Admin CRUD (`/admin/cleanup`)

- List view of cleanup tasks with: label, sub (location), sort_order, active.
- Inline reorder (drag or up/down buttons).
- Add new task / edit existing / deactivate.
- Tasks persist year over year — this is a recurring event.

## DB tables (draft)

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
  task_id uuid fk cleanup_tasks
  completed_at timestamptz default now()
  completed_by text              -- volunteer name/handle
  unique (task_id)               -- one row per task; toggled off = delete row

cleanup_locks
  id uuid pk
  locked_at timestamptz default now()
  locked_by text
```

Exact schema to be finalized in Phase 5.5 Task 5.5.5 (migration).

## Seed examples (from the mock)

1. Fold & Stack Tables — Main Tent
2. Trash Bags to Dumpster — Side lot
3. Collect Lost & Found — Check-in table
4. Pull Down Signage — Gates + parking
5. Break Down Cardboard — Back of kitchen
6. Label Leftovers for Fridge — Kitchen
7. Lock Sheds + Confirm Lights — Grounds

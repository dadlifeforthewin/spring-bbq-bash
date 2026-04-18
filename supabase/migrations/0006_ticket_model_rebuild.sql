-- Glow Party Bash ticket model:
--   - Every kid on registration gets: 2 drink tickets, 3 jail/pass tickets (one bucket, two uses),
--     1 prize wheel spin, 1 DJ shoutout
--   - All other stations are free but must be scanned so the keepsake email lists them

alter table children
  add column if not exists drink_tickets_remaining int not null default 2,
  add column if not exists jail_tickets_remaining  int not null default 3,
  add column if not exists prize_wheel_used_at     timestamptz,
  add column if not exists dj_shoutout_used_at     timestamptz;

-- Backfill any kids registered before this migration (testing data)
update children
set drink_tickets_remaining = 2,
    jail_tickets_remaining = 3
where drink_tickets_remaining is null or jail_tickets_remaining is null;

-- New station slugs
insert into stations (slug, name, sort_order) values
  ('drinks',     'Drinks',     13),
  ('dj_shoutout','DJ Shoutout',14)
on conflict (slug) do nothing;

-- The old "default_initial_tickets" on events is now legacy; left alone (unused).
-- Catalog items table is kept for admin reference but no longer drives deductions.

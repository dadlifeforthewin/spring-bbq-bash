-- Spring BBQ Bash — pre-event data wipe for fresh start (2026-04-25)
-- One-off destructive migration executed 2026-04-20. Idempotent — safe to re-run.
-- Brian-approved via admin session 2026-04-20; full rationale documented in
-- docs/STATUS-glow-redesign.md.
--
-- PRESERVES (config):
--   events            1 row — event window, branding, AI prompt
--   prizes            prize wheel catalog (populated after running this)
--   cleanup_tasks     7 seed rows (0011 migration)
--   stations          station catalog
--   catalog_items     per-station activity items
--
-- WIPES (transactional / seed families):
--   children          + cascades: guardians, pickup_authorizations,
--                       station_events, photo_tags, face_references,
--                       reload_events, ai_stories, signatures,
--                       prize_redemptions
--   photos            blob metadata (Storage bucket files NOT touched here)
--   email_sends       registration/keepsake email log
--   cleanup_completions   closeout task checkmarks
--   cleanup_locks     (deprecated but may have rows)
--   audit_log         admin action history

begin;

-- Level 1: cascades from children take care of 9 child tables
delete from children;

-- Level 2: not FK'd to children
delete from photos;
delete from email_sends;
delete from cleanup_completions;
delete from cleanup_locks;
delete from audit_log;

-- Sanity: confirm the config rows survived
do $$
declare
  evt_count   int;
  prize_cnt   int;
  cleanup_cnt int;
begin
  select count(*) into evt_count   from events;
  select count(*) into prize_cnt   from prizes;
  select count(*) into cleanup_cnt from cleanup_tasks;
  raise notice 'events=%, prizes=%, cleanup_tasks=%', evt_count, prize_cnt, cleanup_cnt;
  if evt_count = 0 then raise exception 'event row missing — aborting'; end if;
end $$;

commit;

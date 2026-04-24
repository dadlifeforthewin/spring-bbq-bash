-- 0015_checkin_dropoff_name.sql
--
-- Capture the name of the adult who physically dropped the kid off at
-- check-in when dropoff_type = 'other_approved_adult'. Required by the
-- UI in that branch, optional elsewhere. Additive; no backfill needed —
-- any rows checked in before this migration keep a NULL dropoff_name.

alter table children
  add column if not exists checked_in_dropoff_name text;

comment on column children.checked_in_dropoff_name is
  'Free-text name of the approved adult who dropped the kid off at check-in. Populated only when dropoff_type = other_approved_adult; NULL for parent / grandparent dropoffs.';

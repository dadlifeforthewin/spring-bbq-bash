-- 0009_ai_consent_granted.sql
-- Add per-child AI consent gate. When false, the entire AI pipeline
-- (story generation, face description, vision matching) skips this kid.
-- Defaults to true for any pre-existing rows so the backfill matches the
-- implicit-consent model that was in effect before today.

alter table children
  add column if not exists ai_consent_granted boolean not null default true;

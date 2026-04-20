-- Phase 5.5: enable RLS on tables added in 0010_prizes.sql and 0011_cleanup.sql.
-- Matches the posture from 0003_rls_policies.sql: RLS on, no anon policies.
-- All access is via server-side API routes using the service_role key, which
-- bypasses RLS. These tables have no public-read surface.

alter table prizes              enable row level security;
alter table prize_redemptions   enable row level security;
alter table cleanup_tasks       enable row level security;
alter table cleanup_completions enable row level security;
alter table cleanup_locks       enable row level security;

-- Enable RLS on all tables; anon has no reads/writes by default.
-- All data access is via server-side API routes using service_role key.

alter table events                 enable row level security;
alter table children               enable row level security;
alter table guardians              enable row level security;
alter table pickup_authorizations  enable row level security;
alter table stations               enable row level security;
alter table catalog_items          enable row level security;
alter table station_events         enable row level security;
alter table photos                 enable row level security;
alter table photo_tags             enable row level security;
alter table face_references        enable row level security;
alter table reload_events          enable row level security;
alter table ai_stories             enable row level security;
alter table email_sends            enable row level security;
alter table signatures             enable row level security;
alter table audit_log              enable row level security;

-- Public read access to stations + catalog_items only (needed for registration page pre-load)
create policy "public read stations" on stations for select to anon using (active = true);
create policy "public read catalog"  on catalog_items for select to anon using (active = true);
create policy "public read event"    on events for select to anon using (true);

-- No other anon access. service_role bypasses RLS (used by API routes).

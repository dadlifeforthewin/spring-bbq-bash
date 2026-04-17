-- =====================================================================
-- Kid-profile-centric schema for Spring BBQ Bash v2
-- =====================================================================

-- -------- events --------
create table events (
  id                       uuid primary key default gen_random_uuid(),
  name                     text not null,
  event_date               date not null,
  check_in_opens_at        timestamptz not null,
  check_in_closes_at       timestamptz not null,
  ends_at                  timestamptz not null,
  default_initial_tickets  int not null default 0,
  faith_tone_level         text not null default 'strong'
    check (faith_tone_level in ('strong','subtle','off')),
  reference_story_html     text,
  reference_story_text     text,
  story_prompt_template    text,
  email_from_name          text default 'LCA Spring BBQ Bash',
  email_logo_url           text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

-- -------- children --------
create table children (
  id                        uuid primary key default gen_random_uuid(),
  event_id                  uuid not null references events(id) on delete cascade,
  qr_code                   uuid not null unique default gen_random_uuid(),
  first_name                text not null,
  last_name                 text not null,
  age                       int,
  grade                     text,
  tier                      text not null default 'vip',
  allergies                 text,
  special_instructions      text,
  photo_consent_app         boolean not null default false,
  photo_consent_promo       boolean not null default false,
  vision_matching_consent   boolean not null default false,
  facts_reload_permission   boolean not null default false,
  facts_max_amount          int not null default 0 check (facts_max_amount between 0 and 10),
  ticket_balance            int not null default 0,
  checked_in_at             timestamptz,
  checked_in_dropoff_type   text check (checked_in_dropoff_type in
    ('both_parents','one_parent','grandparent','other_approved_adult')),
  checked_out_at            timestamptz,
  checked_out_to_name       text,
  checked_out_by_staff_name text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index children_event_idx on children(event_id);
create index children_qr_idx on children(qr_code);

-- -------- guardians --------
create table guardians (
  id         uuid primary key default gen_random_uuid(),
  child_id   uuid not null references children(id) on delete cascade,
  name       text not null,
  phone      text,
  email      text,
  is_primary boolean not null default false
);

create index guardians_child_idx on guardians(child_id);
create index guardians_email_idx on guardians(email) where is_primary = true;

-- -------- pickup_authorizations --------
create table pickup_authorizations (
  id           uuid primary key default gen_random_uuid(),
  child_id     uuid not null references children(id) on delete cascade,
  name         text not null,
  relationship text,
  created_at   timestamptz not null default now()
);

create index pickup_child_idx on pickup_authorizations(child_id);

-- -------- stations (seeded list, editable catalog) --------
create table stations (
  slug        text primary key,
  name        text not null,
  sort_order  int  not null default 0,
  active      boolean not null default true
);

create table catalog_items (
  id          uuid primary key default gen_random_uuid(),
  station_slug text not null references stations(slug) on delete cascade,
  name        text not null,
  ticket_cost int  not null default 0,
  sort_order  int  not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (station_slug, name)
);

create index catalog_station_idx on catalog_items(station_slug);

-- -------- station_events (the timeline) --------
create table station_events (
  id             uuid primary key default gen_random_uuid(),
  child_id       uuid not null references children(id) on delete cascade,
  station        text not null,
  event_type     text not null check (event_type in
    ('ticket_spend','photo_taken','check_in','check_out','reload')),
  tickets_delta  int  not null default 0,
  item_name      text,
  vibe_tags      text[] not null default '{}',
  volunteer_name text,
  notes          text,
  created_at     timestamptz not null default now()
);

create index station_events_child_time_idx on station_events(child_id, created_at);
create index station_events_station_idx on station_events(station, created_at);

-- -------- photos --------
create table photos (
  id               uuid primary key default gen_random_uuid(),
  storage_path     text not null,
  taken_at         timestamptz not null default now(),
  volunteer_name   text,
  capture_mode     text not null check (capture_mode in ('station_scan','roaming_vision')),
  vision_summary   jsonb,
  match_confidence numeric(4,3),
  match_status     text not null default 'confirmed'
    check (match_status in ('auto','pending_review','unmatched','confirmed','rejected'))
);

create table photo_tags (
  id         uuid primary key default gen_random_uuid(),
  photo_id   uuid not null references photos(id) on delete cascade,
  child_id   uuid not null references children(id) on delete cascade,
  tagged_by  text not null check (tagged_by in ('scan','vision_auto','admin_manual')),
  created_at timestamptz not null default now(),
  unique (photo_id, child_id)
);

create index photo_tags_child_idx on photo_tags(child_id);

-- -------- face_references --------
create table face_references (
  id                  uuid primary key default gen_random_uuid(),
  child_id            uuid not null references children(id) on delete cascade,
  reference_photo_id  uuid references photos(id) on delete set null,
  embedding_data      jsonb,
  created_at          timestamptz not null default now()
);

create index face_ref_child_idx on face_references(child_id);

-- -------- reload_events --------
create table reload_events (
  id             uuid primary key default gen_random_uuid(),
  child_id       uuid not null references children(id) on delete cascade,
  tickets_added  int  not null,
  payment_method text not null check (payment_method in ('facts','cash','venmo','comp')),
  amount_charged numeric(6,2),
  staff_name     text,
  created_at     timestamptz not null default now()
);

create index reload_child_idx on reload_events(child_id);

-- -------- ai_stories --------
create table ai_stories (
  id                uuid primary key default gen_random_uuid(),
  child_id          uuid not null unique references children(id) on delete cascade,
  generated_at      timestamptz,
  status            text not null default 'pending'
    check (status in ('pending','pending_review','needs_review','approved','auto_approved','sent','skipped')),
  story_html        text,
  story_text        text,
  photo_count       int,
  word_count        int,
  auto_check_score  numeric(4,3),
  auto_check_notes  text,
  sent_at           timestamptz,
  delivery_email    text,
  moderation_notes  text
);

create index ai_stories_status_idx on ai_stories(status);

-- -------- email_sends --------
create table email_sends (
  id                    uuid primary key default gen_random_uuid(),
  primary_parent_email  text not null,
  child_ids             uuid[] not null,
  sent_at               timestamptz,
  status                text not null default 'queued'
    check (status in ('queued','sending','sent','failed')),
  resend_message_id     text,
  error                 text,
  created_at            timestamptz not null default now()
);

-- -------- signatures --------
create table signatures (
  id             uuid primary key default gen_random_uuid(),
  child_id       uuid not null references children(id) on delete cascade,
  signature_type text not null check (signature_type in ('liability_waiver','photo_consent')),
  typed_name     text not null,
  signed_at      timestamptz not null default now(),
  ip_address     text,
  user_agent     text
);

create index signatures_child_idx on signatures(child_id);

-- -------- audit_log --------
create table audit_log (
  id          uuid primary key default gen_random_uuid(),
  action      text not null check (action in
    ('checkout','admin_login','consent_change','photo_deleted','reload','registration_edit',
     'volunteer_login','manual_pickup_override')),
  actor       text not null,
  target_type text,
  target_id   uuid,
  details     jsonb,
  ip_address  text,
  created_at  timestamptz not null default now()
);

create index audit_log_created_idx on audit_log(created_at desc);

-- -------- updated_at triggers --------
create or replace function touch_updated_at() returns trigger as $$
begin
  new.updated_at := now();
  return new;
end $$ language plpgsql;

create trigger events_updated_at before update on events
  for each row execute function touch_updated_at();
create trigger children_updated_at before update on children
  for each row execute function touch_updated_at();

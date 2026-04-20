-- -------- prizes --------
create table prizes (
  id          uuid primary key default gen_random_uuid(),
  label       text not null,
  sub         text,                              -- optional secondary label (e.g., "Toy · Kids 5+")
  sort_order  int not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- -------- prize_redemptions --------
create table prize_redemptions (
  id              uuid primary key default gen_random_uuid(),
  child_id        uuid not null references children(id) on delete cascade,
  prize_id        uuid not null references prizes(id)  on delete restrict,
  volunteer_name  text,
  updated_at      timestamptz not null default now(),
  unique (child_id)                              -- one prize per kid; upsert path overwrites
);

create index prize_redemptions_prize_idx on prize_redemptions(prize_id);

create trigger prize_redemptions_touch before update on prize_redemptions
  for each row execute function touch_updated_at();

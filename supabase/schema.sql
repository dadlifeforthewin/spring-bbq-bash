-- =====================================================================
-- Spring BBQ Bash - Glow Party Edition
-- Supabase schema. Run this entire file in Supabase SQL editor.
-- =====================================================================

-- -------- tickets --------
create table if not exists tickets (
  code            text primary key,             -- short code on the wristband, e.g. "SBBQ-042"
  tier            text not null check (tier in ('general','vip')),
  child_name      text,
  child_age       int,
  parent_name     text,
  parent_phone    text,
  balance_cents   int  not null default 0,      -- optional arcade / game credits loaded onto ticket
  -- perks that are "true = still unused":
  perk_pizza          boolean not null default true,
  perk_basic_drink    boolean not null default true,
  perk_premium_drink  boolean not null default false,
  perk_glow_stick     boolean not null default true,
  perk_glow_pack      boolean not null default false,
  perk_free_dress     boolean not null default false,
  perk_spin_wheel     boolean not null default false,
  perk_jail_free      boolean not null default false,
  perk_dj_shoutout    boolean not null default false,
  ntfy_subscribed boolean not null default false,
  checked_in      boolean not null default false,
  checked_in_at   timestamptz,
  checked_out_at  timestamptz,
  created_at      timestamptz not null default now()
);

-- When a VIP ticket is created, flip the VIP perks on by default.
create or replace function tickets_set_tier_defaults() returns trigger as $$
begin
  if new.tier = 'vip' then
    new.perk_basic_drink  := false;
    new.perk_premium_drink := true;
    new.perk_glow_stick   := false;
    new.perk_glow_pack    := true;
    new.perk_free_dress   := true;
    new.perk_spin_wheel   := true;
    new.perk_jail_free    := true;
    new.perk_dj_shoutout  := true;
  end if;
  return new;
end $$ language plpgsql;

drop trigger if exists trg_tickets_tier_defaults on tickets;
create trigger trg_tickets_tier_defaults
before insert on tickets
for each row execute function tickets_set_tier_defaults();

-- -------- zones --------
create table if not exists zones (
  slug        text primary key,
  name        text not null,
  description text,
  sort_order  int  not null default 0
);

insert into zones (slug, name, description, sort_order) values
  ('foyer',     'Zone 1 · Foyer / Entrance',       'Welcome and check-in area',                  1),
  ('main',      'Zone 2 · Main Church Area',       'DJ, dance, structured activities and games', 2),
  ('quiet',     'Zone 3 · TK / Quiet Area',        'Movie + quiet play for younger kids',        3),
  ('cafeteria', 'Zone 4 · Cafeteria',              'Video games and interactive entertainment',  4)
on conflict (slug) do nothing;

-- -------- catalog items --------
-- Items / games that can be purchased at a zone.
-- price_cents = 0 for perks that are redeemed (pizza, drinks, glow sticks).
create table if not exists catalog_items (
  id           bigserial primary key,
  zone_slug    text references zones(slug) on delete cascade,
  name         text not null,
  price_cents  int  not null default 0,
  kind         text not null default 'game' check (kind in ('game','food','drink','perk','prize')),
  active       boolean not null default true,
  sort_order   int  not null default 0,
  unique (zone_slug, name)
);

-- Placeholder catalog — fully editable in the admin dashboard.
insert into catalog_items (zone_slug, name, price_cents, kind, sort_order) values
  -- Foyer: redemption of included perks
  ('foyer',     'Redeem Pizza Slice',           0, 'food',  1),
  ('foyer',     'Redeem Basic Drink',           0, 'drink', 2),
  ('foyer',     'Redeem Premium Drink (VIP)',   0, 'drink', 3),
  ('foyer',     'Redeem Starter Glow Stick',    0, 'perk',  4),
  ('foyer',     'Redeem Glow Stick Pack (VIP)', 0, 'perk',  5),
  -- Main church area: games + DJ perks
  ('main',      'Ring Toss',                  200, 'game',  1),
  ('main',      'Bean Bag Toss',              200, 'game',  2),
  ('main',      'Cake Walk',                  300, 'game',  3),
  ('main',      'Glow Limbo',                 100, 'game',  4),
  ('main',      'DJ Shoutout (VIP)',            0, 'perk',  5),
  ('main',      'Spin the Wheel (VIP)',         0, 'perk',  6),
  ('main',      'Free Dress Pass (VIP)',        0, 'perk',  7),
  -- Cafeteria: arcade / video games
  ('cafeteria', 'Arcade Token',               100, 'game',  1),
  ('cafeteria', 'Mario Kart Race',            200, 'game',  2),
  ('cafeteria', 'Just Dance Battle',          200, 'game',  3),
  ('cafeteria', 'Jail Free Redemption (VIP)',   0, 'perk',  4)
on conflict (zone_slug, name) do nothing;

-- -------- transactions --------
create table if not exists transactions (
  id           bigserial primary key,
  ticket_code  text not null references tickets(code) on delete cascade,
  zone_slug    text references zones(slug),
  item_name    text not null,
  amount_cents int  not null,            -- positive = spend, negative = refund
  kind         text not null default 'spend' check (kind in ('spend','refund','load','perk_redeem')),
  volunteer    text,
  created_at   timestamptz not null default now()
);
create index if not exists idx_tx_ticket on transactions(ticket_code);
create index if not exists idx_tx_created on transactions(created_at desc);

-- -------- parent notifications log --------
create table if not exists notifications (
  id           bigserial primary key,
  ticket_code  text not null references tickets(code) on delete cascade,
  zone_slug    text,
  message      text not null,
  sent_by      text,
  created_at   timestamptz not null default now()
);
create index if not exists idx_notifs_ticket on notifications(ticket_code);

-- -------- enable RLS but keep it simple: server uses service role --------
alter table tickets        enable row level security;
alter table transactions   enable row level security;
alter table notifications  enable row level security;
alter table catalog_items  enable row level security;
alter table zones          enable row level security;

-- Public read of zones and active catalog items (for parent view etc.)
drop policy if exists zones_public_read on zones;
create policy zones_public_read on zones for select using (true);

drop policy if exists catalog_public_read on catalog_items;
create policy catalog_public_read on catalog_items for select using (active);

-- Everything else is accessed via API routes running under the service role,
-- so no public policies are needed on tickets/transactions/notifications.

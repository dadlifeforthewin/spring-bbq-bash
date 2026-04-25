-- Wristband pool — pre-allocated QR codes for wristbands that are printed
-- before their child rows exist. /register claims the next-available pool
-- slot atomically when a parent submits the form, so the wristband Brian
-- prints today matches whatever child registers tomorrow.
--
-- Pool rows are immortal: once claimed, claimed_at is set and the row stays
-- so the qr_code remains globally unique against the children.qr_code
-- unique index. The pool's qr_code IS the child's qr_code after claim.

create table if not exists wristband_pool (
  qr_code         uuid primary key default gen_random_uuid(),
  event_id        uuid not null references events(id) on delete cascade,
  pool_position   int  not null,
  claimed_at      timestamptz,
  created_at      timestamptz not null default now(),
  unique (event_id, pool_position)
);

create index if not exists wristband_pool_unclaimed_idx
  on wristband_pool (event_id, pool_position)
  where claimed_at is null;

-- Atomic claim: returns the next-available qr_code for the event, marking it
-- claimed in the same statement. SKIP LOCKED makes concurrent submissions
-- pick distinct slots without blocking. Returns NULL if the pool is empty.
create or replace function claim_pool_slot(p_event_id uuid)
returns uuid
language sql
as $$
  update wristband_pool
  set claimed_at = now()
  where qr_code = (
    select qr_code
    from wristband_pool
    where event_id = p_event_id
      and claimed_at is null
    order by pool_position
    limit 1
    for update skip locked
  )
  returning qr_code;
$$;

-- RLS: server-only table. Service role bypasses RLS by default; lock down
-- everything else so anon/auth roles can never see or write pool rows.
alter table wristband_pool enable row level security;

drop policy if exists wristband_pool_no_anon on wristband_pool;
create policy wristband_pool_no_anon on wristband_pool
  for all to anon, authenticated
  using (false) with check (false);

-- Seed: enough unclaimed slots so (registered children + pool) = 70.
-- Pre-existing registered kids keep their qr_codes in children.qr_code;
-- the pool only covers the spares Brian needs to print physical
-- wristbands for at-event walk-ups.
-- Idempotent: re-running this migration is a no-op once seeded.
insert into wristband_pool (event_id, pool_position)
select e.id, gs.position
from events e
cross join generate_series(
  1,
  greatest(0, 70 - (select count(*) from children where event_id = e.id))
) as gs(position)
where e.id = (select id from events limit 1)
  and not exists (select 1 from wristband_pool wp where wp.event_id = e.id);

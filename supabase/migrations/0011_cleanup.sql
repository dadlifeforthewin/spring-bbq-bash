-- Phase 5.5 cleanup crew tables
-- cleanup_tasks: global task catalog, reused across events
-- cleanup_completions: event-scoped per-task completion state
-- cleanup_locks:       event-scoped append log (one row per CLOSE OUT tap)

create table cleanup_tasks (
  id          uuid primary key default gen_random_uuid(),
  label       text not null,
  sub         text,                              -- location/detail (e.g., "Main Tent")
  sort_order  int not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table cleanup_completions (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references events(id) on delete cascade,
  task_id        uuid not null references cleanup_tasks(id) on delete restrict,
  completed_by   text,                           -- volunteer name (from request body)
  completed_at   timestamptz not null default now(),
  unique (event_id, task_id)
);

create index cleanup_completions_event_idx on cleanup_completions(event_id);

create table cleanup_locks (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references events(id) on delete cascade,
  locked_by   text,
  locked_at   timestamptz not null default now()
);

create index cleanup_locks_event_idx on cleanup_locks(event_id);

-- Seed tasks from docs/design/cleanup-crew-reference.md §Seed examples
insert into cleanup_tasks (label, sub, sort_order) values
  ('Fold & Stack Tables',           'Main Tent',       10),
  ('Trash Bags to Dumpster',        'Side lot',        20),
  ('Collect Lost & Found',          'Check-in table',  30),
  ('Pull Down Signage',             'Gates + parking', 40),
  ('Break Down Cardboard',          'Back of kitchen', 50),
  ('Label Leftovers for Fridge',    'Kitchen',         60),
  ('Lock Sheds + Confirm Lights',   'Grounds',         70);

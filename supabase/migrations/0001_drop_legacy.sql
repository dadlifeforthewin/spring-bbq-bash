-- Drop legacy ticket-centric tables. Data on the current (pre-launch) repo is disposable.
drop table if exists public.catalog_items cascade;
drop table if exists public.zones cascade;
drop table if exists public.tickets cascade;
drop function if exists public.tickets_set_tier_defaults() cascade;

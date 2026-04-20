-- Phase 5.5 stations seed — ensures picker tiles render for both new flows
insert into stations (slug, name, sort_order, active) values
  ('prize_wheel', 'Prize Wheel',  130, true),
  ('cleanup',     'Cleanup Crew', 900, true)
on conflict (slug) do update set name = excluded.name;

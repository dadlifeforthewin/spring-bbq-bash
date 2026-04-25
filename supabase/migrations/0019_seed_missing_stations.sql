-- Stations referenced by app code + 0016 reorder but never seeded into DB:
--   drinks, dj_shoutout, photo, roaming
-- The 0016 sort_order updates are no-ops without the rows existing, so the
-- picker silently drops these tiles. Seed them with the same positions
-- documented in 0016.
-- Idempotent: on conflict (slug) refresh the display name + sort_order.

insert into stations (slug, name, sort_order, active) values
  ('drinks',      'Drinks',              3,  true),
  ('dj_shoutout', 'DJ Shoutout',         7,  true),
  ('photo',       'Photo Booth',        14,  true),
  ('roaming',     'Roaming Photographer', 15, true)
on conflict (slug) do update
  set name       = excluded.name,
      sort_order = excluded.sort_order,
      active     = excluded.active;

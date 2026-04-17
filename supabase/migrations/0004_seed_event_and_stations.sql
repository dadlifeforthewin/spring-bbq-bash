-- Seed the 2026 event
insert into events (
  name, event_date, check_in_opens_at, check_in_closes_at, ends_at,
  default_initial_tickets, faith_tone_level
) values (
  'LCA Spring BBQ Glow Party Bash 2026',
  '2026-04-25',
  '2026-04-25 16:45:00-07',
  '2026-04-25 17:30:00-07',
  '2026-04-25 20:00:00-07',
  10,
  'strong'
);

-- Seed stations matching the Kids Event Station Guide
insert into stations (slug, name, sort_order) values
  ('check_in',         'Check-In & Jail Mugshot', 1),
  ('jail',             'Jail (Mugshot Station)', 2),
  ('cornhole',         'Cornhole',                3),
  ('face_painting',    'Face Painting',           4),
  ('arts_crafts',      'Arts & Crafts',           5),
  ('prize_wheel',      'Prize Wheel',             6),
  ('video_games',      'Video Games',             7),
  ('dance_competition','Dance Competition',       8),
  ('quiet_corner',     'Quiet Corner',            9),
  ('pizza',            'Pizza',                  10),
  ('cake_walk',        'Cake Walk',              11),
  ('check_out',        'Check-Out',              12);

-- Seed catalog with placeholder prices (editable pre-event in admin)
insert into catalog_items (station_slug, name, ticket_cost, sort_order) values
  ('cornhole',         'Game (3 tosses)',        2, 1),
  ('face_painting',    'Small design',           3, 1),
  ('face_painting',    'Full face',              5, 2),
  ('arts_crafts',      'Glow bracelet kit',      3, 1),
  ('arts_crafts',      'Craft project',          2, 2),
  ('prize_wheel',      'Spin',                   1, 1),
  ('video_games',      'Game session',           2, 1),
  ('dance_competition','Entry',                  2, 1),
  ('pizza',            'Slice',                  2, 1),
  ('pizza',            'Drink',                  1, 2),
  ('cake_walk',        'Entry',                  3, 1);

-- Reorder station picker tiles. Brian's request 2026-04-24:
-- food + drink should appear AFTER check-in and jail so volunteers' eyes
-- land on the highest-throughput stations first when picking their post.
--
-- Order:
--   1 check_in
--   2 jail
--   3 drinks
--   4 pizza
--   5 cake_walk
--   6 prize_wheel
--   7 dj_shoutout
--   8 cornhole
--   9 face_painting
--  10 arts_crafts
--  11 video_games
--  12 dance_competition
--  13 quiet_corner
--  14 photo
--  15 roaming
--  16 cleanup
--  99 check_out  (always last)

update stations set sort_order = 1  where slug = 'check_in';
update stations set sort_order = 2  where slug = 'jail';
update stations set sort_order = 3  where slug = 'drinks';
update stations set sort_order = 4  where slug = 'pizza';
update stations set sort_order = 5  where slug = 'cake_walk';
update stations set sort_order = 6  where slug = 'prize_wheel';
update stations set sort_order = 7  where slug = 'dj_shoutout';
update stations set sort_order = 8  where slug = 'cornhole';
update stations set sort_order = 9  where slug = 'face_painting';
update stations set sort_order = 10 where slug = 'arts_crafts';
update stations set sort_order = 11 where slug = 'video_games';
update stations set sort_order = 12 where slug = 'dance_competition';
update stations set sort_order = 13 where slug = 'quiet_corner';
update stations set sort_order = 14 where slug = 'photo';
update stations set sort_order = 15 where slug = 'roaming';
update stations set sort_order = 16 where slug = 'cleanup';
update stations set sort_order = 99 where slug = 'check_out';

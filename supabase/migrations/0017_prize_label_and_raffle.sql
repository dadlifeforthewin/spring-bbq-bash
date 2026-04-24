-- Capture the actual prize a kid won at the wheel as free text + capture
-- raffle winners (3 per event) as a flag + prize name on the child row.
-- Lets us drop the prize-catalog dropdown UI on /station/prize-wheel and
-- give volunteers a plain text input instead — simpler at the table.

alter table prize_redemptions
  add column if not exists prize_label text;

-- Loosen prize_id so the wheel station can write free-text labels alone,
-- without forcing every label into the prizes catalog. Existing rows keep
-- their FK; new rows write prize_label only.
alter table prize_redemptions
  alter column prize_id drop not null;

alter table children
  add column if not exists raffle_prize_name text;

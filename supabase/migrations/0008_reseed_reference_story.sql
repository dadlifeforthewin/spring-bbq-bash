-- Re-seed events.reference_story_text and reference_story_html with a story
-- written for the actual LCA Spring BBQ Bash — Glow Party Edition (2026-04-25),
-- using the real seeded station names (see migration 0004) and a fictional kid
-- ("Olivia Bennett") so we don't burn a real LCA family on the gold standard.
--
-- This story is the auto-check baseline (only its word count is used for the
-- ±30% rule in src/lib/auto-check.ts) and the exemplar the AI should imitate.
--
-- Rules verified before save (see src/lib/auto-check.ts):
--   * Opening (~240 chars) names the child ("Olivia")
--   * Body mentions 7 distinct seeded stations: jail, face_painting, pizza,
--     cornhole, prize_wheel, arts_crafts, dance_competition (need ≥2)
--   * Closer paragraph mentions 3 stations: face_painting, arts_crafts,
--     cornhole (need ≥2)
--   * No timestamps (no "5:30pm" / "5:12 pm" patterns)
--   * No banned phrases: adventure of a lifetime, unforgettable, blessed,
--     God, prayed (also avoided AI-slop: memorable, magical, amazing)
--   * Word count ≈ 205 (±30% → generator target ~143–267 words)
--   * Faith-aware light tone (no scripture / theology); ends with a natural
--     closer ("Thanks for letting us be part of Olivia's evening.")
--
-- Idempotent: overwrites whatever is there. Re-run safely.

update events
set
  reference_story_text = $$Third-grade energy, meet the Glow Party. Olivia's night opened with a family mugshot at the Jail — mom, dad, and one wide-eyed eight-year-old, all guilty of grinning too hard. From there she made a beeline for Face Painting and came away with a neon star across one cheek that practically glowed under the blacklights.

A slice of Pizza kept her fueled, and then she found her calling at Cornhole — three tosses, two bullseyes, and a small crowd of older kids quietly impressed. She circled back for a second round before drifting over to the Prize Wheel, which spun her into a fistful of glow sticks. The Arts & Crafts table sent her home with a beaded bracelet she strung herself, and the Dance Competition pulled her into the middle of the floor for one whole song before the lights changed.

Nights like this are what a school community looks like. So glad the Bennetts were right in the middle of it.

A neon star at Face Painting, a bracelet from Arts & Crafts, and two rounds of Cornhole. Thanks for letting us be part of Olivia's evening.

By the numbers: 7 stations visited · 18 tickets spent · 5 photos · favorite stop: Cornhole (2 visits)$$,
  reference_story_html = $$<p>Third-grade energy, meet the Glow Party. Olivia's night opened with a family mugshot at the Jail — mom, dad, and one wide-eyed eight-year-old, all guilty of grinning too hard. From there she made a beeline for Face Painting and came away with a neon star across one cheek that practically glowed under the blacklights.</p>
<p>A slice of Pizza kept her fueled, and then she found her calling at Cornhole — three tosses, two bullseyes, and a small crowd of older kids quietly impressed. She circled back for a second round before drifting over to the Prize Wheel, which spun her into a fistful of glow sticks. The Arts &amp; Crafts table sent her home with a beaded bracelet she strung herself, and the Dance Competition pulled her into the middle of the floor for one whole song before the lights changed.</p>
<p>Nights like this are what a school community looks like. So glad the Bennetts were right in the middle of it.</p>
<p>A neon star at Face Painting, a bracelet from Arts &amp; Crafts, and two rounds of Cornhole. Thanks for letting us be part of Olivia's evening.</p>
<div class="stats"><strong>By the numbers:</strong> 7 stations visited · 18 tickets spent · 5 photos · favorite stop: Cornhole (2 visits)</div>$$
where name = 'LCA Spring BBQ Glow Party Bash 2026';

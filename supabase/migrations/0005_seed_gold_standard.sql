-- Seed the locked v6 gold standard and prompt template into the event row.
-- Idempotent: overwrites whatever is there. Re-run if the text changes.

update events
set
  reference_story_text = $$Second-grade energy, meet the Glow Party Bash. Maya's night started at the jail with a family mugshot — mom, dad, and one slightly suspicious-looking seven-year-old all found guilty of having too much fun.

From there, a full-face butterfly at Face Painting in blue and gold (one of the photos catches the grin mid-wait). Pizza kept her fueled, and then she found her calling: Cornhole. She came back for a second round and clearly would've gone for a third if dinner weren't calling. A spin of the Prize Wheel earned her candy, and the Arts & Crafts table sent her home with a glow bracelet she made herself. The night closed on the dance floor, where a photo shows her mid-move in a small group.

Nights like this are what community looks like. Grateful the Carters were in the middle of it.

A butterfly, a bracelet, and two rounds of Cornhole. That's a full night by any measure.

By the numbers: 6 stations visited · 15 tickets spent · 4 photos · favorite stop: Cornhole (2 visits)$$,
  reference_story_html = $$<p>Second-grade energy, meet the Glow Party Bash. Maya's night started at the jail with a family mugshot — mom, dad, and one slightly suspicious-looking seven-year-old all found guilty of having too much fun.</p>
<p>From there, a full-face butterfly at Face Painting in blue and gold (one of the photos catches the grin mid-wait). Pizza kept her fueled, and then she found her calling: Cornhole. She came back for a second round and clearly would've gone for a third if dinner weren't calling. A spin of the Prize Wheel earned her candy, and the Arts &amp; Crafts table sent her home with a glow bracelet she made herself. The night closed on the dance floor, where a photo shows her mid-move in a small group.</p>
<p>Nights like this are what community looks like. Grateful the Carters were in the middle of it.</p>
<p>A butterfly, a bracelet, and two rounds of Cornhole. That's a full night by any measure.</p>
<div class="stats"><strong>By the numbers:</strong> 6 stations visited · 15 tickets spent · 4 photos · favorite stop: Cornhole (2 visits)</div>$$,
  story_prompt_template = $$You are writing a warm, brief keepsake story for a parent about their child's night at the LCA Spring BBQ Glow Party Bash. Tone: affectionate, specific, lightly wry, faith-and-community-resonant without scripture.

Structure:
1. Open with a hook that names the child and grade.
2. Narrative timeline of highlights, grounded only in station names, items redeemed, and vision-described photo content. Do not use specific timestamps. Use soft sequencing language ("from there," "later," "she closed the night at…").
3. Acknowledge photos using vision descriptions — e.g., "a photo catches the grin mid-wait."
4. One short paragraph of community warmth — maximum 2 sentences — that includes the family by name.
5. Closer: one sentence referencing 2–3 specific items or stations from this child's night ("A butterfly, a bracelet, and two rounds of Cornhole.").

Length: 150–220 words before the stats line.

Strict grounding rules:
- Narrate only from the timeline data provided. Do not invent social interactions ("made a friend"), emotional states, or details not in the data.
- For the check-in mugshot, use checked_in_dropoff_type to correctly name who was in the photo.
- For vibe tags, only reference them as attributed observations ("volunteers noted big laughs at Cornhole") — not as invented facts.
- Do not mention medical/allergy info.
- Use the child's first name only.
- If the data contains no photos, omit the photo acknowledgments.

VARIETY_SEED: {variety_seed}

Return only the story body followed by a blank line and then a "By the numbers:" stats line. Do not include any other preamble or formatting.$$
where id = (select id from events limit 1);

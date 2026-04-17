import { describe, it, expect } from 'vitest'
import { autoCheck } from '@/lib/auto-check'

const REFERENCE = `Second-grade energy, meet the Glow Party Bash. Maya's night started at the jail with a family mugshot — mom, dad, and one slightly suspicious-looking seven-year-old all found guilty of having too much fun.

From there, a full-face butterfly at Face Painting in blue and gold. Pizza kept her fueled, and then she found her calling: Cornhole. She came back for a second round. A spin of the Prize Wheel earned her candy, and the Arts and Crafts table sent her home with a glow bracelet. The night closed on the dance floor.

Nights like this are what community looks like. Grateful the Carters were in the middle of it.

A butterfly, a bracelet, and two rounds of Cornhole.

By the numbers: 6 stations visited · 15 tickets spent · 4 photos · favorite stop: Cornhole (2 visits)`

describe('auto-check', () => {
  it('passes a well-formed story', () => {
    const story = `Second-grade energy, meet the Glow Party Bash. Maya's night started at Face Painting where she picked a blue and gold butterfly, and the photos caught the grin mid-wait.

From there, Cornhole became her favorite. She came back for a second round and clearly would have gone for a third. A quick stop at Arts and Crafts sent her home with a glow bracelet. The night wound down at the Prize Wheel with candy in hand.

Community looks like this. Grateful the Carters were in the middle of it.

A butterfly, two rounds of Cornhole, and a bracelet from Arts and Crafts.

By the numbers: 5 stations visited · 12 tickets spent · 3 photos · favorite stop: Cornhole (2 visits)`

    const result = autoCheck({
      story_text: story,
      reference_story_text: REFERENCE,
      child_first_name: 'Maya',
      timeline_stations: ['face_painting', 'cornhole', 'arts_crafts', 'prize_wheel'],
    })
    expect(result.passed).toBe(true)
    expect(result.score).toBeGreaterThanOrEqual(0.8)
    expect(result.notes).toEqual([])
  })

  it('flags a missing child name in the first sentence', () => {
    const story = `Second-grade energy, meet the Glow Party Bash. The night started at Face Painting where the kid picked a butterfly.

Cornhole became the highlight, with two full rounds. Arts and Crafts finished the night.

A butterfly, two rounds of Cornhole, and a bracelet.

By the numbers: 3 stations visited · 8 tickets spent · 2 photos`

    const result = autoCheck({
      story_text: story,
      reference_story_text: REFERENCE,
      child_first_name: 'Maya',
      timeline_stations: ['face_painting', 'cornhole', 'arts_crafts'],
    })
    expect(result.details.first_sentence_has_name).toBe(false)
    expect(result.notes.some((n) => n.includes('missing child name'))).toBe(true)
  })

  it('flags banned phrases and timestamps', () => {
    const story = `Maya had the adventure of a lifetime at Face Painting. She showed up at 5:30 pm and immediately loved it.

Cornhole was unforgettable. Two rounds back to back.

A butterfly, two rounds of Cornhole, and a bracelet.`

    const result = autoCheck({
      story_text: story,
      reference_story_text: REFERENCE,
      child_first_name: 'Maya',
      timeline_stations: ['face_painting', 'cornhole'],
    })
    expect(result.details.banned_hits).toContain('adventure of a lifetime')
    expect(result.details.banned_hits).toContain('unforgettable')
    expect(result.details.timestamp_hit).toBe(true)
    expect(result.passed).toBe(false)
  })

  it('flags when only one timeline station is mentioned', () => {
    const story = `Maya went to Face Painting and it was great. She got a full butterfly. The paint smelled nice. The butterfly was blue and gold. It looked perfect on her.

Face Painting was the highlight, no contest.

A butterfly and more butterfly vibes. That was the night.`

    const result = autoCheck({
      story_text: story,
      reference_story_text: REFERENCE,
      child_first_name: 'Maya',
      timeline_stations: ['face_painting', 'cornhole', 'arts_crafts'],
    })
    expect(result.details.timeline_station_mentions).toBe(1)
    expect(result.notes.some((n) => n.includes('station(s) from timeline'))).toBe(true)
  })
})

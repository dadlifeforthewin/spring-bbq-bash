import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { GlyphGlow } from '@/components/glow/GlyphGlow'
import {
  ArtsCraftsGlyph,
  CakeWalkGlyph,
  CleanupGlyph,
  CornholeGlyph,
  DanceCompetitionGlyph,
  FacePaintingGlyph,
  PizzaGlyph,
  QuietCornerGlyph,
  VideoGamesGlyph,
} from '@/components/glow/glyphs'

describe('<GlyphGlow>', () => {
  it('applies tone color + glow filter to children', () => {
    const { container } = render(
      <GlyphGlow tone="cyan" size={80}><svg data-testid="g" /></GlyphGlow>
    )
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toMatch(/text-neon-cyan/)
    expect(wrapper.style.filter).toMatch(/drop-shadow/i)
    expect(wrapper.style.width).toBe('80px')
  })
})

describe('Phase 5.5 station glyphs', () => {
  it('renders CornholeGlyph inside GlyphGlow', () => {
    const { container } = render(
      <GlyphGlow tone="magenta"><CornholeGlyph /></GlyphGlow>
    )
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('renders FacePaintingGlyph inside GlyphGlow', () => {
    const { container } = render(
      <GlyphGlow tone="magenta"><FacePaintingGlyph /></GlyphGlow>
    )
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('renders ArtsCraftsGlyph inside GlyphGlow', () => {
    const { container } = render(
      <GlyphGlow tone="uv"><ArtsCraftsGlyph /></GlyphGlow>
    )
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('renders VideoGamesGlyph inside GlyphGlow', () => {
    const { container } = render(
      <GlyphGlow tone="cyan"><VideoGamesGlyph /></GlyphGlow>
    )
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('renders DanceCompetitionGlyph inside GlyphGlow', () => {
    const { container } = render(
      <GlyphGlow tone="magenta"><DanceCompetitionGlyph /></GlyphGlow>
    )
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('renders PizzaGlyph inside GlyphGlow', () => {
    const { container } = render(
      <GlyphGlow tone="gold"><PizzaGlyph /></GlyphGlow>
    )
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('renders CakeWalkGlyph inside GlyphGlow', () => {
    const { container } = render(
      <GlyphGlow tone="magenta"><CakeWalkGlyph /></GlyphGlow>
    )
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('renders QuietCornerGlyph inside GlyphGlow', () => {
    const { container } = render(
      <GlyphGlow tone="uv"><QuietCornerGlyph /></GlyphGlow>
    )
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('renders CleanupGlyph inside GlyphGlow', () => {
    const { container } = render(
      <GlyphGlow tone="gold"><CleanupGlyph /></GlyphGlow>
    )
    expect(container.querySelector('svg')).toBeTruthy()
  })
})

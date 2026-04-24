// One-shot: render the 4 email glyph SVGs to crisp PNGs via headless Chromium
// so stroked geometry renders correctly (ImageMagick's SVG renderer drops strokes).
//
// Usage: node /tmp/render-email-glyphs.mjs
// Writes: <repo>/public/email/{drinks,jail,prize-wheel,dj}.png  (144×144 @ 2x)

import { chromium } from '@playwright/test'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const OUT_DIR = '/Users/brianleach/projects/spring_bbq/spring-bbq-bash/public/email'
const SLUGS = ['drinks', 'jail', 'prize-wheel', 'dj']

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 144, height: 144 }, deviceScaleFactor: 2 })
const page = await ctx.newPage()

for (const slug of SLUGS) {
  const svg = await readFile(path.join(OUT_DIR, `${slug}.svg`), 'utf8')
  await page.setContent(
    `<!doctype html><html><body style="margin:0;padding:0;background:transparent">
      <div style="width:144px;height:144px;display:flex;align-items:center;justify-content:center">
        ${svg.replace(/width="[^"]*"/g, '').replace(/height="[^"]*"/g, '').replace('<svg', '<svg width="144" height="144"')}
      </div>
    </body></html>`,
  )
  const buf = await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: 144, height: 144 } })
  await writeFile(path.join(OUT_DIR, `${slug}.png`), buf)
  console.log(`${slug}.png: ${buf.length} bytes`)
}

await browser.close()

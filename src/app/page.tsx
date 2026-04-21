'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import styles from './page.module.css'

// 5pm Pacific Daylight Time on Saturday, April 25, 2026 (DST → UTC-7).
const TARGET_MS = new Date('2026-04-25T17:00:00-07:00').getTime()

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function useCountdown(target: number) {
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  if (now === null) {
    return { d: '00', h: '00', m: '00', s: '00' }
  }
  let diff = Math.max(0, target - now)
  const d = Math.floor(diff / 86400000)
  diff -= d * 86400000
  const h = Math.floor(diff / 3600000)
  diff -= h * 3600000
  const m = Math.floor(diff / 60000)
  diff -= m * 60000
  const s = Math.floor(diff / 1000)
  return { d: pad(d), h: pad(h), m: pad(m), s: pad(s) }
}

export default function Home() {
  const { d, h, m, s } = useCountdown(TARGET_MS)

  return (
    <div className={styles.page}>
      {/* Backdrop: radial atmosphere wash + perspective grid floor + noise */}
      <div className={styles.backdrop} aria-hidden="true">
        <div className={styles.floor} />
        <div className={styles.noise} />
      </div>

      <main className={styles.shell}>
        {/* Topbar */}
        <header className={styles.topbar}>
          <div className={styles.crest}>
            <div className={styles.crestSeal}>LCA</div>
            <div className={styles.crestText}>
              <b>Lincoln Christian Academy</b>
              <span>EST. 1995 · 30 YEARS · PTF</span>
            </div>
          </div>
          <div className={styles.ticker} aria-hidden="true">
            <span className={styles.tickerPill}>SPRING &apos;26</span>
            <span>WRISTBANDS ON / LIGHTS OUT AT 5:00 SHARP</span>
            <span className={styles.live}>
              <span className={styles.liveDot} />
              LIVE
            </span>
          </div>
        </header>

        {/* HERO */}
        <section className={styles.hero}>
          <div className={styles.heroKicker}>
            <span className={styles.bar} aria-hidden="true" />
            Courtyard by the water fountain · All grades welcome
          </div>

          <div className={styles.signWrap}>
            <span className={`${styles.bolt} ${styles.boltTL}`} aria-hidden="true" />
            <span className={`${styles.bolt} ${styles.boltTR}`} aria-hidden="true" />
            <span className={`${styles.bolt} ${styles.boltBL}`} aria-hidden="true" />
            <span className={`${styles.bolt} ${styles.boltBR}`} aria-hidden="true" />

            <div className={styles.tagline}>
              <span className={styles.taglineStar} aria-hidden="true">✦</span>
              <span>Sat · April 25 · 5–8 PM</span>
              <span className={styles.taglineStar} aria-hidden="true">✦</span>
              <span>Dress comfy to glow</span>
              <span className={styles.taglineStar} aria-hidden="true">✦</span>
            </div>

            <h1 className={styles.neonTitle}>
              <span className={`${styles.line} ${styles.lineCyan}`}>SPRING BBQ</span>
              <span className={`${styles.line} ${styles.linePink}`}>
                BASH <span className={styles.amp}>&amp;</span> GLOW
              </span>
            </h1>

            <div className={styles.edition}>
              <span className={styles.editionSticks} aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <b>GLOW PARTY EDITION</b>
              <span className={styles.editionVol}>· Vol. 30</span>
            </div>
          </div>

          {/* Stat strip */}
          <div className={styles.statStrip}>
            <div className={`${styles.stat} ${styles.statDate}`}>
              <div className={styles.statLbl}>Doors open in</div>
              <div className={`${styles.statVal} ${styles.countdown}`}>
                <span className={styles.countdownSeg}>
                  <b>{d}</b>
                  <span>DAYS</span>
                </span>
                <span className={styles.countdownColon}>:</span>
                <span className={styles.countdownSeg}>
                  <b>{h}</b>
                  <span>HRS</span>
                </span>
                <span className={styles.countdownColon}>:</span>
                <span className={styles.countdownSeg}>
                  <b>{m}</b>
                  <span>MIN</span>
                </span>
                <span className={styles.countdownColon}>:</span>
                <span className={styles.countdownSeg}>
                  <b>{s}</b>
                  <span>SEC</span>
                </span>
              </div>
            </div>
            <div className={`${styles.stat} ${styles.statTime}`}>
              <div className={styles.statLbl}>When</div>
              <div className={styles.statVal}>5–8 PM</div>
              <div className={styles.statSub}>Sat, Apr 25, 2026</div>
            </div>
            <div className={`${styles.stat} ${styles.statWhere}`}>
              <div className={styles.statLbl}>Check-in</div>
              <div className={styles.statVal}>Courtyard</div>
              <div className={styles.statSub}>By the water fountain · LCA Main Campus</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statLbl}>Dress code</div>
              <div className={styles.statVal}>COMFY + GLOW</div>
              <div className={styles.statSub}>Comfy clothes that work with the glow.</div>
            </div>
          </div>
        </section>

        {/* WRISTBAND PERKS */}
        <section>
          <div className={styles.sectionLabel}>
            <span className={styles.sectionNum}>01</span>
            <span>What the wristband unlocks</span>
            <span className={styles.sectionRule} aria-hidden="true" />
          </div>

          <div className={styles.wristband}>
            <div className={styles.wbHead}>
              <h2>
                Every wristband = <em>one full night</em> of fun.
              </h2>
              <p>
                Staff scan the wristband at each station. When a perk is used, it&apos;s crossed off — no
                cash, no cards, no lost tickets.
              </p>
            </div>

            <div className={styles.perks}>
              <div className={`${styles.perk} ${styles.perk1}`}>
                <div className={styles.perkCount}>2</div>
                <svg
                  className={styles.perkIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <path d="M7 10h10l-1 9a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2L7 10Z" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
                <h3>DRINKS</h3>
                <p>Something cold from the drink tent.</p>
              </div>
              <div className={`${styles.perk} ${styles.perk2}`}>
                <div className={styles.perkCount}>3</div>
                <svg
                  className={styles.perkIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <rect x="4" y="5" width="16" height="14" rx="1" />
                  <path d="M8 5v14M12 5v14M16 5v14" />
                </svg>
                <h3>JAIL / PASS</h3>
                <p>Passes to break out of glow-jail. Use &apos;em all if you get extra mischievous.</p>
              </div>
              <div className={`${styles.perk} ${styles.perk3}`}>
                <div className={styles.perkCount}>1</div>
                <svg
                  className={styles.perkIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 3v9l6 3" />
                </svg>
                <h3>PRIZE SPIN</h3>
                <p>One spin on the big wheel. Every slot wins.</p>
              </div>
              <div className={`${styles.perk} ${styles.perk4}`}>
                <div className={styles.perkCount}>1</div>
                <svg
                  className={styles.perkIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <path d="M12 2v12" />
                  <circle cx="10" cy="17" r="3" />
                  <path d="M13 14l6-3V4l-6 3" />
                </svg>
                <h3>DJ SHOUTOUT</h3>
                <p>Drop your name in the booth — hear it over the speakers.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section>
          <div className={styles.sectionLabel}>
            <span className={styles.sectionNum}>02</span>
            <span>Before the party · For parents</span>
            <span className={styles.sectionRule} aria-hidden="true" />
          </div>

          <div className={styles.ctaRow}>
            <article className={`${styles.ctaCard} ${styles.ctaCardPrimary}`}>
              <div className={styles.ctaEyebrow}>Step 2 · Parents · ~2 minutes</div>
              <h3>Finish the permission slip — we&apos;ll have their wristband ready at the gate.</h3>
              <p>
                Already bought a ticket? Great. Just fill this out and we&apos;ll have everything
                ready at check-in — no line, no paperwork.
              </p>
              <Link className={styles.bigBtn} href="/register">
                Fill out permission slip
                <span className={styles.arrow} aria-hidden="true">→</span>
              </Link>
            </article>
          </div>
        </section>

        <footer className={styles.footer}>
          <div>
            Designed &amp; built by{' '}
            <a href="https://attntodetail.ai" target="_blank" rel="noreferrer">
              Attn: To Detail
            </a>{' '}
            · Donated to LCA for 30 years.
          </div>
          <div>© 2026 · LCA PTF</div>
        </footer>
      </main>
    </div>
  )
}

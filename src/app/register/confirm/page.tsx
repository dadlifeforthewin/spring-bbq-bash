'use client'

import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import s from './page.module.css'
import {
  REGISTRATION_RESULT_KEY,
  type RegistrationResultPayload,
} from '@/components/registration/RegistrationForm'

/**
 * Marquee Check-in (Variant C from docs/design/Parent Registration.html).
 *
 * P0 fix: this used to render decorative copy and ignore the API
 * response, leaving parents with no record of which wristband
 * belonged to which kid. We now read the registration result from
 * sessionStorage (written by RegistrationForm.onSubmit) and render a
 * "gate-pass" with one real per-kid QR code, plus an edit link, .ics
 * calendar, print, and (placeholder) wallet affordance.
 *
 * If sessionStorage is empty (e.g. the parent reloaded after closing
 * the tab), we fall back to a calm "check your email" message rather
 * than fabricating data.
 */
export default function ConfirmPage() {
  const [payload, setPayload] = useState<RegistrationResultPayload | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [qrUrls, setQrUrls] = useState<Record<string, string>>({})

  useEffect(() => {
    setHydrated(true)
    try {
      const raw = sessionStorage.getItem(REGISTRATION_RESULT_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as RegistrationResultPayload
      if (parsed && Array.isArray(parsed.created)) setPayload(parsed)
    } catch {
      // ignore — fallback UI handles missing payload
    }
  }, [])

  // Render each child's QR code as a data URL once the payload is known.
  useEffect(() => {
    if (!payload?.children_meta) return
    let cancelled = false
    ;(async () => {
      const next: Record<string, string> = {}
      for (const c of payload.children_meta) {
        if (!c.qr_code) continue
        try {
          next[c.qr_code] = await QRCode.toDataURL(c.qr_code, {
            errorCorrectionLevel: 'M',
            margin: 1,
            width: 320,
            color: { dark: '#000000', light: '#ffffff' },
          })
        } catch {
          // skip — kid card just won't show a QR for this one
        }
      }
      if (!cancelled) setQrUrls(next)
    })()
    return () => {
      cancelled = true
    }
  }, [payload])

  // Build a downloadable .ics for April 25, 2026 5–8pm.
  // Date math: 2026-04-25 17:00–20:00 local. We emit floating local time
  // so the file works the same in every parent's timezone.
  const icsDataUrl = useMemo(() => {
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Lincoln Christian Academy//Spring BBQ Bash//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:spring-bbq-bash-2026@attntodetail.ai',
      'SUMMARY:Spring BBQ Bash · Glow Party Edition',
      'DESCRIPTION:Lincoln Christian Academy — bring your whole family. Wear glow.',
      'LOCATION:Lincoln Christian Academy',
      'DTSTART:20260425T170000',
      'DTEND:20260425T200000',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')
    return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`
  }, [])

  // Family display string. Pulled from the first child's last name when
  // available, falls back to "FAMILY" so the pass never goes blank.
  const familyDisplay = useMemo(() => {
    if (!payload) return 'FAMILY'
    const ln = payload.family_name?.trim()
    if (!ln || /^family$/i.test(ln)) return 'FAMILY'
    return `THE ${ln.toUpperCase()}S`
  }, [payload])

  if (!hydrated) {
    // Avoid hydration mismatch — render the shell only.
    return (
      <div className={s.shell}>
        <div className={s.backdrop} aria-hidden>
          <div className={s.floor} />
        </div>
        <main className={s.main} />
      </div>
    )
  }

  if (!payload) {
    return (
      <div className={s.shell}>
        <div className={s.backdrop} aria-hidden>
          <div className={s.floor} />
        </div>
        <main className={s.main}>
          <div className={s.fallback}>
            <h1>You&apos;re registered.</h1>
            <p>
              We don&apos;t have your confirmation handy on this device — most
              likely the tab was closed and reopened. Check the email at the
              address you used to sign up; your edit link is in there.
            </p>
            <p>
              Need help? Email{' '}
              <a href="mailto:brian@attntodetail.ai" className={s.miniLink} style={{ display: 'inline-flex' }}>
                brian@attntodetail.ai
              </a>
            </p>
          </div>
        </main>
      </div>
    )
  }

  const wristbandCount = payload.created.length
  const editUrl = `/register/edit/${payload.edit_token}`

  return (
    <div className={s.shell}>
      <div className={s.backdrop} aria-hidden>
        <div className={s.floor} />
      </div>

      <main className={s.main}>
        <div className={s.topbar}>
          <span className={s.crestPill}>
            <span className={s.crestSeal}>LCA</span>
            <span className={s.crestText}>Spring Bash &apos;26</span>
          </span>
          <span className={s.confirmedPill}>
            <span className={s.confirmedDot} aria-hidden />
            Confirmed
          </span>
        </div>

        {/* Big marquee */}
        <div className={s.marquee}>
          <span className={`${s.marqueeLine} ${s.marqueeYoure}`}>YOU&apos;RE</span>
          <span className={`${s.marqueeLine} ${s.marqueeIn}`}>IN</span>
          <div className={s.marqueeKicker}>April 25 · Doors 4:45 · 5–8 PM · The Lot</div>
        </div>

        {/* Gate-pass card */}
        <section className={s.section} aria-labelledby="gate-pass-heading">
          <h2 id="gate-pass-heading" style={{ position: 'absolute', left: -9999 }}>Family gate pass</h2>
          <div className={s.pass}>
            <div className={s.passHead}>
              <div>
                <div className={s.passHeadLabel}>Family</div>
                <div className={s.passFamily}>{familyDisplay}</div>
              </div>
              <div className={s.passWristbandsLabel}>
                <div className={s.passHeadLabel}>Wristbands</div>
                <div className={s.passWristbandsCount}>{wristbandCount}</div>
              </div>
            </div>
            <div className={s.perforation} aria-hidden />

            <div className={s.kidList}>
              {payload.children_meta.map((kid, i) => {
                const gradeLabel = kid.grade?.trim() || '—'
                const avatarLetter = (gradeLabel[0] || (kid.first_name[0] ?? '?')).toUpperCase()
                const color = avatarColor(i)
                const kidName = `${kid.first_name} ${kid.last_name?.[0] ?? ''}.`.trim()
                const dataUrl = qrUrls[kid.qr_code]

                return (
                  <div key={kid.qr_code || i}>
                    <div className={s.kidRow}>
                      <div
                        className={s.kidAvatar}
                        style={{
                          background: `color-mix(in oklab, ${color} 22%, transparent)`,
                          border: `1px solid color-mix(in oklab, ${color} 70%, transparent)`,
                          color,
                          textShadow: `0 0 6px ${color}`,
                        }}
                      >
                        {avatarLetter}
                      </div>
                      <div className={s.kidNameRow}>
                        <span className={s.kidName}>{kidName}</span>
                        <span className={s.kidGrade}>Grade {gradeLabel}</span>
                      </div>
                      {kid.allergies && (
                        <span className={s.kidAllergyPill}>⚠ {truncate(kid.allergies, 26).toUpperCase()}</span>
                      )}
                    </div>

                    <div className={s.kidQrSection}>
                      <div className={s.kidQrCard}>
                        <div className={s.kidQrImg}>
                          {dataUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={dataUrl} alt={`Wristband QR code for ${kidName}`} />
                          ) : (
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#000' }}>
                              {kid.qr_code ? '…' : 'NO QR'}
                            </span>
                          )}
                        </div>
                        <div className={s.kidQrMeta}>
                          <div className={s.kidQrName}>{kidName.toUpperCase()}</div>
                          <div className={s.kidQrCode}>{kid.qr_code || 'pending'}</div>
                          <div className={s.kidQrHint}>
                            Show this at the gate Saturday. Volunteers scan
                            it to attach drinks, jail passes, and the prize
                            spin.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className={s.actionStack}>
          <a className={s.cta} href={icsDataUrl} download="spring-bbq-bash.ics">
            ADD TO CALENDAR · APR 25
          </a>

          <div className={s.miniLinkRow}>
            <a className={s.miniLink} href={editUrl}>
              Edit my registration
            </a>
            <button
              type="button"
              className={s.miniLink}
              onClick={() => {
                if (typeof window !== 'undefined') window.print()
              }}
            >
              Print this page
            </button>
          </div>
        </div>

        {payload.primary_email && (
          <div className={s.confirmEmail}>
            Confirmation sent to {payload.primary_email}
          </div>
        )}

        <footer className={s.footer}>
          Need to update pickup authorizations or contact info? Email{' '}
          <a href="mailto:brian@attntodetail.ai">brian@attntodetail.ai</a>.
          <br />
          Built with love by{' '}
          <a href="https://attntodetail.ai">Attn: To Detail</a>
          {' '}for Lincoln Christian Academy.
        </footer>
      </main>
    </div>
  )
}

function avatarColor(i: number): string {
  const palette = ['#22d3ee', '#ff3ea5', '#fde047', '#8b5cf6', '#4be6b3']
  return palette[i % palette.length]
}

function truncate(s: string, max: number) {
  if (s.length <= max) return s
  return s.slice(0, max - 1) + '…'
}

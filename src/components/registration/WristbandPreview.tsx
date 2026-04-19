'use client'

/**
 * WristbandPreview — Variant A "Wristband Builder" from
 * docs/design/Parent Registration.html.
 *
 * Renders a live preview of the kid's wristband as the parent fills in
 * their info. Shows kid name (Bungee, yellow glow), grade + a placeholder
 * code line, a stylised mini-QR, and the four locked perk slots
 * (drinks / jail / spin / DJ shoutout) per the Glow Party ticket model.
 *
 * Pure visual — no state, no DB writes. Real per-kid QR codes are
 * rendered on /register/confirm using the qrcode library after the
 * registration POST completes.
 */
export default function WristbandPreview({
  firstName,
  lastName,
  grade,
  hasAllergies,
}: {
  firstName?: string
  lastName?: string
  grade?: string
  hasAllergies?: boolean
}) {
  const displayName =
    [firstName?.trim(), lastName?.trim() ? lastName.trim()[0] + '.' : '']
      .filter(Boolean)
      .join(' ')
      .toUpperCase() || 'NEW WRISTBAND'

  const gradeLine = (() => {
    const g = grade?.trim()
    return `GRADE ${g ? g.toUpperCase() : '—'} · #PENDING`
  })()

  // Stylised QR placeholder — fixed bit pattern, not the real code.
  // The real code lives in DB and is rendered on /register/confirm.
  const QR_BITS = '11010101100101111100110101100110011010110100111010'

  return (
    <div className="sbbq-wb-wrap">
      <div className="sbbq-wb-card">
        <div className="sbbq-wb-glow" aria-hidden />
        <div className="sbbq-wb-band">
          <div className="sbbq-wb-holes" aria-hidden>
            <span /><span /><span />
          </div>
          <div className="sbbq-wb-text">
            <div className="sbbq-wb-name">{displayName}</div>
            <div className="sbbq-wb-meta">{gradeLine}</div>
          </div>
          <div className="sbbq-wb-qr" aria-hidden>
            {QR_BITS.split('').map((b, i) => (
              <div key={i} className={b === '1' ? 'on' : ''} />
            ))}
          </div>
        </div>

        <div className="sbbq-wb-perks">
          <PerkSlot count={2} label="DRINKS" color="cyan" />
          <PerkSlot count={3} label="JAIL" color="pink" />
          <PerkSlot count={1} label="SPIN" color="yellow" />
          <PerkSlot count={1} label="DJ" color="purple" />
        </div>

        {hasAllergies && (
          <div className="sbbq-wb-allergyFlag" aria-label="Allergy flag preview">
            <span className="sbbq-wb-allergyDot">⚠</span>
            <span>Allergy noted — flagged at every food scan</span>
          </div>
        )}
      </div>

      <style jsx>{`
        .sbbq-wb-wrap {
          margin-bottom: 18px;
        }
        .sbbq-wb-card {
          position: relative;
          padding: 16px;
          border-radius: 16px;
          background: var(--bg-elev);
          border: 1px solid var(--line);
          overflow: hidden;
        }
        .sbbq-wb-glow {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(ellipse at 50% 120%, color-mix(in oklab, var(--glow-pink) 30%, transparent), transparent 60%);
        }
        .sbbq-wb-band {
          position: relative;
          height: 80px;
          border-radius: 8px;
          background: linear-gradient(135deg, #1a0933, #0b0118);
          border: 1.5px solid color-mix(in oklab, var(--glow-pink) 60%, transparent);
          box-shadow:
            0 0 24px color-mix(in oklab, var(--glow-pink) 30%, transparent),
            inset 0 0 12px color-mix(in oklab, var(--glow-pink) 18%, transparent);
          padding: 8px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }
        .sbbq-wb-holes {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .sbbq-wb-holes span {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--bg);
          display: block;
        }
        .sbbq-wb-text {
          flex: 1;
          text-align: center;
          min-width: 0;
        }
        .sbbq-wb-name {
          font-family: var(--font-bungee), sans-serif;
          font-size: clamp(11px, 3.6vw, 16px);
          color: var(--glow-yellow);
          text-shadow: 0 0 10px color-mix(in oklab, var(--glow-yellow) 70%, transparent);
          letter-spacing: 0.02em;
          line-height: 1.05;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .sbbq-wb-meta {
          font-family: var(--font-mono), monospace;
          font-size: 9.5px;
          letter-spacing: 0.2em;
          color: var(--ink-dim);
          margin-top: 2px;
          text-transform: uppercase;
        }
        .sbbq-wb-qr {
          flex-shrink: 0;
          width: 50px;
          height: 50px;
          border-radius: 4px;
          background: #fff;
          padding: 3px;
          display: grid;
          grid-template-columns: repeat(10, 1fr);
          gap: 1px;
        }
        .sbbq-wb-qr div { background: transparent; }
        .sbbq-wb-qr div.on { background: #000; }

        .sbbq-wb-perks {
          margin-top: 14px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }

        .sbbq-wb-allergyFlag {
          margin-top: 12px;
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid color-mix(in oklab, #4be6b3 50%, transparent);
          background: color-mix(in oklab, #4be6b3 10%, transparent);
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: var(--font-sans), sans-serif;
          font-size: 12px;
          color: #d7f7ec;
        }
        .sbbq-wb-allergyDot {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: color-mix(in oklab, #4be6b3 18%, transparent);
          border: 1px solid color-mix(in oklab, #4be6b3 60%, transparent);
          color: #4be6b3;
          display: grid;
          place-items: center;
          font-size: 12px;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  )
}

function PerkSlot({
  count,
  label,
  color,
}: {
  count: number
  label: string
  color: 'cyan' | 'pink' | 'yellow' | 'purple'
}) {
  const colorVar = {
    cyan: 'var(--glow-cyan)',
    pink: 'var(--glow-pink)',
    yellow: 'var(--glow-yellow)',
    purple: 'var(--glow-purple)',
  }[color]

  return (
    <div className="sbbq-perk">
      <div className="sbbq-perk-num">{count}</div>
      <div className="sbbq-perk-label">{label}</div>
      <style jsx>{`
        .sbbq-perk {
          padding: 10px 8px 8px;
          border-radius: 10px;
          background: color-mix(in oklab, ${colorVar} 8%, var(--bg));
          border: 1px solid color-mix(in oklab, ${colorVar} 55%, transparent);
          display: flex;
          flex-direction: column;
          gap: 2px;
          box-shadow: 0 0 18px color-mix(in oklab, ${colorVar} 22%, transparent);
          text-align: center;
        }
        .sbbq-perk-num {
          font-family: var(--font-monoton), sans-serif;
          font-size: 30px;
          line-height: 0.9;
          color: ${colorVar};
          text-shadow:
            0 0 6px ${colorVar},
            0 0 16px color-mix(in oklab, ${colorVar} 60%, transparent);
        }
        .sbbq-perk-label {
          font-family: var(--font-bungee), sans-serif;
          font-size: 9px;
          letter-spacing: 0.06em;
          color: #fff;
        }
      `}</style>
    </div>
  )
}

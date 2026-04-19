'use client'

import { ReactNode } from 'react'

/**
 * BigToggle — Variant B "Backstage Pass" pattern from
 * docs/design/Parent Registration.html.
 *
 * One row = icon tile + title + sub copy + iOS-style toggle.
 * When ON: glowing colored border, tinted bg, glowing track.
 *
 * Wraps a real <input type="checkbox"> so screen readers + keyboard
 * users still get the right semantics. The visible "switch" is a
 * decorative div behind the input.
 */
export default function BigToggle({
  on,
  onChange,
  color,
  title,
  sub,
  icon,
  ariaLabel,
  children,
}: {
  on: boolean
  onChange: (next: boolean) => void
  color: 'cyan' | 'pink' | 'purple' | 'yellow'
  title: string
  sub?: string
  icon: ReactNode
  ariaLabel: string
  /** Optional extra content (e.g. legal disclosure) rendered below the row */
  children?: ReactNode
}) {
  const colorVar = {
    cyan: 'var(--glow-cyan)',
    pink: 'var(--glow-pink)',
    purple: 'var(--glow-purple)',
    yellow: 'var(--glow-yellow)',
  }[color]

  return (
    <div className={`sbbq-bt ${on ? 'is-on' : ''}`}>
      <label className="sbbq-bt-row">
        <input
          type="checkbox"
          aria-label={ariaLabel}
          checked={on}
          onChange={(e) => onChange(e.target.checked)}
          className="sbbq-bt-input"
        />
        <span className="sbbq-bt-icon" aria-hidden>{icon}</span>
        <span className="sbbq-bt-text">
          <span className="sbbq-bt-title">{title}</span>
          {sub && <span className="sbbq-bt-sub">{sub}</span>}
        </span>
        <span className="sbbq-bt-track" aria-hidden>
          <span className="sbbq-bt-knob" />
        </span>
      </label>
      {children && <div className="sbbq-bt-children">{children}</div>}

      <style jsx>{`
        .sbbq-bt {
          padding: 14px 14px 12px;
          border-radius: 14px;
          background: var(--bg-elev);
          border: 1px solid var(--line);
          transition: all 220ms ease;
        }
        .sbbq-bt.is-on {
          background: color-mix(in oklab, ${colorVar} 10%, var(--bg-elev));
          border-color: color-mix(in oklab, ${colorVar} 55%, transparent);
          box-shadow:
            0 0 22px color-mix(in oklab, ${colorVar} 22%, transparent),
            inset 0 0 12px color-mix(in oklab, ${colorVar} 8%, transparent);
        }

        .sbbq-bt-row {
          position: relative;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
        }

        /* Visually hide but keep clickable + a focus target — the
           visible track/knob is sibling chrome only. The input fills
           the row (NOT the whole card; children like <details> sit
           below the label and need their own pointer events). */
        .sbbq-bt-input {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          margin: 0;
          opacity: 0;
          cursor: pointer;
          z-index: 2;
        }

        .sbbq-bt-icon {
          flex-shrink: 0;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: var(--bg);
          border: 1px solid var(--line);
          display: grid;
          place-items: center;
          font-size: 18px;
          color: var(--ink-dim);
          transition: all 220ms ease;
        }
        .sbbq-bt.is-on .sbbq-bt-icon {
          background: color-mix(in oklab, ${colorVar} 22%, transparent);
          border-color: color-mix(in oklab, ${colorVar} 55%, transparent);
          color: ${colorVar};
        }

        .sbbq-bt-text {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .sbbq-bt-title {
          font-family: var(--font-bungee), sans-serif;
          font-size: 13px;
          letter-spacing: 0.01em;
          color: var(--ink);
        }
        .sbbq-bt-sub {
          font-family: var(--font-sans), sans-serif;
          font-size: 11.5px;
          line-height: 1.4;
          color: var(--ink-dim);
        }

        .sbbq-bt-track {
          position: relative;
          flex-shrink: 0;
          width: 46px;
          height: 26px;
          border-radius: 999px;
          background: rgba(58, 58, 58, 1);
          transition: all 220ms ease;
        }
        .sbbq-bt.is-on .sbbq-bt-track {
          background: ${colorVar};
          box-shadow: 0 0 14px color-mix(in oklab, ${colorVar} 70%, transparent);
        }
        .sbbq-bt-knob {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
          transition: left 200ms ease;
        }
        .sbbq-bt.is-on .sbbq-bt-knob {
          left: 22px;
        }

        .sbbq-bt-children {
          margin-top: 12px;
          padding-left: 52px;
        }

        /* Keyboard-focus ring on the visually-hidden input */
        .sbbq-bt-input:focus-visible + .sbbq-bt-icon {
          outline: 2px solid color-mix(in oklab, ${colorVar} 80%, transparent);
          outline-offset: 2px;
        }
      `}</style>
    </div>
  )
}

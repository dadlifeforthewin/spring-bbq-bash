'use client'

import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'

type Child = {
  id: string
  qr_code: string
  first_name: string
  last_name: string
  grade: string | null
  allergies: string | null
}

type PoolSlot = { qr_code: string; pool_position: number }

// Avery 5168 layout — 3-1/2" × 5" labels, 2 across × 2 down on US letter,
// 4 labels per sheet. Margins (Avery published spec):
//   top:        0.5in
//   bottom:     0.5in
//   left:       0.75in
//   right:      0.75in
//   col gap:    0in (columns flush)
//   row gap:    0in
//   label:      3.5in × 5in
const STRIPS_PER_LABEL = 6
const LABELS_PER_SHEET = 4
const STRIPS_PER_SHEET = STRIPS_PER_LABEL * LABELS_PER_SHEET // 24

export default function WristbandLabelsPage() {
  const [children, setChildren] = useState<Child[] | null>(null)
  const [pool, setPool] = useState<PoolSlot[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [qrUrls, setQrUrls] = useState<Record<string, string>>({})
  const [search, setSearch] = useState('')

  useEffect(() => {
    let alive = true
    Promise.all([
      fetch('/api/admin/children?status=all', { credentials: 'include' }).then(async (r) => {
        if (!r.ok) throw new Error(`children ${r.status}`)
        return (await r.json()) as { children: Child[] }
      }),
      fetch('/api/admin/wristband-pool', { credentials: 'include' }).then(async (r) => {
        if (!r.ok) throw new Error(`pool ${r.status}`)
        return (await r.json()) as { pool: PoolSlot[] }
      }),
    ])
      .then(([childrenData, poolData]) => {
        if (!alive) return
        setChildren(childrenData.children ?? [])
        setPool(poolData.pool ?? [])
      })
      .catch((e) => {
        if (alive) setError(String(e?.message ?? e))
      })
    return () => {
      alive = false
    }
  }, [])

  const spares = useMemo<Child[]>(() => {
    if (!pool) return []
    return pool.map((p) => ({
      id: `pool-${p.pool_position}`,
      qr_code: p.qr_code,
      first_name: 'WALK-UP',
      last_name: String(p.pool_position).padStart(2, '0'),
      grade: null,
      allergies: null,
    }))
  }, [pool])

  const allChildren = useMemo<Child[] | null>(() => {
    if (children === null || pool === null) return null
    return [...children, ...spares]
  }, [children, pool, spares])

  useEffect(() => {
    if (!allChildren) return
    let cancelled = false
    ;(async () => {
      const next: Record<string, string> = {}
      for (const c of allChildren) {
        if (!c.qr_code) continue
        try {
          next[c.qr_code] = await QRCode.toDataURL(c.qr_code, {
            errorCorrectionLevel: 'M',
            margin: 1,
            width: 300,
            color: { dark: '#000000', light: '#ffffff' },
          })
        } catch {}
      }
      if (!cancelled) setQrUrls(next)
    })()
    return () => {
      cancelled = true
    }
  }, [allChildren])

  const visible = useMemo(() => {
    if (!allChildren) return []
    const q = search.trim().toLowerCase()
    if (!q) return allChildren
    return allChildren.filter((c) =>
      `${c.first_name} ${c.last_name}`.toLowerCase().includes(q),
    )
  }, [allChildren, search])

  // Chunk into strips → labels → sheets.
  // sheets[sheetIdx][labelIdx][stripIdx] = Child | null
  const sheets = useMemo<(Child | null)[][][]>(() => {
    const out: (Child | null)[][][] = []
    for (let i = 0; i < visible.length; i += STRIPS_PER_SHEET) {
      const sheetSlice = visible.slice(i, i + STRIPS_PER_SHEET)
      const labels: (Child | null)[][] = []
      for (let j = 0; j < LABELS_PER_SHEET; j++) {
        const start = j * STRIPS_PER_LABEL
        const labelStrips: (Child | null)[] = sheetSlice.slice(start, start + STRIPS_PER_LABEL)
        while (labelStrips.length < STRIPS_PER_LABEL) labelStrips.push(null)
        labels.push(labelStrips)
      }
      out.push(labels)
    }
    return out
  }, [visible])

  const onPrint = () => {
    if (typeof window !== 'undefined') window.print()
  }

  return (
    <div className="al-root">
      <style jsx global>{`
        .al-root { color: var(--paper, #f6f2ea); }
        .al-toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
          margin-bottom: 18px;
        }
        .al-toolbar h1 {
          font-family: var(--font-display, inherit);
          font-size: 22px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-right: auto;
        }
        .al-input {
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: inherit;
          padding: 8px 10px;
          border-radius: 8px;
          font: inherit;
        }
        .al-printbtn {
          background: var(--neon-cyan, #22d3ee);
          color: #001018;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 10px 16px;
          border: 0;
          border-radius: 8px;
          cursor: pointer;
        }
        .al-meta {
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          opacity: 0.7;
          margin-bottom: 14px;
        }
        .al-printguide {
          margin: 0 0 18px;
          padding: 12px 14px;
          border: 1px solid rgba(34, 211, 238, 0.35);
          background: rgba(34, 211, 238, 0.06);
          border-radius: 10px;
          font-size: 12px;
          line-height: 1.5;
          color: var(--paper, #f6f2ea);
        }
        .al-printguide strong { color: var(--neon-cyan, #22d3ee); }

        /* Avery 5168 sheet — US Letter, 4 labels (2×2), exact margins per spec */
        .al-page {
          box-sizing: border-box;
          width: 8.5in;
          height: 11in;
          background: #fff;
          color: #000;
          padding: 0.5in 0.75in;
          display: grid;
          grid-template-columns: 3.5in 3.5in;
          grid-template-rows: 5in 5in;
          column-gap: 0;
          row-gap: 0;
          margin: 0 auto 24px;
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.45);
          page-break-after: always;
          break-after: page;
          overflow: hidden;
        }
        .al-page:last-child {
          page-break-after: auto;
          break-after: auto;
          margin-bottom: 0;
        }

        .al-label {
          box-sizing: border-box;
          width: 3.5in;
          height: 5in;
          display: grid;
          grid-template-rows: repeat(${STRIPS_PER_LABEL}, 1fr);
          padding: 0.1in 0.08in;
          overflow: hidden;
          /* faint cell border on screen only — Avery labels have no border */
          outline: 0.5px solid #eaeaea;
          outline-offset: -0.5px;
        }
        .al-strip {
          box-sizing: border-box;
          display: grid;
          grid-template-columns: 0.6in 1fr 0.6in;
          gap: 0.1in;
          align-items: center;
          padding: 0.04in 0.06in;
          border-bottom: 1px dashed #999;
          overflow: hidden;
        }
        .al-strip:last-child { border-bottom: none; }
        .al-strip--blank {
          background: repeating-linear-gradient(45deg, #fafafa 0 6px, #fff 6px 12px);
        }
        .al-qr {
          width: 0.6in;
          height: 0.6in;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fff;
        }
        .al-qr img {
          width: 100%;
          height: 100%;
          image-rendering: pixelated;
        }
        .al-info {
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 0.03in;
          overflow: hidden;
        }
        .al-name {
          font-weight: 800;
          font-size: 14px;
          line-height: 1.05;
          text-transform: uppercase;
          letter-spacing: 0.01em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: #000;
        }
        .al-meta-line {
          font-family: ui-monospace, monospace;
          font-size: 9px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #555;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .al-allergy {
          color: #c00;
          font-weight: 700;
          margin-left: 4px;
        }

        @media print {
          @page {
            size: 8.5in 11in;
            margin: 0;
          }
          html, body {
            background: #fff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          nav, canvas, [aria-hidden='true'].fixed,
          .al-toolbar, .al-meta, .al-printguide {
            display: none !important;
          }
          .al-root { color: #000; margin: 0 !important; padding: 0 !important; }
          .al-page {
            box-shadow: none;
            margin: 0 auto;
          }
          .al-label {
            outline: none;
          }
        }
      `}</style>

      <div className="al-toolbar">
        <h1>Wristband Labels (Avery 5168)</h1>
        <input
          className="al-input"
          type="search"
          placeholder="Search by name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="al-printbtn" onClick={onPrint} type="button">
          Print
        </button>
      </div>

      <div className="al-meta">
        {children === null && !error && 'Loading…'}
        {error && `Error: ${error}`}
        {children && pool && `${children.length} registered + ${spares.length} spare = ${visible.length} shown · ${STRIPS_PER_LABEL} strips/label · ${LABELS_PER_SHEET} labels/sheet · ${sheets.length} sheet${sheets.length === 1 ? '' : 's'}`}
      </div>

      <div className="al-printguide">
        <strong>Print setup (Avery 5168, US Letter):</strong> Paper size{' '}
        <strong>US Letter (8.5 × 11)</strong>, scale <strong>100%</strong>, margins{' '}
        <strong>None</strong>, orientation <strong>Portrait</strong>, "Print backgrounds"{' '}
        <strong>ON</strong>. Each label has {STRIPS_PER_LABEL} strips separated by dashed
        lines — peel one label at a time and cut along the dashed lines, then stick each
        strip on a wristband.
      </div>

      {sheets.map((sheet, sheetIdx) => (
        <div key={sheetIdx} className="al-page" role="list" aria-label={`Label sheet ${sheetIdx + 1}`}>
          {sheet.map((label, labelIdx) => (
            <div key={labelIdx} className="al-label" role="listitem">
              {label.map((c, stripIdx) => {
                if (!c) {
                  return (
                    <div
                      key={`blank-${sheetIdx}-${labelIdx}-${stripIdx}`}
                      className="al-strip al-strip--blank"
                      aria-hidden="true"
                    />
                  )
                }
                const dataUrl = qrUrls[c.qr_code]
                const fullName = `${c.first_name} ${c.last_name}`.trim()
                const qrImg = dataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={dataUrl} alt={`QR for ${fullName}`} />
                ) : (
                  <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9, color: '#666' }}>…</span>
                )
                const hasAllergy = !!(c.allergies && c.allergies.trim())
                return (
                  <div key={c.id} className="al-strip" role="listitem">
                    <div className="al-qr">{qrImg}</div>
                    <div className="al-info">
                      <span className="al-name">{fullName}</span>
                      <span className="al-meta-line">
                        Gr {c.grade?.trim() || '—'}
                        {hasAllergy && <span className="al-allergy">⚠ ALLERGY</span>}
                      </span>
                    </div>
                    <div className="al-qr" aria-hidden="true">{qrImg}</div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

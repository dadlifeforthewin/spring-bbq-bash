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

export default function WristbandsPage() {
  const [children, setChildren] = useState<Child[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [qrUrls, setQrUrls] = useState<Record<string, string>>({})
  const [search, setSearch] = useState('')
  const [gradeFilter, setGradeFilter] = useState<string>('all')

  useEffect(() => {
    let alive = true
    fetch('/api/admin/children?status=all', { credentials: 'include' })
      .then(async (r) => {
        if (!r.ok) throw new Error(`${r.status}`)
        const data = (await r.json()) as { children: Child[] }
        if (alive) setChildren(data.children ?? [])
      })
      .catch((e) => {
        if (alive) setError(String(e?.message ?? e))
      })
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!children) return
    let cancelled = false
    ;(async () => {
      const next: Record<string, string> = {}
      for (const c of children) {
        if (!c.qr_code) continue
        try {
          next[c.qr_code] = await QRCode.toDataURL(c.qr_code, {
            errorCorrectionLevel: 'M',
            margin: 1,
            width: 360,
            color: { dark: '#000000', light: '#ffffff' },
          })
        } catch {
          // skip this kid; cell will show a placeholder
        }
      }
      if (!cancelled) setQrUrls(next)
    })()
    return () => {
      cancelled = true
    }
  }, [children])

  const grades = useMemo(() => {
    if (!children) return []
    const s = new Set<string>()
    for (const c of children) {
      if (c.grade && c.grade.trim()) s.add(c.grade.trim())
    }
    return Array.from(s).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  }, [children])

  const visible = useMemo(() => {
    if (!children) return []
    const q = search.trim().toLowerCase()
    return children.filter((c) => {
      if (gradeFilter !== 'all' && (c.grade ?? '').trim() !== gradeFilter) return false
      if (!q) return true
      const haystack = `${c.first_name} ${c.last_name}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [children, search, gradeFilter])

  const onPrint = () => {
    if (typeof window !== 'undefined') window.print()
  }

  return (
    <div className="wb-root">
      <style jsx global>{`
        /* Screen: sit on top of the admin chrome normally. */
        .wb-root {
          color: var(--paper, #f6f2ea);
        }
        .wb-toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
          margin-bottom: 18px;
        }
        .wb-toolbar h1 {
          font-family: var(--font-display, inherit);
          font-size: 22px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-right: auto;
        }
        .wb-input,
        .wb-select {
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: inherit;
          padding: 8px 10px;
          border-radius: 8px;
          font: inherit;
        }
        .wb-printbtn {
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
        .wb-meta {
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          opacity: 0.7;
          margin-bottom: 14px;
        }
        .wb-empty {
          padding: 40px 20px;
          text-align: center;
          border: 1px dashed rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          opacity: 0.75;
        }

        /* Sheet — renders on-screen as a preview, matches print cells. */
        .wb-sheet {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          background: #fff;
          color: #000;
          padding: 16px;
          border-radius: 8px;
        }
        @media (max-width: 640px) {
          .wb-sheet {
            grid-template-columns: 1fr;
          }
        }
        .wb-cell {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 12px;
          align-items: center;
          padding: 14px;
          border: 1px dashed #d0d0d0;
          border-radius: 6px;
          min-height: 160px;
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .wb-qr {
          width: 130px;
          height: 130px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fff;
        }
        .wb-qr img {
          width: 100%;
          height: 100%;
          image-rendering: pixelated;
        }
        .wb-qr--missing {
          border: 1px solid #ccc;
          font-family: ui-monospace, monospace;
          font-size: 10px;
          color: #666;
        }
        .wb-info {
          min-width: 0;
        }
        .wb-name {
          font-weight: 800;
          font-size: 16px;
          line-height: 1.15;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          word-break: break-word;
        }
        .wb-grade {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #444;
          margin-top: 4px;
        }
        .wb-allergy {
          display: inline-block;
          margin-top: 6px;
          padding: 2px 6px;
          border: 1px solid #c00;
          color: #c00;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          border-radius: 4px;
        }
        .wb-code {
          margin-top: 10px;
          font-family: ui-monospace, monospace;
          font-size: 9px;
          color: #555;
          word-break: break-all;
          letter-spacing: 0.02em;
        }

        @media print {
          @page {
            size: letter;
            margin: 0.5in;
          }
          html,
          body {
            background: #fff !important;
          }
          /* Hide admin chrome: nav bar, aurora canvas wrapper, our toolbar. */
          nav,
          canvas,
          [aria-hidden='true'].fixed,
          .wb-toolbar,
          .wb-meta {
            display: none !important;
          }
          .wb-root {
            color: #000;
          }
          /* Force 2-column on print regardless of screen viewport. */
          .wb-sheet {
            background: #fff;
            padding: 0;
            border-radius: 0;
            gap: 0;
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .wb-cell {
            border: 1px dashed #aaa;
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .wb-qr img {
            image-rendering: pixelated;
          }
        }
      `}</style>

      <div className="wb-toolbar">
        <h1>Wristbands</h1>
        <input
          className="wb-input"
          type="search"
          placeholder="Search by name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="wb-select"
          value={gradeFilter}
          onChange={(e) => setGradeFilter(e.target.value)}
        >
          <option value="all">All grades</option>
          {grades.map((g) => (
            <option key={g} value={g}>
              Grade {g}
            </option>
          ))}
        </select>
        <button className="wb-printbtn" onClick={onPrint} type="button">
          Print
        </button>
      </div>

      <div className="wb-meta">
        {children === null && !error && 'Loading…'}
        {error && `Error: ${error}`}
        {children && `${visible.length} of ${children.length} registered kids · 8 per page`}
      </div>

      {children && visible.length === 0 && !error && (
        <div className="wb-empty">
          No registered kids match your filters. Adjust the search or grade filter, or
          wait for parents to submit the waiver.
        </div>
      )}

      {visible.length > 0 && (
        <div className="wb-sheet" role="list" aria-label="Wristband sheet">
          {visible.map((c) => {
            const dataUrl = qrUrls[c.qr_code]
            const fullName = `${c.first_name} ${c.last_name}`.trim()
            return (
              <div key={c.id} className="wb-cell" role="listitem">
                <div className="wb-qr">
                  {dataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={dataUrl} alt={`QR code for ${fullName}`} />
                  ) : (
                    <span className="wb-qr--missing">…</span>
                  )}
                </div>
                <div className="wb-info">
                  <div className="wb-name">{fullName}</div>
                  <div className="wb-grade">Grade {c.grade?.trim() || '—'}</div>
                  {c.allergies && c.allergies.trim() && (
                    <div className="wb-allergy">⚠ Allergies</div>
                  )}
                  <div className="wb-code">{c.qr_code}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

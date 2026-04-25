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

// Mr-Label MR201: 10 wristbands per 9.84"×7.48" sheet, single column.
const BANDS_PER_SHEET = 10

export default function WristbandsPage() {
  const [children, setChildren] = useState<Child[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [qrUrls, setQrUrls] = useState<Record<string, string>>({})
  const [search, setSearch] = useState('')
  const [gradeFilter, setGradeFilter] = useState<string>('all')
  const [spareCount, setSpareCount] = useState<number>(0)

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

  // Spare walk-up wristbands: synthetic Child rows with freshly-generated UUIDs.
  // These QRs are not in the DB until a walk-up family scans the wristband and
  // submits /register/walkup/<qr> (the API does an INSERT, so no collision).
  // UUIDs regenerate every time the count changes, which is fine — the printed
  // sheet is the source of truth, not memory across reloads.
  const spares = useMemo<Child[]>(() => {
    const n = Math.max(0, Math.min(200, Math.floor(spareCount || 0)))
    return Array.from({ length: n }, (_, i) => ({
      id: `spare-${i}`,
      qr_code: crypto.randomUUID(),
      first_name: 'WALK-UP',
      last_name: String(i + 1).padStart(2, '0'),
      grade: null,
      allergies: null,
    }))
  }, [spareCount])

  // Combined list used for QR generation, paging, and printing.
  const allChildren = useMemo<Child[] | null>(() => {
    if (children === null) return null
    return [...children, ...spares]
  }, [children, spares])

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
  }, [allChildren])

  const grades = useMemo(() => {
    if (!children) return []
    const s = new Set<string>()
    for (const c of children) {
      if (c.grade && c.grade.trim()) s.add(c.grade.trim())
    }
    return Array.from(s).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  }, [children])

  const visible = useMemo(() => {
    if (!allChildren) return []
    const q = search.trim().toLowerCase()
    return allChildren.filter((c) => {
      if (gradeFilter !== 'all' && (c.grade ?? '').trim() !== gradeFilter) return false
      if (!q) return true
      const haystack = `${c.first_name} ${c.last_name}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [allChildren, search, gradeFilter])

  // Chunk into 10-band physical sheets. Last sheet is padded with `null` so the
  // grid always renders 10 rows — keeps unused band slots blank rather than
  // collapsing the page height (which would mis-align the perforations).
  const pages = useMemo<(Child | null)[][]>(() => {
    const out: (Child | null)[][] = []
    for (let i = 0; i < visible.length; i += BANDS_PER_SHEET) {
      const slice = visible.slice(i, i + BANDS_PER_SHEET)
      const padded: (Child | null)[] = [...slice]
      while (padded.length < BANDS_PER_SHEET) padded.push(null)
      out.push(padded)
    }
    return out
  }, [visible])

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
        .wb-spare-label {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          opacity: 0.85;
        }
        .wb-spare-input {
          width: 70px;
          text-align: center;
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
        .wb-printguide {
          margin: 0 0 18px;
          padding: 12px 14px;
          border: 1px solid rgba(34, 211, 238, 0.35);
          background: rgba(34, 211, 238, 0.06);
          border-radius: 10px;
          font-size: 12px;
          line-height: 1.5;
          color: var(--paper, #f6f2ea);
        }
        .wb-printguide strong { color: var(--neon-cyan, #22d3ee); }
        .wb-empty {
          padding: 40px 20px;
          text-align: center;
          border: 1px dashed rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          opacity: 0.75;
        }

        /* Sheet — laid out at TRUE PHYSICAL SIZE for the Mr-Label MR201 product:
         *   sheet:   9.84in × 7.48in (250 × 190 mm)
         *   bands:   10in × 0.748in (250 × 19 mm), 10 per sheet, single column
         *   margins: 0 (spec); inkjet head clip handled inside the cell
         * Each .wb-page is one printable sheet. CSS grid stacks bands. */
        .wb-page {
          width: 9.84in;
          height: 7.48in;
          background: #fff;
          color: #000;
          display: grid;
          grid-template-rows: repeat(10, 0.748in);
          grid-template-columns: 1fr;
          margin: 0 auto 24px;
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.45);
          page-break-after: always;
          break-after: page;
        }
        .wb-page:last-child {
          page-break-after: auto;
          break-after: auto;
          margin-bottom: 0;
        }
        .wb-cell {
          display: grid;
          grid-template-columns: 0.7in 1fr auto;
          gap: 0.12in;
          align-items: center;
          padding: 0.05in 0.16in;
          border-bottom: 1px dashed #c8c8c8;
          break-inside: avoid;
          page-break-inside: avoid;
          overflow: hidden;
        }
        .wb-cell:last-child { border-bottom: none; }
        .wb-cell--blank { background: repeating-linear-gradient(45deg, #fafafa 0 6px, #fff 6px 12px); }
        .wb-qr {
          width: 0.65in;
          height: 0.65in;
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
          display: flex;
          align-items: baseline;
          gap: 0.18in;
          flex-wrap: nowrap;
          overflow: hidden;
        }
        .wb-name {
          font-weight: 800;
          font-size: 18px;
          line-height: 1;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 4.5in;
        }
        .wb-grade {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #444;
          white-space: nowrap;
        }
        .wb-allergy {
          display: inline-block;
          padding: 1px 5px;
          border: 1px solid #c00;
          color: #c00;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          border-radius: 3px;
          white-space: nowrap;
        }
        .wb-code {
          font-family: ui-monospace, monospace;
          font-size: 8px;
          color: #555;
          letter-spacing: 0.02em;
          text-align: right;
          line-height: 1;
          max-width: 1.4in;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        @media print {
          @page {
            /* Mr-Label MR201: 9.84in × 7.48in, no margin per spec */
            size: 9.84in 7.48in;
            margin: 0;
          }
          html,
          body {
            background: #fff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          /* Hide admin chrome + screen-only helpers */
          nav,
          canvas,
          [aria-hidden='true'].fixed,
          .wb-toolbar,
          .wb-meta,
          .wb-printguide {
            display: none !important;
          }
          .wb-root {
            color: #000;
            margin: 0 !important;
            padding: 0 !important;
          }
          .wb-page {
            box-shadow: none;
            margin: 0 auto;
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
        <label className="wb-spare-label">
          Spare walk-ups
          <input
            className="wb-input wb-spare-input"
            type="number"
            min={0}
            max={200}
            step={1}
            value={spareCount}
            onChange={(e) => setSpareCount(Number(e.target.value) || 0)}
          />
        </label>
        <button className="wb-printbtn" onClick={onPrint} type="button">
          Print
        </button>
      </div>

      <div className="wb-meta">
        {children === null && !error && 'Loading…'}
        {error && `Error: ${error}`}
        {children && `${children.length} registered + ${spares.length} spare = ${visible.length} shown · ${BANDS_PER_SHEET} per sheet · ${pages.length} sheet${pages.length === 1 ? '' : 's'}`}
      </div>

      <div className="wb-printguide">
        <strong>Print setup (Mr-Label MR201 ¾" Tyvek, 10 per sheet):</strong> In the
        print dialog, set <em>paper size</em> to <strong>9.84 × 7.48 in</strong>{' '}
        (custom; ≈ 250 × 190 mm), <em>scale</em> to <strong>100% / Actual size</strong>{' '}
        (do NOT "fit to page"), <em>margins</em> to <strong>None</strong>. Each sheet
        below is laid out at true physical size — what you see is what prints.
      </div>

      {children && visible.length === 0 && !error && (
        <div className="wb-empty">
          No registered kids match your filters. Adjust the search or grade filter, or
          wait for parents to submit the waiver.
        </div>
      )}

      {pages.map((pageBands, pageIdx) => (
        <div key={pageIdx} className="wb-page" role="list" aria-label={`Wristband sheet ${pageIdx + 1}`}>
          {pageBands.map((c, rowIdx) => {
            if (!c) {
              return <div key={`blank-${pageIdx}-${rowIdx}`} className="wb-cell wb-cell--blank" aria-hidden="true" />
            }
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
                  <span className="wb-name">{fullName}</span>
                  <span className="wb-grade">Gr {c.grade?.trim() || '—'}</span>
                  {c.allergies && c.allergies.trim() && (
                    <span className="wb-allergy">⚠ ALLERGY</span>
                  )}
                </div>
                <div className="wb-code">{c.qr_code}</div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

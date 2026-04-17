import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

type Parent = { name: string; phone: string; email: string }

export type ReceiptInput = {
  event_name: string
  event_date: string
  primary_parent: Parent
  secondary_parent: Parent | null
  children: {
    first_name: string
    last_name: string
    age: number | null
    grade: string | null
    allergies: string | null
    special_instructions: string | null
    qr_code: string
    pickup_authorizations: { name: string; relationship: string | null }[]
    facts_reload_permission: boolean
    facts_max_amount: number
  }[]
  waiver: { text: string; typed_name: string; signed_at: string }
  photo_consent: {
    photo_consent_app: boolean
    photo_consent_promo: boolean
    vision_matching_consent: boolean
    typed_name: string
    signed_at: string
  }
}

const PAGE_WIDTH = 612
const PAGE_HEIGHT = 792
const MARGIN = 54

export async function buildReceiptPdf(input: ReceiptInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  const helv = await pdf.embedFont(StandardFonts.Helvetica)
  const helvBold = await pdf.embedFont(StandardFonts.HelveticaBold)

  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  let y = PAGE_HEIGHT - MARGIN

  const newPageIfNeeded = (needed: number) => {
    if (y - needed < MARGIN) {
      page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT])
      y = PAGE_HEIGHT - MARGIN
    }
  }

  const drawLine = (text: string, opts: { bold?: boolean; size?: number; gap?: number } = {}) => {
    const size = opts.size ?? 11
    const font = opts.bold ? helvBold : helv
    const lineHeight = size * 1.35
    newPageIfNeeded(lineHeight)
    page.drawText(text, { x: MARGIN, y: y - size, size, font, color: rgb(0.1, 0.1, 0.1) })
    y -= lineHeight + (opts.gap ?? 0)
  }

  const drawWrapped = (text: string, opts: { size?: number; maxWidth?: number } = {}) => {
    const size = opts.size ?? 10
    const maxWidth = opts.maxWidth ?? PAGE_WIDTH - MARGIN * 2
    const words = text.split(/\s+/)
    let line = ''
    for (const w of words) {
      const candidate = line ? `${line} ${w}` : w
      if (helv.widthOfTextAtSize(candidate, size) > maxWidth && line) {
        drawLine(line, { size })
        line = w
      } else {
        line = candidate
      }
    }
    if (line) drawLine(line, { size })
  }

  // Header
  drawLine(input.event_name, { bold: true, size: 20, gap: 2 })
  drawLine(`Permission Slip & Registration Receipt · ${input.event_date}`, { size: 10, gap: 16 })

  // Parents
  drawLine('Parent / Guardian Information', { bold: true, size: 13, gap: 4 })
  drawLine(`Primary: ${input.primary_parent.name} · ${input.primary_parent.phone} · ${input.primary_parent.email}`, { size: 11 })
  if (input.secondary_parent) {
    drawLine(`Secondary: ${input.secondary_parent.name} · ${input.secondary_parent.phone} · ${input.secondary_parent.email}`, { size: 11 })
  }
  y -= 12

  // Children
  drawLine('Children', { bold: true, size: 13, gap: 4 })
  for (const c of input.children) {
    drawLine(`${c.first_name} ${c.last_name}`, { bold: true, size: 12 })
    const meta: string[] = []
    if (c.age != null) meta.push(`Age ${c.age}`)
    if (c.grade) meta.push(`Grade ${c.grade}`)
    meta.push(`QR ${c.qr_code}`)
    drawLine(meta.join(' · '), { size: 10 })
    if (c.allergies) drawLine(`Allergies: ${c.allergies}`, { size: 10 })
    if (c.special_instructions) drawLine(`Notes: ${c.special_instructions}`, { size: 10 })
    drawLine(
      `FACTS reload: ${c.facts_reload_permission ? `yes (up to $${c.facts_max_amount})` : 'no'}`,
      { size: 10 },
    )
    if (c.pickup_authorizations.length > 0) {
      drawLine('Approved pickup (besides parents):', { size: 10 })
      for (const p of c.pickup_authorizations) {
        drawLine(`  • ${p.name}${p.relationship ? ` (${p.relationship})` : ''}`, { size: 10 })
      }
    }
    y -= 8
  }

  // Waiver
  drawLine('Permission & Liability Waiver', { bold: true, size: 13, gap: 4 })
  drawWrapped(input.waiver.text, { size: 9 })
  y -= 6
  drawLine(`Signed by: ${input.waiver.typed_name}`, { bold: true, size: 11 })
  drawLine(`Signed at: ${input.waiver.signed_at}`, { size: 10 })
  y -= 12

  // Photo consents
  drawLine('Photo Permissions', { bold: true, size: 13, gap: 4 })
  drawLine(`App keepsake photos: ${input.photo_consent.photo_consent_app ? 'YES' : 'NO'}`, { size: 11 })
  drawLine(`Promotional / social media use: ${input.photo_consent.photo_consent_promo ? 'YES' : 'NO'}`, { size: 11 })
  drawLine(`Vision matching (auto-identify): ${input.photo_consent.vision_matching_consent ? 'YES' : 'NO'}`, { size: 11 })
  y -= 6
  drawLine(`Signed by: ${input.photo_consent.typed_name}`, { bold: true, size: 11 })
  drawLine(`Signed at: ${input.photo_consent.signed_at}`, { size: 10 })

  return pdf.save()
}

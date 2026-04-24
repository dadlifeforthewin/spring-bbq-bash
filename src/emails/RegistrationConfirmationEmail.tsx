import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Font,
} from '@react-email/components'
const ATTN_TO_DETAIL_CONFIRM_FOOTER =
  "This site was designed and built by Brian Leach of Attn: To Detail — a small consulting studio that helps founder-led businesses move faster with websites, AI tools, and honest strategy. Proud to donate it to LCA for the night."

export type RegistrationEmailChild = {
  first_name: string
  last_name: string
  age: number | null
  grade: string | null
}

export type RegistrationConfirmationEmailProps = {
  event_name: string
  event_date: string
  event_time: string
  event_location: string
  event_logo_url?: string | null
  primary_parent_name: string
  children: RegistrationEmailChild[]
  edit_url: string
  attn_to_detail_url?: string
}

const INK     = '#0B0A1F'
const INK_2   = '#14133A'
const INK_3   = '#1F1C4E'
const HAIR    = '#2A2760'
const PAPER   = '#F5F2FF'
const MIST    = '#B6B3D9'
const FAINT   = '#7D7AB3'
const MAGENTA = '#FF2E93'
const CYAN    = '#00E6F7'
const UV      = '#9B5CFF'
const GOLD    = '#FFE147'

const displayFont = 'Unbounded, "Helvetica Neue", Helvetica, Arial, sans-serif'
const bodyFont    = 'Inter, "Helvetica Neue", Helvetica, Arial, sans-serif'

const styles = {
  body: { margin: 0, padding: 0, backgroundColor: INK, fontFamily: bodyFont } as const,
  wrapper: { backgroundColor: INK, padding: '28px 12px' } as const,
  container: {
    maxWidth: '620px',
    margin: '0 auto',
    backgroundColor: INK_2,
    borderRadius: '16px',
    overflow: 'hidden',
    border: `1px solid ${HAIR}`,
    boxShadow: `0 20px 80px -20px rgba(155,92,255,0.35)`,
  } as const,
  hero: {
    padding: '44px 32px 28px',
    textAlign: 'center' as const,
    background: `radial-gradient(80% 120% at 50% 0%, ${MAGENTA}2A 0%, ${UV}22 40%, ${INK_2} 75%), ${INK_2}`,
  } as const,
  sparks: {
    color: GOLD,
    fontSize: '14px',
    letterSpacing: '0.6em',
    margin: '0 0 10px',
    textShadow: `0 0 12px ${GOLD}AA`,
  } as const,
  heroEyebrow: {
    display: 'inline-block',
    color: MIST,
    fontFamily: bodyFont,
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.3em',
    textTransform: 'uppercase' as const,
    margin: '0 0 14px',
  } as const,
  heroYoureIn: {
    fontFamily: displayFont,
    fontWeight: 800,
    fontSize: '56px',
    lineHeight: '0.95',
    letterSpacing: '-0.025em',
    color: PAPER,
    margin: '0 0 18px',
    textShadow: `0 0 6px ${PAPER}CC, 0 0 18px ${CYAN}, 0 0 40px ${MAGENTA}B3, 0 0 72px ${MAGENTA}66`,
  } as const,
  wordmark: {
    fontFamily: displayFont,
    fontWeight: 700,
    fontSize: '22px',
    lineHeight: '1.1',
    letterSpacing: '0.01em',
    color: PAPER,
    margin: '0 0 4px',
  } as const,
  wordmarkSub: {
    fontFamily: displayFont,
    fontWeight: 700,
    fontSize: '14px',
    letterSpacing: '0.24em',
    color: GOLD,
    textShadow: `0 0 14px ${GOLD}80`,
    textTransform: 'uppercase' as const,
    margin: '0 0 14px',
  } as const,
  dateline: {
    color: MIST,
    fontSize: '13px',
    margin: 0,
  } as const,
  greeting: {
    color: PAPER,
    fontSize: '16px',
    lineHeight: '24px',
    padding: '24px 32px 4px',
    margin: 0,
  } as const,
  lead: {
    color: MIST,
    fontSize: '15px',
    lineHeight: '24px',
    padding: '4px 32px 8px',
    margin: 0,
  } as const,
  callout: {
    color: CYAN,
    fontSize: '13px',
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    padding: '16px 32px 0',
    margin: 0,
  } as const,
  childBlock: {
    padding: '16px 32px 8px',
  } as const,
  childHeaderBar: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '999px',
    border: `1px solid ${MAGENTA}66`,
    backgroundColor: `${MAGENTA}14`,
    color: MAGENTA,
    fontFamily: bodyFont,
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.22em',
    textTransform: 'uppercase' as const,
    marginBottom: '10px',
  } as const,
  childName: {
    fontFamily: displayFont,
    fontWeight: 800,
    fontSize: '24px',
    lineHeight: '1.1',
    letterSpacing: '-0.015em',
    color: PAPER,
    margin: '0 0 2px',
  } as const,
  childMeta: {
    color: MIST,
    fontSize: '13px',
    margin: '0 0 14px',
  } as const,
  perkChips: {
    color: MIST,
    fontSize: '13px',
    lineHeight: '22px',
    margin: '12px 0 0',
  } as const,
  detailsPill: {
    display: 'inline-block',
    marginTop: '4px',
    padding: '10px 14px',
    borderRadius: '999px',
    border: `1px solid ${CYAN}55`,
    backgroundColor: `${CYAN}12`,
    color: CYAN,
    fontFamily: bodyFont,
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.02em',
  } as const,
  editSection: {
    padding: '8px 32px 24px',
    textAlign: 'center' as const,
  } as const,
  editButton: {
    display: 'inline-block',
    padding: '14px 28px',
    borderRadius: '999px',
    backgroundColor: INK_3,
    border: `2px solid ${MAGENTA}`,
    color: PAPER,
    fontFamily: displayFont,
    fontWeight: 700,
    fontSize: '13px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    textDecoration: 'none',
    boxShadow: `0 0 20px ${MAGENTA}44`,
  } as const,
  whatsNext: {
    padding: '0 32px 24px',
  } as const,
  whatsNextHeading: {
    color: PAPER,
    fontFamily: displayFont,
    fontSize: '14px',
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    margin: '0 0 8px',
  } as const,
  whatsNextLine: {
    color: MIST,
    fontSize: '14px',
    lineHeight: '22px',
    margin: '0 0 6px',
  } as const,
  footer: {
    padding: '20px 32px 28px',
    backgroundColor: INK,
    borderTop: `1px solid ${HAIR}`,
  } as const,
  footerText: {
    color: MIST,
    fontSize: '12px',
    lineHeight: '18px',
    margin: '0 0 10px',
  } as const,
  footerStrong: { color: PAPER } as const,
  footerLink: { color: CYAN, textDecoration: 'none' } as const,
  finePrint: {
    color: FAINT,
    fontSize: '11px',
    lineHeight: '16px',
    margin: 0,
  } as const,
}

function formatEventDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return value
  const [, y, m, d] = match
  const date = new Date(Number(y), Number(m) - 1, Number(d))
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function RegistrationConfirmationEmail({
  event_name,
  event_date,
  event_time,
  event_location,
  event_logo_url,
  primary_parent_name,
  children,
  edit_url,
  attn_to_detail_url = 'https://attntodetail.ai',
}: RegistrationConfirmationEmailProps) {
  const isMulti = children.length > 1
  const preview = isMulti
    ? `You're on the list — Saturday night is about to glow.`
    : `${children[0].first_name}'s on the list — Saturday night is about to glow.`

  return (
    <Html>
      <Head>
        <Font
          fontFamily="Unbounded"
          fallbackFontFamily={['Helvetica', 'Arial']}
          webFont={{
            url: 'https://fonts.gstatic.com/s/unbounded/v6/Yq6F-LOTXCb04q32xlpat0hYbvhmJbvP.woff2',
            format: 'woff2',
          }}
          fontWeight={800}
          fontStyle="normal"
        />
        <Font
          fontFamily="Inter"
          fallbackFontFamily={['Helvetica', 'Arial']}
          webFont={{
            url: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2',
            format: 'woff2',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <div style={styles.wrapper}>
          <Container style={styles.container}>
            <Section style={styles.hero}>
              {event_logo_url && (
                <Img
                  src={event_logo_url}
                  alt={event_name}
                  height={48}
                  style={{ margin: '0 auto 18px' }}
                />
              )}
              <Text style={styles.sparks}>✦ ✦ ✦</Text>
              <Heading as="h1" style={styles.heroYoureIn}>
                YOU&apos;RE IN
              </Heading>
              <Heading as="h2" style={styles.wordmark}>
                {event_name}
              </Heading>
              <Text style={styles.wordmarkSub}>Glow Party Edition</Text>
              <Text style={styles.dateline}>
                {formatEventDate(event_date)} · {event_time}
              </Text>
            </Section>

            <Text style={styles.greeting}>Hey {primary_parent_name} —</Text>
            <Text style={styles.lead}>
              {isMulti
                ? `Saturday night is about to glow, and your crew is on the list. Neon wristbands will be waiting at the check-in table — just give the kids' names on the way in. This email's your receipt; tap the button below if anything needs to change.`
                : `Saturday night is about to glow, and ${children[0].first_name}'s on the list. A neon wristband will be waiting at the check-in table — just give their name on the way in. This email's your receipt; tap the button below if anything needs to change.`}
            </Text>

            <Text style={styles.callout}>✦ The Lineup ✦</Text>

            {children.map((child, i) => (
              <Section key={`${child.first_name}-${child.last_name}-${i}`} style={styles.childBlock}>
                <Heading as="h3" style={styles.childName}>
                  {child.first_name} {child.last_name}
                </Heading>
                <Text style={styles.childMeta}>
                  {[child.age != null ? `Age ${child.age}` : null, child.grade || null]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>

                <Text style={styles.perkChips}>
                  🥤 2 drinks · 🚨 3 jail / pass · 🎡 1 spin · 📻 1 DJ shoutout
                </Text>
              </Section>
            ))}

            <div style={{ textAlign: 'center', padding: '8px 32px 0' }}>
              <span style={styles.detailsPill}>
                {formatEventDate(event_date)} · {event_time} · {event_location}
              </span>
            </div>

            <Section style={styles.editSection}>
              <Link href={edit_url} style={styles.editButton}>
                Edit your registration
              </Link>
            </Section>

            <div style={styles.whatsNext}>
              <Text style={styles.whatsNextHeading}>The run of show</Text>
              <Text style={styles.whatsNextLine}>
                <strong style={{ color: PAPER }}>4:45pm Saturday:</strong> check-in opens in the
                courtyard by the water fountain. Roll up anytime between 4:45 and 5:30 — grab
                the wristbands, scan in, and let them run into the glow.
              </Text>
              <Text style={styles.whatsNextLine}>
                <strong style={{ color: PAPER }}>One more thing:</strong> a little something is landing in
                your inbox the morning after the party. Watch for it — we think you&apos;ll like it.
              </Text>
            </div>

            <div style={styles.footer}>
              <Text style={styles.footerText}>
                <span style={styles.footerStrong}>{ATTN_TO_DETAIL_CONFIRM_FOOTER}</span>
              </Text>
              <Text style={styles.footerText}>
                <Link href="mailto:brian@attntodetail.ai" style={styles.footerLink}>
                  brian@attntodetail.ai
                </Link>
                {' · '}
                <Link href={attn_to_detail_url} style={styles.footerLink}>
                  attntodetail.ai
                </Link>
              </Text>
              <Text style={styles.finePrint}>
                Need to change anything? Hit the button above or reply to this email.
              </Text>
            </div>
          </Container>
        </div>
      </Body>
    </Html>
  )
}

export function subjectForRegistration(children: RegistrationEmailChild[]): string {
  if (children.length === 1) {
    return `🎉 You're on the list — ${children[0].first_name} is set for Spring BBQ Bash`
  }
  return `🎉 You're on the list — all ${children.length} kids set for Spring BBQ Bash`
}

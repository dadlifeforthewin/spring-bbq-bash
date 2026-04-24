import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
  Font,
} from '@react-email/components'

const ATTN_TO_DETAIL_CONFIRM_FOOTER =
  "This site was designed and built by Brian Leach of Attn: To Detail — a small consulting studio that helps founder-led businesses move faster with websites, AI tools, and honest strategy. Proud to donate it to LCA for the night."

// Absolute URL for hosted email assets. Images rendered by react-email must be
// reachable from the recipient's inbox, so we point at production regardless
// of where the template is being rendered (prod send or admin preview).
const EMAIL_ASSET_BASE = 'https://spring-bbq-bash.vercel.app/email'
const GLYPHS = {
  drinks:    { src: `${EMAIL_ASSET_BASE}/drinks.png`,      color: '#00E6F7' },
  jail:      { src: `${EMAIL_ASSET_BASE}/jail.png`,        color: '#FF2E93' },
  prizeWheel:{ src: `${EMAIL_ASSET_BASE}/prize-wheel.png`, color: '#FFE147' },
  dj:        { src: `${EMAIL_ASSET_BASE}/dj.png`,          color: '#9B5CFF' },
} as const

function formatGradeMeta(age: number | null, grade: string | null): string {
  const ageLabel = age != null ? `Age ${age}` : null
  // Raw numeric grade inputs ("2") look broken next to "Age 7"; prefix "Grade".
  // Leave non-numeric entries ("K", "2nd", "Grade 5") alone.
  const gradeLabel = grade
    ? /^\d+$/.test(grade) ? `Grade ${grade}` : grade
    : null
  return [ageLabel, gradeLabel].filter(Boolean).join(' · ')
}

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
  childBlockOuter: {
    padding: '10px 32px 12px',
  } as const,
  childCard: {
    border: `1px solid ${HAIR}`,
    borderRadius: '14px',
    backgroundColor: INK_3,
    backgroundImage: `linear-gradient(180deg, ${INK_3} 0%, ${INK_2} 100%)`,
    padding: '24px 22px 20px',
    textAlign: 'center' as const,
  } as const,
  childName: {
    fontFamily: displayFont,
    fontWeight: 800,
    fontSize: '26px',
    lineHeight: '1.1',
    letterSpacing: '-0.015em',
    color: PAPER,
    margin: '0',
    textShadow: `0 0 4px ${PAPER}CC, 0 0 14px ${CYAN}, 0 0 28px ${MAGENTA}66`,
  } as const,
  childMeta: {
    color: MIST,
    fontFamily: bodyFont,
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    margin: '10px 0 20px',
  } as const,
  perkDivider: {
    height: '1px',
    border: 'none',
    background: `linear-gradient(90deg, transparent 0%, ${HAIR} 20%, ${HAIR} 80%, transparent 100%)`,
    margin: '0 0 18px',
  } as const,
  perkCell: {
    width: '25%',
    textAlign: 'center' as const,
    padding: '0 4px',
    verticalAlign: 'top' as const,
  } as const,
  perkIconImg: {
    display: 'block',
    margin: '0 auto 8px',
  } as const,
  perkNumber: {
    fontFamily: displayFont,
    fontWeight: 800,
    fontSize: '26px',
    lineHeight: '1',
    margin: '0 0 4px',
  } as const,
  perkLabel: {
    fontFamily: bodyFont,
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.2em',
    textTransform: 'uppercase' as const,
    color: MIST,
    margin: 0,
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
  // Parent form captures full name; first name only makes the greeting warmer.
  // Falls back to the full name if parsing produces nothing usable.
  const parentFirstName =
    primary_parent_name.trim().split(/\s+/)[0] || primary_parent_name
  const preview = isMulti
    ? `Saturday night is about to glow — your crew is officially on the list.`
    : `Saturday night is about to glow — ${children[0].first_name} is officially on the list.`

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
        {/*
          Neon-flicker animation on the kid's name — plays in clients that
          respect @keyframes (Apple Mail, the admin HTML preview). Gmail /
          Outlook strip keyframes and fall back to the static text-shadow
          declared inline on styles.childName. Reduced-motion users never
          see the animation.
        */}
        <style dangerouslySetInnerHTML={{ __html: `
@keyframes neonFlicker {
  0%, 19%, 21%, 23%, 80%, 83%, 100% {
    opacity: 1;
    text-shadow: 0 0 4px rgba(245, 242, 255, 0.8), 0 0 14px #00E6F7, 0 0 28px rgba(255, 46, 147, 0.4);
  }
  20%, 22%, 82% {
    opacity: 0.45;
    text-shadow: 0 0 2px rgba(245, 242, 255, 0.2);
  }
}
@media (prefers-reduced-motion: no-preference) {
  .neonFlicker {
    animation: neonFlicker 6s infinite;
  }
}
        `}} />
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

            <Text style={styles.greeting}>Hey {parentFirstName} —</Text>
            <Text style={styles.lead}>
              {isMulti
                ? `Saturday night is gonna be loud. Your crew is officially on the list — custom wristbands already printed with their names, lights about to drop, music cued up, and a whole lot of glow headed their way. Just give the kids' names when you roll up and let the night do its thing. This email's your receipt; hit the button below if anything needs to change.`
                : `Saturday night is gonna be loud. ${children[0].first_name}'s officially on the list — a custom wristband printed with their name is waiting at check-in, lights about to drop, music cued up, and a whole lot of glow headed their way. Just give their name when you roll up and let the night do its thing. This email's your receipt; hit the button below if anything needs to change.`}
            </Text>

            <Text style={styles.callout}>✦ The Lineup ✦</Text>

            {children.map((child, i) => (
              <Section key={`${child.first_name}-${child.last_name}-${i}`} style={styles.childBlockOuter}>
                <div style={styles.childCard}>
                  <Heading as="h3" className="neonFlicker" style={styles.childName}>
                    {child.first_name} {child.last_name}
                  </Heading>
                  <Text style={styles.childMeta}>
                    {formatGradeMeta(child.age, child.grade)}
                  </Text>

                  <Hr style={styles.perkDivider} />

                  <Row>
                    <Column style={styles.perkCell}>
                      <Img src={GLYPHS.drinks.src} alt="" width={40} height={40} style={styles.perkIconImg} />
                      <Text style={{ ...styles.perkNumber, color: GLYPHS.drinks.color }}>2</Text>
                      <Text style={styles.perkLabel}>Drinks</Text>
                    </Column>
                    <Column style={styles.perkCell}>
                      <Img src={GLYPHS.jail.src} alt="" width={40} height={40} style={styles.perkIconImg} />
                      <Text style={{ ...styles.perkNumber, color: GLYPHS.jail.color }}>3</Text>
                      <Text style={styles.perkLabel}>Jail / Pass</Text>
                    </Column>
                    <Column style={styles.perkCell}>
                      <Img src={GLYPHS.prizeWheel.src} alt="" width={40} height={40} style={styles.perkIconImg} />
                      <Text style={{ ...styles.perkNumber, color: GLYPHS.prizeWheel.color }}>1</Text>
                      <Text style={styles.perkLabel}>Spin</Text>
                    </Column>
                    <Column style={styles.perkCell}>
                      <Img src={GLYPHS.dj.src} alt="" width={40} height={40} style={styles.perkIconImg} />
                      <Text style={{ ...styles.perkNumber, color: GLYPHS.dj.color }}>1</Text>
                      <Text style={styles.perkLabel}>DJ</Text>
                    </Column>
                  </Row>
                </div>
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
                <strong style={{ color: PAPER }}>4:45pm Saturday:</strong> doors open in the
                courtyard by the water fountain. Roll up anytime from 4:45 to 5:30 — clip on
                the wristbands, scan in, and watch them disappear into the glow.
              </Text>
              <Text style={styles.whatsNextLine}>
                <strong style={{ color: PAPER }}>Till then:</strong> watch the countdown on the
                site tick down. Saturday&apos;s already been warned.
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

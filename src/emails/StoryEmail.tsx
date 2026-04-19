import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Font,
  Row,
  Column,
} from '@react-email/components'

export const ATTN_TO_DETAIL_FOOTER =
  "This keepsake email was designed and built by Brian Leach of Attn: To Detail — a small consulting studio that helps founder-led businesses move faster with websites, AI tools, and honest strategy. If the details of this email made you smile, that's the whole idea."

export type StoryEmailChild = {
  first_name: string
  age: number | null
  story_html: string
  photos: { url: string; alt?: string }[]
  stats_line: string
}

export type StoryEmailProps = {
  event_name: string
  event_date: string
  event_logo_url?: string | null
  primary_parent_name: string
  children: StoryEmailChild[]
  download_all_url?: string | null
  unsubscribe_url?: string | null
  reply_to?: string | null
  attn_to_detail_url?: string
}

/* -----------------------------------------------------------------------------
 *  Glow palette (inline — email clients strip stylesheets)
 * -------------------------------------------------------------------------- */
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
  body: {
    margin: 0,
    padding: 0,
    backgroundColor: INK,
    fontFamily: bodyFont,
  } as const,
  wrapper: {
    backgroundColor: INK,
    padding: '28px 12px',
  } as const,
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
    padding: '36px 32px 24px',
    textAlign: 'center' as const,
    background:
      `radial-gradient(80% 120% at 50% 0%, ${UV}33 0%, ${INK_2} 60%), ${INK_2}`,
  } as const,
  eyebrow: {
    display: 'inline-block',
    color: MIST,
    fontFamily: bodyFont,
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.22em',
    textTransform: 'uppercase' as const,
    margin: '0 0 12px',
  } as const,
  wordmark: {
    fontFamily: displayFont,
    fontWeight: 800,
    fontSize: '34px',
    lineHeight: '1.05',
    letterSpacing: '-0.015em',
    color: PAPER,
    margin: '0 0 6px',
  } as const,
  wordmarkSub: {
    fontFamily: displayFont,
    fontWeight: 700,
    fontSize: '16px',
    letterSpacing: '0.12em',
    color: GOLD,
    textShadow: `0 0 14px ${GOLD}66`,
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
    padding: '24px 32px 8px',
    margin: 0,
  } as const,
  childBlock: {
    padding: '24px 32px 12px',
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
    fontSize: '26px',
    lineHeight: '1.1',
    letterSpacing: '-0.015em',
    color: PAPER,
    margin: '0 0 4px',
  } as const,
  childMeta: {
    color: MIST,
    fontSize: '13px',
    margin: '0 0 18px',
  } as const,
  storyBody: {
    color: PAPER,
    fontSize: '15px',
    lineHeight: '25px',
  } as const,
  photoGrid: {
    marginTop: '18px',
    borderCollapse: 'separate' as const,
    borderSpacing: '6px',
    width: '100%',
  } as const,
  photoCell: {
    padding: 0,
    verticalAlign: 'top' as const,
    width: '33.333%',
  } as const,
  photoImg: {
    display: 'block',
    width: '100%',
    height: 'auto',
    aspectRatio: '1 / 1' as unknown as string,
    objectFit: 'cover' as const,
    borderRadius: '10px',
    border: `1px solid ${HAIR}`,
  } as const,
  statsPill: {
    display: 'inline-block',
    marginTop: '18px',
    padding: '10px 14px',
    borderRadius: '999px',
    border: `1px solid ${CYAN}55`,
    backgroundColor: `${CYAN}12`,
    color: CYAN,
    fontFamily: bodyFont,
    fontSize: '12px',
    fontWeight: 700,
    lineHeight: '18px',
    letterSpacing: '0.02em',
  } as const,
  divider: {
    height: '1px',
    border: 'none',
    margin: '24px 32px',
    background: `linear-gradient(90deg, transparent 0%, ${HAIR} 50%, transparent 100%)`,
  } as const,
  downloadSection: {
    padding: '8px 32px 24px',
    textAlign: 'center' as const,
  } as const,
  downloadButton: {
    display: 'inline-block',
    padding: '14px 28px',
    borderRadius: '999px',
    backgroundColor: INK_3,
    border: `2px solid ${MAGENTA}`,
    color: PAPER,
    fontFamily: displayFont,
    fontWeight: 700,
    fontSize: '14px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    textDecoration: 'none',
    boxShadow: `0 0 20px ${MAGENTA}44`,
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
  footerStrong: {
    color: PAPER,
  } as const,
  footerLink: {
    color: CYAN,
    textDecoration: 'none',
  } as const,
  finePrint: {
    color: FAINT,
    fontSize: '11px',
    lineHeight: '16px',
    margin: 0,
  } as const,
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

// Render 'YYYY-MM-DD' from the Postgres date column as a readable line
// like 'Saturday, April 25, 2026'. Anything non-ISO (e.g. free-text an admin
// typed into Settings) passes through unchanged so we don't mangle it.
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

export default function StoryEmail({
  event_name,
  event_date,
  event_logo_url,
  primary_parent_name,
  children,
  download_all_url,
  unsubscribe_url,
  reply_to,
  attn_to_detail_url = 'https://attntodetail.ai',
}: StoryEmailProps) {
  const subjectPreview =
    children.length === 1
      ? `${children[0].first_name}'s night at ${event_name}`
      : `Your kids' night at ${event_name}`

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
      <Preview>{subjectPreview}</Preview>
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
              <Text style={styles.eyebrow}>Keepsake · Lincoln Christian Academy</Text>
              <Heading as="h1" style={styles.wordmark}>
                {event_name}
              </Heading>
              <Text style={styles.wordmarkSub}>Glow Party Edition</Text>
              <Text style={styles.dateline}>{formatEventDate(event_date)}</Text>
            </Section>

            <Text style={styles.greeting}>Hi {primary_parent_name} —</Text>
            <Text style={{ ...styles.greeting, padding: '4px 32px 0', color: MIST }}>
              Here&apos;s a small keepsake from last night.
            </Text>

            {children.map((child, i) => (
              <div key={child.first_name + i}>
                <Section style={styles.childBlock}>
                  <span style={styles.childHeaderBar}>{child.first_name}</span>
                  <Heading as="h2" style={styles.childName}>
                    {child.first_name}
                  </Heading>
                  {child.age != null && (
                    <Text style={styles.childMeta}>Age {child.age}</Text>
                  )}

                  <div
                    style={styles.storyBody}
                    dangerouslySetInnerHTML={{ __html: child.story_html }}
                  />

                  {child.photos.length > 0 && (
                    <table style={styles.photoGrid} cellPadding={0} cellSpacing={0} role="presentation">
                      <tbody>
                        {chunk(child.photos.slice(0, 9), 3).map((row, rowIdx) => (
                          <Row key={rowIdx}>
                            {row.map((p, ci) => (
                              <Column key={ci} style={styles.photoCell}>
                                <Img
                                  src={p.url}
                                  alt={p.alt ?? `${child.first_name} photo ${rowIdx * 3 + ci + 1}`}
                                  style={styles.photoImg}
                                />
                              </Column>
                            ))}
                            {row.length < 3 &&
                              Array.from({ length: 3 - row.length }).map((_, gap) => (
                                <Column key={`gap-${gap}`} style={styles.photoCell} />
                              ))}
                          </Row>
                        ))}
                      </tbody>
                    </table>
                  )}

                  <div>
                    <span style={styles.statsPill}>{child.stats_line}</span>
                  </div>
                </Section>
                {i < children.length - 1 && <Hr style={styles.divider} />}
              </div>
            ))}

            {download_all_url && (
              <Section style={styles.downloadSection}>
                <Link href={download_all_url} style={styles.downloadButton}>
                  Download all photos
                </Link>
              </Section>
            )}

            <div style={styles.footer}>
              <Text style={styles.footerText}>
                <span style={styles.footerStrong}>{ATTN_TO_DETAIL_FOOTER}</span>
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

              {(reply_to || unsubscribe_url) && (
                <Text style={styles.finePrint}>
                  {reply_to && (
                    <>
                      Reply-to:{' '}
                      <Link href={`mailto:${reply_to}`} style={{ ...styles.footerLink, color: FAINT }}>
                        {reply_to}
                      </Link>
                      {' · '}
                    </>
                  )}
                  {unsubscribe_url && (
                    <Link href={unsubscribe_url} style={{ ...styles.footerLink, color: FAINT }}>
                      Unsubscribe
                    </Link>
                  )}
                </Text>
              )}
            </div>
          </Container>
        </div>
      </Body>
    </Html>
  )
}

export function subjectForFamily(children: StoryEmailChild[], eventName: string, familyLastName: string): string {
  if (children.length === 1) {
    return `A little surprise from last night — ${children[0].first_name}'s night at ${eventName} ✨`
  }
  return `A little surprise from last night — the ${familyLastName} kids at ${eventName} ✨`
}

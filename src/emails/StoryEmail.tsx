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

const styles = {
  body: { backgroundColor: '#faf8fb', margin: 0, fontFamily: 'Helvetica, Arial, sans-serif' },
  container: { backgroundColor: '#ffffff', margin: '24px auto', padding: '24px', maxWidth: '560px', borderRadius: '8px' },
  brandRow: { textAlign: 'center' as const, marginBottom: '8px' },
  eventName: { color: '#701a75', fontSize: '22px', fontWeight: 800, margin: '0 0 4px 0', textAlign: 'center' as const },
  eventDate: { color: '#64748b', fontSize: '13px', margin: 0, textAlign: 'center' as const },
  greeting: { color: '#0f172a', fontSize: '16px', lineHeight: '24px' },
  childBlock: { marginTop: '28px' },
  childHeader: { color: '#0f172a', fontSize: '20px', fontWeight: 800, margin: '0 0 8px 0' },
  storyBody: { color: '#111827', fontSize: '15px', lineHeight: '24px' },
  photoGrid: { marginTop: '12px' },
  photoCell: { display: 'inline-block' as const, padding: '4px', verticalAlign: 'top' as const },
  photoImg: { width: '120px', height: '120px', objectFit: 'cover' as const, borderRadius: '6px' },
  statsLine: { color: '#6b21a8', fontSize: '13px', fontWeight: 700, marginTop: '12px' },
  downloadCta: { textAlign: 'center' as const, margin: '24px 0' },
  button: {
    display: 'inline-block' as const,
    backgroundColor: '#a21caf',
    color: '#ffffff',
    padding: '12px 24px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: 700,
  },
  divider: { borderColor: '#e5e7eb', margin: '28px 0 20px 0' },
  footer: { color: '#64748b', fontSize: '12px', lineHeight: '18px' },
  footerStrong: { color: '#334155' },
  finePrint: { color: '#94a3b8', fontSize: '11px', lineHeight: '16px', marginTop: '12px' },
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
  const subjectPreview = children.length === 1
    ? `${children[0].first_name}'s night at ${event_name}`
    : `Your kids' night at ${event_name}`

  return (
    <Html>
      <Head />
      <Preview>{subjectPreview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {event_logo_url && (
            <Section style={styles.brandRow}>
              <Img src={event_logo_url} alt={event_name} height={48} />
            </Section>
          )}

          <Heading as="h1" style={styles.eventName}>{event_name}</Heading>
          <Text style={styles.eventDate}>{event_date}</Text>

          <Hr style={styles.divider} />

          <Text style={styles.greeting}>Hi {primary_parent_name} —</Text>
          <Text style={styles.greeting}>
            Here&apos;s a quick keepsake from last night.
          </Text>

          {children.map((child) => (
            <Section key={child.first_name} style={styles.childBlock}>
              <Heading as="h2" style={styles.childHeader}>
                {child.first_name}
                {child.age != null && <span style={{ color: '#64748b', fontWeight: 400, fontSize: '14px' }}> · age {child.age}</span>}
              </Heading>

              <div style={styles.storyBody} dangerouslySetInnerHTML={{ __html: child.story_html }} />

              {child.photos.length > 0 && (
                <Section style={styles.photoGrid}>
                  {child.photos.slice(0, 8).map((p, i) => (
                    <span key={i} style={styles.photoCell}>
                      <Img src={p.url} alt={p.alt ?? `${child.first_name} photo ${i + 1}`} style={styles.photoImg} />
                    </span>
                  ))}
                </Section>
              )}

              <Text style={styles.statsLine}>{child.stats_line}</Text>
            </Section>
          ))}

          {download_all_url && (
            <Section style={styles.downloadCta}>
              <Link href={download_all_url} style={styles.button}>Download all photos</Link>
            </Section>
          )}

          <Hr style={styles.divider} />

          <Text style={styles.footer}>
            <span style={styles.footerStrong}>{ATTN_TO_DETAIL_FOOTER}</span>{' '}
            <Link href={`mailto:brian@attntodetail.ai`}>brian@attntodetail.ai</Link>{' · '}
            <Link href={attn_to_detail_url}>attntodetail.ai</Link>
          </Text>

          <Text style={styles.finePrint}>
            {reply_to && <>Reply-to: <Link href={`mailto:${reply_to}`}>{reply_to}</Link>{' · '}</>}
            {unsubscribe_url && <Link href={unsubscribe_url}>Unsubscribe</Link>}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export function subjectForFamily(children: StoryEmailChild[], eventName: string, familyLastName: string): string {
  if (children.length === 1) {
    return `A little surprise from last night — ${children[0].first_name}'s night at ${eventName} 🌟`
  }
  return `A little surprise from last night — the ${familyLastName} kids at ${eventName} 🌟`
}

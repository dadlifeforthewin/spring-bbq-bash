export function CheckOutGlyph({ size = 80 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 34 L20 20 L34 20" />
      <path d="M66 20 L80 20 L80 34" />
      <path d="M80 66 L80 80 L66 80" />
      <path d="M34 80 L20 80 L20 66" />
      <path d="M40 50 L60 50 M52 42 L60 50 L52 58" strokeWidth={3.5} transform="translate(8 0)" />
    </svg>
  )
}

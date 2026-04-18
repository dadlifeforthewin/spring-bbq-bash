import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Unbounded, Inter } from 'next/font/google'

const unbounded = Unbounded({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Spring BBQ Bash · Glow Party Edition',
  description: 'Lincoln Christian Academy — April 25, 2026',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0B0A1F',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${unbounded.variable} ${inter.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  )
}

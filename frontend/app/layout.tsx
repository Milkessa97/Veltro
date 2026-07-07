import type { Metadata } from 'next'
import { Outfit, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const outfit = Outfit({ subsets: ['latin'], variable: '--font-sans', weight: ['400','500','600','700','800'] })
const _geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'Veltro | Engineering analytics for GitHub teams',
  description:
    'Measure cycle time, unblock reviews, and ship faster. DevPulse turns your GitHub activity into clear signals and AI digests.',
  generator: 'v0.app',
  icons: {
    icon: '/veltro-v-mark.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${_geistMono.variable}`} suppressHydrationWarning>
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

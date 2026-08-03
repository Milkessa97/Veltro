import type { Metadata } from 'next'
import { Outfit, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const outfit = Outfit({ subsets: ['latin'], variable: '--font-sans', weight: ['400','500','600','700','800'] })
const _geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  verification: { google: 'AYhEQXrsZPNB2qKAoqFKXN973anGnofAeQFHZwsv_s4' },
  metadataBase: new URL('https://veltro-dev.vercel.app'),
  title: {
    default: 'Veltro | Engineering Analytics for GitHub Teams',
    template: '%s | Veltro'
  },
  description:
    'Measure cycle time, unblock reviews, and ship faster. Veltro turns your GitHub activity into clear signals and AI digests.',
  keywords: ['GitHub', 'Engineering Analytics', 'Developer Productivity', 'Cycle Time', 'PR Reviews', 'Veltro'],
  icons: {
    icon: '/veltro-v-mark.svg',
    shortcut: '/veltro-v-mark.svg',
    apple: '/veltro-v-mark.svg',
  },
  openGraph: {
    title: 'Veltro | Engineering Analytics for GitHub Teams',
    description: 'Measure cycle time, unblock reviews, and ship faster. Veltro turns your GitHub activity into clear signals and AI digests.',
    url: 'https://veltro-dev.vercel.app',
    siteName: 'Veltro',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Veltro Engineering Analytics Dashboard',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Veltro | Engineering Analytics for GitHub Teams',
    description: 'Measure cycle time, unblock reviews, and ship faster. Veltro turns your GitHub activity into clear signals and AI digests.',
    images: ['/images/og-image.png'],
  },
  alternates: {
    canonical: 'https://veltro-dev.vercel.app',
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

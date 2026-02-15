import React from "react"
import type { Metadata, Viewport } from 'next'
import { generateSEO } from '@/lib/seo'
import { Analytics } from '@vercel/analytics/next'
import { GoogleAnalytics } from '@/components/google-analytics'

import './globals.css'

export const metadata: Metadata = generateSEO({
  title: 'Sports Betting Analytics for MLB, NBA & NFL | HeatCheck HQ',
  description: 'Free sports analytics dashboards with NRFI predictions, NBA first basket picks, defense vs position rankings, and player prop insights. Updated daily for MLB, NBA & NFL.',
  path: '/',
  keywords: [
    'sports betting analytics',
    'NRFI predictions today',
    'NBA first basket picks',
    'defense vs position rankings',
    'player props',
    'free sports analytics',
  ],
})

export const viewport: Viewport = {
  themeColor: '#0d1117',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        <Analytics />
        <GoogleAnalytics />
      </body>
    </html>
  )
}

import React from "react"
import type { Metadata, Viewport } from 'next'
import { generateSEO } from '@/lib/seo'

import './globals.css'

export const metadata: Metadata = generateSEO({
  title: 'HeatCheck HQ - Sports Analytics Platform for MLB, NBA & NFL',
  description: 'Advanced sports analytics dashboards for MLB, NBA, and NFL. Real-time player statistics, trends, streaks, and matchup analysis. Turn raw data into actionable insights.',
  path: '/',
  keywords: [
    'MLB analytics',
    'NBA analytics',
    'NFL analytics',
    'sports betting',
    'player stats',
    'NRFI',
    'first basket',
    'pitcher arsenals',
    'sports trends',
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
      </body>
    </html>
  )
}

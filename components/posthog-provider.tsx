// ============================================================
// components/posthog-provider.tsx — PostHog analytics provider
// ============================================================
// Initialises PostHog on the client. Loaded in RootLayout.
// Env vars: NEXT_PUBLIC_POSTHOG_KEY, NEXT_PUBLIC_POSTHOG_HOST

"use client"

import { useEffect } from "react"
import posthog from "posthog-js"

export function PostHogProvider() {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com"

    if (!key) return

    posthog.init(key, {
      api_host: host,
      // Respect user privacy
      persistence: "localStorage+cookie",
      capture_pageview: true,
      capture_pageleave: true,
      // Don't autocapture everything — we send structured events
      autocapture: false,
      // Disable session recording by default (can enable in PostHog dashboard)
      disable_session_recording: true,
    })
  }, [])

  return null
}

// Re-export posthog instance for use in lib/analytics.ts
export { posthog }

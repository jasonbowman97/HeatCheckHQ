// ============================================================
// sentry.client.config.ts — Sentry browser-side configuration
// ============================================================
// Env var: NEXT_PUBLIC_SENTRY_DSN (set in Vercel dashboard)

import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring — sample 10% of transactions in production
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Session replay — capture 1% of sessions, 100% of error sessions
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,

  // Only send errors in production
  environment: process.env.NODE_ENV,

  // Filter out noisy errors
  ignoreErrors: [
    // Browser extensions
    "ResizeObserver loop",
    "Non-Error promise rejection",
    // Network errors users cause by navigating away
    "AbortError",
    "TypeError: Failed to fetch",
    "TypeError: NetworkError",
    "TypeError: Load failed",
    // Next.js hydration warnings (non-critical)
    "Hydration failed",
    "Text content does not match",
  ],

  // Don't send PII
  sendDefaultPii: false,
})

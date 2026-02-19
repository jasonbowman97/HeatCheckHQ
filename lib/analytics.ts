type EventParams = Record<string, string | number | boolean>

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

/**
 * Track an event to both GA4 and PostHog.
 * PostHog is lazy-imported to avoid bundling it server-side.
 */
export function trackEvent(eventName: string, params?: EventParams) {
  if (typeof window === "undefined") return

  // GA4
  if (window.gtag) {
    window.gtag("event", eventName, params)
  }

  // PostHog — dynamic import to keep it client-only
  import("posthog-js")
    .then(({ default: posthog }) => {
      if (posthog.__loaded) {
        posthog.capture(eventName, params)
      }
    })
    .catch(() => {
      // PostHog not available — that's fine
    })
}

// Pre-defined events for the conversion funnel
export const analytics = {
  signupCompleted: (method: string = "email") =>
    trackEvent("signup_completed", { method }),

  dashboardViewed: (dashboard: string, sport: string) =>
    trackEvent("dashboard_viewed", { dashboard, sport }),

  paywallHit: (dashboard: string, userTier: string) =>
    trackEvent("paywall_hit", { dashboard, user_tier: userTier }),

  signupGateHit: (dashboard: string) =>
    trackEvent("signup_gate_hit", { dashboard }),

  checkoutStarted: (plan: string) =>
    trackEvent("checkout_started", { plan }),

  subscriptionCompleted: (plan: string, value: number) =>
    trackEvent("subscription_completed", { plan, value, currency: "USD" }),

  ctaClicked: (location: string, text: string) =>
    trackEvent("cta_clicked", { location, text }),

  trialActivated: () =>
    trackEvent("trial_activated", { trial_days: 7 }),

  propSaved: (sport: string, stat: string) =>
    trackEvent("prop_saved", { sport, stat }),

  propUnsaved: (sport: string, stat: string) =>
    trackEvent("prop_unsaved", { sport, stat }),
}

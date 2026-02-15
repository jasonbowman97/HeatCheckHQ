type EventParams = Record<string, string | number | boolean>

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export function trackEvent(eventName: string, params?: EventParams) {
  // GA4
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, params)
  }
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
}

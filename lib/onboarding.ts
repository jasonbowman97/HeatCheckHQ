// ============================================================
// lib/onboarding.ts — Centralized onboarding state management
// ============================================================
// Uses localStorage for fast reads + Supabase user_metadata for
// cross-device persistence. On login, Supabase state hydrates
// localStorage so returning users on new devices skip onboarding.

import { createClient } from "@/lib/supabase/client"

const ONBOARDED_KEY = "hchq-onboarded"
const DISMISSED_KEY = "hchq-onboarding-dismissed"

// ── Welcome Modal (onboarded flag) ──

/** Fast check: has user completed onboarding? (localStorage-first) */
export function isOnboarded(): boolean {
  if (typeof window === "undefined") return true
  return localStorage.getItem(ONBOARDED_KEY) === "true"
}

/** Mark user as onboarded in both localStorage and Supabase user_metadata */
export async function setOnboarded(): Promise<void> {
  if (typeof window === "undefined") return

  // Immediate write to localStorage (fast path)
  localStorage.setItem(ONBOARDED_KEY, "true")

  // Persist to Supabase user_metadata (cross-device)
  try {
    const supabase = createClient()
    await supabase.auth.updateUser({
      data: { onboarded: true },
    })
  } catch (err) {
    console.warn("[Onboarding] Failed to persist onboarded state to Supabase:", err)
  }
}

// ── Onboarding Tooltips (per-page dismissed set) ──

/** Get set of dismissed page paths from localStorage */
export function getDismissedTips(): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = localStorage.getItem(DISMISSED_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

/** Dismiss a page tip in both localStorage and Supabase user_metadata */
export async function dismissTip(pathname: string): Promise<Set<string>> {
  const updated = getDismissedTips()
  updated.add(pathname)

  // Immediate write to localStorage
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...updated]))
  } catch {
    // localStorage may be unavailable
  }

  // Persist to Supabase user_metadata
  try {
    const supabase = createClient()
    await supabase.auth.updateUser({
      data: { dismissed_tips: [...updated] },
    })
  } catch (err) {
    console.warn("[Onboarding] Failed to persist dismissed tips to Supabase:", err)
  }

  return updated
}

// ── Hydration (call on login/page load to sync Supabase → localStorage) ──

/** Sync onboarding state from Supabase user_metadata → localStorage.
 *  Call this after login or on first authenticated page load.
 *  Returns true if the user was already onboarded (from Supabase). */
export async function hydrateOnboardingState(): Promise<boolean> {
  if (typeof window === "undefined") return true

  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user?.user_metadata) return isOnboarded()

    const meta = user.user_metadata

    // Hydrate onboarded flag
    if (meta.onboarded === true) {
      localStorage.setItem(ONBOARDED_KEY, "true")
    }

    // Hydrate dismissed tips
    if (Array.isArray(meta.dismissed_tips) && meta.dismissed_tips.length > 0) {
      const local = getDismissedTips()
      const merged = new Set([...local, ...meta.dismissed_tips])
      localStorage.setItem(DISMISSED_KEY, JSON.stringify([...merged]))
    }

    return meta.onboarded === true
  } catch (err) {
    console.warn("[Onboarding] Failed to hydrate from Supabase:", err)
    return isOnboarded()
  }
}

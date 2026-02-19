import { createClient } from "@/lib/supabase/server"

export async function getUserTier(): Promise<"anonymous" | "free" | "pro"> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return "anonymous"

    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier, trial_expires_at")
      .eq("id", user.id)
      .single()

    if (!profile) return "free"

    if (profile.subscription_tier === "pro") {
      // If user is on a trial, check if it's expired
      if (profile.trial_expires_at) {
        const trialEnd = new Date(profile.trial_expires_at)
        if (trialEnd > new Date()) {
          return "pro" // Trial still active
        }
        // Trial expired — they're back to free
        return "free"
      }
      return "pro" // Paid Pro, no trial
    }

    return "free"
  } catch {
    return "anonymous"
  }
}

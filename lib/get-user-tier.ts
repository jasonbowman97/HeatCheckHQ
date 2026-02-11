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
      .select("subscription_tier")
      .eq("id", user.id)
      .single()

    if (profile?.subscription_tier === "pro") return "pro"
    return "free"
  } catch {
    return "anonymous"
  }
}

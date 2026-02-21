import { createClient } from '@supabase/supabase-js'

/**
 * Service role client for server-side writes (cron ingestion, backfill).
 * Uses the service role key which bypasses RLS — NEVER expose to the browser.
 * Always create a new client per invocation (no global singletons).
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars'
    )
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

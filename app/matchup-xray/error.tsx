"use client"

import { DashboardError } from "@/components/dashboard-error"

export default function MatchupXRayError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <DashboardError
      error={error}
      reset={reset}
      backHref="/matchup-xray"
      backLabel="Matchup X-Ray"
    />
  )
}

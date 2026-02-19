"use client"

import { DashboardError } from "@/components/dashboard-error"

export default function NBAError({
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
      backHref="/nba"
      backLabel="NBA Home"
    />
  )
}

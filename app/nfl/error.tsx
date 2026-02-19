"use client"

import { DashboardError } from "@/components/dashboard-error"

export default function NFLError({
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
      backHref="/nfl"
      backLabel="NFL Home"
    />
  )
}

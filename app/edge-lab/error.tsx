"use client"

import { DashboardError } from "@/components/dashboard-error"

export default function EdgeLabError({
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
      backHref="/edge-lab"
      backLabel="Edge Lab"
    />
  )
}

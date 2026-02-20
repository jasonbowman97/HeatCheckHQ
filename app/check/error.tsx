"use client"

import { DashboardError } from "@/components/dashboard-error"

export default function CheckError({
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
      backHref="/check"
      backLabel="Prop Analyzer"
    />
  )
}

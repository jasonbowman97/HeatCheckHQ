"use client"

import { useEffect } from "react"
import Link from "next/link"
import * as Sentry from "@sentry/nextjs"

export function DashboardError({
  error,
  reset,
  backHref = "/",
  backLabel = "Go Home",
}: {
  error: Error & { digest?: string }
  reset: () => void
  backHref?: string
  backLabel?: string
}) {
  useEffect(() => {
    Sentry.captureException(error)
    if (process.env.NODE_ENV === "development") {
      console.error("[Dashboard Error]", error)
    }
  }, [error])

  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6 py-12">
      <div className="mx-auto max-w-md text-center">
        <div className="flex justify-center mb-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
            <svg
              className="h-7 w-7 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-foreground">
          Something went wrong
        </h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          This dashboard encountered an error. You can try again or navigate to
          another page.
        </p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
          <Link
            href={backHref}
            className="inline-flex items-center justify-center rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
          >
            {backLabel}
          </Link>
        </div>
      </div>
    </div>
  )
}

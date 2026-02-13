import Link from "next/link"
import { Lock, ArrowRight, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SignupGateProps {
  /** What to show above the gate (visible preview) */
  preview: React.ReactNode
  /** What to blur behind the gate (gated content) */
  gated: React.ReactNode
  /** Headline text */
  headline?: string
  /** Description text */
  description?: string
  /** Total count label, e.g. "42 players" or "8 more games" */
  countLabel?: string
}

export function SignupGate({
  preview,
  gated,
  headline = "Sign up free to see all data",
  description = "Create a free account to unlock the full dashboard. It only takes a few seconds.",
  countLabel,
}: SignupGateProps) {
  return (
    <>
      {/* Visible preview content */}
      {preview}

      {/* Gated section with blur + CTA */}
      <div className="relative mt-0">
        {/* Blurred content behind */}
        <div className="pointer-events-none select-none" aria-hidden="true">
          <div className="blur-[6px] opacity-30 max-h-[400px] overflow-hidden">
            {gated}
          </div>
          {/* Gradient fade at the top of blurred section */}
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-background to-transparent" />
        </div>

        {/* CTA overlay */}
        <div className="absolute inset-0 flex items-start justify-center pt-12">
          <div className="mx-4 w-full max-w-lg rounded-xl border border-border bg-card/95 backdrop-blur-sm p-6 text-center shadow-2xl">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Eye className="h-5 w-5 text-primary" />
            </div>

            <h3 className="text-lg font-bold text-foreground">
              {headline}
            </h3>
            {countLabel && (
              <p className="mt-1 text-xs font-medium text-primary">
                {countLabel}
              </p>
            )}
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>

            <div className="mt-5 flex flex-col gap-2.5">
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                asChild
              >
                <Link href="/auth/sign-up">
                  Sign up free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <p className="text-xs text-muted-foreground">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ============================================================
// app/bet-builder/page.tsx — 60-Second Bet Builder
// ============================================================
// Pro-only guided parlay builder. Walks users through sport,
// confidence, prop selection, and parlay summary in 4 steps.

import { ProtectedPage } from "@/components/protected-page"
import { AppShell } from "@/components/app-shell"
import { StepWizard } from "@/components/bet-builder/step-wizard"

export const metadata = {
  title: "60-Second Bet Builder — HeatCheck HQ",
  description: "Build a convergence-backed parlay in under 60 seconds with guided prop selection.",
}

export default function BetBuilderPage() {
  return (
    <ProtectedPage pathname="/bet-builder">
      <AppShell subtitle="60-second parlay builder">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">60-Second Bet Builder</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Build a convergence-backed parlay in four quick steps.
            </p>
          </div>
          <StepWizard />
        </div>
      </AppShell>
    </ProtectedPage>
  )
}

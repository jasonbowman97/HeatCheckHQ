// ============================================================
// app/situation-room/page.tsx — Game-Day Command Center
// ============================================================
// Pro-only page showing today's games by sport with top
// convergence props, live alert feed, weather panel, and
// sortable convergence grid.

import { Suspense } from "react"
import { ProtectedPage } from "@/components/protected-page"
import { AppShell } from "@/components/app-shell"
import { SituationRoomContent } from "./situation-room-content"

export const metadata = {
  title: "Situation Room — HeatCheck HQ",
  description: "Game-day command center with live convergence alerts, top props, and weather impact analysis.",
}

export default function SituationRoomPage() {
  return (
    <ProtectedPage pathname="/situation-room">
      <AppShell subtitle="Live game-day command center">
        <Suspense fallback={<SituationRoomSkeleton />}>
          <SituationRoomContent />
        </Suspense>
      </AppShell>
    </ProtectedPage>
  )
}

function SituationRoomSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-64 bg-muted rounded animate-pulse" />
        <div className="h-4 w-96 bg-muted/60 rounded animate-pulse" />
      </div>

      {/* Sport tabs skeleton */}
      <div className="flex gap-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-9 w-20 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="space-y-4">
          <div className="h-80 bg-muted rounded-xl animate-pulse" />
          <div className="h-48 bg-muted rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  )
}

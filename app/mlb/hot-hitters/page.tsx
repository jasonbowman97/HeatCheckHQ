"use client"

import { DashboardShell } from "@/components/dashboard-shell"
import { HotHittersSection } from "@/components/trends/hot-hitters-section"

export default function HotHittersPage() {
  return (
    <DashboardShell>
      <main className="mx-auto max-w-[1440px] px-4 sm:px-6 py-4 sm:py-8">
        <HotHittersSection />
      </main>
    </DashboardShell>
  )
}

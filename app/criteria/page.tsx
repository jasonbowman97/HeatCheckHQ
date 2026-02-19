// ============================================================
// app/criteria/page.tsx — My Research Criteria page
// ============================================================
// Manages saved condition alerts. Free users: 3 criteria.
// Pro users: unlimited criteria with performance tracking.

import { ProtectedPage } from "@/components/protected-page"
import { AppShell } from "@/components/app-shell"
import { CriteriaManager } from "@/components/criteria/criteria-manager"

export const metadata = {
  title: "My Research Criteria — HeatCheck HQ",
  description: "Set custom conditions and get alerted when props match your research criteria.",
}

export default function CriteriaPage() {
  return (
    <ProtectedPage pathname="/criteria">
      <AppShell subtitle="Research-based alerts">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <CriteriaManager />
        </div>
      </AppShell>
    </ProtectedPage>
  )
}

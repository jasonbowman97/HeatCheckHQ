import { generateSEO } from "@/lib/seo"
import { ProtectedPage } from "@/components/protected-page"

export const metadata = generateSEO({
  title: "What-If Simulator - Scenario Builder for Player Props | HeatCheck HQ",
  description: "Simulate what-if scenarios for player props. Adjust matchup variables and see how different conditions affect projected outcomes across MLB, NBA & NFL.",
  path: "/what-if",
  keywords: ["what if simulator", "prop scenario builder", "sports what if analysis", "prop projections"],
})

export default function WhatIfLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedPage pathname="/what-if">
      {children}
    </ProtectedPage>
  )
}

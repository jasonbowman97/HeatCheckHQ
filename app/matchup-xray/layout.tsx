import { generateSEO } from "@/lib/seo"
import { ProtectedPage } from "@/components/protected-page"

export const metadata = generateSEO({
  title: "Matchup X-Ray - Deep Matchup Analysis | HeatCheck HQ",
  description: "Deep-dive any game matchup with defense-adjusted projections, pace analysis, and key player breakdowns across MLB, NBA & NFL.",
  path: "/matchup-xray",
  keywords: ["matchup analysis", "matchup x-ray", "game matchup breakdown", "defense adjusted projections"],
})

export default function MatchupXRayLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedPage pathname="/matchup-xray">{children}</ProtectedPage>
}

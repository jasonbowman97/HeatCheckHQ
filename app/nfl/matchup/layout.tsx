import { ProtectedPage } from "@/components/protected-page"
import { generateSEO } from "@/lib/seo"

export const metadata = generateSEO({
  title: "NFL Team Matchup Analysis - Side-by-Side Stats | HeatCheck HQ",
  description: "In-depth NFL team matchup analysis with side-by-side stat comparisons. View passing, rushing, and receiving stats with league rankings and recent game log trends.",
  path: "/nfl/matchup",
  keywords: [
    "NFL matchup",
    "NFL team stats",
    "NFL comparison",
    "passing yards",
    "rushing stats",
    "receiving stats",
    "NFL rankings",
  ],
})

export default function MatchupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProtectedPage pathname="/nfl/matchup">{children}</ProtectedPage>
}

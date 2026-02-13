import { ProtectedPage } from "@/components/protected-page"
import { generateSEO } from "@/lib/seo"

export const metadata = generateSEO({
  title: "NBA Head-to-Head Matchups - Team Analysis Dashboard | HeatCheck.io",
  description: "Comprehensive NBA team head-to-head matchup analysis. Compare offensive and defensive stats, historical performance, injury reports, and momentum indicators.",
  path: "/nba/head-to-head",
  keywords: [
    "NBA head to head",
    "NBA matchups",
    "team comparison",
    "NBA defense rankings",
    "position defense",
    "NBA injuries",
    "team momentum",
  ],
})

export default function HeadToHeadLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProtectedPage pathname="/nba/head-to-head">{children}</ProtectedPage>
}

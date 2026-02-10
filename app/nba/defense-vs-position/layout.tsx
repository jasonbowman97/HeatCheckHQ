import { ProtectedPage } from "@/components/protected-page"
import { generateSEO } from "@/lib/seo"

export const metadata = generateSEO({
  title: "NBA Defense vs Position - Matchup Advantages | HeatCheck HQ",
  description: "Find favorable and tough NBA matchups based on team defensive rankings by position. See which teams give up the most points, rebounds, and assists to each position.",
  path: "/nba/defense-vs-position",
  keywords: [
    "NBA defense vs position",
    "NBA matchups",
    "position defense",
    "defensive rankings",
    "NBA player props",
    "favorable matchups",
  ],
})

export default function DefenseVsPositionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProtectedPage pathname="/nba/defense-vs-position">{children}</ProtectedPage>
}

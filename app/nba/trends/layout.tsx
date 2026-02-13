import { ProtectedPage } from "@/components/protected-page"
import { generateSEO } from "@/lib/seo"

export const metadata = generateSEO({
  title: "NBA Trends - Scoring Streaks & 3PT Surges | HeatCheck.io",
  description: "NBA trend analysis including scoring runs, 3-point shooting streaks, rebound and assist surges. Track player momentum and performance patterns.",
  path: "/nba/trends",
  keywords: [
    "NBA trends",
    "scoring streaks",
    "3-point trends",
    "NBA momentum",
    "player performance",
    "NBA analytics",
  ],
})

export default function NBATrendsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProtectedPage pathname="/nba/trends">{children}</ProtectedPage>
}

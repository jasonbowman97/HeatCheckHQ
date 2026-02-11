import { ProtectedPage } from "@/components/protected-page"
import { generateSEO } from "@/lib/seo"

export const metadata = generateSEO({
  title: "NFL Trends - Performance Streaks & Patterns | HeatCheck HQ",
  description: "NFL trend analysis including rushing, passing, and receiving streaks. Track team and player momentum with advanced pattern detection.",
  path: "/nfl/trends",
  keywords: [
    "NFL trends",
    "passing streaks",
    "rushing trends",
    "NFL momentum",
    "player performance",
    "NFL analytics",
  ],
})

export default function NFLTrendsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProtectedPage pathname="/nfl/trends">{children}</ProtectedPage>
}

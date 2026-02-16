import { ProtectedPage } from "@/components/protected-page"
import { generateSEO } from "@/lib/seo"

export const metadata = generateSEO({
  title: "NBA Streak Tracker - Custom Threshold Filters | HeatCheck HQ",
  description:
    "Build custom NBA streak filters. Set your own stat thresholds for points, rebounds, assists, 3PM, steals, and blocks. See which players consistently hit your lines.",
  path: "/nba/streaks",
  keywords: [
    "NBA streaks",
    "player props",
    "custom thresholds",
    "consistency tracker",
    "NBA analytics",
    "prop builder",
  ],
})

export default function NBAStreaksLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProtectedPage pathname="/nba/streaks">{children}</ProtectedPage>
}

import { ProtectedPage } from "@/components/protected-page"
import { generateSEO } from "@/lib/seo"

export const metadata = generateSEO({
  title: "MLB Streak Tracker - Hitting & Pitching Consistency | HeatCheck HQ",
  description: "Track MLB player hitting streaks, home run surges, RBI consistency, and pitching strikeout streaks. Set custom thresholds and find the hottest bats and arms.",
  path: "/mlb/streaks",
  keywords: [
    "MLB streak tracker",
    "hitting streaks",
    "home run streaks",
    "RBI consistency",
    "stolen base streaks",
    "pitching strikeouts",
    "MLB player trends",
  ],
})

export default function MLBStreaksLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProtectedPage pathname="/mlb/streaks">{children}</ProtectedPage>
}

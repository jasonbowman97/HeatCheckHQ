import { ProtectedPage } from "@/components/protected-page"
import { generateSEO } from "@/lib/seo"

export const metadata = generateSEO({
  title: "MLB Pitching Stats - Pitcher Arsenal Analytics | HeatCheck.io",
  description: "Advanced MLB pitching statistics and arsenal analysis. Track ERA, strikeout rates, CSW%, pitch types, velocity, and pitcher matchup data for all MLB pitchers.",
  path: "/mlb/pitching-stats",
  keywords: [
    "MLB pitching stats",
    "ERA leaders",
    "strikeout rate",
    "CSW%",
    "pitch arsenal",
    "pitch velocity",
    "pitcher analytics",
    "MLB pitchers",
  ],
})

export default function PitchingStatsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProtectedPage pathname="/mlb/pitching-stats">{children}</ProtectedPage>
}

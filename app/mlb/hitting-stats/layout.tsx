import { ProtectedPage } from "@/components/protected-page"
import { generateSEO } from "@/lib/seo"

export const metadata = generateSEO({
  title: "MLB Hitter vs Pitcher - Matchup Statistics Dashboard | HeatCheck.io",
  description: "Comprehensive MLB hitter vs pitcher matchup dashboard. View batting averages, home runs, RBIs, OPS, exit velocity, barrel rates, and batter vs pitcher splits with real-time data.",
  path: "/mlb/hitting-stats",
  keywords: [
    "MLB hitting stats",
    "batting average",
    "home runs",
    "RBI leaders",
    "exit velocity",
    "barrel rate",
    "batter vs pitcher",
    "MLB statistics",
  ],
})

export default function HittingStatsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProtectedPage pathname="/mlb/hitting-stats">{children}</ProtectedPage>
}

import { ProtectedPage } from "@/components/protected-page"
import { generateSEO } from "@/lib/seo"

export const metadata = generateSEO({
  title: "MLB Hitting Stats - Player Statistics Dashboard | HeatCheck HQ",
  description: "Comprehensive MLB hitting statistics dashboard. View batting averages, home runs, RBIs, OPS, exit velocity, barrel rates, and batter vs pitcher matchups with real-time data.",
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

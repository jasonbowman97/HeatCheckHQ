import { ProtectedPage } from "@/components/protected-page"
import { generateSEO } from "@/lib/seo"

export const metadata = generateSEO({
  title: "MLB Trends - Scoring Runs, Streaks & Surges | HeatCheck.io",
  description: "MLB trend analysis including hit streaks, XBH runs, HR surges, and cold slumps. Track player momentum and emerging patterns across the league.",
  path: "/mlb/trends",
  keywords: [
    "MLB trends",
    "hit streaks",
    "home run surges",
    "scoring trends",
    "MLB momentum",
    "player trends",
  ],
})

export default function MLBTrendsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProtectedPage pathname="/mlb/trends">{children}</ProtectedPage>
}

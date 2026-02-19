import { ProtectedPage } from "@/components/protected-page"
import { generateSEO } from "@/lib/seo"

export const metadata = generateSEO({
  title: "NFL Streak Tracker - Passing, Rushing & Receiving Consistency | HeatCheck HQ",
  description: "Track NFL player streaks for passing yards, TDs, rushing yards, receptions, and more. Set custom thresholds and find the most consistent performers.",
  path: "/nfl/streaks",
  keywords: [
    "NFL streak tracker",
    "passing yards streaks",
    "rushing yards consistency",
    "receiving yards trends",
    "NFL player trends",
    "QB consistency",
  ],
})

export default function NFLStreaksLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProtectedPage pathname="/nfl/streaks">{children}</ProtectedPage>
}

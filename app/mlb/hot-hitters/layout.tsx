import { ProtectedPage } from "@/components/protected-page"
import { generateSEO } from "@/lib/seo"

export const metadata = generateSEO({
  title: "MLB Hot Hitters - Active Hitting Streaks | HeatCheck.io",
  description: "Track active MLB hitting streaks, extra-base hit runs, and home run surges across all players. Real-time streak data updated daily.",
  path: "/mlb/hot-hitters",
  keywords: [
    "MLB hot hitters",
    "hitting streaks",
    "home run streaks",
    "extra base hits",
    "MLB streaks",
    "player streaks",
  ],
})

export default function HotHittersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProtectedPage pathname="/mlb/hot-hitters">{children}</ProtectedPage>
}

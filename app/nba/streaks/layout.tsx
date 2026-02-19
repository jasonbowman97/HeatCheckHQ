import { generateSEO } from "@/lib/seo"
import { getUserTier } from "@/lib/get-user-tier"
import { UserTierProvider } from "@/components/user-tier-provider"

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

export default async function NBAStreaksLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const userTier = await getUserTier()

  return (
    <UserTierProvider tier={userTier}>
      {children}
    </UserTierProvider>
  )
}

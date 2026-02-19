import { generateSEO } from "@/lib/seo"
import { getUserTier } from "@/lib/get-user-tier"
import { UserTierProvider } from "@/components/user-tier-provider"

export const metadata = generateSEO({
  title: "NFL Defense vs Position - Matchup Advantages | HeatCheck HQ",
  description: "Find favorable NFL matchups based on team defensive rankings by position. See which defenses allow the most passing, rushing, and receiving stats to QBs, RBs, WRs, and TEs.",
  path: "/nfl/defense-vs-position",
  keywords: [
    "NFL defense vs position",
    "NFL DVP",
    "NFL matchups",
    "defensive rankings",
    "NFL player props",
    "favorable matchups",
  ],
})

export default async function NFLDefenseVsPositionLayout({
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

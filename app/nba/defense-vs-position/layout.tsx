import { generateSEO } from "@/lib/seo"
import { getUserTier } from "@/lib/get-user-tier"
import { UserTierProvider } from "@/components/user-tier-provider"

export const metadata = generateSEO({
  title: "NBA Defense vs Position - Matchup Advantages | HeatCheck HQ",
  description: "Find favorable and tough NBA matchups based on team defensive rankings by position. See which teams give up the most points, rebounds, and assists to each position.",
  path: "/nba/defense-vs-position",
  keywords: [
    "NBA defense vs position",
    "NBA matchups",
    "position defense",
    "defensive rankings",
    "NBA player props",
    "favorable matchups",
  ],
})

export default async function DefenseVsPositionLayout({
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

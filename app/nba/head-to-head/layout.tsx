import { generateSEO } from "@/lib/seo"
import { getUserTier } from "@/lib/get-user-tier"
import { UserTierProvider } from "@/components/user-tier-provider"

export const metadata = generateSEO({
  title: "NBA Head-to-Head Matchups - Team Analysis Dashboard | HeatCheck HQ",
  description: "Comprehensive NBA team head-to-head matchup analysis. Compare offensive and defensive stats, historical performance, injury reports, and momentum indicators.",
  path: "/nba/head-to-head",
  keywords: [
    "NBA head to head",
    "NBA matchups",
    "team comparison",
    "NBA defense rankings",
    "position defense",
    "NBA injuries",
    "team momentum",
  ],
})

export default async function HeadToHeadLayout({
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

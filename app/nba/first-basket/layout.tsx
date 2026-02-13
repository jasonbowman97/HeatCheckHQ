import { generateSEO } from "@/lib/seo"
import { getUserTier } from "@/lib/get-user-tier"
import { UserTierProvider } from "@/components/user-tier-provider"

export const metadata = generateSEO({
  title: "NBA First Basket Probabilities - Tip-Off Analytics | HeatCheck HQ",
  description: "NBA first basket probabilities and tip-off win rates by player. Analyze first shot percentages, basket conversion rates, and opening tip statistics for betting insights.",
  path: "/nba/first-basket",
  keywords: [
    "NBA first basket",
    "tip-off stats",
    "first basket probability",
    "NBA betting",
    "tip-off win rate",
    "first shot percentage",
    "NBA props",
  ],
})

export default async function FirstBasketLayout({
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

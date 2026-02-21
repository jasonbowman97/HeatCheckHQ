import { generateSEO } from "@/lib/seo"
import { getUserTier } from "@/lib/get-user-tier"
import { UserTierProvider } from "@/components/user-tier-provider"

export const metadata = generateSEO({
  title: "The HeatCheck - Tonight's Top Prop Picks | HeatCheck HQ",
  description:
    "AI-powered daily prop picks. Scans tonight's full game slate, projects player performance, and surfaces the highest-edge props with convergence validation.",
  path: "/heatcheck",
  keywords: [
    "sports prop picks today",
    "best prop bets tonight",
    "NBA prop picks",
    "MLB prop picks",
    "NFL prop picks",
    "daily prop analysis",
  ],
})

export default async function HeatCheckLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const userTier = await getUserTier()

  return <UserTierProvider tier={userTier}>{children}</UserTierProvider>
}

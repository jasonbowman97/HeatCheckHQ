import { generateSEO } from "@/lib/seo"

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

export default function FirstBasketLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

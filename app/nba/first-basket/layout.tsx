import { generateSEO, StructuredData, generateWebPageSchema, generateFAQSchema, generateDatasetSchema } from "@/lib/seo"
import { getUserTier } from "@/lib/get-user-tier"
import { UserTierProvider } from "@/components/user-tier-provider"

export const metadata = generateSEO({
  title: "NBA First Basket Picks Today - Tip-Off Probabilities & Rankings | HeatCheck HQ",
  description: "Today's NBA first basket picks with tip-off win rates, first shot percentages, and player rankings. Free first basket scorer predictions updated daily for every game.",
  path: "/nba/first-basket",
  keywords: [
    "NBA first basket picks today",
    "first basket scorer predictions",
    "who will score first NBA",
  ],
})

const faqData = [
  {
    question: "What is an NBA first basket bet?",
    answer: "A first basket bet is a prop bet where you predict which player will score the first points in an NBA game. This includes field goals, free throws, or any other scoring play that puts the first points on the board.",
  },
  {
    question: "How are first basket probabilities calculated?",
    answer: "First basket probabilities are calculated using season-long data including a player's first basket conversion rate, their team's tip-off win percentage, first shot attempt rate, and minutes played as a starter.",
  },
  {
    question: "What factors affect who scores the first basket?",
    answer: "Key factors include which team wins the opening tip-off, which player takes the first shot attempt for that team, the player's field goal percentage, and whether they are in the starting lineup.",
  },
  {
    question: "How often is the first basket data updated?",
    answer: "First basket statistics are updated daily with the latest season-long averages. Game schedules and matchup data refresh each morning for that day's NBA games.",
  },
]

const webPageSchema = generateWebPageSchema({
  name: "NBA First Basket Picks Today",
  description: "Today's NBA first basket picks with tip-off win rates, first shot percentages, and player rankings.",
  path: "/nba/first-basket",
  breadcrumbs: [
    { name: "Home", url: "/" },
    { name: "NBA", url: "/nba" },
    { name: "First Basket", url: "/nba/first-basket" },
  ],
})

const datasetSchema = generateDatasetSchema({
  name: "NBA First Basket Statistics",
  description: "Season-long NBA first basket scoring data including tip-off win rates, first shot percentages, and player conversion rates.",
  path: "/nba/first-basket",
  keywords: ["NBA first basket", "tip-off statistics", "first scorer data"],
})

export default async function FirstBasketLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const userTier = await getUserTier()

  return (
    <UserTierProvider tier={userTier}>
      <StructuredData data={generateFAQSchema(faqData)} />
      <StructuredData data={webPageSchema} />
      <StructuredData data={datasetSchema} />
      {children}
    </UserTierProvider>
  )
}

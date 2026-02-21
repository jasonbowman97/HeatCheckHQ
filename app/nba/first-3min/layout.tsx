import { generateSEO, StructuredData, generateWebPageSchema, generateFAQSchema, generateDatasetSchema } from "@/lib/seo"
import { getUserTier } from "@/lib/get-user-tier"
import { UserTierProvider } from "@/components/user-tier-provider"

export const metadata = generateSEO({
  title: "NBA First 3 Minutes Scoring Props - Early Game Scoring Data | HeatCheck HQ",
  description: "Track which NBA players score the most points in the first 3 minutes of every game. Hit rates, per-game breakdowns, and matchup context powered by ESPN play-by-play data.",
  path: "/nba/first-3min",
  keywords: [
    "NBA first 3 minutes scoring",
    "NBA early game scoring props",
    "NBA first quarter props",
    "NBA player points first 3 minutes",
    "NBA Q1 scoring data",
  ],
})

const faqData = [
  {
    question: "What is a first 3 minutes scoring prop?",
    answer: "A first 3 minutes scoring prop is a bet on how many points a player will score in the opening 3 minutes of Q1. This dashboard shows historical hit rates for each threshold (0.5, 1.5, 2.5, 3.5, 4.5 points) based on ESPN play-by-play data.",
  },
  {
    question: "How is the hit rate calculated?",
    answer: "Hit rate is the percentage of games where a player scored at or above the selected points threshold in the first 3 minutes of Q1. For example, a 75% hit rate at 1.5 points means the player scored 2 or more points in the first 3 minutes in 75% of their games.",
  },
  {
    question: "What do the game window filters mean?",
    answer: "Game windows let you filter by recency: L5 shows the last 5 games, L10 the last 10, L20 the last 20, and Season shows all games played this season. Recent windows help identify hot or cold trends.",
  },
  {
    question: "How often is this data updated?",
    answer: "Play-by-play data is ingested daily at 7 AM ET via ESPN's API. New games from the previous night are automatically added each morning.",
  },
]

const webPageSchema = generateWebPageSchema({
  name: "NBA First 3 Minutes Scoring Props",
  description: "Track which NBA players score the most points in the first 3 minutes of every game.",
  path: "/nba/first-3min",
  breadcrumbs: [
    { name: "Home", url: "/" },
    { name: "NBA", url: "/nba" },
    { name: "First 3 Minutes", url: "/nba/first-3min" },
  ],
})

const datasetSchema = generateDatasetSchema({
  name: "NBA First 3 Minutes Scoring Data",
  description: "Per-player scoring data from the first 3 minutes of Q1 in every NBA game, including hit rates at multiple thresholds.",
  path: "/nba/first-3min",
  keywords: ["NBA Q1 scoring", "first 3 minutes NBA", "early game scoring data"],
})

export default async function First3MinLayout({
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

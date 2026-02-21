import { generateSEO, StructuredData, generateWebPageSchema, generateFAQSchema, generateDatasetSchema } from "@/lib/seo"
import { getUserTier } from "@/lib/get-user-tier"
import { UserTierProvider } from "@/components/user-tier-provider"

export const metadata = generateSEO({
  title: "NBA Second Half Props - 2H First Basket & Team First FG | HeatCheck HQ",
  description: "Track which NBA players score the first basket of the second half and their team's first field goal after halftime. Per-game results, hit rates, and matchup context powered by ESPN play-by-play data.",
  path: "/nba/second-half",
  keywords: [
    "NBA second half first basket",
    "NBA 2H first basket props",
    "NBA second half scoring props",
    "NBA Q3 first basket",
    "NBA halftime first scorer",
    "NBA second half team first field goal",
  ],
})

const faqData = [
  {
    question: "What is a second half first basket bet?",
    answer: "A second half first basket bet is a prop where you predict which player will score the first points after halftime (start of Q3). This is similar to the game-opening first basket prop but applies to the second half tip-off.",
  },
  {
    question: "What is a second half team first field goal?",
    answer: "A second half team first field goal prop asks which player will score their team's first field goal after halftime. Each team has one player who scores first in Q3, so there are two first team FG scorers per game.",
  },
  {
    question: "How are second half hit rates calculated?",
    answer: "Hit rates show the percentage of games where a player scored their team's first basket or the game's first basket in Q3. For example, a 15% rate means the player scored first in 15% of their team's second halves.",
  },
  {
    question: "How often is this data updated?",
    answer: "Play-by-play data is ingested daily at 7 AM ET via ESPN's API. New games from the previous night are automatically added each morning.",
  },
]

const webPageSchema = generateWebPageSchema({
  name: "NBA Second Half Props - 2H First Basket & Team First FG",
  description: "Track which NBA players score the first basket of the second half and their team's first field goal after halftime.",
  path: "/nba/second-half",
  breadcrumbs: [
    { name: "Home", url: "/" },
    { name: "NBA", url: "/nba" },
    { name: "Second Half Props", url: "/nba/second-half" },
  ],
})

const datasetSchema = generateDatasetSchema({
  name: "NBA Second Half Scoring Data",
  description: "Per-player second half first basket and team first field goal data from every NBA game, with hit rates and game-by-game results.",
  path: "/nba/second-half",
  keywords: ["NBA second half props", "Q3 first basket", "2H first scorer data"],
})

export default async function SecondHalfLayout({
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

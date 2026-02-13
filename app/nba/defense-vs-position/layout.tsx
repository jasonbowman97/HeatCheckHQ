import { generateSEO, StructuredData, generateWebPageSchema, generateFAQSchema, generateDatasetSchema } from "@/lib/seo"
import { getUserTier } from "@/lib/get-user-tier"
import { UserTierProvider } from "@/components/user-tier-provider"

export const metadata = generateSEO({
  title: "NBA Defense vs Position Rankings Today - DVP Matchup Tool | HeatCheck HQ",
  description: "Today's NBA defense vs position rankings showing which teams allow the most points, rebounds, assists, and 3PM to each position. Free DVP matchup tool updated daily.",
  path: "/nba/defense-vs-position",
  keywords: [
    "NBA DVP rankings",
    "NBA DVP today",
    "NBA defense vs position rankings",
  ],
})

const faqData = [
  {
    question: "What does DVP mean in NBA betting?",
    answer: "DVP stands for Defense vs Position. It is a metric that measures how many stats (points, rebounds, assists, etc.) a team allows to players at each position (PG, SG, SF, PF, C). Teams that rank high in DVP for a position are considered weak defenders against that position, making opposing players attractive for player prop bets.",
  },
  {
    question: "How do I use NBA DVP rankings for player props?",
    answer: "Look for players whose position matches a team's defensive weakness. For example, if a team ranks #1 in points allowed to point guards, a PG facing that team is in a favorable matchup for a points over bet. Combine DVP rankings with the player's recent form and usage rate for the best results.",
  },
  {
    question: "How often are the DVP rankings updated?",
    answer: "DVP rankings are updated daily using full-season averages.",
  },
  {
    question: "What positions are tracked in defense vs position?",
    answer: "Five positions are tracked: Point Guard (PG), Shooting Guard (SG), Small Forward (SF), Power Forward (PF), and Center (C). For each position, stats tracked include points, rebounds, assists, 3-pointers made, steals, and blocks allowed per game.",
  },
]

const webPageSchema = generateWebPageSchema({
  name: "NBA Defense vs Position Rankings Today",
  description: "Today's NBA defense vs position rankings showing which teams allow the most stats to each position.",
  path: "/nba/defense-vs-position",
  breadcrumbs: [
    { name: "Home", url: "/" },
    { name: "NBA", url: "/nba" },
    { name: "Defense vs Position", url: "/nba/defense-vs-position" },
  ],
})

const datasetSchema = generateDatasetSchema({
  name: "NBA Defense vs Position Rankings",
  description: "NBA team defensive rankings by position including points, rebounds, assists, and 3-pointers allowed per game to PG, SG, SF, PF, and C.",
  path: "/nba/defense-vs-position",
  keywords: ["NBA DVP", "defense vs position", "NBA defensive rankings"],
})

export default async function DefenseVsPositionLayout({
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

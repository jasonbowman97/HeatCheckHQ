import { generateSEO, StructuredData, generateWebPageSchema, generateFAQSchema, generateDatasetSchema } from "@/lib/seo"
import { getUserTier } from "@/lib/get-user-tier"
import { UserTierProvider } from "@/components/user-tier-provider"

export const metadata = generateSEO({
  title: "NRFI Predictions Today - No Run First Inning Picks & Stats | HeatCheck HQ",
  description: "Today's NRFI predictions with pitcher matchups, first inning run probabilities, and streak data. Free NRFI picks updated daily for every MLB game.",
  path: "/mlb/nrfi",
  keywords: [
    "NRFI predictions today",
    "NRFI picks today",
    "best NRFI bets today",
  ],
})

const faqData = [
  {
    question: "What does NRFI mean in baseball betting?",
    answer: "NRFI stands for No Run First Inning. It is a popular baseball prop bet where you wager that neither team will score a run in the first inning of a game. The opposite bet, YRFI (Yes Run First Inning), means you predict at least one run will be scored in the first inning.",
  },
  {
    question: "What makes a good NRFI bet?",
    answer: "A good NRFI bet typically involves starting pitchers with low first-inning ERAs, teams with low first-inning scoring rates, long active NRFI streaks, and pitcher-friendly ballparks. The best NRFI matchups feature two dominant starters facing lineups that struggle to score early.",
  },
  {
    question: "How are NRFI probabilities calculated?",
    answer: "NRFI probabilities are calculated by combining multiple factors: each starting pitcher's first-inning ERA and WHIP, the opposing lineup's first-inning scoring rate, active NRFI/YRFI streaks for each team, and ballpark factors that affect run scoring.",
  },
  {
    question: "How often do NRFI bets win?",
    answer: "Approximately 55-60% of MLB games result in no runs scored in the first inning, making NRFI a slightly favorable outcome on average. However, the actual win rate varies significantly based on the specific pitcher matchup, teams involved, and ballpark.",
  },
]

const webPageSchema = generateWebPageSchema({
  name: "NRFI Predictions Today",
  description: "Today's NRFI predictions with pitcher matchups, first inning run probabilities, and streak data.",
  path: "/mlb/nrfi",
  breadcrumbs: [
    { name: "Home", url: "/" },
    { name: "MLB", url: "/mlb" },
    { name: "NRFI", url: "/mlb/nrfi" },
  ],
})

const datasetSchema = generateDatasetSchema({
  name: "MLB NRFI Predictions and Statistics",
  description: "Daily MLB NRFI predictions with pitcher first-inning ERA, team scoring rates, streak data, and probability estimates for every game.",
  path: "/mlb/nrfi",
  keywords: ["NRFI", "no run first inning", "MLB first inning stats"],
})

export default async function NRFILayout({
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

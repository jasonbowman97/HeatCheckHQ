import { generateSEO, StructuredData, generateWebPageSchema, generateDatasetSchema } from "@/lib/seo"
import { getUserTier } from "@/lib/get-user-tier"
import { UserTierProvider } from "@/components/user-tier-provider"

export const metadata = generateSEO({
  title: "Due for a Homer - MLB Statcast Barrel Rate & xSLG | HeatCheck HQ",
  description:
    "Find MLB hitters due for more home runs based on Statcast barrel rate, exit velocity, and xSLG gap. Identify underperformers whose batted ball quality predicts more power.",
  path: "/mlb/due-for-hr",
  keywords: [
    "MLB due for home run",
    "statcast barrel rate leaders",
    "expected slugging xSLG",
    "exit velocity leaders",
    "MLB power hitters underperforming",
    "baseball savant barrel rate",
    "hard hit rate MLB",
    "xSLG gap baseball",
  ],
})

const webPageSchema = generateWebPageSchema({
  name: "Due for a Homer — MLB Statcast",
  description:
    "MLB hitters whose elite batted ball quality (barrel rate, exit velocity) predicts more home runs than they've hit. Powered by Statcast data.",
  path: "/mlb/due-for-hr",
  breadcrumbs: [
    { name: "Home", url: "/" },
    { name: "MLB", url: "/mlb" },
    { name: "Due for HR", url: "/mlb/due-for-hr" },
  ],
})

const datasetSchema = generateDatasetSchema({
  name: "MLB Statcast Barrel Rate & Expected Slugging Data",
  description:
    "Qualified MLB batters ranked by the gap between expected slugging (xSLG) and actual slugging, with barrel rate, hard hit percentage, and exit velocity metrics from Baseball Savant Statcast.",
  path: "/mlb/due-for-hr",
  keywords: ["statcast", "barrel rate", "xSLG", "exit velocity", "MLB hitters"],
})

export default async function DueForHRLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const userTier = await getUserTier()

  return (
    <UserTierProvider tier={userTier}>
      <StructuredData data={webPageSchema} />
      <StructuredData data={datasetSchema} />
      {children}
    </UserTierProvider>
  )
}

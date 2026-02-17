import { generateSEO } from "@/lib/seo"
import { getUserTier } from "@/lib/get-user-tier"
import { UserTierProvider } from "@/components/user-tier-provider"

export const metadata = generateSEO({
  title: "MLB Stadium Weather - Ballpark Conditions | HeatCheck HQ",
  description: "Daily ballpark weather conditions for every MLB game. Temperature, wind direction & speed, humidity, and altitude to help analyze over/under and home run potential.",
  path: "/mlb/weather",
  keywords: [
    "MLB weather",
    "ballpark weather",
    "stadium conditions",
    "MLB wind",
    "baseball weather",
    "over under weather",
    "home run weather",
  ],
})

export default async function WeatherLayout({
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

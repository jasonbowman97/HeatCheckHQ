import { generateSEO } from "@/lib/seo"

export const metadata = generateSEO({
  title: "MLB Stadium Weather - Ballpark Conditions | HeatCheck.io",
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

export default function WeatherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

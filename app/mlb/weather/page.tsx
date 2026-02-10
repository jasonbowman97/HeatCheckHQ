import { Metadata } from "next"
import { WeatherPageClient } from "./weather-client"

export const metadata: Metadata = {
  title: "MLB Stadium Weather Report | HeatCheck HQ",
  description:
    "Daily stadium weather impact report. See how park conditions, wind, temperature, and humidity affect runs, home runs, extra-base hits, and singles.",
}

export default function WeatherPage() {
  return <WeatherPageClient />
}

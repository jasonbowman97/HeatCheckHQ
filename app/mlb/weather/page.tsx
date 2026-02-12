import { Metadata } from "next"
import { WeatherPageClient } from "./weather-client"

export const metadata: Metadata = {
  title: "MLB Stadium Weather | HeatCheck HQ",
  description:
    "Daily ballpark weather conditions. Temperature, wind direction & speed, humidity, and altitude for every MLB game today.",
}

export default function WeatherPage() {
  return <WeatherPageClient />
}

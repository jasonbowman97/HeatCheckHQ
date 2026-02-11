import { NextResponse } from "next/server"
import { getSchedule } from "@/lib/mlb-api"
import { getAllGameWeather, isWeatherConfigured, getStadiumInfo } from "@/lib/weather-api"

export const revalidate = 1800 // 30 minutes

export async function GET() {
  try {
    const { games } = await getSchedule()

    // Collect home team abbreviations
    const homeTeams = games.map((g) => g.home.abbreviation)

    // Try live weather if configured, otherwise use MLB API weather
    const useOpenWeather = isWeatherConfigured()
    const liveWeather = useOpenWeather ? await getAllGameWeather(homeTeams) : {}

    const weatherGames = games.map((g) => {
      const live = liveWeather[g.home.abbreviation]
      const stadiumInfo = getStadiumInfo(g.home.abbreviation)

      return {
        gamePk: g.gamePk,
        matchup: `${g.away.abbreviation} @ ${g.home.abbreviation}`,
        venue: g.venue,
        gameTime: g.gameDate,
        indoor: stadiumInfo?.indoor ?? false,
        // Live weather takes priority, fallback to MLB API weather, then defaults
        temperature: live?.temperature ?? (g.weather ? Number(g.weather.temp) : 0),
        feelsLike: live?.feelsLike ?? 0,
        humidity: live?.humidity ?? 0,
        windSpeed: live?.windSpeed ?? 0,
        windDirection: live?.windDirection ?? "",
        condition: live?.condition ?? g.weather?.condition ?? (stadiumInfo?.indoor ? "Dome" : "Unknown"),
        windDisplay: g.weather?.wind ?? "",
        // Pitchers for NRFI context
        awayPitcher: g.away.probablePitcher?.fullName ?? "TBD",
        homePitcher: g.home.probablePitcher?.fullName ?? "TBD",
        source: live ? "openweather" : g.weather ? "mlb-api" : "none",
      }
    })

    return NextResponse.json({
      games: weatherGames,
      hasLiveWeather: useOpenWeather,
      date: new Date().toISOString().slice(0, 10),
    })
  } catch {
    return NextResponse.json({ games: [], hasLiveWeather: false }, { status: 200 })
  }
}

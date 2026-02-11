import { NextResponse } from "next/server"
import { getSchedule } from "@/lib/mlb-api"
import { getAllGameWeather, isWeatherConfigured, getStadiumInfo, getStadiumAltitude, isMLBSeason } from "@/lib/weather-api"

export const revalidate = 1800 // 30 minutes

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date") ?? undefined
    const { games } = await getSchedule(date)

    // Collect home team abbreviations
    const homeTeams = games.map((g) => g.home.abbreviation)

    // Only call OpenWeather during baseball season and if configured
    const useOpenWeather = isWeatherConfigured() && isMLBSeason()
    const liveWeather = useOpenWeather ? await getAllGameWeather(homeTeams) : {}

    const weatherGames = games.map((g) => {
      const live = liveWeather[g.home.abbreviation]
      const stadiumInfo = getStadiumInfo(g.home.abbreviation)
      const altitudeFt = getStadiumAltitude(g.home.abbreviation)

      return {
        gamePk: g.gamePk,
        gameDate: g.gameDate,
        status: g.status,
        away: g.away,
        home: g.home,
        venue: g.venue,
        indoor: stadiumInfo?.indoor ?? false,
        altitudeFt,
        // Live weather takes priority, fallback to MLB API weather, then defaults
        weather: live
          ? {
              condition: live.condition,
              temp: String(live.temperature),
              wind: `${live.windSpeed} mph, ${live.windDirection}`,
            }
          : g.weather,
        // Enriched data from OpenWeather (null if not available)
        liveHumidity: live?.humidity ?? null,
        liveFeelsLike: live?.feelsLike ?? null,
        weatherSource: live ? "openweather" : g.weather ? "mlb-api" : "none",
      }
    })

    return NextResponse.json({
      games: weatherGames,
      hasLiveWeather: useOpenWeather && Object.keys(liveWeather).length > 0,
      isOffseason: !isMLBSeason(),
      date: date ?? new Date().toISOString().slice(0, 10),
    })
  } catch {
    return NextResponse.json({ games: [], hasLiveWeather: false, isOffseason: !isMLBSeason() }, { status: 200 })
  }
}

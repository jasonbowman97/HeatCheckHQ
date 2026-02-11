/**
 * Weather API integration for game-day conditions.
 * Uses OpenWeather free tier (1000 calls/day) for live temperature, wind, humidity.
 * Falls back to ESPN scoreboard weather data when available.
 *
 * MLB stadiums: lat/lng coordinates for all 30 venues.
 */
import "server-only"

export interface LiveWeather {
  temperature: number
  feelsLike: number
  humidity: number
  windSpeed: number
  windDirection: string
  condition: string
  icon: string
}

// MLB stadium coordinates for weather lookups
const MLB_STADIUMS: Record<string, { lat: number; lng: number; name: string; indoor: boolean }> = {
  ARI: { lat: 33.4455, lng: -112.0667, name: "Chase Field", indoor: true },
  ATL: { lat: 33.8907, lng: -84.4677, name: "Truist Park", indoor: false },
  BAL: { lat: 39.2838, lng: -76.6216, name: "Camden Yards", indoor: false },
  BOS: { lat: 42.3467, lng: -71.0972, name: "Fenway Park", indoor: false },
  CHC: { lat: 41.9484, lng: -87.6553, name: "Wrigley Field", indoor: false },
  CWS: { lat: 41.8299, lng: -87.6338, name: "Guaranteed Rate", indoor: false },
  CIN: { lat: 39.0974, lng: -84.5065, name: "Great American", indoor: false },
  CLE: { lat: 41.4962, lng: -81.6852, name: "Progressive Field", indoor: false },
  COL: { lat: 39.7559, lng: -104.9942, name: "Coors Field", indoor: false },
  DET: { lat: 42.3390, lng: -83.0485, name: "Comerica Park", indoor: false },
  HOU: { lat: 29.7572, lng: -95.3555, name: "Minute Maid Park", indoor: true },
  KC: { lat: 39.0517, lng: -94.4803, name: "Kauffman Stadium", indoor: false },
  LAA: { lat: 33.8003, lng: -117.8827, name: "Angel Stadium", indoor: false },
  LAD: { lat: 34.0739, lng: -118.2400, name: "Dodger Stadium", indoor: false },
  MIA: { lat: 25.7781, lng: -80.2196, name: "loanDepot Park", indoor: true },
  MIL: { lat: 43.0280, lng: -87.9712, name: "American Family", indoor: true },
  MIN: { lat: 44.9818, lng: -93.2775, name: "Target Field", indoor: false },
  NYM: { lat: 40.7571, lng: -73.8458, name: "Citi Field", indoor: false },
  NYY: { lat: 40.8296, lng: -73.9262, name: "Yankee Stadium", indoor: false },
  OAK: { lat: 37.7516, lng: -122.2005, name: "Oakland Coliseum", indoor: false },
  PHI: { lat: 39.9061, lng: -75.1665, name: "Citizens Bank", indoor: false },
  PIT: { lat: 40.4469, lng: -80.0057, name: "PNC Park", indoor: false },
  SD: { lat: 32.7076, lng: -117.1570, name: "Petco Park", indoor: false },
  SF: { lat: 37.7786, lng: -122.3893, name: "Oracle Park", indoor: false },
  SEA: { lat: 47.5914, lng: -122.3325, name: "T-Mobile Park", indoor: true },
  STL: { lat: 38.6226, lng: -90.1928, name: "Busch Stadium", indoor: false },
  TB: { lat: 27.7682, lng: -82.6534, name: "Tropicana Field", indoor: true },
  TEX: { lat: 32.7512, lng: -97.0832, name: "Globe Life Field", indoor: true },
  TOR: { lat: 43.6414, lng: -79.3894, name: "Rogers Centre", indoor: true },
  WSH: { lat: 38.8730, lng: -77.0074, name: "Nationals Park", indoor: false },
}

/**
 * Fetch live weather for a stadium.
 * Uses OpenWeather API if OPENWEATHER_API_KEY is set, otherwise returns null.
 */
export async function getStadiumWeather(teamAbbr: string): Promise<LiveWeather | null> {
  const apiKey = process.env.OPENWEATHER_API_KEY
  if (!apiKey) return null

  const stadium = MLB_STADIUMS[teamAbbr]
  if (!stadium) return null
  if (stadium.indoor) {
    return { temperature: 72, feelsLike: 72, humidity: 45, windSpeed: 0, windDirection: "N/A", condition: "Dome", icon: "dome" }
  }

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${stadium.lat}&lon=${stadium.lng}&appid=${apiKey}&units=imperial`,
      { next: { revalidate: 1800 } } // 30 min cache
    )
    if (!res.ok) return null
    const data = await res.json()

    const windDeg = data.wind?.deg ?? 0
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
    const windDirection = directions[Math.round(windDeg / 45) % 8]

    return {
      temperature: Math.round(data.main?.temp ?? 0),
      feelsLike: Math.round(data.main?.feels_like ?? 0),
      humidity: data.main?.humidity ?? 0,
      windSpeed: Math.round(data.wind?.speed ?? 0),
      windDirection,
      condition: data.weather?.[0]?.main ?? "Unknown",
      icon: data.weather?.[0]?.icon ?? "",
    }
  } catch {
    return null
  }
}

/**
 * Fetch weather for all today's MLB games.
 */
export async function getAllGameWeather(homeTeams: string[]): Promise<Record<string, LiveWeather>> {
  const results: Record<string, LiveWeather> = {}

  // Batch fetch (up to 15 games max)
  const promises = homeTeams.map(async (team) => {
    const weather = await getStadiumWeather(team)
    if (weather) results[team] = weather
  })

  await Promise.all(promises)
  return results
}

/** Check if OpenWeather is configured */
export function isWeatherConfigured(): boolean {
  return !!process.env.OPENWEATHER_API_KEY
}

/** Get stadium info (for fallback when no API key) */
export function getStadiumInfo(teamAbbr: string) {
  return MLB_STADIUMS[teamAbbr] ?? null
}

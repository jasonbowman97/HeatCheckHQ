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

// MLB stadium coordinates, altitude (feet), and indoor flag for weather lookups
const MLB_STADIUMS: Record<string, { lat: number; lng: number; name: string; indoor: boolean; altitudeFt: number }> = {
  ARI: { lat: 33.4455, lng: -112.0667, name: "Chase Field", indoor: true, altitudeFt: 1082 },
  ATL: { lat: 33.8907, lng: -84.4677, name: "Truist Park", indoor: false, altitudeFt: 1050 },
  BAL: { lat: 39.2838, lng: -76.6216, name: "Camden Yards", indoor: false, altitudeFt: 30 },
  BOS: { lat: 42.3467, lng: -71.0972, name: "Fenway Park", indoor: false, altitudeFt: 20 },
  CHC: { lat: 41.9484, lng: -87.6553, name: "Wrigley Field", indoor: false, altitudeFt: 600 },
  CWS: { lat: 41.8299, lng: -87.6338, name: "Guaranteed Rate", indoor: false, altitudeFt: 595 },
  CIN: { lat: 39.0974, lng: -84.5065, name: "Great American", indoor: false, altitudeFt: 490 },
  CLE: { lat: 41.4962, lng: -81.6852, name: "Progressive Field", indoor: false, altitudeFt: 660 },
  COL: { lat: 39.7559, lng: -104.9942, name: "Coors Field", indoor: false, altitudeFt: 5200 },
  DET: { lat: 42.3390, lng: -83.0485, name: "Comerica Park", indoor: false, altitudeFt: 600 },
  HOU: { lat: 29.7572, lng: -95.3555, name: "Minute Maid Park", indoor: true, altitudeFt: 42 },
  KC: { lat: 39.0517, lng: -94.4803, name: "Kauffman Stadium", indoor: false, altitudeFt: 750 },
  LAA: { lat: 33.8003, lng: -117.8827, name: "Angel Stadium", indoor: false, altitudeFt: 160 },
  LAD: { lat: 34.0739, lng: -118.2400, name: "Dodger Stadium", indoor: false, altitudeFt: 515 },
  MIA: { lat: 25.7781, lng: -80.2196, name: "loanDepot Park", indoor: true, altitudeFt: 7 },
  MIL: { lat: 43.0280, lng: -87.9712, name: "American Family", indoor: true, altitudeFt: 600 },
  MIN: { lat: 44.9818, lng: -93.2775, name: "Target Field", indoor: false, altitudeFt: 815 },
  NYM: { lat: 40.7571, lng: -73.8458, name: "Citi Field", indoor: false, altitudeFt: 20 },
  NYY: { lat: 40.8296, lng: -73.9262, name: "Yankee Stadium", indoor: false, altitudeFt: 55 },
  OAK: { lat: 37.7516, lng: -122.2005, name: "Oakland Coliseum", indoor: false, altitudeFt: 5 },
  PHI: { lat: 39.9061, lng: -75.1665, name: "Citizens Bank", indoor: false, altitudeFt: 20 },
  PIT: { lat: 40.4469, lng: -80.0057, name: "PNC Park", indoor: false, altitudeFt: 730 },
  SD: { lat: 32.7076, lng: -117.1570, name: "Petco Park", indoor: false, altitudeFt: 15 },
  SF: { lat: 37.7786, lng: -122.3893, name: "Oracle Park", indoor: false, altitudeFt: 5 },
  SEA: { lat: 47.5914, lng: -122.3325, name: "T-Mobile Park", indoor: true, altitudeFt: 20 },
  STL: { lat: 38.6226, lng: -90.1928, name: "Busch Stadium", indoor: false, altitudeFt: 455 },
  TB: { lat: 27.7682, lng: -82.6534, name: "Tropicana Field", indoor: true, altitudeFt: 45 },
  TEX: { lat: 32.7512, lng: -97.0832, name: "Globe Life Field", indoor: true, altitudeFt: 545 },
  TOR: { lat: 43.6414, lng: -79.3894, name: "Rogers Centre", indoor: true, altitudeFt: 270 },
  WSH: { lat: 38.8730, lng: -77.0074, name: "Nationals Park", indoor: false, altitudeFt: 25 },
}

/** Check if we're in MLB season (March 20 - November 5) */
export function isMLBSeason(): boolean {
  const now = new Date()
  const month = now.getMonth() + 1 // 1-indexed
  const day = now.getDate()
  // Spring training starts mid-Feb, regular season late March - early Nov
  if (month >= 4 && month <= 10) return true
  if (month === 3 && day >= 20) return true
  if (month === 11 && day <= 5) return true
  return false
}

/**
 * Fetch live weather for a stadium.
 * Uses OpenWeather API if OPENWEATHER_API_KEY is set AND it's baseball season.
 * Returns null otherwise.
 */
export async function getStadiumWeather(teamAbbr: string): Promise<LiveWeather | null> {
  const apiKey = process.env.OPENWEATHER_API_KEY
  if (!apiKey) return null
  if (!isMLBSeason()) return null

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

/** Get altitude in feet for a team's stadium */
export function getStadiumAltitude(teamAbbr: string): number {
  return MLB_STADIUMS[teamAbbr]?.altitudeFt ?? 0
}

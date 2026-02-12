export interface GameWeather {
  venue: string
  matchup: string
  gameTime: string
  temp: number
  feelsLike: number | null
  windSpeed: number
  windDir: "Out" | "In" | "L-R" | "R-L" | "Calm"
  windDirRaw: string            // raw compass direction from API (N, NE, etc.)
  condition: "Sunny" | "Partly Cloudy" | "Cloudy" | "Overcast" | "Roof Closed" | "Drizzle"
  humidity: number
  altitudeFt: number
  indoor: boolean
  /** Wind blowing out at 10+ mph — a notable factor for fly balls */
  windWatch: boolean
}

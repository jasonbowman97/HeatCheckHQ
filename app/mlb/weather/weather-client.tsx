"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import useSWR from "swr"
import { ChevronLeft, ChevronRight, Calendar, Loader2, Wind } from "lucide-react"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { WeatherCards } from "@/components/mlb/weather-cards"
import type { GameWeather } from "@/lib/mlb-weather-data"

/* ---------- helpers: parse ESPN / OpenWeather wind strings ---------- */
function getWindDir(windStr: string): GameWeather["windDir"] {
  const lower = windStr.toLowerCase()
  if (lower.includes("out") || lower.includes("lf") || lower.includes("cf") || lower.includes("rf")) return "Out"
  if (lower.includes("in")) return "In"
  if (lower.includes("l to r") || lower.includes("left to right") || lower.includes("l-r")) return "L-R"
  if (lower.includes("r to l") || lower.includes("right to left") || lower.includes("r-l")) return "R-L"
  return "Calm"
}

function getWindSpeed(windStr: string): number {
  const match = windStr.match(/(\d+)\s*mph/i)
  return match ? Number.parseInt(match[1], 10) : 0
}

/** Extract raw compass direction from wind string (e.g. "8 mph, NW" -> "NW") */
function getWindDirRaw(windStr: string): string {
  const compassMatch = windStr.match(/\b(N|NE|NW|E|SE|S|SW|W|NNE|NNW|ENE|ESE|SSE|SSW|WNW|WSW)\b/i)
  return compassMatch ? compassMatch[1].toUpperCase() : ""
}

function getCondition(cond: string): GameWeather["condition"] {
  const lower = cond.toLowerCase()
  if (lower.includes("sunny") || lower.includes("clear")) return "Sunny"
  if (lower.includes("partly")) return "Partly Cloudy"
  if (lower.includes("overcast")) return "Overcast"
  if (lower.includes("cloud")) return "Cloudy"
  if (lower.includes("drizzle") || lower.includes("rain")) return "Drizzle"
  if (lower.includes("dome") || lower.includes("roof")) return "Roof Closed"
  return "Cloudy"
}

/* ---------- API game shape ---------- */
interface APIWeatherGame {
  gamePk: number
  gameDate: string
  status: string
  away: { id: number; name: string; abbreviation: string; probablePitcher: { id: number; fullName: string } | null }
  home: { id: number; name: string; abbreviation: string; probablePitcher: { id: number; fullName: string } | null }
  venue: string
  indoor: boolean
  altitudeFt: number
  weather: { condition: string; temp: string; wind: string } | null
  liveHumidity: number | null
  liveFeelsLike: number | null
  weatherSource: string
}

/* ---------- transform API data to card data ---------- */
function transformToGameWeather(games: APIWeatherGame[]): GameWeather[] {
  return games.map((g) => {
    const temp = g.weather ? Number.parseInt(g.weather.temp, 10) || 72 : 72
    const windStr = g.weather?.wind ?? ""
    const windSpeed = getWindSpeed(windStr)
    const windDir = getWindDir(windStr)
    const windDirRaw = getWindDirRaw(windStr)
    const condStr = g.weather?.condition ?? ""
    const isRoof = g.indoor || condStr.toLowerCase().includes("dome") || condStr.toLowerCase().includes("roof")
    const condition = isRoof && !g.weather ? "Roof Closed" : getCondition(condStr)
    const humidity = g.liveHumidity ?? 50
    const feelsLike = g.liveFeelsLike ?? null
    const altitudeFt = g.altitudeFt ?? 0
    const time = new Date(g.gameDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })

    return {
      venue: g.venue,
      matchup: `${g.away.abbreviation} @ ${g.home.abbreviation}`,
      gameTime: time,
      temp,
      feelsLike,
      windSpeed: isRoof ? 0 : windSpeed,
      windDir: isRoof ? "Calm" as const : windDir,
      windDirRaw: isRoof ? "" : windDirRaw,
      condition,
      humidity,
      altitudeFt,
      indoor: isRoof,
      windWatch: !isRoof && windDir === "Out" && windSpeed >= 10,
    }
  })
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

/* ============================================================
   Main Weather Page
   ============================================================ */
export function WeatherPageClient() {
  const [dateOffset, setDateOffset] = useState(0)

  // Date navigation
  const currentDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + dateOffset)
    return d
  }, [dateOffset])
  const dateParam = currentDate.toISOString().slice(0, 10)
  const dateLabel = currentDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })

  const { data, isLoading } = useSWR<{ games: APIWeatherGame[]; date: string; hasLiveWeather: boolean; isOffseason: boolean }>(
    `/api/mlb/weather?date=${dateParam}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 43200000 },
  )

  const liveGames = data?.games ?? []
  const weatherData: GameWeather[] = liveGames.length > 0
    ? transformToGameWeather(liveGames)
    : []

  const hasLiveWeather = data?.hasLiveWeather ?? false
  const isOffseason = data?.isOffseason ?? false
  const windWatchCount = weatherData.filter((g) => g.windWatch).length

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
              <Logo className="h-5 w-5" />
              <span className="text-sm font-bold tracking-tight">HeatCheck HQ</span>
            </Link>
            <span className="text-muted-foreground/40">|</span>
            <span className="text-xs font-medium text-primary">MLB</span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/mlb/hitting-stats" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary">
              Hitter vs Pitcher
            </Link>
            <Link href="/mlb/nrfi" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary">
              NRFI
            </Link>
            <Link href="/mlb/pitching-stats" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary">
              Pitching Stats
            </Link>
            <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-md">
              Weather
            </span>
            <Link href="/mlb/trends" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary">
              Trends
            </Link>
            <div className="hidden sm:block h-5 w-px bg-border mx-1" />
            <Link href="/nba/first-basket" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary">
              NBA
            </Link>
            <Link href="/nfl/matchup" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary">
              NFL
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-6 py-6 flex flex-col gap-6">
        {/* Title + badges */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground">
              Stadium Weather
            </h1>
            {liveGames.length > 0 && hasLiveWeather && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">
                Live Weather
              </span>
            )}
            {liveGames.length > 0 && !hasLiveWeather && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-md">
                MLB Data
              </span>
            )}
            {liveGames.length === 0 && !isLoading && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">
                {isOffseason ? "Offseason" : "No Games"}
              </span>
            )}
            {windWatchCount > 0 && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Wind className="h-3 w-3" />
                {windWatchCount} Wind Watch
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Temperature, wind direction, and conditions for today{"'"}s ballparks.
          </p>
        </div>

        {/* Date navigator */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center rounded-lg border border-border overflow-hidden bg-card">
            <button
              onClick={() => setDateOffset((d) => d - 1)}
              className="flex items-center justify-center h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              aria-label="Previous day"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2 px-3">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground min-w-[100px] text-center">
                {dateLabel}
              </span>
            </div>
            <button
              onClick={() => setDateOffset((d) => d + 1)}
              className="flex items-center justify-center h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              aria-label="Next day"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {dateOffset !== 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDateOffset(0)}
              className="text-xs text-muted-foreground hover:text-foreground h-9"
            >
              Today
            </Button>
          )}

          {/* Legend */}
          <div className="hidden sm:flex items-center gap-4 ml-auto">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-[10px] text-muted-foreground">Wind blowing out</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-red-400" />
              <span className="text-[10px] text-muted-foreground">Wind blowing in</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-amber-400 font-mono">{"90\u00B0+"}</span>
              <span className="text-[10px] text-muted-foreground">Hot game</span>
            </div>
          </div>
        </div>

        {/* Cards */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading weather data...</span>
          </div>
        ) : (
          <WeatherCards data={weatherData} />
        )}
      </main>
    </div>
  )
}

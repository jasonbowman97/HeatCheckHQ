"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import useSWR from "swr"
import { BarChart3, ChevronLeft, ChevronRight, Calendar, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { WeatherTable } from "@/components/mlb/weather-table"
import { stadiumWeatherData, type StadiumWeather } from "@/lib/mlb-weather-data"

/* ---------- park factors (simplified: venue keyword -> run multiplier) ---------- */
const PARK_FACTORS: Record<string, number> = {
  coors: 1.29, wrigley: 1.12, "great american": 1.10, "progressive": 1.05,
  "guaranteed rate": 1.04, nationals: 1.03, "american family": 1.02, kauffman: 1.01,
  "citizens bank": 1.06, fenway: 1.05, "yankee stadium": 1.04, "camden yards": 1.03,
  chase: 1.01, dodger: 0.98, busch: 0.97, "citi field": 0.95, petco: 0.94,
  "minute maid": 0.94, "globe life": 0.93, "t-mobile": 0.93, oracle: 0.92,
  oakland: 0.90, tropicana: 0.96, loanDepot: 0.97, "target field": 1.02,
  "angel stadium": 0.96, "pnc park": 0.97, "truist park": 1.01, "rogers centre": 1.02,
}

function getWindDir(windStr: string): StadiumWeather["windDir"] {
  const lower = windStr.toLowerCase()
  if (lower.includes("out") || lower.includes("lf") || lower.includes("cf") || lower.includes("rf")) return "Out"
  if (lower.includes("in")) return "In"
  if (lower.includes("l to r") || lower.includes("left to right")) return "L-R"
  if (lower.includes("r to l") || lower.includes("right to left")) return "R-L"
  return "Calm"
}

function getWindSpeed(windStr: string): number {
  const match = windStr.match(/(\d+)\s*mph/i)
  return match ? Number.parseInt(match[1], 10) : 0
}

function getCondition(cond: string): StadiumWeather["condition"] {
  const lower = cond.toLowerCase()
  if (lower.includes("sunny") || lower.includes("clear")) return "Sunny"
  if (lower.includes("partly")) return "Partly Cloudy"
  if (lower.includes("overcast")) return "Overcast"
  if (lower.includes("cloud")) return "Cloudy"
  if (lower.includes("drizzle") || lower.includes("rain")) return "Drizzle"
  if (lower.includes("dome") || lower.includes("roof")) return "Roof Closed"
  return "Cloudy"
}

function getParkFactor(venue: string): number {
  const lower = venue.toLowerCase()
  for (const [key, val] of Object.entries(PARK_FACTORS)) {
    if (lower.includes(key)) return val
  }
  return 1.0
}

function estimateImpacts(temp: number, windSpeed: number, windDir: StadiumWeather["windDir"], parkFactor: number, isRoof: boolean) {
  // Base impact from park factor
  const parkPct = Math.round((parkFactor - 1) * 100)

  // Temperature impact (each degree above 75 adds ~0.2% to runs)
  const tempBoost = isRoof ? 0 : Math.round((temp - 75) * 0.2)

  // Wind impact (out = boost, in = suppress)
  const windMult = windDir === "Out" ? 1 : windDir === "In" ? -1 : 0
  const windBoost = isRoof ? 0 : Math.round(windSpeed * 0.4 * windMult)

  const runsImpact = parkPct + tempBoost + windBoost
  const hrImpact = parkPct + Math.round(windBoost * 1.5) // wind affects HR more
  const xbhImpact = parkPct + Math.round(tempBoost * 0.5) + Math.round(windBoost * 0.3)
  const hitsImpact = Math.round(parkPct * 0.3) + Math.round(tempBoost * 0.2)

  return {
    runsImpact, runsRaw: runsImpact * 0.09,
    hrImpact, hrRaw: hrImpact * 0.022,
    xbhImpact, xbhRaw: xbhImpact * 0.036,
    hitsImpact, hitsRaw: hitsImpact * 0.11,
  }
}

interface APIGame {
  gamePk: number
  gameDate: string
  status: string
  away: { id: number; name: string; abbreviation: string; probablePitcher: { id: number; fullName: string } | null }
  home: { id: number; name: string; abbreviation: string; probablePitcher: { id: number; fullName: string } | null }
  venue: string
  weather: { condition: string; temp: string; wind: string } | null
}

function transformToWeatherData(games: APIGame[]): StadiumWeather[] {
  return games.map((g) => {
    const temp = g.weather ? Number.parseInt(g.weather.temp, 10) || 72 : 72
    const windStr = g.weather?.wind ?? ""
    const windSpeed = getWindSpeed(windStr)
    const windDir = getWindDir(windStr)
    const condStr = g.weather?.condition ?? ""
    const isRoof = !g.weather || condStr.toLowerCase().includes("dome") || condStr.toLowerCase().includes("roof")
    const condition = isRoof && !g.weather ? "Roof Closed" : getCondition(condStr)
    const parkFactor = getParkFactor(g.venue)
    const impacts = estimateImpacts(temp, windSpeed, windDir, parkFactor, isRoof)
    const time = new Date(g.gameDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })

    return {
      venue: g.venue,
      matchup: `${g.away.abbreviation} @ ${g.home.abbreviation}`,
      gameTime: time,
      temp,
      windSpeed,
      windDir: isRoof ? "Calm" as const : windDir,
      condition,
      humidity: 50, // MLB API doesn't provide humidity
      ...impacts,
    }
  })
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

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

  const { data, isLoading } = useSWR<{ games: APIGame[]; date: string }>(`/api/mlb/schedule?date=${dateParam}`, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 43200000, // 12 hours
  })

  // Transform live data or fall back to static
  const liveGames = data?.games ?? []
  const weatherData: StadiumWeather[] = liveGames.length > 0
    ? transformToWeatherData(liveGames)
    : stadiumWeatherData

  const isLive = liveGames.length > 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
              <BarChart3 className="h-5 w-5 text-primary" />
              <span className="text-sm font-bold tracking-tight">HeatCheck HQ</span>
            </Link>
            <span className="text-muted-foreground/40">|</span>
            <span className="text-xs font-medium text-primary">MLB</span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/mlb/hitting-stats" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary">
              Hitting Stats
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
        {/* Title */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground text-balance">
              Daily Stadium Weather Report
            </h1>
            {isLive && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">
                Live
              </span>
            )}
            {!isLive && !isLoading && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">
                No games scheduled
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            How park conditions, wind, and temperature impact today{"'"}s games.
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
              <span className="text-[10px] text-muted-foreground">Boosts scoring</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-red-400" />
              <span className="text-[10px] text-muted-foreground">Suppresses scoring</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-amber-400 font-mono">{"90\u00B0+"}</span>
              <span className="text-[10px] text-muted-foreground">Hot game</span>
            </div>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading live weather data...</span>
          </div>
        ) : (
          <WeatherTable data={weatherData} />
        )}
      </main>
    </div>
  )
}

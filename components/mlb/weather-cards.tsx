"use client"

import { Sun, Cloud, CloudSun, CloudDrizzle, Home, Wind, Thermometer, Mountain, Droplets } from "lucide-react"
import type { GameWeather } from "@/lib/mlb-weather-data"

/* ---------- condition icon ---------- */
function ConditionIcon({ condition }: { condition: GameWeather["condition"] }) {
  switch (condition) {
    case "Sunny":
      return <Sun className="h-7 w-7 text-amber-400" />
    case "Partly Cloudy":
      return <CloudSun className="h-7 w-7 text-amber-300" />
    case "Cloudy":
      return <Cloud className="h-7 w-7 text-muted-foreground" />
    case "Overcast":
      return <Cloud className="h-7 w-7 text-muted-foreground/60" />
    case "Roof Closed":
      return <Home className="h-7 w-7 text-muted-foreground/60" />
    case "Drizzle":
      return <CloudDrizzle className="h-7 w-7 text-blue-400" />
  }
}

/* ---------- wind direction arrow + color ---------- */
function WindDisplay({ dir, speed, dirRaw }: { dir: GameWeather["windDir"]; speed: number; dirRaw: string }) {
  if (dir === "Calm" || speed === 0) {
    return (
      <div className="flex items-center gap-2">
        <Wind className="h-4 w-4 text-muted-foreground/40" />
        <span className="text-sm text-muted-foreground/60">Calm</span>
      </div>
    )
  }

  const arrow = dir === "Out" ? "\u2197" : dir === "In" ? "\u2199" : dir === "L-R" ? "\u2192" : "\u2190"
  const color = dir === "Out" ? "text-emerald-400" : dir === "In" ? "text-red-400" : "text-muted-foreground"
  const label = dir === "Out" ? "Blowing Out" : dir === "In" ? "Blowing In" : dir === "L-R" ? "Left to Right" : "Right to Left"

  return (
    <div className="flex items-center gap-2">
      <Wind className={`h-4 w-4 ${color}`} />
      <div className="flex flex-col">
        <span className={`text-sm font-semibold font-mono tabular-nums ${color}`}>
          {arrow} {speed} mph
        </span>
        <span className="text-[10px] text-muted-foreground/60">{label} ({dirRaw})</span>
      </div>
    </div>
  )
}

/* ---------- main card grid ---------- */
export function WeatherCards({ data }: { data: GameWeather[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-muted-foreground">No games scheduled for this date.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.map((game) => (
        <div
          key={game.venue}
          className={`relative rounded-xl border bg-card overflow-hidden transition-colors ${
            game.windWatch
              ? "border-emerald-500/30 shadow-[0_0_12px_-4px_rgba(16,185,129,0.15)]"
              : "border-border"
          }`}
        >
          {/* Wind Watch flag */}
          {game.windWatch && (
            <div className="absolute top-0 right-0">
              <div className="bg-emerald-500/15 text-emerald-400 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-bl-lg">
                Wind Watch
              </div>
            </div>
          )}

          {/* Header: matchup + venue + time */}
          <div className="px-4 pt-4 pb-3 border-b border-border/50">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-base font-bold text-foreground">{game.matchup}</span>
                <span className="text-xs text-muted-foreground">{game.venue}</span>
              </div>
              <span className="text-[11px] text-muted-foreground/60 font-medium mt-0.5">{game.gameTime}</span>
            </div>
          </div>

          {/* Body: weather data */}
          <div className="px-4 py-4 flex flex-col gap-3">
            {/* Row 1: condition icon + temp */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ConditionIcon condition={game.condition} />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">{game.condition}</span>
                  {game.indoor && (
                    <span className="text-[10px] text-muted-foreground/50">Retractable Roof</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Thermometer className={`h-4 w-4 ${game.temp >= 90 ? "text-amber-400" : game.temp <= 50 ? "text-blue-400" : "text-muted-foreground/60"}`} />
                <div className="flex flex-col items-end">
                  <span className={`text-2xl font-bold font-mono tabular-nums leading-none ${
                    game.temp >= 90 ? "text-amber-400" : game.temp <= 50 ? "text-blue-400" : "text-foreground"
                  }`}>
                    {game.temp}&deg;
                  </span>
                  {game.feelsLike !== null && game.feelsLike !== game.temp && !game.indoor && (
                    <span className="text-[10px] text-muted-foreground/50 mt-0.5">
                      Feels {game.feelsLike}&deg;
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Row 2: wind */}
            <WindDisplay dir={game.windDir} speed={game.windSpeed} dirRaw={game.windDirRaw} />

            {/* Row 3: humidity + altitude badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {!game.indoor && (
                <div className="flex items-center gap-1.5 rounded-md bg-secondary/50 px-2 py-1">
                  <Droplets className="h-3 w-3 text-blue-400/60" />
                  <span className="text-[11px] text-muted-foreground">{game.humidity}% humidity</span>
                </div>
              )}
              {game.altitudeFt >= 1000 && (
                <div className="flex items-center gap-1.5 rounded-md bg-secondary/50 px-2 py-1">
                  <Mountain className="h-3 w-3 text-orange-400/60" />
                  <span className="text-[11px] text-muted-foreground">{game.altitudeFt.toLocaleString()} ft elevation</span>
                </div>
              )}
              {game.indoor && (
                <div className="flex items-center gap-1.5 rounded-md bg-secondary/50 px-2 py-1">
                  <Home className="h-3 w-3 text-muted-foreground/60" />
                  <span className="text-[11px] text-muted-foreground">Climate controlled</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

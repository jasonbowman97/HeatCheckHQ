// ============================================================
// components/situation-room/weather-panel.tsx — MLB weather cards
// ============================================================
// Displays weather conditions for today's MLB games with
// impact assessment and affected stat categories.

"use client"

import {
  CloudRain, Cloud, Sun, Wind, Thermometer, Droplets,
  AlertTriangle, Check
} from "lucide-react"
import type { WeatherAlert } from "@/types/innovation-playbook"

interface WeatherPanelProps {
  alerts: WeatherAlert[]
}

export function WeatherPanel({ alerts }: WeatherPanelProps) {
  if (alerts.length === 0) {
    return null
  }

  const highImpact = alerts.filter(a => a.impactLevel === 'high')
  const mediumImpact = alerts.filter(a => a.impactLevel === 'medium')
  const lowImpact = alerts.filter(a => a.impactLevel === 'low')

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border bg-muted/30 flex items-center justify-between">
        <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <CloudRain className="h-3.5 w-3.5 text-blue-400" />
          Weather Impact
        </p>
        <div className="flex items-center gap-2 text-[10px]">
          {highImpact.length > 0 && (
            <span className="text-red-400 font-semibold">{highImpact.length} High</span>
          )}
          {mediumImpact.length > 0 && (
            <span className="text-amber-400 font-semibold">{mediumImpact.length} Med</span>
          )}
          {lowImpact.length > 0 && (
            <span className="text-emerald-400 font-semibold">{lowImpact.length} Low</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
        {alerts.map((alert) => (
          <WeatherCard key={alert.gameId} alert={alert} />
        ))}
      </div>
    </div>
  )
}

function WeatherCard({ alert }: { alert: WeatherAlert }) {
  const WeatherIcon = getWeatherIcon(alert.condition)
  const impactStyles = {
    high: 'border-l-red-400',
    medium: 'border-l-amber-400',
    low: 'border-l-emerald-400',
  }

  return (
    <div className={`bg-card p-3 border-l-2 ${impactStyles[alert.impactLevel]}`}>
      {/* Venue + Condition */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">{alert.venue}</p>
          <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
            <WeatherIcon className="h-3 w-3" />
            {alert.condition}
          </p>
        </div>
        <ImpactBadge level={alert.impactLevel} />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-2">
        <span className="flex items-center gap-0.5">
          <Thermometer className="h-3 w-3" />
          {Math.round(alert.temp)}&deg;F
        </span>
        <span className="flex items-center gap-0.5">
          <Wind className="h-3 w-3" />
          {Math.round(alert.wind)} mph {alert.windDirection}
        </span>
      </div>

      {/* Affected stats */}
      <div className="flex flex-wrap gap-1">
        {alert.affectedStats.map((stat, i) => (
          <span
            key={i}
            className={`text-[10px] px-1.5 py-0.5 rounded ${
              alert.impactLevel === 'high'
                ? 'bg-red-500/10 text-red-400'
                : alert.impactLevel === 'medium'
                ? 'bg-amber-500/10 text-amber-400'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {stat}
          </span>
        ))}
      </div>
    </div>
  )
}

function ImpactBadge({ level }: { level: WeatherAlert['impactLevel'] }) {
  const styles = {
    high: 'bg-red-500/15 text-red-400 ring-red-500/30',
    medium: 'bg-amber-500/15 text-amber-400 ring-amber-500/30',
    low: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30',
  }

  const icons = {
    high: <AlertTriangle className="h-2.5 w-2.5" />,
    medium: <Wind className="h-2.5 w-2.5" />,
    low: <Check className="h-2.5 w-2.5" />,
  }

  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ring-1 flex items-center gap-0.5 flex-shrink-0 ${styles[level]}`}>
      {icons[level]}
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </span>
  )
}

function getWeatherIcon(condition: string) {
  const c = condition.toLowerCase()
  if (c.includes('rain') || c.includes('storm') || c.includes('shower')) return CloudRain
  if (c.includes('cloud') || c.includes('overcast')) return Cloud
  if (c.includes('clear') || c.includes('sunny')) return Sun
  if (c.includes('wind')) return Wind
  return Cloud
}

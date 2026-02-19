// ============================================================
// components/situation-room/alert-feed.tsx — Live alert ticker
// ============================================================
// Displays a vertical feed of real-time alerts: injury updates,
// line movements, weather changes, convergence shifts.
// Connects to the SSE endpoint for live updates.

"use client"

import { useState, useEffect, useCallback } from "react"
import {
  AlertTriangle, TrendingUp, TrendingDown,
  CloudRain, Activity, Zap, Bell
} from "lucide-react"
import type { PropAlert } from "@/types/innovation-playbook"
import type { Sport } from "@/types/shared"

interface AlertFeedProps {
  initialAlerts: PropAlert[]
  sport: Sport
}

export function AlertFeed({ initialAlerts, sport }: AlertFeedProps) {
  const [alerts, setAlerts] = useState<PropAlert[]>(initialAlerts)

  // Connect to SSE endpoint for live updates
  useEffect(() => {
    let eventSource: EventSource | null = null

    try {
      eventSource = new EventSource(`/api/situation-room/alerts?sport=${sport}`)

      eventSource.addEventListener('alerts', (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.alerts?.length > 0) {
            setAlerts(prev => [...data.alerts, ...prev].slice(0, 50))
          }
        } catch {
          // Invalid JSON — ignore
        }
      })

      eventSource.onerror = () => {
        // Auto-reconnect is handled by EventSource spec
      }
    } catch {
      // SSE not supported — fall back to polling or static
    }

    return () => {
      eventSource?.close()
    }
  }, [sport])

  if (alerts.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <Bell className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No alerts yet</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Live alerts will appear here as games approach
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border bg-muted/30">
        <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-primary" />
          Live Alert Feed
          <span className="ml-auto text-muted-foreground font-normal">{alerts.length}</span>
        </p>
      </div>

      <div className="max-h-[400px] overflow-y-auto divide-y divide-border">
        {alerts.map((alert) => (
          <AlertItem key={alert.id} alert={alert} />
        ))}
      </div>
    </div>
  )
}

function AlertItem({ alert }: { alert: PropAlert }) {
  const { icon, iconColor, bgColor } = getAlertStyle(alert)

  return (
    <div className={`px-4 py-3 flex gap-3 ${bgColor}`}>
      <div className={`flex-shrink-0 mt-0.5 ${iconColor}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-foreground leading-snug">
            {alert.headline}
          </p>
          <SeverityBadge severity={alert.severity} />
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
          {alert.detail}
        </p>
        <p className="text-[10px] text-muted-foreground/60 mt-1">
          {formatAlertTime(alert.timestamp)}
        </p>
      </div>
    </div>
  )
}

function SeverityBadge({ severity }: { severity: PropAlert['severity'] }) {
  const styles = {
    high: 'bg-red-500/15 text-red-400 ring-red-500/30',
    medium: 'bg-amber-500/15 text-amber-400 ring-amber-500/30',
    low: 'bg-blue-500/15 text-blue-400 ring-blue-500/30',
  }

  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ring-1 flex-shrink-0 ${styles[severity]}`}>
      {severity.toUpperCase()}
    </span>
  )
}

function getAlertStyle(alert: PropAlert) {
  switch (alert.type) {
    case 'injury':
      return {
        icon: <AlertTriangle className="h-4 w-4" />,
        iconColor: 'text-red-400',
        bgColor: 'bg-red-500/[0.03]',
      }
    case 'line_movement':
      return {
        icon: <TrendingDown className="h-4 w-4" />,
        iconColor: 'text-amber-400',
        bgColor: '',
      }
    case 'weather':
      return {
        icon: <CloudRain className="h-4 w-4" />,
        iconColor: 'text-blue-400',
        bgColor: 'bg-blue-500/[0.03]',
      }
    case 'convergence_shift':
      return {
        icon: <Zap className="h-4 w-4" />,
        iconColor: 'text-emerald-400',
        bgColor: 'bg-emerald-500/[0.03]',
      }
    default:
      return {
        icon: <Bell className="h-4 w-4" />,
        iconColor: 'text-muted-foreground',
        bgColor: '',
      }
  }
}

function formatAlertTime(timestamp: string): string {
  try {
    const d = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const mins = Math.floor(diff / 60000)

    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

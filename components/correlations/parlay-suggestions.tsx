// ============================================================
// components/correlations/parlay-suggestions.tsx — Stack/fade cards
// ============================================================
// Shows actionable parlay insights based on correlation analysis.

"use client"

import { TrendingUp, TrendingDown, AlertTriangle, Layers } from "lucide-react"
import type { ParlayInsight } from "@/types/innovation-playbook"

interface ParlaySuggestionsProps {
  insights: ParlayInsight[]
}

export function ParlaySuggestions({ insights }: ParlaySuggestionsProps) {
  if (insights.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <Layers className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No parlay insights yet</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Strong correlations are needed to generate stacking and fading recommendations
        </p>
      </div>
    )
  }

  const stacks = insights.filter(i => i.type === 'stack')
  const fades = insights.filter(i => i.type === 'fade')
  const contrarian = insights.filter(i => i.type === 'contrarian')

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border bg-muted/30">
        <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5 text-primary" />
          Parlay Insights
          <span className="ml-auto text-muted-foreground font-normal">{insights.length}</span>
        </p>
      </div>

      <div className="divide-y divide-border">
        {stacks.map((insight, i) => (
          <InsightCard key={`stack-${i}`} insight={insight} />
        ))}
        {fades.map((insight, i) => (
          <InsightCard key={`fade-${i}`} insight={insight} />
        ))}
        {contrarian.map((insight, i) => (
          <InsightCard key={`contrarian-${i}`} insight={insight} />
        ))}
      </div>
    </div>
  )
}

function InsightCard({ insight }: { insight: ParlayInsight }) {
  const config = {
    stack: {
      icon: <TrendingUp className="h-4 w-4" />,
      iconColor: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30',
      label: 'STACK',
    },
    fade: {
      icon: <TrendingDown className="h-4 w-4" />,
      iconColor: 'text-red-400',
      badgeBg: 'bg-red-500/15 text-red-400 ring-red-500/30',
      label: 'FADE',
    },
    contrarian: {
      icon: <AlertTriangle className="h-4 w-4" />,
      iconColor: 'text-amber-400',
      badgeBg: 'bg-amber-500/15 text-amber-400 ring-amber-500/30',
      label: 'CONTRARIAN',
    },
  }[insight.type]

  const corrStrength = Math.abs(insight.correlation)
  const strengthLabel = corrStrength >= 0.7 ? 'Strong' :
    corrStrength >= 0.4 ? 'Moderate' : 'Weak'

  return (
    <div className="px-4 py-3 flex gap-3">
      <div className={`flex-shrink-0 mt-0.5 ${config.iconColor}`}>
        {config.icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-foreground">
              {insight.players.join(' + ')}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {insight.explanation}
            </p>
          </div>

          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ring-1 flex-shrink-0 ${config.badgeBg}`}>
            {config.label}
          </span>
        </div>

        <div className="flex items-center gap-3 mt-2 text-[10px]">
          <span className="text-muted-foreground">
            Correlation: <span className="font-bold text-foreground">{insight.correlation.toFixed(2)}</span>
          </span>
          <span className="text-muted-foreground">
            Strength: <span className="font-bold text-foreground">{strengthLabel}</span>
          </span>
          {insight.historicalHitRate > 0 && (
            <span className="text-muted-foreground">
              Hit Rate: <span className="font-bold text-emerald-400">{(insight.historicalHitRate * 100).toFixed(0)}%</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// components/what-if/scenario-controls.tsx — Modification sliders & toggles
// ============================================================
// UI for modifying convergence inputs: line, venue, rest, B2B.

"use client"

import { useState } from "react"
import { Sliders, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { WhatIfModification } from "@/types/innovation-playbook"

interface ScenarioControlsProps {
  originalLine: number
  onModificationsChange: (mods: WhatIfModification[]) => void
}

export function ScenarioControls({ originalLine, onModificationsChange }: ScenarioControlsProps) {
  const [line, setLine] = useState(originalLine)
  const [venue, setVenue] = useState<'home' | 'away' | null>(null)
  const [b2b, setB2b] = useState<boolean | null>(null)
  const [restDays, setRestDays] = useState<number | null>(null)

  const buildModifications = (): WhatIfModification[] => {
    const mods: WhatIfModification[] = []
    if (line !== originalLine) {
      mods.push({ type: 'change_line', label: `Line: ${originalLine} → ${line}`, value: line })
    }
    if (venue !== null) {
      mods.push({ type: 'change_venue', label: `Venue: ${venue}`, value: venue })
    }
    if (b2b !== null) {
      mods.push({ type: 'toggle_b2b', label: `B2B: ${b2b ? 'Yes' : 'No'}`, value: b2b })
    }
    if (restDays !== null) {
      mods.push({ type: 'change_rest_days', label: `Rest: ${restDays} days`, value: restDays })
    }
    return mods
  }

  const handleApply = () => {
    onModificationsChange(buildModifications())
  }

  const handleReset = () => {
    setLine(originalLine)
    setVenue(null)
    setB2b(null)
    setRestDays(null)
    onModificationsChange([])
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border bg-muted/30 flex items-center justify-between">
        <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Sliders className="h-3.5 w-3.5 text-primary" />
          Scenario Controls
        </p>
        <Button variant="ghost" size="sm" className="text-xs gap-1 h-6" onClick={handleReset}>
          <RotateCcw className="h-3 w-3" />
          Reset
        </Button>
      </div>

      <div className="p-4 space-y-4">
        {/* Line adjustment */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Prop Line: {line} {line !== originalLine && <span className="text-primary">(was {originalLine})</span>}
          </label>
          <input
            type="range"
            min={Math.max(0, originalLine - 10)}
            max={originalLine + 10}
            step={0.5}
            value={line}
            onChange={e => setLine(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{Math.max(0, originalLine - 10)}</span>
            <span>{originalLine + 10}</span>
          </div>
        </div>

        {/* Venue toggle */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Venue</label>
          <div className="flex gap-2">
            {(['home', 'away'] as const).map(v => (
              <button
                key={v}
                onClick={() => setVenue(venue === v ? null : v)}
                className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                  venue === v ? 'border-primary bg-primary/5 text-foreground' : 'border-border text-muted-foreground hover:border-muted-foreground/30'
                }`}
              >
                {v === 'home' ? 'Home' : 'Away'}
              </button>
            ))}
          </div>
        </div>

        {/* Back-to-back toggle */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Back-to-Back</label>
          <div className="flex gap-2">
            {[true, false].map(val => (
              <button
                key={String(val)}
                onClick={() => setB2b(b2b === val ? null : val)}
                className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                  b2b === val ? 'border-primary bg-primary/5 text-foreground' : 'border-border text-muted-foreground hover:border-muted-foreground/30'
                }`}
              >
                {val ? 'Yes' : 'No'}
              </button>
            ))}
          </div>
        </div>

        {/* Rest days */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Rest Days: {restDays ?? 'Default'}
          </label>
          <div className="flex gap-1.5">
            {[0, 1, 2, 3, 4].map(d => (
              <button
                key={d}
                onClick={() => setRestDays(restDays === d ? null : d)}
                className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
                  restDays === d ? 'border-primary bg-primary/5 text-foreground' : 'border-border text-muted-foreground hover:border-muted-foreground/30'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Apply button */}
        <Button size="sm" className="w-full gap-1 text-xs" onClick={handleApply}>
          Simulate Changes
        </Button>
      </div>
    </div>
  )
}

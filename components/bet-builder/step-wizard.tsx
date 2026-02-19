// ============================================================
// components/bet-builder/step-wizard.tsx — 4-step guided flow
// ============================================================
// Step 1: Pick sport → Step 2: Choose confidence →
// Step 3: Select props → Step 4: Parlay summary

"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronRight, ChevronLeft, Zap, Check, Loader2, DollarSign, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { calculateParlayPayout, suggestParlayGroups } from "@/lib/bet-builder-service"
import type { BetBuilderProp, BetBuilderState } from "@/types/innovation-playbook"
import type { Sport } from "@/types/shared"

const STEPS = [
  { step: 1 as const, label: "Sport", description: "Pick a sport" },
  { step: 2 as const, label: "Confidence", description: "Set your confidence filter" },
  { step: 3 as const, label: "Props", description: "Select your picks" },
  { step: 4 as const, label: "Summary", description: "Review your parlay" },
]

export function StepWizard() {
  const [state, setState] = useState<BetBuilderState>({
    currentStep: 1,
    selectedProps: [],
  })
  const [availableProps, setAvailableProps] = useState<BetBuilderProp[]>([])
  const [loading, setLoading] = useState(false)

  const fetchProps = useCallback(async () => {
    if (!state.sport || !state.confidence) return
    setLoading(true)
    try {
      const res = await fetch(`/api/bet-builder?sport=${state.sport}&confidence=${state.confidence}`)
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setAvailableProps(data.props ?? [])
    } catch {
      setAvailableProps([])
    } finally {
      setLoading(false)
    }
  }, [state.sport, state.confidence])

  useEffect(() => {
    if (state.currentStep === 3) fetchProps()
  }, [state.currentStep, fetchProps])

  const goNext = () => setState(s => ({ ...s, currentStep: Math.min(4, s.currentStep + 1) as any }))
  const goBack = () => setState(s => ({ ...s, currentStep: Math.max(1, s.currentStep - 1) as any }))

  const toggleProp = (prop: BetBuilderProp) => {
    setState(s => {
      const exists = s.selectedProps.some(
        p => p.playerId === prop.playerId && p.stat === prop.stat
      )
      return {
        ...s,
        selectedProps: exists
          ? s.selectedProps.filter(p => !(p.playerId === prop.playerId && p.stat === prop.stat))
          : [...s.selectedProps, prop],
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => (
          <div key={s.step} className="flex items-center gap-1 flex-1">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              state.currentStep === s.step ? 'bg-primary text-primary-foreground' :
              state.currentStep > s.step ? 'bg-emerald-500/15 text-emerald-400' :
              'bg-muted text-muted-foreground'
            }`}>
              {state.currentStep > s.step ? (
                <Check className="h-3 w-3" />
              ) : (
                <span>{s.step}</span>
              )}
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <ChevronRight className="h-3 w-3 text-muted-foreground/40 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {state.currentStep === 1 && (
          <Step1Sport
            selected={state.sport}
            onSelect={sport => setState(s => ({ ...s, sport }))}
          />
        )}
        {state.currentStep === 2 && (
          <Step2Confidence
            selected={state.confidence}
            onSelect={confidence => setState(s => ({ ...s, confidence }))}
          />
        )}
        {state.currentStep === 3 && (
          <Step3Props
            props={availableProps}
            selected={state.selectedProps}
            loading={loading}
            onToggle={toggleProp}
          />
        )}
        {state.currentStep === 4 && (
          <Step4Summary props={state.selectedProps} />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          className="gap-1 text-xs"
          onClick={goBack}
          disabled={state.currentStep === 1}
        >
          <ChevronLeft className="h-3 w-3" />
          Back
        </Button>

        {state.currentStep < 4 ? (
          <Button
            size="sm"
            className="gap-1 text-xs"
            onClick={goNext}
            disabled={
              (state.currentStep === 1 && !state.sport) ||
              (state.currentStep === 2 && !state.confidence) ||
              (state.currentStep === 3 && state.selectedProps.length === 0)
            }
          >
            Next
            <ChevronRight className="h-3 w-3" />
          </Button>
        ) : (
          <Button size="sm" className="gap-1 text-xs" onClick={() => setState({ currentStep: 1, selectedProps: [] })}>
            Start Over
          </Button>
        )}
      </div>
    </div>
  )
}

// ── Step Components ──

function Step1Sport({ selected, onSelect }: { selected?: Sport; onSelect: (s: Sport) => void }) {
  const sports: { value: Sport; label: string; desc: string }[] = [
    { value: 'nba', label: 'NBA', desc: 'Basketball props' },
    { value: 'mlb', label: 'MLB', desc: 'Baseball props' },
    { value: 'nfl', label: 'NFL', desc: 'Football props' },
  ]

  return (
    <div className="p-6">
      <p className="text-sm font-semibold text-foreground mb-1">Pick a sport</p>
      <p className="text-xs text-muted-foreground mb-4">Select the sport for tonight&apos;s picks</p>
      <div className="grid grid-cols-3 gap-3">
        {sports.map(s => (
          <button
            key={s.value}
            onClick={() => onSelect(s.value)}
            className={`rounded-xl border-2 p-4 text-center transition-all ${
              selected === s.value
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-muted-foreground/30'
            }`}
          >
            <p className="text-lg font-bold text-foreground">{s.label}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{s.desc}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

function Step2Confidence({
  selected, onSelect,
}: {
  selected?: 'high' | 'medium' | 'any'
  onSelect: (c: 'high' | 'medium' | 'any') => void
}) {
  const levels = [
    { value: 'high' as const, label: 'High Only', desc: '6-7/7 convergence', color: 'text-emerald-400' },
    { value: 'medium' as const, label: 'Medium+', desc: '5+/7 convergence', color: 'text-amber-400' },
    { value: 'any' as const, label: 'All Props', desc: '3+/7 convergence', color: 'text-blue-400' },
  ]

  return (
    <div className="p-6">
      <p className="text-sm font-semibold text-foreground mb-1">Confidence filter</p>
      <p className="text-xs text-muted-foreground mb-4">Higher confidence = fewer but stronger picks</p>
      <div className="space-y-2">
        {levels.map(l => (
          <button
            key={l.value}
            onClick={() => onSelect(l.value)}
            className={`w-full rounded-lg border-2 px-4 py-3 text-left transition-all flex items-center justify-between ${
              selected === l.value
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-muted-foreground/30'
            }`}
          >
            <div>
              <p className="text-sm font-semibold text-foreground">{l.label}</p>
              <p className="text-xs text-muted-foreground">{l.desc}</p>
            </div>
            <Zap className={`h-4 w-4 ${l.color}`} />
          </button>
        ))}
      </div>
    </div>
  )
}

function Step3Props({
  props, selected, loading, onToggle,
}: {
  props: BetBuilderProp[]
  selected: BetBuilderProp[]
  loading: boolean
  onToggle: (p: BetBuilderProp) => void
}) {
  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-4">
      <p className="text-sm font-semibold text-foreground mb-1">Select your picks</p>
      <p className="text-xs text-muted-foreground mb-3">
        {props.length} available &middot; {selected.length} selected
      </p>

      {props.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">
          No props available matching your criteria. Try a lower confidence filter.
        </p>
      ) : (
        <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
          {props.map((prop, i) => {
            const isSelected = selected.some(
              s => s.playerId === prop.playerId && s.stat === prop.stat
            )
            return (
              <button
                key={`${prop.playerId}-${prop.stat}-${i}`}
                onClick={() => onToggle(prop)}
                className={`w-full rounded-lg border px-3 py-2.5 text-left transition-all flex items-center justify-between ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground/30'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ring-1 ${
                    prop.convergenceScore >= 6 ? 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30' :
                    prop.convergenceScore >= 5 ? 'bg-amber-500/15 text-amber-400 ring-amber-500/30' :
                    'bg-muted text-muted-foreground ring-border'
                  }`}>
                    {prop.convergenceScore}
                  </span>
                  <span className="text-xs font-medium text-foreground truncate">{prop.playerName}</span>
                  <span className="text-xs text-muted-foreground">{prop.team}</span>
                </div>
                <div className="flex items-center gap-2 text-xs flex-shrink-0">
                  <span className="text-muted-foreground">{prop.stat}</span>
                  <span className={`font-semibold ${
                    prop.direction === 'over' ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {prop.direction === 'over' ? 'O' : 'U'} {prop.line}
                  </span>
                  {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Step4Summary({ props }: { props: BetBuilderProp[] }) {
  const { totalOdds, payout, impliedProbability } = calculateParlayPayout(props)
  const { stacks, warnings } = suggestParlayGroups(props)

  return (
    <div className="p-6 space-y-4">
      <p className="text-sm font-semibold text-foreground mb-1">Parlay Summary</p>

      {/* Selected props */}
      <div className="space-y-1.5">
        {props.map((prop, i) => (
          <div key={i} className="flex items-center justify-between text-xs bg-muted/30 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">{prop.playerName}</span>
              <span className="text-muted-foreground">{prop.team}</span>
            </div>
            <span className={`font-semibold ${
              prop.direction === 'over' ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {prop.stat} {prop.direction === 'over' ? 'O' : 'U'} {prop.line}
            </span>
          </div>
        ))}
      </div>

      {/* Payout */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-[10px] text-muted-foreground">Legs</p>
            <p className="text-lg font-bold text-foreground">{props.length}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Odds</p>
            <p className="text-lg font-bold text-foreground">
              {totalOdds > 0 ? '+' : ''}{totalOdds}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">$10 Payout</p>
            <p className="text-lg font-bold text-emerald-400">
              <DollarSign className="h-4 w-4 inline" />{payout.toFixed(2)}
            </p>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          Implied probability: {(impliedProbability * 100).toFixed(1)}%
        </p>
      </div>

      {/* Stacks */}
      {stacks.length > 0 && (
        <div className="text-xs">
          <p className="font-medium text-foreground mb-1">Game Stacks</p>
          {stacks.map((stack, i) => (
            <p key={i} className="text-muted-foreground">
              {stack.map(p => p.playerName).join(' + ')} ({stack[0].team})
            </p>
          ))}
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-1">
          {warnings.map((w, i) => (
            <p key={i} className="text-xs text-amber-400 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 flex-shrink-0" />
              {w}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Play, Save, RotateCcw } from "lucide-react"
import { ConditionRow } from "./condition-row"
import type { FilterCondition, CustomFilter } from "@/types/edge-lab"
import type { Sport } from "@/types/shared"
import { getFieldsForSport } from "@/lib/filter-registry"

interface FilterBuilderProps {
  onRunBacktest?: (filter: Partial<CustomFilter>) => void
  onSave?: (filter: Partial<CustomFilter>) => void
  initialFilter?: Partial<CustomFilter>
}

export function FilterBuilder({ onRunBacktest, onSave, initialFilter }: FilterBuilderProps) {
  const [name, setName] = useState(initialFilter?.name ?? "")
  const [sport, setSport] = useState<Sport>(initialFilter?.sport ?? "nba")
  const [direction, setDirection] = useState<"over" | "under">(initialFilter?.direction ?? "over")
  const [conditions, setConditions] = useState<FilterCondition[]>(initialFilter?.conditions ?? [])

  const fields = getFieldsForSport(sport)

  const addCondition = useCallback(() => {
    const newCondition: FilterCondition = {
      id: `cond_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      field: "",
      operator: "gte",
      value: null,
    }
    setConditions(prev => [...prev, newCondition])
  }, [])

  const updateCondition = useCallback((id: string, updates: Partial<FilterCondition>) => {
    setConditions(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
  }, [])

  const removeCondition = useCallback((id: string) => {
    setConditions(prev => prev.filter(c => c.id !== id))
  }, [])

  const resetAll = useCallback(() => {
    setName("")
    setConditions([])
  }, [])

  const buildFilter = (): Partial<CustomFilter> => ({
    name,
    sport,
    direction,
    conditions,
  })

  const isValid = name.trim().length > 0 && conditions.length > 0 &&
    conditions.every(c => c.field && c.value !== null && c.value !== undefined)

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Filter Builder</h2>
        <Button variant="ghost" size="sm" onClick={resetAll} className="text-xs">
          <RotateCcw className="h-3 w-3 mr-1" />
          Reset
        </Button>
      </div>

      {/* Filter Meta */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Input
          placeholder="Filter name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="sm:col-span-1"
        />
        <Select value={sport} onValueChange={(v) => { setSport(v as Sport); setConditions([]) }}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="nba">NBA</SelectItem>
            <SelectItem value="mlb">MLB</SelectItem>
            <SelectItem value="nfl">NFL</SelectItem>
          </SelectContent>
        </Select>
        <Select value={direction} onValueChange={(v) => setDirection(v as "over" | "under")}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="over">Over</SelectItem>
            <SelectItem value="under">Under</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Conditions */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Conditions ({conditions.length})
          </p>
          <Button variant="outline" size="sm" onClick={addCondition} className="text-xs">
            <Plus className="h-3 w-3 mr-1" />
            Add Condition
          </Button>
        </div>

        {conditions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No conditions yet. Add conditions to define when your filter matches.
            </p>
            <Button variant="outline" size="sm" onClick={addCondition} className="mt-3 text-xs">
              <Plus className="h-3 w-3 mr-1" />
              Add First Condition
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {conditions.map((condition, i) => (
              <div key={condition.id}>
                {i > 0 && (
                  <p className="text-[10px] font-bold uppercase text-muted-foreground pl-2 py-1">AND</p>
                )}
                <ConditionRow
                  condition={condition}
                  fields={fields}
                  onUpdate={updateCondition}
                  onRemove={removeCondition}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 border-t border-border pt-4">
        {onRunBacktest && (
          <Button
            onClick={() => onRunBacktest(buildFilter())}
            disabled={!isValid}
            className="bg-[#2E75B6] hover:bg-[#2566a0] text-white"
          >
            <Play className="h-4 w-4 mr-1.5" />
            Run Backtest
          </Button>
        )}
        {onSave && (
          <Button
            variant="outline"
            onClick={() => onSave(buildFilter())}
            disabled={!isValid}
          >
            <Save className="h-4 w-4 mr-1.5" />
            Save Filter
          </Button>
        )}

        {isValid && (
          <p className="text-xs text-muted-foreground ml-auto">
            {conditions.length} condition{conditions.length !== 1 ? "s" : ""} · {sport.toUpperCase()} · {direction}
          </p>
        )}
      </div>
    </div>
  )
}

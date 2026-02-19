// ============================================================
// components/criteria/criteria-builder.tsx — Condition picker UI
// ============================================================
// Form for creating or editing research criteria. Users pick
// sport, stat, direction, and add conditions from the field registry.

"use client"

import { useState, useCallback } from "react"
import { Plus, Trash2, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CRITERIA_FIELDS } from "@/lib/criteria-pipeline"
import type { CriteriaCondition, CriteriaField } from "@/types/daily-checkin"
import type { Sport } from "@/types/shared"

interface CriteriaBuilderProps {
  onSave: (criteria: {
    name: string
    sport: string
    stat: string
    direction: 'over' | 'under'
    conditions: CriteriaCondition[]
  }) => void
  onCancel: () => void
  initial?: {
    name: string
    sport: string
    stat: string
    direction: 'over' | 'under'
    conditions: CriteriaCondition[]
  }
}

const STAT_OPTIONS: Record<Sport, string[]> = {
  nba: ['PTS', 'REB', 'AST', '3PM', 'STL', 'BLK', 'PRA'],
  mlb: ['H', 'HR', 'RBI', 'R', 'TB', 'SB', 'K'],
  nfl: ['PASS_YDS', 'PASS_TD', 'RUSH_YDS', 'REC_YDS', 'REC', 'INT'],
}

export function CriteriaBuilder({ onSave, onCancel, initial }: CriteriaBuilderProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [sport, setSport] = useState<Sport>((initial?.sport as Sport) ?? 'nba')
  const [stat, setStat] = useState(initial?.stat ?? 'PTS')
  const [direction, setDirection] = useState<'over' | 'under'>(initial?.direction ?? 'over')
  const [conditions, setConditions] = useState<CriteriaCondition[]>(initial?.conditions ?? [])

  const availableFields = CRITERIA_FIELDS.filter(
    f => f.category === 'general' || f.category === 'performance' || f.category === 'matchup' ||
         (f.category === 'mlb' && sport === 'mlb') ||
         (f.category === 'nfl' && sport === 'nfl')
  )

  const addCondition = useCallback(() => {
    const firstAvailable = availableFields.find(
      f => !conditions.some(c => c.field === f.field)
    )
    if (!firstAvailable) return

    setConditions(prev => [
      ...prev,
      {
        field: firstAvailable.field,
        operator: firstAvailable.type === 'boolean' ? 'eq' : 'gte',
        value: firstAvailable.type === 'boolean' ? true :
               firstAvailable.type === 'select' ? firstAvailable.options?.[0]?.value ?? '' :
               firstAvailable.min ?? 0,
      },
    ])
  }, [availableFields, conditions])

  const updateCondition = useCallback((index: number, updates: Partial<CriteriaCondition>) => {
    setConditions(prev => prev.map((c, i) => i === index ? { ...c, ...updates } : c))
  }, [])

  const removeCondition = useCallback((index: number) => {
    setConditions(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handleSubmit = () => {
    if (!name.trim() || !stat || conditions.length === 0) return
    onSave({ name: name.trim(), sport, stat, direction, conditions })
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <p className="text-sm font-semibold text-foreground">
          {initial ? 'Edit Criteria' : 'New Research Criteria'}
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Name */}
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Elite Home Favorites"
            className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50"
          />
        </div>

        {/* Sport / Stat / Direction row */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Sport</label>
            <select
              value={sport}
              onChange={e => { setSport(e.target.value as Sport); setStat(STAT_OPTIONS[e.target.value as Sport][0]) }}
              className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground"
            >
              <option value="nba">NBA</option>
              <option value="mlb">MLB</option>
              <option value="nfl">NFL</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Stat</label>
            <select
              value={stat}
              onChange={e => setStat(e.target.value)}
              className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground"
            >
              {STAT_OPTIONS[sport].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Direction</label>
            <select
              value={direction}
              onChange={e => setDirection(e.target.value as 'over' | 'under')}
              className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground"
            >
              <option value="over">Over</option>
              <option value="under">Under</option>
            </select>
          </div>
        </div>

        {/* Conditions */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-muted-foreground">
              Conditions ({conditions.length})
            </label>
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1"
              onClick={addCondition}
              disabled={conditions.length >= availableFields.length}
            >
              <Plus className="h-3 w-3" />
              Add
            </Button>
          </div>

          {conditions.length === 0 ? (
            <p className="text-xs text-muted-foreground/60 text-center py-4">
              Add at least one condition to define when this criteria triggers
            </p>
          ) : (
            <div className="space-y-2">
              {conditions.map((cond, i) => (
                <ConditionRow
                  key={i}
                  condition={cond}
                  availableFields={availableFields}
                  onChange={updates => updateCondition(i, updates)}
                  onRemove={() => removeCondition(i)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-border bg-muted/20 flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel} className="gap-1 text-xs">
          <X className="h-3 w-3" />
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!name.trim() || conditions.length === 0}
          className="gap-1 text-xs"
        >
          <Save className="h-3 w-3" />
          Save Criteria
        </Button>
      </div>
    </div>
  )
}

function ConditionRow({
  condition,
  availableFields,
  onChange,
  onRemove,
}: {
  condition: CriteriaCondition
  availableFields: typeof CRITERIA_FIELDS
  onChange: (updates: Partial<CriteriaCondition>) => void
  onRemove: () => void
}) {
  const fieldMeta = CRITERIA_FIELDS.find(f => f.field === condition.field)

  const operators = fieldMeta?.type === 'boolean'
    ? [{ label: '=', value: 'eq' }]
    : fieldMeta?.type === 'select'
    ? [{ label: '=', value: 'eq' }, { label: 'in', value: 'in' }]
    : [
        { label: '>=', value: 'gte' },
        { label: '<=', value: 'lte' },
        { label: '>', value: 'gt' },
        { label: '<', value: 'lt' },
        { label: '=', value: 'eq' },
        { label: 'between', value: 'between' },
      ]

  return (
    <div className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2">
      {/* Field selector */}
      <select
        value={condition.field}
        onChange={e => onChange({ field: e.target.value as CriteriaField })}
        className="text-xs bg-background border border-border rounded px-2 py-1 text-foreground flex-1 min-w-0"
      >
        {availableFields.map(f => (
          <option key={f.field} value={f.field}>{f.label}</option>
        ))}
      </select>

      {/* Operator */}
      <select
        value={condition.operator}
        onChange={e => onChange({ operator: e.target.value as CriteriaCondition['operator'] })}
        className="text-xs bg-background border border-border rounded px-2 py-1 text-foreground w-20"
      >
        {operators.map(op => (
          <option key={op.value} value={op.value}>{op.label}</option>
        ))}
      </select>

      {/* Value input */}
      {fieldMeta?.type === 'boolean' ? (
        <select
          value={condition.value?.toString()}
          onChange={e => onChange({ value: e.target.value === 'true' })}
          className="text-xs bg-background border border-border rounded px-2 py-1 text-foreground w-20"
        >
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      ) : fieldMeta?.type === 'select' ? (
        <select
          value={condition.value}
          onChange={e => onChange({ value: e.target.value })}
          className="text-xs bg-background border border-border rounded px-2 py-1 text-foreground w-24"
        >
          {fieldMeta.options?.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : (
        <input
          type="number"
          value={condition.value ?? 0}
          onChange={e => onChange({ value: Number(e.target.value) })}
          min={fieldMeta?.min}
          max={fieldMeta?.max}
          className="text-xs bg-background border border-border rounded px-2 py-1 text-foreground w-20"
        />
      )}

      {/* Remove */}
      <button onClick={onRemove} className="text-muted-foreground hover:text-red-400 transition-colors">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

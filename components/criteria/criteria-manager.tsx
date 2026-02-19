// ============================================================
// components/criteria/criteria-manager.tsx — List/manage criteria
// ============================================================
// Shows all user criteria with performance stats, toggle active,
// and delete. Connects to the criteria API.

"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Search, ToggleLeft, ToggleRight, Trash2, Edit2,
  Plus, TrendingUp, Target, AlertCircle, Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { CriteriaBuilder } from "./criteria-builder"
import type { ResearchCriteria, CriteriaCondition } from "@/types/daily-checkin"
import { CRITERIA_FIELDS } from "@/lib/criteria-pipeline"

export function CriteriaManager() {
  const [criteria, setCriteria] = useState<ResearchCriteria[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showBuilder, setShowBuilder] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const fetchCriteria = useCallback(async () => {
    try {
      const res = await fetch('/api/criteria')
      if (!res.ok) throw new Error('Failed to load')
      const json = await res.json()
      setCriteria(json.criteria ?? [])
    } catch {
      setError('Failed to load criteria')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCriteria()
  }, [fetchCriteria])

  const handleCreate = async (data: {
    name: string; sport: string; stat: string;
    direction: 'over' | 'under'; conditions: CriteriaCondition[]
  }) => {
    try {
      const res = await fetch('/api/criteria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error ?? 'Failed to create')
        return
      }
      setShowBuilder(false)
      fetchCriteria()
    } catch {
      setError('Failed to create criteria')
    }
  }

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await fetch('/api/criteria', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !isActive }),
      })
      setCriteria(prev => prev.map(c =>
        c.id === id ? { ...c, isActive: !c.isActive } : c
      ))
    } catch {
      setError('Failed to toggle')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/criteria?id=${id}`, { method: 'DELETE' })
      setCriteria(prev => prev.filter(c => c.id !== id))
    } catch {
      setError('Failed to delete')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  if (showBuilder) {
    const editing = editingId ? criteria.find(c => c.id === editingId) : undefined
    return (
      <CriteriaBuilder
        onSave={handleCreate}
        onCancel={() => { setShowBuilder(false); setEditingId(null) }}
        initial={editing ? {
          name: editing.name,
          sport: editing.sport,
          stat: editing.stat,
          direction: editing.direction,
          conditions: editing.conditions,
        } : undefined}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            My Research Criteria
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Set conditions to get alerted when props match your research
          </p>
        </div>
        <Button
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => { setEditingId(null); setShowBuilder(true) }}
        >
          <Plus className="h-3.5 w-3.5" />
          New Criteria
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs text-red-400 flex items-center gap-2">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-400/60 hover:text-red-400">dismiss</button>
        </div>
      )}

      {/* Empty state */}
      {criteria.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <Search className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">No criteria yet</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Create research criteria to get alerted when props match your conditions
          </p>
          <Button size="sm" onClick={() => setShowBuilder(true)} className="gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" />
            Create First Criteria
          </Button>
        </div>
      )}

      {/* Criteria list */}
      <div className="space-y-3">
        {criteria.map(c => (
          <CriteriaCard
            key={c.id}
            criteria={c}
            onToggle={() => handleToggle(c.id, c.isActive)}
            onDelete={() => handleDelete(c.id)}
            onEdit={() => { setEditingId(c.id); setShowBuilder(true) }}
          />
        ))}
      </div>
    </div>
  )
}

function CriteriaCard({
  criteria, onToggle, onDelete, onEdit,
}: {
  criteria: ResearchCriteria
  onToggle: () => void
  onDelete: () => void
  onEdit: () => void
}) {
  const { performance } = criteria

  return (
    <div className={`rounded-xl border bg-card overflow-hidden transition-opacity ${
      criteria.isActive ? 'border-border' : 'border-border/50 opacity-60'
    }`}>
      <div className="px-4 py-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground truncate">{criteria.name}</p>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
              {criteria.sport.toUpperCase()}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
              criteria.direction === 'over'
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-red-500/10 text-red-400'
            }`}>
              {criteria.stat} {criteria.direction.toUpperCase()}
            </span>
          </div>

          {/* Conditions summary */}
          <div className="flex flex-wrap gap-1 mt-1.5">
            {criteria.conditions.map((cond, i) => {
              const label = CRITERIA_FIELDS.find(f => f.field === cond.field)?.label ?? cond.field
              return (
                <span key={i} className="text-[10px] bg-muted/50 px-1.5 py-0.5 rounded text-muted-foreground">
                  {label} {cond.operator} {JSON.stringify(cond.value)}
                </span>
              )
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button onClick={onEdit} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button onClick={onToggle} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
            {criteria.isActive ? (
              <ToggleRight className="h-4 w-4 text-primary" />
            ) : (
              <ToggleLeft className="h-4 w-4" />
            )}
          </button>
          <button onClick={onDelete} className="p-1 text-muted-foreground hover:text-red-400 transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Performance stats */}
      {performance.totalMatches > 0 && (
        <div className="px-4 py-2 border-t border-border bg-muted/20 flex items-center gap-4 text-[10px]">
          <span className="text-muted-foreground">
            <TrendingUp className="h-3 w-3 inline mr-0.5" />
            {performance.totalMatches} matches
          </span>
          <span className={performance.hitRate >= 0.55 ? 'text-emerald-400' : performance.hitRate >= 0.45 ? 'text-amber-400' : 'text-red-400'}>
            {(performance.hitRate * 100).toFixed(0)}% hit rate
          </span>
          <span className={performance.avgMargin > 0 ? 'text-emerald-400' : 'text-red-400'}>
            {performance.avgMargin > 0 ? '+' : ''}{performance.avgMargin.toFixed(1)} avg margin
          </span>
          {performance.lastMatchDate && (
            <span className="text-muted-foreground/60 ml-auto">
              Last: {new Date(performance.lastMatchDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

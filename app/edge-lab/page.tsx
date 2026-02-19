"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FilterBuilder } from "@/components/edge-lab/filter-builder"
import { BacktestPanel } from "@/components/edge-lab/backtest-panel"
import { DashboardShell } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Beaker, Lightbulb } from "lucide-react"
import type { CustomFilter, BacktestResult, FilterCondition } from "@/types/edge-lab"
import type { Sport } from "@/types/shared"

// Quick-start templates to lower entry friction
const TEMPLATES: {
  name: string
  sport: Sport
  direction: "over" | "under"
  label: string
  conditions: { field: string; operator: string; value: number }[]
}[] = [
  {
    name: "Rested at Home Overs",
    sport: "nba",
    direction: "over",
    label: "NBA: Home + 2+ rest days",
    conditions: [
      { field: "rest_days", operator: "gte", value: 2 },
      { field: "is_home", operator: "eq", value: 1 },
    ],
  },
  {
    name: "Hot Streak Overs",
    sport: "nba",
    direction: "over",
    label: "NBA: L5 hit rate > 70%",
    conditions: [{ field: "hit_rate_l5", operator: "gte", value: 0.7 }],
  },
  {
    name: "Weak Defense Matchup",
    sport: "nba",
    direction: "over",
    label: "NBA: Opp defense rank 21+",
    conditions: [{ field: "opp_def_rank", operator: "gte", value: 21 }],
  },
  {
    name: "B2B Unders",
    sport: "nba",
    direction: "under",
    label: "NBA: Back-to-back + cold",
    conditions: [
      { field: "is_b2b", operator: "eq", value: 1 },
      { field: "hit_rate_l5", operator: "lte", value: 0.4 },
    ],
  },
]

export default function EdgeLabPage() {
  const [activeTab, setActiveTab] = useState("builder")
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null)
  const [isBacktesting, setIsBacktesting] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<typeof TEMPLATES[number] | null>(null)

  const handleRunBacktest = async (filter: Partial<CustomFilter>) => {
    setIsBacktesting(true)
    setActiveTab("results")

    try {
      // TODO: Wire to /api/filters/backtest endpoint
      void filter
    } catch (error) {
      console.error("Backtest failed:", error)
    } finally {
      setIsBacktesting(false)
    }
  }

  const handleSaveFilter = async (filter: Partial<CustomFilter>) => {
    try {
      // TODO: Wire to /api/filters CRUD endpoint
      void filter
    } catch (error) {
      console.error("Save failed:", error)
    }
  }

  const templateToFilter = (t: typeof TEMPLATES[number]): Partial<CustomFilter> => ({
    name: t.name,
    sport: t.sport,
    direction: t.direction,
    conditions: t.conditions.map((c, i) => ({
      id: `tpl_${i}`,
      field: c.field,
      operator: c.operator,
      value: c.value,
    })) as FilterCondition[],
  })

  return (
    <DashboardShell subtitle="Custom filters & strategy builder">
      <div>
        <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
              <Beaker className="h-6 w-6 text-[#2E75B6]" />
              Edge Lab
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Build filters, test against history, and find patterns that give you an edge.
            </p>
          </div>

          {/* Quick-start templates */}
          <div className="mb-6 rounded-xl border border-border bg-card/50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-4 w-4 text-amber-400" />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Quick Start &mdash; Try a template
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map((t, i) => (
                <Button
                  key={i}
                  variant={selectedTemplate?.name === t.name ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    setSelectedTemplate(t)
                    setActiveTab("builder")
                  }}
                >
                  {t.label}
                </Button>
              ))}
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="builder">Build Filter</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
            </TabsList>

            {/* Filter Builder Tab */}
            <TabsContent value="builder">
              <FilterBuilder
                onRunBacktest={handleRunBacktest}
                onSave={handleSaveFilter}
                initialFilter={selectedTemplate ? templateToFilter(selectedTemplate) : undefined}
                key={selectedTemplate?.name ?? "default"}
              />
            </TabsContent>

            {/* Backtest Results Tab */}
            <TabsContent value="results">
              {isBacktesting ? (
                <div className="space-y-4">
                  <div className="h-24 rounded-xl bg-muted animate-pulse" />
                  <div className="h-48 rounded-xl bg-muted animate-pulse" />
                </div>
              ) : backtestResult ? (
                <BacktestPanel result={backtestResult} />
              ) : (
                <div className="rounded-xl border border-dashed border-border p-12 text-center">
                  <Beaker className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Build a filter and run a backtest to see results here.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 text-xs"
                    onClick={() => setActiveTab("builder")}
                  >
                    Go to Filter Builder
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardShell>
  )
}

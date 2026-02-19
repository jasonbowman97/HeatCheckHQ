"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FilterBuilder } from "@/components/edge-lab/filter-builder"
import { BacktestPanel } from "@/components/edge-lab/backtest-panel"
import { DashboardShell } from "@/components/dashboard-shell"
import type { CustomFilter, BacktestResult } from "@/types/edge-lab"

export default function EdgeLabPage() {
  const [activeTab, setActiveTab] = useState("builder")
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null)
  const [isBacktesting, setIsBacktesting] = useState(false)

  const handleRunBacktest = async (filter: Partial<CustomFilter>) => {
    setIsBacktesting(true)
    setActiveTab("results")

    try {
      // TODO: Wire to /api/filters/backtest endpoint
      // For now, the backtest engine runs client-side as a demo
      // In production, this would POST to the server with the filter
      // and receive BacktestResult
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

  return (
    <DashboardShell subtitle="Custom filters & strategy builder">
    <div>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">The Edge Lab</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Build custom filters, backtest against historical data, and find your edge
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="builder">Filter Builder</TabsTrigger>
            <TabsTrigger value="results">Backtest Results</TabsTrigger>
            <TabsTrigger value="tonight">Tonight&apos;s Matches</TabsTrigger>
            <TabsTrigger value="saved">Saved Filters</TabsTrigger>
          </TabsList>

          {/* Filter Builder Tab */}
          <TabsContent value="builder">
            <FilterBuilder
              onRunBacktest={handleRunBacktest}
              onSave={handleSaveFilter}
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
                <p className="text-sm text-muted-foreground">
                  Build a filter and run a backtest to see results here.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Tonight's Matches Tab */}
          <TabsContent value="tonight">
            <div className="rounded-xl border border-dashed border-border p-12 text-center">
              <p className="text-sm text-muted-foreground">
                Matches from your active filters for tonight&apos;s games will appear here.
              </p>
            </div>
          </TabsContent>

          {/* Saved Filters Tab */}
          <TabsContent value="saved">
            <div className="rounded-xl border border-dashed border-border p-12 text-center">
              <p className="text-sm text-muted-foreground">
                Your saved filters will appear here. Create and save a filter to get started.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </DashboardShell>
  )
}
